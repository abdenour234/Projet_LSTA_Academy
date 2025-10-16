FROM node:18-alpine
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY bun.lockb* ./

# Install dependencies
RUN npm install

# Copy all source files
COPY . .

# Expose Vite default port
EXPOSE 5173

# Start development server with host flag to allow external connections
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
