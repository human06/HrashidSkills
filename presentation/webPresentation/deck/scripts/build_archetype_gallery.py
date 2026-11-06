#!/usr/bin/env python3
"""Build the offline gallery of decision, walkthrough and reporting archetypes."""
import argparse
from pathlib import Path

from build_deck import ASSETS, build

ARCHETYPES = (
    "option-grid", "scorecard", "matrix", "process", "roadmap",
    "kpi", "table", "bridge", "multiples", "diagram-walkthrough", "screenshot-tour",
)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", nargs="?", type=Path, default=ASSETS / "archetype-gallery.html")
    parser.add_argument("--design", default="base", help="Bundled design ID")
    args = parser.parse_args()
    directory = ASSETS.parent / "archetypes"
    appendix = (ASSETS / "sources/qa-appendix.html").read_text(encoding="utf-8")
    frames = "\n".join((directory / f"{name}.html").read_text(encoding="utf-8") for name in ARCHETYPES)
    frames += "\n" + appendix
    html = build(frames, {
        "id": "deck-archetype-gallery",
        "title": "Decision and walkthrough archetypes",
        "acts": [{"k": "Gallery", "t": "Archetypes"}],
        "brand": {"name": "Deck", "label": "Archetype gallery"},
        "palette": args.design,
        "talk": {"qa": [
            {"question": "What does the pilot review depend on?", "answer": "Show the two inputs to the review.", "goto": "pilot-dependencies"},
            {"question": "How are the team trends compared?", "answer": "Show the shared measure and scale.", "goto": "comparison-method"},
        ]},
    })
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(html, encoding="utf-8")
    print(f"Built {args.output} ({len(ARCHETYPES)} main frames and a Q&A appendix)")


if __name__ == "__main__":
    main()
