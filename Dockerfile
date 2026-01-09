FROM node:18-alpine AS deps

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json* ./

# Install production dependencies
RUN npm install --production --silent --no-audit --no-fund


FROM node:18-alpine AS runner

WORKDIR /app

# Default environment
ENV NODE_ENV=production
ENV APP_PORT=3000

# Copy installed deps from previous stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application sources
COPY . .

# Expose port expected by Coolify (mapped to host 3000)
EXPOSE 3000

# Run the app
CMD ["node", "index.js"]
