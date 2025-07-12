#!/usr/bin/env bash
set -euo pipefail

# This script installs the dependencies needed to run the project on a fresh
# Ubuntu Server 22.04 installation. It assumes it is executed from the root of
# the cloned repository.

# Install required packages
sudo apt update
sudo apt install -y ca-certificates curl gnupg git lsb-release

# Install Docker Engine from the official Docker repository so that it is
# managed as a systemd service.
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Install Node.js 20 (LTS) from NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Start and enable Docker
sudo systemctl enable --now docker

# Add current user to the docker group if not already added
if ! groups "$USER" | grep -q docker; then
    sudo usermod -aG docker "$USER"
    echo "You may need to log out and back in or run 'newgrp docker' for group changes to take effect." >&2
fi

# Dependencies will be installed automatically when the containers start

# Copy example environment file if .env does not exist
if [ ! -f .env ]; then
    cp .env.example .env
fi

# Replace placeholder secrets with random values
generate_secret() {
    var="$1"
    current=$(grep -E "^${var}=" .env | cut -d '=' -f2-)
    if printf '%s' "$current" | grep -Eq '^changeme|^change_me'; then
        case "$var" in
            APP_KEYS)
                new_value=$(node -e "console.log(Array.from({length:4}, () => require('crypto').randomBytes(16).toString('hex')).join(','))")
                ;;
            *)
                new_value=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
                ;;
        esac
        sed -i "s|^${var}=.*|${var}=${new_value}|" .env
        echo "Generated ${var} in .env"
    fi
}

for var in APP_KEYS ADMIN_JWT_SECRET JWT_SECRET API_TOKEN_SALT TRANSFER_TOKEN_SALT ENCRYPTION_KEY; do
    generate_secret "$var"
done

# Ensure the frontend talks to the backend via Docker's internal network for
# server-side requests. If NEXT_PUBLIC_BACKEND_URL is not set, default it to the
# same address so client-side code can reach the API when accessed locally.
if ! grep -q '^BACKEND_URL=' .env; then
    echo 'BACKEND_URL=http://backend:1337' >> .env
fi
if ! grep -q '^NEXT_PUBLIC_BACKEND_URL=' .env; then
    echo 'NEXT_PUBLIC_BACKEND_URL=http://localhost:1337' >> .env
fi

# If ALLOWED_DEV_ORIGIN is still set to localhost, update it to the
# machine's LAN IP so the frontend can be accessed from other hosts
# during development.
if grep -q '^ALLOWED_DEV_ORIGIN=http://localhost:3000' .env; then
    host_ip=$(hostname -I | awk '{print $1}')
    sed -i "s|^ALLOWED_DEV_ORIGIN=.*|ALLOWED_DEV_ORIGIN=http://${host_ip}:3000|" .env
    echo "ALLOWED_DEV_ORIGIN set to http://${host_ip}:3000"
    sed -i "s|^NEXT_PUBLIC_BACKEND_URL=.*|NEXT_PUBLIC_BACKEND_URL=http://${host_ip}:1337|" .env
fi
# Set the React editor for Next.js dev overlay
if ! grep -q '^REACT_EDITOR=' .env; then
    echo 'REACT_EDITOR=atom' >> .env
fi

# Ensure docker-compose passes the JWT secret to the backend
  if ! grep -q 'JWT_SECRET:' docker-compose.yml; then
      # shellcheck disable=SC2016
      sed -i '/ADMIN_JWT_SECRET:/a\      JWT_SECRET: ${JWT_SECRET}' docker-compose.yml
  fi

# Ensure docker-compose passes the transfer token salt to the backend
  if ! grep -q 'TRANSFER_TOKEN_SALT:' docker-compose.yml; then
      # shellcheck disable=SC2016
      sed -i '/API_TOKEN_SALT:/a\      TRANSFER_TOKEN_SALT: ${TRANSFER_TOKEN_SALT}' docker-compose.yml
  fi

# Check Craft.js node types so missing components are caught early
if command -v node &>/dev/null; then
    echo "Validating Craft.js components in Strapi pages..."
    if ! node frontend/scripts/check-node-types.js; then
        echo "Craft.js component validation failed. See docs/craft_resolver_error.md for details." >&2
    fi
fi

# Final message with instructions to start the stack
echo
echo "Setup complete! Review the .env file then launch the containers with:"
if command -v docker &>/dev/null && docker compose version &>/dev/null; then
    echo "  docker compose up --build"
else
    echo "  docker-compose up --build"
fi
