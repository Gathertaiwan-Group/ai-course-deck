import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);

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

test("applies an immutable one-year cache to static assets", async () => {
  const config = await loadVercelConfig();
  const cacheControl = getHeader(config, "/assets/(.*)", "Cache-Control");

  assert.match(cacheControl ?? "", /\bpublic\b/i);
  assert.match(cacheControl ?? "", /\bmax-age=31536000\b/i);
  assert.match(cacheControl ?? "", /\bimmutable\b/i);
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

  assert.match(readme, /16\s*張投影片/);
  assert.match(readme, /python3 -m http\.server 4173/);
  assert.match(readme, /npm test/);
  assert.match(readme, /方向鍵/);
  assert.match(readme, /手機.*滑動/);
  assert.match(readme, /#slide-/);
  assert.match(readme, /列印|PDF/);
  assert.match(readme, /Vercel/);
  assert.match(readme, /main/);
  assert.match(readme, /不應.*token.*commit|不可.*token.*提交/i);
});

test("documents bundled asset provenance and trademark ownership", async () => {
  const readme = await readProjectFile("README.md");

  assert.match(readme, /hero.*原始投影片素材/i);
  assert.match(readme, /Simple Icons/);
  assert.match(readme, /官方.*標誌/);
  assert.match(readme, /商標.*各自.*所有權人/);
});

test("does not include credential-shaped values in deployment files", async () => {
  const contents = [
    await readProjectFile("vercel.json"),
    await readProjectFile("README.md"),
  ].join("\n");
  const credentialPrefixes = [
    ["v", "cp_"].join(""),
    ["g", "hp_"].join(""),
    ["g", "ho_"].join(""),
  ];

  for (const prefix of credentialPrefixes) {
    assert.doesNotMatch(contents, new RegExp(`${prefix}[A-Za-z0-9]{16,}`));
  }

  const secretAssignmentNames = [
    ["service", "_role"].join(""),
    ["PRIVATE", "_KEY"].join(""),
  ];
  for (const name of secretAssignmentNames) {
    assert.doesNotMatch(
      contents,
      new RegExp(`${name}\\s*[:=]\\s*["']?[A-Za-z0-9_./+=-]{12,}`, "i"),
    );
  }
});
