import time
import socket
import sys
from collections import defaultdict
from typing import Dict, List
from models import APITransaction

class RateLimiter:
    def __init__(self, max_requests: int = 20, time_window_sec: int = 60, sock_path: str = "/tmp/api_sentinel.sock"):
        self.max_requests = max_requests
        self.time_window_sec = time_window_sec
        self.sock_path = sock_path
        
        # Maps IP to a list of timestamps
        self.ip_history: Dict[str, List[float]] = defaultdict(list)
        # Set of IPs that have already been blocked to prevent spamming the socket
        self.blocked_ips = set()

    def block_ip(self, ip: str):
        """Communicates with the Rust eBPF supervisor over Unix Domain Socket to block an IP."""
        if ip in self.blocked_ips:
            return
            
        print(f"\n[RATE LIMIT EXCEEDED] Blocking IP {ip} at the kernel level!", file=sys.stderr)
        self.blocked_ips.add(ip)
        
        try:
            with socket.socket(socket.AF_UNIX, socket.SOCK_STREAM) as client:
                client.connect(self.sock_path)
                client.sendall(f"BLOCK {ip}".encode('utf-8'))
        except Exception as e:
            print(f"[ERROR] Failed to send block command for {ip}: {e}", file=sys.stderr)

    def process_transaction(self, txn: APITransaction):
        """Analyzes a transaction for rate limit violations."""
        ip = txn.connection_key.client_ip
        
        if ip in self.blocked_ips:
            return

        current_time = time.time()
        history = self.ip_history[ip]
        
        # Remove timestamps older than the time window
        cutoff_time = current_time - self.time_window_sec
        self.ip_history[ip] = [ts for ts in history if ts > cutoff_time]
        
        # Add current request
        self.ip_history[ip].append(current_time)
        
        # Check limit
        if len(self.ip_history[ip]) > self.max_requests:
            self.block_ip(ip)
