/**
 * Self-contained mock data layer for API Sentinel.
 * axios is imported-ready in a real deployment; here every call resolves locally.
 */

export type Risk = "low" | "medium" | "high" | "critical";
export type Method = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export interface LogEntry {
  id: string;
  timestamp: string;
  user: string;
  endpoint: string;
  method: Method;
  status: number;
  ip: string;
  risk: Risk;
  responseTime: number;
}

export interface Alert {
  id: string;
  severity: Risk;
  type: string;
  description: string;
  endpoint: string;
  status: "active" | "investigating" | "resolved";
  owaspMapping: string;
  detectedAt: string;
  sourceIp: string;
}

export interface ApiAsset {
  id: string;
  name: string;
  endpoint: string;
  method: Method;
  category: "official" | "shadow" | "deprecated";
  status: "healthy" | "at-risk" | "unmonitored";
  riskScore: number;
  discoveredAt: string;
  owner: string;
}

export interface UserActivity {
  id: string;
  username: string;
  email: string;
  requests: number;
  lastLogin: string;
  role: string;
  suspiciousActivities: number;
  riskScore: number;
}

const ENDPOINTS = [
  "/api/v1/users/{id}",
  "/api/v1/orders/{id}",
  "/api/v1/payments/charge",
  "/api/v2/accounts/{id}/balance",
  "/api/v1/admin/reports",
  "/api/v1/documents/{id}/download",
  "/internal/debug/config",
  "/api/v2/tokens/refresh",
  "/api/v1/tenants/{id}/members",
  "/api/v1/invoices/{id}",
];

const USERS = [
  "a.mercer",
  "j.okafor",
  "svc-billing",
  "r.tanaka",
  "m.dubois",
  "svc-mobile",
  "l.petrova",
  "anon",
];

const METHODS: Method[] = ["GET", "POST", "PUT", "DELETE", "PATCH"];
const RISKS: Risk[] = ["low", "medium", "high", "critical"];
const STATUSES = [200, 200, 201, 204, 301, 400, 401, 403, 404, 429, 500];

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const ip = () => `${rand(10, 220)}.${rand(0, 255)}.${rand(0, 255)}.${rand(1, 254)}`;

export function generateTrafficItem(): LogEntry {
  const risk = pick<Risk>(["low", "low", "medium", "medium", "high", "critical"]);
  return {
    id: `trf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    user: pick(USERS),
    endpoint: pick(ENDPOINTS),
    method: pick(METHODS),
    status: pick(STATUSES),
    ip: ip(),
    risk,
    responseTime: rand(18, 940),
  };
}

/* ------------------------------- Dashboard ------------------------------- */

export const dashboardData = {
  totalRequests: 4_812_367,
  alertsCount: 42,
  shadowApis: 17,
  bolaAttacks: 128,
  protectedApis: 246,
  activeUsers: 1_284,
  trends: {
    totalRequests: 12.4,
    alertsCount: -8.1,
    shadowApis: 5.3,
    bolaAttacks: 21.7,
    protectedApis: 3.2,
    activeUsers: 9.6,
  },
  requestTrend: [
    { time: "00:00", requests: 18400, attacks: 24 },
    { time: "03:00", requests: 12100, attacks: 12 },
    { time: "06:00", requests: 15600, attacks: 19 },
    { time: "09:00", requests: 38200, attacks: 51 },
    { time: "12:00", requests: 46700, attacks: 74 },
    { time: "15:00", requests: 51200, attacks: 66 },
    { time: "18:00", requests: 43900, attacks: 88 },
    { time: "21:00", requests: 29800, attacks: 39 },
  ],
  apiActivity: [
    { id: "act-1", endpoint: "/api/v1/users/{id}", method: "GET" as Method, status: 200, calls: 18422, risk: "medium" as Risk },
    { id: "act-2", endpoint: "/api/v1/orders/{id}", method: "GET" as Method, status: 403, calls: 9210, risk: "high" as Risk },
    { id: "act-3", endpoint: "/internal/debug/config", method: "GET" as Method, status: 200, calls: 412, risk: "critical" as Risk },
    { id: "act-4", endpoint: "/api/v2/tokens/refresh", method: "POST" as Method, status: 401, calls: 3391, risk: "medium" as Risk },
    { id: "act-5", endpoint: "/api/v1/invoices/{id}", method: "GET" as Method, status: 200, calls: 7712, risk: "low" as Risk },
    { id: "act-6", endpoint: "/api/v1/payments/charge", method: "POST" as Method, status: 500, calls: 1188, risk: "high" as Risk },
  ],
};

/* --------------------------------- Alerts -------------------------------- */

export const alerts: Alert[] = [
  {
    id: "ALT-1041",
    severity: "critical",
    type: "BOLA / IDOR",
    description:
      "User a.mercer enumerated 412 sequential object IDs on /api/v1/orders/{id} and received 88 successful responses for objects owned by other tenants.",
    endpoint: "/api/v1/orders/{id}",
    status: "active",
    owaspMapping: "API1:2023 Broken Object Level Authorization",
    detectedAt: "2026-07-30T08:12:44Z",
    sourceIp: "203.0.113.44",
  },
  {
    id: "ALT-1040",
    severity: "critical",
    type: "Shadow API",
    description:
      "Undocumented endpoint /internal/debug/config is reachable from the public gateway and returns environment configuration.",
    endpoint: "/internal/debug/config",
    status: "investigating",
    owaspMapping: "API9:2023 Improper Inventory Management",
    detectedAt: "2026-07-30T07:41:02Z",
    sourceIp: "198.51.100.9",
  },
  {
    id: "ALT-1039",
    severity: "high",
    type: "Broken Function Level Auth",
    description: "Non-admin token accessed /api/v1/admin/reports 26 times without elevation.",
    endpoint: "/api/v1/admin/reports",
    status: "active",
    owaspMapping: "API5:2023 Broken Function Level Authorization",
    detectedAt: "2026-07-30T06:55:19Z",
    sourceIp: "192.0.2.77",
  },
  {
    id: "ALT-1038",
    severity: "high",
    type: "Credential Stuffing",
    description: "3,204 failed authentications from 74 IPs within 6 minutes against the token endpoint.",
    endpoint: "/api/v2/tokens/refresh",
    status: "investigating",
    owaspMapping: "API2:2023 Broken Authentication",
    detectedAt: "2026-07-30T05:20:33Z",
    sourceIp: "203.0.113.201",
  },
  {
    id: "ALT-1037",
    severity: "medium",
    type: "Excessive Data Exposure",
    description: "Response payload for /api/v1/tenants/{id}/members contains internal salary and SSN fields.",
    endpoint: "/api/v1/tenants/{id}/members",
    status: "active",
    owaspMapping: "API3:2023 Broken Object Property Level Authorization",
    detectedAt: "2026-07-29T22:04:11Z",
    sourceIp: "198.51.100.24",
  },
  {
    id: "ALT-1036",
    severity: "medium",
    type: "Rate Limit Bypass",
    description: "Client rotated 39 API keys to exceed the documented 1000 req/min quota.",
    endpoint: "/api/v1/documents/{id}/download",
    status: "resolved",
    owaspMapping: "API4:2023 Unrestricted Resource Consumption",
    detectedAt: "2026-07-29T18:47:50Z",
    sourceIp: "203.0.113.12",
  },
  {
    id: "ALT-1035",
    severity: "low",
    type: "Deprecated API Usage",
    description: "Legacy v1 balance endpoint still serving 4% of production traffic past its sunset date.",
    endpoint: "/api/v2/accounts/{id}/balance",
    status: "resolved",
    owaspMapping: "API9:2023 Improper Inventory Management",
    detectedAt: "2026-07-29T14:10:07Z",
    sourceIp: "192.0.2.31",
  },
  {
    id: "ALT-1034",
    severity: "high",
    type: "SSRF Attempt",
    description: "Webhook registration payload pointed at the internal metadata service address.",
    endpoint: "/api/v1/payments/charge",
    status: "investigating",
    owaspMapping: "API7:2023 Server Side Request Forgery",
    detectedAt: "2026-07-29T11:38:26Z",
    sourceIp: "198.51.100.66",
  },
  {
    id: "ALT-1033",
    severity: "medium",
    type: "Mass Assignment",
    description: "PATCH request attempted to set role=admin on a self-service profile update.",
    endpoint: "/api/v1/users/{id}",
    status: "resolved",
    owaspMapping: "API6:2023 Unrestricted Access to Sensitive Business Flows",
    detectedAt: "2026-07-29T09:15:58Z",
    sourceIp: "203.0.113.150",
  },
  {
    id: "ALT-1032",
    severity: "low",
    type: "Weak TLS Client",
    description: "12 clients negotiating TLS 1.0 against the invoices service.",
    endpoint: "/api/v1/invoices/{id}",
    status: "resolved",
    owaspMapping: "API8:2023 Security Misconfiguration",
    detectedAt: "2026-07-28T20:02:44Z",
    sourceIp: "192.0.2.8",
  },
];

export const recentAlerts = alerts.slice(0, 5);

/* ---------------------------------- Logs --------------------------------- */

function seededLogs(count: number): LogEntry[] {
  const out: LogEntry[] = [];
  const base = Date.parse("2026-07-30T09:00:00Z");
  for (let i = 0; i < count; i++) {
    const risk = RISKS[(i * 7) % RISKS.length];
    out.push({
      id: `LOG-${9000 + i}`,
      timestamp: new Date(base - i * 137000).toISOString(),
      user: USERS[(i * 3) % USERS.length],
      endpoint: ENDPOINTS[(i * 5) % ENDPOINTS.length],
      method: METHODS[(i * 2) % METHODS.length],
      status: STATUSES[(i * 4) % STATUSES.length],
      ip: `${10 + (i % 200)}.${(i * 13) % 255}.${(i * 29) % 255}.${1 + (i % 250)}`,
      risk,
      responseTime: 20 + ((i * 73) % 900),
    });
  }
  return out;
}

export const logs: LogEntry[] = seededLogs(38);

/* -------------------------------- Threats -------------------------------- */

export const threatData = {
  riskLevel: "elevated" as "low" | "guarded" | "elevated" | "severe",
  liveTraffic: Array.from({ length: 8 }, () => generateTrafficItem()),
  attackTypes: [
    { name: "BOLA / IDOR", value: 128 },
    { name: "Shadow API", value: 74 },
    { name: "Auth Bypass", value: 52 },
    { name: "Rate Abuse", value: 41 },
    { name: "Injection", value: 23 },
  ],
  vulnerableApis: [
    { endpoint: "/api/v1/orders/{id}", attacks: 88 },
    { endpoint: "/api/v1/users/{id}", attacks: 71 },
    { endpoint: "/internal/debug/config", attacks: 54 },
    { endpoint: "/api/v1/admin/reports", attacks: 39 },
    { endpoint: "/api/v2/tokens/refresh", attacks: 27 },
  ],
};

/* ------------------------------- Inventory ------------------------------- */

export const inventory: ApiAsset[] = [
  { id: "api-01", name: "User Profile", endpoint: "/api/v1/users/{id}", method: "GET", category: "official", status: "at-risk", riskScore: 78, discoveredAt: "2025-11-04", owner: "Identity" },
  { id: "api-02", name: "Order Detail", endpoint: "/api/v1/orders/{id}", method: "GET", category: "official", status: "at-risk", riskScore: 91, discoveredAt: "2025-11-04", owner: "Commerce" },
  { id: "api-03", name: "Debug Config", endpoint: "/internal/debug/config", method: "GET", category: "shadow", status: "unmonitored", riskScore: 97, discoveredAt: "2026-07-28", owner: "Unknown" },
  { id: "api-04", name: "Charge Payment", endpoint: "/api/v1/payments/charge", method: "POST", category: "official", status: "healthy", riskScore: 44, discoveredAt: "2025-09-19", owner: "Payments" },
  { id: "api-05", name: "Legacy Balance", endpoint: "/api/v2/accounts/{id}/balance", method: "GET", category: "deprecated", status: "at-risk", riskScore: 66, discoveredAt: "2024-06-02", owner: "Banking" },
  { id: "api-06", name: "Admin Reports", endpoint: "/api/v1/admin/reports", method: "GET", category: "official", status: "at-risk", riskScore: 83, discoveredAt: "2025-12-11", owner: "Platform" },
  { id: "api-07", name: "Doc Download", endpoint: "/api/v1/documents/{id}/download", method: "GET", category: "official", status: "healthy", riskScore: 37, discoveredAt: "2026-01-23", owner: "Content" },
  { id: "api-08", name: "Mobile Sync", endpoint: "/mobile/v3/sync", method: "POST", category: "shadow", status: "unmonitored", riskScore: 72, discoveredAt: "2026-06-30", owner: "Unknown" },
  { id: "api-09", name: "Token Refresh", endpoint: "/api/v2/tokens/refresh", method: "POST", category: "official", status: "at-risk", riskScore: 69, discoveredAt: "2025-10-08", owner: "Identity" },
  { id: "api-10", name: "Tenant Members", endpoint: "/api/v1/tenants/{id}/members", method: "GET", category: "official", status: "at-risk", riskScore: 74, discoveredAt: "2026-02-14", owner: "Platform" },
  { id: "api-11", name: "Invoice Detail", endpoint: "/api/v1/invoices/{id}", method: "GET", category: "official", status: "healthy", riskScore: 29, discoveredAt: "2025-08-21", owner: "Finance" },
  { id: "api-12", name: "Partner Export", endpoint: "/partners/v0/export", method: "GET", category: "deprecated", status: "unmonitored", riskScore: 58, discoveredAt: "2024-03-17", owner: "Partnerships" },
];

/* ---------------------------- Endpoint details --------------------------- */

export function getEndpointDetail(id: string) {
  const asset = inventory.find((a) => a.id === id) ?? inventory[0];
  const seed = asset.riskScore;
  return {
    asset,
    requestCount: 12_000 + seed * 431,
    attackCount: Math.round(seed * 1.7),
    avgResponseTime: 60 + (seed % 40) * 4,
    riskScore: asset.riskScore,
    timeline: Array.from({ length: 12 }, (_, i) => ({
      time: `${String(i * 2).padStart(2, "0")}:00`,
      requests: 400 + ((seed * (i + 3) * 17) % 2600),
      attacks: (seed * (i + 1)) % 24,
    })),
    recommendations: [
      "Enforce object-level ownership checks server-side before returning the resource.",
      "Replace sequential integer identifiers with unguessable UUIDs or ULIDs.",
      "Add per-principal rate limits and anomaly thresholds on enumeration patterns.",
      "Strip sensitive properties from the response schema for non-owner roles.",
      "Register this endpoint in the API catalogue and attach an owning team.",
    ],
  };
}

/* -------------------------------- Analytics ------------------------------ */

export const analytics = {
  requestsPerHour: Array.from({ length: 12 }, (_, i) => ({
    hour: `${String(i * 2).padStart(2, "0")}:00`,
    requests: 9000 + ((i * 4211) % 38000),
  })),
  attackTrends: Array.from({ length: 7 }, (_, i) => ({
    day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
    bola: 12 + ((i * 13) % 40),
    shadow: 6 + ((i * 7) % 22),
    authBypass: 3 + ((i * 11) % 17),
  })),
  topTargeted: [
    { endpoint: "/api/v1/orders/{id}", hits: 4210 },
    { endpoint: "/api/v1/users/{id}", hits: 3688 },
    { endpoint: "/api/v2/tokens/refresh", hits: 2412 },
    { endpoint: "/internal/debug/config", hits: 1877 },
    { endpoint: "/api/v1/admin/reports", hits: 1204 },
  ],
  riskDistribution: [
    { name: "Low", value: 142 },
    { name: "Medium", value: 78 },
    { name: "High", value: 41 },
    { name: "Critical", value: 19 },
  ],
};

/* ------------------------------ User activity ---------------------------- */

export const userActivity: UserActivity[] = [
  { id: "u-1", username: "a.mercer", email: "a.mercer@northwind.io", requests: 18422, lastLogin: "2026-07-30 08:12", role: "Engineer", suspiciousActivities: 12, riskScore: 88 },
  { id: "u-2", username: "j.okafor", email: "j.okafor@northwind.io", requests: 9120, lastLogin: "2026-07-30 07:04", role: "Analyst", suspiciousActivities: 2, riskScore: 34 },
  { id: "u-3", username: "svc-billing", email: "svc-billing@internal", requests: 142_889, lastLogin: "2026-07-30 09:01", role: "Service Account", suspiciousActivities: 5, riskScore: 61 },
  { id: "u-4", username: "r.tanaka", email: "r.tanaka@northwind.io", requests: 4310, lastLogin: "2026-07-29 21:47", role: "Admin", suspiciousActivities: 0, riskScore: 18 },
  { id: "u-5", username: "m.dubois", email: "m.dubois@northwind.io", requests: 7788, lastLogin: "2026-07-29 18:22", role: "Engineer", suspiciousActivities: 7, riskScore: 72 },
  { id: "u-6", username: "svc-mobile", email: "svc-mobile@internal", requests: 88_140, lastLogin: "2026-07-30 08:58", role: "Service Account", suspiciousActivities: 3, riskScore: 47 },
  { id: "u-7", username: "l.petrova", email: "l.petrova@northwind.io", requests: 2210, lastLogin: "2026-07-28 16:33", role: "Auditor", suspiciousActivities: 1, riskScore: 22 },
];