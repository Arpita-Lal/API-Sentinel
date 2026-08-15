#!/bin/bash

echo "Starting aggressive attack simulation against original mock service..."
echo "----------------------------------------"

for i in {1..5}; do
    echo "[*] Normal Traffic (Creating Document)..."
    curl -s -X POST http://localhost:8080/api/documents/99 \
      -H "x-user-id: Alice" \
      -H "Content-Type: application/json" \
      -d '{"email": "alice@test.com", "ssn": "111-22-3333"}' > /dev/null
    sleep 0.5

    echo "[*] Triggering BOLA Attack (API1:2023) - Bob accessing Alice's document..."
    curl -s -X GET http://localhost:8080/api/documents/99 \
      -H "x-user-id: Bob" > /dev/null
    sleep 0.5

    echo "[*] Hitting Shadow API (API9:2023) - /api/test is not in openapi.json..."
    curl -s http://localhost:8080/api/test > /dev/null
    sleep 1
done

echo "Attack simulation complete! Check your dashboard."
