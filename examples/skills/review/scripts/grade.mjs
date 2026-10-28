#!/usr/bin/env node
// Grades a change from its file list with the rules in references/grading.json.
// Usage: node grade.mjs [--base origin/main] [--json]
// Prints the grade and the rule that set it. Same input, same grade, every time.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { matches } from "./glob.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const rules = JSON.parse(readFileSync(join(here, "..", "references", "grading.json"), "utf8"));
const i = process.argv.indexOf("--base");
const base = i > -1 ? process.argv[i + 1] : "origin/main";

const git = (...a) => execFileSync("git", a, { encoding: "utf8" }).split("\n").filter(Boolean);
const files = [...new Set([...git("diff", "--name-only", base), ...git("ls-files", "--others", "--exclude-standard")])]
  .filter((f) => !f.startsWith("plans/"));

const hits = (globs) => files.filter((f) => globs.some((g) => matches(f, g)));
const projects = new Set(files.map((f) => Object.keys(rules.projects).find((p) => matches(f, rules.projects[p]))).filter(Boolean));

let grade, reason;
const critical = hits(rules.critical);
const logic = hits(rules.businessLogic);
if (critical.length) [grade, reason] = ["Critical", `touches ${critical[0]}`];
else if (files.length > rules.mediumMaxFiles) [grade, reason] = ["Large", `${files.length} files (more than ${rules.mediumMaxFiles})`];
else if (projects.size > 1) [grade, reason] = ["Large", `${projects.size} projects: ${[...projects].join(", ")}`];
else if (logic.length) [grade, reason] = ["Large", `business logic in ${logic[0]}`];
else if (files.length > rules.smallMaxFiles) [grade, reason] = ["Medium", `${files.length} files, no business logic`];
else [grade, reason] = ["Small", `${files.length} files, no business logic`];

const action = rules.actions[grade];
if (process.argv.includes("--json")) console.log(JSON.stringify({ grade, reason, action, files: files.length }));
else console.log(`Grade: ${grade} (${reason})\nAction: ${action}`);
