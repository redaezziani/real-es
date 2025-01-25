
#!/bin/bash

domains=(redaezziani.com www.redaezziani.com)
email="klausdev2@email.com"
staging=0 # Set to 1 if you want to test with staging certificates

data_path="./certbot"
rsa_key_size=4096

if [ -d "$data_path" ]; then
  read -p "Existing data found. Continue and replace existing certificate? (y/N) " decision
  if [ "$decision" != "Y" ] && [ "$decision" != "y" ]; then
    exit
  fi
fi

mkdir -p "$data_path/conf/live/$domains"
mkdir -p "$data_path/www"

echo "Creating dummy certificate..."
openssl req -x509 -nodes -newkey rsa:$rsa_key_size -days 1\
  -keyout "$data_path/conf/live/$domains/privkey.pem" \
  -out "$data_path/conf/live/$domains/fullchain.pem" \
  -subj "/CN=localhost"

echo "Starting nginx..."
docker-compose up --force-recreate -d nginx

echo "Removing dummy certificate..."
docker-compose run --rm certbot rm -Rf /etc/letsencrypt/live/$domains
docker-compose run --rm certbot rm -Rf /etc/letsencrypt/archive/$domains
docker-compose run --rm certbot rm -Rf /etc/letsencrypt/renewal/$domains.conf

echo "Requesting Let's Encrypt certificate..."
docker-compose run --rm certbot certonly \
  --webroot \
  --webroot-path /var/www/certbot \
  --email $email \
  --agree-tos \
  --no-eff-email \
  --force-renewal \
  ${staging:+"--staging"} \
  ${domains[@]/#/-d }

echo "Reloading nginx..."
docker-compose exec nginx nginx -s reload