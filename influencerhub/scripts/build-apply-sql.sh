#!/usr/bin/env bash
# Concatenate supabase/migrations/*.sql into APPLY_IN_SQL_EDITOR.sql for dashboard paste.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/supabase/APPLY_IN_SQL_EDITOR.sql"
PROJECT_REF="${SUPABASE_PROJECT_REF:-sqapdmmczjlrwuibbtsr}"

{
  cat <<EOF
-- =============================================================================
-- InfluencerHub — run entire file in Supabase SQL Editor (fresh project)
-- Project: ${PROJECT_REF}
-- https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new
-- =============================================================================

EOF
  for f in "$ROOT"/supabase/migrations/*.sql; do
    [[ -f "$f" ]] || continue
    printf '\n-- >>> FILE: %s <<<\n\n' "$(basename "$f")"
    cat "$f"
  done
} >"$OUT"

echo "Wrote $OUT ($(wc -l <"$OUT") lines)"
