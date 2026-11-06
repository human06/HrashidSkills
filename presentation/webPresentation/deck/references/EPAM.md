# EPAM color adaptations

Use this reference for the EPAM designs. Official and AI draw on the Presales and technical deck color treatments. See [EPAM GitHub](#epam-github) for the HTML design. The JSON registry defines the executable color tokens.

## Source evidence

The Presales template's **theme1** uses black/white, `#060606`, `#A0A0A0`, `#FBFAFA`, blue `#418DFF`, teal `#107E8D`, violet `#8353D2`, indigo `#3055DA`, cyan `#009CBE`, mint `#61E2BB` and green `#03815B`. Mint/green occupy hyperlink slots: their pass/status use here is an adaptation. Other Office themes in that file are not brand evidence.

Its content/agenda layouts 5–8 have blue/indigo/violet gradient stops at 50/70/100%, with an OOXML angle of 20°. Section layouts 9–12 use the same order at 0/76/100%, angle 30°. Layout 62 includes a 0/66/100% variant. The HTML gradient preserves their hue order and restrained placement; CSS angle and stop positions are adapted, not a pixel match. The cover's blurred light is a raster asset, not proof of a gradient formula.

The AI deck's actual shapes use the same blue, teal, violet and indigo. Its Office theme definitions do not describe its design. Content surfaces are `#FFFFFF`/`#FBFAFA`, text `#000000`/`#4A5A7A`, lines `#E2E8F0`, and tints `#D9E8FF`, `#EFF9FA`, `#EFF6FF`, `#F5F0FF`. Its closing background is `#1E1E2E`, with cyan `#009CBE`. Colors identify parts of a diagram or workstream consistently across a story.

These inputs provide no substantive temporal transition definitions. Preserve the skill's existing `glide`/`swoop`, camera and entrance timing. Color progression and gradients do not authorize inventing PowerPoint motion behavior.

## Role system

| Role | Official adaptation | AI adaptation |
|---|---|---|
| Primary | Source blue `#418DFF` | Source indigo `#3055DA` in light; source cyan `#009CBE` in dark |
| Supporting roles | Teal, violet, indigo | Teal, violet, blue |
| Neutrals | Black/white and neutral greys | White/off-white and cool slate; dark `#1E1E2E` |
| Structural color cue | Blue → indigo → violet gradient | Solid color emphasis |
| Content color | One dominant accent per act | Stable role colors within diagrams |

The five graphic tokens are fixed in both appearances:

| Token | Source hex |
|---|---|
| `--blue` / `--brand-blue` | `#418DFF` |
| `--teal` / `--brand-teal` | `#107E8D` |
| `--violet` / `--brand-violet` | `#8353D2` |
| `--indigo` / `--brand-indigo` | `#3055DA` |
| `--cyan` / `--brand-cyan` | `#009CBE` |

`--primary`, `--secondary`, `--tertiary`, `--quaternary` select from these literal source colors. Never replace these graphic tokens with lighter/darker approximations in a mode. A diagram may use translucent tints, but its opaque accent is still the exact source color.

Text contrast is separate: optional `--blue-ink`, `--teal-ink`, `--primary-ink`, etc. can use derived shades. For example, light `--blue-ink` is `#225EC9`, while `--blue` remains `#418DFF`. CSS `color` declarations and recognized SVG text use ink variants; fills, strokes, RGB tints and gradients use the original graphic tokens. Legacy `--lit`/`--c` retain their graphic colors and get separate scoped text helpers. In new SVG content use `fill="var(--blue-ink,var(--blue))"` on text and `stroke="var(--blue)"` on its line.

Ink shades, dark content surfaces, warning/error colors and the assignment of primary/secondary roles are HTML adaptations, not additional approved brand colors. The older implementation incorrectly substituted contrast shades into graphic tokens; it has been corrected rather than retained as an EPAM palette option.

On opaque colored fills, use `--on-blue`, `--on-teal`, `--on-violet`, `--on-indigo` or `--on-cyan` for contrasting white/black text. `--on-accent` corresponds to the primary fill. The blue action/tool-call controls use `--on-blue` explicitly. SVG text styled through a group or a CSS `fill` rule should name its ink token explicitly; the automatic bridge recognizes direct text/tspan/textPath fills and CSS `color`. If a local CSS class overrides `--lit`/`--c`, set the matching `--palette-ink-lit`/`--palette-ink-c` in that same scope rather than inheriting a parent helper.

Legacy hue tokens keep their hue families. `--teal` remains teal, `--violet` remains violet, and status tokens remain green/amber/red. The old pink/orchid/extra-series aliases reuse the corporate role colors; they are compatibility aliases, not twelve distinguishable categories. For more than four concurrent groups, add labels, patterns or another frame rather than relying on repeated hues.

## Distribution and effects

**Official:** dark by default. Use neutral typography and a single dominant content accent. Reserve the blue → indigo → violet progression for the title, act card or closing treatment. Keep content panels and charts flat. The title's existing three lights use this trio without moving them. Avoid extra orange/amber decoration; warm colors are reserved for status.

**AI:** light by default. Use flat fills, role-colored diagram lines/headings, and pale tints for related callouts. Keep a role's color stable across frames. No decorative multicolor gradients on content; ambient title light is weaker. The dark variation extends the closing surface to a readable full-deck mode. Selecting a palette does not automatically turn the first/last frame dark or copy the source deck's structure.

In corporate modes, legacy frame-level ember/red/amber accents become `--quaternary`. Mark a frame `data-status-accent` when its entire accent intentionally signals risk or caution. Decorative auras follow the same rule without changing source world geometry or alpha. Blueprint `svg.hld` compositions (including legacy workshop frames) use a cool role for the amber registered-tools group; blocked/pass indicators retain status colors. New content should assign cool role colors directly and reserve warm colors for statuses. Base restores all original accents and aura colors.

Both adaptations reduce neon bloom and text glow. Keep key text on a neutral surface. Aim for text contrast ≥4.5:1 and large text/essential graphic contrast ≥3:1; gradients and source graphic colors require their own contrast check. Status meaning also needs a label or symbol.

The title's original track/sweep animation remains active: its moving highlight uses the selected primary graphic color, with the original keyframes, delay, duration and background travel. Flat AI content does not require disabling this existing cover animation.

## Art and type

The public edition reuses the EPAM title masks from the original skill. It requests Calibri and Calibri Light when installed and falls back to embedded Archivo. Technical labels and code use the shared mono font. The [asset manifest](../assets/design-artifacts/manifest.json) supports local title, cover and act-card artwork.

## EPAM GitHub

Use `epam-github` for the navy EPAM cover and monochrome wordmark. Keep the navy cover in both appearances. Content defaults to white and light slate. Use blue `#2F68FF` for primary graphics, teal `#0B8D96` and violet `#7B50D6` for supporting roles, indigo `#194ED4` and cyan `#009DB6` for additional accents. Dark content surfaces and text contrast variants adapt these roles for the shared deck engine. The font stack requests Inter, Segoe UI and Calibri before the embedded fallback.

## Review

Capture the same frame and step across all relevant palettes and both appearances. Check the selected fonts, logo and artwork. Verify the camera and timing and check for inherited neon colors in corporate SVG/CSS, `base` restores its original look, status meanings remain clear, and presenter/overview/print/embed receive the selected colors. The palette button must identify the current palette even when two content frames use similar hues.
