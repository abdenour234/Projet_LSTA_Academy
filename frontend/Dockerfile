# Build stage
FROM node:18-alpine AS build
WORKDIR /app

# Set build-time environment variable for Vite
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

# Copy only package files first to cache node_modules
COPY package*.json ./
RUN npm ci

# Copy source code (changes here won't invalidate node_modules cache)
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
