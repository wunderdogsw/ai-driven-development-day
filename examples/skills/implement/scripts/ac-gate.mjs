#!/usr/bin/env node
// Stop hook: Claude can only finish /implement when every test command and
// check in plan.md passes. Exit 2 sends Claude back to work with the output.
import { execSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { markerPath, readMarker, readPlan, root } from "./plan.mjs";

const MAX_ATTEMPTS = 5;

const marker = readMarker();
if (!marker || marker.phase !== "build") process.exit(0); // not building: nothing to gate

const plan = readPlan(marker.ticket);
if (!plan) {
  process.stderr.write(`AC gate: plans/${marker.ticket}/plan.md is missing.\n`);
  process.exit(2);
}

const runs = [
  ...plan.tests.map((t) => ({ label: `${t.ac} ${t.name}`, command: t.command })),
  ...plan.checks.map((c) => ({ label: "check", command: c })),
];

const failed = [];
for (const r of runs) {
  try {
    execSync(r.command, { cwd: root, stdio: "pipe", timeout: 300_000 });
  } catch (e) {
    const out = `${e.stdout ?? ""}${e.stderr ?? ""}`.trim().split("\n").slice(-15).join("\n");
    failed.push(`✗ ${r.label}: ${r.command}\n${out}`);
  }
}
const missing = plan.files
  .filter((f) => f.change === "new" && !f.file.includes("*") && !existsSync(join(root, f.file)))
  .map((f) => `✗ planned new file missing: ${f.file}`);

const attemptsFile = join(root, "plans", marker.ticket, ".gate-attempts");

if (failed.length === 0 && missing.length === 0) {
  rmSync(markerPath, { force: true });
  rmSync(attemptsFile, { force: true });
  process.exit(0); // all green: Claude may finish, hooks go quiet
}

const attempts = (existsSync(attemptsFile) ? Number(readFileSync(attemptsFile, "utf8")) || 0 : 0) + 1;
writeFileSync(attemptsFile, String(attempts));

const summary = [...missing, ...failed].join("\n\n");
if (attempts >= MAX_ATTEMPTS) {
  // Let Claude stop, and tell the human. The marker stays, so the lock stays on.
  process.stdout.write(JSON.stringify({
    systemMessage: `AC gate: still failing after ${attempts} tries. A human needs to look.\n\n${summary}`,
  }));
  process.exit(0);
}

process.stderr.write(
  `AC gate (try ${attempts} of ${MAX_ATTEMPTS}): you can't finish yet. ` +
    `${failed.length + missing.length} of ${runs.length + missing.length} items fail. Fix the code, not the tests.\n\n${summary}\n`,
);
process.exit(2);
