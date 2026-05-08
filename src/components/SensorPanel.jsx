import { useState, useEffect, useMemo } from 'react';
import { Thermometer, Wind, Zap, Droplets, Loader2, WifiOff } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

const SENSOR_ICONS = {
  temperature: Thermometer,
  smoke: Wind,
  gas: Zap,
  humidity: Droplets,
};

const SENSOR_ORDER = ['temperature', 'smoke', 'gas', 'humidity'];

// Dynamic colors based on threshold status from server
const STATUS_THEME = {
  safe:     { color: '#00FF87', label: 'SAFE',     glow: 'rgba(0,255,135,0.35)', bg: 'rgba(0,255,135,0.06)', border: 'rgba(0,255,135,0.2)' },
  warning:  { color: '#FF8A00', label: 'WARNING',  glow: 'rgba(255,138,0,0.35)', bg: 'rgba(255,138,0,0.08)', border: 'rgba(255,138,0,0.25)' },
  critical: { color: '#FF4D4D', label: 'CRITICAL', glow: 'rgba(255,77,77,0.35)', bg: 'rgba(255,77,77,0.10)', border: 'rgba(255,77,77,0.30)' },
};

// ─────────────────────────────────────────────────────────────
// Circular SVG gauge with animated fill
// ─────────────────────────────────────────────────────────────
function CircularGauge({ value, max, color, glow, size = 90 }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const dashOffset = circumference - (pct / 100) * circumference;

  return (
    <svg width={size} height={size} className="circular-progress-svg"
      style={{ filter: `drop-shadow(0 0 8px ${glow})` }}>
      <circle className="track" cx={size / 2} cy={size / 2} r={radius} />
      {/* Threshold zone markers */}
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={color} strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.5s ease' }}
      />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Trend sparkline from server history array
// ─────────────────────────────────────────────────────────────
function TrendSparkline({ history, color, thresholds, invertThresholds }) {
  const w = 140, h = 32;
  const pts = history || [];
  if (pts.length < 2) return null;

  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const range = max - min || 1;
  const step = w / (pts.length - 1);

  const norm = pts.map(p => h - 3 - ((p - min) / range) * (h - 6));
  const pathD = norm.map((y, i) => `${i === 0 ? 'M' : 'L'} ${(i * step).toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const areaD = `${pathD} L ${((pts.length - 1) * step).toFixed(1)} ${h} L 0 ${h} Z`;

  // Threshold lines
  const warnY = h - 3 - (((invertThresholds ? thresholds.warning : thresholds.warning) - min) / range) * (h - 6);
  const critY = h - 3 - (((invertThresholds ? thresholds.critical : thresholds.critical) - min) / range) * (h - 6);

  const gradId = `trend-${color.replace('#', '')}`;

  return (
    <svg width={w} height={h} className="mt-2 w-full" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {/* Threshold lines */}
      {!isNaN(warnY) && warnY >= 0 && warnY <= h && (
        <line x1="0" y1={warnY} x2={w} y2={warnY} stroke="#FF8A00" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.5" />
      )}
      {!isNaN(critY) && critY >= 0 && critY <= h && (
        <line x1="0" y1={critY} x2={w} y2={critY} stroke="#FF4D4D" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.5" />
      )}
      <path d={areaD} fill={`url(#${gradId})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Current value dot */}
      <circle cx={(pts.length - 1) * step} cy={norm[norm.length - 1]} r="2.5" fill={color}
        style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Loading skeleton for a sensor card
// ─────────────────────────────────────────────────────────────
function SensorSkeleton() {
  return (
    <div className="glass-card p-4 flex flex-col gap-3 animate-pulse"
      style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)' }}>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="flex-1">
          <div className="h-3 rounded w-20 mb-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div className="h-2 rounded w-14" style={{ background: 'rgba(255,255,255,0.04)' }} />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
        <div className="flex-1">
          <div className="h-6 rounded w-16 mb-2" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div className="h-2 rounded w-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
          <div className="h-5 rounded w-full mt-2" style={{ background: 'rgba(255,255,255,0.03)' }} />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Individual sensor card — driven by socket data
// ─────────────────────────────────────────────────────────────
function SensorCard({ sensorKey, data }) {
  const [flashing, setFlashing] = useState(false);
  const [prevValue, setPrevValue] = useState(null);

  const Icon = SENSOR_ICONS[sensorKey];
  const theme = STATUS_THEME[data.status] || STATUS_THEME.safe;
  const pct = Math.round(Math.min(100, Math.max(0, (data.value / data.max) * 100)));

  // Flash animation when value changes
  useEffect(() => {
    if (prevValue !== null && prevValue !== data.value) {
      setFlashing(true);
      const timer = setTimeout(() => setFlashing(false), 600);
      return () => clearTimeout(timer);
    }
    setPrevValue(data.value);
  }, [data.value]); // eslint-disable-line react-hooks/exhaustive-deps

  // Direction arrow
  const trend = useMemo(() => {
    if (!data.history || data.history.length < 3) return null;
    const recent = data.history.slice(-5);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const diff = data.value - avg;
    if (Math.abs(diff) < 0.5) return { symbol: '→', color: 'rgba(148,163,184,0.5)' };
    return diff > 0
      ? { symbol: '↑', color: data.invertThresholds ? '#00FF87' : '#FF4D4D' }
      : { symbol: '↓', color: data.invertThresholds ? '#FF4D4D' : '#00FF87' };
  }, [data.value, data.history, data.invertThresholds]);

  const displayValue = typeof data.value === 'number' && data.value % 1 === 0
    ? data.value.toLocaleString()
    : data.value;

  return (
    <div className="glass-card p-4 flex flex-col gap-3 relative overflow-hidden"
      style={{
        border: `1px solid ${theme.border}`,
        background: theme.bg,
        transition: 'border-color 0.5s ease, background 0.5s ease',
      }}>

      {/* Critical pulse ring */}
      {data.status === 'critical' && (
        <div className="absolute inset-0 rounded-xl pointer-events-none"
          style={{ boxShadow: `0 0 25px ${theme.glow}`, animation: 'blink-alert 1.8s ease-in-out infinite' }} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: `${theme.color}18`,
              border: `1px solid ${theme.color}50`,
              transition: 'all 0.5s ease',
            }}>
            <Icon size={16} color={theme.color} />
          </div>
          <div>
            <p className="font-orbitron text-xs font-semibold tracking-wider"
              style={{ color: theme.color, transition: 'color 0.5s ease' }}>
              {data.label.toUpperCase()}
            </p>
            <p className="text-xs font-mono-code" style={{ color: 'rgba(148,163,184,0.5)', fontSize: '9px' }}>
              {data.zone}
            </p>
          </div>
        </div>
        <span className="text-xs font-orbitron px-2 py-0.5 rounded flex items-center gap-1"
          style={{
            background: `${theme.color}18`,
            color: theme.color,
            border: `1px solid ${theme.color}50`,
            fontSize: '9px',
            letterSpacing: '0.1em',
            transition: 'all 0.5s ease',
          }}>
          {data.status === 'critical' && (
            <span className="w-1.5 h-1.5 rounded-full inline-block"
              style={{ background: theme.color, animation: 'pulse-dot 1s infinite', boxShadow: `0 0 4px ${theme.color}` }} />
          )}
          {theme.label}
        </span>
      </div>

      {/* Circular Gauge + Value */}
      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <CircularGauge value={data.value} max={data.max} color={theme.color} glow={theme.glow} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`font-orbitron text-sm font-bold leading-none ${flashing ? 'value-flash' : ''}`}
              style={{ color: theme.color, transition: 'color 0.5s ease' }}>
              {pct}%
            </span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1">
            <span className={`font-orbitron text-2xl font-bold leading-none ${flashing ? 'value-flash' : ''}`}
              style={{ color: theme.color, textShadow: `0 0 14px ${theme.glow}`, transition: 'color 0.5s ease' }}>
              {displayValue}
            </span>
            <span className="text-sm" style={{ color: `${theme.color}88` }}>{data.unit}</span>
            {trend && (
              <span className="text-xs font-bold ml-1" style={{ color: trend.color }}>{trend.symbol}</span>
            )}
          </div>
          <p className="text-xs mt-1 font-mono-code" style={{ color: 'rgba(148,163,184,0.5)' }}>
            MAX: {data.max}{data.unit}
          </p>
          {/* Threshold bar */}
          <div className="mt-2 h-1.5 rounded-full relative" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full" style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${theme.color}66, ${theme.color})`,
              boxShadow: `0 0 8px ${theme.glow}`,
              transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1), background 0.5s ease',
            }} />
          </div>
          {/* Trend sparkline from server history */}
          <TrendSparkline
            history={data.history}
            color={theme.color}
            thresholds={data.thresholds}
            invertThresholds={data.invertThresholds}
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Exported SensorPanel — uses SocketContext
// ─────────────────────────────────────────────────────────────
export default function SensorPanel() {
  const { sensorData, isLoading, connectionStatus, latency } = useSocket();

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto" style={{ minHeight: 0 }}>
      {/* Header */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(0,209,255,0.5), transparent)' }} />
        <span className="font-orbitron text-xs tracking-widest" style={{ color: 'rgba(0,209,255,0.6)' }}>
          LIVE SENSORS
        </span>
        <div className="flex-1 h-px" style={{ background: 'linear-gradient(270deg, rgba(0,209,255,0.5), transparent)' }} />
      </div>

      {/* Connection status mini-bar */}
      <div className="flex items-center justify-between px-1 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{
            background: connectionStatus === 'connected' ? '#00FF87'
              : connectionStatus === 'connecting' ? '#FFD700'
              : '#FF4D4D',
            boxShadow: connectionStatus === 'connected' ? '0 0 6px #00FF87' : 'none',
            animation: connectionStatus === 'connecting' ? 'pulse-dot 1s infinite' : 'none',
          }} />
          <span className="font-mono-code" style={{
            fontSize: '9px',
            color: connectionStatus === 'connected' ? 'rgba(0,255,135,0.7)'
              : connectionStatus === 'connecting' ? 'rgba(255,215,0,0.7)'
              : 'rgba(255,77,77,0.7)',
            letterSpacing: '0.1em',
          }}>
            {connectionStatus === 'connected' ? 'SOCKET LIVE' : connectionStatus === 'connecting' ? 'CONNECTING...' : 'DISCONNECTED'}
          </span>
        </div>
        {latency !== null && connectionStatus === 'connected' && (
          <span className="font-mono-code" style={{ fontSize: '9px', color: 'rgba(0,209,255,0.5)', letterSpacing: '0.1em' }}>
            {latency}ms
          </span>
        )}
      </div>

      {/* Sensor Cards */}
      {isLoading || !sensorData ? (
        // Loading skeletons
        SENSOR_ORDER.map(key => <SensorSkeleton key={key} />)
      ) : connectionStatus === 'disconnected' || connectionStatus === 'error' ? (
        // Disconnected state — show last data with overlay
        <>
          {SENSOR_ORDER.map(key => {
            const data = sensorData[key];
            return data ? (
              <div key={key} className="relative">
                <SensorCard sensorKey={key} data={data} />
                <div className="absolute inset-0 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(11,18,32,0.7)', backdropFilter: 'blur(2px)' }}>
                  <div className="flex items-center gap-2">
                    <WifiOff size={14} color="#FF4D4D" />
                    <span className="font-orbitron text-xs" style={{ color: '#FF4D4D', letterSpacing: '0.1em' }}>OFFLINE</span>
                  </div>
                </div>
              </div>
            ) : <SensorSkeleton key={key} />;
          })}
        </>
      ) : (
        // Live data
        SENSOR_ORDER.map(key => {
          const data = sensorData[key];
          return data ? (
            <SensorCard key={key} sensorKey={key} data={data} />
          ) : <SensorSkeleton key={key} />;
        })
      )}
    </div>
  );
}
