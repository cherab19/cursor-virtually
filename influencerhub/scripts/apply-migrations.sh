#!/usr/bin/env bash
# Apply migrations via psql (needs database password from Supabase Dashboard → Settings → Database)
set -euo pipefail

PROJECT_REF="${SUPABASE_PROJECT_REF:-sqapdmmczjlrwuibbtsr}"
SQL_FILE="$(dirname "$0")/../supabase/APPLY_IN_SQL_EDITOR.sql"

if [[ -z "${SUPABASE_DB_PASSWORD:-}" ]]; then
  echo "Set your database password:"
  echo "  export SUPABASE_DB_PASSWORD='your-db-password'"
  echo ""
  echo "Find it: Dashboard → Project Settings → Database → Database password"
  echo ""
  echo "Or paste this file in the SQL Editor instead:"
  echo "  $SQL_FILE"
  echo "  https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new"
  exit 1
fi

DB_URL="postgresql://postgres.${PROJECT_REF}:${SUPABASE_DB_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

if ! command -v psql >/dev/null 2>&1; then
  echo "Install psql (postgresql-client) or use the SQL Editor in the dashboard."
  exit 1
fi

echo "Applying migrations to project ${PROJECT_REF}..."
psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$SQL_FILE"
echo "Done."
