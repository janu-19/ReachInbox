# Stage 1: Build built static client assets
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency mappings
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Set default API target URL (Vite compiles environment variables at build-time)
ENV VITE_API_URL=https://reachinboxbackend-production-102a.up.railway.app/api

# Compile static output
RUN npm run build

# Stage 2: Package static client directory with Nginx server
FROM nginx:alpine

# Copy custom Nginx configuration for React SPA routing support
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy static assets to Nginx html folder
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose standard HTTP Nginx port
EXPOSE 80

# Boot Nginx server
CMD ["nginx", "-g", "daemon off;"]
