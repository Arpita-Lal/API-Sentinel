# Sentinel API Guardian

Create a complete, production‑ready React + TypeScript + Tailwind CSS frontend for a cybersecurity SaaS platform called **“API Sentinel – Runtime BOLA & Shadow API Detection Engine”**.  

The application must include:

- **Dark/Light theme** (class‑based Tailwind) with toggle in navbar and `localStorage` persistence.  

- **Public landing page** with hero, feature cards, and “Get Started”/“Sign Up” buttons.  

- **Full authentication flow**: login, create account (sign‑up), forgot password (with email simulation).  

- **Live API traffic** feed that simulates real‑time data every 2–3seconds.  

- **Private dashboard** with multiple pages (dashboard, threat dashboard, logs, alerts, inventory, endpoint details, analytics, user activity, settings).

All mock data is self‑contained; the app must run immediately after `npm install && npm run dev` without TypeScript or import errors.

---

### Technology Stack

- Vite + React 18 + TypeScript  

- Tailwind CSS (custom `sentinel` color palette in `tailwind.config.js`)  

- react‑router‑dom  

- recharts  

- framer‑motion  

- react‑icons  

- axios (import ready, but mock data used)

No external UI libraries beyond the ones above.

---

### Theme System (`ThemeContext`)

- Provides `theme` (`'dark' | 'light'`) and `toggleTheme()`.

- Reads initial value from `localStorage` (default `'dark'`).

- Toggles `dark` class on `<html>` (Tailwind’s `class` strategy).

- Light mode: background `#f8fafc`, card `#ffffff`, text `#1e293b`, borders `#e2e8f0`.

- Dark mode: background `#0a0e17`, card `#111827`, accent `#06b6d4`, etc.

---

### Authentication System (`AuthContext`)

- Stores `user` object (`{ name, email }`) and `isAuthenticated` boolean.

- **Login**: mock function that accepts email and password, simulates a 1‑second delay, and sets the user.

- **Sign‑up**: accepts name, email, password, confirm password; validates (non‑empty, passwords match); simulates creation and auto‑logs in or redirects to login.

- **Logout**: clears user state.

- **Forgot password**: a function that accepts email and simulates sending a reset link (displays success message).

- Private routes: if not authenticated, redirect to `/login`.

---

### Routing & Navigation

- `/` → Landing page (public)

- `/login` → Login page (public)

- `/signup` → Create account page (public)

- `/forgot-password` → Forgot password page (public)

- `/dashboard`, `/threats`, `/logs`, `/alerts`, `/inventory`, `/analytics`, `/users`, `/settings` → Private (redirect to `/login` if not authenticated)

- `/endpoint/:id` → Private endpoint details

**Sidebar** (only on private routes) contains: Dashboard, Threat Dashboard, API Logs, Alerts, API Inventory, Analytics, User Activity, Settings. Active link highlighted with accent color.

---

### Mock Data (`src/services/api.ts`)

Provide realistic data for:

- **Dashboard**: totalRequests, alertsCount, shadowApis, bolaAttacks, protectedApis, activeUsers, recentAlerts[], requestTrend[], apiActivity[]

- **Threat Dashboard**: liveTraffic[], attackTypes[], vulnerableApis[]

- **Logs**: 25+ entries with timestamp, user, endpoint, method, status, ip, risk, responseTime

- **Alerts**: 8–10 entries with severity, type, description, endpoint, status, owaspMapping

- **Inventory**: 10+ APIs with categories (official/shadow/deprecated), risk scores, discovery date

- **Endpoint Details**: requestCount, attackCount, avgResponseTime, riskScore, timeline[], recommendations[]

- **Analytics**: requestsPerHour[], attackTrends[], topTargeted[], riskDistribution[]

- **User Activity**: 6+ users with requests, lastLogin, role, suspiciousActivities, riskScore

---

### Pages

#### 1. Landing Page (`/`)

- Hero section: large gradient heading “API Sentinel”, subtitle, two CTA buttons: **“Get Started”** (→ `/login`) and **“Create Free Account”** (→ `/signup`).

- 3–4 feature cards: “Real‑Time BOLA Detection”, “Shadow API Discovery”, “Live Traffic Monitoring”, “OWASP Top 10 Mapping”.

- Footer with links and copyright.

#### 2. Login Page (`/login`)

- Centered card with email input, password input, “Remember Me” checkbox, **Sign In** button (loading state).

- Link **“Create an account”** → `/signup`.

- Link **“Forgot password?”** → `/forgot-password`.

#### 3. Sign‑Up Page (`/signup`)

- Fields: Full Name, Email, Password, Confirm Password.

- Client‑side validation (all fields required, passwords must match).

- **Create Account** button with loading state.  

- On success, redirect to `/login` with a success toast, or auto‑login and redirect to `/dashboard`.

- Link “Already have an account? Sign in” → `/login`.

#### 4. Forgot Password Page (`/forgot-password`)

- Email input and **“Send Reset Link”** button.

- After “submission”, show a confirmation message: “If an account with that email exists, a reset link has been sent.”

- Link back to `/login`.

#### 5. Dashboard (`/dashboard`)

- Summary stat cards (animated) with trend arrows.

- Request trend area chart.

- Recent alerts list.

- Recent API activity table with status badges.

#### 6. Threat Dashboard (`/threats`)

- **Live Traffic Feed** – new fake log entries appear every 2–3 seconds (use `setInterval` with random mock data). Each entry fades in.

- Attack type distribution pie chart.

- Vulnerable endpoints horizontal bar chart.

- Current risk level badge.

#### 7. API Logs (`/logs`)

- Searchable, filterable table with pagination.

- Export button (dummy action).

#### 8. Alerts (`/alerts`)

- Filter by status (active/investigating/resolved).

- Each alert shows severity badge, OWASP tag, description, actions.

- “View” opens a modal with full details.

#### 9. API Inventory (`/inventory`)

- Filter by category (official/shadow/deprecated).

- Table with name, endpoint, method, status, risk score, discovery date.

#### 10. Endpoint Details (`/endpoint/:id`)

- Stat cards, request timeline line chart, security recommendations list.

#### 11. Analytics (`/analytics`)

- Requests per hour bar chart.

- Attack trends line chart (multiple series).

- Top targeted endpoints horizontal bar chart.

- Risk distribution pie chart.

#### 12. User Activity (`/users`)

- Searchable table with columns: username, requests, last login, role, suspicious activities, risk score.

#### 13. Settings (`/settings`)

- Monitoring toggle, auto‑refresh interval selector.

- Theme switch (dark/light).

- Notification toggle.

- Export/clear logs/reports buttons.

- Change password (dummy).

- Logout button.

---

### Live Traffic Simulation

- In `ThreatDashboard`, maintain an array of traffic items.

- On mount, start a `setInterval` that every 2–3 seconds generates a new random traffic object (endpoint, method, status, ip, risk, timestamp).

- Prepend the item to the list (newest first) and limit the array to 20 items.

- Use `framer‑motion` `AnimatePresence` to animate new items in.

- Clean up interval on unmount.

---

### Reusable Components (responsive, theme‑aware)

- `Layout`, `Sidebar`, `Navbar`, `Footer`

- `StatCard`, `StatusBadge`, `LoadingSpinner`, `EmptyState`, `Modal`, `SearchBar`, `Pagination`, `AlertCard`

- `Toast` notification component (for sign‑up success, etc.)

---

### Styling

- Tailwind exclusively. Custom `sentinel` colors defined in `tailwind.config.js`.

- Glass cards: `backdrop-blur-md bg-opacity-70 border border-opacity-30`.

- Smooth transitions on theme change (e.g., `transition-colors duration-300` on body).

- Custom scrollbar styling in `index.css`.

---




## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
