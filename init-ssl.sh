#!/bin/bash

# Stop and remove everything
docker-compose down
sudo rm -rf certbot
mkdir -p certbot/www

# Start nginx without SSL
docker-compose up -d nginx
sleep 5

# Request the certificate
docker-compose run --rm certbot certonly \
    --webroot \
    --webroot-path /var/www/certbot \
    --email klausdev2@email.com \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    -d redaezziani.com \
    -d www.redaezziani.com

# If successful, update nginx config
if [ $? -eq 0 ]; then
    # Update nginx config to include SSL
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

    # Update docker-compose to include SSL
    docker-compose down
    docker-compose up -d
fi
