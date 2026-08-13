import { useEffect, useState, useRef } from 'react';
import { Activity, ShieldAlert, Shield, AlertTriangle, Search, ActivitySquare } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

// OWASP Mappings based on BOLA & Shadow API triggers
const OWASP_MAP: Record<string, string> = {
  "BOLA": "API1:2023 Broken Object Level Authorization",
  "SHADOW_API": "API9:2023 Improper Inventory Management",
  "UNKNOWN": "APIX: Unknown Threat"
};

interface APITransaction {
  client: string;
  server: string;
  request: { method: string; path: string; json_body?: any };
  response?: { status_code: int; json_body?: any };
  latency_ms?: float;
  threat_type?: string; 
  // We'll assume the backend tags transactions if they are flagged. 
  // For the UI, we'll infer threats if path is unlisted or BOLA heuristic triggered.
}

export function Dashboard() {
  const [traffic, setTraffic] = useState<APITransaction[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Connect to WebSocket server running on backend
    const ws = new WebSocket('ws://localhost:8000/ws');
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (event) => {
      try {
        const txn = JSON.parse(event.data);
        // The backend now provides txn.threat_type natively (e.g. "BOLA" or "SHADOW_API")
        setTraffic((prev) => [txn, ...prev].slice(0, 50));
      } catch (e) {
        console.error("Parse error", e);
      }
    };

    return () => ws.close();
  }, []);

  const totalReqs = traffic.length;
  const flaggedReqs = traffic.filter(t => t.threat_type).length;
  
  // Aggregate data for the chart (just a simple sliding window of counts)
  const chartData = traffic.slice(0, 20).reverse().map((t, i) => ({
    name: i,
    latency: t.latency_ms || 10
  }));

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold gradient-text tracking-tight flex items-center gap-3">
            <Shield className="w-10 h-10 text-accent" />
            API Sentinel
          </h1>
          <p className="text-gray-400 mt-2">Real-time Runtime BOLA & Shadow API Detection Engine</p>
        </div>
        <div className="flex items-center gap-4 glass-card px-4 py-2 rounded-full">
          <div className={`w-3 h-3 rounded-full ${connected ? 'bg-success animate-pulse' : 'bg-danger'}`} />
          <span className="text-sm font-medium text-gray-300">
            {connected ? 'Live Capture Active' : 'Disconnected'}
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <ActivitySquare className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold">Live Traffic</h3>
          </div>
          <p className="text-4xl font-bold">{totalReqs}</p>
          <p className="text-sm text-gray-400 mt-2">Captured in current session</p>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-red-500/20">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-red-500/10 rounded-lg">
              <ShieldAlert className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold">Threats Blocked</h3>
          </div>
          <p className="text-4xl font-bold text-red-400">{flaggedReqs}</p>
          <p className="text-sm text-gray-400 mt-2">Suspicious requests</p>
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-lg font-semibold mb-4 text-gray-300">Latency Trend (ms)</h3>
          <div className="h-24 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="latency" stroke="#06b6d4" fillOpacity={1} fill="url(#colorLatency)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent" />
            Live Event Stream
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-sm text-gray-400 border-b border-white/10 bg-black/20">
                <th className="p-4 font-medium">Timestamp</th>
                <th className="p-4 font-medium">Endpoint</th>
                <th className="p-4 font-medium">Client</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">OWASP Mapping</th>
                <th className="p-4 font-medium">Masked Payload Example</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {traffic.map((txn, index) => {
                  const isThreat = !!txn.threat_type;
                  const owaspClass = OWASP_MAP[txn.threat_type || "UNKNOWN"];
                  
                  // Extract some masked JSON sample to prove masking works
                  const bodySample = txn.request.json_body 
                    ? JSON.stringify(txn.request.json_body).substring(0, 40) + "..."
                    : "-";

                  return (
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0, y: -20, backgroundColor: "rgba(6, 182, 212, 0.2)" }}
                      animate={{ opacity: 1, y: 0, backgroundColor: "rgba(0,0,0,0)" }}
                      transition={{ duration: 0.5 }}
                      className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                        isThreat ? 'bg-red-500/5' : ''
                      }`}
                    >
                      <td className="p-4 text-sm text-gray-400">
                        {new Date().toLocaleTimeString()}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs font-bold rounded ${
                            txn.request.method === 'GET' ? 'bg-blue-500/20 text-blue-400' :
                            txn.request.method === 'POST' ? 'bg-green-500/20 text-green-400' :
                            'bg-orange-500/20 text-orange-400'
                          }`}>
                            {txn.request.method}
                          </span>
                          <span className="font-mono text-sm">{txn.request.path}</span>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-xs text-gray-400">{txn.client}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                          txn.response?.status_code >= 400 
                            ? 'bg-red-500/20 text-red-400' 
                            : 'bg-green-500/20 text-green-400'
                        }`}>
                          {txn.response?.status_code || "PENDING"}
                        </span>
                      </td>
                      <td className="p-4">
                        {isThreat ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/20">
                            <AlertTriangle className="w-3 h-3" />
                            {owaspClass}
                          </span>
                        ) : (
                          <span className="text-gray-500 text-xs">-</span>
                        )}
                      </td>
                      <td className="p-4 font-mono text-xs text-accent">
                        {bodySample}
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
              
              {traffic.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <Search className="w-8 h-8 mb-4 opacity-50" />
                      <p>Waiting for live traffic...</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
