#!/usr/bin/env bash
# Build Common Compute.app and package it into a distributable DMG.
# Usage: ./build-dmg.sh [version]
# Requires: Xcode command-line tools, hdiutil (built into macOS)
#
# Signing + notarization (opt-in, via env vars):
#
#   CC_CODESIGN_IDENTITY   — "Developer ID Application: Your Name (TEAMID)"
#                            If unset, the build is ad-hoc signed (dev only).
#   CC_NOTARY_KEYCHAIN_PROFILE
#                          — profile name set up with:
#                              xcrun notarytool store-credentials <profile> \
#                                --apple-id <you@example.com> --team-id <TEAMID> \
#                                --password <app-specific password>
#                            If unset, notarization is skipped.
#
# If both are set, the DMG is signed, notarized, and stapled — ready
# to distribute to end users without Gatekeeper friction.

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

# Signing flags — ad-hoc if no identity configured.
CODESIGN_FLAGS=(ONLY_ACTIVE_ARCH=NO)
if [ -n "${CC_CODESIGN_IDENTITY:-}" ]; then
  echo "    Signing with: ${CC_CODESIGN_IDENTITY}"
  CODESIGN_FLAGS+=(
    CODE_SIGN_STYLE=Manual
    CODE_SIGN_IDENTITY="${CC_CODESIGN_IDENTITY}"
    OTHER_CODE_SIGN_FLAGS="--timestamp"
  )
else
  echo "    No CC_CODESIGN_IDENTITY — ad-hoc signing (dev only)."
fi

# Build Release
xcodebuild \
  -project "${SCRIPT_DIR}/CommonCompute.xcodeproj" \
  -scheme "${BUNDLE_NAME}" \
  -configuration Release \
  -derivedDataPath "${BUILD_DIR}" \
  "${CODESIGN_FLAGS[@]}" \
  clean build \
  | xcpretty 2>/dev/null || cat  # fall back to raw output if xcpretty not installed

APP_PATH="${BUILD_DIR}/Build/Products/Release/${BUNDLE_NAME}.app"

if [ ! -d "${APP_PATH}" ]; then
  echo "ERROR: Build failed — ${APP_PATH} not found"
  exit 1
fi

# Notarize the app bundle if a notary profile is configured.
if [ -n "${CC_CODESIGN_IDENTITY:-}" ] && [ -n "${CC_NOTARY_KEYCHAIN_PROFILE:-}" ]; then
  echo "==> Notarizing app bundle"
  NOTARY_ZIP="/tmp/cc-notary-$$.zip"
  ditto -c -k --keepParent "${APP_PATH}" "${NOTARY_ZIP}"
  xcrun notarytool submit "${NOTARY_ZIP}" \
    --keychain-profile "${CC_NOTARY_KEYCHAIN_PROFILE}" \
    --wait
  rm -f "${NOTARY_ZIP}"
  xcrun stapler staple "${APP_PATH}"
  echo "✓ App notarized + stapled."
else
  echo "==> Skipping notarization (no CC_NOTARY_KEYCHAIN_PROFILE set)."
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

# Sign + notarize the DMG itself when credentials are configured.
if [ -n "${CC_CODESIGN_IDENTITY:-}" ]; then
  codesign --sign "${CC_CODESIGN_IDENTITY}" --timestamp "${OUT_DIR}/${DMG_NAME}.dmg"
  echo "✓ DMG signed."
fi
if [ -n "${CC_CODESIGN_IDENTITY:-}" ] && [ -n "${CC_NOTARY_KEYCHAIN_PROFILE:-}" ]; then
  echo "==> Notarizing DMG"
  xcrun notarytool submit "${OUT_DIR}/${DMG_NAME}.dmg" \
    --keychain-profile "${CC_NOTARY_KEYCHAIN_PROFILE}" \
    --wait
  xcrun stapler staple "${OUT_DIR}/${DMG_NAME}.dmg"
  echo "✓ DMG notarized + stapled."
fi

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
