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

The engine derives all world furniture from the frames: positions (when a frame has no `data-x`/`data-y`), the dotted thread, auras, act labels, minimap, HUD act segments, ghost numbers and the finale shot. Leave those out of the HTML; frame order in the DOM is the story order.

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
- `--lit`: the frame's accent, normally its act's accent. Use a palette hex from THEME.md so light mode remaps it.
- `class`: `frame` plus the archetype class (`a-…`) whose styles it uses; bespoke frames add their own `a-<name>` class.
- Optional `data-x`/`data-y`: pin a frame in the world (multiples of 2200 / 1500 keep the grid). Without them, frames snake 4 per row.

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

`window.__deck = { go(frameIndex, step), toggleTheme(), get(), steps, cam() }`, zero-based frame index. `scripts/shoot.js` drives it.

## Changing the engine

Change it when a story needs a camera move, layout or behaviour the engine lacks. Keep these working: the frame contract, `window.__deck`, the light-mode stylesheet, and keyboard controls (→/space next, ← back, T theme, B blank, F fullscreen, Home/End). Re-run the self-check on the whole deck after an engine change.
