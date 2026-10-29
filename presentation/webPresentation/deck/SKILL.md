---
name: deck
description: Cinematic story-driven HTML presentations: one world, one camera, acts, click-by-click build-ups. Use when the user wants a presentation, slides or a deck made, or wants to change a deck this skill made.
---

# Deck

A **deck** is one self-contained HTML file: every **frame** sits on one **world**, a camera travels between them, and the story is told in **acts**. Speak the vocabulary in [GLOSSARY.md](GLOSSARY.md) with the user.

Changing an existing deck (it has `<div id="world">`)? Follow [EDIT.md](EDIT.md) instead of the steps below.

## Create

1. **Brief.** Collect topic, audience, the one belief they should leave with, length in minutes, and presenters (names and titles), from the user's message or a markdown file they point at, in any shape. Done when each of the five is known or the user has said to skip it.

2. **Interview.** Ask what the brief leaves open, in rounds of multiple-choice questions (AskUserQuestion, up to 4 per call, your recommended option first and labelled "(Recommended)"). Draw from the question bank in [STORY.md](STORY.md); always settle the transition style (glide or swoop, see [ENGINE.md](ENGINE.md)). Done when you could write every frame's headline without guessing.

3. **Storyboard.** Write it in the format in [STORY.md](STORY.md), pick an archetype per frame from [ARCHETYPES.md](ARCHETYPES.md), and mark every specific you invented (numbers, product names, examples, quotes) with ⚑. Present it and revise until the user approves. The storyboard is approved before any HTML is written.

4. **Build.** Copy `assets/starter.html` to `<slug>.html` in the working directory, then build each frame: adapt the archetype snippet, or draw a bespoke frame with the motion primitives in [ENGINE.md](ENGINE.md), following the colour rules in [THEME.md](THEME.md). Fill in `data-acts`, the HUD brand line, the finale line and the credit. Done when every storyboard frame exists, every step reveals what the storyboard says, and each frame's last step lands its takeaway.

5. **Self-check.** Screenshot every step of every frame in both themes:
   ```
   mkdir -p ~/.cache/deck-check && cd ~/.cache/deck-check && (test -d node_modules/playwright-core || npm i playwright-core@1)
   node ~/.claude/skills/deck/scripts/shoot.js <deck.html> shots/<slug>
   ```
   Read every screenshot, and the script's problem list. Fix and re-shoot the affected frames until: no text overlaps, clips or runs off the frame; every step visibly changes the frame; light mode has no dark leftovers or unreadable text; zero console errors.

6. **Hand over.** Report the file path, frame and step counts, and every ⚑ still unconfirmed. Then offer the bespoke frames worth saving as archetypes; for each one the user accepts, follow "Adding an archetype" in [ARCHETYPES.md](ARCHETYPES.md).
