#!/usr/bin/env node
// PreToolUse hook: during the build phase of /implement, block edits to the
// approved test files, the intent files and the marker itself. Exit 2 blocks.
import { relative, resolve } from "node:path";
import { readMarker, readPlan, root } from "./plan.mjs";

let raw = "";
for await (const chunk of process.stdin) raw += chunk;
let input = {};
try { input = JSON.parse(raw || "{}"); } catch {}

const marker = readMarker();
if (!marker || marker.phase !== "build") process.exit(0);

const plan = readPlan(marker.ticket);
const locked = new Set([
  "plans/.implementing",
  `plans/${marker.ticket}/acs.md`,
  `plans/${marker.ticket}/sequence.md`,
  `plans/${marker.ticket}/plan.md`,
  ...(plan?.tests ?? []).map((t) => t.file),
]);

const block = (what) => {
  process.stderr.write(
    `Locked by /implement: ${what} was approved before the build started. ` +
      `Fix the code, not the test or the plan. If you think it is wrong, stop and explain why to the user.\n`,
  );
  process.exit(2);
};

// Edit / Write: check the file path.
const target = input.tool_input?.file_path ?? input.tool_input?.notebook_path;
if (typeof target === "string") {
  const rel = relative(root, resolve(root, target)).split("\\").join("/");
  if (locked.has(rel)) block(rel);
}

// Bash: block shell commands that write to a locked file (sed -i, >, tee, mv, cp, rm, git checkout/restore).
const command = input.tool_input?.command;
if (typeof command === "string") {
  const writes = /(sed\s+-i|>>?|\btee\b|\bmv\b|\bcp\b|\brm\b|git\s+(checkout|restore|stash))/;
  for (const f of locked) if (command.includes(f) && writes.test(command)) block(f);
}
process.exit(0);
