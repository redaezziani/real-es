#!/bin/bash

# Base URL of the API
BASE_URL="http://localhost:3000/rabbit-mq/send"

# Simulate scenarios
for i in {1..100}; do
    # Generate unique and duplicate emails
    if ((i % 10 == 0)); then
        EMAIL="duplicate@test.net" # Intentional duplicate every 10th request
    else
        EMAIL="unique$i@test.net" # Unique email for other requests
    fi

    # Make the HTTP request with a random IP and email
    RESPONSE=$(curl -s -X GET \
        -H "Content-Type: application/json" \
        -H "X-Forwarded-For: 192.168.1.$((RANDOM % 255))" \
        -d "{\"email\": \"$EMAIL\"}" \
        $BASE_URL)

    # Print the response for each request
    echo "Request $i: $RESPONSE"
done
