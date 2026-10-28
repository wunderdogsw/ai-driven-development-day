# JIRA-1234: Phone number on profile — plan

Status: approved (2026-10-28)

## Steps
1. Write the tests in the Tests table. Run them. They must fail. → AC1, AC2, AC3, Must never
2. Add `Phone` (nvarchar(20), optional) to `User` with the `add-ef-migration` skill. → AC1
3. Add the E.164 rule to `ProfileRequestValidator.cs`, using `PhoneNumber.IsE164()` from `Shared/Contact/PhoneNumber.cs`. → AC1
4. In `ProfileService.cs`, save an empty phone as `NULL`. → AC3
5. Add the rate limit policy `profile-save` (2 per second, per user) in `Program.cs` and use it on `PUT /profile`. → AC2
6. Add the phone field and the "Invalid phone number" error to `ProfileForm.tsx`. → AC1, AC3
7. Add the changelog entry. → all

## Tests
| AC | Test | File | Command |
|---|---|---|---|
| AC1 | ProfilePhoneTests.InvalidPhone | `tests/Api.Tests/Profile/ProfilePhoneTests.cs` | `dotnet test tests/Api.Tests --filter "FullyQualifiedName~ProfilePhoneTests.InvalidPhone"` |
| AC2 | ProfilePhoneTests.RateLimit | `tests/Api.Tests/Profile/ProfilePhoneTests.cs` | `dotnet test tests/Api.Tests --filter "FullyQualifiedName~ProfilePhoneTests.RateLimit"` |
| AC3 | ProfilePhoneTests.RemovePhone | `tests/Api.Tests/Profile/ProfilePhoneTests.cs` | `dotnet test tests/Api.Tests --filter "FullyQualifiedName~ProfilePhoneTests.RemovePhone"` |
| Must never | PhoneProperties.AlwaysE164 | `tests/Api.Tests/Profile/PhoneProperties.cs` | `dotnet test tests/Api.Tests --filter "FullyQualifiedName~PhoneProperties"` |
| E2E | profile phone | `web/e2e/profile-phone.spec.ts` | `npx playwright test web/e2e/profile-phone.spec.ts --trace on` |

## Files
| File | Change | What | AC |
|---|---|---|---|
| `src/Domain/Entities/User.cs` | edit | `Phone` property | AC1 |
| `src/Infrastructure/Persistence/Configurations/UserConfiguration.cs` | edit | max length 20 | AC1 |
| `src/Infrastructure/Migrations/*_AddPhoneToUsers.cs` | new | migration (generated) | AC1 |
| `src/Api/Profile/ProfileRequestValidator.cs` | edit | E.164 rule | AC1 |
| `src/Api/Profile/ProfileService.cs` | edit | empty → NULL | AC3 |
| `src/Api/Program.cs` | edit | rate limit policy | AC2 |
| `web/app/profile/ProfileForm.tsx` | edit | phone field, error text | AC1, AC3 |
| `tests/Api.Tests/Profile/ProfilePhoneTests.cs` | new | one test per AC | AC1, AC2, AC3 |
| `tests/Api.Tests/Profile/PhoneProperties.cs` | new | property test | Must never |
| `web/e2e/profile-phone.spec.ts` | new | main flow | AC1 |
| `CHANGELOG.md` | edit | entry | all |

## Checks
- `dotnet build src/Api --no-restore -warnaserror`
- `npx tsc --noEmit -p web`
- `npx eslint web/app/profile`

## Risks
- The migration adds a column to `Users`, a large table. Check the SQL before deploy. (step 2)
- The rate limit partitions by user id. Two tabs share the limit, which is what AC2 says. (step 5)
