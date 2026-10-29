# Editing a deck

For changes to an existing deck: adding, removing or moving frames, reordering steps, rewording, restyling.

1. **Back up.** Copy the file to `<name> - backup <yyyy-mm-dd-hhmm>.html` beside it. Done when the copy exists.

2. **Locate.** Frame numbers the user says ("slide 9") are the HUD counter: the frame's position in `#world`, counting from 1. Confirm the frame's headline back to the user when the number could be off.

3. **Check the engine generation.** A deck whose HTML contains `<svg class="thread"` or `data-bounds` was made before the engine laid out its own furniture. For those, either:
   - **edit by hand**: also update the thread path, auras, act labels, minimap rects and viewBox, HUD act widths, `data-bounds`, frame `data-x`/`data-y` and ghost numbers whenever frames move; or
   - **migrate**: replace its `<script>` with the starter's, delete the static furniture, and confirm the result matches the old deck in screenshots before making the edit. Migrating needs the user's go-ahead, because it touches the whole file.

4. **Edit.** Follow the frame contract in ENGINE.md:
   - New, moved or removed frames: move the `<section>` in the DOM. On the current engine, positions, numbering, thread, minimap and HUD follow by themselves.
   - Step changes: renumber `data-step`s from 0, keep `data-steps` equal to the highest step, and keep `data-cams` at `data-steps + 1` entries.
   - New act: add it to `data-acts` and renumber `data-act` on every later frame.
   - Wording: change only what the user asked; the rest of the copy stays as written.

5. **Self-check** (SKILL.md step 5) on the edited frames, their neighbours, and the finale. Then report what changed and the backup's path.
