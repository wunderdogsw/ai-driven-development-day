---
name: start
description: Start the hands-on part of the AI-native development day. Attaches the participant's repo as a safe copy, analyses its agent setup and suggests improvements. Use when the participant types /start or asks to start the hands-on.
disable-model-invocation: true
---

Read `AGENTS.md` at the repository root completely and follow it. Then run Part 2 as written below.

This part runs **during the Part 2 talk** ("Agent setup"). Attach first, then run the analysis in the background so the participant can listen. Show the suggestions when the talk ends or when they write to you.

## First message

Read `.workshop/progress.json` (create it from `AGENTS.md` if it is missing). If Part 2 is complete, say so and ask whether to run it again or attach another repo. Otherwise send:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Part 2 — Agent setup
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

What happens
1. Attach — you give me a repo, I make a safe copy of it.
2. Analyse — I check your agent setup in the background while you listen to the talk.
3. Suggestions — a short list of improvements, each with why it helps.
4. Drafts — I write the ones you want, so you can try them.
5. Evals — we test that a draft changes what the agent does.

Nothing is committed or pushed to your repo. Drafts stay in a separate copy that you can delete.
```

Then ask the questions in 2.1. Set Part 2 to `in_progress` with `startedAt`.

## 2.1 Attach

Ask in one message:

1. Your first name (used for the branch name).
2. The repo: a local path or a clone URL.
3. Where your PRs live: GitHub, Azure DevOps, GitLab or other. (Part 5 needs this.)
4. Where your tickets live: Jira, Linear, GitHub Issues, Azure Boards, GitLab issues or other. (Part 4 needs this.)

If they have no repo, follow "No repo?" in `AGENTS.md` and stop here.

Then do this yourself, without showing raw output unless something fails:

- **Pre-flight.** `git --version`, `node --version`, `claude --version`. Claude Code must be 2.1.283 or later for `/doctor prompt-audit`. If it is older, tell them to run `claude update`, and carry on.
- **Name.** `<name>` is the repo folder name in lowercase.
- **Local path.** Check it is a git repo with `git -C <path> rev-parse --show-toplevel`. Then:
  `git -C <path> worktree add -b ai-day/<participant> "$PWD/targets/<name>" HEAD`
  This adds a second checkout. Their own checkout, branch and uncommitted changes stay as they are.
- **URL.** `git clone <url> targets/<name>`, then `git -C targets/<name> switch -c ai-day/<participant>`.
- **Profile.** Write `.workshop/targets/<name>/profile.json`:
  ```json
  { "name": "<name>", "source": "<absolute path or null>", "url": "<url or null>", "worktree": "targets/<name>", "branch": "ai-day/<participant>", "defaultBranch": "<from git>", "prHost": "github|azure-devops|gitlab|other", "tracker": "jira|linear|github|azure-boards|gitlab|other", "stack": [], "commands": {} }
  ```
- Update `progress.json`: `participant`, `activeTarget`.

Reply in three lines: where the copy is, the branch, and "Nothing is committed or pushed to your repo."

✓ 2.1 Attach done

## 2.2 Analyse (background, read-only)

Tell them: "I'm analysing your repo now. It takes a few minutes. Listen to the talk. At the next break, run three Claude Code checks (steps below)."

Run the analysis as a background subagent or background shell if your tool supports it. It only reads files. It never edits the target.

**a. Agent files.** In `targets/<name>`:

```bash
ls -la CLAUDE.md CLAUDE.local.md .claude/CLAUDE.md AGENTS.md .mcp.json 2>/dev/null
find . \( -name CLAUDE.md -o -name AGENTS.md \) -not -path '*/node_modules/*' -not -path './.git/*' -mindepth 2
ls .claude/rules .claude/skills .claude/agents .claude/commands .claude/hooks 2>/dev/null
grep -n '^@' CLAUDE.md .claude/CLAUDE.md 2>/dev/null
cat .claude/settings.json 2>/dev/null
wc -l CLAUDE.md AGENTS.md 2>/dev/null
```

Check what actually loads. Confirm the current rule in the Claude Code memory docs; at the time of writing it is:

- With a `CLAUDE.md`, `AGENTS.md` loads only through an `@AGENTS.md` import. "Read AGENTS.md" is not an import.
- With no `CLAUDE.md`, Claude reads `AGENTS.md`.
- Rules with `paths:` and subfolder `CLAUDE.md` files load only when Claude works with those files.
- Skills and agents load as a name and description; the full file loads when used.
- `.cursor/rules/` never loads in Claude Code.

**b. Stack and commands.** Detect the stack from the files (`*.sln`, `*.csproj`, `composer.json`, `package.json` with `next`/`react`, `tsconfig.json`, `Directory.Build.props`, `.editorconfig`, `phpstan.neon`, `.eslintrc*`/`eslint.config.*`, `.prettierrc*`). Find the real format, lint, typecheck and test commands in the CI files (`azure-pipelines.yml`, `.github/workflows/`, `.gitlab-ci.yml`) and `package.json` scripts. CI files tell what the team actually runs. Save stack and commands to the profile.

**c. Stack guidance.** For each detected stack, run the checks in [references/stack-checks.md](references/stack-checks.md). For Next.js and React, suggest only skills from Vercel's skill library, and get the current list first. For other stacks, check the current official docs before you call something missing.

**d. Claude Code checks (the participant runs these).** Run them the way the Claude Code docs say, no exceptions: `claude doctor` in a terminal, and `/doctor` and `/doctor prompt-audit` at the Claude Code prompt. Don't run them yourself, and don't run them through `claude -p`.

Right after you start the background analysis, give the participant these steps to do at the next break, in a **second terminal**:

```bash
cd <absolute path to targets/<name>>
claude doctor
claude
```

Then, at the Claude Code prompt in that session:

```text
/doctor
/doctor prompt-audit
```

Tell them, in one line each:

- `claude doctor` checks the installation and changes nothing.
- `/doctor` checks the setup: unused extensions and how much context they use, slow hooks, and `CLAUDE.md` content Claude could work out from the code.
- `/doctor prompt-audit` finds outdated, conflicting or broken instructions. It needs Claude Code 2.1.283 or later.
- **Say no to every fix they offer.** We change only the copy, and only after you choose in 2.3. Never accept a change to `~/.claude/` or your default permission mode.
- Paste the three results here when you're done.

When they paste the results, add them to `findings.md` under `## Claude Code checks`. Put findings about user-level files (`~/.claude/…`) in a separate "Personal" list. Don't show the suggestions until you have these results, unless the participant says to go without them.

**e. Write `findings.md`.** `.workshop/targets/<name>/findings.md` with sections: `## Agent files`, `## What loads`, `## Stack and commands`, `## Stack guidance`, `## Claude Code checks`, `## Suggestions`. One line per fact, with the file or command it comes from.

When your part is done, tell them in two lines: "My analysis is ready. Paste the three Claude Code results and I'll show the suggestions."

✓ 2.2 Analyse done

## 2.3 Suggestions

When you have the three Claude Code results (or they said to go without them) and they say "show", send the list. Most important first. Leave out anything that is already good, but list it in one line at the end ("Already good: …"). At most 10 suggestions.

Use the categories in this order, only the ones with findings:

1. **Instructions that don't load or conflict** (missing `@AGENTS.md` import, a command that doesn't exist, two files that disagree, `CLAUDE.md` over 200 lines).
2. **Stack guidance** (for example: Next.js and React repo, but none of Vercel's skills are installed, such as `react-best-practices` or `next-dev-loop`).
3. **Path-specific rules** (one `.claude/rules/<area>.md` per stack area, with `paths:`).
4. **Hooks** for format (after every edit), lint and typecheck (before Claude finishes), and a block on files nobody edits by hand (migrations, generated API clients). Also hooks that should be rules, and rules that should be hooks ("keep guarantees few").
5. **Skills** for steps the team repeats (run locally, migrations), and **subagents** for one focused job (security reviewer, migration checker, test writer).
6. **MCP servers** for systems the team uses with no good CLI, with their risks in one line (context cost, trust, prompt injection), and **permissions** (only if the checks found something).
7. **Where the setup lives:** personal setup the team needs, and for many teams, a plugin marketplace and managed settings.
8. **Evals** for every skill or rule you draft.

Each suggestion is three lines:

```
**3. Path-specific rule for the .NET API**
Found: src/Api/ has 140 .cs files; CLAUDE.md mixes .NET, PHP and Next.js rules.
Why: Claude gets the .NET rules only when it works in src/Api/, so the context stays small and the rules don't mix.
```

End with:

```
---

Nothing is committed or pushed to your repo.

**Next:** which ones do you want as drafts? Reply with the numbers, "all" or "none".
```

Write their answer to `findings.md` under `## Decisions`.

✓ 2.3 Suggestions done

## 2.4 Drafts

One suggestion at a time, in their order:

1. Say in one line what you will add and where, and the **Why**. Ask "Add it?"
2. On yes, write it in `targets/<name>/`, uncommitted. Follow the target's own conventions and the real commands from 2.2. Keep files short.
3. Show the result in two lines: the files and how to see it work (for example: start `claude` in `targets/<name>`, run `/memory` or `/hooks`).

Drafting rules:

- **Hooks** go in the project `.claude/settings.json`, scripts in `.claude/hooks/`, referred to through `${CLAUDE_PROJECT_DIR}`. Format runs as `PostToolUse` on `Edit|Write`, only on the changed file. Lint and typecheck run as a `Stop` hook; exit code 2 means "keep working". A block on protected files runs as `PreToolUse`. Check the current hooks docs for the input format. Test each hook script by piping a sample hook JSON into it, and show the result.
- **Rules** use `paths:` frontmatter and hold only what Claude can't see in the code.
- **Skills** go in `.claude/skills/<name>/SKILL.md` with a clear `description` (what it does and when to use it, the key use case first). The model is `examples/skills/add-ef-migration/`: exact commands, stop rules, a script for the mechanical check, examples in `references/`, evals. Tell them in one line: "This follows the `/add-ef-migration` example: https://wunderdogsw.github.io/ai-driven-development-day/examples/add-ef-migration/"
- **Subagents** go in `.claude/agents/<name>.md`, with only the tools they need. Models: `examples/agents/`.
- On "no", skip it and go to the next one.

✓ 2.4 Drafts done

## 2.5 Evals

Explain in two lines: "One good run proves nothing. An eval runs the same task several times, with and without the draft, and shows the difference."

For each drafted **skill**, offer an eval with `claude plugin eval` (Claude Code v2.1.269+; check the current plugin evals docs). Hooks don't need an eval: they run every time, and 2.4 already tested them.

The eval tests the skill on its own, outside the target, so nothing lands in the repo:

```bash
d=.workshop/targets/<name>/skill-eval
mkdir -p "$d/.claude-plugin" "$d/skills"
echo '{"name": "skill-eval"}' > "$d/.claude-plugin/plugin.json"
cp -R targets/<name>/.claude/skills/<skill> "$d/skills/"
cd "$d" && claude plugin eval init --bare <skill>
```

The `add-ef-migration` example has two eval cases in `evals/` to copy the shape from (https://wunderdogsw.github.io/ai-driven-development-day/examples/add-ef-migration/).

Then, with the participant:

1. **`prompt.md`** — a request a teammate would type, without naming the skill. Suggest one; they edit it.
2. **A `tool_used` grader** — did Claude pick the skill (`tool: Skill`, `input_match` = the skill name)?
3. **A `regex` grader** — something only the skill knows, such as the exact command or file path.

Ask before running: "What difference do you expect?" Then run `claude plugin eval . --no-publish` (3 runs with, 3 without). Report `WITH`, `W/OUT`, `Δ` and the cost. If the skill was not picked, improve its `description` and run again. Write the result under `## Evals` in `findings.md`.

If a run would take long, give them the command for their own terminal and read the result after.

End with three lines on how to grow evals after today: start from 20–50 real failures (bugs, review comments, failed agent runs), rerun on every setup change and new model, and read the transcripts when a score is low. Details: "Evals" in `stack-checks.md`.

✓ 2.5 Evals done

## Part complete

Set Part 2 to `complete` with `completedAt`. Send:

```
✓ Part 2 complete.

**Drafts:** <files, one line>
**Evals:** <skill: Δ, one line each>

Nothing is committed or pushed to your repo. To keep a draft, copy it into your own checkout and commit it there yourself.

---

**Next, Part 3:** we check your skill descriptions and your prompts. Type /part3 after the Part 3 talk.
```
