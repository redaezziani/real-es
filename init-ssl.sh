#!/bin/bash

# Clean up first
docker-compose down
sudo rm -rf ./certbot
mkdir -p ./certbot/conf ./certbot/www

# Create initial nginx config
cat > nginx/app.conf << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name redaezziani.com www.redaezziani.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        try_files $uri =404;
    }

    location / {
        proxy_pass http://app:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

# Start nginx
docker-compose up -d nginx
sleep 5

# Get the certificate
docker-compose run --rm certbot certonly \
    --webroot \
    --webroot-path /var/www/certbot \
    --email klausdev2@email.com \
    --agree-tos \
    --no-eff-email \
    -d redaezziani.com \
    -d www.redaezziani.com

# Update nginx configuration
cat > nginx/app.conf << 'EOF'
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

server {
    listen 80;
    listen [::]:80;
    server_name redaezziani.com www.redaezziani.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        try_files $uri =404;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name redaezziani.com www.redaezziani.com;

    ssl_certificate /etc/letsencrypt/live/redaezziani.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/redaezziani.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.3;
    ssl_prefer_server_ciphers off;

    # Proxy to app
    location / {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
    }
}
EOF

# Restart everything
docker-compose down
docker-compose up -d

echo "Done! Wait a moment for services to start..."
sleep 5
docker-compose logs nginx
