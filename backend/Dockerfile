FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
# Install dependencies including dev packages to build Strapi's admin
RUN npm ci --legacy-peer-deps
COPY . .
# Increase Node's memory limit to prevent build failures
ENV NODE_OPTIONS=--max_old_space_size=4096
RUN npm run build
RUN npm prune --omit=dev
ENV NODE_ENV=production
CMD ["npm", "run", "start"]
