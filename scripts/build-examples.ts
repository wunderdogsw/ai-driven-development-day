// Builds the example skill pages in docs/examples/ from examples/ and examples/pages.json.
//   npx tsx scripts/build-examples.ts          write the pages
//   npx tsx scripts/build-examples.ts --check  fail if docs/examples/ is out of date
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

type Page = {
  slug: string;
  title: string;
  kicker: string;
  lead: string;
  good: { title: string; text: string }[];
  files: { path: string; why: string }[];
};

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const examples = join(root, "examples");
const outDir = join(root, "docs", "examples");
const check = process.argv.includes("--check");
const { pages } = JSON.parse(readFileSync(join(examples, "pages.json"), "utf8")) as { pages: Page[] };

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Escape a file for <pre>, and mark frontmatter and markdown headings. */
function code(text: string, markdown: boolean): string {
  let inFrontmatter = false;
  let inFence = false;
  return text
    .split("\n")
    .map((line, i) => {
      const e = esc(line);
      if (!markdown) return e;
      if (i === 0 && line === "---") {
        inFrontmatter = true;
        return `<span class="fm">${e}</span>`;
      }
      if (inFrontmatter) {
        if (line === "---") inFrontmatter = false;
        return `<span class="fm">${e}</span>`;
      }
      if (line.trimStart().startsWith("```")) inFence = !inFence;
      if (!inFence && line.startsWith("#")) return `<span class="h">${e}</span>`;
      return e;
    })
    .join("\n");
}

const icon = {
  slides: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h20"/><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3"/><path d="m7 21 5-5 5 5"/></svg>`,
  examples: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/></svg>`,
  pdf: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/></svg>`,
  github: `<svg class="icon" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"/></svg>`,
};

function nav(up: string): string {
  return `<nav class="site-nav" aria-label="Training pages">
  <div class="inner">
    <a class="brand" href="${up}" aria-label="Home"><span class="wd-logo" role="img" aria-label="Wunderdog"></span></a>
    <ul>
      <li><a class="link icon-link" href="${up}slides/" aria-label="Slides" title="Slides">${icon.slides}</a></li>
      <li><a class="link icon-link" href="${up}examples/" aria-label="Example skills" title="Example skills" aria-current="page">${icon.examples}</a></li>
      <li><a class="link icon-link" href="${up}slides/ai-native-development.pdf" download aria-label="Download the slides with speaker notes (PDF)" title="Download the slides with speaker notes (PDF)">${icon.pdf}</a></li>
      <li><a class="link icon-link" href="https://github.com/wunderdogsw/ai-driven-development-day" aria-label="GitHub repository" title="GitHub repository">${icon.github}</a></li>
    </ul>
  </div>
</nav>`;
}

function shell(up: string, title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&family=DM+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="${up}assets/site.css">
<link rel="stylesheet" href="${up}assets/nav.css">
<link rel="stylesheet" href="${up}assets/examples.css">
</head>
<body class="ex">
${nav(up)}
${body}
<script src="${up}assets/examples.js"></script>
</body>
</html>
`;
}

function examplePage(p: Page): string {
  const tree = p.files
    .map((f, i) => `<a href="#f${i}">${esc(f.path)}</a>`)
    .join("\n      ");
  const files = p.files
    .map((f, i) => {
      const text = readFileSync(join(examples, f.path), "utf8").replace(/\n+$/, "");
      return `<section class="ex-file" id="f${i}">
      <p class="ex-why">${esc(f.why)}</p>
      <div class="ex-window">
        <div class="ex-bar"><span class="ex-name">.claude/${esc(f.path)}</span><button class="ex-copy" type="button" data-target="c${i}">Click to Copy</button></div>
        <pre id="c${i}">${code(text, f.path.endsWith(".md"))}</pre>
      </div>
    </section>`;
    })
    .join("\n    ");
  const good = p.good.map((g) => `<li><b>${esc(g.title)}</b><span>${esc(g.text)}</span></li>`).join("\n      ");
  return shell(
    "../../",
    `${p.title} – Examples`,
    `<main class="ex-wrap">
  <header class="ex-head">
    <a class="ex-back" href="../">← All examples</a>
    <div class="ex-kicker">${esc(p.kicker)}</div>
    <h1><code>/${esc(p.slug)}</code></h1>
    <p class="ex-lead">${esc(p.lead)}</p>
  </header>
  <section class="ex-good"><h2>What makes it good</h2><ul>
      ${good}
  </ul></section>
  <div class="ex-layout">
    <nav class="ex-tree" aria-label="Files">
      <div class="root">.claude/</div>
      ${tree}
    </nav>
    <div class="ex-files">
    ${files}
    </div>
  </div>
  <p class="ex-note">Paths and commands assume a repo with <code>src/Api</code> (.NET), <code>backend/</code> (PHP) and <code>web/</code> (Next.js). MCP server names are the names in the repo's <code>.mcp.json</code>. Each team changes them to match its own repo. The files are in <a href="https://github.com/wunderdogsw/ai-driven-development-day/tree/main/examples">examples/</a> in the repo.</p>
</main>`,
  );
}

function indexPage(): string {
  const cards = pages
    .map(
      (p) => `<li><a href="${p.slug}/"><span class="k">${esc(p.kicker)}</span><code>/${esc(p.slug)}</code><p>${esc(p.lead)}</p></a></li>`,
    )
    .join("\n    ");
  const use = `cp -R examples/skills/discover  &lt;your repo&gt;/.claude/skills/
cp examples/agents/review-*.md  &lt;your repo&gt;/.claude/agents/
cp examples/agents/test-writer.md &lt;your repo&gt;/.claude/agents/`;
  return shell(
    "../",
    "Example skills – AI-native development",
    `<main class="ex-wrap">
  <header class="ex-head">
    <div class="ex-kicker">Jakamo × Wunderdog · hands-on</div>
    <h1>Example skills</h1>
    <p class="ex-lead">The skills and subagents the hands-on guide uses as its model. Read why each one is built the way it is, then copy the files into your repo's <code>.claude/</code> folder and change the paths and commands.</p>
  </header>
  <ul class="ex-cards">
    ${cards}
  </ul>
  <section class="ex-use">
    <h2>Use one in your repo</h2>
    <div class="ex-window">
      <div class="ex-bar"><span class="ex-name">Terminal</span><button class="ex-copy" type="button" data-target="use">Click to Copy</button></div>
      <pre id="use">${use}</pre>
    </div>
  </section>
</main>`,
  );
}

const outputs: [string, string][] = [
  [join(outDir, "index.html"), indexPage()],
  ...pages.map((p): [string, string] => [join(outDir, p.slug, "index.html"), examplePage(p)]),
];

let stale = 0;
for (const [file, html] of outputs) {
  if (check) {
    if (!existsSync(file) || readFileSync(file, "utf8") !== html) {
      console.error(`out of date: ${file.slice(root.length + 1)}`);
      stale++;
    }
  } else {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, html);
    console.log(`wrote ${file.slice(root.length + 1)}`);
  }
}
if (check && stale) {
  console.error("Run: npm run docs:examples");
  process.exit(1);
}
