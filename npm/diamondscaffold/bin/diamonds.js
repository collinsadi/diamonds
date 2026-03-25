#!/usr/bin/env node

const { execFileSync } = require("child_process");
const path = require("path");

const PLATFORMS = {
  "darwin-arm64": "diamondscaffold-darwin-arm64",
  "darwin-x64": "diamondscaffold-darwin-x64",
  "linux-x64": "diamondscaffold-linux-x64",
  "linux-arm64": "diamondscaffold-linux-arm64",
  "win32-x64": "diamondscaffold-win32-x64",
};

const key = `${process.platform}-${process.arch}`;
const pkg = PLATFORMS[key];

if (!pkg) {
  console.error(
    `Unsupported platform: ${process.platform}-${process.arch}\n` +
      `Supported: ${Object.keys(PLATFORMS).join(", ")}\n\n` +
      `You can install from source with: cargo install diamondscaffold`
  );
  process.exit(1);
}

let binPath;
const ext = process.platform === "win32" ? ".exe" : "";

try {
  binPath = require.resolve(`${pkg}/bin/diamonds${ext}`);
} catch {
  // Fallback: check sibling directory (for local development / monorepo)
  const localPath = path.resolve(__dirname, "..", "..", pkg, "bin", `diamonds${ext}`);
  if (require("fs").existsSync(localPath)) {
    binPath = localPath;
  } else {
    console.error(
      `Could not find the binary package "${pkg}".\n\n` +
        `This usually means the optional dependency wasn't installed.\n` +
      `Try reinstalling: npm install -g diamondscaffold\n\n` +
      `Or install from source: cargo install diamondscaffold`
    );
    process.exit(1);
  }
}

try {
  execFileSync(binPath, process.argv.slice(2), { stdio: "inherit" });
} catch (e) {
  if (e.status !== undefined) {
    process.exit(e.status);
  }
  throw e;
}
