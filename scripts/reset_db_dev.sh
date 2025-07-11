#!/usr/bin/env bash
set -euo pipefail

# Drop all tables in the development database
# This is useful when Strapi migrations fail and you want to start over

# Ensure docker compose is available
if ! command -v docker &>/dev/null; then
  echo "Docker is not installed" >&2
  exit 1
fi

if docker compose version >/dev/null 2>&1; then
  DC="docker compose"
else
  DC="docker-compose"
fi

$DC exec -T db psql -U strapi -d strapi -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

echo "Database schema reset."
