#!/bin/bash

# Configuration
DOMAIN_MAIN="redaezziani.com"
DOMAIN_WWW="www.redaezziani.com"
EMAIL="klausdev2@email.com"
DATA_PATH="./certbot"
RATE_LIMIT_FILE="$DATA_PATH/.ratelimit"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"; }
warn() { echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"; }
error() { echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"; }

check_rate_limit() {
    if [ -f "$RATE_LIMIT_FILE" ]; then
        local target_time=$(cat "$RATE_LIMIT_FILE")
        local current_time=$(date +%s)
        
        if [ $current_time -lt $target_time ]; then
            local wait_hours=$(( ($target_time - $current_time) / 3600 ))
            local wait_minutes=$(( ($target_time - $current_time) % 3600 / 60 ))
            warn "Rate limit active. Wait ${wait_hours}h ${wait_minutes}m before requesting new certificates"
            warn "Rate limit expires: $(date -d @${target_time})"
            return 1
        fi
    fi
    return 0
}

update_rate_limit() {
    # Set next allowed request time to 7 days from now
    echo $(( $(date +%s) + 604800 )) > "$RATE_LIMIT_FILE"
}

verify_dns() {
    local domain=$1
    log "Verifying DNS for $domain..."
    
    # Get current IP
    local current_ip=$(curl -s ifconfig.me)
    local dns_ip=$(dig +short $domain)

    if [ "$dns_ip" = "$current_ip" ]; then
        log "DNS verified for $domain: $dns_ip"
        return 0
    else
        error "DNS mismatch for $domain:"
        error "Expected: $current_ip"
        error "Got: $dns_ip"
        return 1
    fi
}

# Initial checks
if ! check_rate_limit; then
    if [ -d "$DATA_PATH/conf/live/$DOMAIN_MAIN" ]; then
        log "Using existing certificates..."
        docker-compose up -d
        exit 0
    fi
    error "No existing certificates and rate limit is active"
    exit 1
fi

# Verify DNS before proceeding
if ! verify_dns $DOMAIN_MAIN || ! verify_dns $DOMAIN_WWW; then
    error "DNS verification failed. Please check your DNS settings"
    exit 1
fi

# Clean up and prepare
log "Preparing environment..."
mkdir -p "$DATA_PATH/conf/live/$DOMAIN_MAIN" "$DATA_PATH/www"

# Start with minimal nginx config
log "Configuring nginx..."
cat > nginx/app.conf << EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN_MAIN} ${DOMAIN_WWW};
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        try_files \$uri =404;
    }

    location / {
        return 200 'SSL Setup in Progress';
    }
}
EOF

# Start nginx
log "Starting nginx..."
docker-compose up -d nginx
sleep 5

# Request staging certificate
log "Testing with staging certificate..."
docker-compose run --rm --entrypoint "\
    certbot certonly --webroot -w /var/www/certbot \
    --staging \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN_MAIN -d $DOMAIN_WWW" certbot

if [ $? -eq 0 ]; then
    log "Staging successful, proceeding with production..."
    rm -rf "$DATA_PATH/conf/live/$DOMAIN_MAIN"*
    
    update_rate_limit
    
    docker-compose run --rm --entrypoint "\
        certbot certonly --webroot -w /var/www/certbot \
        --email $EMAIL \
        --agree-tos \
        --no-eff-email \
        -d $DOMAIN_MAIN -d $DOMAIN_WWW" certbot
    
    if [ $? -eq 0 ]; then
        log "Certificates obtained successfully!"
        docker-compose down
        docker-compose up -d
        log "Setup complete! Visit https://$DOMAIN_MAIN"
    else
        error "Production certificate failed"
        exit 1
    fi
else
    error "Staging certificate failed"
    exit 1
fi