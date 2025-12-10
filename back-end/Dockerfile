FROM node:20-alpine AS base

WORKDIR /app

# Install only production dependencies for a smaller image
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source
COPY . .

ENV NODE_ENV=production
EXPOSE 4000

# Default command
CMD ["npm", "start"]
