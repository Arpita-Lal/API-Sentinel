import json
import time
from dataclasses import dataclass, field
from typing import Dict, Optional, Any


@dataclass(frozen=True)
class ConnectionKey:
    client_ip: str
    client_port: int
    server_ip: str
    server_port: int

    def __str__(self) -> str:
        return f"{self.client_ip}:{self.client_port} <-> {self.server_ip}:{self.server_port}"


@dataclass
class RawPacket:
    src_ip: str
    dest_ip: str
    src_port: int
    dest_port: int
    direction: str  # "send" or "recv"
    payload_len: int
    payload: bytes
    timestamp: float = field(default_factory=time.time)

    def get_connection_key(self, server_port_hint: int = 8080) -> ConnectionKey:
        """
        Determines client and server endpoints based on destination/source ports.
        If dest_port == server_port_hint or direction == 'send', dest is likely the server.
        """
        if self.dest_port == server_port_hint or (self.direction == "send" and self.src_port != server_port_hint):
            return ConnectionKey(
                client_ip=self.src_ip,
                client_port=self.src_port,
                server_ip=self.dest_ip,
                server_port=self.dest_port,
            )
        else:
            return ConnectionKey(
                client_ip=self.dest_ip,
                client_port=self.dest_port,
                server_ip=self.src_ip,
                server_port=self.src_port,
            )

    def is_request(self, server_port_hint: int = 8080) -> bool:
        """Returns True if the packet is sent from client to server (request)."""
        return self.dest_port == server_port_hint or (self.direction == "send" and self.src_port != server_port_hint)


@dataclass
class HTTPRequest:
    method: str
    path: str
    version: str
    headers: Dict[str, str]
    body: bytes
    json_body: Optional[Any] = None
    timestamp: float = field(default_factory=time.time)


@dataclass
class HTTPResponse:
    version: str
    status_code: int
    reason: str
    headers: Dict[str, str]
    body: bytes
    json_body: Optional[Any] = None
    timestamp: float = field(default_factory=time.time)


@dataclass
class APITransaction:
    connection_key: ConnectionKey
    request: HTTPRequest
    response: Optional[HTTPResponse] = None
    latency_ms: Optional[float] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "client": f"{self.connection_key.client_ip}:{self.connection_key.client_port}",
            "server": f"{self.connection_key.server_ip}:{self.connection_key.server_port}",
            "request": {
                "method": self.request.method,
                "path": self.request.path,
                "version": self.request.version,
                "headers": self.request.headers,
                "json_body": self.request.json_body,
                "raw_body": self.request.body.decode("utf-8", errors="replace") if self.request.body else None,
            },
            "response": {
                "status_code": self.response.status_code,
                "reason": self.response.reason,
                "headers": self.response.headers,
                "json_body": self.response.json_body,
                "raw_body": self.response.body.decode("utf-8", errors="replace") if self.response.body else None,
            } if self.response else None,
            "latency_ms": round(self.latency_ms, 2) if self.latency_ms is not None else None,
        }
