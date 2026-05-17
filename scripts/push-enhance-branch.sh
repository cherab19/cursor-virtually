#!/usr/bin/env bash
# Push post-development work to hackathon fork as branch "enhance", then open a PR to org main.
#
# Your fork:  https://github.com/cherab19/cursor-virtually  (branch development = last push)
# Upstream:    https://github.com/Ethiopian-Cursor-Community/cursor-virtually
#
# Run from repo root (needs git push access — use local machine or `gh auth login`, not Codespaces GITHUB_TOKEN alone):
#   chmod +x scripts/push-enhance-branch.sh
#   ./scripts/push-enhance-branch.sh
set -euo pipefail

FORK_URL="https://github.com/cherab19/cursor-virtually.git"
UPSTREAM="Ethiopian-Cursor-Community/cursor-virtually"
REMOTE_FORK="fork"

cd "$(dirname "$0")/.."

if ! git remote get-url "$REMOTE_FORK" &>/dev/null; then
  git remote add "$REMOTE_FORK" "$FORK_URL"
fi

echo "→ Pushing $(git branch --show-current) to cherab19/cursor-virtually:enhance ..."
git push -u "$REMOTE_FORK" HEAD:enhance

echo ""
echo "→ Open PR (fork enhance → upstream main):"
echo "  https://github.com/$UPSTREAM/compare/main...cherab19:enhance?expand=1"
echo ""
if command -v gh >/dev/null 2>&1; then
  gh pr create \
    --repo "$UPSTREAM" \
    --head "cherab19:enhance" \
    --base main \
    --title "enhance: directory fixes, schema order, demo tooling" \
    --body "$(cat <<'EOF'
## Summary
- Fix public creator directory (RPC + table fallback, anon profile policy)
- Move `has_role()` after `user_roles` for fresh SQL Editor applies
- Auth UX improvements and demo seed/build scripts
- Builds on prior `development` branch work

## Test plan
- [ ] Run `npm run db:build-sql` and apply SQL in Supabase
- [ ] `cd influencerhub && npm run dev` — landing featured creators load
- [ ] Sign up / directory / admin approval flow
EOF
)" || true
fi

echo "Done."
