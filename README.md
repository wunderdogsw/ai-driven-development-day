# ai-driven-development-day

Jakamo AI-native training day material: a one-day training on working with coding agents (Claude Code) so that the team gets faster, not just the typing. Machines check the code, humans check the intent.

- **[Open the slides](https://wunderdogsw.github.io/ai-driven-development-day/slides/)** (press N for the speaker notes)
- **[Download the slides as PDF](https://wunderdogsw.github.io/ai-driven-development-day/slides/ai-native-development.pdf)**, with the speaker notes after each slide
- **[Example skills](https://wunderdogsw.github.io/ai-driven-development-day/examples/)**: the reference skills the hands-on guide builds from

## The day

| Time | Part | |
|---|---|---|
| 10:00 | 01 Where AI is today | What the data says about AI and productivity |
| 10:30 | 02 Agent setup | From request to guarantee: rules, skills, subagents, hooks, MCP, evals |
| 11:20 | 03 Talking to the agent | Prompts, evidence, steering, skills you call directly |
| 12:00 | Lunch | |
| 13:00 | 04 Planning | Discovery, precise acceptance criteria, sequence diagrams, plans that name the files |
| 14:00 | 05 Validation at scale | Two review layers, evidence in the PR, grading PRs |
| 15:00 | Optional hackathon | Build one check for your own team |

## Hands-on

You work on your own repo, with Claude Code as your guide. Nothing is committed or pushed to your repo: it is attached as a separate copy (a git worktree) on an `ai-day/<you>` branch, and a hook blocks commits, pushes and PRs there.

1. Clone this repo and start `claude` in it.
2. Type the command for each part when the talk for that part ends:

| Command | When | What happens |
|---|---|---|
| `/start` | After Part 1 | Attach your repo, analyse its agent setup during the Part 2 talk, get suggestions and drafts |
| `/part3` | After Part 3 | Check your skill and agent descriptions, and your prompts |
| `/part4` | After Part 4 | Build a `/discover` skill (and a `/plan` skill) on a real ticket |
| `/part5` | After Part 5 | Build a review skill or agent, and a weekly review-comments job |
| `/cleanup` | At the end | Remove the copy and the branch |

No repo you can use? Pair with someone who has one, or follow the talks.

**Examples.** The guide drafts every skill from a reference in [`examples/`](examples/): `add-ef-migration`, `discover`, `plan`, `implement` and `review`, with their subagents. Read them on the website: **[Examples](https://wunderdogsw.github.io/ai-driven-development-day/examples/)**, with a note on why each part is there and a Click to Copy button on every file.

Before the day: Claude Code 2.1.283 or later (logged in), Git, Node.js 22.12+, and your repo cloned. Make sure you are allowed to run an agent on it.

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
AGENTS.md                   ← the hands-on guide's instructions (CLAUDE.md imports it)
.claude/skills/             ← /start, /part3, /part4, /part5, /cleanup
.agents/assets/guard.mjs    ← hook: nothing is committed or pushed to your repo
examples/                   ← reference skills and subagents, and pages.json for the website
docs/examples/              ← the example pages (npm run docs:examples)
scripts/build-examples.ts   ← builds docs/examples/ from examples/
targets/                    ← gitignored: your attached repo
.workshop/                  ← gitignored: progress and findings
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
