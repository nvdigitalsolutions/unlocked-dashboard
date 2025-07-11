#!/usr/bin/env sh
set -e


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

# Launch Strapi in develop mode with debug logging
exec npx strapi develop --debug
