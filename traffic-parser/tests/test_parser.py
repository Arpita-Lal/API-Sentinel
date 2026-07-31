import pytest
import time
from models import RawPacket, ConnectionKey
from ingestor import parse_packet_json
from parser import parse_http_request, parse_http_response
from reassembler import StreamReassembler


def test_parse_packet_json():
    # Simulated JSON line from module1_kprobe
    raw_hex = "474554202f6170692f76312f73746174757320485454502f312e310d0a486f73743a206c6f63616c686f73740d0a0d0a"
    json_str = f'{{"src_ip": "127.0.0.1", "dest_ip": "127.0.0.1", "src_port": 54321, "dest_port": 8080, "direction": "send", "payload_len": {len(raw_hex)//2}, "payload_hex": "{raw_hex}"}}'

    packet = parse_packet_json(json_str)
    assert packet is not None
    assert packet.src_ip == "127.0.0.1"
    assert packet.dest_ip == "127.0.0.1"
    assert packet.src_port == 54321
    assert packet.dest_port == 8080
    assert packet.direction == "send"
    assert packet.payload.startswith(b"GET /api/v1/status HTTP/1.1")


def test_parse_http_request():
    body = b'{"name": "test", "value": 42}'
    req_bytes = b"POST /api/data HTTP/1.1\r\nHost: localhost:8080\r\nContent-Type: application/json\r\nContent-Length: " + str(len(body)).encode() + b"\r\n\r\n" + body
    result = parse_http_request(req_bytes)
    assert result is not None
    req, consumed = result
    assert consumed == len(req_bytes)
    assert req.method == "POST"
    assert req.path == "/api/data"
    assert req.version == "HTTP/1.1"
    assert req.headers["content-type"] == "application/json"
    assert req.json_body == {"name": "test", "value": 42}


def test_parse_http_response():
    body = b'{"status": "ok", "id": 100}'
    resp_bytes = b"HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: " + str(len(body)).encode() + b"\r\n\r\n" + body
    result = parse_http_response(resp_bytes)
    assert result is not None
    resp, consumed = result
    assert consumed == len(resp_bytes)
    assert resp.version == "HTTP/1.1"
    assert resp.status_code == 200
    assert resp.reason == "OK"
    assert resp.headers["content-type"] == "application/json"
    assert resp.json_body == {"status": "ok", "id": 100}


def test_stream_reassembler_complete_flow():
    reassembler = StreamReassembler(server_port_hint=8080)

    # 1. Request packet
    req_payload = b"GET /users HTTP/1.1\r\nHost: 127.0.0.1\r\n\r\n"
    p1 = RawPacket(
        src_ip="192.168.1.10",
        dest_ip="192.168.1.1",
        src_port=51234,
        dest_port=8080,
        direction="send",
        payload_len=len(req_payload),
        payload=req_payload,
        timestamp=1000.0,
    )
    txns1 = reassembler.process_packet(p1)
    assert len(txns1) == 0  # Waiting for response

    # 2. Response packet
    body = b'{"users": ["alice"]}'
    resp_payload = b"HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: " + str(len(body)).encode() + b"\r\n\r\n" + body
    p2 = RawPacket(
        src_ip="192.168.1.1",
        dest_ip="192.168.1.10",
        src_port=8080,
        dest_port=51234,
        direction="recv",
        payload_len=len(resp_payload),
        payload=resp_payload,
        timestamp=1000.05,  # +50ms
    )
    txns2 = reassembler.process_packet(p2)
    assert len(txns2) == 1

    txn = txns2[0]
    assert txn.connection_key == ConnectionKey("192.168.1.10", 51234, "192.168.1.1", 8080)
    assert txn.request.method == "GET"
    assert txn.request.path == "/users"
    assert txn.response.status_code == 200
    assert txn.response.json_body == {"users": ["alice"]}
    assert pytest.approx(txn.latency_ms, 0.1) == 50.0


def test_stream_reassembler_fragmented_payload():
    reassembler = StreamReassembler(server_port_hint=8080)

    body = b'{"data": "hello"}'
    part1 = b"POST /submit HTTP/1.1\r\nHost: 127.0.0.1\r\nContent-Length: " + str(len(body)).encode() + b"\r\n\r\n{\"data\":"
    part2 = b' "hello"}'

    p1 = RawPacket(
        src_ip="10.0.0.5",
        dest_ip="10.0.0.1",
        src_port=44444,
        dest_port=8080,
        direction="send",
        payload_len=len(part1),
        payload=part1,
        timestamp=10.0,
    )
    p2 = RawPacket(
        src_ip="10.0.0.5",
        dest_ip="10.0.0.1",
        src_port=44444,
        dest_port=8080,
        direction="send",
        payload_len=len(part2),
        payload=part2,
        timestamp=10.01,
    )

    # First packet chunk should not complete request parsing yet
    txns1 = reassembler.process_packet(p1)
    assert len(txns1) == 0
    conn_key = ConnectionKey("10.0.0.5", 44444, "10.0.0.1", 8080)
    assert len(reassembler.sessions[conn_key].pending_requests) == 0

    # Second packet chunk completes request
    txns2 = reassembler.process_packet(p2)
    assert len(txns2) == 0
    assert len(reassembler.sessions[conn_key].pending_requests) == 1
    req = reassembler.sessions[conn_key].pending_requests[0]
    assert req.json_body == {"data": "hello"}
