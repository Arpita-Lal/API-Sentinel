from __future__ import annotations

from fastapi.testclient import TestClient

from backend.app import create_app


def _login(client: TestClient, username: str, password: str) -> str:
    response = client.post("/login", json={"username": username, "password": password})
    assert response.status_code == 200
    return response.json()["access_token"]


def test_bola_attack_simulation_detects_critical_alert() -> None:
    app = create_app()

    with TestClient(app) as client:
        alice_token = _login(client, "alice", "password123")
        admin_token = _login(client, "admin", "Admin@9999")

        alice_headers = {"Authorization": f"Bearer {alice_token}"}
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        before = client.get("/api/security/bola-alerts", headers=admin_headers)
        assert before.status_code == 200
        before_count = len(before.json()["data"])

        normal = client.get("/orders/1", headers=alice_headers)
        assert normal.status_code == 200

        attack = client.get("/orders/3", headers=alice_headers)
        assert attack.status_code == 403

        after = client.get("/api/security/bola-alerts", headers=admin_headers)
        assert after.status_code == 200
        alerts = after.json()["data"]

        assert len(alerts) >= before_count + 1
        assert any(alert["endpoint"] == "/orders/3" and alert["severity"] == "Critical" for alert in alerts)

        access_map = client.get("/api/security/user/1/access-map", headers=admin_headers)
        assert access_map.status_code == 200
        payload = access_map.json()["data"]
        assert payload["user_id"] == 1
        assert payload["history"]["allowed_objects"]
