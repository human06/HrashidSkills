# Theme

The fixed EPAM look: dark by default, light on **T** (remembered per browser, or forced with `?theme=light`). All styles live in `assets/starter.html`.

## Palette

Use these literal hexes in `style="--lit:…"`, `style="--c:…"`, and SVG `fill`/`stroke` attributes. The light stylesheet remaps exactly these literals, so any other colour stays dark-mode in light mode.

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

One accent per act; a frame's `--lit` is its act's accent unless the frame is about a specific stakeholder.

## Light mode

The light stylesheet (`html.light …`, near the end of the starter's `<style>`) remaps the literals above, flattens glows (text-shadow and inline `drop-shadow` filters are dropped), and switches blend modes to multiply. When a bespoke frame introduces a colour or effect outside the palette, add its `html.light` rule beside the others. Light-mode leftovers (a dark box on white, white text on white) are the most common self-check failure.

## Type

Archivo (display, variable width via `font-stretch`) and Plex Mono (labels, kickers, numbers), both embedded. Headline 58px/700, lede 20px, takeaway 31px/300, mono labels 10.5–12px uppercase with wide tracking.

## Logo

The title archetype's `.p-logo` is the EPAM logo as two masks: letters follow the text colour, brackets stay brand cyan `#04B3CF`. The HUD brand line reads "EPAM | <deck title>".

## Icons

Architecture frames show official vendor icons where a box names a vendor service:
- Azure: `https://arch-center.azureedge.net/icons/Azure_Public_Service_Icons_V24.zip`
- AWS: the Architecture Icons asset package from `https://aws.amazon.com/architecture/icons/`
- GitHub: the Octicons `mark-github` path, drawn inline with `fill="currentColor"`.

Download archives into a fresh empty directory. Embed each icon as a base64 data URI, in SVG as `<image href="data:image/svg+xml;base64,…" width="18" height="18">` and in HTML as `<img src="…">`, so the deck stays offline and light mode leaves the icon's colours alone. Place an icon left of its box title and shift the title right to keep the pair centred.
