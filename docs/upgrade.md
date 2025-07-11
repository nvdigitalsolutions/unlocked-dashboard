# Full Stack Upgrade Guide

This guide outlines the major steps to extend the starter project into the complete monorepo described in the project brief. Each step references official documentation so you can tailor the implementation to your needs.

## 1. Extend the Strapi backend - COMPLETED

1. Create additional collection types (Products, Orders, Appointments, Video Calls) using Strapi's Content Type Builder or by editing the JSON schemas under `backend/src/api`.
2. Configure roles and permissions so that public visitors can read published content while authenticated users can create orders and appointments.
3. Implement custom controllers or lifecycle hooks for features such as appointment conflict checking and the Stripe webhook for order confirmation.
4. Enable draft/publish and preview mode by setting `CLIENT_URL` and `PREVIEW_SECRET` in `backend/config/admin.js`.
5. Seed initial content inside `backend/src/index.js` during the bootstrap phase.

## 2. Build out the Next.js frontend - COMPLETED

1. Add pages for `/dashboard`, `/appointments`, `/store` and a dynamic `[slug].js` route. Use `getStaticPaths` and `getStaticProps` to fetch page data from Strapi.
2. Implement a basic authentication flow that calls Strapi's `/api/auth/local` endpoint and stores the returned JWT.
3. Integrate Craft.js on the dashboard so editors can design pages visually. Persist the generated JSON to the Strapi `Pages` collection type.
4. Display products from Strapi on the store page and create an API route (`/api/checkout`) that uses the Stripe SDK to start a Checkout Session.
5. Add a `/api/preview` route that enables Next.js draft mode when the correct secret is provided.

## 3. Docker and Environment - COMPLETED

1. Update `docker-compose.yml` with any new environment variables you introduce for Stripe or video call providers.
2. Ensure both `backend/Dockerfile` and `frontend/Dockerfile` install dependencies and build the apps in production mode.
3. Copy `.env.example` to `.env` and fill in strong secrets before running `docker compose up`.

## 4. Pre-deployment tasks - COMPLETED

Before deploying to DigitalOcean, address the following improvements that came
out of testing the demo app:

1. **Protect the dashboard** – add a `getServerSideProps` check in
   `dashboard.js` that verifies a valid JWT cookie is present. Redirect to
   `/login` when authentication fails so the editor isn't exposed to anonymous
   visitors.
2. **Enable inline save functionality** – reuse the dashboard's save logic on
   pages such as `index.js` and `[slug].js` so that editors can persist their
   Craft.js changes back to Strapi.
3. **Improve disabled Craft.js output** – when `enableCraftjs` is `false`, avoid
   rendering raw JSON. Show alternate content or hide the block entirely to keep
   pages readable.
4. *Optional*: enhance the editing experience with Craft.js tools like a custom
   sidebar or inline text editing. These aren't strictly required but make the
   editor workflow smoother.

## 5. Deployment on DigitalOcean

1. Edit `.do/app.yaml` so each service exposes the correct environment variables and routes. The example file already shows the structure.
2. Create a DigitalOcean App via the dashboard or `doctl` and supply the secrets referenced in the spec.
3. Optionally enable the provided GitHub Actions workflow which runs `doctl apps update` whenever you push to `main`.

This guide does not cover every detail of the final application but provides a high‑level checklist to help you iterate from the starter code. Consult the README and official docs for Next.js, Strapi and DigitalOcean as you expand the project.
