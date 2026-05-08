import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import CameraPanel from './components/CameraPanel';
import SensorPanel from './components/SensorPanel';
import IncidentTimeline from './components/IncidentTimeline';
import AlertsTable from './components/AlertsTable';
import BlockchainLogs from './components/BlockchainLogs';

function EmergencyBanner() {
  return (
    <div className="flex-shrink-0 flex items-center gap-3 px-5 py-2 relative overflow-hidden"
      style={{
        background: 'rgba(255,77,77,0.08)',
        borderBottom: '1px solid rgba(255,77,77,0.3)',
        animation: 'blink-alert 2.5s ease-in-out infinite',
      }}>
      {/* Flowing data line */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 h-px w-32"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,77,77,0.6), transparent)',
            animation: 'data-flow 2s ease-in-out infinite',
            transform: 'translateY(-50%)',
          }} />
      </div>

      <span className="font-orbitron text-xs font-bold tracking-widest" style={{ color: '#FF4D4D', textShadow: '0 0 10px rgba(255,77,77,0.7)' }}>
        ⚠ EMERGENCY ALERT
      </span>
      <span className="text-xs font-mono-code" style={{ color: 'rgba(255,255,255,0.7)' }}>
        Active fire detected in Building A, Zone A-3 · Floor 3 · AI Confidence: 97.3%
      </span>
      <span className="ml-auto font-mono-code text-xs px-2 py-0.5 rounded"
        style={{ background: 'rgba(255,77,77,0.15)', color: '#FF4D4D', border: '1px solid rgba(255,77,77,0.4)', letterSpacing: '0.1em', flexShrink: 0 }}>
        PROTOCOL ALPHA ACTIVE
      </span>
    </div>
  );
}

function GridBackground() {
  return (
    <div className="absolute inset-0 grid-bg pointer-events-none" style={{ zIndex: 0 }}>
      {/* Radial vignette */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(11,18,32,0.7) 100%)',
      }} />
    </div>
  );
}

function AIStatusCard() {
  return (
    <div className="glass-card p-4 flex-shrink-0" style={{ border: '1px solid rgba(0,209,255,0.2)' }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="relative">
          <div className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,209,255,0.1)', border: '1px solid rgba(0,209,255,0.35)' }}>
            <span className="text-sm">🤖</span>
          </div>
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
            style={{ background: '#00FF87', boxShadow: '0 0 6px #00FF87', animation: 'pulse-dot 1.5s infinite' }} />
        </div>
        <div>
          <p className="font-orbitron text-xs font-bold tracking-wider" style={{ color: '#00D1FF' }}>AI ENGINE</p>
          <p className="text-xs font-mono-code" style={{ color: 'rgba(148,163,184,0.5)', fontSize: '9px' }}>SENTINEL-v3 NEURAL NET</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'INFERENCE', value: '12ms', color: '#00FF87' },
          { label: 'ACCURACY', value: '99.2%', color: '#00D1FF' },
          { label: 'FPS', value: '30', color: '#00D1FF' },
          { label: 'MODEL', value: 'YOLOv9', color: '#8B5CF6' },
        ].map((stat, i) => (
          <div key={i} className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="font-mono-code" style={{ color: 'rgba(148,163,184,0.4)', fontSize: '8px', letterSpacing: '0.1em' }}>{stat.label}</p>
            <p className="font-orbitron text-sm font-bold" style={{ color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <SocketProvider>
      <div className="flex flex-col w-full h-full overflow-hidden relative"
        style={{ background: '#0B1220' }}>

        <GridBackground />

        {/* Top Navbar */}
        <Navbar />

        {/* Emergency Banner */}
        <EmergencyBanner />

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden relative z-10" style={{ minHeight: 0 }}>

          {/* ─── LEFT PANEL: Camera + AI ─── */}
          <div className="flex flex-col p-3 gap-3" style={{ width: '38%', minWidth: 0, minHeight: 0 }}>
            <CameraPanel />
          </div>

          {/* ─── RIGHT PANEL: Sensors ─── */}
          <div className="flex flex-col p-3 gap-3 overflow-y-auto" style={{ width: '22%', minWidth: 0, minHeight: 0 }}>
            <SensorPanel />
          </div>

          {/* ─── FAR RIGHT PANEL: Timeline ─── */}
          <div className="flex flex-col p-3 gap-3" style={{ width: '20%', minWidth: 0, minHeight: 0 }}>
            <IncidentTimeline />
          </div>

          {/* ─── BOTTOM RIGHT COMPOSITE PANEL ─── */}
          <div className="flex flex-col p-3 gap-3" style={{ width: '20%', minWidth: 0, minHeight: 0 }}>
            <AIStatusCard />
            <BlockchainLogs />
          </div>
        </div>

        {/* ─── BOTTOM PANEL: Alerts Table ─── */}
        <div className="flex-shrink-0 p-3 pt-0" style={{ height: '220px' }}>
          <AlertsTable />
        </div>
      </div>
    </SocketProvider>
  );
}
