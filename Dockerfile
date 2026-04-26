# Build stage
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* bun.lock* ./
RUN npm install

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html

# SPA fallback — redirect all non-file requests to index.html
RUN echo 'server { \
    listen 80; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
