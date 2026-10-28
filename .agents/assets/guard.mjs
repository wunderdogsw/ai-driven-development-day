#!/usr/bin/env node
/**
 * Hands-on guard: nothing is committed or pushed to a participant's repo.
 *
 * Claude Code PreToolUse hook (.claude/settings.json). Reads the hook JSON on stdin.
 * Exit code 2 blocks the tool call and sends stderr to Claude as the reason.
 *
 * Blocks, in any git repo other than this workshop repo:
 *   git commit / push / merge / rebase / tag / cherry-pick / am / revert / reset --hard /
 *   update-ref / filter-branch / filter-repo, and opening or merging PRs (gh, glab, az repos).
 * Blocks Edit / Write in the participant's original checkout (the `source` in a profile).
 * Work in targets/<name>/ (the worktree) is allowed, but stays uncommitted.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const BLOCKED_GIT = new Set(["commit", "push", "merge", "rebase", "tag", "cherry-pick", "am", "revert", "update-ref", "filter-branch", "filter-repo", "commit-tree"]);

function segments(line) {
  return line.split(/&&|\|\||;|\||\n/).map((s) => s.trim()).filter(Boolean);
}

function tokens(seg) {
  const out = [];
  for (const m of seg.matchAll(/"([^"]*)"|'([^']*)'|(\S+)/g)) out.push(m[1] ?? m[2] ?? m[3]);
  return out;
}

function commonDir(dir) {
  try {
    return execFileSync("git", ["-C", dir, "rev-parse", "--path-format=absolute", "--git-common-dir"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

const workshopCommon = commonDir(ROOT);

/** True when `dir` is a git repo that is not this workshop repo. */
function isForeignRepo(dir) {
  if (!existsSync(dir)) return false;
  const c = commonDir(dir);
  return Boolean(c) && c !== workshopCommon;
}

export function checkCommand(line, cwd, foreign = isForeignRepo) {
  const problems = [];
  let dir = cwd;
  for (const seg of segments(line)) {
    let t = tokens(seg);
    while (t.length && /^[A-Z_][A-Z0-9_]*=/.test(t[0])) t = t.slice(1); // env assignments
    if (t[0] === "cd" && t[1]) {
      dir = isAbsolute(t[1]) ? t[1] : resolve(dir, t[1]);
      continue;
    }
    if (t[0] === "git") {
      let i = 1;
      let gdir = dir;
      while (i < t.length && t[i].startsWith("-")) {
        if (t[i] === "-C") {
          gdir = isAbsolute(t[i + 1]) ? t[i + 1] : resolve(gdir, t[i + 1]);
          i += 2;
        } else if (t[i] === "-c") i += 2;
        else i++;
      }
      const sub = t[i];
      const rest = t.slice(i + 1);
      const blocked = BLOCKED_GIT.has(sub) || (sub === "reset" && rest.includes("--hard"));
      if (blocked && foreign(gdir)) problems.push(`"git ${sub}" in ${gdir}`);
      continue;
    }
    const pr =
      (t[0] === "gh" && t[1] === "pr" && ["create", "merge", "edit", "ready"].includes(t[2])) ||
      (t[0] === "glab" && t[1] === "mr" && ["create", "merge", "update"].includes(t[2])) ||
      (t[0] === "az" && t[1] === "repos" && t[2] === "pr" && ["create", "update", "set-vote"].includes(t[3]));
    if (pr) problems.push(`"${t.slice(0, 4).join(" ")}" opens or changes a PR`);
  }
  return { allowed: problems.length === 0, problems };
}

function sources() {
  const dir = join(ROOT, ".workshop", "targets");
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir)) {
    const f = join(dir, name, "profile.json");
    if (!existsSync(f)) continue;
    try {
      const p = JSON.parse(readFileSync(f, "utf8"));
      if (typeof p.source === "string" && isAbsolute(p.source)) out.push(resolve(p.source));
    } catch {}
  }
  return out;
}

export function checkWrite(filePath, srcs = sources()) {
  if (typeof filePath !== "string" || !filePath) return { allowed: true, problems: [] };
  const abs = resolve(filePath);
  const targets = join(ROOT, "targets") + sep;
  if (abs.startsWith(targets)) return { allowed: true, problems: [] };
  for (const s of srcs) {
    if (abs === s || abs.startsWith(s + sep)) return { allowed: false, problems: [`${abs} is in your original checkout; drafts go in targets/<name>/`] };
  }
  return { allowed: true, problems: [] };
}

export function explain(problems) {
  return `Blocked by the hands-on guard: ${problems.join("; ")}. Nothing is committed or pushed to your repo during the day. Drafts stay uncommitted in targets/<name>/ (see AGENTS.md).`;
}

async function main() {
  let raw = "";
  for await (const chunk of process.stdin) raw += chunk;
  let input = {};
  try {
    input = JSON.parse(raw || "{}");
  } catch {}
  const tool = input.tool_name;
  const ti = input.tool_input ?? {};
  let res = { allowed: true, problems: [] };
  if (tool === "Bash" && typeof ti.command === "string") res = checkCommand(ti.command, input.cwd || process.cwd());
  else if (["Edit", "Write", "MultiEdit", "NotebookEdit"].includes(tool)) res = checkWrite(ti.file_path ?? ti.notebook_path);
  if (!res.allowed) {
    process.stderr.write(explain(res.problems) + "\n");
    process.exit(2);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
