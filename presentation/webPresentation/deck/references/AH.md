# Albert Heijn

Use this reference for `ah`. Sources: the AH Brandbook (Feb 2023, 178 pages, Dutch; page numbers below) and the AH brand coach (Brand Portal). Neither is a software token specification. The Digital Design System (Confluence) owns tokens, components and UX copy; contact Joost Krijnen (joost.krijnen@ah.nl). Logo files and minimum size: vi.brandcoach@ah.nl.

## Verified (brandbook)

| Item | Value |
|---|---|
| AH blue | CMYK C95, PMS 2995C, RGB 0/173/230 = `#00ADE6` for digital (p.18, p.36). The book states no hex; `#00ADE6` is the RGB converted. |
| Zeegroen (Beter eten) | CMYK C80 M10 Y45, PMS 3268C, RGB 0/174/151 = `#00AE97` (p.35, p.37) |
| BONUS orange | CMYK C0 M75 Y100, PMS 021C, RGB 243/91/21 = `#F35B15` (p.45) |
| Olifantengrijs (keuze/kwaliteit) | CMYK C48 M45 Y50 K34, PMS 405C, no RGB defined (p.44). Not in the palette. |
| Colour roles | Blue = AH identity and quality, zeegroen = Beter eten, orange = Bonus; exceptions on blue: Kerst (purple), Bonus, Beter eten, Kwaliteit/keuze (p.19) |
| Headings | Hamburg Serial Heavy; start with a capital, end with a full stop (not for one word or a product list), no `;` or `:`, no exclamation or question marks, `€` sign (p.9, p.20) |
| Subheadings | Hamburg Serial Bold at half the heading size (p.22) |
| Body | Hamburg Serial Regular (p.22) |
| Claim box and pay-off | Hamburg Serial Bold; claim box is white, centred text, lowercase, in the background colour (p.22, p.25) |
| Prices | Hamburg Bonus Bold 2.0 (p.116); campaign use only |
| Logo | Base logo is AH blue with a white outline that is always present, even if invisible on white (p.13). Variants S/M/L (p.14). |
| Pay-off | "Dat is het lekkere van Albert Heijn" closes external brand communication with the logo as sender; never instore, in-app or on the web (p.17) |
| Layout | Left-aligned, text-dominant (70% copy, 30% image), capital-L margins; pay-off spans the width between the margins, aligned on the bottom of "AH" in the logo (p.24) |
| Living blue | Concrete-textured blue background for customer campaigns, always as background; plain AH blue supports pay-off, text, labels and company-voice messages (p.18, p.36) |
| Voice | Simple, short, positive; "je"; spoken forms ("hou je"); `€`; `1.000`; no "Appie"; no read-only abbreviations such as m.b.t. (p.9) |
| Photography | Shot from above, light from top left, drop shadow bottom right, real and human, no hands (p.94) |
| Mission | Samen beter eten bereikbaar maken. Voor iedereen. |

From the brand coach: white is the base for panels and outlined CTAs; AA contrast (3:1 headings, 4.5:1 other text); CTA buttons are never white text on blue or orange (white button, coloured border, black text); text at least 12-14 pt.

## Applied in the `ah` design

- Fonts: Hamburg Serial (Regular, Bold, Heavy, Bold Italic; SoftMaker files) from `assets/design-artifacts/ah/fonts/`; stack `Hamburg Serial`, `Hamburg`, `Arial`. Use Heavy for headings and Bold for subheadings. Keep to internal exports (licence unconfirmed).
- Palette: `blue` is AH blue, `teal` zeegroen, `ember` BONUS orange, as graphics. Text on white uses the darker derived inks `teal-ink` `#00766A` (5.5:1) and `ember-ink` `#B83E0B` (5.6:1); in dark mode the brand colours themselves pass 4.5:1.
- Logo and cover: `ah/logos/logo-mask.png` (one-colour mask) and `logo-blue.png`; the light cover uses `ah/images/levendblauw.jpg`. Dark mode keeps the plain background because white text on living blue fails 4.5:1.
- Deck copy: follow the voice and heading rules above (capital, full stop, `je`, `€`, no exclamation or question marks in headings).

## Derived or placeholder (not brand-verified)

- Black and neutral greys for text, neutral surfaces, borders and the dark appearance are generic defaults; corporate blue (used for panel text) has no verified hex.
- `#006B8F` and `#66CDF0` are darker and lighter shades of AH blue so blue text passes 4.5:1 on white. Black is used on `#00ADE6` (8.1:1) instead of white; brandbook headings are white on living blue, which fails AA, so black ink stays.
- `#00766A` and `#B83E0B` are darker shades of zeegroen and BONUS orange for text.
- Success, warning and error colours are generic defaults.

## Not applied (brandbook devices outside a deck)

- Premium gold `#CA8F2A` (reserved for Mijn AH Premium and Kerst), Bio green `#7FBC03`, Kerst purple, olifantengrijs, Op=op yellow, magenta.
- Claim box, price panel (Hamburg Bonus Bold), grids (keuze, multi buy, service plus, Beter eten), permanent multi buy.
- Pay-off: `ah/logos/payoff-white.png` is registered as `--design-payoff` but not wired into any frame. Only add it to externally shared brand decks, never to instore, in-app or web material.

## Decisions (user, internal-use decks)

- Balig Script is accepted as the handwritten "lekkere" font in place of Summer Loving.
- The cover shows the basis logo (`logo-blue.png`, role `--design-logo`) with a white outline; on the light living-blue cover only the outline is visible, as the brandbook describes for coloured backgrounds. The one-colour mask (`--design-title-letters`) is kept for other uses.
- Decks are internal: no pay-off and no claim box. `payoff-white.png` stays registered but unwired.
- Assumed minimum logo size: 40 px on screen (about 10 mm in print) with clear space of at least a quarter of the logo height; the brandbook states none (ask vi.brandcoach@ah.nl to confirm).
- White-on-blue headings stay black ink to meet WCAG AA (contrast of 4.5:1 for text, 3:1 for large headings).
- Hamburg Serial fonts stay in internal exports (licence unconfirmed).
- Digital tokens (radius, spacing, shadows, icons, buttons, cards, inputs) are out of scope.
