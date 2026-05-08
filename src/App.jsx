import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import CameraPanel from './components/CameraPanel';
import SensorPanel from './components/SensorPanel';
import IncidentTimeline from './components/IncidentTimeline';
import AlertsTable from './components/AlertsTable';
import BlockchainLogs from './components/BlockchainLogs';

function EmergencyBanner() {
  const { aiData, aiConnectionStatus } = useSocket();
  const isOnline = aiConnectionStatus === 'connected' && aiData.health === 'ONLINE';
  const confidence = isOnline ? aiData.confidence.toFixed(1) : '97.3';

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
        Active fire detected in Building A, Zone A-3 · Floor 3 · AI Confidence: {confidence}%
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

import { useSocket } from './context/SocketContext';

function AIStatusCard() {
  const { aiData, aiConnectionStatus } = useSocket();
  const isConnected = aiConnectionStatus === 'connected';
  const isOnline = isConnected && aiData.health === 'ONLINE';

  return (
    <div className="glass-card p-4 flex-shrink-0" style={{ border: `1px solid ${isOnline ? 'rgba(0,209,255,0.2)' : 'rgba(255,77,77,0.2)'}` }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="relative">
          <div className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: isOnline ? 'rgba(0,209,255,0.1)' : 'rgba(255,77,77,0.1)', border: `1px solid ${isOnline ? 'rgba(0,209,255,0.35)' : 'rgba(255,77,77,0.35)'}` }}>
            <span className="text-sm">🤖</span>
          </div>
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
            style={{ 
              background: isOnline ? '#00FF87' : '#FF4D4D', 
              boxShadow: `0 0 6px ${isOnline ? '#00FF87' : '#FF4D4D'}`, 
              animation: 'pulse-dot 1.5s infinite' 
            }} />
        </div>
        <div>
          <p className="font-orbitron text-xs font-bold tracking-wider" style={{ color: isOnline ? '#00D1FF' : '#FF4D4D' }}>AI ENGINE</p>
          <p className="text-xs font-mono-code" style={{ color: 'rgba(148,163,184,0.5)', fontSize: '9px' }}>
            {isOnline ? `SENTINEL ${aiData.model}` : 'SYSTEM OFFLINE'}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'INFERENCE', value: isOnline ? `${aiData.inference_time}ms` : '--', color: isOnline ? '#00FF87' : '#94A3B8' },
          { label: 'CONFIDENCE', value: isOnline ? `${aiData.confidence.toFixed(1)}%` : '--', color: isOnline ? '#00D1FF' : '#94A3B8' },
          { label: 'FPS', value: isOnline ? `${aiData.fps}` : '--', color: isOnline ? '#00D1FF' : '#94A3B8' },
          { label: 'HEALTH', value: isOnline ? 'ONLINE' : 'ERROR', color: isOnline ? '#8B5CF6' : '#FF4D4D' },
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
