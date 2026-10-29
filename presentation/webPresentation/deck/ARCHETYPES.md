# Archetypes

Proven frame designs from the example deck. Each snippet in `archetypes/` is one complete `<section>`; its styles are already in `assets/starter.html`, keyed by the archetype class. Copy the snippet into the deck, then rewrite its text, items and step contents for the storyboard frame: keep the structure that makes it move, change everything it says.

| Archetype | File | Use when | Steps | Shots |
|---|---|---|---|---|
| Title | `title.html` | The Prologue frame: logo, kicker, small line + big shiny title word, promise line, presenters. | 0 | still |
| Venn | `venn.html` | Three groups or forces that must all be satisfied. | 1 callouts · 2 overlap labels · 3 core · 4 takeaway | still |
| Constellation | `constellation.html` | Sprawl: many platforms or things, then the chaos between them, then counters. | 1 nodes · 2 heat + chaos lines · 3 counter row | still |
| Split | `split.html` | Before → now comparison, row by row, ending on a full-screen quote card. | one row per step · last step quote card | still |
| Pillars | `pillars.html` | The answer as one platform with 4–5 numbered pillars rising from a floor. | 1 pillars · 2 takeaway | still |
| Persona: engineers | `persona-engineers.html` | What changes for a stakeholder who builds: a form, one click, a console provisioning everything. | 1 click + console · 2 "no longer their job" list · 3 takeaway | still |
| Persona: architects | `persona-architects.html` | A stakeholder who sets standards: a field of items inheriting one rule, then numbered outcomes. | 1 field + waves · 2 outcomes · 3 takeaway | still |
| Persona: business | `persona-business.html` | A stakeholder who owns decisions: three questions, each with a visual, a line and "business owns". | one question per step · last step takeaway | still |
| Blueprint | `blueprint.html` | An architecture, built up part by part with the camera pushing in on each new part. | one part per step · last step takeaway | push-in per step, back to `[0,0,1]` at the end |
| Locks | `locks.html` | A section title with a simple track and two shields lighting in turn (two levels, two stages). | 1 first shield · 2 second shield + pulse | still |
| Gate | `gate.html` | A pipeline with two blocking gates: what each checks, Run 01 passes, Run 02 is blocked at gate one. | 1 gate-one checks · 2 gate-two checks · 3 pass · 4 blocked · 5 takeaway | punch-in on the block |
| Gate (late stop) | `gate-late.html` | The same pipeline where Run 02 is stopped at gate two. Pair it with Gate for a second "one path" frame. | as Gate | punch-in on gate two |
| Factory | `factory.html` | The Epilogue vision: a platform slab of capabilities with lines feeding work in, then the finale. | 1 lines · 2 finale (`"world"`) | finale |

## Adapting

- Set `data-act` to the frame's act; snippets still carry the example deck's act numbers.
- Recount `data-steps` and `data-cams` whenever you add or remove steps.
- Retune push-in shots on the blueprint and the gate punch-in to the new layout, then confirm them in the self-check screenshots.
- Swap a whole frame's accent by changing `--lit`, plus the SVG literals that use the old accent (THEME.md).
- SVG coordinates are in the snippet's own `viewBox`; keep labels inside it.

## Bespoke frames

When no archetype fits, build the visual from the motion primitives in ENGINE.md, give the frame an `a-<name>` class, and put its CSS in the deck's `<style>` under a `/* archetype: <name> */` comment, with any `html.light` overrides beside it.

## Adding an archetype

For each bespoke frame the user chooses to keep:
1. Save its `<section>` as `archetypes/<name>.html`, without `data-x`/`data-y`.
2. Move its CSS (and `html.light` rules) into `assets/starter.html` under `/* archetype: <name> */`.
3. Add its row to the table above: what it's for, what each step reveals, its shots.
4. Shoot the starter with the snippet inserted to confirm it renders in both themes.
