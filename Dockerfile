FROM node:18-slim

WORKDIR /app

# Copy package files for server
COPY server/package*.json ./server/

# Install server dependencies
RUN cd server && npm install --production

# Copy server code
COPY server/ ./server/

# Create a healthcheck script
RUN echo '#!/bin/sh\n\
echo "Healthcheck: Checking endpoint http://localhost:${PORT:-5000}/healthcheck"\n\
curl -f http://localhost:${PORT:-5000}/healthcheck || (echo "Healthcheck failed!" && exit 1)' > /healthcheck.sh && \
    chmod +x /healthcheck.sh

# Set environment variable
ENV NODE_ENV=production

# Expose port
EXPOSE ${PORT:-5000}

# Start server with proper error handling
CMD ["sh", "-c", "node server/index.js || (echo 'Server failed to start' && exit 1)"] 