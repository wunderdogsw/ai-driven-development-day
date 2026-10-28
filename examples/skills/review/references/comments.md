# Writing review comments

## Rules

1. **One problem per comment**, on the line where it is.
2. **Label first**, from [Conventional Comments](https://conventionalcomments.org): `issue (blocking):`, `issue (non-blocking):`, `suggestion (non-blocking):`, `question:`, `nitpick:`. The reader knows at once if it must be fixed.
3. **What, then why.** One sentence on what is wrong. One or two on why it matters: the AC, the rule, or what breaks.
4. **Evidence.** The line, the test, the command output. The reader can check it in seconds.
5. **A fix when you have one**, as a code block. Keep it small.
6. **About the code, not the person.** "This line saves…", not "You save…".
7. **Plain words. No praise padding, no "just", no "obviously".**
8. **Unsure? Ask.** A `question:` comment says what you checked and what you don't know.

## PR comments

These go on the file and line in the PR. Azure DevOps and GitHub render the markdown. On GitHub, a ` ```suggestion ` block lets the author apply the fix with one click.

### Blocking issue

````markdown
**issue (blocking):** An empty phone number is saved as `""`, not removed.

AC3 says an empty field removes the phone number. This line stores `request.Phone ?? ""`, so the user still has a phone value, and `""` breaks the "always E.164" rule.

```csharp
user.Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone;
```

Found by review-logic and ac-verifier (no AC3 test).
````

### Missing test

```markdown
**issue (blocking):** AC3 has no test.

`plan.md` lists `ProfilePhoneTests.RemovePhone` for AC3. It is not in `ProfilePhoneTests.cs`. Add it before the fix above, so the test fails first.
```

### Flaky test

```markdown
**issue (blocking):** `ProfilePhoneTests.RateLimit` is flaky: it passed 2 of 3 runs.

It sends three saves and expects the third to get 429 within 1 second, using the real clock. On a slow run the window passes before the third save. Use the fake `TimeProvider` the other rate limit tests use (`tests/Api.Tests/Support/FakeTime.cs`), so the test controls the time.
```

### Non-blocking suggestion

````markdown
**suggestion (non-blocking):** Use the existing E.164 helper.

`PhoneNumber.IsE164()` in `Shared/Contact/PhoneNumber.cs:12` already does this check, with tests. A second regex here can drift from it.

```csharp
RuleFor(x => x.Phone).Must(PhoneNumber.IsE164).When(x => x.Phone is not null);
```
````

### Question

```markdown
**question:** Should the rate limit be per user or per session?

AC2 says "a logged-in user". The policy here partitions by session id (`Program.cs:88`), so one user with two tabs gets 4 saves per second. review-code and review-logic read this differently, so a human should decide.
```

### Diagram drift

```markdown
**question:** This adds a cache write that the plan doesn't have.

The sequence diagram in the plan ends with `API → DB: UPDATE Users`. The diagram redrawn from the code also has `API → Cache: SET profile` here, and `ProfileService.cs` is changed but not in the plan's file table. Was the cache part of the design? If yes, add it to `sequence.md` and `plan.md`. If not, remove it from this change.

Found by flow-verifier and drift-guard.
```

### Nitpick

```markdown
**nitpick:** `phoneNr` → `phoneNumber`, like the rest of the file.
```

### Summary comment (one per PR)

```markdown
## Review: JIRA-1234 · grade Large · needs a human

**Evidence**
- AC1 → `ProfilePhoneTests.InvalidPhone` → passed
- AC2 → `ProfilePhoneTests.RateLimit` → passed
- AC3 → no test → **missing**
- Must never → `PhoneProperties` (1,000 inputs) → passed
- E2E → `web/e2e/profile.spec.ts` → passed 3 of 3 runs, trace attached (`e2e-trace.zip`)
- Flaky tests: none
- Screenshots: AC1, AC2 (AC3 not shown: not built)
- SonarCloud quality gate: passed

**Checks:** eslint failed on `ProfileForm.tsx:48`. Drift: `Shared/StringUtils.cs` changed, not in the plan.

**Diagram** (redrawn from the code, compared with `sequence.md`)

| Arrow | Result |
|---|---|
| API → DB: UPDATE Users SET Phone = NULL (AC3) | missing |
| API → Cache: SET profile | new, not in the plan |
| API → Web: 200 OK | changed: now returns the profile body |
| 4 other arrows | match |

**Blocking (2):** AC3 saves `""` instead of removing the phone. AC3 has no test.
**Questions (1):** rate limit per user or per session.

Reviewed by 5 independent subagents and cross-checked with CodeRabbit's comments. Each blocking item was found by at least two sources, or checked by running the code.
```

## Not yet a PR: `review.md`

Same comments, in one local file. The author, or the agent that built the change, works through it from the top.

````markdown
# Review: JIRA-1234 (not yet a PR)

Grade: Large · needs a human when the PR opens

## Fix list
1. [ ] **blocking** `src/Api/Profile/ProfileService.cs:57` — empty phone saved as `""` (AC3)
2. [ ] **blocking** `tests/Api.Tests/ProfilePhoneTests.cs` — add `RemovePhone` test for AC3, before fix 1
3. [ ] **question** `src/Api/Profile/ProfileService.cs:72` — new cache write, not in the plan or the diagram
4. [ ] **non-blocking** `src/Api/Profile/ProfileRequestValidator.cs:21` — use `PhoneNumber.IsE164()`
5. [ ] **question** `src/Api/Program.cs:88` — rate limit per user or per session?

## Diagram

Plan vs code: 4 match, 1 missing (AC3), 1 new (API → Cache), 1 changed (200 OK body). Full table: `sequence-from-code.md`.

## Comments by file

### src/Api/Profile/ProfileService.cs:57
**issue (blocking):** An empty phone number is saved as `""`, not removed.
AC3 says an empty field removes the phone number. …

## Rejected findings
- C4 "N+1 query in ProfileService.Get" — rejected: `Include(u => u.Addresses)` on line 31 loads it in one query.
````

## Bad → good

| Bad | Why it fails | Good |
|---|---|---|
| "This is wrong." | No what, no why, no fix. | `issue (blocking):` + what + AC + fix |
| "Why did you do it like this??" | About the person, sounds like blame, no question to answer. | `question:` + what you checked + the exact thing you don't know |
| "Maybe consider possibly refactoring this a bit?" | No label, no reason, can't be acted on. | `suggestion (non-blocking):` + the helper that exists + the code |
| "LGTM 👍" on a change with no AC3 test | Approves without evidence. | The summary comment with the evidence list |
| 12 nitpicks and 1 blocker mixed together | The blocker gets lost. | Blocking first, nitpicks last or left out |
