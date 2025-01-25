#!/usr/bin/env bash

domain1="redaezziani.com"
domain2="www.redaezziani.com"
email="klausdev2@email.com"
staging=0 

data_path="./certbot"
rsa_key_size=4096

# Make sure data path exists
mkdir -p "$data_path/conf/live/$domain1"
mkdir -p "$data_path/www"

echo "Creating dummy certificate for $domain1"
openssl req -x509 -nodes -newkey rsa:$rsa_key_size -days 1\
  -keyout "$data_path/conf/live/$domain1/privkey.pem" \
  -out "$data_path/conf/live/$domain1/fullchain.pem" \
  -subj "/CN=localhost"

echo "Starting nginx..."
docker-compose up --force-recreate -d nginx

echo "Removing dummy certificate..."
docker-compose run --rm certbot rm -Rf /etc/letsencrypt/live/$domain1
docker-compose run --rm certbot rm -Rf /etc/letsencrypt/archive/$domain1
docker-compose run --rm certbot rm -Rf /etc/letsencrypt/renewal/$domain1.conf

echo "Requesting Let's Encrypt certificate..."
if [ $staging != "0" ]; then
  staging_arg="--staging"
else
  staging_arg=""
fi

docker-compose run --rm certbot certonly \
  --webroot \
  --webroot-path /var/www/certbot \
  --email $email \
  --agree-tos \
  --no-eff-email \
  --force-renewal \
  $staging_arg \
  -d $domain1 \
  -d $domain2

echo "Reloading nginx..."
docker-compose exec nginx nginx -s reload