# Editing a deck

For changes to an existing deck: adding, removing or moving frames, reordering steps, rewording, restyling.

For a design-only change, prefer `scripts/apply_design.py source.html output.html --design <id>` (see SKILL.md). It verifies compatible motion functions, preserves frame markup, and keeps the current light/dark appearance unless `--mode` is supplied. A distinct output leaves the source untouched; in-place use creates a timestamped backup automatically. This path also retains the title sweep and blueprint color roles without a project-specific override. If the helper detects a custom/legacy engine or extra scripts, edit colors manually while retaining that engine and those scripts; do not silently rebuild them away.

1. **Back up before replacing an input.** Copy the file to `<name> - backup <yyyy-mm-dd-hhmm>.html` beside it. A new output copy leaves the original as the reference; the design helper backs up an in-place input itself.

2. **Locate.** Frame numbers the user says ("slide 9") are the HUD counter: the frame's position in `#world`, counting from 1. Confirm the frame's headline back to the user when the number could be off.

3. **Check the engine generation.** A deck whose HTML contains `<svg class="thread"` or `data-bounds` was made before the engine laid out its own furniture. For those, either:
   - **edit by hand**: also update the thread path, auras, act labels, minimap rects and viewBox, HUD act widths, `data-bounds`, frame `data-x`/`data-y` and ghost numbers whenever frames move; or
   - **migrate**: run `scripts/build_deck.py` against the original HTML with an explicit config for the acts, brand and finale. The builder retains frame markup, fixed positions, cameras and source-specific CSS, then regenerates furniture. Compare the result with the source before further edits. An explicit request to modernize or migrate the deck supplies authorization; otherwise ask before changing the engine generation.

4. **Edit.** Follow the frame contract in ENGINE.md:
   - New, moved or removed frames: move the `<section>` in the DOM. On the current engine, positions, numbering, thread, minimap and HUD follow by themselves.
   - Step changes: renumber `data-step`s from 0, keep `data-steps` equal to the highest step, and keep `data-cams` at `data-steps + 1` entries.
   - New act: add it to `deck-config.acts` (or legacy `data-acts`) and renumber `data-act` on every later frame.
   - Wording: change only what the user asked; the rest of the copy stays as written.

5. **Self-check** (SKILL.md step 5) on the edited frames, their neighbours, and the finale. Then report what changed and the backup's path.
