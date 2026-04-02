from __future__ import annotations

from pathlib import Path

from pipelines.orchestrator import PipelineOrchestrator


def main() -> None:
    orchestrator = PipelineOrchestrator(Path(".").resolve())
    orchestrator.run_qa()


if __name__ == "__main__":
    main()

