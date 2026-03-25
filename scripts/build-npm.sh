#!/usr/bin/env bash
set -euo pipefail

# Build the Rust binary for the current platform and place it in the correct npm package.
# Useful for local testing of the npm wrapper before publishing.
#
# Usage: ./scripts/build-npm.sh
# Then:  node npm/diamondscaffold/bin/diamonds.js --help

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> Building release binary..."
(cd "$ROOT/v2" && cargo build --release)

PLATFORM="$(uname -s)-$(uname -m)"
case "$PLATFORM" in
  Darwin-arm64)  PKG="diamondscaffold-darwin-arm64"  ;;
  Darwin-x86_64) PKG="diamondscaffold-darwin-x64"    ;;
  Linux-x86_64)  PKG="diamondscaffold-linux-x64"     ;;
  Linux-aarch64) PKG="diamondscaffold-linux-arm64"    ;;
  *)
    echo "Unsupported local platform: $PLATFORM"
    exit 1
    ;;
esac

echo "==> Copying binary to npm/$PKG/bin/diamonds"
cp "$ROOT/v2/target/release/diamonds" "$ROOT/npm/$PKG/bin/diamonds"
chmod +x "$ROOT/npm/$PKG/bin/diamonds"

echo ""
echo "==> Done. Test with:"
echo "    node npm/diamondscaffold/bin/diamonds.js --help"
echo "    node npm/diamondscaffold/bin/diamonds.js init"
