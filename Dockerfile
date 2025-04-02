FROM node:18-slim

WORKDIR /app

# Install curl for healthchecks
RUN apt-get update && apt-get install -y curl && apt-get clean

# Copy package files for server
COPY server/package*.json ./

# Install server dependencies
RUN npm install --production

# Copy server code
COPY server/ ./

# Set environment variable
ENV NODE_ENV=production
ENV PORT=8080

# Expose port
EXPOSE 8080

# Start the server
CMD ["node", "index.js"] 