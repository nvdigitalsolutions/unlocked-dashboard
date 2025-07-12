#!/usr/bin/env sh
set -e

# Ensure the correct Node.js version is used
required_major=20
current_major=$(node -v 2>/dev/null | sed 's/^v\([0-9]*\).*/\1/')
if [ "$current_major" -ne "$required_major" ]; then
  # Attempt to switch using nvm if available
  if [ -z "$NVM_DIR" ] && [ -s "$HOME/.nvm/nvm.sh" ]; then
    # shellcheck disable=SC1090
    . "$HOME/.nvm/nvm.sh"
    current_major=$(node -v 2>/dev/null | sed 's/^v\([0-9]*\).*/\1/')
  fi
  if command -v nvm >/dev/null 2>&1; then
    echo "Switching to Node.js $required_major via nvm"
    nvm install $required_major >/dev/null
    nvm use $required_major >/dev/null
    current_major=$(node -v 2>/dev/null | sed 's/^v\([0-9]*\).*/\1/')
  fi
  if [ "$current_major" -ne "$required_major" ]; then
    echo "Node.js $required_major.x is required, found $(node -v)" >&2
    exit 1
  fi
fi

# Optionally reset the Postgres database if RESET_DB=true
if [ "${RESET_DB:-false}" = "true" ]; then
  echo "Resetting Postgres database..."
  if ! command -v psql >/dev/null 2>&1; then
    if command -v apk >/dev/null 2>&1; then
      apk add --no-cache postgresql-client
    else
      apt-get update && apt-get install -y postgresql-client
    fi
  fi
  PGPASSWORD="${DATABASE_PASSWORD:-strapi}" psql -h "${DATABASE_HOST:-db}" \
    -U "${DATABASE_USERNAME:-strapi}" -d "${DATABASE_NAME:-strapi}" \
    -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;"
fi


# Generate APP_KEYS if unset or using a placeholder value
if [ -z "${APP_KEYS:-}" ] || printf '%s' "$APP_KEYS" | grep -Eq '^changeme|^change_me'; then
  APP_KEYS=$(node -e "console.log(Array.from({length:4}, () => require('crypto').randomBytes(16).toString('hex')).join(','))")
  export APP_KEYS
  echo "Generated APP_KEYS for development"
fi


# Helper to generate a random secret if missing or placeholder
generate_secret() {
  var_name=$1
  current=$(eval "printf '%s' \"\${$var_name}\"")
  if [ -z "${current}" ] || printf '%s' "$current" | grep -Eq '^changeme|^change_me'; then
    case $var_name in
      APP_KEYS)
        new_value=$(node -e "console.log(Array.from({length:4}, () => require('crypto').randomBytes(16).toString('hex')).join(','))")
        ;;
      *)
        new_value=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
        ;;
    esac
    export $var_name="$new_value"
    echo "Generated $var_name for development"
  fi
}

# Generate required secrets if missing
for var in APP_KEYS ADMIN_JWT_SECRET JWT_SECRET API_TOKEN_SALT TRANSFER_TOKEN_SALT; do
  generate_secret "$var"
done

# Ensure dependencies are installed
if [ ! -d node_modules ]; then
  echo "Installing backend dependencies..."
  npm install
fi

# Rebuild better-sqlite3 if missing or compiled for a different Node version
if ! node -e "require('better-sqlite3')" >/dev/null 2>&1; then
  echo "Rebuilding better-sqlite3 for Node $(node -v)..."
  npm rebuild better-sqlite3 || npm install better-sqlite3
fi

# Launch Strapi in develop mode with debug logging
exec npx strapi develop --debug
