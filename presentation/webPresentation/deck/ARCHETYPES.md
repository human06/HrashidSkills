# Archetypes

Each snippet in `archetypes/` is one complete `<section>`. The builder embeds its shared styles and components. Copy the snippet into the source deck and adapt its copy, data and builds. The eleven main frames in [the offline gallery](assets/archetype-gallery.html) adapt selected compositions from cinematic-deck 1.4. Press **P** and open **Q&A** to try the two example backups. To rebuild the gallery, run `python3 scripts/build_archetype_gallery.py`.

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
| Trend | `trend.html` | A numerical series supporting a claim, with an explicit time axis. Replace the marked illustrative data. | 1 series · 2 takeaway | still |
| Share | `share.html` | A share of a stated whole, using a 100-cell diagram by default. Replace the marked illustrative data. | 1 parts · 2 takeaway | still |
| Option grid | `option-grid.html` | Compare options against the same criteria with short text in each cell. | 1 deciding criterion | still |
| Scorecard | `scorecard.html` | Compare assessments on a defined scale. Say who scored the options and why. | 1 preferred row | still |
| Priority matrix | `matrix.html` | Place candidates on two axes, such as value and effort. | 1 starting quadrant · 2 next quadrant | still |
| Process | `process.html` | Explain stages, outcomes and handoffs in sequence. | 0 first stage · 1–3 remaining stages | still |
| Roadmap | `roadmap.html` | Show dated activities across parallel workstreams and mark the decision point. | 1 milestone | still |
| KPI | `kpi.html` | One key number, its unit and a breakdown that supports the claim. | 0 | still |
| Before and after table | `table.html` | Compare the same cases or metrics before and after a change. | 1 changed rows and result | still |
| Waterfall bridge | `bridge.html` | Explain how signed changes take an opening total to a closing total. | 1 main driver | still |
| Small multiples | `multiples.html` | Compare trends in several panels on matching axes. | 1 focus panel | still |
| Diagram walkthrough | `diagram-walkthrough.html` | Follow the highlighted path through a full system diagram. | 1–3 route segments | still |
| Screenshot tour | `screenshot-tour.html` | Explain areas of one screenshot with a side list of callouts. | 1–3 regions | still |

## Adapting

- Set `data-act` to the frame's act; snippets still carry the example deck's act numbers.
- Recount `data-steps` and `data-cams` whenever you add or remove steps.
- Retune push-in shots on the blueprint and the gate punch-in to the new layout, then confirm them in the self-check screenshots.
- Swap a whole frame's accent by changing `--lit`, plus the SVG literals that use the old accent (THEME.md).
- SVG coordinates are in the snippet's own `viewBox`; keep labels inside it.
- The eleven gallery frames use stationary shots. Keep highlights that help the explanation. To present the whole frame at once, remove its reveal attributes and set `data-steps="0"`. In Process, set every stage to `data-step="0"` so the stages stay lit.
- Replace illustrative schedules, assessments, metrics and interface mockups before presenting. See [PRESENTING.md](PRESENTING.md) for chart data contracts.

## Bespoke frames

When no archetype fits, build the visual from the motion primitives in ENGINE.md, give the frame an `a-<name>` class, and put its CSS in the source deck's `<style>` under a `/* archetype: <name> */` comment, with any `html.light` overrides beside it. The builder preserves source CSS; changes made only to a generated output are not shared source changes.

## Adding an archetype

For each bespoke frame the user chooses to keep:
1. Save its `<section>` as `archetypes/<name>.html`, without `data-x`/`data-y`.
2. Move its CSS (and `html.light` rules) into the maintained `assets/heritage.css` under `/* archetype: <name> */` for legacy designs, or `assets/components.css` for modern token-based components. Rebuild `assets/starter.html` and `assets/example.html` from `assets/sources/`.
3. Add its row to the table above: what it's for, what each step reveals, its shots.
4. Shoot the starter with the snippet inserted to confirm it renders in both themes.
