# Checks

Run only the stacks the change touches. Each command must finish in seconds. If one is slow, run it on the changed project or files only.

## .NET (`src/`, `tests/`)

| Check | Command |
|---|---|
| Build with analyzers | `dotnet build src/Api --no-restore -warnaserror` |
| One test | `dotnet test tests/Api.Tests --filter "FullyQualifiedName~<TestName>"` |
| Property tests | `dotnet test tests/Api.Tests --filter Category=Properties` |

## PHP (`backend/`)

| Check | Command |
|---|---|
| Static analysis | `vendor/bin/phpstan analyse --no-progress --error-format=raw <changed files>` |
| One test | `vendor/bin/phpunit --filter <TestName>` |

## Next.js (`web/`)

| Check | Command |
|---|---|
| Types | `npx tsc --noEmit -p web` |
| Lint | `npx eslint <changed files>` |
| Dead code, duplication | `npx fallow` (in `web/`) |
| E2E main flow | `npx playwright test <spec file>` |

## Quality gate

If the repo uses SonarCloud, read the quality gate result for the branch or PR (coverage on new code, duplication, complexity, security hotspots) from the SonarCloud project page or its API. A failed gate is a mechanical finding (`M`). It covers .NET, PHP and TypeScript with one gate.

## By reading

For .NET and PHP there is no Fallow. Read the changed code for:

- a new method or class nothing calls;
- a block of 6+ lines that is the same as code that already exists (search for it);
- a method longer than 40 lines, or nested more than 3 levels;
- a new helper that does what an existing helper already does (search `Shared/`, `backend/src/Support/`).
