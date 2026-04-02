from __future__ import annotations

import argparse
from pathlib import Path

from pipelines.orchestrator import PipelineOrchestrator


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Arizona Rule of Law Ambassador pipeline")
    parser.add_argument("--root", default=".", help="Repository root")
    subparsers = parser.add_subparsers(dest="command", required=True)
    for command in ("ingest", "normalize", "canonicalize", "manual", "deck", "field-guide", "web-experience", "lms", "qa", "run-all"):
        subparsers.add_parser(command)
    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    orchestrator = PipelineOrchestrator(Path(args.root).resolve())
    if args.command == "ingest":
        orchestrator.run_ingest()
    elif args.command == "normalize":
        orchestrator.run_normalize()
    elif args.command == "canonicalize":
        orchestrator.run_canonicalize()
    elif args.command == "manual":
        orchestrator.run_manual()
    elif args.command == "deck":
        orchestrator.run_deck()
    elif args.command == "field-guide":
        orchestrator.run_field_guide()
    elif args.command == "web-experience":
        orchestrator.run_web_experience()
    elif args.command == "lms":
        orchestrator.run_lms()
    elif args.command == "qa":
        orchestrator.run_qa()
    elif args.command == "run-all":
        orchestrator.run_all()


if __name__ == "__main__":
    main()
