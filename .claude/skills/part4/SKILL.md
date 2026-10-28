---
name: part4
description: Run Part 4 of the hands-on day (planning). Builds a discovery skill with the participant step by step (evidence sources, precise acceptance criteria, sequence diagram), then suggests a plan skill. Use when the participant types /part4.
disable-model-invocation: true
---

Read `AGENTS.md` at the repository root completely and follow it. Then run Part 4 as written below.

This part runs **after the Part 4 talk** ("Planning"). The format for acceptance criteria (ACs), questions and the sequence diagram is in [references/ac-format.md](references/ac-format.md). Read it before 4.3.

## How this part works

You build the skills **with** the participant, one piece at a time:

1. Say what you will add next and **Why** (one line, about what it gives the team).
2. Show the text you will add.
3. Ask "Add it?" Add it only on yes. On "change it", change it and ask again.

All files go in `targets/<name>/`, uncommitted. Plain English, no metaphors, no extra words, in your messages and in the skill text.

## First message

Read `.workshop/progress.json`, the active target's `profile.json` and `findings.md`. If there is no active target, say they need `/start` first, or follow "No repo?" in `AGENTS.md`. Set Part 4 to `in_progress`. Send:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Part 4 — Planning        (repo: <name>)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

What happens
1. Sources — where the evidence for a ticket lives, and how the agent reads it.
2. Access — we check the agent can really read each source.
3. Discovery skill — we build /discover together, one step at a time.
4. Try it — you run it on a real ticket and answer its questions.
5. Plan skill — I suggest a /plan skill that turns the ACs into a plan.

Nothing is committed or pushed to your repo. Drafts stay in a separate copy that you can delete.

Say "go" to start.
```

## 4.1 Sources

Explain in one line: "An AC is only as good as its evidence. First we find where the evidence lives."

Look in `targets/<name>/` (read-only) and build this table. Commit history and CI files usually tell the story, so always check them.

| Source | What it tells | How to look |
|---|---|---|
| Commit history | What changed, when, and why | `git log --oneline -n 50`, `git log -S <word>` |
| CI files | What the team really runs and checks | `azure-pipelines.yml`, `.github/workflows/`, `.gitlab-ci.yml` |
| Existing code and tests | How it works today | the code, `*Tests*`, `*.test.*`, `*.spec.*` |
| Tickets | What is asked | The tracker in `profile.json`: Jira, Linear, GitHub Issues, Azure Boards, GitLab issues |
| Past PRs | Earlier decisions and review comments | GitHub, Azure DevOps or GitLab (from `prHost`) |
| Docs and wiki | Decisions, specs | Confluence, Notion, Azure DevOps wiki, Linear documents |
| ADRs | Decisions already made | `docs/adr/`, `adr/`, `*decision*` |
| Architecture (C4) | System boundaries | `*.dsl`, `*.puml`, `docs/architecture/` |
| Logs | Real errors | Azure Monitor / Application Insights |
| Designs | What the user sees | Figma links in tickets |

Send it with a "Found" column: what you found in the repo, or "not found". Then ask:

"Which other sources does your team use for a ticket? For example a wiki, a design tool or a support system. Or is the codebase all we have?"

- **They add sources** → add them to the table.
- **They say "just the codebase"** → accept it, and say the problem in two lines: "Then every AC is backed only by code and commit history. The agent sees *how* the code works, not *why* or what the business wants, so it will ask you more questions, and an AC can describe today's behaviour instead of the wanted one."

Write the table and their answer under `## Part 4: Sources` in `findings.md`.

✓ 4.1 Sources done

## 4.2 Access

Explain in one line: "A source the agent can't read is no evidence."

For each source in the table, pick how the agent reads it:

- **CLI** when a good one exists (`git`, `gh`, `az` for simple calls). It costs fewer tokens.
- **MCP server** for systems with no good CLI, or where structured data helps: Jira and Confluence (Atlassian Rovo MCP), Linear (Linear MCP, read-only endpoint), Azure Boards and PR review threads (Azure DevOps MCP), Notion (Notion MCP), logs (Azure MCP), designs (Figma MCP). GitHub and GitLab issues and PRs: `gh` and `glab` are good CLIs. Use the official server, in the repo's `.mcp.json`, read-only where the server allows it. Ask them to check `/mcp` in the second terminal to see which servers they already have.

Check the current docs for the exact command or tool name. Make **one read-only call** per source to prove access, for example:

```bash
git -C targets/<name> log --oneline -n 5
gh issue view <n> --comments           # GitHub Issues
glab issue view <n> --comments         # GitLab issues
az boards work-item show --id <id>     # Azure Boards (or the Azure DevOps MCP server)
gh pr list --state merged --limit 5    # GitHub PRs
```

For an MCP source, ask them to run one request in the second terminal, for example "Use the Atlassian MCP server to show the title of <TICKET>", and paste the answer.

Report one line per source: ✓ works, or ✗ with the reason (not logged in, no CLI, no permission). Don't ask for tokens in chat. For a ✗ source, the skill falls back to: "paste the ticket text" (tickets) or "skip and say so in the ACs file" (others).

Save the working commands to `profile.json` under `sources`.

✓ 4.2 Access done

## 4.3 Discovery skill

Build `targets/<name>/.claude/skills/discover/SKILL.md` piece by piece, with the loop in "How this part works". The model is `examples/skills/discover/`: read it first. Tell them in one line: "This follows the `/discover` example: https://wunderdogsw.github.io/ai-driven-development-day/examples/discover/". Use the participant's real sources, tracker and commands, not the example's. Pieces, in this order:

1. **Frontmatter.** `name: discover`, a short description in the Part 3 style, `disable-model-invocation: true` (a person starts discovery for a ticket), and `allowed-tools` with only read-only tools: the read-only commands and the read-only MCP tools from 4.2 (`mcp__<server>__<tool>`).
   Why: discovery reads and asks. It never changes code, so it can't break anything.
2. **Fetch the ticket.** `$ARGUMENTS` is the ticket id. Read it with the command from 4.2, including linked issues. If that fails, ask the user to paste it.
   Why: the ticket is the start, but it is rarely enough on its own.
3. **Read the evidence.** One step per source from 4.1, with its command or MCP tool. Search for the words of the ticket (`git log -S`, `grep`). Read the related code and tests.
   Why: every AC must point to evidence, not to a guess.
4. **List gaps and conflicts.** Before asking anything, write the list: what the ticket doesn't say, and where two sources disagree.
   Why: you see the size of the unknown before the questions start.
5. **Ask until precise.** One question at a time, with the quoted evidence and 2–4 options (format in `ac-format.md`). Each answer is saved as a decision with the person's name. Stop when every AC passes the five precision rules.
   Why: the human decides the intent; the agent only finds the questions.
6. **AC rules and examples.** Put the five precision rules, the "must never" rules and **two examples written for this repo** into `discover/references/ac-format.md`. Write the examples with the participant, from a real feature in their code, in the Given / when / then format.
   Why: the agent writes ACs like the examples it sees.
7. **Sequence diagram.** Write `plans/<TICKET>/sequence.md` in Mermaid: every actor, call, write and error path, each arrow labelled with its AC. Every missing arrow goes back to step 5 as a question.
   Why: gaps show up as missing arrows, before any code exists.
8. **Write the files.** `plans/<TICKET>/acs.md` in the format from `ac-format.md`: ACs with evidence and decisions, "Must never", "Out of scope", "Open questions". Sources that could not be read are listed under "Not checked".
   Why: this file is the intent. Humans review it; tests are written from it.

After all pieces, show the full skill once and run a quick check: the description follows Part 3, every command in it ran in 4.2.

✓ 4.3 Discovery skill done

## 4.4 Try it

Ask for a real ticket they will work on soon. A small one is best.

They start it in a second terminal (a fresh session sees the new skill):

```bash
cd <absolute path to targets/<name>>
claude
```

```text
/discover <TICKET>
```

They answer the questions themselves. When it is done, read `plans/<TICKET>/acs.md` and `sequence.md` and check each AC against the five rules. Report one line per AC: ✓, or what is missing ("'fast' is not a value", "no error case"). If something fails, find whether the skill or the answer caused it, and offer a fix to the skill.

Ask: "Would a teammate agree on pass or fail for every AC?"

✓ 4.4 Try it done

## 4.5 Plan skill

Suggest it in three lines:

```
**Suggestion: a /plan skill**
What: turns acs.md and sequence.md into plans/<TICKET>/plan.md, in plan mode.
Why: every step points to an AC, the plan names every file, and the tests come from the ACs before any code exists. Part 5 checks the code against this file list.
```

Ask: "Do you want to build it?" On no, go to Part complete. On yes, build `targets/<name>/.claude/skills/plan/SKILL.md` with the same loop. The model is `examples/skills/plan/` (https://wunderdogsw.github.io/ai-driven-development-day/examples/plan/): keep its `plan.md` format (Tests table with one command per AC, Files table, Checks), because `/implement` and `/review` read it with scripts.

1. **Frontmatter.** `name: plan`, description, `disable-model-invocation: true`. Note in the skill that it is meant to run in plan mode (`claude --permission-mode plan`), so Claude can't edit files until the human approves.
   Why: the plan is reviewed before anything is built.
2. **Inputs.** Read `plans/$ARGUMENTS/acs.md` and `sequence.md`. Stop if there are open questions.
   Why: no plan without clear ACs.
3. **Steps.** Numbered steps, each ending with the AC it serves (`→ AC1`). A step that serves no AC is a question.
   Why: nothing extra gets built.
4. **File table.** `| File | Change (edit/new) | What | AC |` for every file changed or created.
   Why: the file list is a drift guard. Part 5 compares it with what really changed.
5. **Tests first.** One test per AC, a property test for each "must never" rule, one E2E test for the main flow. Name the test files in the table. Tests are written from the ACs before the code.
   Why: if the same agent writes the code and then the tests, both share the same mistake.
6. **Ask for approval.** Show the ACs, the sequence diagram and the plan together, and ask "Do you approve the ACs, the diagram and this plan?" (Yes / No). Yes → write `plans/<TICKET>/plan.md` and stop; building happens in a fresh session (`/clear`). No → ask what is wrong or missing, one question at a time, change the plan and ask again.
   Why: the human approves the intent before anything is built, and a clean context builds from the approved files, not from the chat.

Then they try it in the second terminal on the same ticket:

```bash
claude --permission-mode plan
```

```text
/plan <TICKET>
```

Check the plan: every step has an AC, every AC has a test with a command that runs only that test, every file is in the table.

✓ 4.5 Plan skill done

## 4.6 Implement skill (optional)

Suggest it in three lines:

```
**Suggestion: an /implement skill**
What: builds the ticket from the approved plan in a fresh session. A separate test-writer subagent writes the tests first, from the ACs only. Two hooks come with it: one locks the approved tests and plan, one lets Claude finish only when every AC test passes.
Why: the agent can't make a red test green by changing the test, and it can't stop before the ACs are met.
```

On yes, add it from `examples/skills/implement/` (its `SKILL.md` and the three scripts) and `examples/agents/test-writer.md` (https://wunderdogsw.github.io/ai-driven-development-day/examples/implement/) to `targets/<name>/.claude/skills/implement/`, uncommitted. Change only the paths and commands to match the repo. Test both hook scripts by piping a sample hook JSON into them, and show the result. Part 5 uses it to build the ticket before the review.

✓ 4.6 Implement skill done

## Part complete

Set Part 4 to `complete`. Send:

```
✓ Part 4 complete.

**Skills:** /discover<, /plan><, /implement> (in targets/<name>/.claude/skills/)
**Ticket:** <TICKET> → plans/<TICKET>/acs.md, sequence.md<, plan.md>

Nothing is committed or pushed to your repo. To keep the skills, copy them into your own checkout and commit them there yourself.

---

**Next, Part 5:** we build a review skill or agent that checks the code against these files. Type /part5 after the Part 5 talk.
```
