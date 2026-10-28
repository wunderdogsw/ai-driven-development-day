# Example skills

Reference skills and subagents for the hands-on day. The guide (`/start`, `/part3`, `/part4`, `/part5`) uses them as the model when it drafts skills with you. You can also read them on the website: **Examples** in the nav bar.

| Example | Part | What it shows |
|---|---|---|
| [`add-ef-migration`](skills/add-ef-migration/) | 2 | A skill for one task the team repeats: exact commands, stop rules, a check script, worked examples and evals |
| [`discover`](skills/discover/) | 4 | Ticket → precise acceptance criteria and a sequence diagram, backed by evidence from any tracker |
| [`plan`](skills/plan/) | 4 | ACs → a plan where every step serves an AC, every file is named and every AC has a test command |
| [`implement`](skills/implement/) | 4–5 | Tests first from a separate subagent, a lock on approved tests, and a Stop hook that only lets Claude finish when every AC passes |
| [`review`](skills/review/) | 5 | Independent verifier and reviewer subagents, cross-checked findings, and review comments for PRs and work that is not a PR yet |

## Use one in your repo

The folders mirror `.claude/`:

```bash
cp -R examples/skills/discover  <your repo>/.claude/skills/
cp examples/agents/review-*.md  <your repo>/.claude/agents/    # for the review skill
cp examples/agents/test-writer.md <your repo>/.claude/agents/  # for the implement skill
```

Then change the paths, commands, MCP server names and tracker to match your repo. The paths assume `src/Api` (.NET), `backend/` (PHP) and `web/` (Next.js).

## Update the website

`pages.json` holds the text for each example page. After you change an example or `pages.json`:

```bash
npm run docs:examples   # writes docs/examples/
npm test                # fails if docs/examples/ is out of date
```
