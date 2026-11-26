# Albert Heijn

Use this reference for `ah`.

**Unverified.** The brand coach service (`oneai-brand-coach-service`) exposes only an authenticated chat endpoint (`/v1/chat/completions` returns 401 without a token), so the values below are approximations of the public Albert Heijn look, not taken from the brand book. Confirm them with the brand coach or brandbook and update `assets/palettes.json`.

| Role | Hex | Deck use |
|---|---|---|
| AH blue | `#00A0E2` | Primary accent, graphics |
| Deep blue | `#0074A8` | Accent text (`*-ink`) on light surfaces |
| Orange | `#FF6600` | Secondary accent, Bonus-style highlights |
| Navy | `#0B2A4A` | Light-mode ink, dark-mode canvas base |
| Sky | `#7FD0F2` | Tertiary graphics |

Light mode is the default, on white. Dark mode uses navy surfaces. Use `*-ink` tokens for text contrast. Red and amber are for status only, with a label or symbol.

The font stack is `Albert Heijn Sans` when installed, falling back to the embedded Archivo. No logo is bundled; register authorized assets in the [asset manifest](../assets/design-artifacts/manifest.json).
