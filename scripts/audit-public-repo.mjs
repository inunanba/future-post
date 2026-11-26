import { readdir, readFile, stat } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const root = new URL("../", import.meta.url).pathname;
const required = [
  "README.md", "LICENSE", "AI_USAGE.md", "package.json", "package-lock.json",
  "index.html", "dist/app.bundle.js", "assets/logo.svg", "assets/cover-source.svg",
  "assets/cover.png", "assets/cover.webp", "docs/SUBMISSION_DRAFT.md", "docs/VIDEO_STORYBOARD.md",
  "docs/VIDEO_SCRIPT_JA_EN.md", "docs/VIDEO_FACT_CHECK.md"
];
const textExtensions = new Set([".css", ".gitignore", ".html", ".js", ".json", ".md", ".mjs", ".sol", ".svg", ".txt"]);
const secretRules = [
  ["private PEM", /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/],
  ["OpenAI-style key", /\bsk-[A-Za-z0-9]{20,}\b/],
  ["GitHub token", /\b(?:ghp_|github_pat_)[A-Za-z0-9_]{20,}\b/],
  ["Google API key", /\bAIza[0-9A-Za-z_-]{30,}\b/],
  ["Slack token", /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/],
  ["EVM private key assignment", /\bprivate[_ -]?key\s*[:=]\s*["']?0x[0-9a-fA-F]{64}\b/i]
];
const internalMarkerRules = [
  ["workspace path", /\/workspace\//],
  ["bus path", /\bbus\//],
  ["inbox path", /\binbox\//],
  ["work queue marker", /WORK_QUEUE/],
  ["internal request id", /\bR-20\d{6}-/],
  ["private repository name", /test-mon/]
];
const internalMarkerSkip = new Set(["scripts/audit-public-repo.mjs", "package-lock.json"]);
const forbiddenPublicClaims = [
  "Diana registry path pending",
  "official QoreSeal registry integration",
  "registered recipient key",
  "Thirty-seven test cases pass"
];

async function walk(dir) {
  const output = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if ([".git", "node_modules", "research"].includes(entry.name)) continue;
    const absolute = join(dir, entry.name);
    if (entry.isDirectory()) output.push(...await walk(absolute));
    else output.push(absolute);
  }
  return output;
}

const files = await walk(root);
const relativeFiles = files.map(file => relative(root, file).replaceAll("\\", "/"));
const fileSet = new Set(relativeFiles);
const failures = [];

for (const path of required) if (!fileSet.has(path)) failures.push(`missing required file: ${path}`);
for (const path of relativeFiles) {
  if (/(^|\/)(\.env|id_rsa|.*\.pem|.*\.key|wallet.*\.json|keystore.*\.json)$/i.test(path)) {
    failures.push(`secret-like filename: ${path}`);
  }
}

let textFilesScanned = 0;
for (const [index, file] of files.entries()) {
  const path = relativeFiles[index];
  if (!(textExtensions.has(extname(path)) || path.endsWith("/LICENSE") || path === "LICENSE")) continue;
  if ((await stat(file)).size > 500_000) continue;
  const text = await readFile(file, "utf8");
  textFilesScanned += 1;
  for (const [name, pattern] of secretRules) if (pattern.test(text)) failures.push(`${name}: ${path}`);
  if (!internalMarkerSkip.has(path) && !path.startsWith("dist/")) {
    for (const [name, pattern] of internalMarkerRules) if (pattern.test(text)) failures.push(`internal marker (${name}): ${path}`);
  }
  if (["README.md", "docs/SUBMISSION_DRAFT.md", "docs/VIDEO_STORYBOARD.md", "AI_USAGE.md"].includes(path)) {
    for (const phrase of forbiddenPublicClaims) if (text.includes(phrase)) failures.push(`stale public claim in ${path}: ${phrase}`);
  }
}

const htmlPaths = relativeFiles.filter(path => path.endsWith(".html"));
for (const path of htmlPaths) {
  const html = await readFile(join(root, path), "utf8");
  if (html.includes("\\n")) failures.push(`literal backslash-n in HTML: ${path}`);
  const head = html.match(/<head(?:\s[^>]*)?>([\s\S]*?)<\/head>/i);
  if (!head) {
    failures.push(`missing head element: ${path}`);
    continue;
  }
  const rawHeadText = head[1]
    .replace(/<!--([\s\S]*?)-->/g, "")
    .replace(/<(title|style|script)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<[^>]+>/g, "")
    .trim();
  if (rawHeadText) failures.push(`raw text in head: ${path}: ${rawHeadText}`);
}

const indexHtml = await readFile(join(root, "index.html"), "utf8");
for (const phrase of [
  ">NOT RUN<",
  "Local functional proof; not chain registration",
  "it is not KEM registration or live decryption",
  "qor1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq"
]) {
  if (indexHtml.includes(phrase)) failures.push(`recording-unsafe initial UI copy: ${phrase}`);
}
for (const phrase of [
  ">READY<",
  "In-browser intended-reader and outsider check",
  "QoreChain’s hybrid verification is confirmed",
  "qor1rgsq0sgpww6yevnmedlqe797tc4v57u4as0w52",
  'rel="icon" href="./assets/logo.svg"'
]) {
  if (!indexHtml.includes(phrase)) failures.push(`missing recording-safe UI evidence: ${phrase}`);
}

const appSource = await readFile(join(root, "src/app.js"), "utf8");
const styles = await readFile(join(root, "src/styles.css"), "utf8");
const appBundle = await readFile(join(root, "dist/app.bundle.js"), "utf8");
for (const phrase of [
  'searchParams.get("shot") === "1"',
  'classList.toggle("shot-mode", shotMode)'
]) {
  if (!appSource.includes(phrase)) failures.push(`missing shot-mode source guard: ${phrase}`);
}
const shotCss = ".shot-mode .receipt-row,.shot-mode #open,.shot-mode #notice{display:none}";
if (!styles.includes(shotCss)) failures.push("missing query-gated shot-mode CSS");
if (styles.includes(".receipt-row{display:none}")) failures.push("normal composer receipt row hidden without shot mode");
if (!indexHtml.includes('class="receipt-row"')) failures.push("missing receipt-row shot target");
for (const phrase of ['searchParams.get("shot")', '"shot-mode"']) {
  if (!appBundle.includes(phrase)) failures.push(`committed browser bundle missing shot-mode guard: ${phrase}`);
}

const videoScript = await readFile(join(root, "docs/VIDEO_SCRIPT_JA_EN.md"), "utf8");
for (const phrase of [
  "That’s why we made Future Post.",
  "QoreChain’s post-quantum tool",
  "QoreChain’s hybrid signature",
  "height 10719012, code 0",
  "Created by inunanba"
]) {
  if (!videoScript.includes(phrase)) failures.push(`missing reviewed video line: ${phrase}`);
}

const storyboard = await readFile(join(root, "docs/VIDEO_STORYBOARD.md"), "utf8");
for (const phrase of [
  "Capture the proof card only after",
  "qor1rgsq0sgpww6yevnmedlqe797tc4v57u4as0w52",
  "Do not press **Prepare share B release**"
]) {
  if (!storyboard.includes(phrase)) failures.push(`missing recording guard: ${phrase}`);
}

const readme = await readFile(join(root, "README.md"), "utf8");
for (const match of readme.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
  const target = match[1];
  if (/^(?:https?:|#)/.test(target)) continue;
  const path = target.split("#")[0];
  if (!fileSet.has(path)) failures.push(`broken README link: ${target}`);
}

const png = await readFile(join(root, "assets/cover.png"));
const width = png.readUInt32BE(16);
const height = png.readUInt32BE(20);
if (width < 1200 || height < 675) failures.push(`cover.png too small: ${width}x${height}`);

const result = {
  schema: "future-post-public-repo-audit/v1",
  filesScanned: files.length,
  textFilesScanned,
  requiredFiles: required.length,
  readmeRelativeLinks: [...readme.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map(match => match[1]).filter(target => !/^https?:/.test(target)).length,
  coverPng: `${width}x${height}`,
  secretPatternHits: failures.filter(item => !item.startsWith("missing") && !item.startsWith("broken") && !item.includes("stale public") && !item.includes("too small")).length,
  status: failures.length ? "FAIL" : "PASS",
  failures
};
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (failures.length) process.exitCode = 1;
