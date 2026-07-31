import argparse
import json
import subprocess
import sys
from ingestor import read_packet_stream, parse_packet_json
from reassembler import StreamReassembler


def main():
    parser = argparse.ArgumentParser(description="Traffic Parser - Ingest eBPF network packets and reconstruct API payloads.")
    parser.add_argument("--port", type=int, default=8080, help="Target API server port (default: 8080)")
    parser.add_argument("--pretty", action="store_true", help="Pretty print JSON output")
    parser.add_argument("--exec", type=str, help="Path to module1_kprobe binary to run and pipe events directly")
    args = parser.parse_args()

    reassembler = StreamReassembler(server_port_hint=args.port)

    def handle_line(line: str):
        packet = parse_packet_json(line)
        if packet and packet.payload_len > 0:
            txns = reassembler.process_packet(packet)
            for txn in txns:
                indent = 2 if args.pretty else None
                print(json.dumps(txn.to_dict(), indent=indent), flush=True)

    if args.exec:
        print(f"[*] Launching eBPF binary: {args.exec}", file=sys.stderr)
        proc = subprocess.Popen(
            [args.exec],
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            text=True,
            bufsize=1,
        )
        try:
            for line in proc.stdout:
                handle_line(line)
        except KeyboardInterrupt:
            proc.terminate()
    else:
        print("[*] Reading eBPF packet JSON stream from standard input...", file=sys.stderr)
        try:
            for line in sys.stdin:
                handle_line(line)
        except KeyboardInterrupt:
            pass

    # Flush remaining unresponded requests on exit
    remaining = reassembler.flush()
    for txn in remaining:
        indent = 2 if args.pretty else None
        print(json.dumps(txn.to_dict(), indent=indent), flush=True)


if __name__ == "__main__":
    main()
