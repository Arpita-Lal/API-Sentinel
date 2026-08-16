#!/bin/bash
pkill -f mock_server.py
python3 ../mock-service/mock_server.py &
SERVER_PID=$!
sleep 1

# Start the sniffer and parser with sudo so eBPF runs
sudo ../module1_kprobe/target/release/module1_kprobe | python3 main.py > parser_output.log 2> parser_errors.log &
SNIFFER_PID=$!
sleep 2

echo "[*] Blasting the mock server with 30 requests to trigger rate limiter..."
for i in {1..30}; do
    curl -s -X GET http://127.0.0.1:8080/ > /dev/null
done

sleep 2
echo "[*] Checking if XDP is blocking by sending one more request (timeout 2s)..."
curl --max-time 2 -s -X GET http://127.0.0.1:8080/ > /dev/null
if [ $? -eq 28 ]; then
    echo "[SUCCESS] Curl timed out! XDP successfully dropped the packet!"
else
    echo "[WARNING] Curl succeeded. XDP might not have dropped the packet."
fi

sudo kill $SNIFFER_PID
kill $SERVER_PID

echo "--- RATE LIMIT ALERTS ---"
cat parser_errors.log | grep RATE
