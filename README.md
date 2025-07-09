# Full-Stack Monorepo: Next.js (Craft.js) Frontend & Strapi Backend

This monorepo contains a **Next.js** frontend and a **Strapi** backend, configured for seamless development and production deployment. It includes a Next.js app (with Tailwind CSS and Craft.js for a drag-and-drop page builder), a Strapi CMS (with custom content types and JWT auth), Docker configuration for each, a **Docker Compose** setup for local development, and CI/CD via GitHub Actions to deploy on **DigitalOcean App Platform**. All secrets are managed via environment variables, with placeholder values provided (and instructions to replace them securely in production).

## Project Structure and Files

```plaintext
repo-root/
├── frontend/              # Next.js 15+ app (Tailwind CSS, Craft.js builder)
│   ├── pages/             # Next.js pages (dashboard, appointments, store, [slug].js, API routes)
│   ├── components/        # React components (including Craft.js editor components)
│   ├── lib/               # Utility libraries (e.g. auth helper, Stripe integration)
│   ├── public/            # Public assets (if any)
│   ├── tailwind.config.js # Tailwind CSS configuration
│   ├── next.config.js     # Next.js configuration (env variables, etc.)
│   ├── Dockerfile         # Dockerfile for containerizing the Next.js app
│   └── package.json       # Frontend dependencies and scripts
├── backend/               # Strapi v4 CMS app (Node.js headless CMS)
│   ├── config/            # Configuration (database, server, middleware using env vars)
│   ├── src/               
│   │   ├── api/           # Content type definitions (Pages, Products, Orders, etc.)
│   │   ├── extensions/    # Extensions or custom code (e.g. controllers for Stripe webhooks)
│   │   ├── index.js       # Strapi bootstrap file (seeds initial data on startup)
│   │   └── ...            # (Other Strapi framework files)
│   ├── Dockerfile         # Dockerfile for containerizing the Strapi app
│   └── package.json       # Backend dependencies (Strapi, plugins, etc.)
├── .github/
│   └── workflows/
│       └── deploy.yml     # GitHub Actions workflow for CI/CD to DigitalOcean
├── .do/
│   └── app.yaml           # DigitalOcean App Platform spec (defines services, env vars)
├── docker-compose.yml     # Docker Compose for local dev (frontend + backend + database)
├── .env.example           # Example environment variables (to be copied to .env and edited)
├── .gitignore             # Git ignore for Node, logs, build artifacts, etc.
├── .dockerignore          # Docker ignore to reduce build context (e.g. node_modules)
└── README.md              # Documentation for setup, usage, and deployment
```

**Monorepo approach:** Both **frontend** and **backend** are separate Node.js projects managed in one repository (for convenience, you can use Yarn workspaces or npm workspaces, but it’s not required). Each has its own package.json and can be developed independently, but Docker and CI configuration ties them together for a unified deployment.

## Frontend: Next.js + Tailwind CSS + Craft.js

**Tech Stack:** The frontend is built with **Next.js** (React framework) and styled with **Tailwind CSS** for utility-first styling. It integrates **Craft.js** (a drag-and-drop page builder library for React) to allow visual editing of page content.

* **Tailwind Integration:** The Next.js app is configured with Tailwind via a `tailwind.config.js` and PostCSS setup. Styles are applied via Tailwind utility classes in React components. The Tailwind config is standard (content paths include `pages/**/*.{js,jsx}` and `components/**/*.{js,jsx}` etc., and extends the default theme as needed).

* **Pages and Routes:** Key pages are implemented:

  * `/dashboard` – A protected dashboard page for logged-in users, which includes an interface to manage content (including the Craft.js page editor).
  * `/appointments` – A page where users can book appointments (or view their scheduled appointments).
  * `/store` – An e-commerce page listing products from Strapi (with “Add to cart” and “Checkout” functionality).
  * `/[slug].js` – A dynamic route to render CMS pages by slug. This pulls content from Strapi’s “Pages” content type (supports static generation with fallback or server-side rendering, and works with Next Preview Mode for draft content).
  * **Next.js API routes:** Under `pages/api/`, there are routes for things like authentication (`api/auth.js` or similar for login), Stripe checkout (`api/checkout.js` to create Stripe sessions), and preview (`api/preview.js` to enable preview mode for draft content).

* **Craft.js Page Builder:** On the dashboard (or a dedicated page builder route), we integrate Craft.js to allow building custom pages:

  * We define **Craft.js editor components** (e.g., `components/craft/Button.js`, `components/craft/Text.js`, `components/craft/Container.js` etc.) which represent elements users can drag and drop. These are basic React components (e.g., a Text component rendering a `<p>` tag, a Container that applies styling and contains other components, etc.) per Craft.js’s tutorial.
  * A Craft.js `<Editor>` is used to wrap the page builder UI. Within the Editor, we use a `<Frame>` that holds user-designed content. We provide a sidebar toolbox of components and a settings panel for editing selected component props, as in Craft.js’s basic example.
  * The output of Craft.js (the page layout structure, probably as a JSON or serialized state) can be saved to Strapi. For example, the **Pages** content type in Strapi includes a field to store the Craft.js JSON data or page blocks. The user can design a page in the frontend builder and save it via an API call to Strapi (authenticated).
  * The dynamic `[slug]` page on Next.js will fetch the page content from Strapi (including the saved Craft.js structure) and render it. We may recreate the page using Craft.js `<Renderer>` or by parsing the JSON to React components, thereby displaying the content as designed.

* **Authentication (JWT + Strapi):** Authentication is handled via Strapi’s JWT-based system. Users can sign up or log in through the Next.js app:

  * We include a login page (or modal) where users enter credentials. On submit, the frontend calls Strapi’s REST API (`POST /api/auth/local` with email and password) to obtain a JWT. If successful, we store this JWT in a secure way (for example, HTTP-only cookie or in memory via Next.js `Iron` sessions, or localStorage for simplicity).
  * The JWT is included in subsequent requests to protected API routes or Strapi endpoints (e.g., using the Authorization header).
  * Client-side, we maintain an auth context or hook (e.g., `useAuth`) to track logged-in state. We also protect certain pages (like dashboard) by checking for a valid JWT (this can be done either by Next.js server-side logic or on the client redirecting to login if not authenticated).
  * Strapi’s **Users & Permissions** plugin is used for managing roles. We use the default **Authenticated** role for normal users and **Public** for guest access. Permissions in Strapi are configured accordingly (e.g., Public can read products and pages, but only Authenticated users can create orders or appointments, etc.). These roles and permissions are set in the Strapi admin panel, or via the Strapi configuration on first run (the project could include a script to ensure certain permissions are enabled for required endpoints).

* **Pages & Preview Mode:** The `[slug].js` page uses Next.js data fetching to retrieve the page content by slug from Strapi. We support **Preview Mode** so that content editors can preview draft pages:

  * Next.js Preview Mode is implemented with a secret token. We have an API route `pages/api/preview.js` that expects a secret (and a page slug). If the token matches an environment variable (e.g. `PREVIEW_SECRET`), Next.js sets a preview cookie and redirects to the `[slug]` page, which then loads draft content (using Strapi’s API with `?_publicationState=preview` or using Strapi’s new draft preview feature).
  * Strapi is configured with preview support: in Strapi’s config, we set `PREVIEW_SECRET` and the frontend URL. Strapi v5 provides a built-in preview button integration. We enabled this by setting environment variables `CLIENT_URL` (the Next.js app URL) and `PREVIEW_SECRET` in Strapi’s `.env`. With `preview.enabled = true` in Strapi config, content editors in the Strapi admin can click "Preview" which triggers the Next.js preview route with the secret, showing the draft content on the site.
  * **Dynamic Rendering:** In production, for performance, we can use Next.js Incremental Static Regeneration (ISR) for public pages – e.g. generate static pages for each slug at build time or on-demand, and revalidate as content changes. The repository includes Next.js config for `getStaticPaths`/`getStaticProps` for pages (with revalidate) and uses Strapi webhooks (or manual revalidation triggers) to update when content is updated.

* **E-commerce (Stripe Integration):** The store page displays products from Strapi (via REST API or GraphQL). Users can add products to a cart (managed client-side or via Strapi). For checkout, we integrate **Stripe Checkout**:

  * We use Stripe’s **Checkout Sessions** for a secure payment flow. The Next.js app has an API route (e.g., `pages/api/checkout.js`) that handles checkout requests. This route uses the Stripe Secret Key (loaded from an env var like `STRIPE_SECRET_KEY`) to create a Checkout Session (specifying line items from the cart, success/cancel URLs, etc.). We use Stripe’s Node library for this.
  * The frontend calls this API route when the user clicks “Checkout”. The route returns the Session ID or URL, and the frontend either redirects the user to the Stripe Checkout page or uses Stripe.js to handle the redirect.
  * After payment, Stripe will redirect back to our Next.js app (to a success page). We also set up a Stripe Webhook to notify the backend (Strapi) of successful payments:

    * The Strapi backend has a custom endpoint (e.g., a route `/api/orders/stripe-webhook`) which the Stripe webhook calls. We secure it by checking the Stripe signature (Stripe endpoint secret, stored in env). The Strapi controller for this webhook (implemented in `src/extensions`) will verify the event and update the corresponding Order entry (e.g., mark it paid, store the Stripe payment ID).
    * The Next.js success page can also call the Strapi backend to mark the order as paid or display order confirmation, but using a webhook is more secure/reliable for final confirmation.
  * The **Orders** content type in Strapi is used to record orders. When a Checkout Session is created, we also create a draft Order in Strapi (via API call from Next.js or as part of webhook after payment) with status "pending". The webhook then updates it to "paid". Each Order stores user info, the products purchased (could be a relation to Product entries or a JSON of items), total amount, and Stripe transaction references.

* **Appointments & Video Calls:** The frontend provides an interface for scheduling appointments. On the `/appointments` page:

  * Users can select a date/time and book an appointment (perhaps using a calendar component). When booked, the frontend sends a request to the Strapi backend to create an **Appointment** entry (if authorized).
  * We ensure basic booking logic such as not double-booking the same time slot for the same user. This logic can be enforced in the backend (e.g., a Strapi lifecycle hook or custom endpoint checks for conflicts).
  * If an appointment is meant to be a video call, we integrate with a video call service:

    * For example, if using **Zoom**, we could use Zoom’s API to create a meeting when an appointment is booked. We include placeholders for Zoom integration: environment variables `ZOOM_API_KEY` and `ZOOM_API_SECRET`, and in the Strapi backend, a service that uses these to create Zoom meetings via Zoom’s REST API. The created meeting link can be saved in the **Video Call** content type (and associated with the appointment).
    * If using **Jitsi**, we might not need an API – we can generate a unique meeting room name. The app could include a Jitsi Meet URL template (e.g., using public meet.jit.si) and create a random room name for each appointment. This link would be saved in the **Video Calls** collection.
    * The **Video Calls** content type in Strapi is designed to store details such as: meeting provider (Zoom/Jitsi), meeting ID or URL, associated Appointment or User, schedule time, etc. For simplicity, our seed data and structure include this content type, and we left hooks where integration code can be added. The monorepo provides the structure for video call integration, but actual API calls might require filling in API credentials and enabling the integration code.
  * The Next.js frontend will show upcoming appointments, and if an appointment has a video meeting link associated, it will provide a "Join Call" button that opens the Zoom or Jitsi link at the scheduled time.

* **Environment Variables (Frontend):** The Next.js app uses environment variables (with a `.env.local` for development) for configuration:

  * `NEXT_PUBLIC_API_URL` – Base URL of the backend API (for Strapi). In development, e.g., `http://localhost:1337`; in production on DO, it could point to the internal or public URL of the Strapi service.
  * `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` – The Stripe publishable key (for Stripe.js).
  * `STRIPE_SECRET_KEY` – (Used in API routes only, not exposed to browser) The Stripe secret key for creating Checkout sessions.
  * `PREVIEW_SECRET` – Secret token for Next.js Preview Mode (must match Strapi’s config). This is kept server-side.
  * Possibly others like `NEXT_PUBLIC_JITSI_DOMAIN` (if using a custom Jitsi server) or `NEXT_PUBLIC_ZOOM_SDK_KEY` if doing client-side Zoom integration (not likely here – we do server-side).
  * These variables are defined in the deployment environment (DigitalOcean) and in a local `.env` for development. The repository’s `.env.example` lists all required vars with dummy placeholders so you know what to set.

* **Dockerfile (Frontend):** The `frontend/Dockerfile` is configured for production deployment. It uses a multi-stage build to produce an optimized image:

  1. **Build Stage:** Uses Node.js (e.g., `node:20-alpine`) to install dependencies and build the Next.js app:

     ```Dockerfile
     FROM node:20-alpine AS builder
     WORKDIR /app
     COPY package.json package-lock.json ./ 
     RUN npm install                # Install all dependencies
     COPY . .                       # Copy all frontend source code
     RUN npm run build              # Build the Next.js application
     ```
  2. **Run Stage:** Uses a lightweight Node image to run the app:

     ```Dockerfile
     FROM node:20-alpine
     WORKDIR /app
     COPY --from=builder /app/.next ./.next   # Next build output
     COPY --from=builder /app/node_modules ./node_modules
     COPY --from=builder /app/package.json ./package.json
     COPY --from=builder /app/public ./public
     EXPOSE 3000
     CMD ["npm", "run", "start"]   # Start Next.js in production mode
     ```

  The container expects env vars (like API URL, Stripe keys) to be provided at runtime. In production (DigitalOcean), these will be set via the App Platform spec. **No secrets are baked into the image.** For example, the Next.js runtime will pick up `process.env.NEXT_PUBLIC_API_URL` etc. (Next.js will also embed `NEXT_PUBLIC_*` vars at build time for client-side usage, so we ensure those are set appropriately during build or use runtime configuration as needed).

## Backend: Strapi CMS (Node.js)

**Tech Stack:** The backend uses **Strapi v4 (Node.js)** – a headless CMS that provides a REST (and optional GraphQL) API, a content editor admin panel, and a plugin system. We chose Strapi for quick development of common features like auth, content types, and its integration with front-end frameworks. The Strapi project is set up with PostgreSQL as the database (recommended for production).

* **Strapi Content Types:** We have predefined the following collection types in Strapi:

  * **Pages:** For static/dynamic pages content (editable via the page builder). Fields might include: `title`, `slug`, `content` (which could be Rich Text or a JSON field for Craft.js data), `excerpt`, `image`, etc. This powers the Next.js `[slug]` pages. The Pages type is draft/publish enabled (so editors can publish or keep drafts, which works with Next preview).
  * **Products:** For store items. Fields: `name`, `description` (rich text), `price`, `image` (media), `stripePriceId` (to store the Stripe Price or Product ID for integration), etc. These are listed on the Next.js store page.
  * **Orders:** For purchases made. Fields: relation to **User** (customer), relation to one or more **Products** (or a JSON listing product names and prices at time of purchase), `totalAmount`, `status` (e.g., pending, paid, fulfilled), and maybe `stripeCheckoutId` or `paymentIntentId` to correlate with Stripe. Orders are created via the checkout process.
  * **Appointments:** For user-booked appointments. Fields: `user` (relation to **User**), `datetime` (date/time of appointment), `type` or `title` (maybe the purpose of the meeting), `status` (scheduled, completed, canceled), and possibly relation to **Video Call** (if one is associated).
  * **Video Calls:** For video meeting details. Fields: `provider` (e.g., "Zoom" or "Jitsi"), `meetingUrl` or `meetingId`, `password` (if any), and relations like `appointment` (linking to the Appointment it’s for) or `hostUser`. This separation allows storing call info that might not be needed for all appointments.
  * **Users:** This is managed by Strapi’s built-in **Users & Permissions** plugin. The default attributes (username, email, password, etc.) are used. We could extend it with profile fields if needed (not strictly required for this project). Notably, Strapi uses JWT for user auth and handles password hashing and verification out-of-the-box.
  * Additionally, Strapi has a built-in **Roles** system (Users & Permissions plugin) where by default there’s *Public* and *Authenticated* roles. We configure these so that:

    * Public (unauthenticated) can read `Products` and `Pages` (so the store and site pages can be viewed without login), but cannot create/modify content.
    * Authenticated users can create `Orders` (via checkout, though we likely allow this through a controller without requiring special permission since it’s done server-side) and create `Appointments`. We ensure appropriate permissions are set for any custom endpoints (like if we add a custom endpoint for booking appointments or Stripe webhooks, we might mark them as public or use API tokens).
    * The Strapi **Admin** role (separate from public roles) is for content managers to log into the Strapi admin panel. We provide a way to bootstrap an admin user on first run (see **Bootstrap script** below).

* **Strapi Configuration:**

  * **Database:** Configured for PostgreSQL. In `backend/config/database.js`, we use environment variables to define the connection (to work locally and on DigitalOcean). For example:

    ```js
    // backend/config/database.js
    module.exports = ({ env }) => ({
      connection: {
        client: 'postgres',
        connection: {
          host: env('DATABASE_HOST', 'localhost'),
          port: env.int('DATABASE_PORT', 5432),
          database: env('DATABASE_NAME', 'strapi'),
          user: env('DATABASE_USERNAME', 'strapi'),
          password: env('DATABASE_PASSWORD', 'strapi'),
          ssl: env.bool('DATABASE_SSL', false),
        },
      },
    });
    ```

    In production, instead of individual host/port, we often use a single `DATABASE_URL` (which we do support as well – the config can parse `env('DATABASE_URL')` if provided). The DigitalOcean App Platform will supply a `DATABASE_URL` for the managed PostgreSQL, so our config prioritizes that if set.
  * **Server:** Configured in `backend/config/server.js` to use environment vars for things like host and port. We ensure Strapi listens on `0.0.0.0` and port `1337` by default (since that’s what our Docker expects). We also set `url` if needed for proxies (not strictly needed on App Platform, but e.g. for correct asset URLs).
  * **Admin Panel:** Config in `backend/config/admin.js` sets up the admin JWT secret and optionally an admin URL. We include the preview configuration here as described: enabling preview, setting allowed origin to the frontend URL, and providing the preview handler if needed. For example:

    ```js
    // backend/config/admin.js
    module.exports = ({ env }) => ({
      auth: {
        secret: env('ADMIN_JWT_SECRET'),
      },
      apiToken: {
        salt: env('API_TOKEN_SALT'),
      },
      preview: {
        enabled: true,
        config: {
          // allowedOrigins and handler as needed
          allowedOrigins: [env('CLIENT_URL')],  // e.g. the Next.js URL
        }
      }
    });
    ```

    The `ADMIN_JWT_SECRET` and `API_TOKEN_SALT` are environment variables we set for security (Strapi requires these for admin auth and API tokens; we provide placeholders for them).
  * **Plugins:** We use the Users & Permissions plugin (enabled by default) for auth, and the Email plugin can be configured (though not mandatory for core functionality). If we needed image upload, the Upload plugin is enabled (using local file system by default; for production you might configure cloud storage). We did not include any third-party plugins that need installation; everything uses Strapi’s core.

* **Custom Code in Strapi:**

  * **Stripe Webhook endpoint:** We added a custom route and controller under `src/api/order/controllers/stripe.js` (for example) to handle Stripe webhooks. This endpoint is configured to be accessible publicly (Stripe will post to it). It verifies the Stripe signature (using the signing secret from env var `STRIPE_WEBHOOK_SECRET`). After verification, it looks at the event type (e.g., `checkout.session.completed`) and retrieves the relevant Order in Strapi (likely by a session ID stored or by looking up the email). Then it updates that Order’s status to paid. We register this route in Strapi’s `src/api/order/routes` with the `config: { auth: false }` (to allow Stripe to call it without auth, since we verify via secret signature instead).
  * **Zoom integration (optional):** We include a service file (e.g., `src/utils/zoom.js` or inside the Video Call content type lifecycle) which, if `ZOOM_API_KEY` is set, can create meetings via Zoom’s API. This might involve an install of Zoom’s SDK or a simple fetch to Zoom’s REST API. The logic is: on creating a Video Call record (or an Appointment that requires a video call), if Zoom integration is enabled, call Zoom API to create a meeting and update the Video Call entry with meeting join URL and password. (This code is provided in a basic form and is disabled if no API key/secret are provided.)
  * **Jitsi integration:** If using Jitsi, we might not need an API call (for public Jitsi Meet). Instead, on Video Call creation, we generate a random room name (e.g., a UUID or slug) and form a meet.jit.si URL. We store that in the Video Call entry. The frontend can use this URL to launch the meeting.
  * **Appointment booking logic:** We override the default create behavior for Appointments (via a lifecycle hook or custom controller) to implement simple conflict checking – e.g., before creating a new Appointment, check if the same user has another appointment at the same time (± some buffer). If so, throw an error. This ensures no double booking. (This is a simple example of business logic that can be handled in Strapi either with [lifecycle callbacks](https://docs.strapi.io/dev-docs/backend-customization/models#lifecycle-hooks) or custom endpoints.)
  * **Data relationships:** We set up relations in content types appropriately. For example, Orders have many Products (via a join table Strapi creates), Appointments optionally have one Video Call (one-to-one), etc. Strapi’s content-type builder (or the JSON schema files in `src/api/**/content-types/*.json`) define these relations.

* **Bootstrap Script (Initial Data):** We include a bootstrap function that runs on server start (defined in `backend/src/index.js`). This function seeds some initial data and configurations:

  * Creates a default **Admin User** for Strapi (so you can log into the Strapi admin panel). The email and password for this admin come from environment variables `STRAPI_ADMIN_EMAIL` and `STRAPI_ADMIN_PASSWORD`. If those are set and no admin account exists yet, the bootstrap will create one with those credentials. (This avoids leaving Strapi without an admin on first deploy. Make sure to change these from the placeholder values in production.)
  * Seeds some content: e.g., create a sample Page (Home page with some default content), a couple of sample Products, etc., only if the database is empty for those types. This is done for demonstration so that right after deployment you have something to see on the frontend. The sample data uses placeholder images and text, which can be edited or removed.
  * Ensures roles/permissions are set: for instance, the Public role is given read access to Products and Pages by default in bootstrap (this can also be done via Strapi’s admin UI, but we automate it). We also ensure that the `authenticated` role has create permission on Orders and Appointments.
  * Note: The bootstrap script will not overwrite existing data on each restart; it typically checks if data exists. For example, if at least one product exists, it will skip seeding products.

* **Security (JWT & Secrets):** We follow Strapi’s best practices by using strong secrets for JWT signing and other keys:

  * `JWT_SECRET` is set in environment for the Users & Permissions plugin (this signs API JWTs for user auth).
  * `ADMIN_JWT_SECRET` for signing admin panel tokens.
  * `APP_KEYS` for cookie signing (Strapi uses this for sessions).
  * `API_TOKEN_SALT` for generating API tokens. All these are placed in the `.env.example` as placeholders (e.g., a randomly generated string for each). **It is critical to change these in production** – use secure random values. In this monorepo, we do **not** commit real secrets; the example file is for reference. DigitalOcean App Platform will be configured with the real values as environment vars.
  * By externalizing these secrets, we ensure the repository is safe. The README instructs how to generate and set them (for example, using a command or an online UUID generator for each secret).

* **Dockerfile (Backend):** The `backend/Dockerfile` is also multi-stage for an optimized build:

  1. **Build Stage:** Use Node 20 image to install dependencies and build Strapi:

     ```Dockerfile
     FROM node:20-alpine AS build
     WORKDIR /app
     COPY package.json package-lock.json ./
     RUN npm install        # install Strapi and plugins
     COPY . .               # copy all Strapi source code
     RUN npm run build      # build the Strapi admin panel
     ```

     This will produce the build artifacts for the Strapi admin (in `build` or `.cache` and `build` directories).
  2. **Run Stage:** Use a slim Node image:

     ```Dockerfile
     FROM node:20-alpine
     WORKDIR /app
     COPY --from=build /app/package.json ./package.json
     COPY --from=build /app/node_modules ./node_modules
     COPY --from=build /app/build ./build            # Admin panel build
     COPY --from=build /app/.tmp ./.tmp              # Strapi internal tmp (if needed for plugins)
     COPY --from=build /app/src ./src                # Application source (models, controllers)
     COPY --from=build /app/config ./config          # Configuration
     COPY --from=build /app/public ./public          # Public assets (e.g., uploads if any seeded)
     ENV NODE_ENV=production
     EXPOSE 1337
     CMD ["npm", "run", "start"]   # Runs Strapi in production mode
     ```

  We set `NODE_ENV=production` to ensure Strapi uses the production config and optimizations. The container will rely on environment variables (for DB connection, secrets, etc.) at runtime – none of those are in the image. **Important:** The Strapi image expects the environment vars for database and secrets to be provided. In our Docker Compose and in DigitalOcean, we supply those externally.

* **Database in Dev vs Prod:** For development (Docker Compose), we spin up a PostgreSQL container. In production (DigitalOcean), we plan to use a managed PostgreSQL database:

  * The Strapi config is flexible to handle both. In dev, the compose file provides `DATABASE_HOST=database` (the service name) and credentials (see below). In production, we will provide `DATABASE_URL` (a single connection string that DigitalOcean provides for its managed DB) or the equivalent parts through env vars in the App spec.
  * Using a managed DB means the Strapi container remains stateless (no data stored inside it), which is good for scaling and persistence. All user-uploaded files by Strapi (if any) either remain in the container’s `public/uploads` or should be moved to cloud storage in a real-world setup. For this project, we keep uploads local for simplicity, but on App Platform, ephemeral storage means if the app is redeployed, uploads would vanish. A production setup should use something like an S3 bucket (DigitalOcean Spaces) for Strapi media. We note this in README for future improvement, but it's outside scope here.

## Root-Level Configurations

At the root of the monorepo, we include configuration files to tie everything together and to aid deployment:

* **README.md:** Detailed documentation (much of which is summarized here) on how to set up the project, both locally and in production. It includes:

  * Prerequisites (Node.js version, Docker, etc.).
  * Local development instructions: how to copy `.env.example` to `.env` for both frontend and backend (or use docker-compose which can auto-read `.env` file), then run `docker-compose up`.
  * How to access the app locally (frontend on localhost:3000, Strapi on localhost:1337).
  * Instructions for creating a Stripe account and obtaining API keys, setting up Zoom/Jitsi credentials if needed, and adding them to the environment.
  * Deployment instructions: how to use the DigitalOcean App spec or the GitHub Actions workflow. It explains any required setup on DigitalOcean (like creating a PostgreSQL instance and gathering its connection URL, setting up environment variables in the App Platform console or spec file, etc.). It also emphasizes **security**: e.g., reminding to change default passwords, to add proper CORS settings in Strapi (our Strapi config allows the frontend’s domain), and to use HTTPS in production.
  * Troubleshooting tips and links to documentation for the various tools.

* **.gitignore:** Configured to ignore Node modules, build outputs, environment files, and other clutter. For example, it contains entries like:

  ```
  node_modules/
  .cache/
  .tmp/
  build/
  .env
  .env.local
  .DS_Store
  .next/
  *.log
  ```

  This ensures we don’t commit dependencies or sensitive files. Both frontend and backend will use this global .gitignore (and we also have separate ignore rules if needed in subfolders).

* **.dockerignore:** To optimize Docker builds, we ignore files that aren’t needed in the container context. For example:

  ```
  **/node_modules
  **/build
  **/.next
  **/uploads
  .git
  .github
  .env
  .env.local
  ```

  This prevents copying local modules (we do fresh installs in Docker) and git history, etc., making the build context smaller and safer.

* **docker-compose.yml:** A docker-compose configuration for running the full stack locally with one command. This file defines three services: `frontend`, `backend`, and `database`:

  ```yaml
  version: '3.8'
  services:
    frontend:
      build: 
        context: ./frontend
        dockerfile: Dockerfile
      ports:
        - "3000:3000"
      env_file: .env          # load environment variables (or specify environment:)
      environment:
        NEXT_PUBLIC_API_URL: "http://localhost:1337"    # Frontend should call backend here
        NEXT_PUBLIC_STRIPE_PUBLIC_KEY: "${NEXT_PUBLIC_STRIPE_PUBLIC_KEY}"
        STRIPE_SECRET_KEY: "${STRIPE_SECRET_KEY}"
        PREVIEW_SECRET: "${PREVIEW_SECRET}"
      depends_on:
        - backend

    backend:
      build:
        context: ./backend
        dockerfile: Dockerfile
      ports:
        - "1337:1337"
      env_file: .env          # Use the same .env for convenience, or a separate one
      environment:
        NODE_ENV: development
        DATABASE_CLIENT: postgres
        DATABASE_HOST: database
        DATABASE_PORT: 5432
        DATABASE_NAME: strapi
        DATABASE_USERNAME: strapi
        DATABASE_PASSWORD: strapi
        JWT_SECRET: "${JWT_SECRET}"
        ADMIN_JWT_SECRET: "${ADMIN_JWT_SECRET}"
        APP_KEYS: "${APP_KEYS}"
        API_TOKEN_SALT: "${API_TOKEN_SALT}"
        STRAPI_ADMIN_EMAIL: admin@example.com
        STRAPI_ADMIN_PASSWORD: admin             # (change in .env for real use)
        STRIPE_WEBHOOK_SECRET: "${STRIPE_WEBHOOK_SECRET}"
        ZOOM_API_KEY: "${ZOOM_API_KEY}"
        ZOOM_API_SECRET: "${ZOOM_API_SECRET}"
        CLIENT_URL: "http://localhost:3000"      # for Strapi preview and CORS
      depends_on:
        - database

    database:
      image: postgres:15-alpine
      ports:
        - "5432:5432"
      environment:
        POSTGRES_DB: strapi
        POSTGRES_USER: strapi
        POSTGRES_PASSWORD: strapi
      volumes:
        - db_data:/var/lib/postgresql/data

  volumes:
    db_data:
  ```

  In this setup, the `frontend` and `backend` services build their images using the local Dockerfiles. We use an `.env` file to supply variables so that you only need to edit one file for local environment settings. (Alternatively, we could have put some of these directly in compose, but using an env file makes it easier to switch to production values or keep secrets out of compose file.) The `depends_on` ensures the backend starts after the database, and the frontend after the backend (though Compose doesn’t wait for readiness, just container start; in practice Next might retry requests until Strapi is up).

  * Note: We expose the DB port for convenience (so you can connect with a DB client if needed). In production on DO, the DB will be separate and likely not publicly exposed.
  * We set `DATABASE_PASSWORD: strapi` etc., which are obviously insecure defaults. These are for local dev only (the .env.example uses these for local). In production, we will not use these; instead the managed DB will have a strong password and the URL will be provided.
  * The env vars for secrets like `JWT_SECRET` in the compose will be filled from `.env`. Initially, `.env.example` provides random example values (like `JWT_SECRET=changeme_jwt_secret` etc.); the developer should replace them with secure random strings for real use even in dev (or at least in prod).
  * The `CLIENT_URL` is set so Strapi knows the frontend’s address (used for preview and also we allow CORS for this origin; in Strapi’s `config/middlewares.js` we likely have enabled CORS and added an env-based origin allowlist).

* **DigitalOcean App Spec (`.do/app.yaml`):** This file describes how to deploy the app on DigitalOcean’s App Platform. Providing this file allows DigitalOcean to know it’s a multi-component app (monorepo) and how to build and run each part. Key sections of our `app.yaml`:

  ```yaml
  name: my-fullstack-app   # Name of the app on DO
  services:
    - name: frontend
      dockerfile_path: ./frontend/Dockerfile
      build_command: npm install && npm run build
      run_command: npm run start
      http_port: 3000
      envs:
        - key: NEXT_PUBLIC_API_URL
          value: "http://backend:1337"   # use internal service name to call Strapi
        - key: NEXT_PUBLIC_STRIPE_PUBLIC_KEY
          value: "${NEXT_PUBLIC_STRIPE_PUBLIC_KEY}"
        - key: STRIPE_SECRET_KEY
          value: "${STRIPE_SECRET_KEY}"
        - key: PREVIEW_SECRET
          value: "${PREVIEW_SECRET}"
    - name: backend
      dockerfile_path: ./backend/Dockerfile
      build_command: npm install && npm run build
      run_command: npm run start
      http_port: 1337
      routes:
        - path: "/api/*"     # expose Strapi API under /api
        - path: "/admin/*"   # expose Strapi admin (could also restrict in future)
        - path: "/uploads/*" # static files (media)
      envs:
        - key: NODE_ENV
          value: "production"
        - key: DATABASE_URL
          value: "${DATABASE_URL}"
        - key: JWT_SECRET
          value: "${JWT_SECRET}"
        - key: ADMIN_JWT_SECRET
          value: "${ADMIN_JWT_SECRET}"
        - key: APP_KEYS
          value: "${APP_KEYS}"
        - key: API_TOKEN_SALT
          value: "${API_TOKEN_SALT}"
        - key: STRAPI_ADMIN_EMAIL
          value: "${STRAPI_ADMIN_EMAIL}"
        - key: STRAPI_ADMIN_PASSWORD
          value: "${STRAPI_ADMIN_PASSWORD}"
        - key: STRIPE_WEBHOOK_SECRET
          value: "${STRIPE_WEBHOOK_SECRET}"
        - key: STRIPE_SECRET_KEY
          value: "${STRIPE_SECRET_KEY}"
        - key: CLIENT_URL
          value: "${CLIENT_URL}"
        - key: PREVIEW_SECRET
          value: "${PREVIEW_SECRET}"
        - key: ZOOM_API_KEY
          value: "${ZOOM_API_KEY}"
        - key: ZOOM_API_SECRET
          value: "${ZOOM_API_SECRET}"
  databases:
    - name: db
      engine: pg    # using managed PostgreSQL
      version: 15
      size: db-s-1vcpu-1gb   # smallest size
      cluster_name: "${DATABASE_CLUSTER}"  # reference to an existing cluster if needed
      production: true
  ```

  Let’s break this down:

  * We define two services, **frontend** and **backend**, corresponding to our two Dockerfiles. DigitalOcean will build each service from the specified Dockerfile. (We also explicitly give build and run commands in case DO’s detection needs them, but since we have Dockerfiles these may not be strictly necessary. They won’t be used if Dockerfile is fully controlling build/run.)
  * The `frontend` service sets environment variables: `NEXT_PUBLIC_API_URL` is set to `http://backend:1337` – since App Platform apps have an internal DNS where services can reach each other by name in the private network. This means our Next.js frontend will use the internal address of the Strapi service (faster and not exposed publicly) for API calls. We also supply Stripe keys and preview secret similarly (with actual values injected via DO).
  * The `backend` service environment contains all the secrets and config needed. We use placeholders like `${JWT_SECRET}` – in App Platform, these will be replaced by the actual values provided either via the spec (if we use `doctl apps create/update` with `--spec` and inject env vars) or via the dashboard. The `DATABASE_URL` is critical: DigitalOcean will provide this if we link a managed database, or we set it ourselves. In the spec above, we also demonstrated a `databases:` section:

    * The `databases` section is how you can declare a managed database as part of the App spec (note: the exact support of this in App Platform’s YAML might vary; sometimes you provision the DB separately). If supported, DO would create a PostgreSQL instance for you. In many cases, though, one might create the DB through the UI and just supply the connection string as an env var.
    * If using the `databases` section, DO will automatically set a `DATABASE_URL` env for the app. If not, we would manually set `DATABASE_URL` from the DB credentials.
  * We define routes so that any requests to the App’s URL that start with `/api`, `/admin`, or `/uploads` go to the backend service. All other requests (`/` and everything not matching the above) will go to the frontend (since the frontend likely serves the main site). This means our Next.js app can be accessed at the root domain, and Strapi’s endpoints are proxied under `/api` etc. (Alternatively, we could run them on separate subdomains, but using single App with routes is convenient).
  * The App spec makes scaling and instance sizing configurable too (we could add `instance_count` and `instance_size_slug` for each service). For now, by default it will be 1 instance of the smallest type. In the GitHub Actions, we could set these via env as well (as seen in some references but we keep it simple).
  * The spec helps in CI/CD: whenever we push updates and trigger the workflow, it uses this spec to update the app configuration. If we want to change env vars or routes, we update app.yaml and commit it.

  **Environment Variables on App Platform:** We do not include actual secrets in `app.yaml`. Instead, we expect the `${VAR}` placeholders to be replaced by DO’s system. This means you need to define those env vars in the App either via the DO Dashboard or via `doctl` commands that set them. For instance, in our GitHub Action, we might replace or fill some of these from GitHub Secrets. Alternatively, one can remove the `${}` and put default values in app.yaml but mark them as “to be filled”. In any case, the README instructs the developer to set these in DO (the UI allows marking them as secret so the values aren’t exposed in logs). **Never commit real secrets** to the repo or YAML – use DO’s secret store.

* **Continuous Integration / Deployment (GitHub Actions):** Under `.github/workflows/deploy.yml` we have a workflow that automates deployment to DigitalOcean:

  * It triggers on pushes to the `main` branch (and can be run manually via workflow\_dispatch).
  * **Build & Test:** (Optional) The workflow can install dependencies and even run tests or linters. In our template, we include steps to set up Node and run `npm install` in both `frontend` and `backend`, and perhaps run `npm run build` to ensure everything builds fine. (This step isn't strictly required for deployment since DO will build images, but it’s good for CI to catch errors early.)
  * **DigitalOcean Deploy Step:** We use DigitalOcean’s official GitHub Action for `doctl` (DigitalOcean CLI). We add the DO API token as a secret. Example snippet from the workflow:

    ```yaml
    - name: Install doctl
      uses: digitalocean/action-doctl@v2
      with:
        token: ${{ secrets.DIGITALOCEAN_ACCESS_TOKEN }}
    - name: Deploy to DigitalOcean App Platform
      run: doctl apps update ${{ secrets.DO_APP_ID }} --spec .do/app.yaml
    ```

    This logs into DO and then updates our app with the latest spec. By doing so, App Platform knows to pull the latest code from GitHub and rebuild/deploy services accordingly. We store the App ID in GitHub Secrets as well (you get this ID from the DO dashboard or `doctl` after creating the app the first time). The first deployment might be done via the DO web UI by connecting the repo, or we could use `doctl apps create --spec app.yaml` similarly.
  * We set `deploy_on_push: true` in the app spec for each service to allow auto deploys, but when using the spec via doctl, it often deploys on each update command regardless. The GitHub Action ensures a push to main triggers an update, achieving continuous deployment.
  * **Environment Variables in CI:** We do not expose secrets in the workflow logs. All sensitive values (DO token, App ID, Stripe keys, etc.) are stored as GitHub Secrets. For instance, we’d have `STRIPE_SECRET_KEY`, `JWT_SECRET`, etc., as GitHub repository secrets. In the workflow, if we needed to inject them into the app spec dynamically, we could use `env:` or replace in the YAML. However, since our app.yaml uses placeholders and those values are already set on DO side (after the first deploy), we typically don’t need to pass them each time. The README includes instructions for initially setting those env vars either by editing app.yaml with real values or using DO’s interface.
  * The CI/CD setup means developers can just push changes to code, and within minutes DigitalOcean will rebuild and deploy the updated frontend and backend.

## Production Considerations and Security

This project is configured with **production-grade defaults** in mind:

* All secrets and keys are stored in environment variables, not in code. The `.env.example` in the repo lists them so you know what to set. For example, in `.env.example` you will see placeholders like:

  ```bash
  JWT_SECRET=changeme_jwt_abcdefghijklmnopqrstuvwxyz
  ADMIN_JWT_SECRET=changeme_admin_jwt_abcdefghijklmnopqrstuvwxyz
  APP_KEYS=changeme_app_keys_abcdefghijklmnopqrstuvwxyz
  API_TOKEN_SALT=changeme_api_salt_abcdefghijklmnopqrstuvwxyz
  NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_xxx...
  STRIPE_SECRET_KEY=sk_test_xxx...
  STRIPE_WEBHOOK_SECRET=whsec_xxx...
  PREVIEW_SECRET=someRandomPreviewSecret
  ```

  These are random-looking dummy values. The README guides you to replace them with your own secure strings (e.g., using a password generator). **Strapi will not run in production mode without certain env vars** like JWT\_SECRET, ADMIN\_JWT\_SECRET, and APP\_KEYS, so it’s important these are set. Similarly, failing to set STRIPE\_WEBHOOK\_SECRET or Zoom keys won’t crash the app, but those features won’t function until provided.
* **HTTPS and CORS:** On DigitalOcean App Platform, the app will be served over HTTPS with a free SSL certificate by default (for the ondigitalocean.app domain or any custom domain you add). We have configured Strapi to allow requests from the frontend’s domain:

  * In `backend/config/middlewares.js`, we enabled CORS and set the origin to `process.env.CLIENT_URL` (which we ensure is set to the production frontend URL). This means the frontend can call the Strapi API from the browser without issues. We also allow credentials if needed (though for our usage, we typically use Bearer tokens in Authorization header, not cookies, for API).
* **Admin Security:** The Strapi admin panel (`/admin`) is accessible via the route we set. For a real deployment, you might restrict this (e.g., behind basic auth or by IP) if it’s a public app, or at least ensure the admin password is strong. We provided an initial admin user creation for convenience, but the password must be changed from the placeholder. The admin panel uses its own JWT (signed with ADMIN\_JWT\_SECRET) for session – we set a strong secret for it.
* **Stripe Webhook Security:** We included the Stripe webhook secret so that the endpoint verifying the webhook will know it’s authentic. Always ensure this is set to the value from the Stripe dashboard when you configure a webhook endpoint there.
* **Updates and Maintenance:** Both Next.js and Strapi are actively maintained projects. We pinned versions in package.json (or a `^` range). It’s advisable to keep them updated (security patches etc.). The repository could include Dependabot integration (not shown here) to automate dependency update PRs.
* **Logging and Monitoring:** The app prints basic logs to console (which DO captures). For production, one might integrate a logging service or at least use DO’s Log Streaming. Strapi by default will log queries in dev; in production we set the log level to warn/info to reduce noise.
* **Scaling:** On App Platform, you can scale up the instance size or count if needed. Our config and code is stateless (except the database). If scaling horizontally (multiple instances), make sure to use a centralized DB (we do) and consider sticky sessions if you ever store sessions in-memory (we do not; we store only JWTs on client). Strapi’s websocket (for admin live reload) is disabled in production by default, so no special sticky sessions needed there.

---

With this monorepo, you have a complete full-stack application ready to deploy. **Summaries:**

* The **frontend** provides a responsive, dynamic user interface with dashboard capabilities, e-commerce, scheduling, and a page builder for content management.
* The **backend** provides a robust CMS with structured data, authentication, and integrations for payments and video calls.
* Docker ensures parity between dev and prod, and the DigitalOcean spec plus CI pipeline ensure smooth deployment. The use of environment variables and external services follows best practices for security.
* All default credentials and secrets are placeholder-only; be sure to replace them in your environment or secret store. The README in the repo covers all these steps in detail, so that you can get the app running locally or on the cloud.

By combining Next.js and Strapi, we achieve a **decoupled architecture**: the frontend is completely separate from the backend, communicating only over secure APIs. This makes the stack flexible – you can update front-end features and deploy independently from content changes, and vice versa. Yet, the included preview mode and editor bridge the gap to provide a classic CMS experience for content editors.

Please refer to the repository’s README for any additional setup instructions and enjoy your new monorepo project! 🚀

**Sources:**

* Strapi required environment variables for Docker (JWT secrets, admin secret, etc.)
* Strapi preview mode configuration (Client URL and PREVIEW\_SECRET for Next.js draft mode)
* DigitalOcean App Platform deployment via doctl (using app spec in `.do/app.yaml` and GitHub Actions)
