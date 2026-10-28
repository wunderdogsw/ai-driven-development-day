# Sources

Where the evidence for a ticket lives, and how to read it. Every tool here only reads. Keep the rows for the tools your team uses and delete the rest.

The rule from Part 2: use a CLI when there is a good one (it costs fewer tokens). Use an MCP server for systems with no good CLI, and for tools you use often. MCP server names (`atlassian`, `linear`, `ado`, `azure`, `figma`, `notion`) are the names in the repo's `.mcp.json`.

## Tickets: pick your tracker

Use the row for the team's tracker. Change `allowed-tools` in `SKILL.md` to match: pre-approve only the read tools.

| Tracker | Read the ticket, comments and links | Search related tickets | Pre-approve |
|---|---|---|---|
| Jira | Atlassian Rovo MCP: `getAccessibleAtlassianResources` once (for the `cloudId`), then `getJiraIssue`, `listJiraIssueComments`. Fallback: `acli jira workitem view <id> --fields '*all' --json` | `searchJiraIssuesUsingJql` | `mcp__atlassian__getJiraIssue` and the other read tools |
| Linear | Linear MCP, read-only endpoint `https://mcp.linear.app/mcp/readonly`. Tool names: check `/mcp` | the server's issue search | `mcp__linear` (the whole server is safe on the read-only endpoint) |
| GitHub Issues | `gh issue view <n> --comments --json title,body,comments,labels`. Sub-issues and links: `gh api repos/{owner}/{repo}/issues/<n>/sub_issues` | `gh issue list --search "<words>" --state all` | `Bash(gh issue view *) Bash(gh issue list *)` |
| Azure Boards | Azure DevOps MCP: `wit_work_item` (`get`, `list_comments`). Fallback: `az boards work-item show --id <id>` | `search_workitem` | `mcp__ado__wit_work_item mcp__ado__search_workitem` |
| GitLab issues | `glab issue view <n> --comments` | `glab issue list --search "<words>"` | `Bash(glab issue view *) Bash(glab issue list *)` |

GitHub and GitLab have good CLIs, so use them. Jira, Linear and Azure Boards have more in the MCP server (comments, links, structured fields).

## PRs and review comments

| Host | Read merged PRs and their review threads |
|---|---|
| GitHub | `gh pr list --state merged --search "<words>"`, `gh pr view <n> --comments`, review comments with `gh api repos/{owner}/{repo}/pulls/<n>/comments` |
| Azure DevOps | Azure DevOps MCP: `repo_pull_request` (`list`, `get`), `repo_pull_request_thread` (`list`, `list_comments`) |
| GitLab | `glab mr list --merged --search "<words>"`, `glab mr view <n> --comments` |

## Decisions and docs

| Where | Read with |
|---|---|
| ADRs in the repo | `Read` and `Grep` in `docs/adr/` |
| Confluence | Atlassian Rovo MCP: `searchConfluence` (CQL), `getConfluenceContent` |
| Notion | Notion MCP: search and fetch pages |
| Azure DevOps wiki | Azure DevOps MCP, wiki tools |
| Linear documents | Linear MCP |

## The rest

| Source | What it tells | How to read it | Why this way |
|---|---|---|---|
| Code and tests | How it works today | `Grep` and `Read` in `src/Api/`, `backend/`, `web/` and their test folders | Built-in tools, no server needed |
| Commit history | What changed, when, and why | `git log --oneline -n 30 -- <files>`, `git log -S "<word>" --oneline` | git is the best tool for this |
| Logs | Real errors in the area | Azure MCP: the monitor log query tool, KQL on the Log Analytics workspace, last 14 days | Real errors show missing error cases |
| Designs | What the user sees | Figma MCP: the frame linked in the ticket | Exact texts and states, not a guess from a screenshot |
| Architecture | System boundaries | `docs/architecture/*.dsl` (C4) | Files in the repo |
| CI | What runs on every change | `azure-pipelines.yml`, `.github/workflows/`, `.gitlab-ci.yml` | Files in the repo |

## Set up once, for the whole team

- Add the servers to the repo's `.mcp.json` so every teammate gets the same ones. Use the official servers (Atlassian Rovo, Linear, Azure DevOps, Azure, Figma, Notion), and their read-only endpoint or mode where they have one.
- Turn on read-only mode where the server has one. For Azure DevOps, send the `X-MCP-Readonly: true` header.
- This skill pre-approves only read tools. A write tool, if it is ever called, still asks the user.
- The Azure MCP log query tool is not pre-approved, because its name differs between server versions. Check the name in `/mcp`, then add it to `allowed-tools`.

## Order

1. Ticket, comments and linked issues.
2. Code and tests: what exists today.
3. ADRs, wiki and architecture: what was decided.
4. Commit history and past PRs: why it is the way it is, and what broke before.
5. Logs and designs: what happens in production, and what the user sees.

## When a source can't be read

The server is not connected, sign-in failed, or there is no access. Put it on the "Not checked" list with the reason. Don't skip it silently and don't read it some other way.

## What counts as evidence

A reference someone else can open: `src/Api/Profile/ProfileRequestValidator.cs:42`, `a1b2c3d`, `PR #482`, `ADR-012`, a ticket id (`PROF-881`, `ENG-142`, `#311`), a Figma frame link, a KQL query and its result count. "It seems that" is not evidence.
