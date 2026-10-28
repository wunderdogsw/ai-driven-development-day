---
name: part5
description: Run Part 5 of the hands-on day (validation at scale). Builds a review skill or review agent with the participant step by step, then suggests a weekly job that turns PR review comments into findings. Use when the participant types /part5.
disable-model-invocation: true
---

Read `AGENTS.md` at the repository root completely and follow it. Then run Part 5 as written below.

This part runs **after the Part 5 talk** ("Validation at scale").

## How this part works

You do the work for the participant, but you ask before every addition:

1. Say what you will add next and **Why** (one line, about what it gives the team).
2. Show the text or code you will add.
3. Ask "Add it?" Add it only on yes. On "change it", change it and ask again. On "skip", go to the next one.

All files go in `targets/<name>/`, uncommitted. Plain English, no metaphors, no extra words.

## First message

Read `.workshop/progress.json`, the active target's `profile.json` and `findings.md`, and list `targets/<name>/plans/`. If there is no active target, say they need `/start` first, or follow "No repo?" in `AGENTS.md`. Set Part 5 to `in_progress`. Send:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Part 5 — Validation at scale        (repo: <name>)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

What happens
1. Choose — a review skill or a review agent.
2. Build — I add the checks one by one. You say yes or no to each.
3. Try it — we run it on a real change.
4. Weekly job — I suggest a job that turns the week's PR review comments into rules.

Nothing is committed or pushed to your repo. Drafts stay in a separate copy that you can delete.

Say "go" to start.
```

## 5.1 Choose

Ask with these two options:

```
Which one do you want to build?

a) Review skill that leads subagents — /review runs the checks, starts independent subagents, cross-checks their findings and writes the comments.
   Why: the team calls one command, and each subagent reviews with fresh eyes. It costs more tokens than one pass.

b) Review agent — .claude/agents/reviewer.md, called by Claude when a change is done.
   Why: Claude can hand off the review on its own. It starts the same subagents.
```

Check the current Claude Code skills and subagents docs for the file format before you write it. Write their choice to `findings.md` under `## Part 5`.

✓ 5.1 Choose done

## 5.2 Build

Name: `review`. Location: `.claude/skills/review/SKILL.md` (skill) or `.claude/agents/reviewer.md` (agent), plus the subagents in `.claude/agents/review-*.md`. Use the real commands from `profile.json` and the plan files from Part 4 if they exist. The model is `examples/skills/review/` and `examples/agents/review-*.md`: read them first, they are the model for every piece below. Tell them in one line: "This follows the `/review` example: https://wunderdogsw.github.io/ai-driven-development-day/examples/review/"

Add the pieces in this order. For each one: what, **Why**, the text, "Add it?".

1. **Frontmatter.** Name, a description in the Part 3 style, read-only tools (`Read`, `Grep`, `Glob`, `Bash` limited to the check commands, and read-only MCP tools). `Edit` and `Write` are not pre-approved; it writes only in `plans/<TICKET>/review/`.
   Why: the reviewer reports. It never changes the code it reviews.

2. **Inputs.** The change against the default branch, including uncommitted and new files (`git diff <default>` and `git ls-files --others --exclude-standard`), and `plans/<TICKET>/acs.md`, `sequence.md`, `plan.md` when they exist. Without plan files, say which checks are skipped.
   Why: the review checks the code against the approved intent, not against taste.

3. **Static checks.** Run the repo's real commands, only on what changed where possible: `tsc --noEmit` and ESLint for Next.js, `dotnet build` with analyzers for .NET, PHPStan for PHP. Report only what failed.
   Why: machines catch these in seconds, so no human has to.

4. **Dead code, complexity, duplication.** For TypeScript/JavaScript, Fallow if the repo has it or they want it. For .NET and PHP, write the checks as review rules: unused methods, copy-paste blocks, long methods.
   Why: agents write more code than needed.

5. **File drift guard.** A small script, `.claude/hooks/drift-guard.mjs` (or the stack the team prefers): read the file table in `plan.md`, compare with the changed and new files (`git diff --name-only <default>` plus `git ls-files --others --exclude-standard`), print planned files not changed, changed files not in the plan, and missing test files. The review calls the script.
   Why: comparing two file lists is mechanical, so a script does it, the same way every time. Test the script with a sample plan and a sample file list, and show the output.

6. **Docs.** Check that docs, ADRs and the changelog changed when the code needed it.
   Why: docs travel with the code, or they get old.

7. **Verification subagents.** `review-ac-verifier` (one passing test per AC with the AC's values, property tests, E2E) and `review-flow-verifier` (flow against `sequence.md`, the app in the browser). Read-only, started in one message so they run in parallel.
   Why: a green build doesn't show that the right thing was built. Running the tests against the ACs does.

8. **Test gaming** (in `review-ac-verifier`). Flag every change to a test file named in `plan.md` after it was approved.
   Why: an agent can make a red test green by changing the test. Offer one more draft here: a `PreToolUse` hook that blocks edits to the approved test files during `/implement`.

9. **Sequence diagram, round two** (in `review-flow-verifier`). Draw the flow from the changed code and compare it with `sequence.md`. Every difference is drift.
   Why: a new call or a missing error path shows up before a human reads the diff.

10. **Show it running** (in `review-flow-verifier`). If the change touches the web app and it runs locally, the Playwright MCP server goes through the main flow and takes a screenshot per AC.
   Why: the PR shows the feature working, not only a claim that it works.

11. **Reviewer subagents.** `review-code` (code level) and `review-logic` (business logic against the ACs) always; `review-fresh-eyes` (no plan, no ACs) for Large or Critical changes or when the two disagree. Each gets only the packet, never another reviewer's findings.
   Why: two reviewers who find the same thing alone are worth more than one long review.

12. **Cross-check.** One list; group the same problem; found twice = confirmed; found once = the lead checks it in the code; facts beat readings; disagreement goes to the human; rejected findings listed with a reason.
   Why: the comments that reach people are checked, so they trust them.

13. **Comments.** Conventional Comments labels, one problem per comment, why and evidence, a fix when there is one. Not a PR yet → `plans/<TICKET>/review/review.md` with a fix list. PR exists → comments written to a file, shown, and posted only after the user says yes.
   Why: a comment with a label, a reason and a fix gets acted on. Posting is a write, so a human approves it.

14. **Output.** The evidence list in PR format, then a grade:
    ```
    AC1 → ProfilePhoneTests.InvalidPhone → passed
    Must never → PhoneProperties (1,000 inputs) → passed
    Drift: Shared/StringUtils.cs changed, not in the plan
    Docs: changelog entry missing
    Grade: Small | Medium | Large | Critical — <one-line reason>
    ```
    Grades: Small (small change, no business logic), Medium (bigger, no business logic), Large (many files or packages, or business logic), Critical (core business logic, migrations, database layer).
    Why: the human reads the evidence, not every line of the diff, and knows when they must look.

✓ 5.2 Build done

## 5.3 Try it

The review needs a change to review. Offer the options that fit:

- **The Part 4 ticket.** In a second terminal in `targets/<name>`, a fresh session runs `/implement <TICKET>` (or builds it from `plans/<TICKET>/` without the skill), uncommitted. Then they review it.
- **A recent change.** Review the diff of a recent branch or the last merged change (`git diff HEAD~1`), without plan files. The AC and drift checks are skipped.
- **Their own work.** A branch they work on now, checked out in the worktree.

They run it in a second terminal:

```bash
cd <absolute path to targets/<name>>
claude
```

```text
/review <TICKET>
```

(For the agent: "Use the reviewer agent to review this change against plans/<TICKET>.")

Ask before: "What do you think it will find?" After, go through the output together: is each finding real? Is something missing? Offer a fix to the skill or agent for each miss.

Write the result under `## Part 5` in `findings.md`.

✓ 5.3 Try it done

## 5.4 Weekly review-comments job

Suggest it in three lines:

```
**Suggestion: a weekly review-comments job**
What: every week, a job reads the review comments on the week's merged PRs, groups the ones that come back, and posts the findings for the team.
Why: a comment that comes back becomes a rule, hook or test, so nobody has to write it twice.
```

Ask: "Do you want to build it?" On no, go to Part complete. On yes, build it with the same loop:

1. **The skill.** `.claude/skills/review-lessons/SKILL.md`, read-only.
   - Reads the last 7 days of merged PRs and their review comments (check the current docs for the exact calls):
     - GitHub: `gh api` REST calls for merged PRs, their review comments, reviews and issue comments.
     - Azure DevOps: the Azure DevOps MCP server, `repo_pull_request` (`list`) and `repo_pull_request_thread` (`list`, `list_comments`), read-only. Without the server: `az repos pr list --status completed` and the `pullRequestThreads` REST resource.
     - GitLab: `glab api` for merged MRs and their discussions.
   - Skips bots, the author's own replies and empty comments.
   - Groups comments by problem. A finding needs the same problem in at least two PRs; the participant can choose the number.
   - One block per finding:
     ```
     ### <problem>
     - What reviewers said: <the problem, with counts: n comments, n PRs>
     - Where a change could help: <one file: a rule, hook, test, lint config, or "no file change would help">
     - Evidence: <links to single comments>
     ```
   Why: the code files the comments were on are evidence. The answer is the file that stops the problem coming back.
2. **Run it once now** on last week's PRs. Read two evidence links together and check they say what the finding says.
   Why: one real report shows if the grouping works before it runs every week.
3. **Where the findings go.** Ask where the team reads things: a Teams or Slack channel, a Confluence page, a work item. The job posts there with the team's MCP server or CLI (for example the Atlassian MCP server for a Confluence page). This is the only write the job makes.
   Why: a report nobody reads changes nothing.
4. **The schedule.** Ask which way their company allows, and check the current docs for each:
   - A scheduled pipeline in their CI (GitHub Actions `schedule`, Azure Pipelines `schedules`) that runs `claude -p "/review-lessons"`. This needs a Claude credential in CI; the company decides that.
   - A Claude Code scheduled cloud task, if their plan and PR host support it.
   - A local schedule on their own machine (cron or launchd with `claude -p`). It only runs while the machine is on.
   Draft the file (for example the pipeline YAML) in `targets/<name>/`, uncommitted. Don't create any cloud job or pipeline yourself.
   Why: a weekly run finds new patterns without anyone asking.

✓ 5.4 Weekly job done

## Part complete

Set Part 5 to `complete`. Send:

```
✓ Part 5 complete.

**Review:** <skill or agent, path>
**Checks:** <list, one line>
**Weekly job:** <drafted / skipped>

Nothing is committed or pushed to your repo. To keep the drafts, copy them into your own checkout and commit them there yourself. /cleanup removes the copy when you're done.

---

**Next: the hackathon.** Pick one check from today and finish it for your team.
```
