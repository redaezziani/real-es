#!/bin/bash

# Domain configuration
DOMAIN_MAIN="redaezziani.com"
DOMAIN_WWW="www.redaezziani.com"
EMAIL="klausdev2@email.com" 
STAGING=1  # Set to 0 for production certificates
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

# Check for existing certificates
if [ -d "$DATA_PATH/conf/live/$DOMAIN_MAIN" ]; then
    read -p "Existing certificate found. Delete and create new one? (y/N) " decision
    if [ "$decision" != "Y" ] && [ "$decision" != "y" ]; then
        log "Using existing certificate"
        docker-compose up -d
        exit 0
    fi
    log "Removing existing certificates..."
    rm -rf "$DATA_PATH/conf/live/$DOMAIN_MAIN"
    rm -rf "$DATA_PATH/conf/archive/$DOMAIN_MAIN"
    rm -rf "$DATA_PATH/conf/renewal/$DOMAIN_MAIN.conf"
fi

log "Creating directories..."
mkdir -p "$DATA_PATH/conf/live/$DOMAIN_MAIN"
mkdir -p "$DATA_PATH/www"

log "Creating dummy certificate..."
openssl req -x509 -nodes -newkey rsa:$RSA_KEY_SIZE -days 1 \
    -keyout "$DATA_PATH/conf/live/$DOMAIN_MAIN/privkey.pem" \
    -out "$DATA_PATH/conf/live/$DOMAIN_MAIN/fullchain.pem" \
    -subj "/CN=localhost"

log "Starting nginx..."
docker-compose up --force-recreate -d nginx

log "Removing dummy certificate..."
docker-compose run --rm --entrypoint "\
    rm -rf /etc/letsencrypt/live/$DOMAIN_MAIN && \
    rm -rf /etc/letsencrypt/archive/$DOMAIN_MAIN && \
    rm -rf /etc/letsencrypt/renewal/$DOMAIN_MAIN.conf" certbot

log "Requesting Let's Encrypt certificate..."
domain_args="-d $DOMAIN_MAIN -d $DOMAIN_WWW"
email_arg="--email $EMAIL"
staging_arg=""

if [ $STAGING != "0" ]; then
    staging_arg="--staging"
fi

docker-compose run --rm --entrypoint "\
    certbot certonly --webroot -w /var/www/certbot \
    $staging_arg \
    $email_arg \
    $domain_args \
    --rsa-key-size $RSA_KEY_SIZE \
    --agree-tos \
    --force-renewal" certbot

log "Reloading nginx..."
docker-compose exec nginx nginx -s reload

log "Setting up auto-renewal..."
docker-compose up -d certbot

log "Done! Certificate setup completed."