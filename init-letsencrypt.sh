#!/bin/bash

# Configuration
DOMAIN_MAIN="redaezziani.com"
DOMAIN_WWW="www.redaezziani.com"
EMAIL="klausdev2@email.com"
DATA_PATH="./certbot"

# Rate limit check
RATE_LIMIT_FILE="$DATA_PATH/.ratelimit"
CURRENT_TIME=$(date +%s)
WAIT_TIME=604800  # 7 days in seconds

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

check_rate_limit() {
    if [ -f "$RATE_LIMIT_FILE" ]; then
        LAST_REQUEST=$(cat "$RATE_LIMIT_FILE")
        TIME_DIFF=$((CURRENT_TIME - LAST_REQUEST))
        
        if [ $TIME_DIFF -lt $WAIT_TIME ]; then
            WAIT_HOURS=$(( (WAIT_TIME - TIME_DIFF) / 3600 ))
            error "Rate limit in effect. Please wait $WAIT_HOURS hours before requesting new certificates"
            return 1
        fi
    fi
    return 0
}

# Clean up
log "Cleaning up previous installation..."
docker-compose down -v
rm -rf "$DATA_PATH"
mkdir -p "$DATA_PATH/conf/live/$DOMAIN_MAIN" "$DATA_PATH/www"

# Check rate limit
if ! check_rate_limit; then
    log "Using existing certificates if available..."
    if [ -f "$DATA_PATH/conf/live/$DOMAIN_MAIN/fullchain.pem" ]; then
        docker-compose up -d
        exit 0
    else
        error "No existing certificates found. Please wait for rate limit to expire."
        exit 1
    fi
fi

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

# Start with staging
log "Requesting staging certificate first..."
docker-compose up -d nginx
sleep 5

docker-compose run --rm --entrypoint "\
    certbot certonly --webroot -w /var/www/certbot \
    --staging \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN_MAIN -d $DOMAIN_WWW \
    --cert-name $DOMAIN_MAIN" certbot

if [ $? -eq 0 ]; then
    log "Staging certificate successful, proceeding with production certificate..."
    rm -rf "$DATA_PATH/conf/live/$DOMAIN_MAIN"
    
    # Record certificate request time
    echo $CURRENT_TIME > "$RATE_LIMIT_FILE"
    
    docker-compose run --rm --entrypoint "\
        certbot certonly --webroot -w /var/www/certbot \
        --email $EMAIL \
        --agree-tos \
        --no-eff-email \
        -d $DOMAIN_MAIN -d $DOMAIN_WWW \
        --cert-name $DOMAIN_MAIN" certbot
        
    if [ $? -eq 0 ]; then
        log "Production certificate obtained successfully!"
        docker-compose up -d
    else
        error "Failed to obtain production certificate"
        exit 1
    fi
else
    error "Staging certificate failed"
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