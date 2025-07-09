#!/usr/bin/env bash
set -euo pipefail

# This script installs the dependencies needed to run the project on a fresh
# Ubuntu Server 22.04 installation. It assumes it is executed from the root of
# the cloned repository.

# Install required packages
sudo apt update
sudo apt install -y curl git docker.io docker-compose

# Install Node.js 18 (LTS) from NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Start and enable Docker
sudo systemctl enable --now docker

# Add current user to the docker group if not already added
if ! groups $USER | grep -q docker; then
    sudo usermod -aG docker $USER
    echo "You may need to log out and log back in for docker group membership to take effect." >&2
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
