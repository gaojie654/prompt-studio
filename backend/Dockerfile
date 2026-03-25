# ============================================
# Prompt Studio Backend - Production Dockerfile
# ============================================
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# ============================================
# Production stage
# ============================================
FROM node:20-alpine AS production

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy Prisma schema and generated client
COPY prisma/ ./prisma/
COPY node_modules/.prisma/ ./node_modules/.prisma/

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
