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

1. Copy `.env.example` to `.env` and adjust values as needed.
2. Install dependencies:
   ```bash
   (cd backend && npm install)
   (cd frontend && npm install)
   ```
3. Start the stack with Docker Compose:
   ```bash
   docker compose up --build
   ```
4. Visit `http://localhost:3000` for the frontend and `http://localhost:1337` for Strapi.

## Running tests

Both the backend and frontend include small Jest test suites. Execute them with:

```bash
cd backend && npm test
cd ../frontend && npm test
```

## Deployment

A sample GitHub Actions workflow (`.github/workflows/deploy.yml`) and DigitalOcean spec (`.do/app.yaml`) are provided as a starting point. Update them with your own values before enabling CI/CD.

## Fresh Ubuntu setup

On a clean Ubuntu installation you can get started with the following commands:

```bash
# Install required packages
sudo apt update
sudo apt install -y git docker.io docker-compose nodejs npm

# Clone the repository
git clone <this-repo-url>
cd unlocked-dashboard

# Copy environment variables
cp .env.example .env

# Install dependencies
(cd backend && npm install)
(cd frontend && npm install)

# Start services
docker compose up --build
```

After the services start you can access the frontend at `http://localhost:3000` and the Strapi admin at `http://localhost:1337`.
