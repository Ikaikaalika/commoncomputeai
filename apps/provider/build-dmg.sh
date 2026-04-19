#!/usr/bin/env bash
# Build Common Compute.app and package it into a distributable DMG.
# Usage: ./build-dmg.sh [version]
# Requires: Xcode command-line tools, hdiutil (built into macOS)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERSION="${1:-1.0.0}"
APP_NAME="Common Compute"
BUNDLE_NAME="CommonCompute"
DMG_NAME="${BUNDLE_NAME}-${VERSION}"
BUILD_DIR="/tmp/cc-build-$$"
STAGING_DIR="/tmp/cc-dmg-staging-$$"
OUT_DIR="${SCRIPT_DIR}/dist"

cleanup() { rm -rf "${BUILD_DIR}" "${STAGING_DIR}"; }
trap cleanup EXIT

echo "==> Building ${APP_NAME} ${VERSION}"
echo "    Project: ${SCRIPT_DIR}/CommonCompute.xcodeproj"

# Build Release
xcodebuild \
  -project "${SCRIPT_DIR}/CommonCompute.xcodeproj" \
  -scheme "${BUNDLE_NAME}" \
  -configuration Release \
  -derivedDataPath "${BUILD_DIR}" \
  ONLY_ACTIVE_ARCH=NO \
  clean build \
  | xcpretty 2>/dev/null || cat  # fall back to raw output if xcpretty not installed

APP_PATH="${BUILD_DIR}/Build/Products/Release/${BUNDLE_NAME}.app"

if [ ! -d "${APP_PATH}" ]; then
  echo "ERROR: Build failed — ${APP_PATH} not found"
  exit 1
fi

echo "==> Staging DMG contents"
mkdir -p "${STAGING_DIR}"
cp -R "${APP_PATH}" "${STAGING_DIR}/${APP_NAME}.app"
ln -s /Applications "${STAGING_DIR}/Applications"

echo "==> Creating DMG"
mkdir -p "${OUT_DIR}"

hdiutil create \
  -volname "${APP_NAME}" \
  -srcfolder "${STAGING_DIR}" \
  -ov \
  -format UDZO \
  -imagekey zlib-level=9 \
  "${OUT_DIR}/${DMG_NAME}.dmg"

echo ""
echo "✓ DMG created: ${OUT_DIR}/${DMG_NAME}.dmg"
echo "  Size: $(du -sh "${OUT_DIR}/${DMG_NAME}.dmg" | cut -f1)"

# ── Sync to web/public/downloads so the site can serve it directly ──
WEB_DOWNLOADS="${SCRIPT_DIR}/../../apps/web/public/downloads"
if [ -d "${WEB_DOWNLOADS}" ]; then
  cp "${OUT_DIR}/${DMG_NAME}.dmg" "${WEB_DOWNLOADS}/${DMG_NAME}.dmg"
  echo "✓ Copied to web public: ${WEB_DOWNLOADS}/${DMG_NAME}.dmg"
else
  # Try the sibling path when running from repo root.
  WEB_DOWNLOADS2="$(cd "${SCRIPT_DIR}/../.." && pwd)/apps/web/public/downloads"
  if [ -d "${WEB_DOWNLOADS2}" ]; then
    cp "${OUT_DIR}/${DMG_NAME}.dmg" "${WEB_DOWNLOADS2}/${DMG_NAME}.dmg"
    echo "✓ Copied to web public: ${WEB_DOWNLOADS2}/${DMG_NAME}.dmg"
  fi
fi

echo ""
echo "  Next steps:"
echo "  1. Update RELEASE.version in apps/web/src/app/download/page.tsx if version changed."
echo "  2. Deploy apps/web to Cloudflare Pages (cd apps/web && pnpm deploy)."
echo "  Users drag '${APP_NAME}.app' to /Applications and it appears in the menu bar."
