// Shared helpers: read plans/.implementing and the tables in plan.md.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
export const markerPath = join(root, "plans", ".implementing");

export function readMarker() {
  if (!existsSync(markerPath)) return null;
  try {
    return JSON.parse(readFileSync(markerPath, "utf8"));
  } catch {
    return null;
  }
}

const strip = (c) => c.trim().replace(/^`([^`]*)`$/, "$1").trim();

/** Rows of the markdown table under "## <heading>", as arrays of cells. */
export function table(md, heading) {
  const lines = md.split("\n");
  const start = lines.findIndex((l) => l.trim().toLowerCase() === `## ${heading}`.toLowerCase());
  if (start < 0) return [];
  const rows = [];
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith("## ")) break;
    if (!line.trim().startsWith("|")) continue;
    const cells = line.trim().replace(/^\||\|$/g, "").split("|").map(strip);
    if (cells.every((c) => /^:?-+:?$/.test(c))) continue;
    rows.push(cells);
  }
  return rows.slice(1); // drop the header row
}

/** Bullet items under "## <heading>", without backticks. */
export function bullets(md, heading) {
  const lines = md.split("\n");
  const start = lines.findIndex((l) => l.trim().toLowerCase() === `## ${heading}`.toLowerCase());
  if (start < 0) return [];
  const out = [];
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith("## ")) break;
    const m = /^\s*-\s+(.*)$/.exec(line);
    if (m) out.push(strip(m[1]));
  }
  return out;
}

export function readPlan(ticket) {
  const p = join(root, "plans", ticket, "plan.md");
  if (!existsSync(p)) return null;
  const md = readFileSync(p, "utf8");
  return {
    md,
    approved: /^Status:\s*approved/im.test(md),
    tests: table(md, "Tests").map(([ac, name, file, command]) => ({ ac, name, file, command })),
    files: table(md, "Files").map(([file, change, what, ac]) => ({ file, change, what, ac })),
    checks: bullets(md, "Checks"),
  };
}
