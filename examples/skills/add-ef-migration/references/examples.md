# Examples

## 1. Goes through

**Request:** "We need to store a phone number for users. Max 20 characters, optional."

**What you do:**

1. One line: `User.Phone, string, max 20, optional`.
2. Add `public string? Phone { get; set; }` to `src/Domain/Entities/User.cs`.
3. In `UserConfiguration.cs`: `builder.Property(u => u.Phone).HasMaxLength(20);`
4. `dotnet ef migrations add AddPhoneToUsers --project src/Infrastructure --startup-project src/Api`
5. Check script: passed.
6. `devdb`: `Users` in the dev database matches the model snapshot.
7. SQL: `ALTER TABLE [Users] ADD [Phone] nvarchar(20) NULL;` Only what was asked.
8. Tests: passed.

**Report:**

```
Migration: AddPhoneToUsers
Model: User.Phone (nvarchar(20), optional)
Check: passed, no data loss
Schema: matches dev database (devdb)
SQL: ALTER TABLE [Users] ADD [Phone] nvarchar(20) NULL;
Tests: dotnet test --filter Category=Migrations → Passed 12, Failed 0
```

## 2. Stops for a question

**Request:** "Remove the Fax column from Customers, nobody uses it."

**What you do:** Don't generate anything yet. Removing a column deletes data. Count it first with the `devdb` MCP server:

```sql
SELECT COUNT(*) AS total, COUNT(Fax) AS with_fax FROM Customers;
```

Result: 52,310 customers, 1,204 with a fax number. Then ask:

> Removing `Customer.Fax` deletes the fax number of 1,204 customers (dev database). `git log -S Fax` shows the code last wrote it in 2023. How do you want to do it?
> a) Remove it now (data is lost)
> b) Stop using it in code first, remove the column in a later release
> c) Keep it

Go on only after the user answers. Write the answer in the report as `Decision: <answer> (<name>)`.

## 3. Not a migration

**Request:** "Set all customers without a country to Finland."

**What you do:** Stop. This changes rows, not the model. Say:

> This is a data fix, not a migration. It needs a SQL script that a human reviews and runs. I won't add a migration for it.
