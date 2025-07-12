FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --production
COPY . .
# Increase Node's memory limit to prevent build failures
ENV NODE_OPTIONS=--max_old_space_size=4096
RUN npm run build
ENV NODE_ENV=production
CMD ["npm", "run", "start"]
