FROM node:18-slim

WORKDIR /app

# Copy package files for server
COPY server/package*.json ./server/

# Install server dependencies
RUN cd server && npm install --production

# Copy server code
COPY server/ ./server/

# Set environment variable
ENV NODE_ENV production

# Expose port
EXPOSE 5000

# Start server
CMD ["node", "server/index.js"] 