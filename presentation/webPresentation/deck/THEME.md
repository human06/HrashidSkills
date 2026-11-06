# Colors and themes

The original color scheme remains the default `base` palette. Choose corporate colors independently of the light/dark appearance. Every built HTML embeds the registered color palettes and the assets for the design selected at build time.

| Palette id | Color treatment | Default appearance |
|---|---|---|
| `base` | Original neon teal and multicolor accents | Dark |
| `epam-official` | Adapted Presales colors, neutral surfaces, blue → indigo → violet on structural frames | Dark |
| `epam-ai` | Flat technical role colors, cool neutrals, restrained ambient effects | Light |
| `epam-github` | Navy cover with blue, teal and violet light, white content surfaces by default, monochrome EPAM mark | Light |
| `ah-one-ai` | Ahold Delhaize Corporate colors, ONE AI mark and restrained ambient effects | Light |

For an EPAM palette, read [references/EPAM.md](references/EPAM.md) for source colors, gradient rules and derived contrast shades. These are adaptations of the supplied files, not a certification against an EPAM brand manual. Keep the shared archetypes, camera paths and timing. Design fonts can change text wrapping.

For `ah-one-ai`, read [references/AH-ONE-AI.md](references/AH-ONE-AI.md) for the Corporate colors, mark and typography choices.

## Select and switch

Set `"palette":"epam-ai"` in `deck-config` or JSON config. Set `"mode":"dark"` separately when needed. The CLI `--palette epam-official` overrides the config selection. Omitting a palette keeps `base`.

`build_deck.py --design <id>` is an alias for `--palette`. To apply a design to a ready-made deck, use `apply_design.py source.html output.html --design <id>`. Its default `--mode keep` preserves the source appearance; `--mode palette` uses the selected design's default, and `--mode light` / `dark` are explicit. Run `apply_design.py --list-designs` to inspect the bundled choices. The helper checks source frame markup and compatible camera/build functions, exports variants with separate presenter/storage ids, and backs up an in-place input. Frame text, notes and story order are preserved.

Example requests are “Use $deck with EPAM Official for this presentation” and “Compare EPAM AI with ONE AI on this story.” Use [COMPARE.md](COMPARE.md) to compare designs at the same frame, build and appearance. Within a standalone deck, C/T provide the same choices offline.

In a generated deck, **C** or the palette button cycles palettes and displays the selected name, **T** switches light/dark, and `?palette=epam-ai&theme=light` forces a combination. Each choice is remembered per deck. Precedence: a valid URL choice, then saved browser choice, then config, then palette default appearance. Switching palettes keeps the current appearance, frame, step, camera and transition style. The default appearance applies when initially opening a deck without a mode override or saved choice. To force a newly selected author default for existing viewers, share the explicit palette URL.

Code can call `deck.setPalette('epam-ai')`, read `deck.palette()` and `deck.palettes`, or listen for `deckpalettechange` on `document`. Presenter previews receive the same palette and appearance; print/embed honor URL selections too.

Use the ready-to-open `assets/palette-proof.html` to compare opaque graphic colors and their text counterparts. Its editable source is `assets/sources/palette-proof.html`; rebuild it with the same builder. This avoids confusing translucent or intentionally dimmed story graphics with a changed source hex.

## Design assets

Build or export with `--design <id>` to package that design’s assets. The public skill ships its original EPAM title marks and shared fonts. The manifest can reference local artwork and brand fonts for internal builds. Compare designs to switch complete asset sets in one viewer. In a standalone deck, C previews other color palettes using the assets already embedded. Export a standalone HTML per design when sharing variants.

Use [the design asset manifest](assets/design-artifacts/manifest.json) to register files under the palette id. Store files by brand in `assets/design-artifacts/<brand>/logos/`, `fonts/` or `images/`. EPAM Official and EPAM AI can reference the same brand directory. Paths in the manifest are relative to `design-artifacts/`. Keep story images in the deck source.

| Manifest field or role | How the deck uses it |
|---|---|
| `titleMark`, `files.title-letters`, optional `files.title-brackets` | Accessible name and mask art for the shared title slot |
| `files.hud-mark` | Icon next to the default brand name in the on-screen HUD |
| `files.cover-light` / `files.cover-dark` | Backdrop on a title frame in that appearance |
| `files.act-light` / `files.act-dark` | Backdrop on the act card in that appearance |
| `fontStack` | Ordered display and body families before the built-in fallback. Technical labels and code retain the shared mono font. |
| `fonts` | Embedded faces with `family`, `file`, integer `weight` and `style` of `normal` or `italic`. Register one face per file and use its family in `fontStack`. |

Additional image roles in `files` are available as `var(--design-<role>)` containing an offline URL. Wire each role into the relevant composition once. Files kept in the brand directories become active when listed in the manifest. Use `data-color-fixed` on authored title artwork or a title frame whose existing backdrop should take precedence. An explicit custom HUD logo remains part of the deck.

When changing a design’s fonts, check both appearances and the actual title, dense text and charts for wrapping. Keep fonts marked for internal use within internal exports and comparisons.

## Add a corporate palette

Extend `assets/palettes.json`, or put a new definition under `config.palettes.<id>` for a single deck. Start by copying an EPAM entry, give it a new id and label, and replace its `light`/`dark` tokens, source description and `gradient`/`solid` treatment. These are the bundled color treatments; a new kind of color effect also needs scoped CSS in `palettes.css`. `base` is reserved. The builder validates both appearances and required tokens; custom definitions survive a rebuild and are embedded offline. No runtime, camera or archetype fork is needed.

Use role variables in new content: `--primary`, `--secondary`, `--tertiary`, `--quaternary`, `--txt`, `--txt2`, `--panel`, `--panel2`, `--line`, and the existing status tokens. For example, `style="--lit:var(--primary)"` and `fill="var(--secondary)"`. EPAM graphic tokens keep their exact source hexes in both light/dark modes. Optional `--blue-ink`, `--primary-ink`, etc. are contrast variants for text only. Do not use ink variants for graphic fills, lines or gradients. CSS text colors and recognized SVG text are adapted separately; graphics stay on the source colors. A custom palette may omit ink variants, in which case text falls back to its normal color. Keep `--red` for blocked, `--amber` for caution, `--green` for pass, with a visible label or symbol. Vendor artwork uses its original colors: put `data-color-fixed` on an inline SVG or its wrapper to opt out of literal conversion; image URLs and the logo masks are preserved automatically.

The builder bridges recognized heritage CSS hex/RGB values through conditional fallbacks. The runtime adapts recognized inline styles and SVG fill/stroke/stop colors for corporate palettes and restores their original values for `base`. Unknown bespoke colors remain literal: convert them explicitly into role tokens. Rebuild starter/example outputs after shared changes.

Design application keeps the existing title sweep's animation and timing; only its moving highlight colors change. Blueprint compositions are recognized by `svg.hld` as well as the archetype class, including legacy workshop frames. Decorative warm auras follow the corporate role colors without changing their size/alpha or the source world config; `data-status-accent` retains intentional status auras. Returning to base restores their source colors.

## Base palette compatibility

Existing archetypes may keep these literal hexes in `--lit`, `--c`, and SVG `fill`/`stroke`. New content should use the role variables above. The base light stylesheet remaps these recognized literals; unknown colors need explicit tokens or appearance rules.

| Role | Dark literal | Light |
|---|---|---|
| teal (primary accent) | `#38E5CE` (deep `#13A393`) | `#08907F` |
| ember | `#FF7A45` | `#DC5019` |
| red (blocked) | `#FF4868` | `#D01E3E` |
| amber | `#FFB547` | `#B06900` |
| violet | `#A98DFF` | `#6747D6` |
| blue | `#62A0FF` | `#1C5BD3` |
| green (pass) | `#40E391` | `#0E8C4C` |
| extra series | `#FF5FA2` `#D08CFF` `#B6E35A` `#8C8CFF` `#4FD1E8` | darker twins |
| headline text | `#fff`, `#E9EDF3` | `#0D1322` |
| secondary text | `#8A93A6`, muted `#5B6477` | greys |
| panel fills | `#060A12`, `#0C1220`, `#141A24` | white / `#F2F4F8` |
| hairlines | `rgba(255,255,255,A)` with A ∈ .022 .03 .035 .1 .12 .13 .18 .2 .22 .55 .7 .75 | navy at matching strength |
| teal tints | `rgba(56,229,206,A)` with A ∈ .05 .08 .1 .4 | |

In HTML/CSS, prefer the variables: `--txt`, `--txt2`, `--txt3`, `--panel`, `--panel2`, `--line`, `--line2`, `--teal`, `--ember`, `--red`, `--amber`, `--violet`, `--blue`, `--green`, `--lit`. They switch themes on their own.

For `base`, use one accent per act; a frame's `--lit` is its act's accent unless it concerns a specific stakeholder. Apply the selected corporate palette's distribution rules when adapting a deck.

## Light mode

The light stylesheet (`html.light …`, near the end of `assets/heritage.css`) remaps the literals above, flattens glows (text-shadow and inline `drop-shadow` filters are dropped), and switches blend modes to multiply. The runtime also converts recognized inline `--lit` and `--c` literals into semantic tokens so CSSOM formatting cannot break their theme mapping. When a bespoke frame introduces a colour or effect outside the palette, add its `html.light` rule in the source deck, or beside the shared rules when extending the library. Light-mode leftovers (a dark box on white, white text on white) are the most common self-check failure.

## Type

Base uses embedded Archivo for display and Plex Mono for labels, kickers and numbers. A theme can supply its own display and body family through the asset manifest. The shared headline is 58px/700, lede 20px, takeaway 31px/300 and mono labels 10.5–12px.

## Icons

Architecture frames show official vendor icons where a box names a vendor service:
- Azure: `https://arch-center.azureedge.net/icons/Azure_Public_Service_Icons_V24.zip`
- AWS: the Architecture Icons asset package from `https://aws.amazon.com/architecture/icons/`
- GitHub: the Octicons `mark-github` path, drawn inline with `fill="currentColor"`.

Download archives into a fresh empty directory. Embed each icon as a base64 data URI, in SVG as `<image href="data:image/svg+xml;base64,…" width="18" height="18">` and in HTML as `<img src="…">`, so the deck stays offline and light mode leaves the icon's colours alone. Place an icon left of its box title and shift the title right to keep the pair centred.
