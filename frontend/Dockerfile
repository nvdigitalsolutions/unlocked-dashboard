FROM node:18-slim
WORKDIR /app

# Allow the backend URL to be provided at build time. This is required so Next.js
# can fetch data during `next build` when `getStaticProps` runs.
ARG BACKEND_URL=http://backend:1337
ENV BACKEND_URL=$BACKEND_URL

COPY package*.json ./
# Install all dependencies so the build step has access to dev packages
RUN npm install
COPY . .
RUN npm run build

# Remove development dependencies to keep the image slim
RUN npm prune --production
CMD ["npm", "start"]
