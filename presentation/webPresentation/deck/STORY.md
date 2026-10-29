# Story

How a deck's story is found, shaped and written down. The worked example is `assets/example.html` ("The path to scaling is Governance").

## The default arc

Start from this arc and rename or reshape it for the topic. Every deck keeps the frame of Prologue → Acts → Epilogue.

| Beat | Job | In the example |
|---|---|---|
| Prologue | The title frame: the promise of the talk in one line. | "The path to scaling is **Governance**" |
| Who's involved | The people with a stake, and what each one needs. | Act I — The people |
| The tension | What is broken or about to break; make the room feel it. | Act II — The sprawl |
| The answer | The idea that resolves the tension, then what it means for each stakeholder. | Act III — The answer |
| The proof | How it actually works: architecture, the rule working, the rule stopping something. | Act IV — The machine |
| Epilogue | Where this goes next, then the finale. | Epilogue — Lights out |

Act names are "The" plus one noun. Two to five acts between Prologue and Epilogue.

## Pacing

- About one frame per 3–4 minutes of talk: 30 min ≈ 9 frames, 45 min ≈ 13, 60 min ≈ 17.
- Up to 6 steps per frame. A frame with nothing to build gets 0–1 steps.
- Propose the counts from the user's length; they confirm in the storyboard.

## Writing a frame

- **Headline**: a claim, never a topic ("No enterprise runs on one stack.", not "Platform landscape"). About 4–10 words, ending in a full stop.
- **Lit phrase**: the one phrase in the headline that carries the claim, in the act's accent. One per headline.
- **Lede**: one sentence of context under the headline, with the clause that matters in `<strong>`.
- **Steps**: each click reveals one new idea, in the order the presenter will say it. The visual carries the idea; text inside it is labels, not paragraphs.
- **Takeaway**: the line the frame lands on after its last step, 8–16 words, with one or two words lit. It is what the audience repeats afterwards.
- **Kicker** (optional): a small mono line above the headline naming the context ("direction of travel").

Story devices that work:
- **Tension before answer**: let the problem frames land fully before the answer appears.
- **Show it working, then show it stopping**: Run 01 passes, Run 02 is blocked (the gate archetype).
- **Repetition**: a phrase reused across frames ("There is only one path to production." → "…to the agent.").
- **Callback finale**: the closing line echoes a takeaway from earlier.
- **One quote climax**: a split frame can end on a full-screen quote card.

## Interview question bank

Ask only what the brief doesn't answer. Each question offers 2–4 concrete options with your recommendation first.

- What does the audience believe walking in, and what should they believe walking out?
- What is the tension: what is broken, risky or expensive today?
- The answer in one sentence?
- Which stakeholders matter, and what does each one need?
- What proves it: an architecture, a pipeline, a demo moment, a number?
- What is the vision for the Epilogue?
- Facts, numbers, products or names that must appear, and anything to keep out?
- Transition style: glide (zoom out only between acts) or swoop (zoom out on every frame change)?

## Storyboard format

```
# <Deck title> — storyboard
Audience: … · Goal: … · Length: … min · Presenters: … · Transition: glide

## Prologue
01 · title · "The small line above" / **Title** · sub: "One-line promise"

## Act I — The people   (accent: violet #A98DFF)
02 · venn · Every enterprise build answers to [three groups.]
   lede: Each is accountable for something different — …
   steps: 1) three callouts: business, architects, engineers  2) the overlaps  3) "software succeeds" core
   takeaway: Satisfy only two of the three and a project doesn't half-succeed. **It stops.**
   ⚑ invented: the four bullets under each group

## Epilogue — Lights out
13 · factory · The AI [Dark Factory.]  → finale: "The gate does not care who wrote it. …"
```

`[brackets]` mark the lit phrase; `**bold**` marks lit words in a takeaway; ⚑ lists every specific the user hasn't confirmed.
