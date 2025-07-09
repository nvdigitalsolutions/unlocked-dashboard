FROM node:18-slim
WORKDIR /app
COPY package*.json ./
# Install all dependencies so the build step has access to dev packages
RUN npm install
COPY . .
RUN npm run build

# Remove development dependencies to keep the image slim
RUN npm prune --production
CMD ["npm", "start"]
