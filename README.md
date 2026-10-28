# ai-driven-development-day

Jakamo AI-native training day material: a one-day training on working with coding agents (Claude Code) so that the team gets faster, not just the typing. Machines check the code, humans check the intent.

- **[Open the slides](https://wunderdogsw.github.io/ai-driven-development-day/slides/)** (press N for the speaker notes)
- **[Download the slides as PDF](https://wunderdogsw.github.io/ai-driven-development-day/slides/ai-native-development.pdf)**, with the speaker notes after each slide

## The day

| Time | Part | |
|---|---|---|
| 10:00 | 01 Where AI really is today | What the data says about AI and productivity |
| 10:30 | 02 Agent setup | From request to guarantee: rules, skills, subagents, hooks, MCP, evals |
| 11:20 | 03 Talking to the agent | Prompts, evidence, steering, skills you call directly |
| 12:00 | Lunch | |
| 13:00 | 04 Planning | Discovery, precise acceptance criteria, sequence diagrams, plans that name the files |
| 14:00 | 05 Validation at scale | Two review layers, evidence in the PR, grading PRs |
| 15:00 | Optional hackathon | Build one check for your own team |

## What's in the repo

```
docs/                       ← the website (GitHub Pages)
├── index.html              ← start page
├── slides/
│   ├── index.html          ← the deck: one HTML file, no build step
│   ├── notes.json          ← speaker notes, one entry per slide (keyed by the slide title as a slug)
│   └── ai-native-development.pdf
└── assets/                 ← Wunderdog logo, colours and fonts (site.css), nav bar (nav.css), light-streak background
scripts/build-slides-pdf.ts ← puts the notes into the deck and writes the PDF
```

## Using the deck

Keys: → / Space next, ← back, R replay the slide, O overview, F full screen, N speaker notes. Open the deck in two windows and they follow each other, so one can show the notes. `#s12` in the URL opens slide 12.

## Updating the slides

- **A slide:** edit `docs/slides/index.html`. Each slide is one `<section class="slide …" data-title="…">`. Elements with `data-s="n"` appear at step n.
- **A speaker note:** edit `docs/slides/notes.json`. The key is the slide title as a slug, so if you rename a slide, rename its key too.
- Then run:

```bash
npm install
npx playwright install chromium   # once
npm run docs:slides               # puts the notes into index.html and writes the PDF
npm test                          # fails if index.html and notes.json are out of sync
```

## Publishing the pages

GitHub Pages publishes the `docs/` folder from `main`.

1. Merge your changes to `main` and push.
2. In GitHub, open **Settings → Pages**. Under *Build and deployment*, set *Source* to **Deploy from a branch**, the branch to **main** and the folder to **/docs**. Save.
3. After a minute or two the site is at https://wunderdogsw.github.io/ai-driven-development-day/.

The site is public even when the repo is private.
