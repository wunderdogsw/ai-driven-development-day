#!/usr/bin/env bash
# Fails when a migration can lose data.
# Usage: check-migration.sh <MigrationName>
set -euo pipefail

name="${1:?Usage: check-migration.sh <MigrationName>}"
file=$(ls src/Infrastructure/Migrations/*_"$name".cs 2>/dev/null | grep -v '\.Designer\.cs$' | head -1 || true)
[ -n "$file" ] || { echo "✗ No migration file found for $name"; exit 1; }

# Only the Up() method matters: that is what runs on deploy.
up=$(awk '/void Up\(/{on=1} /void Down\(/{on=0} on{print FNR": "$0}' "$file")
up_raw=$(awk '/void Up\(/{on=1} /void Down\(/{on=0} on' "$file")

fail=0
risky=$(echo "$up" | grep -E 'migrationBuilder\.(DropColumn|DropTable|RenameColumn|RenameTable)' || true)
if [ -n "$risky" ]; then
  echo "✗ Drops or renames a column or table:"
  echo "$risky"
  fail=1
fi

# A column that becomes required without a default fails on existing NULL rows.
required=$(echo "$up_raw" | tr -s '\n ' ' ' | grep -Eo 'AlterColumn<[^;]*;' \
  | grep 'nullable: false' | grep 'oldNullable: true' | grep -v 'defaultValue' || true)
if [ -n "$required" ]; then
  echo "✗ Makes a column required without a default value:"
  echo "$required"
  fail=1
fi

[ "$fail" -eq 0 ] && echo "✓ $name: no data loss found"
exit "$fail"
