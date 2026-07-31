import json
from typing import Dict, Optional, Tuple, Any
from models import HTTPRequest, HTTPResponse


def parse_headers(header_lines: list[str]) -> Dict[str, str]:
    """Parses raw header lines into a case-insensitive normalized dictionary."""
    headers = {}
    for line in header_lines:
        if ":" in line:
            key, val = line.split(":", 1)
            headers[key.strip().lower()] = val.strip()
    return headers


def parse_json_safely(body: bytes) -> Optional[Any]:
    """Attempts to decode bytes as UTF-8 and parse as JSON."""
    if not body:
        return None
    try:
        text = body.decode("utf-8").strip()
        if (text.startswith("{") and text.endswith("}")) or (text.startswith("[") and text.endswith("]")):
            return json.loads(text)
    except Exception:
        pass
    return None


def parse_http_request(data: bytes, timestamp: float = 0.0) -> Optional[Tuple[HTTPRequest, int]]:
    """
    Attempts to parse an HTTP request from raw bytes buffer.
    Returns (HTTPRequest, bytes_consumed) if a complete request is found, or None if incomplete/invalid.
    """
    header_end = data.find(b"\r\n\r\n")
    if header_end == -1:
        # Check for \n\n as fallback
        header_end = data.find(b"\n\n")
        delimiter_len = 2
        if header_end == -1:
            return None
    else:
        delimiter_len = 4

    header_bytes = data[:header_end]
    try:
        header_text = header_bytes.decode("iso-8859-1")
    except UnicodeDecodeError:
        return None

    lines = header_text.splitlines()
    if not lines:
        return None

    start_line = lines[0].split(" ")
    if len(start_line) < 3:
        return None

    method, path, version = start_line[0], start_line[1], start_line[2]

    # Quick validation for HTTP method
    if method not in ("GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS", "CONNECT", "TRACE"):
        return None

    headers = parse_headers(lines[1:])

    body_start = header_end + delimiter_len
    content_length = 0
    if "content-length" in headers:
        try:
            content_length = int(headers["content-length"])
        except ValueError:
            content_length = 0

    total_len = body_start + content_length
    if len(data) < total_len:
        # Request body incomplete
        return None

    body = data[body_start:total_len]
    json_body = parse_json_safely(body)

    request = HTTPRequest(
        method=method,
        path=path,
        version=version,
        headers=headers,
        body=body,
        json_body=json_body,
        timestamp=timestamp,
    )
    return request, total_len


def parse_http_response(data: bytes, timestamp: float = 0.0) -> Optional[Tuple[HTTPResponse, int]]:
    """
    Attempts to parse an HTTP response from raw bytes buffer.
    Returns (HTTPResponse, bytes_consumed) if a complete response is found, or None if incomplete/invalid.
    """
    header_end = data.find(b"\r\n\r\n")
    if header_end == -1:
        header_end = data.find(b"\n\n")
        delimiter_len = 2
        if header_end == -1:
            return None
    else:
        delimiter_len = 4

    header_bytes = data[:header_end]
    try:
        header_text = header_bytes.decode("iso-8859-1")
    except UnicodeDecodeError:
        return None

    lines = header_text.splitlines()
    if not lines:
        return None

    start_line = lines[0].split(" ", 2)
    if len(start_line) < 2 or not start_line[0].startswith("HTTP/"):
        return None

    version = start_line[0]
    try:
        status_code = int(start_line[1])
    except ValueError:
        return None
    reason = start_line[2] if len(start_line) > 2 else ""

    headers = parse_headers(lines[1:])

    body_start = header_end + delimiter_len
    content_length = None
    if "content-length" in headers:
        try:
            content_length = int(headers["content-length"])
        except ValueError:
            pass

    if content_length is not None:
        total_len = body_start + content_length
        if len(data) < total_len:
            return None
        body = data[body_start:total_len]
    else:
        # If Content-Length is missing, assume body is whatever remaining bytes or empty
        body = data[body_start:]
        total_len = len(data)

    json_body = parse_json_safely(body)

    response = HTTPResponse(
        version=version,
        status_code=status_code,
        reason=reason,
        headers=headers,
        body=body,
        json_body=json_body,
        timestamp=timestamp,
    )
    return response, total_len
