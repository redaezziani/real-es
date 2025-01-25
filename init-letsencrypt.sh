#!/bin/sh

# Domain names for certificate
DOMAIN_MAIN="redaezziani.com"
DOMAIN_WWW="www.redaezziani.com"
EMAIL="klausdev2@email.com"
STAGING=0

DATA_PATH="./certbot"
RSA_KEY_SIZE=4096

echo "Creating directories..."
mkdir -p "$DATA_PATH/conf/live/$DOMAIN_MAIN"
mkdir -p "$DATA_PATH/www"

echo "Creating dummy certificate for $DOMAIN_MAIN..."
openssl req -x509 -nodes -newkey rsa:$RSA_KEY_SIZE -days 1 \
  -keyout "$DATA_PATH/conf/live/$DOMAIN_MAIN/privkey.pem" \
  -out "$DATA_PATH/conf/live/$DOMAIN_MAIN/fullchain.pem" \
  -subj "/CN=localhost"

echo "Starting nginx..."
docker-compose up --force-recreate -d nginx

echo "Removing dummy certificate..."
docker-compose run --rm --entrypoint "\
  rm -rf /etc/letsencrypt/live/$DOMAIN_MAIN && \
  rm -rf /etc/letsencrypt/archive/$DOMAIN_MAIN && \
  rm -rf /etc/letsencrypt/renewal/$DOMAIN_MAIN.conf" certbot

echo "Requesting Let's Encrypt certificate..."
if [ "$STAGING" = "1" ]; then
  STAGING_ARG="--staging"
else
  STAGING_ARG=""
fi

docker-compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    $STAGING_ARG \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    -d $DOMAIN_MAIN \
    -d $DOMAIN_WWW" certbot

echo "Reloading nginx..."
docker-compose exec nginx nginx -s reload