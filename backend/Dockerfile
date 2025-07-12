FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
# Install dependencies using the lockfile to avoid peer resolution issues
RUN npm ci --omit=dev --legacy-peer-deps
COPY . .
# Increase Node's memory limit to prevent build failures
ENV NODE_OPTIONS=--max_old_space_size=4096
RUN npm run build
ENV NODE_ENV=production
CMD ["npm", "run", "start"]
