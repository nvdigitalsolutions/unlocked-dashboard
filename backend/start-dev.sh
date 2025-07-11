
#!/bin/sh
set -e

# Verify required secrets are set and not using placeholder values
required_vars="APP_KEYS ADMIN_JWT_SECRET JWT_SECRET API_TOKEN_SALT TRANSFER_TOKEN_SALT"

for var in $required_vars; do
  eval value="\$$var"
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
