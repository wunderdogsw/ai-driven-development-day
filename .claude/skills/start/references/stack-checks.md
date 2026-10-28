# Stack checks

Run the checks for each stack you detected. Each check says what to look for and what to suggest if it is missing.

These notes were written in October 2026. Tools change fast. Before you call something missing, check the current official docs. If the docs say something different, follow the docs and mention it.

## Next.js and React: Vercel's skill library only

For Next.js and React, suggest **only skills from Vercel's skill library**. Don't suggest other sources (codemods, `AGENTS.md` blocks, MCP servers, community skills) for these stacks.

**The library** (two repos, installed with the `skills` CLI):

- `vercel-labs/agent-skills` — `npx skills add vercel-labs/agent-skills --skill <name>`
- `vercel/next.js` (folder `skills/`) — `npx skills add vercel/next.js --skill <name>`

**Get the current list first.** The library changes. Before you suggest anything, list both folders and read each skill's `description`:

```bash
curl -s https://api.github.com/repos/vercel-labs/agent-skills/contents/skills
curl -s https://api.github.com/repos/vercel/next.js/contents/skills
curl -s https://raw.githubusercontent.com/vercel-labs/agent-skills/main/skills/<name>/SKILL.md | head -10
curl -s https://raw.githubusercontent.com/vercel/next.js/canary/skills/<name>/SKILL.md | head -10
```

If there's no network, use the list below and say it may be out of date.

**What is already installed.** Look in `.claude/skills/`, `.agents/skills/` and `skills-lock.json`. Match on the skill `name` in each `SKILL.md`.

**Which skills fit** (list from October 2026). Suggest a skill only when the repo shows it needs it:

| Skill | Repo | Suggest when |
|---|---|---|
| `react-best-practices` (`vercel-react-best-practices`) | agent-skills | Any React or Next.js code. Why: the agent follows the same performance rules when it writes and reviews code. |
| `composition-patterns` (`vercel-composition-patterns`) | agent-skills | Shared component libraries, or components with many boolean props. |
| `web-design-guidelines` | agent-skills | UI code the team reviews for accessibility and UX. |
| `react-view-transitions` | agent-skills | Only if the app has page or route animations. |
| `react-native-skills` | agent-skills | Only if the repo has React Native. |
| `next-dev-loop` | next.js | Any Next.js app that runs locally. Why: the agent checks that the page works in a running app, not only that it compiles. |
| `next-bundle-optimizer` | next.js | Next.js apps with large client bundles or slow first load. Read its version need first. |
| `next-cache-components-adoption` | next.js | Next.js apps that don't use Cache Components yet and want to (check `cacheComponents` in `next.config.*`). Suggest as a finding, not a draft: it changes the app. |
| `next-cache-components-optimizer` | next.js | Only if Cache Components is already on. |
| `next-partial-prefetching-adoption` / `-optimizer` | next.js | Only if Cache Components is already on. |

**Version.** Read `next` and `react` in `package.json`. Some skills need a minimum version; check the skill's `SKILL.md` before you suggest it.

**Monorepo.** If the app is in a subfolder (e.g. `web/`), say where the skill should be installed.

**Drafting.** A Vercel skill is not something you write. The draft is the install command, run in `targets/<name>/`, so the files land there uncommitted. Show which files it added.

## TypeScript / JavaScript

- `tsconfig.json` with `"strict": true`? Missing → suggest it as a finding, not a draft (it changes the code base).
- Typecheck command (`tsc --noEmit`), ESLint and Prettier (or Biome) configs and scripts. Suggest: Prettier/Biome on the changed file as a `PostToolUse` hook; `tsc --noEmit` and ESLint in a `Stop` hook.
- Dead code and duplication: Fallow (`fallow`) is an option for TS/JS. Suggest only as a finding.
- React and Next.js guidance comes only from Vercel's skill library (section above).

## .NET

- `Directory.Build.props` or `.csproj`: `<Nullable>enable</Nullable>`, `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>`, `<AnalysisLevel>` / `EnableNETAnalyzers`. Missing → finding, not a draft.
- `.editorconfig` present? Suggest `dotnet format --include <file>` as a `PostToolUse` hook on `*.cs`.
- `dotnet build` and `dotnet test` (or a filtered fast suite) in a `Stop` hook. Keep it fast: a slow Stop hook makes every turn slow.
- EF Core: `Migrations/` folders → suggest a `PreToolUse` hook that blocks hand edits there, and an `add-ef-migration` skill.
- Generated code: generated API clients (NSwag, Kiota, OpenAPI Generator, `*.g.cs`, `*.generated.ts`, folders like `Generated/` or `generated/`) → add them to the same block. Why: a hand edit is lost on the next generation; the agent must change the source (the OpenAPI spec) and generate again.
- Microsoft and Azure docs: check the current docs for Microsoft's official agent tooling (for example the Microsoft Learn MCP server). Prefer the CLI (`dotnet`, `az`) when one exists; MCP costs more tokens.

## PHP

- `composer.json` scripts for test, lint and static analysis.
- PHPStan (`phpstan.neon`, level) or Psalm. Missing → finding. Present → `Stop` hook with the project's command.
- php-cs-fixer or PHP_CodeSniffer config → `PostToolUse` hook on the changed `*.php` file.
- Single-file test command (e.g. `vendor/bin/phpunit <file>`) → worth a line in `CLAUDE.md` if missing.

## Azure / CI

- CI files (`azure-pipelines.yml`, `.github/workflows/`) show the commands the team trusts. Use them for hooks and `CLAUDE.md` commands.
- Deploy steps in CI → suggest a `deploy-staging` skill with `disable-model-invocation: true` (only a human can start it), only if they ask for deploy help.

## Subagents (slide 21)

Suggest a subagent only for one focused job with its own tools. It is not smarter, it is focused and fresh, and it costs extra tokens. Good fits for this stack:

- **Security reviewer** for the .NET API: auth checks and input validation on changed endpoints. Tools: `Read, Grep, Glob`.
- **Migration checker**: reads a new EF Core migration for data loss and locking on large tables. Tools: `Read, Grep, Glob`.
- **Test writer**: writes tests from acceptance criteria, before the code. Tools: `Read, Grep, Glob, Write, Bash`.

Skip this if the repo already has subagents for these jobs. Check their `description` and `tools` in Part 3.

## Hooks: keep guarantees few (slide 23)

Count the hooks in `.claude/settings.json`. For each, ask: does this rule have zero exceptions?

- **Zero exceptions** ("never edit `Migrations/` by hand", "format every edited file") → a hook is right.
- **Has exceptions** ("prefer named exports", "keep components small") → it should be a rule in `CLAUDE.md` or `.claude/rules/`, where Claude can judge. Suggest moving it.
- **The other way:** a rule in `CLAUDE.md` with zero exceptions that Claude broke (it is in a review comment or the user says so) → suggest a hook.

More than about 10 hooks usually means preferences became hooks. Each hook is code to maintain.

## MCP servers: risks (slide 25)

When you suggest or find an MCP server, also check, and say in one line each:

- **Context cost:** each tool costs about 550–1,400 tokens before any work. Count the tools in `/mcp`. Many servers → suggest turning off the ones the team doesn't use.
- **Trust:** only official servers or ones the company approved. A server from an unknown author runs with your access.
- **Prompt injection:** a server that reads outside content (tickets, wiki pages, web pages, emails) can bring in hidden instructions. Use read-only mode, pre-approve only read tools, and never pre-approve write tools on those servers.
- **Reliability:** remote servers time out. Skills should say what to do when a server is not connected.

## Every repo

- `CLAUDE.md` exists and is under 200 lines, with real commands (test, one test, lint, run).
- Each command in `CLAUDE.md` exists in the repo (check `package.json`, `composer.json`, scripts, CI).
- One `.claude/rules/<area>.md` with `paths:` per stack area in a multi-stack repo.
- `.mcp.json` servers: is there a good CLI that does the same job? If yes, suggest the CLI (fewer tokens).
- Systems the team uses with no good CLI: suggest the official MCP server in the project `.mcp.json`, read-only where possible. Pick by the team's tools: Atlassian Rovo MCP (Jira, Confluence), Linear MCP (read-only endpoint), Notion MCP, the remote Azure DevOps MCP server (boards, PR threads; `X-MCP-Readonly: true`), the Azure MCP server (logs), Figma MCP (designs), Playwright MCP (drive the web app), and a read-only server for the dev database. Check the current docs of each server before you suggest it. Why: the agent reads the real ticket, decisions, errors and screens instead of guessing.
- `.claude/settings.json` committed, with hooks and an allow list. `settings.local.json` is personal and should be gitignored.

## Where the setup lives (slides 27–30)

- **Personal setup the team needs.** Check `CLAUDE.local.md` and, if the participant agrees, their `~/.claude/` skills and agents. Anything the team needs (a test command, a skill) belongs in the repo. Suggest moving it. Don't change user-level files.
- **Many teams, one setup.** If the company has many teams on the same stack, mention once: shared skills, agents and hooks go into a plugin marketplace, security rules into managed settings, approved MCP servers into org connectors. One setup for every team, set up by the platform team, not in this repo.

## Evals (slides 31–36)

Suggest evals for every skill you draft (2.5), and say how the team grows them after today:

- **Start from real failures:** bugs, review comments, failed agent runs, manual checks the team already does. 20–50 tasks is enough.
- **With and without:** measure each skill with and without it. The difference is what it adds.
- **Grade the outcome, not the claim:** check the end state (tests pass 10 of 10, the file exists), not what the agent says. Code graders first.
- **Rerun** on every setup change and every new model.
- **When a score is low, read the transcripts** before changing the skill. Fix unclear tasks and graders that are too strict, not only the agent.
