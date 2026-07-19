import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  findCredentialFindings,
  scanGitHistory,
  scanTrackedTextFiles,
} from "./secret-scan.mjs";

const projectRoot = new URL("../", import.meta.url);
const projectRootPath = fileURLToPath(projectRoot);

async function readProjectFile(path) {
  try {
    return await readFile(new URL(path, projectRoot), "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") {
      assert.fail(`${path} must exist before deployment configuration can pass`);
    }

    throw error;
  }
}

async function loadVercelConfig() {
  return JSON.parse(await readProjectFile("vercel.json"));
}

function getHeader(config, source, key) {
  const route = config.headers?.find((entry) => entry.source === source);
  return route?.headers?.find((header) => header.key === key)?.value;
}

test("configures a framework-free static Vercel deployment", async () => {
  const config = await loadVercelConfig();

  assert.equal(config.framework, null);
  assert.equal(config.cleanUrls, true);
  assert.equal(config.trailingSlash, false);
  assert.ok(Array.isArray(config.headers));
});

test("uses a revalidating browser cache for unhashed static assets", async () => {
  const config = await loadVercelConfig();
  const cacheControl = getHeader(config, "/assets/(.*)", "Cache-Control");
  const maxAge = Number(cacheControl?.match(/\bmax-age=(\d+)\b/i)?.[1]);

  assert.match(cacheControl ?? "", /\bpublic\b/i);
  assert.ok(maxAge > 0 && maxAge <= 86_400);
  assert.match(cacheControl ?? "", /\bmust-revalidate\b/i);
  assert.doesNotMatch(cacheControl ?? "", /\bimmutable\b/i);
});

test("sets conservative security headers for every route", async () => {
  const config = await loadVercelConfig();
  const source = "/(.*)";

  assert.equal(getHeader(config, source, "X-Content-Type-Options"), "nosniff");
  assert.equal(
    getHeader(config, source, "Referrer-Policy"),
    "strict-origin-when-cross-origin",
  );
  assert.match(getHeader(config, source, "Permissions-Policy") ?? "", /camera=\(\)/);
  assert.match(
    getHeader(config, source, "Permissions-Policy") ?? "",
    /microphone=\(\)/,
  );
  assert.match(
    getHeader(config, source, "Permissions-Policy") ?? "",
    /geolocation=\(\)/,
  );

  const contentSecurityPolicy =
    getHeader(config, source, "Content-Security-Policy") ?? "";
  assert.match(contentSecurityPolicy, /default-src 'self'/);
  assert.match(contentSecurityPolicy, /script-src 'self'/);
  assert.match(contentSecurityPolicy, /style-src 'self'/);
  assert.match(contentSecurityPolicy, /img-src 'self'/);
  assert.match(contentSecurityPolicy, /object-src 'none'/);
  assert.match(contentSecurityPolicy, /frame-ancestors 'none'/);
  assert.doesNotMatch(contentSecurityPolicy, /unsafe-inline|unsafe-eval/);
});

test("documents local use, navigation, sharing, printing, and deployment", async () => {
  const readme = await readProjectFile("README.md");

  assert.match(readme, /21\s*張投影片/);
  assert.match(readme, /python3 -m http\.server 4173/);
  assert.match(readme, /npm test/);
  assert.match(readme, /方向鍵/);
  assert.match(readme, /手機.*滑動/);
  assert.match(readme, /#slide-/);
  assert.match(readme, /列印|PDF/);
  assert.match(readme, /Vercel/);
  assert.match(readme, /main/);
  assert.match(readme, /不應.*token.*commit|不可.*token.*提交/i);
  assert.match(readme, /未使用.*內容雜湊|檔名.*未.*hash/i);
  assert.match(readme, /max-age=3600/);
  assert.match(readme, /must-revalidate/);
  assert.match(readme, /更換.*檔名.*立即.*新/i);
  assert.match(readme, /CDN.*(?:清除|purge).*不會.*瀏覽器.*快取/i);
  assert.match(readme, /檔名.*不變.*(?:一小時|max-age)/i);
});

test("documents bundled asset provenance and trademark ownership", async () => {
  const readme = await readProjectFile("README.md");

  assert.match(readme, /hero.*原始投影片素材/i);
  assert.match(readme, /fb4f36a58af2dcb6412cdfe2ba20a3cb05644ffbd2a23831bc8cfc327ff07b18/i);
  assert.match(readme, /Simple Icons/);
  assert.match(readme, /官方.*標誌/);
  assert.match(readme, /SHA-256/);
  assert.match(readme, /(?:使用者|委託者).*提供/);
  assert.match(readme, /不.*(?:獨立)?主張.*(?:授權|license|使用權)/i);
  assert.match(readme, /商標.*各自.*所有權人/);
});

test("excludes non-runtime files from Vercel uploads", async () => {
  const patterns = (await readProjectFile(".vercelignore"))
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

  for (const requiredPattern of [
    "docs/",
    "tests/",
    "README.md",
    "package*.json",
    "design-system/",
    ".git/",
    ".vercel/",
    ".env*",
    ".DS_Store",
  ]) {
    assert.ok(
      patterns.includes(requiredPattern),
      `.vercelignore must exclude ${requiredPattern}`,
    );
  }

  for (const runtimePath of [
    "index.html",
    "styles.css",
    "deck.js",
    "deck-state.js",
    "vercel.json",
    "assets/",
  ]) {
    assert.ok(
      !patterns.includes(runtimePath) && !patterns.includes(`/${runtimePath}`),
      `.vercelignore must keep ${runtimePath} deployable`,
    );
  }
});

test("detects supported credential shapes without flagging instructional copy", () => {
  const serviceRole = ["service", "_role"].join("");
  const jwt = [
    Buffer.from('{"alg":"HS256","typ":"JWT"}').toString("base64url"),
    Buffer.from(JSON.stringify({ role: serviceRole, iss: "supabase" })).toString(
      "base64url",
    ),
    "s".repeat(43),
  ].join(".");
  const credentialSamples = [
    ["v", "cp_"].join("") + "V".repeat(40),
    ["g", "hp_"].join("") + "G".repeat(36),
    ["github", "_pat_"].join("") + "P".repeat(60),
    ["s", "k-proj-"].join("") + "O".repeat(48),
    ["AK", "IA"].join("") + "A".repeat(16),
    ["-----BEGIN ", "PRIVATE KEY-----"].join(""),
    ["sb", "_secret_"].join("") + "S".repeat(40),
    jwt,
  ];

  for (const sample of credentialSamples) {
    assert.ok(
      findCredentialFindings(sample, "fixture").length > 0,
      "each credential fixture must be detected",
    );
  }

  const instructionalCopy =
    "上線後更換 token 與 API key；private key 和 service-role key 不可放前端。";
  assert.deepEqual(findCredentialFindings(instructionalCopy, "copy"), []);
});

test("finds no credential-shaped values in tracked text files", () => {
  assert.deepEqual(scanTrackedTextFiles(projectRootPath), []);
});

test("finds no credential-shaped values in Git history patches or text blobs", () => {
  assert.deepEqual(scanGitHistory(projectRootPath), []);
});
