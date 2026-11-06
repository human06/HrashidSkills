# HrashidSkills

Claude Code skills by Hassan Rashid.

## presentation/webPresentation/deck

Cinematic, story-driven HTML presentations: one world, one camera, acts, and click-by-click build-ups, in a dark/light EPAM look. The skill interviews you for the story, gets a storyboard approved, builds a single offline HTML deck, and screenshot-checks every step in both themes.

**Install**

```bash
git clone https://github.com/human06/HrashidSkills.git
mkdir -p ~/.claude/skills
cp -R HrashidSkills/presentation/webPresentation/deck ~/.claude/skills/
```

Restart Claude Code, then ask for a presentation (or type `/deck`). For screenshot checks, use Node.js, `playwright-core` and Edge, Chrome or Chromium.

Start with `presentation/webPresentation/deck/SKILL.md`.


## Build or compare designs

The skill builds self-contained offline HTML from one shared runtime. It supports
Base, EPAM Official, EPAM AI, EPAM GitHub and Ahold Delhaize ONE AI color designs.

```bash
cd presentation/webPresentation/deck
python3 scripts/apply_design.py --list-designs
python3 scripts/apply_design.py assets/example.html example-epam.html --design epam-official
python3 scripts/compare_deck.py assets/example.html example-comparison.html
python3 scripts/test_build.py
```

The public edition contains the original EPAM title masks and shared fonts.
See [design assets](presentation/webPresentation/deck/THEME.md#design-assets)
for configuring local brand resources. The same `deck` folder can be installed
as a Codex skill.
