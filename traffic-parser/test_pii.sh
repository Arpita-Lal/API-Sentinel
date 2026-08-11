#!/bin/bash
cat << 'JSON' | ../venv/bin/python3 server.py
{"src_ip": "10.0.0.1", "dest_ip": "192.168.1.5", "src_port": 50000, "dest_port": 8080, "direction": "send", "payload_len": 120, "payload": "R0VUIC9hcGkvdjEvdXNlcnMvMSBIVFRQLzEuMQ0KSG9zdDogbG9jYWxob3N0OjgwODANCkNvbnRlbnQtVHlwZTogYXBwbGljYXRpb24vanNvbg0KDQp7ImVtYWlsIjogImFsaWNlQGV4YW1wbGUuY29tIiwgInNzbiI6ICIxMjMtNDUtNjc4OSJ9"}
JSON
