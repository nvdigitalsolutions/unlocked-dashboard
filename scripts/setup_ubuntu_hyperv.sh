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

# Install Node.js 18 (LTS) from NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
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

# Generate a JWT secret if the placeholder value is present
if grep -q '^JWT_SECRET=changeme' .env; then
    new_secret=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
    sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$new_secret|" .env
fi

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

# Ensure docker-compose passes the JWT secret to the backend
if ! grep -q 'JWT_SECRET:' docker-compose.yml; then
    sed -i '/ADMIN_JWT_SECRET:/a\      JWT_SECRET: ${JWT_SECRET}' docker-compose.yml
fi

# Build and start the application stack
# (remove '--build' on subsequent runs for faster startup)
if command -v docker &>/dev/null && docker compose version &>/dev/null; then
    docker compose up --build
else
    docker-compose up --build
fi
