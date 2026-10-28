# plan.md format

`/implement`, its hooks and `/review` read this file with scripts. Keep the headings and table columns exactly as shown.

````markdown
# <TICKET>: <title> — plan

Status: approved (<date>)

## Steps
1. <what> in `<file>` → AC1
2. …

## Tests
| AC | Test | File | Command |
|---|---|---|---|
| AC1 | <TestName> | `<path>` | `<command that runs only this test>` |
| Must never | <PropertyTestName> | `<path>` | `<command>` |
| E2E | <spec name> | `<path>` | `<command>` |

## Files
| File | Change | What | AC |
|---|---|---|---|
| `<path>` | edit | <what changes> | AC1 |
| `<path>` | new | <what> | AC1, AC2 |

## Checks
- `<static check command>`

## Risks
- <risk> (step 3)
````

## Rules

- **Status** is written by `/plan` when the human answers yes to "Do you approve this plan?". The file only exists after that. `/implement` refuses a plan without it.
- **Tests** has one row per AC, one per "must never" rule, and one E2E row. The command runs only that test, in seconds.
- **Files** lists every file that will change or be created, test files included.
- **Checks** are commands that finish in seconds. Slow checks belong in CI.
