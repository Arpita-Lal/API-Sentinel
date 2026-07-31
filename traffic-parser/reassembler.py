from dataclasses import dataclass, field
from typing import Dict, List, Optional
from models import RawPacket, ConnectionKey, HTTPRequest, HTTPResponse, APITransaction
from parser import parse_http_request, parse_http_response


@dataclass
class SessionStream:
    connection_key: ConnectionKey
    req_buffer: bytearray = field(default_factory=bytearray)
    resp_buffer: bytearray = field(default_factory=bytearray)
    pending_requests: List[HTTPRequest] = field(default_factory=list)


class StreamReassembler:
    """
    Manages TCP connection streams, buffers packet payloads per 4-tuple connection,
    parses HTTP requests/responses, and correlates them into APITransaction objects.
    """

    def __init__(self, server_port_hint: int = 8080):
        self.server_port_hint = server_port_hint
        self.sessions: Dict[ConnectionKey, SessionStream] = {}

    def process_packet(self, packet: RawPacket) -> List[APITransaction]:
        """
        Ingests a RawPacket and returns any newly completed APITransaction objects.
        """
        conn_key = packet.get_connection_key(self.server_port_hint)
        if conn_key not in self.sessions:
            self.sessions[conn_key] = SessionStream(connection_key=conn_key)

        session = self.sessions[conn_key]
        completed: List[APITransaction] = []

        is_req = packet.is_request(self.server_port_hint)

        if is_req:
            session.req_buffer.extend(packet.payload)
            # Continuously attempt parsing requests from buffer
            while session.req_buffer:
                result = parse_http_request(bytes(session.req_buffer), timestamp=packet.timestamp)
                if result is None:
                    break
                req, bytes_consumed = result
                session.req_buffer = session.req_buffer[bytes_consumed:]
                session.pending_requests.append(req)
        else:
            session.resp_buffer.extend(packet.payload)
            # Continuously attempt parsing responses from buffer
            while session.resp_buffer:
                result = parse_http_response(bytes(session.resp_buffer), timestamp=packet.timestamp)
                if result is None:
                    break
                resp, bytes_consumed = result
                session.resp_buffer = session.resp_buffer[bytes_consumed:]

                if session.pending_requests:
                    matched_req = session.pending_requests.pop(0)
                    latency = max(0.0, (resp.timestamp - matched_req.timestamp) * 1000.0)
                    txn = APITransaction(
                        connection_key=conn_key,
                        request=matched_req,
                        response=resp,
                        latency_ms=latency,
                    )
                    completed.append(txn)

        return completed

    def flush(self) -> List[APITransaction]:
        """
        Flushes all pending un-responded requests as incomplete transactions.
        """
        incomplete: List[APITransaction] = []
        for conn_key, session in self.sessions.items():
            while session.pending_requests:
                req = session.pending_requests.pop(0)
                txn = APITransaction(
                    connection_key=conn_key,
                    request=req,
                    response=None,
                    latency_ms=None,
                )
                incomplete.append(txn)
        return incomplete
