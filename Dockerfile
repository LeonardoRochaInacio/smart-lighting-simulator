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
RUN node ace build --ignore-ts-errors

# Ensure config directory exists in build folder
RUN mkdir -p ./build/config

# Set production environment variables
ENV NODE_ENV=production
ENV HOST=0.0.0.0

# Copy .env.example as base and override production values
COPY .env.example ./build/.env
RUN sed -i 's/NODE_ENV=development/NODE_ENV=production/' ./build/.env && \
    sed -i 's/HOST=127.0.0.1/HOST=0.0.0.0/' ./build/.env && \
    sed -i 's/LOG_LEVEL=info/LOG_LEVEL=info/' ./build/.env

# Change to build directory
WORKDIR /home/node/app/build

# Note: Cloud Run automatically sets PORT env var, no need for fixed EXPOSE
# The app will listen on the port specified by Cloud Run's PORT environment variable

# Execute server cmd
CMD ["node", "bin/server.js"]