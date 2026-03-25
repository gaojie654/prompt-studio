# ============================================
# Prompt Studio Backend - Production Dockerfile
# ============================================
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package*.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client
RUN pnpm exec prisma generate

# Build TypeScript
RUN pnpm run build

# ============================================
# Production stage
# ============================================
FROM node:20-alpine AS production

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package*.json pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy Prisma schema
COPY prisma/ ./prisma/

# Copy built output from builder stage
COPY --from=builder /app/dist/ ./dist/

# Create uploads directory
RUN mkdir -p /app/uploads/images && chown -R nodejs:nodejs /app

# Create config directory for payment keys
RUN mkdir -p /app/config && chown nodejs:nodejs /app/config

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start server
CMD ["node", "dist/app.js"]
