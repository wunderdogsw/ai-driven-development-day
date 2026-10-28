---
name: discover
description: Turn a ticket into precise acceptance criteria backed by evidence, plus a sequence diagram. Use before planning or building a ticket from Jira, Linear, GitHub, Azure Boards or GitLab, for example "/discover JIRA-1234".
argument-hint: <ticket id>
disable-model-invocation: true
allowed-tools: Read Grep Glob Bash(git log *) Bash(git show *) mcp__atlassian__getAccessibleAtlassianResources mcp__atlassian__getJiraIssue mcp__atlassian__listJiraIssueComments mcp__atlassian__searchJiraIssuesUsingJql mcp__atlassian__searchConfluence mcp__atlassian__getConfluenceContent mcp__ado__repo_pull_request mcp__ado__repo_pull_request_thread mcp__figma
---

# Discover: ticket → precise acceptance criteria

You collect evidence, find what is unclear, ask the user until every acceptance criterion (AC) is precise, and write two files. You never change code. The human decides the intent. You find the questions.

Ticket: $ARGUMENTS

## 1. Fetch the ticket

Read the ticket, its comments and its linked issues from the team's tracker, with the MCP server or CLI in [references/sources.md](references/sources.md). Note the title, description, any ACs already written, and the comments.

If the tracker can't be read, ask the user to paste the ticket. Don't guess what it says.

## 2. Collect evidence

Go through every source in [references/sources.md](references/sources.md), with the MCP server or CLI it names. Use only read tools. Search with the words of the ticket. For each thing you find, keep a reference: file and line, commit hash, PR number or ADR id.

At least: the code and tests of the area, `git log` for those files, and every ADR that uses the ticket's words. A source you can't read goes on the "Not checked" list. Don't skip it silently.

## 3. List gaps and conflicts

Before you ask anything, show the list:

```
Gaps (the ticket doesn't say):
- G1 Which phone number formats are accepted?
- G2 What happens on a fast double-click on Save?

Conflicts (two sources disagree):
- C1 The ticket says "phone number". ADR-012 says contact data is stored in E.164.

Not checked:
- Figma (server not connected)
```

If there are more than 8 gaps, the ticket is too big. Suggest how to split it and stop.

## 4. Ask until precise

One question at a time. Each question:

- quotes the evidence that made it a question;
- gives 2–4 concrete options;
- marks one option as recommended only when the evidence supports it.

Save every answer as a decision with who decided it (name or role): `Decision: any E.164 (Product Owner)`. An answer can open a new question. Ask it.

## 5. Write the ACs

Rules and format: [references/ac-format.md](references/ac-format.md). A full worked example: [references/examples.md](references/examples.md).

Check every AC against the five rules before you write it. If one fails, it is a new question for step 4.

## 6. Draw the sequence diagram

Mermaid, as detailed as possible: every actor, call, database write and error path. Label every arrow that serves an AC. A missing arrow is a gap: go back to step 4.

## 7. Write the files

- `plans/<TICKET>/acs.md`
- `plans/<TICKET>/sequence.md`

Write nothing else.

## 8. Hand over

```
plans/JIRA-1234/acs.md — 3 ACs, 1 must-never rule, 0 open questions
plans/JIRA-1234/sequence.md — 4 actors, 3 error paths
Not checked: Figma (server not connected)

Review both files. When they are right, start a fresh session and run /plan JIRA-1234.
```

## Done when

- every AC passes the five rules;
- every AC has evidence or a decision;
- open questions are empty, or the user said to keep them open.
