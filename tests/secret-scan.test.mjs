import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  findCredentialFindings,
  scanGitHistory,
} from "./secret-scan.mjs";

function runGit(repositoryPath, args) {
  return execFileSync("git", args, {
    cwd: repositoryPath,
    encoding: "utf8",
  });
}

test("scans full commit messages and annotated tag messages", (context) => {
  const repositoryPath = mkdtempSync(
    path.join(tmpdir(), "ai-course-secret-history-"),
  );
  context.after(() => rmSync(repositoryPath, { recursive: true, force: true }));

  runGit(repositoryPath, ["init", "--quiet"]);
  runGit(repositoryPath, ["config", "user.name", "Security Test"]);
  runGit(repositoryPath, ["config", "user.email", "security@example.test"]);
  writeFileSync(path.join(repositoryPath, "README.md"), "safe fixture\n");
  runGit(repositoryPath, ["add", "README.md"]);

  const commitCredential = ["v", "cp_"].join("") + "C".repeat(40);
  runGit(repositoryPath, [
    "commit",
    "--quiet",
    "-m",
    "safe subject",
    "-m",
    `body-only credential ${commitCredential}`,
  ]);

  const tagCredential = ["s", "k-proj-"].join("") + "T".repeat(48);
  runGit(repositoryPath, [
    "tag",
    "-a",
    "v1.0.0",
    "-m",
    `annotated tag credential ${tagCredential}`,
  ]);

  const findings = scanGitHistory(repositoryPath);
  assert.ok(
    findings.some(
      (finding) =>
        finding.detector === "Vercel token" &&
        finding.source === "git-history:commit-messages",
    ),
  );
  assert.ok(
    findings.some(
      (finding) =>
        finding.detector === "OpenAI API key" &&
        finding.source === "git-history:annotated-tag:refs/tags/v1.0.0",
    ),
  );
});

test("detects a realistically shaped Google API key", () => {
  const googleApiKey = ["AI", "za"].join("") + "G".repeat(35);
  const findings = findCredentialFindings(googleApiKey, "fixture");

  assert.deepEqual(
    findings.map((finding) => finding.detector),
    ["Google API key"],
  );
});

test("rejects near-miss Google API key shapes", () => {
  const prefix = ["AI", "za"].join("");
  const nearMisses = [
    prefix + "G".repeat(34),
    prefix + "G".repeat(36),
    prefix + "G".repeat(17) + "!" + "G".repeat(17),
    `example prefix ${prefix} without a key`,
  ];

  for (const nearMiss of nearMisses) {
    assert.deepEqual(findCredentialFindings(nearMiss, "near-miss"), []);
  }
});

test("labels OpenAI and Anthropic credentials independently", () => {
  const openAiKey = ["s", "k-proj-"].join("") + "O".repeat(48);
  const anthropicKey = ["s", "k-ant-api03-"].join("") + "A".repeat(48);

  assert.deepEqual(
    findCredentialFindings(openAiKey, "openai").map(
      (finding) => finding.detector,
    ),
    ["OpenAI API key"],
  );
  assert.deepEqual(
    findCredentialFindings(anthropicKey, "anthropic").map(
      (finding) => finding.detector,
    ),
    ["Anthropic API key"],
  );
});
