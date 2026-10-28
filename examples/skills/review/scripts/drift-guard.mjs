#!/usr/bin/env node
// Compares the Files table in plan.md with the files the change touched.
// Usage: node drift-guard.mjs --plan plans/JIRA-1234/plan.md [--base origin/main] [--markdown]
// Exit code 1 when a planned file is missing.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { matches } from "./glob.mjs";

const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i > -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : fallback;
};
const planPath = arg("--plan");
const base = arg("--base", "origin/main");
const markdown = process.argv.includes("--markdown"); // for a PR comment
if (!planPath || !existsSync(planPath)) {
  console.error("Usage: drift-guard.mjs --plan plans/<TICKET>/plan.md [--base origin/main] [--markdown]");
  process.exit(2);
}

// Only the table under "## Files": | File | Change | What | AC |
const lines = readFileSync(planPath, "utf8").split("\n");
const start = lines.findIndex((l) => l.trim().toLowerCase() === "## files");
const planned = [];
for (const line of start < 0 ? [] : lines.slice(start + 1)) {
  if (line.startsWith("## ")) break;
  if (!line.trim().startsWith("|")) continue;
  const cells = line.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim().replace(/^`([^`]*)`$/, "$1"));
  const [file, change = "", what = "", ac = ""] = cells;
  if (!file || /^:?-+:?$/.test(file) || file.toLowerCase() === "file") continue;
  planned.push({ file, change: change.toLowerCase(), what, ac });
}

const git = (...a) => execFileSync("git", a, { encoding: "utf8" }).split("\n").filter(Boolean);
const changed = [...new Set([...git("diff", "--name-only", base), ...git("ls-files", "--others", "--exclude-standard")])];
const hit = (p, c) => (p.file.includes("*") ? matches(c, p.file) : c === p.file || c.endsWith("/" + p.file));

const done = planned.filter((p) => changed.some((c) => hit(p, c)));
const missing = planned.filter((p) => !changed.some((c) => hit(p, c)));
const unplanned = changed.filter((c) => !planned.some((p) => hit(p, c)) && !c.startsWith("plans/"));

const out = [`✓ ${done.length} of ${planned.length} planned files changed`];
for (const c of unplanned) out.push(`! ${c} changed, not in the plan`);
for (const p of missing) out.push(`✗ ${p.file} missing (${p.change}, ${p.what}${p.ac ? `, ${p.ac}` : ""})`);

console.log(markdown ? `### File drift\n\nPlan: \`${planPath}\`\n\n${out.map((l) => `- ${l}`).join("\n")}` : out.join("\n"));
process.exit(missing.length ? 1 : 0);
