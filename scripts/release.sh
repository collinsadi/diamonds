#!/usr/bin/env bash
set -euo pipefail

# Release script for diamondscaffold
# Usage: ./scripts/release.sh <version>
# Example: ./scripts/release.sh 2.1.0

VERSION="${1:?Usage: $0 <version> (e.g. 2.1.0)}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> Releasing v${VERSION}"
echo ""

# 1. Update Cargo.toml version
echo "  Updating v2/Cargo.toml..."
sed -i.bak "s/^version = \".*\"/version = \"${VERSION}\"/" "$ROOT/v2/Cargo.toml"
rm -f "$ROOT/v2/Cargo.toml.bak"

# 2. Update all npm package.json versions
echo "  Updating npm package versions..."
for dir in \
  "$ROOT/npm/diamondscaffold" \
  "$ROOT/npm/diamondscaffold-darwin-arm64" \
  "$ROOT/npm/diamondscaffold-darwin-x64" \
  "$ROOT/npm/diamondscaffold-linux-x64" \
  "$ROOT/npm/diamondscaffold-linux-arm64" \
  "$ROOT/npm/diamondscaffold-win32-x64"; do
  (cd "$dir" && npm version "$VERSION" --no-git-tag-version --allow-same-version 2>/dev/null)
done

# 3. Update optionalDependencies in main package
echo "  Syncing optionalDependencies versions..."
node -e "
  const fs = require('fs');
  const pkgPath = '$ROOT/npm/diamondscaffold/package.json';
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  for (const dep of Object.keys(pkg.optionalDependencies)) {
    pkg.optionalDependencies[dep] = '$VERSION';
  }
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
"

# 4. Commit and tag
echo "  Committing..."
cd "$ROOT"
git add -A
git commit -m "release: v${VERSION}"
git tag "v${VERSION}"

echo ""
echo "==> Done. To publish:"
echo "    git push && git push --tags"
echo ""
echo "  This will trigger the GitHub Actions release workflow which:"
echo "    1. Builds binaries for all 5 platforms"
echo "    2. Publishes platform packages + main package to npm"
echo "    3. Publishes the crate to crates.io"
echo "    4. Creates a GitHub Release with binary downloads"
