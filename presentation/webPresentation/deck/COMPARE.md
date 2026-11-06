# Compare designs

Build one shared story. Use its editable source or a compatible standalone HTML deck with `compare_deck.py`. It checks the frame markup and compatible motion functions, then embeds one copy of the story with its design registry in an English, offline viewer.

```bash
python3 <skill-dir>/scripts/compare_deck.py story.html story-comparison.html
python3 <skill-dir>/scripts/compare_deck.py story-source.html story-comparison.html --config story.json --design epam-official --design ah-one-ai
python3 <skill-dir>/scripts/compare_deck.py deck-design-comparison.html
```

- With no `--design`, every registered design is available. Repeat the flag to select and order two or more designs. The first two open side by side. Without flags, the deck's selected design opens first.
- Use **All selected designs** for a grid, or **Left detail** and **Right detail** for a closer look. Navigation synchronizes all previews. Use **Design defaults** to see each recommended appearance and **Dark for all** or **Light for all** to isolate color differences. **Static preview** holds the chosen camera position for inspection. **Live animations** uses the original transition and build timing.
- **Download HTML** exports a standalone deck with the pane's design and appearance as its defaults. It starts from the first frame and carries that design's logos, fonts and artwork, the full color registry and normal presenter controls.
- The third command builds a reusable viewer with an empty starting state. Use **Open deck** or **Open another deck** to load a standalone HTML built with deck 2.3 or later. For an older compatible deck, use the Python command with its source. If the command detects a custom engine or extra scripts, follow the manual compatibility guidance in [EDIT.md](EDIT.md).

The viewer displays the deck's `deck-config.title` under **Current deck**. Set `title` to the storyboard title when building a new story. Design names and appearances come from the deck's registry, including custom palettes. Story text stays in the language of the supplied deck. Embed story assets as data URLs so every preview works offline.

Use `compare_deck.py` for a comparison with artwork for every selected design. A standalone HTML opened in the viewer supplies only the artwork packaged with that deck. Rebuild decks from before design artwork was scoped with `compare_deck.py` to enable standalone downloads.

Check a title, a built frame, and a camera transition in the viewer. Verify that changing design or appearance keeps the position, that both panes advance from either preview, and that the exported HTML opens independently. Use the full screenshot workflow in [SKILL.md](SKILL.md) when creating a new story.
