# Unlocked Dashboard

This repository provides a minimal example of a full-stack project using a Next.js frontend and a Strapi backend. The setup uses Docker for local development and includes configuration files for deployment to DigitalOcean's App Platform.

## Structure

```
backend/   # Strapi application
frontend/  # Next.js application
.dockerignore
.env.example
docker-compose.yml
```

Both apps are basic starters. The backend exposes a single `Page` content type and the frontend contains a simple page and API route with Tailwind configured.

## Development

1. Copy `.env.example` to `.env` and adjust values as needed (particularly `APP_KEYS`, `ADMIN_JWT_SECRET` and `API_TOKEN_SALT`).
2. Start the stack with Docker Compose (dependencies will be installed automatically):
   ```bash
   docker compose up --build
   ```
3. Visit `http://localhost:3000` for the frontend and `http://localhost:1337` for Strapi.

## Running tests

Both the backend and frontend include small Jest test suites. Execute them with:

```bash
cd backend && npm test
cd ../frontend && npm test
```

## Deployment

A sample GitHub Actions workflow (`.github/workflows/deploy.yml`) and DigitalOcean spec (`.do/app.yaml`) are provided as a starting point. Update them with your own values before enabling CI/CD.

## Fresh Ubuntu setup

The repository includes a convenience script that installs all dependencies and starts the Docker stack. The steps below assume a brand new Ubuntu Server 22.04 installation running inside a Hyper-V virtual machine, but they also work on any Ubuntu 22.04 host.

```bash
# 1. Install required packages
sudo apt update
sudo apt install -y ca-certificates curl gnupg git lsb-release
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 2. Clone the repository and run the setup script
git clone https://github.com/nvdigitalsolutions/unlocked-dashboard.git
cd unlocked-dashboard
./scripts/setup_ubuntu_hyperv.sh
```

The script will:

1. Install Node.js 18 using NodeSource.
2. Ensure Docker is running and your user is part of the `docker` group.
3. Copy `.env.example` to `.env` if needed.
4. Install backend and frontend dependencies.
5. Build and launch the Docker containers.

After it finishes you can visit the frontend at `http://localhost:3000` and the Strapi admin at `http://localhost:1337`.

If Docker fails with a permission denied error when accessing `/var/run/docker.sock`, open a new terminal session or run `newgrp docker` so your shell picks up the new group membership, then rerun the last command.

### Manual steps

If you prefer to install everything manually, follow these commands instead of running the script:

```bash
# Install required packages
sudo apt update
sudo apt install -y ca-certificates curl gnupg git lsb-release
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin nodejs npm

# Clone the repository
git clone <this-repo-url>
cd unlocked-dashboard

# Copy environment variables
cp .env.example .env

# Start services (dependencies will be installed automatically)
docker compose up --build
```

Once the services start you can access the frontend at `http://localhost:3000` and the Strapi admin at `http://localhost:1337`.
