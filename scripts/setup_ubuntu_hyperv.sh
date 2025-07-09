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

# Install project dependencies
(cd backend && npm install)
(cd frontend && npm install)

# Copy example environment file if .env does not exist
if [ ! -f .env ]; then
    cp .env.example .env
fi

# Build and start the application stack
# (remove '--build' on subsequent runs for faster startup)
if command -v docker &>/dev/null && docker compose version &>/dev/null; then
    docker compose up --build
else
    docker-compose up --build
fi
