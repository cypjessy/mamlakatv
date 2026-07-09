"use client";

import { useEffect, useState, useRef } from "react";

// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

interface ServerState {
  cpu: number;
  ram: number;
  ramUsed: string;
  ramTotal: string;
  uptime: string;
  temp: number;
  rx: string;
  tx: string;
  load: number[];
  processes: number;
}

interface ServiceStatus {
  name: string;
  icon: string;
  status: "online" | "offline" | "maintenance";
  label: string;
  meta: string;
  color: string;
}

// ═══════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function randInt(min: number, max: number) {
  return Math.floor(rand(min, max + 1));
}

function formatUptime(seconds: number) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}

function formatTraffic(mbps: number) {
  if (mbps > 1000) return `${(mbps / 1000).toFixed(1)} Gbps`;
  return `${mbps.toFixed(0)} Mbps`;
}

// ═══════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════

const SERVERS: ServerState[] = [
  { cpu: 0, ram: 0, ramUsed: "0 GB", ramTotal: "32 GB", uptime: "0s", temp: 0, rx: "0 Mbps", tx: "0 Mbps", load: [0, 0, 0], processes: 0 },
  { cpu: 0, ram: 0, ramUsed: "0 GB", ramTotal: "32 GB", uptime: "0s", temp: 0, rx: "0 Mbps", tx: "0 Mbps", load: [0, 0, 0], processes: 0 },
];

const SERVICES: ServiceStatus[] = [
  { name: "TV Streaming", icon: "fas fa-tv", status: "online", label: "Live Now", meta: "720p · 24 fps", color: "#EF4444" },
  { name: "LiveKit Server", icon: "fas fa-video", status: "online", label: "Connected", meta: "WebRTC · 8 rooms", color: "#8B5CF6" },
  { name: "Image Storage", icon: "fas fa-database", status: "online", label: "2.4 GB Used", meta: "BunnyCDN · 312 files", color: "#3B82F6" },
  { name: "Radio Station", icon: "fas fa-radio", status: "online", label: "Broadcasting", meta: "AzuraCast · 128 kbps", color: "#E8A838" },
];

// ═══════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════

export default function SubscriptionsTab() {
  const [servers, setServers] = useState<ServerState[]>(SERVERS);
  const uptimeRef = useRef([randInt(50000, 90000), randInt(50000, 90000)]);
  const [services] = useState<ServiceStatus[]>(SERVICES);
  const [activeServer, setActiveServer] = useState(1);
  const [networkIn, setNetworkIn] = useState(0);
  const [networkOut, setNetworkOut] = useState(0);

  // Simulate server metrics updating every 1.5s
  useEffect(() => {
    const interval = setInterval(() => {
      uptimeRef.current = uptimeRef.current.map((u) => u + 1.5);
      setServers((prev) =>
        prev.map((s, i) => ({
          cpu: rand(22, 48),
          ram: rand(24, 56),
          ramUsed: `${randInt(8, 18)} GB`,
          ramTotal: "32 GB",
          uptime: formatUptime(uptimeRef.current[i]),
          temp: rand(42, 62),
          rx: formatTraffic(rand(120, 480)),
          tx: formatTraffic(rand(40, 190)),
          load: [rand(0.5, 2.5), rand(0.8, 3.2), rand(1.0, 4.0)],
          processes: randInt(210, 340),
        }))
      );
      setNetworkIn(randInt(150, 520));
      setNetworkOut(randInt(50, 210));
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  // Simulate random events
  const [events, setEvents] = useState<string[]>([
    "✅ Server health check passed",
    "📡 CDN cache refreshed",
    "🔄 Auto-scaling idle",
  ]);

  useEffect(() => {
    const messages = [
      "✅ All services operational",
      "📡 Uplink stable · 12 ms latency",
      "🛡️ DDoS protection active",
      "🔒 SSL certificates valid (30d)",
      "⚡ Load balancing optimal",
      "📦 Backup completed (4.2 GB)",
      "🌐 Global CDN edge sync OK",
      "🔄 Database replication lag: 0s",
    ];
    const interval = setInterval(() => {
      setEvents((prev) => {
        const next = [...prev, `✅ ${messages[randInt(0, messages.length - 1)]}`];
        if (next.length > 6) next.shift();
        return next;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // ═══════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════

  return (
    <>
      <style>{`
        /* ── Subscriptions Tab Styles ── */
        .sub-scroll {
          padding: 0 16px 100px;
        }

        /* ── Server Cards ── */
        .server-grid {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 20px;
        }

        .server-card {
          background: var(--surface-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 18px;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        .server-card.active {
          border-color: rgba(74, 222, 128, 0.3);
        }

        .server-glow {
          position: absolute;
          top: -60%;
          right: -20%;
          width: 180px;
          height: 180px;
          background: radial-gradient(circle, rgba(74, 222, 128, 0.06) 0%, transparent 70%);
          pointer-events: none;
        }

        .server-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }
        .server-name-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .server-led {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #4ADE80;
          box-shadow: 0 0 8px rgba(74, 222, 128, 0.6);
          animation: pulse-led 2s ease-in-out infinite;
        }
        @keyframes pulse-led {
          0%, 100% { opacity: 1; box-shadow: 0 0 8px rgba(74, 222, 128, 0.6); }
          50% { opacity: 0.6; box-shadow: 0 0 4px rgba(74, 222, 128, 0.3); }
        }
        .server-name {
          font-size: 15px;
          font-weight: 700;
        }
        .server-badge {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 3px 10px;
          border-radius: 6px;
          background: rgba(74, 222, 128, 0.12);
          color: #4ADE80;
        }

        /* ── Metric Bars ── */
        .server-metrics {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .metric-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .metric-icon {
          width: 28px;
          text-align: center;
          font-size: 12px;
          color: var(--text-tertiary);
          flex-shrink: 0;
        }
        .metric-label {
          font-size: 12px;
          color: var(--text-secondary);
          width: 40px;
          flex-shrink: 0;
          font-weight: 500;
        }
        .metric-bar-track {
          flex: 1;
          height: 6px;
          background: var(--surface);
          border-radius: 3px;
          overflow: hidden;
        }
        .metric-bar-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.6s ease;
        }
        .metric-value {
          font-size: 12px;
          font-weight: 600;
          width: 56px;
          text-align: right;
          flex-shrink: 0;
          font-variant-numeric: tabular-nums;
        }

        /* ── Server Footer Stats ── */
        .server-footer {
          display: flex;
          gap: 16px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid var(--border);
          flex-wrap: wrap;
        }
        .server-footer-item {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          color: var(--text-tertiary);
        }
        .server-footer-item i {
          font-size: 10px;
          width: 14px;
          text-align: center;
        }
        .server-footer-item strong {
          color: var(--text-secondary);
          font-weight: 600;
        }

        /* ── Network Graph ── */
        .network-card {
          background: var(--surface-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 18px;
          margin-bottom: 20px;
        }
        .network-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }
        .network-title {
          font-size: 14px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .network-stats {
          display: flex;
          gap: 20px;
        }
        .network-stat {
          text-align: center;
        }
        .network-stat-label {
          font-size: 10px;
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .network-stat-value {
          font-size: 15px;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
        }
        .network-stat-value.in { color: #3B82F6; }
        .network-stat-value.out { color: #E8A838; }
        .network-graph {
          height: 40px;
          display: flex;
          align-items: flex-end;
          gap: 3px;
        }
        .network-bar {
          flex: 1;
          border-radius: 2px 2px 0 0;
          transition: height 0.8s ease;
          min-height: 2px;
        }

        /* ── Service Cards ── */
        .services-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }
        .service-card {
          background: var(--surface-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 16px;
          text-align: center;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .service-card:active {
          transform: scale(0.97);
        }
        .service-icon {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 10px;
          font-size: 18px;
          color: #fff;
          transition: all 0.3s ease;
        }
        .service-name {
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 3px;
        }
        .service-status {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 600;
          padding: 3px 10px;
          border-radius: 20px;
          margin-top: 4px;
        }
        .service-status.online {
          background: rgba(74, 222, 128, 0.12);
          color: #4ADE80;
        }
        .service-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #4ADE80;
          animation: pulse-led 2s ease-in-out infinite;
        }
        .service-meta {
          font-size: 10px;
          color: var(--text-tertiary);
          margin-top: 6px;
        }

        /* ── VPS Specs ── */
        .vps-card {
          background: linear-gradient(135deg, var(--surface-card) 0%, rgba(232,168,56,0.04) 100%);
          border: 1px solid rgba(232,168,56,0.2);
          border-radius: var(--radius-lg);
          padding: 20px;
          margin-bottom: 20px;
        }
        .vps-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .vps-title {
          font-size: 15px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .vps-price {
          font-size: 18px;
          font-weight: 800;
          color: var(--primary);
        }
        .vps-price small {
          font-size: 11px;
          font-weight: 500;
          color: var(--text-tertiary);
        }
        .vps-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        .vps-spec {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          background: rgba(232,168,56,0.04);
          border: 1px solid rgba(232,168,56,0.08);
          border-radius: var(--radius-sm);
        }
        .vps-spec-icon {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-sm);
          background: rgba(232,168,56,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          color: var(--primary);
          flex-shrink: 0;
        }
        .vps-spec-info {
          flex: 1;
          min-width: 0;
        }
        .vps-spec-label {
          font-size: 10px;
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .vps-spec-value {
          font-size: 13px;
          font-weight: 700;
        }

        /* ── Events Log ── */
        .events-card {
          background: var(--surface-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 18px;
          margin-bottom: 20px;
        }
        .events-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .events-title i {
          font-size: 10px;
          color: var(--success);
        }
        .events-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .events-item {
          font-size: 12px;
          color: var(--text-secondary);
          font-family: 'SF Mono', 'Cascadia Code', monospace;
          padding: 4px 0;
          border-bottom: 1px solid var(--border);
          animation: fade-in 0.3s ease;
        }
        .events-item:last-child { border-bottom: none; }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ── Spinner ── */
        .fa-spin { animation: fa-spin 1.5s linear infinite; }
        @keyframes fa-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>

      <div className="sub-scroll">

        {/* ════ Server Monitoring ════ */}
        <div className="section-title" style={{ fontSize: 14, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>
          <i className="fas fa-server"></i> Server Infrastructure
        </div>

        <div className="server-grid">
          {servers.map((srv, i) => {
            const cpuColor = srv.cpu > 70 ? "#EF4444" : srv.cpu > 50 ? "#E8A838" : "#4ADE80";
            const ramColor = srv.ram > 70 ? "#EF4444" : srv.ram > 50 ? "#E8A838" : "#4ADE80";
            const tempColor = srv.temp > 60 ? "#EF4444" : srv.temp > 50 ? "#E8A838" : "#4ADE80";
            return (
              <div
                key={i}
                className={`server-card${activeServer === i ? " active" : ""}`}
                onClick={() => setActiveServer(i)}
              >
                <div className="server-glow" />
                <div className="server-top">
                  <div className="server-name-wrap">
                    <div className="server-led" />
                    <div className="server-name">Server {i + 1}</div>
                  </div>
                  <div className="server-badge">
                    <i className="fas fa-check-circle" style={{ marginRight: 4 }}></i>
                    Online
                  </div>
                </div>

                <div className="server-metrics">
                  {/* CPU */}
                  <div className="metric-row">
                    <div className="metric-icon"><i className="fas fa-microchip"></i></div>
                    <div className="metric-label">CPU</div>
                    <div className="metric-bar-track">
                      <div className="metric-bar-fill" style={{ width: `${srv.cpu}%`, background: cpuColor }} />
                    </div>
                    <div className="metric-value" style={{ color: cpuColor }}>{srv.cpu.toFixed(0)}%</div>
                  </div>

                  {/* RAM */}
                  <div className="metric-row">
                    <div className="metric-icon"><i className="fas fa-memory"></i></div>
                    <div className="metric-label">RAM</div>
                    <div className="metric-bar-track">
                      <div className="metric-bar-fill" style={{ width: `${srv.ram}%`, background: ramColor }} />
                    </div>
                    <div className="metric-value" style={{ color: ramColor }}>{srv.ram.toFixed(0)}%</div>
                  </div>

                  {/* Temperature */}
                  <div className="metric-row">
                    <div className="metric-icon"><i className="fas fa-temperature-high"></i></div>
                    <div className="metric-label">TEMP</div>
                    <div className="metric-bar-track">
                      <div className="metric-bar-fill" style={{ width: `${((srv.temp - 35) / 45) * 100}%`, background: tempColor }} />
                    </div>
                    <div className="metric-value" style={{ color: tempColor }}>{srv.temp.toFixed(0)}°C</div>
                  </div>
                </div>

                <div className="server-footer">
                  <div className="server-footer-item">
                    <i className="fas fa-arrow-down"></i>
                    <strong>RX</strong> {srv.rx}
                  </div>
                  <div className="server-footer-item">
                    <i className="fas fa-arrow-up"></i>
                    <strong>TX</strong> {srv.tx}
                  </div>
                  <div className="server-footer-item">
                    <i className="fas fa-clock"></i>
                    <strong>Uptime</strong> {srv.uptime}
                  </div>
                  <div className="server-footer-item">
                    <i className="fas fa-gear"></i>
                    <strong>Load</strong> {srv.load.map((l) => l.toFixed(1)).join(" / ")}
                  </div>
                  <div className="server-footer-item">
                    <i className="fas fa-diagram-project"></i>
                    <strong>Procs</strong> {srv.processes}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ════ Network Traffic ════ */}
        <div className="network-card">
          <div className="network-header">
            <div className="network-title">
              <i className="fas fa-network-wired" style={{ color: "#3B82F6" }}></i>
              Network Traffic
            </div>
            <div className="network-stats">
              <div className="network-stat">
                <div className="network-stat-label">Inbound</div>
                <div className="network-stat-value in">{networkIn} Mbps</div>
              </div>
              <div className="network-stat">
                <div className="network-stat-label">Outbound</div>
                <div className="network-stat-value out">{networkOut} Mbps</div>
              </div>
            </div>
          </div>
          <div className="network-graph">
            {Array.from({ length: 20 }).map((_, i) => {
              const inH = rand(10, 100);
              const outH = rand(5, 70);
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
                  <div className="network-bar" style={{ height: `${inH}%`, background: "#3B82F6", opacity: 0.7 }} />
                  <div className="network-bar" style={{ height: `${outH}%`, background: "#E8A838", opacity: 0.7 }} />
                </div>
              );
            })}
          </div>
        </div>

        {/* ════ Section Title ════ */}
        <div className="section-title" style={{ fontSize: 14, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>
          <i className="fas fa-cubes"></i> App Services
        </div>

        {/* ════ Services Grid ════ */}
        <div className="services-grid">
          {services.map((svc, i) => (
            <div className="service-card" key={i}>
              <div className="service-icon" style={{ background: `${svc.color}22`, color: svc.color }}>
                <i className={svc.icon}></i>
              </div>
              <div className="service-name">{svc.name}</div>
              <div className="service-status online">
                <div className="service-status-dot" />
                {svc.label}
              </div>
              <div className="service-meta">{svc.meta}</div>
            </div>
          ))}
        </div>

        {/* ════ VPS Specs ════ */}
        <div className="vps-card">
          <div className="vps-header">
            <div className="vps-title">
              <i className="fas fa-server" style={{ color: "var(--primary)" }}></i>
              Virtual Private Server
            </div>
            <div className="vps-price">
              €29.60 <small>/mo</small>
            </div>
          </div>
          <div className="vps-grid">
            <div className="vps-spec">
              <div className="vps-spec-icon"><i className="fas fa-microchip"></i></div>
              <div className="vps-spec-info">
                <div className="vps-spec-label">vCPU</div>
                <div className="vps-spec-value">16 Cores</div>
              </div>
            </div>
            <div className="vps-spec">
              <div className="vps-spec-icon"><i className="fas fa-memory"></i></div>
              <div className="vps-spec-info">
                <div className="vps-spec-label">RAM</div>
                <div className="vps-spec-value">64 GB</div>
              </div>
            </div>
            <div className="vps-spec">
              <div className="vps-spec-icon"><i className="fas fa-hard-drive"></i></div>
              <div className="vps-spec-info">
                <div className="vps-spec-label">Storage</div>
                <div className="vps-spec-value">300 GB NVMe / 600 GB SSD</div>
              </div>
            </div>
            <div className="vps-spec">
              <div className="vps-spec-icon"><i className="fas fa-wifi"></i></div>
              <div className="vps-spec-info">
                <div className="vps-spec-label">Port Speed</div>
                <div className="vps-spec-value">1 Gbit/s</div>
              </div>
            </div>
            <div className="vps-spec">
              <div className="vps-spec-icon"><i className="fas fa-infinity"></i></div>
              <div className="vps-spec-info">
                <div className="vps-spec-label">Traffic</div>
                <div className="vps-spec-value">Unlimited*</div>
              </div>
            </div>
            <div className="vps-spec">
              <div className="vps-spec-icon"><i className="fas fa-shield-halved"></i></div>
              <div className="vps-spec-info">
                <div className="vps-spec-label">Protection</div>
                <div className="vps-spec-value">DDoS Protected</div>
              </div>
            </div>
          </div>
        </div>

        {/* ════ Event Log ════ */}
        <div className="events-card">
          <div className="events-title">
            <i className="fas fa-circle" style={{ fontSize: 8 }}></i>
            System Events
          </div>
          <div className="events-list">
            {events.slice().reverse().map((ev, i) => (
              <div className="events-item" key={i}>{ev}</div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}
