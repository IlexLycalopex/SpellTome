#!/usr/bin/env bash
# Replay every migration on a throwaway local Postgres and run the RLS tests.
# Requires a running Postgres 16 server; pass connection via PGHOST/PGPORT.
#
#   PGHOST=/tmp PGPORT=55432 PGUSER=postgres supabase/tests/run-local.sh
set -euo pipefail

cd "$(dirname "$0")/../.."

DB=tome_rls_test
psql -v ON_ERROR_STOP=1 -d postgres -qc "drop database if exists $DB"
psql -v ON_ERROR_STOP=1 -d postgres -qc "create database $DB"

echo "-- shim"
psql -v ON_ERROR_STOP=1 -d $DB -qf supabase/tests/shim.sql

for m in supabase/migrations/*.sql; do
  echo "-- $m"
  psql -v ON_ERROR_STOP=1 -d $DB -qf "$m"
done

echo "-- rls.test.sql"
psql -v ON_ERROR_STOP=1 -d $DB -f supabase/tests/rls.test.sql
