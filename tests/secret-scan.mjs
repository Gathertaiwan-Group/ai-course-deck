import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

const fragments = {
  vercel: ["vc", "p_"].join(""),
  githubClassic: ["gh", "p_"].join(""),
  githubFineGrained: ["github", "_pat_"].join(""),
  openAi: ["s", "k-"].join(""),
  supabaseSecret: ["sb", "_secret_"].join(""),
  serviceRole: ["service", "_role"].join(""),
  awsSecretName: ["AWS_SECRET_ACCESS", "_KEY"].join(""),
  supabaseServiceName: ["SUPABASE_SERVICE", "_ROLE_KEY"].join(""),
  pemPrivateKey: ["PRIVATE", " KEY"].join(""),
};

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const detectors = [
  {
    label: "Vercel token",
    pattern: new RegExp(
      `\\b${escapeRegExp(fragments.vercel)}[A-Za-z0-9]{20,}\\b`,
      "g",
    ),
  },
  {
    label: "GitHub classic token",
    pattern: new RegExp(
      `\\b${escapeRegExp(fragments.githubClassic)}[A-Za-z0-9]{30,}\\b`,
      "g",
    ),
  },
  {
    label: "GitHub fine-grained token",
    pattern: new RegExp(
      `\\b${escapeRegExp(fragments.githubFineGrained)}[A-Za-z0-9_]{20,}\\b`,
      "g",
    ),
  },
  {
    label: "OpenAI API key",
    pattern: new RegExp(
      `\\b${escapeRegExp(fragments.openAi)}(?:proj-)?[A-Za-z0-9_-]{20,}\\b`,
      "g",
    ),
  },
  {
    label: "AWS access key ID",
    pattern: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g,
  },
  {
    label: "AWS secret access key assignment",
    pattern: new RegExp(
      `${escapeRegExp(fragments.awsSecretName)}\\s*[:=]\\s*["']?[A-Za-z0-9/+=]{30,}`,
      "gi",
    ),
  },
  {
    label: "PEM private key",
    pattern: new RegExp(
      `-----BEGIN (?:RSA |EC |OPENSSH )?${escapeRegExp(fragments.pemPrivateKey)}-----`,
      "g",
    ),
  },
  {
    label: "Supabase secret key",
    pattern: new RegExp(
      `\\b${escapeRegExp(fragments.supabaseSecret)}[A-Za-z0-9_-]{20,}\\b`,
      "g",
    ),
  },
  {
    label: "Supabase service-role assignment",
    pattern: new RegExp(
      `(?:${escapeRegExp(fragments.serviceRole)}|${escapeRegExp(fragments.supabaseServiceName)})\\s*[:=]\\s*["']?[A-Za-z0-9_.-]{20,}`,
      "gi",
    ),
  },
  {
    label: "JWT",
    pattern:
      /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{20,}\b/g,
  },
];

function isText(buffer) {
  return !buffer.includes(0);
}

function scanBuffer(buffer, source) {
  if (!isText(buffer)) {
    return [];
  }

  return findCredentialFindings(buffer.toString("utf8"), source);
}

function runGit(repositoryPath, args, options = {}) {
  return execFileSync("git", args, {
    cwd: repositoryPath,
    maxBuffer: 64 * 1024 * 1024,
    ...options,
  });
}

export function findCredentialFindings(text, source) {
  const findings = [];

  for (const detector of detectors) {
    for (const match of text.matchAll(detector.pattern)) {
      findings.push({
        detector: detector.label,
        source,
        index: match.index,
        length: match[0].length,
      });
    }
  }

  return findings;
}

export function scanTrackedTextFiles(repositoryPath) {
  const paths = runGit(repositoryPath, ["ls-files", "-z"])
    .toString("utf8")
    .split("\0")
    .filter(Boolean);

  return paths.flatMap((filePath) =>
    scanBuffer(
      readFileSync(path.join(repositoryPath, filePath)),
      `tracked:${filePath}`,
    ),
  );
}

export function scanGitHistory(repositoryPath) {
  const findings = [];
  const patchHistory = runGit(
    repositoryPath,
    ["log", "--all", "-p", "--no-ext-diff", "--text", "--format=commit %H"],
    { encoding: "utf8" },
  );
  findings.push(...findCredentialFindings(patchHistory, "git-history:patches"));

  const objectLines = runGit(repositoryPath, [
    "rev-list",
    "--objects",
    "--all",
  ])
    .toString("utf8")
    .split("\n")
    .filter((line) => line.includes(" "));
  const visitedObjects = new Set();

  for (const line of objectLines) {
    const separatorIndex = line.indexOf(" ");
    const objectId = line.slice(0, separatorIndex);
    const objectPath = line.slice(separatorIndex + 1);

    if (visitedObjects.has(objectId)) {
      continue;
    }
    visitedObjects.add(objectId);

    const objectType = runGit(repositoryPath, ["cat-file", "-t", objectId], {
      encoding: "utf8",
    }).trim();
    if (objectType !== "blob") {
      continue;
    }

    findings.push(
      ...scanBuffer(
        runGit(repositoryPath, ["cat-file", "-p", objectId]),
        `git-object:${objectId}:${objectPath}`,
      ),
    );
  }

  return findings;
}
