import { useState, useEffect } from 'react';
import { MOCK_CAMERA_ZONES, MOCK_AI_DETECTIONS } from '../data/mockData';
import { Eye, Maximize2, Radio, Cpu } from 'lucide-react';
import MJPEGStream from './MJPEGStream';

// Read stream URL from env
const ESP32_STREAM_URL   = import.meta.env.VITE_ESP32_STREAM_URL   || null;
const ESP32_SNAPSHOT_URL = import.meta.env.VITE_ESP32_SNAPSHOT_URL || null;

export default function CameraPanel() {
  const [activeZone, setActiveZone] = useState(0);
  const [confidence, setConfidence] = useState(97.3);
  const [severity, setSeverity] = useState(87);
  const [frame, setFrame] = useState(0);
  const [useESP32, setUseESP32] = useState(!!ESP32_STREAM_URL);

  useEffect(() => {
    const id = setInterval(() => {
      setConfidence(prev => Math.round(Math.min(99.9, Math.max(50, prev + (Math.random() * 2 - 1) * 0.8)) * 10) / 10);
      setSeverity(prev => Math.min(100, Math.max(70, prev + Math.floor(Math.random() * 5 - 2))));
      setFrame(prev => prev + 1);
    }, 2500);
    return () => clearInterval(id);
  }, []);

  const zone = MOCK_CAMERA_ZONES[activeZone];
  const severityColor = severity >= 80 ? '#FF4D4D' : severity >= 60 ? '#FF8A00' : '#FFD700';
  const severityLabel = severity >= 80 ? 'CRITICAL' : severity >= 60 ? 'HIGH' : 'MEDIUM';

  return (
    <div className="glass-card glow-red h-full flex flex-col p-3 gap-3" style={{ minHeight: 0 }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Eye size={14} color="#FF4D4D" />
          <span className="font-orbitron text-xs font-semibold tracking-widest" style={{ color: '#FF4D4D' }}>
            LIVE FEED — {zone.id}
          </span>
          <span className="px-2 py-0.5 rounded text-xs font-orbitron"
            style={{ background: 'rgba(255,77,77,0.15)', color: '#FF4D4D', border: '1px solid rgba(255,77,77,0.35)', letterSpacing: '0.1em' }}>
            ● REC
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Source toggle: ESP32 vs Simulation */}
          <button
            onClick={() => setUseESP32(v => !v)}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-orbitron"
            title={useESP32 ? 'Switch to simulated feed' : 'Switch to ESP32-CAM feed'}
            style={{
              background: useESP32 ? 'rgba(0,209,255,0.12)' : 'rgba(139,92,246,0.12)',
              border: `1px solid ${useESP32 ? 'rgba(0,209,255,0.35)' : 'rgba(139,92,246,0.35)'}`,
              color: useESP32 ? '#00D1FF' : '#8B5CF6',
              cursor: 'pointer',
              letterSpacing: '0.08em',
            }}>
            {useESP32 ? <><Radio size={10} /> ESP32</> : <><Cpu size={10} /> SIM</>}
          </button>
          <span className="text-xs font-mono-code" style={{ color: 'rgba(148,163,184,0.5)' }}>
            FRAME #{String(frame * 47 + 10284).padStart(6, '0')}
          </span>
        </div>
      </div>

      {/* ── Main Feed ── */}
      <div className="flex-1 relative" style={{ minHeight: 0 }}>
        {useESP32 ? (
          /* ── ESP32-CAM MJPEG Stream ── */
          <MJPEGStream
            streamUrl={ESP32_STREAM_URL}
            snapshotUrl={ESP32_SNAPSHOT_URL}
            zone={zone.label}
            label={zone.id}
            aiDetections={MOCK_AI_DETECTIONS}
            className="w-full h-full"
            style={{ minHeight: 0 }}
          />
        ) : (
          /* ── Simulated Fire Feed (fallback) ── */
          <SimulatedFeed
            severity={severity}
            severityLabel={severityLabel}
            severityColor={severityColor}
            zone={zone}
            frame={frame}
          />
        )}
      </div>

      {/* ── Confidence + Severity Row ── */}
      <div className="flex gap-3 flex-shrink-0">
        <div className="flex-1 rounded-lg p-2.5" style={{ background: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.2)' }}>
          <p className="text-xs font-orbitron tracking-wider mb-1.5" style={{ color: 'rgba(255,77,77,0.7)' }}>AI FIRE CONFIDENCE</p>
          <div className="flex items-baseline gap-1">
            <span className="font-orbitron text-2xl font-bold text-glow-red" style={{ color: '#FF4D4D' }}>{confidence.toFixed(1)}</span>
            <span className="text-sm" style={{ color: 'rgba(255,77,77,0.6)' }}>%</span>
          </div>
          <div className="mt-2 severity-bar">
            <div className="severity-fill" style={{
              width: `${confidence}%`,
              background: 'linear-gradient(90deg, #FF8A00, #FF4D4D)',
              boxShadow: '0 0 8px rgba(255,77,77,0.5)',
              transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
            }} />
          </div>
        </div>

        <div className="flex-1 rounded-lg p-2.5"
          style={{ background: `rgba(${severity >= 80 ? '255,77,77' : '255,138,0'},0.08)`, border: `1px solid rgba(${severity >= 80 ? '255,77,77' : '255,138,0'},0.2)` }}>
          <p className="text-xs font-orbitron tracking-wider mb-1.5" style={{ color: severityColor + 'BB' }}>SEVERITY LEVEL</p>
          <div className="flex items-baseline gap-1">
            <span className="font-orbitron text-2xl font-bold" style={{ color: severityColor, textShadow: `0 0 12px ${severityColor}80` }}>{severity}</span>
            <span className="text-sm" style={{ color: severityColor + '80' }}>/100</span>
          </div>
          <div className="mt-2 severity-bar">
            <div className="severity-fill" style={{
              width: `${severity}%`,
              background: `linear-gradient(90deg, ${severityColor}88, ${severityColor})`,
              boxShadow: `0 0 8px ${severityColor}50`,
              transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
            }} />
          </div>
        </div>
      </div>

      {/* ── Zone Selector ── */}
      <div className="flex gap-2 flex-shrink-0">
        {MOCK_CAMERA_ZONES.map((z, i) => (
          <button key={i} onClick={() => setActiveZone(i)}
            className="flex-1 py-1.5 rounded text-xs font-orbitron transition-all duration-300"
            style={{
              background: i === activeZone ? 'rgba(0,209,255,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${i === activeZone ? 'rgba(0,209,255,0.5)' : 'rgba(255,255,255,0.08)'}`,
              color: i === activeZone ? '#00D1FF' : 'rgba(148,163,184,0.5)',
              letterSpacing: '0.06em',
            }}>
            {z.id}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Simulated fire feed (used when ESP32 is not available)
// ─────────────────────────────────────────────────────────────
function SimulatedFeed({ severity, severityLabel, severityColor, zone }) {
  return (
    <div className="camera-feed rounded-lg w-full h-full relative" style={{ border: '1px solid rgba(255,77,77,0.25)' }}>
      <FireBackground severity={severity} />
      <div className="scanline-overlay" />

      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,77,77,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,77,77,0.1) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }} />

      {/* AI Detection Boxes */}
      {MOCK_AI_DETECTIONS.map((det, i) => (
        <div key={i} className="detection-box" style={{ left: det.x, top: det.y, width: det.w, height: det.h }}>
          <div className="detection-label">{det.label} {det.confidence}%</div>
          <span className="absolute" style={{ top: -2, left: -2, width: 10, height: 10, borderTop: '2px solid #FF4D4D', borderLeft: '2px solid #FF4D4D' }} />
          <span className="absolute" style={{ top: -2, right: -2, width: 10, height: 10, borderTop: '2px solid #FF4D4D', borderRight: '2px solid #FF4D4D' }} />
          <span className="absolute" style={{ bottom: -2, left: -2, width: 10, height: 10, borderBottom: '2px solid #FF4D4D', borderLeft: '2px solid #FF4D4D' }} />
          <span className="absolute" style={{ bottom: -2, right: -2, width: 10, height: 10, borderBottom: '2px solid #FF4D4D', borderRight: '2px solid #FF4D4D' }} />
        </div>
      ))}

      {/* Corner brackets */}
      <div className="corner-bracket tl" />
      <div className="corner-bracket tr" />
      <div className="corner-bracket bl" />
      <div className="corner-bracket br" />

      {/* SIM badge */}
      <div className="absolute top-3 left-3 px-2 py-0.5 rounded"
        style={{ background: 'rgba(139,92,246,0.85)', backdropFilter: 'blur(4px)' }}>
        <span className="font-orbitron text-white" style={{ fontSize: '9px', letterSpacing: '0.12em' }}>SIMULATED FEED</span>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
        <div className="px-2 py-1 rounded" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', border: '1px solid rgba(0,209,255,0.2)' }}>
          <p className="font-orbitron text-xs" style={{ color: '#00D1FF', letterSpacing: '0.12em' }}>{zone.label}</p>
          <p className="text-xs font-mono-code" style={{ color: 'rgba(148,163,184,0.6)' }}>THERMAL MODE · 30fps · 4K</p>
        </div>
        <div className="px-2 py-1 rounded" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', border: `1px solid ${severityColor}50` }}>
          <p className="text-xs font-mono-code" style={{ color: severityColor }}>SEVERITY: {severityLabel}</p>
        </div>
      </div>
    </div>
  );
}

function FireBackground({ severity }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{
        background: `radial-gradient(ellipse at 35% 65%, rgba(255,${140 - severity},0,${0.15 + severity / 400}) 0%, transparent 60%),
                     radial-gradient(ellipse at 60% 55%, rgba(255,${60 - severity / 5},0,${0.1 + severity / 500}) 0%, transparent 50%),
                     linear-gradient(180deg, rgba(20,8,0,0.9) 0%, rgba(40,15,0,0.7) 50%, rgba(60,20,0,0.85) 100%)`,
      }} />
      <div className="absolute inset-0" style={{
        background: `repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,100,0,0.03) 40px, rgba(255,100,0,0.03) 42px)`,
        animation: 'scanline 6s linear infinite',
      }} />
      {[
        { x: '30%', y: '60%', size: '80px', color: 'rgba(255,100,0,0.25)' },
        { x: '55%', y: '55%', size: '60px', color: 'rgba(255,60,0,0.15)' },
      ].map((spot, i) => (
        <div key={i} className="absolute rounded-full" style={{
          left: spot.x, top: spot.y,
          width: spot.size, height: spot.size,
          background: spot.color,
          filter: 'blur(20px)',
          transform: 'translate(-50%, -50%)',
          animation: `pulse-dot ${1.5 + i * 0.5}s ease-in-out infinite`,
        }} />
      ))}
    </div>
  );
}
