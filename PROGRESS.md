# Project Progress: API Sentinel (As of August 2026)

This document summarizes the development progress and implemented features for the API Sentinel project so far.

## 1. Low-Level Traffic Interception (Rust & eBPF)
* **Kernel Probes**: Built an eBPF agent natively in Rust using the `aya` framework.
* **TCP Hooking**: Hooked into `tcp_sendmsg` and `tcp_recvmsg` syscalls to intercept network traffic securely at the kernel level.
* **Payload Extraction**: Implemented logic to extract raw packet buffers directly from memory using `bpf_probe_read_user_buf`.
* **Hex Encoding & JSON Export**: The userspace supervisor formats intercepted packets into a structured JSON stream containing connection metadata (IPs, ports, direction) and hex-encoded payloads, pushed instantly via a `PerfEventArray`.

## 2. Traffic Reconstruction (Python)
* **Hex Reassembly**: Created a dedicated `traffic-parser` module that continuously reads the eBPF JSON stream in real-time.
* **TCP Stream Stitching**: Implemented a `StreamReassembler` that tracks connection states across fragmented packets, effectively reconstructing full HTTP requests and responses. It correctly deduplicates packets when sniffing loopback traffic on localhost.
* **HTTP Parsing**: Built raw bytes parsers (`parse_http_request` / `parse_http_response`) capable of parsing HTTP/1.1 headers, extracting JSON bodies, and matching corresponding Request-Response pairs.
* **Metrics**: Calculates end-to-end API latency for every successfully reconstructed `APITransaction`.

## 3. Discovery Pipeline & Shadow API Detection (Python)
* **OpenAPI Generation**: The `DiscoveryEngine` dynamically builds an OpenAPI 3.0.3 schema (`discovered_openapi.json`) on the fly, documenting every observed path, HTTP method, and response format.
* **Shadow API Flagging**: Ingests an "official" OpenAPI specification (`openapi.json`). Every observed transaction is cross-referenced against the official spec.
* **Alerting**: Any observed endpoint or method missing from the official specification triggers an immediate `[SHADOW API DETECTED]` console alert.

## 4. Test Environment
* **Mock Service**: Developed a Python HTTP server mimicking an API backend (`mock-service`). It contains both documented endpoints and a deliberately hidden shadow API (`/api/test`) to rigorously test the detection pipeline.
* **Real-time Pipeline**: The entire pipeline (eBPF Agent -> Stream Reassembler -> Discovery Engine) processes traffic instantly without buffering delays, ensuring live anomaly detection.
