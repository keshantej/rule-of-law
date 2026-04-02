from __future__ import annotations

import json
import logging
import os
import re
from collections import Counter
from datetime import UTC, datetime
from hashlib import sha1
from pathlib import Path
from typing import Any, Iterable

import yaml


LOGGER_FORMAT = "%(asctime)s | %(levelname)s | %(name)s | %(message)s"


def configure_logging(log_dir: Path, run_id: str) -> Path:
    log_dir.mkdir(parents=True, exist_ok=True)
    log_path = log_dir / f"{run_id}.log"
    logging.basicConfig(
        level=logging.INFO,
        format=LOGGER_FORMAT,
        handlers=[
            logging.FileHandler(log_path, encoding="utf-8"),
            logging.StreamHandler(),
        ],
        force=True,
    )
    return log_path


def utc_now() -> datetime:
    return datetime.now(UTC)


def utc_now_iso() -> str:
    return utc_now().replace(microsecond=0).isoformat()


def ensure_dir(path: Path) -> Path:
    path.mkdir(parents=True, exist_ok=True)
    return path


def load_yaml(path: Path) -> dict[str, Any]:
    return yaml.safe_load(path.read_text(encoding="utf-8")) or {}


def dump_yaml(path: Path, payload: Any) -> None:
    ensure_dir(path.parent)
    path.write_text(yaml.safe_dump(payload, sort_keys=False), encoding="utf-8")


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def dump_text(path: Path, text: str) -> None:
    ensure_dir(path.parent)
    path.write_text(text, encoding="utf-8")


def dump_json(path: Path, payload: Any) -> None:
    ensure_dir(path.parent)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")


def dump_jsonl(path: Path, rows: Iterable[dict[str, Any]]) -> None:
    ensure_dir(path.parent)
    with path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def normalize_whitespace(text: str) -> str:
    replacements = {
        "â€¢": "-",
        "â€œ": '"',
        "â€": '"',
        "â€˜": "'",
        "â€™": "'",
        "â€“": "-",
        "â€”": "-",
        "â\x80\x93": "-",
        "â\x80\x94": "-",
        "â\x80\x98": "'",
        "â\x80\x99": "'",
        "â\x80\x9c": '"',
        "â\x80\x9d": '"',
        "â\x8f±": "",
    }
    text = text.replace("\x00", " ")
    text = re.sub(r"[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]", " ", text)
    for source, target in replacements.items():
        text = text.replace(source, target)
    text = text.replace("\u2013", "-").replace("\u2014", "-").replace("\u2019", "'")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def strip_structural_noise(text: str) -> str:
    noise_patterns = [
        r"^ARIZONA RULE OF LAW$",
        r"^AMBASSADOR PROGRAM$",
        r"^Speaker Script Guide$",
        r"^Prepared for .+$",
        r"^March 20\d\d$",
        r"^Presentation Formats$",
        r"^Format Duration Slides Notes$",
        r"^Condensed .+$",
        r"^Standard .+$",
        r"^Interactive .+$",
        r"^General Delivery Principles$",
        r"^How to Use This Guide$",
        r"^KEY MESSAGE .+$",
        r"^SLIDE \d+ .+$",
        r"^\d+\s+minutes?$",
    ]
    cleaned_lines = []
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped:
            cleaned_lines.append("")
            continue
        if any(re.match(pattern, stripped, re.IGNORECASE) for pattern in noise_patterns):
            continue
        cleaned_lines.append(stripped)
    cleaned = "\n".join(cleaned_lines)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned.strip()


def slugify(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-") or "item"


def stable_id(*parts: str, prefix: str | None = None, length: int = 12) -> str:
    raw = "::".join(parts)
    digest = sha1(raw.encode("utf-8")).hexdigest()[:length]
    return f"{prefix}_{digest}" if prefix else digest


def sentence_split(text: str) -> list[str]:
    text = normalize_whitespace(text)
    if not text:
        return []
    bits = re.split(r"(?<=[.!?])\s+(?=[A-Z0-9\"'])", text)
    return [bit.strip() for bit in bits if bit.strip()]


def word_count(text: str) -> int:
    return len(re.findall(r"\b[\w'-]+\b", text))


def split_paragraphs(text: str) -> list[str]:
    text = normalize_whitespace(text)
    if not text:
        return []
    return [part.strip() for part in re.split(r"\n\s*\n", text) if part.strip()]


def choose_top_sentences(text: str, limit: int = 3) -> list[str]:
    sentences = sentence_split(text)
    if not sentences:
        return []
    scored = []
    for sentence in sentences:
        score = min(word_count(sentence), 40)
        lower = sentence.lower()
        if "rule of law" in lower:
            score += 8
        if any(token in lower for token in ("arizona", "lawyer", "justice", "citizen")):
            score += 3
        scored.append((score, sentence))
    scored.sort(key=lambda item: item[0], reverse=True)
    ordered = []
    seen: set[str] = set()
    for _, sentence in scored:
        if sentence not in seen:
            ordered.append(sentence)
            seen.add(sentence)
        if len(ordered) >= limit:
            break
    return ordered


def expand_env_value(value: Any) -> Any:
    if not isinstance(value, str):
        return value
    pattern = re.compile(r"\$\{([^}:]+)(:-([^}]+))?\}")

    def replacer(match: re.Match[str]) -> str:
        name = match.group(1)
        fallback = match.group(3) or ""
        return os.getenv(name, fallback)

    return pattern.sub(replacer, value)


def expand_env_tree(payload: Any) -> Any:
    if isinstance(payload, dict):
        return {key: expand_env_tree(value) for key, value in payload.items()}
    if isinstance(payload, list):
        return [expand_env_tree(item) for item in payload]
    return expand_env_value(payload)


def markdown_header(level: int, text: str) -> str:
    return f"{'#' * level} {text}\n"


def markdown_bullets(items: Iterable[str]) -> str:
    return "\n".join(f"- {item}" for item in items if item)


def join_not_empty(parts: Iterable[str], separator: str = "\n\n") -> str:
    return separator.join(part for part in parts if part)


def approx_page_count_from_words(words: int, words_per_page: int = 350) -> int:
    if words <= 0:
        return 0
    return max(1, round(words / words_per_page))
