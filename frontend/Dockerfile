FROM node:20-slim
WORKDIR /app

# Allow the backend URL to be provided at build time. This is required so Next.js
# can fetch data during `next build` when `getStaticProps` runs.
ARG BACKEND_URL=http://backend:1337
ENV BACKEND_URL=$BACKEND_URL
ARG ALLOWED_DEV_ORIGIN=http://localhost:3000
ENV ALLOWED_DEV_ORIGIN=$ALLOWED_DEV_ORIGIN

COPY package*.json ./
# Install dependencies using the lockfile for reproducible builds
RUN npm ci
COPY . .
RUN npm run build

# Remove development dependencies to keep the image slim
RUN npm prune --omit=dev
CMD ["npm", "start"]
