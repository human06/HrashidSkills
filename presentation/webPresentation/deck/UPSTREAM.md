# Heritage update for upstream review

The user requested an additive update that retains the original deck's palette,
typography, frame designs and transitions while adding presenter tools from the
colleague's later HTML exports.

## Inputs

- Original skill: `human06/HrashidSkills`, commit `d4357b9b2d681d9946169e5c4f8cebbcc147a6d8`.
- Original visual reference: GenAI Governance,
  credited to Hassan Rashid. Its 11-scene content is used for the separate
  Governance v2 deliverable, rather than substituted into the skill's 13-scene example.
- Runtime/component reference: cinematic-deck 1.2.

The runtime reference names `scripts/build_deck.py`, but no original builder or full
source package was supplied. The builder in this contribution is a new
implementation. Original authorship and existing example credits are retained.

## Contribution

- One maintained runtime, embedded by the builder into standalone HTML outputs.
- Complete original stylesheet, including fonts, archetypes and light-mode
  remapping, retained as `heritage.css`.
- REA component library plus narrowly scoped compatibility rules. The legacy
  `.b7 > .field` coordinate system is preserved separately from modern grids.
- Original `data-acts`, short act labels, camera arrays and `glide`/`swoop`
  transitions; both public API names resolve to the same object.
- Presenter, per-build notes, timing, Facts, overview, print and reduced motion.
- Fifteen archetypes: the original thirteen plus clearly illustrative trend
  and share examples.
- Theme-aware legacy accent variables after CSSOM layout updates; theme
  propagation into presenter previews; native keyboard behavior on controls.
- Portable Python 3.9+ builder, stable rebuilds, UTF-8 I/O and waffle validation.
- Optional reference-world camera, thread, minimap, aura and act-width settings
  preserve imported workshop compositions instead of approximating them.
- Fidelity fixes scope the logo-title variation, keep legacy wraps and padding,
  preserve HUD styling and avoid toolbar/minimap overlap. Returning from overview
  restores the finale's appearance as well as its camera.
- Screenshot CLI supporting both API generations, static/live capture and
  machine-readable errors and layout warnings.

## Review and verification

Run `python3 scripts/test_build.py`. It checks stable rebuilds, preservation of
legacy frame contracts, JSON embedding, rejection of inconsistent waffle totals,
compilation of all fifteen archetypes, and reference-world metadata validation.
Run `node --check assets/runtime.js`
and `node --check scripts/check_deck.js` for syntax.

Browser checks should cover every build in both themes, original camera paths,
the whole-world finale, overview selection, keyboard activation, presenter theme
synchronization, print and reduced motion. Static captures intentionally do not
validate the pacing of live transitions.

Facts preserve source traceability; they do not assert independent verification.
Existing example counters and runs are illustrative. No external metrics or
technical claims were refreshed during this runtime migration.


## Corporate palette extension (2.1.0)

The default `base` palette retains the heritage look. Color selection is an
independent axis from light/dark appearance. The bundled `epam-official` and
`epam-ai` definitions adapt the user's `templates/EPAM/EPAM_PresalesTemplate.potx`
and `Agentic_Platform_EPAM.pptx`; these source files are not redistributed in the
skill. See `references/EPAM.md` for literal source colors, derived contrast shades,
gradient distribution and the first phase's logo/font limitations. This does not
assert certification against an EPAM brand manual.

New shared assets are `palettes.json`, `palettes.css` and `palette-runtime.js`.
The portable `scripts/palettes.py` validates registry definitions and bridges
recognized legacy CSS literals with original-value fallbacks. The runtime adapts
inline SVG/styles for corporate selection and restores base values. URL, config,
keyboard/button/API, saved selection and presenter messages carry palette ids;
custom per-deck registry entries survive an offline rebuild. Camera paths,
compositions, fonts and transition timing remain shared.

The builder tests now include custom-palette round trips, invalid selection,
registry validation and preservation of artwork/attribute selectors through the
color bridge. `shoot.js --palette all --static --modes` captures every build in
every registered palette and both appearances.

### Exact graphic colors (2.1.1)

The five EPAM graphic hue tokens now equal the supplied source hexes in both
appearances: blue `#418DFF`, teal `#107E8D`, violet `#8353D2`, indigo `#3055DA`,
cyan `#009CBE`. The earlier contrast substitutions in those tokens were a design
error. Optional `*-ink` tokens now carry text contrast shades separately. CSS
text colors, recognized SVG text and scoped `--lit`/`--c` text helpers use those
variants; graphic fills/strokes/gradients retain their source colors. Custom
palettes can omit ink variants and fall back to their normal color tokens.

## Packaged design selection (2.2.0)

The shared skill now includes the complete design-only adaptation path used for
the real Governance deck: `apply_design.py`, a `--design` builder alias, explicit
Base / EPAM Official / EPAM AI selection instructions, and independent appearance
selection. Ready-made compatible decks retain their frame markup, world config
and checked motion functions. In-place application creates an exact backup;
custom engines/extra scripts are left to manual editing rather than discarded.

The title's moving highlight is now part of shared palette CSS, retaining the
original sweep/track timing. Legacy blueprint `svg.hld` and decorative auras are
adapted by the shared assets rather than Governance frame-number overrides.
Palette switching restores original aura colors in Base. No Governance story or
reference PowerPoint binaries are required in the portable skill package.
