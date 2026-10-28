# AI-native-development-day

AI-native training day material: a one-day training on working with coding agents (Claude Code) so that the team gets faster, not just the typing. Machines check the code, humans check the intent.

- **[Materials](https://wunderdogsw.github.io/ai-driven-development-day/)**
- **[Open the slides](https://wunderdogsw.github.io/ai-driven-development-day/slides/)** (press N for the speaker notes)
- **[Download the slides as PDF](https://wunderdogsw.github.io/ai-driven-development-day/slides/ai-native-development.pdf)**, with the speaker notes after each slide
- **[Example skills](https://wunderdogsw.github.io/ai-driven-development-day/examples/)**: the reference skills the hands-on guide builds from

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
