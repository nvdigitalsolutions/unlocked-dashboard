# Unlocked Dashboard

This repository provides a minimal example of a full-stack project using a Next.js frontend and a Strapi backend. The setup uses Docker for local development and includes configuration files for deployment to DigitalOcean's App Platform.

## Structure

```
backend/   # Strapi application
frontend/  # Next.js application
.dockerignore
.env.example
.docker-compose.yml
```

Both apps are basic starters. The backend includes a single `Page` content type and uses SQLite by default. The frontend contains a simple page and API route with Tailwind configured.

## Development

1. Copy `.env.example` to `.env` and adjust values as needed.
2. Run `docker compose up --build` to start the database, backend and frontend.
3. Visit `http://localhost:3000` for the frontend and `http://localhost:1337` for Strapi.

## Deployment

A sample GitHub Actions workflow (`.github/workflows/deploy.yml`) and DigitalOcean spec (`.do/app.yaml`) are provided as a starting point. Update them with your own values before enabling CI/CD.
