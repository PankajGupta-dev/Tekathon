import { useState, useEffect } from 'react';
import { Thermometer, Wind, Zap, Droplets } from 'lucide-react';
import { MOCK_SENSORS } from '../data/mockData';

const SENSOR_ICONS = {
  temperature: Thermometer,
  smoke: Wind,
  gas: Zap,
  humidity: Droplets,
};

const SENSOR_GRADIENTS = {
  temperature: { track: '#FF4D4D', glow: 'rgba(255,77,77,0.35)', bg: 'rgba(255,77,77,0.08)', border: 'rgba(255,77,77,0.25)' },
  smoke: { track: '#FF8A00', glow: 'rgba(255,138,0,0.35)', bg: 'rgba(255,138,0,0.08)', border: 'rgba(255,138,0,0.25)' },
  gas: { track: '#FFD700', glow: 'rgba(255,215,0,0.35)', bg: 'rgba(255,215,0,0.08)', border: 'rgba(255,215,0,0.25)' },
  humidity: { track: '#00D1FF', glow: 'rgba(0,209,255,0.35)', bg: 'rgba(0,209,255,0.08)', border: 'rgba(0,209,255,0.25)' },
};

const STATUS_MAP = {
  critical: { label: 'CRITICAL', color: '#FF4D4D' },
  warning: { label: 'WARNING', color: '#FF8A00' },
  low: { label: 'LOW', color: '#00D1FF' },
  normal: { label: 'NORMAL', color: '#00FF87' },
};

function CircularProgress({ value, max, color, glow, size = 90 }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(100, (value / max) * 100);
  const dashOffset = circumference - (pct / 100) * circumference;

  return (
    <svg width={size} height={size} className="circular-progress-svg" style={{ filter: `drop-shadow(0 0 6px ${glow})` }}>
      <circle className="track" cx={size / 2} cy={size / 2} r={radius} />
      <circle
        className="fill"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
      />
    </svg>
  );
}

function SensorCard({ sensorKey, data }) {
  const [liveValue, setLiveValue] = useState(data.value);
  const [flashing, setFlashing] = useState(false);
  const colors = SENSOR_GRADIENTS[sensorKey];
  const Icon = SENSOR_ICONS[sensorKey];
  const status = STATUS_MAP[data.status];

  useEffect(() => {
    const variance = sensorKey === 'temperature' ? 15 : sensorKey === 'humidity' ? 1.5 : 2;
    const id = setInterval(() => {
      setLiveValue(prev => {
        const next = Math.max(0, Math.min(data.max, prev + (Math.random() * 2 - 1) * variance));
        return sensorKey === 'temperature' ? Math.round(next) : parseFloat(next.toFixed(1));
      });
      setFlashing(true);
      setTimeout(() => setFlashing(false), 500);
    }, 2000 + Math.random() * 1500);
    return () => clearInterval(id);
  }, [sensorKey, data.max]);

  const pct = Math.round((liveValue / data.max) * 100);

  return (
    <div className="glass-card p-4 flex flex-col gap-3 relative overflow-hidden"
      style={{ border: `1px solid ${colors.border}`, background: colors.bg }}>

      {/* Pulse ring behind card */}
      {data.status === 'critical' && (
        <div className="absolute inset-0 rounded-xl pointer-events-none"
          style={{ boxShadow: `0 0 20px ${colors.glow}`, animation: 'blink-alert 2s ease-in-out infinite' }} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: `rgba(${colorToRgb(colors.track)}, 0.15)`, border: `1px solid rgba(${colorToRgb(colors.track)}, 0.35)` }}>
            <Icon size={16} color={colors.track} />
          </div>
          <div>
            <p className="font-orbitron text-xs font-semibold tracking-wider" style={{ color: colors.track }}>{data.label.toUpperCase()}</p>
            <p className="text-xs font-mono-code" style={{ color: 'rgba(148,163,184,0.5)', fontSize: '9px' }}>{data.zone}</p>
          </div>
        </div>
        <span className="text-xs font-orbitron px-2 py-0.5 rounded"
          style={{ background: `rgba(${colorToRgb(status.color)}, 0.15)`, color: status.color, border: `1px solid rgba(${colorToRgb(status.color)}, 0.35)`, fontSize: '9px', letterSpacing: '0.1em' }}>
          {status.label}
        </span>
      </div>

      {/* Circular Progress + Value */}
      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <CircularProgress value={liveValue} max={data.max} color={colors.track} glow={colors.glow} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`font-orbitron text-sm font-bold leading-none ${flashing ? 'value-flash' : ''}`}
              style={{ color: colors.track }}>
              {pct}%
            </span>
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-baseline gap-1">
            <span className={`font-orbitron text-2xl font-bold leading-none ${flashing ? 'value-flash' : ''}`}
              style={{ color: colors.track, textShadow: `0 0 12px ${colors.glow}` }}>
              {typeof liveValue === 'number' && liveValue % 1 === 0 ? liveValue.toLocaleString() : liveValue}
            </span>
            <span className="text-sm" style={{ color: `${colors.track}88` }}>{data.unit}</span>
          </div>
          <p className="text-xs mt-1 font-mono-code" style={{ color: 'rgba(148,163,184,0.5)' }}>
            MAX: {data.max}{data.unit}
          </p>
          {/* Mini bar */}
          <div className="mt-2 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full" style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${colors.track}66, ${colors.track})`,
              boxShadow: `0 0 6px ${colors.glow}`,
              transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }} />
          </div>
          {/* Sparkline */}
          <MiniSparkline color={colors.track} />
        </div>
      </div>
    </div>
  );
}

function MiniSparkline({ color }) {
  const [points, setPoints] = useState(() =>
    Array.from({ length: 20 }, (_, i) => 30 + Math.random() * 40)
  );

  useEffect(() => {
    const id = setInterval(() => {
      setPoints(prev => [...prev.slice(1), 30 + Math.random() * 40]);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  const w = 120, h = 28;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const norm = points.map(p => h - ((p - min) / (max - min + 1)) * (h - 4) - 2);
  const step = w / (points.length - 1);
  const pathD = norm.map((y, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${y}`).join(' ');
  const areaD = `${pathD} L ${(points.length - 1) * step} ${h} L 0 ${h} Z`;

  return (
    <svg width={w} height={h} className="mt-2 w-full" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#spark-${color.replace('#', '')})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function colorToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

export default function SensorPanel() {
  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto" style={{ minHeight: 0 }}>
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(0,209,255,0.5), transparent)' }} />
        <span className="font-orbitron text-xs tracking-widest" style={{ color: 'rgba(0,209,255,0.6)' }}>LIVE SENSORS</span>
        <div className="flex-1 h-px" style={{ background: 'linear-gradient(270deg, rgba(0,209,255,0.5), transparent)' }} />
      </div>
      {Object.entries(MOCK_SENSORS).map(([key, data]) => (
        <SensorCard key={key} sensorKey={key} data={data} />
      ))}
    </div>
  );
}
