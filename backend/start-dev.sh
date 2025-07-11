#!/usr/bin/env sh
set -e

# Generate APP_KEYS if unset or using a placeholder value
if [ -z "${APP_KEYS:-}" ] || printf '%s' "$APP_KEYS" | grep -Eq '^changeme|^change_me'; then
  APP_KEYS=$(node -e "console.log(Array.from({length:4}, () => require('crypto').randomBytes(16).toString('hex')).join(','))")
  export APP_KEYS
  echo "Generated APP_KEYS for development"
fi

# Verify remaining required secrets are set and not using placeholder values
required_vars="ADMIN_JWT_SECRET JWT_SECRET API_TOKEN_SALT TRANSFER_TOKEN_SALT"

for var in $required_vars; do
  value=$(eval "printf '%s' \"\${$var}\"")
  case "$value" in
    ""|changeme*|change_me*)
      echo "Error: environment variable $var is not set or uses a placeholder value." >&2
      echo "Edit your .env file to provide real secrets before starting Strapi." >&2
      exit 1
      ;;
  esac
done

# Launch Strapi in develop mode with debug logging
exec npx strapi develop --debug
