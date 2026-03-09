#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..");
const packageJsonPath = path.join(repoRoot, "package.json");
const distEntryPath = path.join(repoRoot, "dist", "index.js");

function fail(message) {
  console.error(`Packaging validation failed: ${message}`);
  process.exit(1);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const packageJson = readJson(packageJsonPath);
const expectedBin = "dist/index.js";

if (
  !packageJson.bin ||
  packageJson.bin["scholarly-research-mcp"] !== expectedBin
) {
  fail(
    `package.json must expose bin.scholarly-research-mcp as "${expectedBin}".`
  );
}

if (!fs.existsSync(distEntryPath)) {
  fail("dist/index.js is missing. Run the build before publishing.");
}

const distEntry = fs.readFileSync(distEntryPath, "utf8");
if (!distEntry.startsWith("#!/usr/bin/env node")) {
  fail("dist/index.js must start with a node shebang.");
}

const distMode = fs.statSync(distEntryPath).mode & 0o777;
if ((distMode & 0o111) === 0) {
  fail("dist/index.js must be executable.");
}

let packOutput;
try {
  packOutput = execFileSync(
    "npm",
    ["pack", "--json", "--ignore-scripts"],
    {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }
  );
} catch (error) {
  fail(error.stderr || error.message);
}

let tarballInfo;
try {
  tarballInfo = JSON.parse(packOutput)[0];
} catch (error) {
  fail(`unable to parse npm pack output: ${error.message}`);
}

const tarballPath = path.join(repoRoot, tarballInfo.filename);

try {
  const filesByPath = new Map(
    (tarballInfo.files || []).map((file) => [file.path, file])
  );

  if (!filesByPath.has("package.json")) {
    fail("packed tarball is missing package.json.");
  }

  const packedDistEntry = filesByPath.get(expectedBin);
  if (!packedDistEntry) {
    fail(`packed tarball is missing ${expectedBin}.`);
  }

  if ((packedDistEntry.mode & 0o111) === 0) {
    fail(`packed ${expectedBin} is not executable.`);
  }

  console.log(
    `Packaging validation passed for ${packageJson.name}@${packageJson.version}.`
  );
} finally {
  if (fs.existsSync(tarballPath)) {
    fs.unlinkSync(tarballPath);
  }
}
