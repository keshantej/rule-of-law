from __future__ import annotations

import json
import logging
import os
from dataclasses import dataclass
from typing import Any

import requests
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from pipelines.settings import RoutingConfig


LOGGER = logging.getLogger(__name__)


@dataclass
class ModelResult:
    content: str
    raw_response: dict[str, Any] | None = None


class BaseModelClient:
    def __init__(self, name: str, config: dict[str, Any], defaults: dict[str, Any]) -> None:
        self.name = name
        self.config = config
        self.defaults = defaults

    def is_available(self) -> bool:
        raise NotImplementedError

    def generate_text(self, system_prompt: str, user_prompt: str) -> ModelResult:
        raise NotImplementedError

    def generate_json(self, system_prompt: str, user_prompt: str) -> dict[str, Any] | None:
        result = self.generate_text(system_prompt, user_prompt)
        try:
            content = result.content.strip()
            if content.startswith("```"):
                content = content.split("\n", 1)[1]
                content = content.rsplit("```", 1)[0]
            return json.loads(content)
        except json.JSONDecodeError:
            LOGGER.warning("Model %s returned non-JSON content.", self.name)
            return None


class OpenAICompatibleClient(BaseModelClient):
    def __init__(self, name: str, config: dict[str, Any], defaults: dict[str, Any]) -> None:
        super().__init__(name, config, defaults)
        self.base_url = (config.get("base_url") or "").rstrip("/")
        self.model = config.get("model")
        api_key_env = config.get("api_key_env")
        self.requires_api_key = bool(config.get("requires_api_key", False))
        self.api_key = os.getenv(api_key_env, "") if api_key_env else ""

    def is_available(self) -> bool:
        if self.requires_api_key and not self.api_key:
            return False
        return bool(self.base_url and self.model)

    def _request_chat_completion(self, payload: dict[str, Any]) -> dict[str, Any]:
        url = f"{self.base_url}/chat/completions"
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        response = requests.post(
            url,
            headers=headers,
            json=payload,
            timeout=self.defaults.get("request_timeout_seconds", 180),
        )
        response.raise_for_status()
        return response.json()

    @retry(
        reraise=True,
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=8),
        retry=retry_if_exception_type(requests.RequestException),
    )
    def generate_text(self, system_prompt: str, user_prompt: str) -> ModelResult:
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": self.config.get("temperature", self.defaults.get("temperature", 0.1)),
            "max_tokens": self.config.get("max_tokens", self.defaults.get("max_tokens", 2000)),
        }
        data = self._request_chat_completion(payload)
        content = data["choices"][0]["message"]["content"]
        return ModelResult(content=content, raw_response=data)

    @retry(
        reraise=True,
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=8),
        retry=retry_if_exception_type(requests.RequestException),
    )
    def generate_json(self, system_prompt: str, user_prompt: str) -> dict[str, Any] | None:
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": self.config.get("temperature", self.defaults.get("temperature", 0.1)),
            "max_tokens": self.config.get("max_tokens", self.defaults.get("max_tokens", 2000)),
            "response_format": {"type": "json_object"},
        }
        try:
            data = self._request_chat_completion(payload)
            content = data["choices"][0]["message"]["content"]
            return json.loads(content)
        except requests.HTTPError as exc:
            response = exc.response
            if response is not None and response.status_code == 400:
                LOGGER.warning("Client %s rejected response_format json_object; retrying without it.", self.name)
                return super().generate_json(system_prompt, user_prompt)
            raise
        except json.JSONDecodeError:
            LOGGER.warning("Model %s returned invalid JSON content despite json_object mode.", self.name)
            return None


class LocalLLMClient(OpenAICompatibleClient):
    pass


class APIModelClient(OpenAICompatibleClient):
    pass


class MockModelClient(BaseModelClient):
    def is_available(self) -> bool:
        return True

    def generate_text(self, system_prompt: str, user_prompt: str) -> ModelResult:
        content = json.dumps(
            {
                "mock_fallback": True,
                "message": "No live model call was performed. Use deterministic fallback output.",
                "system_prompt_excerpt": system_prompt[:200],
                "user_prompt_excerpt": user_prompt[:400],
            }
        )
        return ModelResult(content=content, raw_response=None)


CLIENT_CLASS_MAP = {
    "LocalLLMClient": LocalLLMClient,
    "APIModelClient": APIModelClient,
    "MockModelClient": MockModelClient,
}


class ModelRouter:
    def __init__(self, routing: RoutingConfig) -> None:
        self.routing = routing
        self._clients: dict[str, BaseModelClient] = {}

    def get_client(self, client_name: str) -> BaseModelClient:
        if client_name in self._clients:
            return self._clients[client_name]
        config = self.routing.clients[client_name]
        klass = CLIENT_CLASS_MAP[config["client_class"]]
        client = klass(client_name, config, self.routing.defaults)
        self._clients[client_name] = client
        return client

    def is_route_live(self, route_name: str) -> bool:
        for client in self._candidate_clients(route_name):
            if client.is_available() and not isinstance(client, MockModelClient):
                return True
        return False

    def _candidate_clients(self, route_name: str) -> list[BaseModelClient]:
        route = self.routing.routes[route_name]
        names = [route["client"], *route.get("fallback_clients", [])]
        return [self.get_client(name) for name in names]

    def try_generate_json(self, route_name: str, system_prompt: str, user_prompt: str) -> dict[str, Any] | None:
        for client in self._candidate_clients(route_name):
            if isinstance(client, MockModelClient) or not client.is_available():
                continue
            try:
                return client.generate_json(system_prompt, user_prompt)
            except Exception as exc:  # noqa: BLE001
                LOGGER.warning("Route %s failed via %s: %s", route_name, client.name, exc)
        LOGGER.info("Route %s is using deterministic fallback.", route_name)
        return None

    def try_generate_text(self, route_name: str, system_prompt: str, user_prompt: str) -> str | None:
        for client in self._candidate_clients(route_name):
            if isinstance(client, MockModelClient) or not client.is_available():
                continue
            try:
                return client.generate_text(system_prompt, user_prompt).content
            except Exception as exc:  # noqa: BLE001
                LOGGER.warning("Route %s failed via %s: %s", route_name, client.name, exc)
        LOGGER.info("Route %s is using deterministic fallback.", route_name)
        return None
