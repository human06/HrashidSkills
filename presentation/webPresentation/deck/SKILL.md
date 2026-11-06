---
name: deck
description: "Create, edit, restyle or compare cinematic HTML presentations across Base, EPAM, Ahold Delhaize ONE AI and custom designs. Use for offline HTML decks with a flying camera and step builds, including side-by-side design comparisons."
---

# Deck

A **deck** is one self-contained HTML file: every **frame** sits on one **world**, a camera travels between them, and the story is told in **acts**. Speak the vocabulary in [GLOSSARY.md](GLOSSARY.md) with the user.

Changing an existing deck (it has `<div id="world">`)? Follow [EDIT.md](EDIT.md) instead of the steps below.

## Choose a design

- **Base** (`base`): the original color scheme with an unbranded title.
- **EPAM Official** (`epam-official`): the EPAM mark, Presales palette and structural gradients.
- **EPAM AI** (`epam-ai`): the EPAM mark, AI-deck color roles and restrained ambient effects.
- **EPAM GitHub** (`epam-github`): the GitHub story’s navy cover, light content and monochrome EPAM mark.
- **Ahold Delhaize ONE AI** (`ah-one-ai`): the Corporate palette and a EuclidFlex font stack.

Use the design the user names. If they ask to choose, present the bundled options. For a new deck without a design preference, use `base`; for an edit, retain its existing design unless a change is requested. A talk about AI does not by itself select EPAM AI. Light/dark is a separate choice. Read [THEME.md](THEME.md) for the color rules.

Choose the design at build or export time to include its logos, type and artwork. The comparison viewer switches complete designs. The standalone palette switch uses the assets already in that HTML. See [THEME.md](THEME.md#design-assets) to add assets.

For a design-only change to an existing deck or editable source, run:
```
python3 <skill-dir>/scripts/apply_design.py <source.html> <output.html> --design epam-ai
```
This keeps the source appearance by default. Add `--mode palette` for the selected design's default appearance, or `--mode dark` / `--mode light` explicitly. Content, frame markup, camera targets and compatible runtime motion functions are checked before writing. An in-place output receives a backup. Custom engines or extra scripts need the manual-edit route in EDIT.md. The helper and all design assets ship with the skill; no project-specific script is needed.

## Compare designs

For an existing story, generate the English comparison directly from its deck. For a new story, author and approve one storyboard, then build one shared source and use it for every design. Run `python3 <skill-dir>/scripts/compare_deck.py <source.html> <story-comparison.html>`. Use repeated `--design <id>` flags if the user selects a subset or order. The viewer synchronizes frames and builds, runs offline and can open another compatible deck. See [COMPARE.md](COMPARE.md) for the commands and checks.

## Create

1. **Brief.** Collect topic, audience, the one belief they should leave with, length in minutes, and presenters (names and titles), from the user's message or a markdown file they point at, in any shape. Done when each of the five is known or the user has said to skip it.

2. **Interview.** Ask only what the brief leaves open, using the host's available question tool or concise chat questions. Draw from [STORY.md](STORY.md); settle the transition style (glide or swoop, see [ENGINE.md](ENGINE.md)). Reuse information the user already supplied.

3. **Storyboard.** Write it in the format in [STORY.md](STORY.md), pick an archetype per frame from [ARCHETYPES.md](ARCHETYPES.md), and mark every specific you invented (numbers, product names, examples, quotes) with ⚑. For a new story, agree on the storyboard before building. An approved existing deck already supplies its story; preserve it unless the user requests changes.

4. **Build.** Copy `assets/sources/starter.html` into the project as the editable source. Adapt the archetypes and motion primitives in [ENGINE.md](ENGINE.md). Apply the selected design and its color rules from THEME.md. Design assets adapt the shared compositions and camera. Keep the existing story and motion when applying a brand. Supply `deck-config` or a JSON config, then run `python3 <skill-dir>/scripts/build_deck.py <source.html> <slug.html> --config <config.json> [--design <id>]` (`--palette` is an alias). The generated output is a single offline HTML file with every registered palette embedded. The prebuilt `assets/starter.html` also works as a directly editable standalone deck. For notes, presenter mode, facts, charts and print, read [PRESENTING.md](PRESENTING.md).

5. **Self-check.** Screenshot every step of every frame in both themes:
   ```
   node <skill-dir>/scripts/shoot.js <deck.html> shots/<slug>
   ```
   Requires `playwright-core` and Chrome/Edge/Chromium; use an existing installation or install the dependency in a temporary check directory. Follow the current host's browser policy. Read the screenshots and JSON report. Check both themes, keyboard controls, overview, presenter and print. The runner accepts both `window.deck` and `window.__deck`. Report unavailable checks honestly.

   For palette or shared color changes, add `--palette all --static --modes` and review the palette matrix. For an ordinary deck, check its selected palette in both light/dark modes. `C` cycles palettes; `T` changes appearance without changing palette. Confirm switching preserves the current frame, build and camera.

   Verify source hex values on opaque graphic fills/strokes as well as registry tokens. Keep contrast variants in text-only `*-ink` tokens; do not lighten or darken the corporate graphic palette when changing light/dark mode.

6. **Hand over.** Report the file path, frame and step counts, and every ⚑ still unconfirmed. Then offer the bespoke frames worth saving as archetypes; for each one the user accepts, follow "Adding an archetype" in [ARCHETYPES.md](ARCHETYPES.md).
