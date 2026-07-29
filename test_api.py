"""
test_api.py -- Quick smoke-test for all API-Sentinel endpoints.

Usage:
    python test_api.py

Requires: requests  (pip install requests)
Server must be running at http://127.0.0.1:8000
"""

import json
import sys
import io
import requests

# Force UTF-8 output on Windows to avoid CP1252 errors
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

BASE = "http://127.0.0.1:8000"

def hr(label: str):
    print(f"\n{'='*60}")
    print(f"  {label}")
    print('='*60)

def req(method: str, path: str, *, token: str = None, body: dict = None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    url = f"{BASE}{path}"
    resp = getattr(requests, method)(url, headers=headers, json=body)
    print(f"  {method.upper()} {path}  →  {resp.status_code}")
    print(json.dumps(resp.json(), indent=2))
    return resp.json()

# ── 1. Login as Alice ─────────────────────────────────────────────────────────
hr("1. Login — Alice (valid credentials)")
alice = req("post", "/login", body={"username": "alice", "password": "password123"})
alice_token = alice["data"]["token"]

hr("2. Login — wrong password (should 401)")
req("post", "/login", body={"username": "alice", "password": "wrongpass"})

# ── 2. Profile ────────────────────────────────────────────────────────────────
hr("3. GET /profile — Alice")
req("get", "/profile", token=alice_token)

hr("4. GET /profile — no token (should 401)")
req("get", "/profile")

# ── 3. Orders ─────────────────────────────────────────────────────────────────
hr("5. GET /orders — Alice's own orders")
req("get", "/orders", token=alice_token)

hr("6. GET /orders?status=pending — filtered")
req("get", "/orders?status=pending", token=alice_token)

# -- 4. BOLA prevention ------------------------------------------------------
hr("7. GET /orders/ord_200 -- Alice attempts to read Bob's order (should 403)")
print("  Alice is user user-001 and ord_200 belongs to Bob")
req("get", "/orders/ord_200", token=alice_token)

hr("8. GET /orders/ord_100 — Alice reads her own order (legitimate)")
req("get", "/orders/ord_100", token=alice_token)

# ── 5. Payment ────────────────────────────────────────────────────────────────
hr("9. POST /payment — Alice pays for her pending order-002")
req("post", "/payment", token=alice_token, body={"order_id": "ord_101", "card_last4": "4242"})

hr("10. POST /payment — pay already-completed order (should 409)")
req("post", "/payment", token=alice_token, body={"order_id": "ord_100", "card_last4": "4242"})

# ── 6. Bob cross-pays (should be blocked) ─────────────────────────────────────
hr("11. Login as Bob")
bob = req("post", "/login", body={"username": "bob", "password": "secret456"})
bob_token = bob["data"]["token"]

hr("12. POST /payment — Bob tries to pay Alice's order (should 403)")
req("post", "/payment", token=bob_token, body={"order_id": "ord_101", "card_last4": "9999"})

# ── 7. Delete ─────────────────────────────────────────────────────────────────
hr("13. DELETE /user — Bob deletes his own account")
req("delete", "/user", token=bob_token)

hr("14. DELETE /user — Bob tries again after deletion (should 404)")
req("delete", "/user", token=bob_token)

print("\n✅ Smoke-test complete.\n")
