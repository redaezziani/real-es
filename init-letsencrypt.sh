#!/bin/bash

# Configuration
DOMAIN=redaezziani.com
EMAIL=klausdev2@email.com

# Colors
GREEN='\033[0;32m'
NC='\033[0m'
log() { echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"; }

# Verify DNS records
check_dns() {
    log "Verifying DNS records..."
    local ip=$(curl -s ifconfig.me)
    local domain_ip=$(dig +short $DOMAIN)
    local www_ip=$(dig +short www.$DOMAIN)

    if [ "$domain_ip" != "$ip" ] || [ "$www_ip" != "$ip" ]; then
        log "DNS verification failed!"
        log "Expected IP: $ip"
        log "Got: Domain IP=$domain_ip, WWW IP=$www_ip"
        return 1
    fi
    log "DNS verification successful"
    return 0
}

# Stop everything
log "Stopping all services..."
docker-compose down

# Clean old certificates
log "Cleaning up old certificates..."
sudo rm -rf ./certbot
mkdir -p ./certbot/www ./certbot/conf

# Check DNS before proceeding
if ! check_dns; then
    log "Please update your DNS records and try again"
    exit 1
fi

# Start nginx
log "Starting nginx..."
docker-compose up -d nginx
sleep 10

# Get certificate
log "Requesting certificate..."
docker-compose run --rm --entrypoint "\
    certbot certonly \
    --webroot \
    -w /var/www/certbot \
    --email $EMAIL \
    -d $DOMAIN \
    -d www.$DOMAIN \
    --rsa-key-size 4096 \
    --agree-tos \
    --no-eff-email \
    --force-renewal" certbot

if [ $? -ne 0 ]; then
    log "Failed to obtain certificate. Trying staging..."
    docker-compose run --rm --entrypoint "\
        certbot certonly \
        --webroot \
        -w /var/www/certbot \
        --staging \
        --email $EMAIL \
        -d $DOMAIN \
        -d www.$DOMAIN \
        --rsa-key-size 4096 \
        --agree-tos \
        --no-eff-email \
        --force-renewal" certbot
fi

# Start all services
log "Starting all services..."
docker-compose up -d

log "Done! Check https://$DOMAIN"