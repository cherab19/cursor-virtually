#!/usr/bin/env bash
# Push full InfluencerHub monorepo to Ethiopian Cursor Community hackathon repo.
# Requires write access to Ethiopian-Cursor-Community/cursor-virtually
set -euo pipefail

REPO_URL="https://github.com/Ethiopian-Cursor-Community/cursor-virtually.git"
REMOTE_NAME="community"

cd "$(dirname "$0")/.."

if ! git remote get-url "$REMOTE_NAME" &>/dev/null; then
  git remote add "$REMOTE_NAME" "$REPO_URL"
fi

echo "Pushing main → Ethiopian-Cursor-Community/cursor-virtually ..."
git push "$REMOTE_NAME" main:main

echo "Done: https://github.com/Ethiopian-Cursor-Community/cursor-virtually"
