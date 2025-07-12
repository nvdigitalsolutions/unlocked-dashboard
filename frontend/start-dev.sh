#!/usr/bin/env sh
set -e

# Ensure the correct Node.js version is used
required_major=20
current_major=$(node -v 2>/dev/null | sed 's/^v\([0-9]*\).*/\1/')
if [ "$current_major" -ne "$required_major" ]; then
  # Attempt to switch using nvm if available
  if [ -z "$NVM_DIR" ] && [ -s "$HOME/.nvm/nvm.sh" ]; then
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

# Validate Craft.js node types
node ./scripts/check-node-types.js

# Start Next.js in dev mode
NODE_OPTIONS="--inspect" next dev
