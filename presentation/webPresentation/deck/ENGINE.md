# Engine

How a deck works: the file anatomy, the frame contract, steps, shots and motion. The engine is the `<script>` and `<style>` in `assets/starter.html`; each deck carries its own copy, and you may change it when the story needs something new (see "Changing the engine").

## Anatomy

```
#stage  data-acts='[{"k":"Prologue","t":"…"},{"k":"Act I","t":"The people"},…,{"k":"Epilogue","t":"Lights out"}]'
        data-transition="glide" | "swoop"
  #world            ← frames go here, in story order
    .dots, then <section class="frame …"> × N
  .finale           ← the closing line and credit shown on the finale
  .hud              ← brand line, "where" counter, act progress, minimap
.nav                ← back / next / theme buttons
```

The engine derives all world furniture from the frames: positions (when a frame has no `data-x`/`data-y`), the dotted thread, auras, act labels, minimap, HUD act segments, ghost numbers and the finale shot. Leave those out of the source; frame order in the DOM is the story order. Generated furniture uses `cd-` class names. Existing `.ghost` labels are retained and numbered.

## Shared sources and build

`assets/runtime.js` contains the shared engine, derived from cinematic-deck 1.2. `assets/heritage.css` preserves the original palette, motion primitives and all thirteen archetypes, including literal SVG light-theme remapping. `assets/components.css` adds the newer components; `assets/compatibility.css` resolves their overlap. Source-specific CSS is included before the heritage rules. `assets/palettes.json`, `palettes.css` and `palette-runtime.js` add independent corporate color selection; `scripts/palettes.py` validates the registry and bridges recognized legacy CSS literals with base-preserving fallbacks.

`scripts/build_deck.py source.html output.html [--config config.json] [--design <id>]` embeds these assets and the source's frames into one offline HTML file. `--palette` remains an alias. For design-only edits to a complete deck, `scripts/apply_design.py` checks compatible source motion functions and frame markup before using the builder; it also supports an in-place backup. It deliberately leaves custom engines/extra scripts to manual editing. Edit sources and shared assets, then rebuild; avoid making generated copies the only source of a fix. Ready-to-open starter and example builds remain in `assets/`.

`<script type="application/json" id="deck-config">` configures `id`, `title`, `brand`, `acts`, `transition`, `finale`, optional `layout`, `talk`, `palette`, `mode` and `palettes`. The builder's `--config` merges these top-level keys over inline config; `--palette <id>` overrides the selection. Legacy `#stage[data-acts]` and `data-transition` remain supported; config takes precedence. Use a unique `id` for unrelated decks so presenter messages and saved appearance/palette choices remain separate. `acts[].s` and `acts[].short` both supply short HUD labels. See THEME.md before selecting or adding a corporate palette.

```json
{"id":"my-talk","title":"My talk","palette":"base","mode":"dark","transition":"glide",
 "brand":{"name":"EPAM","label":"My talk"},
 "acts":[{"k":"Prologue","t":"The promise"},{"k":"Act I","t":"The tension"},{"k":"Epilogue","t":"Lights out"}],
 "finale":{"text":"The closing line.","credits":"Presenter"}}
```

Each `data-acts` entry may carry `"s"`, a short HUD label (default: "II · Sprawl" from "Act II" + "The sprawl").

## The frame contract

```html
<section class="frame a-gate" data-steps="5" data-act="4"
  data-cams='[[0,0,1],[0,0,1],[0,0,1],[0,0,1],[0,110,1.38,900,0,0,1],[0,0,1]]'
  style="--lit:#38E5CE">
  <div class="ghost"><b></b><span>The gate</span></div>   ← label shown before the frame is visited
  <div class="in"> … </div>                               ← the content, 1600×900, padding 120 96 96
</section>
```

- `data-steps`: the highest step number (a frame with steps 0–5 has `data-steps="5"`).
- `data-act`: index into `data-acts`. Frames of one act are consecutive.
- `data-cams`: one shot per step, so length is `data-steps + 1`.
- `--lit`: the frame's accent, normally its act's accent. Prefer `var(--primary)` or another role token from THEME.md; recognized legacy hexes remain supported.
- `class`: `frame` plus the archetype class (`a-…`) whose styles it uses; bespoke frames add their own `a-<name>` class.
- Optional `data-x`/`data-y`: pin a frame in the world (multiples of 2200 / 1500 keep the grid). Without them, frames snake 4 per row.
- `data-backup`: place an appendix frame after the story and give it a unique `id`. Its position is assigned separately from the main layout. See [PRESENTING.md](PRESENTING.md#qa-backup-slides) for Q&A controls.

## Steps

The engine sets `data-at="<step>"` on the active frame and toggles `.on` on every `[data-step]` element: `.on` while `step >= data-step`, and while `step <= data-until` when that is set. Use `data-until` for things that must disappear again (Run 01 vanishes when Run 02 starts).

## Motion primitives

Everything that moves is one of these. `--d` (a CSS duration on the element) staggers entrances; all of them wait for `--arrive`, the engine's signal that the camera has landed.

| Class | Behaviour | Fires |
|---|---|---|
| `.split` | Headline: each word pulls focus from blur. | frame arrives |
| `.fx` | Fade and rise. | frame arrives (`--d`) |
| `.rv` + `data-step` | Fade and rise. | its step |
| `.op` + `data-step` | Fade only. | its step |
| `.pw` | Power-on flicker (things coming online). | inside an `.on` parent, or with its own `.on` |
| `.draw` (SVG, `pathLength="1"`) | Line draws itself. | inside an `.on` parent |
| `.draw.en` | Line draws itself. | frame arrives |
| `.svs` (SVG group) | Fade and rise. | inside an `.on` parent |
| `.band` with `.ah` / `.al` | Arrow heads and labels of a connector appear. | its step |
| `.ck` | Checklist row slides in. | inside an `.on` parent |
| `[data-count]` | Number counts up when visible. Options: `data-pre`, `data-suf`, `data-dec`, `data-pad`, `data-dur`, `data-delay`, `data-ease="linear"`, `data-scramble`. | frame arrives / its step |

Text styles: `.kick` (mono kicker), `.h` (headline), `.lit` (accent phrase), `.lede` (+`<strong>`), `.take` (takeaway line, + `<b>`). Position a takeaway with `style="position:absolute;left:96px;bottom:92px"` when the frame's visual fills the space.

## Shots

A shot is `[dx, dy, scale]` relative to the frame centre:

- `[0,0,1]` frames the whole frame.
- `[-237,100,1.42]` pushes in on a detail: dx/dy move the camera centre in frame pixels, scale ≥ 1.3 reads as a push. The HUD hides while pushed in.
- `[dx,dy,s, holdMs, dx2,dy2,s2]` pushes in, holds, then glides to the second shot (the gate's Run 02 punch-in).
- `"world"` on the last step of the last frame triggers the **finale**: the camera pulls back over the whole world and `.finale` appears.

Build-ups on dense diagrams (the blueprint archetype) push in on each new part, then return to `[0,0,1]` for the takeaway.

## Transitions

`data-transition` on `#stage`, settled in the interview:
- `glide`: entering a new act zooms out with the act card; moving within an act glides.
- `swoop`: every frame change zooms out and back in, and new acts also show the act card.

## Testing hook

`window.deck` and its compatibility alias `window.__deck` expose `go(frameIndex, step)`, `next()`, `prev()`, `toggleTheme()`, `setPalette(id)`, `palette()`, `palettes`, `cyclePalette()`, `get()`, `steps`, `cam()`, `overview(on)`, `presenter()`, `frames`, `notes()` and `config`. Frame indexes are zero-based. Both API names refer to the same object. `scripts/shoot.js` drives either API; add `--palette all` for the full palette/appearance matrix.

`jump(backupId)` opens an appendix frame and `back()` restores the saved position. `frames[].backup` identifies appendix frames, and `mainCount` gives the story length. `count`, `steps`, `go` and the slide hash still use the complete frame list.

Generated modern components may infer steps from `data-step` and `data-hl`; an explicit `data-steps` still wins. `data-cams` accepts the original array or a sparse object keyed by step. A legacy `"world"` shot is retained. `data-finale` adds one final world shot, so use one convention per frame.

URLs support `#slide=N&step=S` (slide numbers are one-based), `?theme=light`, `?palette=epam-ai`, `?motion=0`, `?presenter`, `?print`, `?print=steps` and `?embed&static=1`. `C` cycles color palettes, `T` toggles appearance, `O` opens overview, `P` opens the presenter and `?` shows shortcuts. Reduced motion replaces camera travel with an immediate shot and disables delayed heritage effects. Buttons and links keep their normal Enter/Space behavior.

## Preserve a reference world's composition

For a migrated deck with deliberate world geometry, optional `world` settings
preserve the reference instead of recalculating every part. Coordinates refer to
the normalized world after layout (the included workshop starts at 0,0):

```json
{"world":{"finale":{"x":4200,"y":2676,"s":0.138},
 "thread":"M800,450 L8480,450 L8480,1950 L800,1950 L800,3450 L6300,3450",
 "showActsOnZoom":true,"labelLineHeight":"normal",
 "minimap":{"viewBox":[-200,-300,8900,4400],"preserveAspectRatio":"xMidYMid meet",
 "radius":60,"frameStroke":14,"viewStroke":22,"pathStroke":12},
 "auras":[{"size":1500,"alpha":0.07,"color":"#38E5CE"}]}}
```

`finale` overrides only the closing world shot; overview keeps its automatic
camera. `thread` is shared by the world and minimap. Aura entries correspond to
frame order and use that frame's center; omitted trailing entries use defaults.
An act may specify `width` in CSS pixels to preserve its HUD segment. Leave these
settings out for automatic layout. The builder rejects invalid camera scales,
minimap bounds, segment widths and aura values.

Legacy frames retain their original title wrapping and spacing. Mark a frame
`class="frame deck-modern"` when adopting the newer REA typography and spacing;
the included trend/share fragments already opt in. The original `.a-title`
archetype keeps its smaller logo-title line without changing workshop `.f1`.

## Changing the engine

Change it when a story needs a camera move, layout or behaviour the engine lacks. Keep these working: the frame contract, `window.__deck`, the light-mode stylesheet, and keyboard controls (→/space next, ← back, T theme, B blank, F fullscreen, Home/End). Re-run the self-check on the whole deck after an engine change.
