---
name: add-ef-migration
description: Add an EF Core migration for a model change in the .NET API, and test it. Use when someone asks to add, change or remove a column, table, index or relation in the database.
allowed-tools: Read Grep Glob Bash(dotnet ef migrations add *) Bash(dotnet ef migrations remove *) Bash(dotnet ef migrations script *) Bash(dotnet test *) Bash(${CLAUDE_SKILL_DIR}/scripts/check-migration.sh *) mcp__devdb
---

# Add an EF Core migration

Change the model, let EF Core generate the migration, check it for data loss, and test it. You never write or edit a migration file by hand. A hook blocks edits in `Migrations/`.

## Before you start

- Write down in one line what changes: entity, property, type, required or optional.
- **Stop and ask** if the change removes or renames a column or table. A human decides about data loss. Before you ask, count the rows that have data in that column with the `devdb` MCP server (read-only, dev database), so the question shows what would be lost.
- Not for data fixes (changing rows). Those need a script and a human review. Say so and stop.

## Steps

1. **Change the model.** Edit the entity in `src/Domain/Entities/` and its configuration in `src/Infrastructure/Persistence/Configurations/<Entity>Configuration.cs`. Set length, required and indexes in the configuration, not with attributes.
2. **Name the migration.** PascalCase, verb + what + where: `AddPhoneToUsers`, `CreateOrderNotesTable`, `AddIndexOnOrdersCreatedAt`.
3. **Generate it.**
   ```bash
   dotnet ef migrations add <Name> --project src/Infrastructure --startup-project src/Api
   ```
4. **Check it.**
   ```bash
   ${CLAUDE_SKILL_DIR}/scripts/check-migration.sh <Name>
   ```
   It fails on dropped or renamed columns and tables, and on a column that becomes required without a default. If it fails, stop and show the user the lines it printed.
5. **Read the SQL.**
   ```bash
   dotnet ef migrations script <PreviousName> <Name> --project src/Infrastructure --startup-project src/Api
   ```
   The SQL must do only what the request asked. Anything else: stop and ask.
6. **Compare with the real schema.** Use the `devdb` MCP server to read the table as it is in the dev database. If it differs from the model snapshot (a column someone added by hand), stop and ask.
7. **Test it.**
   ```bash
   dotnet test tests/Infrastructure.Tests --filter Category=Migrations
   ```
   These tests apply every migration to an empty database, then roll the newest one back.
8. **Report** in the format below.

## If something goes wrong

- **Wrong migration generated** → `dotnet ef migrations remove --project src/Infrastructure --startup-project src/Api`, fix the model, generate again. Never edit the file.
- **`AppDbContextModelSnapshot.cs` changed** → expected. It is generated with every migration.
- **`dotnet ef` fails to build** → fix the model code first. The tool needs a project that builds.
- **`devdb` MCP server not connected** → skip the data count and the schema check, and say so in the report. Don't connect to a database any other way.

## Report

```
Migration: AddPhoneToUsers
Model: User.Phone (nvarchar(20), optional)
Check: passed, no data loss
Schema: matches dev database (devdb)
SQL: ALTER TABLE [Users] ADD [Phone] nvarchar(20) NULL;
Tests: dotnet test --filter Category=Migrations → Passed 12, Failed 0
```

## Examples

[references/examples.md](references/examples.md) has three requests: one that goes through, one that stops for a question, and one that is not a migration.
