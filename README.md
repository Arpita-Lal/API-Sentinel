# 🛡️ API-Sentinel - Runtime BOLA & Shadow API Detection Engine

[![Rust](https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![eBPF](https://img.shields.io/badge/eBPF-Linux-success?style=for-the-badge)](https://ebpf.io/)

**API-Sentinel** is an advanced API security platform designed to provide real-time monitoring and protection for modern APIs. It detects **Broken Object Level Authorization (BOLA)** attacks, discovers **Shadow APIs**, analyzes authorization behavior, and helps organizations secure their APIs through continuous runtime monitoring and interactive security analytics.

---

## 🚀 Key Features

- **🔍 Runtime API Monitoring**: Capture and analyze live API traffic in real time using eBPF with minimal system overhead.
- **🛡️ BOLA Detection**: Detect Broken Object Level Authorization attacks and unauthorized access to protected resources.
- **🌐 Shadow API Discovery**: Automatically identify undocumented, deprecated, or rogue API endpoints.
- **👤 Behavioral Authorization Analysis**: Monitor user access patterns and detect abnormal API behavior.
- **⚠️ Real-Time Threat Alerts**: Generate instant notifications for suspicious API requests and security incidents.
- **📊 Interactive Dashboard**: Visualize API inventory, attack trends, security metrics, and live threat analytics.
- **📋 Security Reporting**: Generate comprehensive reports for detected vulnerabilities and API security assessments.
- **🔒 OWASP API Security Compliance**: Monitor and map threats based on the OWASP API Security Top 10 framework.

---

## 🛠️ Tech Stack

### Runtime Monitoring
- **Technology**: eBPF
- **Language**: Rust
- **Platform**: Linux Kernel

### Backend
- **Framework**: FastAPI (Python)
- **Database**: SQLite / PostgreSQL (SQLAlchemy ORM)
- **Security**: JWT Authentication & Pydantic Validation

### Frontend
- **Framework**: React 18 with Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **HTTP Client**: Axios

### Security & Integrations
- OpenAPI / Swagger
- Docker & Docker Compose
- Git & GitHub
- OWASP API Security Top 10
