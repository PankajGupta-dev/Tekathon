import { useState, useEffect } from 'react';
import { MOCK_CAMERA_ZONES, MOCK_AI_DETECTIONS } from '../data/mockData';
import { Eye, ZapOff, Maximize2, Video } from 'lucide-react';

export default function CameraPanel() {
  const [activeZone, setActiveZone] = useState(0);
  const [confidence, setConfidence] = useState(97.3);
  const [severity, setSeverity] = useState(87);
  const [frame, setFrame] = useState(0);

  // Simulate confidence fluctuation
  useEffect(() => {
    const id = setInterval(() => {
      setConfidence(prev => {
        const next = prev + (Math.random() * 2 - 1) * 0.8;
        return Math.round(Math.min(99.9, Math.max(50, next)) * 10) / 10;
      });
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
      {/* Header */}
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
          <span className="text-xs font-mono-code" style={{ color: 'rgba(148,163,184,0.5)' }}>
            FRAME #{String(frame * 47 + 10284).padStart(6, '0')}
          </span>
          <Maximize2 size={12} color="rgba(148,163,184,0.4)" />
        </div>
      </div>

      {/* Camera Feed */}
      <div className="camera-feed rounded-lg flex-1 relative" style={{ minHeight: 0, border: '1px solid rgba(255,77,77,0.25)' }}>
        {/* Fire simulation background */}
        <FireBackground severity={severity} />

        {/* Scanline overlay */}
        <div className="scanline-overlay" />

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,77,77,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,77,77,0.1) 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }} />

        {/* AI Detection Boxes */}
        {MOCK_AI_DETECTIONS.map((det, i) => (
          <div key={i} className="detection-box" style={{ left: det.x, top: det.y, width: det.w, height: det.h }}>
            <div className="detection-label">{det.label} {det.confidence}%</div>
            {/* Corner brackets */}
            <span className="absolute" style={{ top: -2, left: -2, width: 10, height: 10, borderTop: '2px solid #FF4D4D', borderLeft: '2px solid #FF4D4D' }} />
            <span className="absolute" style={{ top: -2, right: -2, width: 10, height: 10, borderTop: '2px solid #FF4D4D', borderRight: '2px solid #FF4D4D' }} />
            <span className="absolute" style={{ bottom: -2, left: -2, width: 10, height: 10, borderBottom: '2px solid #FF4D4D', borderLeft: '2px solid #FF4D4D' }} />
            <span className="absolute" style={{ bottom: -2, right: -2, width: 10, height: 10, borderBottom: '2px solid #FF4D4D', borderRight: '2px solid #FF4D4D' }} />
          </div>
        ))}

        {/* Corner brackets on main feed */}
        <div className="corner-bracket tl" />
        <div className="corner-bracket tr" />
        <div className="corner-bracket bl" />
        <div className="corner-bracket br" />

        {/* Camera info overlay */}
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

      {/* Confidence + Severity Row */}
      <div className="flex gap-3 flex-shrink-0">
        {/* AI Confidence */}
        <div className="flex-1 rounded-lg p-2.5" style={{ background: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.2)' }}>
          <p className="text-xs font-orbitron tracking-wider mb-1.5" style={{ color: 'rgba(255,77,77,0.7)' }}>AI FIRE CONFIDENCE</p>
          <div className="flex items-baseline gap-1">
            <span className="font-orbitron text-2xl font-bold text-glow-red" style={{ color: '#FF4D4D' }}>{confidence.toFixed(1)}</span>
            <span className="text-sm" style={{ color: 'rgba(255,77,77,0.6)' }}>%</span>
          </div>
          <ConfidenceBar value={parseFloat(confidence)} />
        </div>

        {/* Severity Meter */}
        <div className="flex-1 rounded-lg p-2.5" style={{ background: `rgba(${severity >= 80 ? '255,77,77' : '255,138,0'},0.08)`, border: `1px solid rgba(${severity >= 80 ? '255,77,77' : '255,138,0'},0.2)` }}>
          <p className="text-xs font-orbitron tracking-wider mb-1.5" style={{ color: severityColor + 'BB' }}>SEVERITY LEVEL</p>
          <div className="flex items-baseline gap-1">
            <span className="font-orbitron text-2xl font-bold" style={{ color: severityColor, textShadow: `0 0 12px ${severityColor}80` }}>{severity}</span>
            <span className="text-sm" style={{ color: severityColor + '80' }}>/100</span>
          </div>
          <SeverityBar value={severity} color={severityColor} />
        </div>
      </div>

      {/* Zone Selector */}
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

function ConfidenceBar({ value }) {
  return (
    <div className="mt-2 severity-bar">
      <div className="severity-fill" style={{
        width: `${value}%`,
        background: `linear-gradient(90deg, #FF8A00, #FF4D4D)`,
        boxShadow: '0 0 8px rgba(255,77,77,0.5)',
        transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
      }} />
    </div>
  );
}

function SeverityBar({ value, color }) {
  return (
    <div className="mt-2 severity-bar">
      <div className="severity-fill" style={{
        width: `${value}%`,
        background: `linear-gradient(90deg, ${color}88, ${color})`,
        boxShadow: `0 0 8px ${color}50`,
        transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
      }} />
    </div>
  );
}

function FireBackground({ severity }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Smoke/fire gradient base */}
      <div className="absolute inset-0" style={{
        background: `radial-gradient(ellipse at 35% 65%, rgba(255,${140 - severity},0,${0.15 + severity / 400}) 0%, transparent 60%),
                     radial-gradient(ellipse at 60% 55%, rgba(255,${60 - severity/5},0,${0.1 + severity / 500}) 0%, transparent 50%),
                     linear-gradient(180deg, rgba(20,8,0,0.9) 0%, rgba(40,15,0,0.7) 50%, rgba(60,20,0,0.85) 100%)`,
      }} />
      {/* Thermal heat waves */}
      <div className="absolute inset-0" style={{
        background: `repeating-linear-gradient(
          0deg,
          transparent,
          transparent 40px,
          rgba(255,100,0,0.03) 40px,
          rgba(255,100,0,0.03) 42px
        )`,
        animation: 'scanline 6s linear infinite',
      }} />
      {/* Fire glow spots */}
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
