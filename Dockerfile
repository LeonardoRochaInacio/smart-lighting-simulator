FROM node:22.5.1-alpine3.19 as base

# Set the working directory
WORKDIR /home/node/app

# Copy all files to container
COPY . .

# Execute server as development
FROM base as development

# Install all packages including dev packages to build project
RUN npm ci --include=dev

# Expose port
EXPOSE 3333

# Install adonisJS CLI
RUN npm install -g @adonisjs/cli

# Execute server cmd
CMD ["node", "ace", "serve", "--hmr"]

# Execute server as production
FROM base as production

# Install all packages including dev packages to build project
RUN npm ci

# Build project
RUN node ace build

# Create env data based in env example
COPY .env.example ./build/.env

# Expose port
EXPOSE 3333

# Execute server cmd
CMD ["node", "build/bin/server.js"]
