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

# Copy built application and files required for sequelize-cli migrations
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.sequelizerc ./
COPY --from=builder /app/src/config/database.js ./src/config/database.js

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 5000

CMD ["node", "dist/src/main.js"]