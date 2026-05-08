import { useClock } from '../hooks/useRealtime';
import { useSocket } from '../context/SocketContext';
import { Shield, Wifi, WifiOff, AlertTriangle, Activity, Loader2 } from 'lucide-react';

export default function Navbar() {
  const time = useClock();
  const { connectionStatus, alerts, latency } = useSocket();

  const pad = (n) => String(n).padStart(2, '0');
  const timeStr = `${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(time.getSeconds())}`;
  const dateStr = time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  // Connection status mapping
  const connMap = {
    connected:    { label: 'LIVE',         color: '#00FF87', icon: <Wifi size={12} /> },
    connecting:   { label: 'CONNECTING',   color: '#FFD700', icon: <Loader2 size={12} className="animate-spin" /> },
    disconnected: { label: 'OFFLINE',      color: '#FF4D4D', icon: <WifiOff size={12} /> },
    error:        { label: 'ERROR',        color: '#FF4D4D', icon: <WifiOff size={12} /> },
  };
  const conn = connMap[connectionStatus] || connMap.connecting;

  const alertCount = alerts?.length || 0;
  const criticalCount = alerts?.filter(a => a.severity === 'CRITICAL').length || 0;

  return (
    <nav className="w-full flex-shrink-0 flex items-center justify-between px-5 h-14 z-50"
      style={{
        background: 'rgba(11, 18, 32, 0.95)',
        borderBottom: '1px solid rgba(0, 209, 255, 0.2)',
        backdropFilter: 'blur(20px)',
      }}>

      {/* Logo / Brand */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-lg"
          style={{ background: 'rgba(255,77,77,0.15)', border: '1px solid rgba(255,77,77,0.4)' }}>
          <Shield size={18} color="#FF4D4D" />
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500"
            style={{ animation: 'pulse-dot 1.5s ease-in-out infinite', boxShadow: '0 0 6px #FF4D4D' }} />
        </div>
        <div>
          <h1 className="font-orbitron font-bold text-base tracking-widest leading-none"
            style={{ color: '#00D1FF', textShadow: '0 0 12px rgba(0,209,255,0.6)' }}>
            SENTINEL FIRE AI
          </h1>
          <p className="text-xs font-mono-code" style={{ color: 'rgba(148,163,184,0.7)', letterSpacing: '0.2em' }}>
            COMMAND CENTER v3.1.4
          </p>
        </div>
      </div>

      {/* Center: System Status — now uses real socket connection status */}
      <div className="hidden md:flex items-center gap-6">
        {/* WebSocket connection status */}
        <StatusPill
          icon={conn.icon}
          label="SOCKET"
          value={conn.label}
          color={conn.color}
          pulse={connectionStatus === 'connected'}
        />
        {/* Latency */}
        {latency !== null && connectionStatus === 'connected' && (
          <StatusPill
            icon={<Activity size={12} />}
            label="LATENCY"
            value={`${latency}ms`}
            color={latency < 50 ? '#00FF87' : latency < 150 ? '#FFD700' : '#FF4D4D'}
          />
        )}
        <StatusPill icon={<Shield size={12} />} label="PROTOCOL" value="ALPHA" color="#FF8A00" />
      </div>

      {/* Right: Time + Alerts */}
      <div className="flex items-center gap-4">
        {/* Clock */}
        <div className="text-right hidden sm:block">
          <p className="font-orbitron text-base font-bold leading-none"
            style={{ color: '#00D1FF', letterSpacing: '0.1em', textShadow: '0 0 10px rgba(0,209,255,0.5)' }}>
            {timeStr}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(148,163,184,0.6)', letterSpacing: '0.12em' }}>
            {dateStr}
          </p>
        </div>

        {/* Alert Counter — now from real socket alerts */}
        <button className="relative flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{
            background: criticalCount > 0 ? 'rgba(255,77,77,0.12)' : 'rgba(255,138,0,0.1)',
            border: `1px solid ${criticalCount > 0 ? 'rgba(255,77,77,0.45)' : 'rgba(255,138,0,0.35)'}`,
            animation: criticalCount > 0 ? 'blink-alert 2s ease-in-out infinite' : 'none',
          }}>
          <AlertTriangle size={14} color={criticalCount > 0 ? '#FF4D4D' : '#FF8A00'} />
          <span className="font-orbitron text-sm font-bold" style={{ color: criticalCount > 0 ? '#FF4D4D' : '#FF8A00' }}>
            {alertCount}
          </span>
          <span className="text-xs" style={{ color: criticalCount > 0 ? 'rgba(255,77,77,0.7)' : 'rgba(255,138,0,0.7)', letterSpacing: '0.1em' }}>
            ALERTS
          </span>
          {criticalCount > 0 && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full"
              style={{ background: '#FF4D4D', animation: 'pulse-dot 1s infinite', boxShadow: '0 0 8px #FF4D4D' }} />
          )}
        </button>
      </div>
    </nav>
  );
}

function StatusPill({ icon, label, value, color, pulse = false }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md"
      style={{ background: `rgba(${hexToRgb(color)}, 0.08)`, border: `1px solid rgba(${hexToRgb(color)}, 0.25)` }}>
      <span style={{ color }}>{icon}</span>
      <span className="text-xs font-mono-code" style={{ color: 'rgba(148,163,184,0.6)', letterSpacing: '0.1em' }}>{label}</span>
      <span className="text-xs font-orbitron font-semibold" style={{ color, letterSpacing: '0.08em' }}>{value}</span>
      <span className="w-1.5 h-1.5 rounded-full" style={{
        background: color,
        boxShadow: `0 0 6px ${color}`,
        animation: pulse ? 'pulse-dot 2s infinite' : 'none',
      }} />
    </div>
  );
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}
