# Use nginx as the web server
FROM nginx:alpine

# Set working directory
WORKDIR /usr/share/nginx/html

# Copy all application files
COPY . .

# Create nginx configuration for SPA
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    # Enable gzip compression \
    gzip on; \
    gzip_vary on; \
    gzip_min_length 1024; \
    gzip_proxied any; \
    gzip_comp_level 6; \
    gzip_types \
        text/plain \
        text/css \
        text/xml \
        text/javascript \
        application/javascript \
        application/xml+rss \
        application/json; \
    \
    # Handle PWA manifest and service worker \
    location /manifest.json { \
        add_header Cache-Control "public, max-age=31536000"; \
        add_header Content-Type "application/manifest+json"; \
    } \
    \
    location /sw.js { \
        add_header Cache-Control "no-cache, no-store, must-revalidate"; \
        add_header Pragma "no-cache"; \
        add_header Expires "0"; \
        add_header Content-Type "application/javascript"; \
    } \
    \
    # Handle static assets \
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
    \
    # Handle CSV files \
    location ~* \.csv$ { \
        add_header Content-Type "text/csv"; \
        add_header Cache-Control "no-cache"; \
    } \
    \
    # SPA fallback - serve index.html for all routes \
    location / { \
        try_files $uri $uri/ /index.html; \
        add_header Cache-Control "no-cache, no-store, must-revalidate"; \
        add_header Pragma "no-cache"; \
        add_header Expires "0"; \
    } \
    \
    # Security headers \
    add_header X-Frame-Options "SAMEORIGIN" always; \
    add_header X-Content-Type-Options "nosniff" always; \
    add_header X-XSS-Protection "1; mode=block" always; \
    add_header Referrer-Policy "strict-origin-when-cross-origin" always; \
    \
    # CORS headers for PWA \
    add_header Access-Control-Allow-Origin "*" always; \
    add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always; \
    add_header Access-Control-Allow-Headers "Content-Type" always; \
}' > /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]