# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install all dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build the application - fail if build fails
RUN npm run build && if [ ! -f dist/src/main.js ]; then echo "ERROR: dist/src/main.js not found after build"; exit 1; fi

# Runtime stage
FROM node:20-alpine

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy built application
COPY --from=builder /app/dist ./dist

# Files required by sequelize-cli at runtime.
# Migrations are TypeScript and loaded via ts-node (registered by .sequelizerc),
# so the runtime image must ship the TS source + tsconfigs alongside the .js shim.
COPY --from=builder /app/.sequelizerc ./
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/tsconfig.cli.json ./
COPY --from=builder /app/src/config ./src/config
COPY --from=builder /app/database ./database

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 5000

CMD ["node", "dist/src/main.js"]