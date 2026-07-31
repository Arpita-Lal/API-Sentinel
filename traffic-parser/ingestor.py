import json
import sys
import time
from typing import Generator, Iterable, Optional, Union, Dict, Any
from models import RawPacket


def parse_packet_json(raw_json: Union[str, Dict[str, Any]]) -> Optional[RawPacket]:
    """
    Parses a single eBPF packet event JSON line or dict into a RawPacket object.
    """
    if isinstance(raw_json, str):
        line = raw_json.strip()
        if not line:
            return None
        try:
            data = json.loads(line)
        except json.JSONDecodeError:
            return None
    elif isinstance(raw_json, dict):
        data = raw_json
    else:
        return None

    try:
        payload_hex = data.get("payload_hex", "")
        payload_bytes = bytes.fromhex(payload_hex) if payload_hex else b""
        payload_len = data.get("payload_len", len(payload_bytes))

        # Truncate or use payload_bytes up to payload_len
        if len(payload_bytes) > payload_len:
            payload_bytes = payload_bytes[:payload_len]

        return RawPacket(
            src_ip=data["src_ip"],
            dest_ip=data["dest_ip"],
            src_port=int(data["src_port"]),
            dest_port=int(data["dest_port"]),
            direction=data.get("direction", "send"),
            payload_len=payload_len,
            payload=payload_bytes,
            timestamp=data.get("timestamp", time.time()),
        )
    except (KeyError, ValueError, TypeError):
        return None


def read_packet_stream(stream: Iterable[str] = sys.stdin) -> Generator[RawPacket, None, None]:
    """
    Reads lines from an iterable (e.g. sys.stdin or file) and yields valid RawPacket objects.
    """
    for line in stream:
        packet = parse_packet_json(line)
        if packet and packet.payload_len > 0:
            yield packet
