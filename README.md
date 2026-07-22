# 🕵️ Kernel-Level Sniffer (eBPF & Rust) — Branch: `chaitanya`

This branch contains the implementation of the **Kernel-Level Sniffer** component of API-Sentinel. Sitting at the operating system level, this module utilizes eBPF to capture and inspect raw network/API traffic with zero modification to the microservices and negligible performance overhead.

## 🛠️ Tech Stack & eBPF Framework

- **Language**: Rust
- **eBPF Library**: **[Aya framework](https://aya-rs.dev/)**
    - _Why Aya?_ Aya allows us to write both the kernel-space eBPF programs and the user-space orchestrator/loader entirely in Rust, avoiding standard C dependencies (such as libbpf) and delivering robust compile-time safety.

---

## 📋 Weekly Development Plan & Checklist

The following is the week-by-week roadmap for the low-level engineering tasks on this branch:

### 📍 Week 1: Traffic Interception

- [x] Set up the Rust eBPF development environment (LLVM, Clang, cargo-generate, Aya template).
- [ ] Write an eBPF program in Rust using **Aya** to attach to kernel socket traces.
- [ ] Passively capture raw HTTP/REST network traffic from a mock microservice.
- [ ] Stream the intercepted traffic from kernel space to user space via eBPF maps (e.g., RingBuf).

### 📍 Week 2: Discovery Pipeline

- [ ] Implement logic to process observed raw traffic and automatically reconstruct endpoint patterns.
- [ ] Generate OpenAPI schemas dynamically from the intercepted payload data.
- [ ] Flag endpoints that do not exist in the official repository (Shadow API detection).

### 🔍 Mid-Project Review: Performance Audit

- [ ] Conduct a performance audit to benchmark latency.
- [ ] Validate and prove that the eBPF sidecar agent adds less than **5 milliseconds** of latency to API requests.

### 📍 Week 3: Enforcement Mode

- [ ] Upgrade the eBPF sniffer program from passive monitoring to active blocking mode.
- [ ] Intercept and dynamically drop packets that violate defined property-level access controls (blocking BOLA/BFLA attacks at the execution level).

### 📍 Week 4: Data Masking

- [ ] Implement real-time payload sanitization in the sniffer.
- [ ] Automatically strip out PII (Personally Identifiable Information) from the captured HTTP request/response payloads before forwarding them to the analytics dashboard.

### 🏆 Final Review

- [ ] Complete end-to-end integration with the backend and frontend.
- [ ] Validate overall stability, safety, and performance constraints.
