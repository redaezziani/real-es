#!/bin/bash

# Domain configuration
DOMAIN_MAIN="redaezziani.com"
DOMAIN_WWW="www.redaezziani.com"
EMAIL="klausdev2@email.com" 
STAGING=1  # Set to 1 for testing (no rate limits)
DATA_PATH="./certbot"
RSA_KEY_SIZE=4096

# Color output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    error "Please run as root"
    exit 1
fi

log "Cleaning up old certificates and docker resources..."
docker-compose down
rm -rf "$DATA_PATH"
mkdir -p "$DATA_PATH/conf/live/$DOMAIN_MAIN"
mkdir -p "$DATA_PATH/www"

log "Starting nginx with minimal config..."
cat > nginx/app.conf << EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN_MAIN} ${DOMAIN_WWW};
    
    location /.well-known/acme-challenge/ {
        allow all;
        root /var/www/certbot;
        try_files \$uri =404;
    }

    location / {
        return 200 'Ready for SSL certification';
    }
}
EOF

docker-compose up -d nginx
sleep 10  # Wait for nginx to start

log "Requesting Let's Encrypt certificate..."
docker-compose run --rm --entrypoint "\
    certbot certonly --webroot -w /var/www/certbot \
    --staging \
    --email $EMAIL \
    -d $DOMAIN_MAIN -d $DOMAIN_WWW \
    --rsa-key-size 4096 \
    --agree-tos \
    --force-renewal \
    --non-interactive" certbot

if [ $? -eq 0 ]; then
    log "Staging certificate obtained successfully. Requesting production certificate..."
    STAGING=0
    docker-compose run --rm --entrypoint "\
        certbot certonly --webroot -w /var/www/certbot \
        --email $EMAIL \
        -d $DOMAIN_MAIN -d $DOMAIN_WWW \
        --rsa-key-size 4096 \
        --agree-tos \
        --force-renewal \
        --non-interactive" certbot
fi

if [ -d "$DATA_PATH/conf/live/$DOMAIN_MAIN" ]; then
    log "Updating nginx configuration..."
    cat > nginx/app.conf << EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN_MAIN} ${DOMAIN_WWW};
    
    location /.well-known/acme-challenge/ {
        allow all;
        root /var/www/certbot;
        try_files \$uri =404;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${DOMAIN_MAIN} ${DOMAIN_WWW};
    
    ssl_certificate /etc/letsencrypt/live/${DOMAIN_MAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN_MAIN}/privkey.pem;
    
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    location / {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

    log "Restarting nginx..."
    docker-compose restart nginx
    
    log "Starting all services..."
    docker-compose up -d
    
    log "Success! Certificate installed and services running."
else
    error "Failed to obtain SSL certificate"
    exit 1
fi

log "Reloading nginx..."
docker-compose exec nginx nginx -s reload

log "Setting up auto-renewal..."
docker-compose up -d certbot

log "Done! Certificate setup completed."