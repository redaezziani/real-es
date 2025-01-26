#!/bin/bash

# Domain configuration
DOMAIN_MAIN="redaezziani.com"
DOMAIN_WWW="www.redaezziani.com"
EMAIL="klausdev2@email.com" 
DATA_PATH="./certbot"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

# Initial cleanup
log "Cleaning up old certificates and containers..."
docker-compose down -v
rm -rf "$DATA_PATH"
docker system prune -af --volumes

# Create required directories
mkdir -p "$DATA_PATH/conf/live/$DOMAIN_MAIN"
mkdir -p "$DATA_PATH/www"

# Create initial nginx config for HTTP challenge
log "Creating initial nginx configuration..."
cat > nginx/app.conf << EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN_MAIN} ${DOMAIN_WWW};
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        try_files \$uri =404;
    }
}
EOF

# Start nginx
log "Starting nginx..."
docker-compose up -d nginx
sleep 10

# Get staging certificate first
log "Requesting staging certificate..."
docker-compose run --rm --entrypoint "\
    certbot certonly --webroot -w /var/www/certbot \
    --staging \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    -d $DOMAIN_MAIN -d $DOMAIN_WWW" certbot

# If staging was successful, get production certificate
if [ $? -eq 0 ]; then
    log "Staging certificate successful. Cleaning up staging certificates..."
    rm -rf "$DATA_PATH/conf/live/$DOMAIN_MAIN"
    rm -rf "$DATA_PATH/conf/archive/$DOMAIN_MAIN"
    
    log "Requesting production certificate..."
    docker-compose run --rm --entrypoint "\
        certbot certonly --webroot -w /var/www/certbot \
        --email $EMAIL \
        --agree-tos \
        --no-eff-email \
        --force-renewal \
        -d $DOMAIN_MAIN -d $DOMAIN_WWW" certbot
else
    error "Staging certificate failed. Please check the logs."
    exit 1
fi

# Verify production certificate exists
if [ -d "$DATA_PATH/conf/live/$DOMAIN_MAIN" ]; then
    log "Certificate obtained successfully!"
    docker-compose down
    
    # Start all services
    log "Starting all services..."
    docker-compose up -d
    
    log "Done! Check https://$DOMAIN_MAIN"
else
    error "Failed to obtain certificate"
    exit 1
fi