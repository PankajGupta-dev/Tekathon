import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Maximize2, Minimize2, RefreshCw, WifiOff,
  Video, AlertCircle, CheckCircle2, Loader2, Camera
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Config from environment variables
// ─────────────────────────────────────────────────────────────
const DEFAULT_STREAM_URL     = import.meta.env.VITE_ESP32_STREAM_URL     || null;
const DEFAULT_SNAPSHOT_URL   = import.meta.env.VITE_ESP32_SNAPSHOT_URL   || null;
const RECONNECT_DELAY        = parseInt(import.meta.env.VITE_STREAM_RECONNECT_DELAY || '3000', 10);
const MAX_RETRIES            = parseInt(import.meta.env.VITE_STREAM_MAX_RETRIES     || '0', 10);

// ─────────────────────────────────────────────────────────────
// Stream status types
// ─────────────────────────────────────────────────────────────
const STATUS = {
  IDLE:          'idle',
  LOADING:       'loading',
  CONNECTED:     'connected',
  RECONNECTING:  'reconnecting',
  ERROR:         'error',
  NO_URL:        'no_url',
};

const STATUS_UI = {
  [STATUS.IDLE]:         { label: 'STANDBY',      color: '#94A3B8', icon: Video },
  [STATUS.LOADING]:      { label: 'CONNECTING',   color: '#FFD700', icon: Loader2 },
  [STATUS.CONNECTED]:    { label: 'LIVE',         color: '#00FF87', icon: CheckCircle2 },
  [STATUS.RECONNECTING]: { label: 'RECONNECTING', color: '#FF8A00', icon: RefreshCw },
  [STATUS.ERROR]:        { label: 'NO SIGNAL',    color: '#FF4D4D', icon: WifiOff },
  [STATUS.NO_URL]:       { label: 'NOT CONFIG',   color: '#8B5CF6', icon: AlertCircle },
};

// ─────────────────────────────────────────────────────────────
// Loading pulse animation overlay
// ─────────────────────────────────────────────────────────────
function StreamLoadingOverlay({ status, retryCount, maxRetries, onManualRetry }) {
  const ui = STATUS_UI[status];
  const Icon = ui.icon;
  const isSpinning = status === STATUS.LOADING || status === STATUS.RECONNECTING;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center"
      style={{ background: 'rgba(11,18,32,0.92)', backdropFilter: 'blur(4px)', zIndex: 20 }}>

      {/* Radar sweep behind icon */}
      <div className="relative mb-4">
        <div className="absolute inset-0 rounded-full"
          style={{
            border: `2px solid ${ui.color}30`,
            animation: status !== STATUS.CONNECTED ? 'pulse-ring 2s ease-out infinite' : 'none',
          }} />
        <div className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: `${ui.color}15`, border: `1px solid ${ui.color}40` }}>
          <Icon
            size={28}
            color={ui.color}
            style={{ animation: isSpinning ? 'radar-spin 1.5s linear infinite' : 'none' }}
          />
        </div>
      </div>

      <p className="font-orbitron text-sm font-bold tracking-widest mb-1"
        style={{ color: ui.color, textShadow: `0 0 10px ${ui.color}60` }}>
        {ui.label}
      </p>

      {status === STATUS.NO_URL && (
        <p className="text-xs font-mono-code text-center px-6 mt-1"
          style={{ color: 'rgba(148,163,184,0.6)', lineHeight: 1.6 }}>
          Set <span style={{ color: '#00D1FF' }}>VITE_ESP32_STREAM_URL</span><br/>
          in your <span style={{ color: '#FFD700' }}>.env</span> file
        </p>
      )}

      {status === STATUS.RECONNECTING && (
        <p className="text-xs font-mono-code mt-1"
          style={{ color: 'rgba(255,138,0,0.7)' }}>
          Attempt {retryCount}{maxRetries > 0 ? ` / ${maxRetries}` : ''} · Retrying in {Math.ceil(RECONNECT_DELAY / 1000)}s…
        </p>
      )}

      {(status === STATUS.ERROR) && (
        <>
          <p className="text-xs font-mono-code mt-1" style={{ color: 'rgba(255,77,77,0.6)' }}>
            Stream unavailable
          </p>
          <button onClick={onManualRetry}
            className="mt-3 flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-orbitron"
            style={{
              background: 'rgba(0,209,255,0.12)',
              border: '1px solid rgba(0,209,255,0.35)',
              color: '#00D1FF',
              cursor: 'pointer',
              letterSpacing: '0.1em',
            }}>
            <RefreshCw size={12} />
            RETRY
          </button>
        </>
      )}

      {status === STATUS.LOADING && (
        <div className="flex gap-1 mt-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full"
              style={{
                background: '#FFD700',
                animation: `pulse-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
              }} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// On-stream HUD overlays (shown when connected)
// ─────────────────────────────────────────────────────────────
function StreamHUD({ streamUrl, isFullscreen, onFullscreen, onSnapshot, fps, zone }) {
  return (
    <>
      {/* Scanline */}
      <div className="scanline-overlay" style={{ zIndex: 5 }} />

      {/* Surveillance grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(0,209,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(0,209,255,0.15) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          zIndex: 4,
          opacity: 0.12,
        }} />

      {/* Corner brackets */}
      <div className="corner-bracket tl" style={{ zIndex: 6 }} />
      <div className="corner-bracket tr" style={{ zIndex: 6 }} />
      <div className="corner-bracket bl" style={{ zIndex: 6 }} />
      <div className="corner-bracket br" style={{ zIndex: 6 }} />

      {/* Top-left: REC badge */}
      <div className="absolute top-3 left-3 flex items-center gap-2" style={{ zIndex: 10 }}>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded"
          style={{ background: 'rgba(255,77,77,0.85)', backdropFilter: 'blur(4px)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-white" style={{ animation: 'pulse-dot 1s infinite' }} />
          <span className="font-orbitron text-white" style={{ fontSize: '9px', letterSpacing: '0.12em' }}>REC</span>
        </div>
        <div className="px-2 py-1 rounded font-mono-code"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', color: '#00FF87', fontSize: '9px', letterSpacing: '0.1em' }}>
          ESP32-CAM · {fps}fps
        </div>
      </div>

      {/* Top-right: controls */}
      <div className="absolute top-3 right-3 flex items-center gap-2" style={{ zIndex: 10 }}>
        {onSnapshot && (
          <button onClick={onSnapshot}
            className="w-7 h-7 rounded flex items-center justify-center"
            title="Capture snapshot"
            style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(0,209,255,0.3)', backdropFilter: 'blur(4px)' }}>
            <Camera size={12} color="#00D1FF" />
          </button>
        )}
        <button onClick={onFullscreen}
          className="w-7 h-7 rounded flex items-center justify-center"
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(0,209,255,0.3)', backdropFilter: 'blur(4px)' }}>
          {isFullscreen
            ? <Minimize2 size={12} color="#00D1FF" />
            : <Maximize2 size={12} color="#00D1FF" />}
        </button>
      </div>

      {/* Bottom info bar */}
      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between" style={{ zIndex: 10 }}>
        <div className="px-2 py-1 rounded"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', border: '1px solid rgba(0,209,255,0.2)' }}>
          <p className="font-orbitron text-xs" style={{ color: '#00D1FF', letterSpacing: '0.12em' }}>{zone}</p>
          <p className="text-xs font-mono-code" style={{ color: 'rgba(148,163,184,0.6)' }}>
            MJPEG · LIVE · {new URL(streamUrl).hostname}
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', border: '1px solid rgba(0,255,135,0.25)' }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#00FF87', boxShadow: '0 0 6px #00FF87', animation: 'pulse-dot 2s infinite' }} />
          <span className="font-mono-code" style={{ color: '#00FF87', fontSize: '10px', letterSpacing: '0.1em' }}>CONNECTED</span>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Main reusable MJPEG stream component
// ─────────────────────────────────────────────────────────────
export default function MJPEGStream({
  streamUrl = DEFAULT_STREAM_URL,
  snapshotUrl = DEFAULT_SNAPSHOT_URL,
  zone = 'Zone A-3 | Floor 3',
  label = 'CAM-01',
  aiDetections = [],
  className = '',
  style = {},
}) {
  const [status, setStatus] = useState(streamUrl ? STATUS.LOADING : STATUS.NO_URL);
  const [retryCount, setRetryCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fps, setFps] = useState(0);
  const [frameCount, setFrameCount] = useState(0);

  const imgRef = useRef(null);
  const containerRef = useRef(null);
  const retryTimerRef = useRef(null);
  const fpsTimerRef = useRef(null);
  const frameCountRef = useRef(0);
  const srcKeyRef = useRef(0); // used to force img re-mount on reconnect

  // ── FPS tracking ──
  useEffect(() => {
    if (status !== STATUS.CONNECTED) return;
    fpsTimerRef.current = setInterval(() => {
      setFps(frameCountRef.current);
      frameCountRef.current = 0;
    }, 1000);
    return () => clearInterval(fpsTimerRef.current);
  }, [status]);

  // ── Build stream src with cache-bust on reconnect ──
  const buildSrc = useCallback(() => {
    if (!streamUrl) return null;
    // Append bust param so each retry forces a fresh connection
    return `${streamUrl}${streamUrl.includes('?') ? '&' : '?'}_t=${srcKeyRef.current}`;
  }, [streamUrl]);

  const [imgSrc, setImgSrc] = useState(() => buildSrc());

  // ── Retry logic ──
  const scheduleRetry = useCallback(() => {
    clearTimeout(retryTimerRef.current);
    setRetryCount(prev => {
      const next = prev + 1;
      if (MAX_RETRIES > 0 && next > MAX_RETRIES) {
        setStatus(STATUS.ERROR);
        return next;
      }
      setStatus(STATUS.RECONNECTING);
      retryTimerRef.current = setTimeout(() => {
        srcKeyRef.current++;
        setImgSrc(buildSrc());
        setStatus(STATUS.LOADING);
      }, RECONNECT_DELAY);
      return next;
    });
  }, [buildSrc]);

  const manualRetry = useCallback(() => {
    setRetryCount(0);
    setStatus(STATUS.LOADING);
    srcKeyRef.current++;
    setImgSrc(buildSrc());
  }, [buildSrc]);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      clearTimeout(retryTimerRef.current);
      clearInterval(fpsTimerRef.current);
    };
  }, []);

  // ── Stream connected / no-URL changes ──
  useEffect(() => {
    if (!streamUrl) {
      setStatus(STATUS.NO_URL);
      setImgSrc(null);
    } else {
      srcKeyRef.current++;
      setImgSrc(buildSrc());
      setStatus(STATUS.LOADING);
      setRetryCount(0);
    }
  }, [streamUrl, buildSrc]);

  // ── Fullscreen API ──
  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // ── Snapshot capture ──
  const takeSnapshot = useCallback(async () => {
    if (!snapshotUrl) return;
    try {
      const a = document.createElement('a');
      a.href = snapshotUrl;
      a.download = `sentinel-snapshot-${Date.now()}.jpg`;
      a.click();
    } catch {
      // fallback: open in new tab
      window.open(snapshotUrl, '_blank');
    }
  }, [snapshotUrl]);

  const showOverlay = status !== STATUS.CONNECTED;

  return (
    <div ref={containerRef}
      className={`camera-feed rounded-lg relative overflow-hidden ${className}`}
      style={{
        border: '1px solid rgba(255,77,77,0.25)',
        background: '#000',
        ...style,
        ...(isFullscreen ? { borderRadius: 0 } : {}),
      }}>

      {/* MJPEG stream — native browser MJPEG support via <img> */}
      {imgSrc && (
        <img
          ref={imgRef}
          src={imgSrc}
          alt="ESP32-CAM live feed"
          className="absolute inset-0 w-full h-full"
          style={{
            objectFit: 'cover',
            opacity: status === STATUS.CONNECTED ? 1 : 0.15,
            transition: 'opacity 0.4s ease',
          }}
          onLoad={() => {
            setStatus(STATUS.CONNECTED);
            setRetryCount(0);
            clearTimeout(retryTimerRef.current);
          }}
          onError={() => {
            if (status !== STATUS.RECONNECTING && status !== STATUS.ERROR) {
              scheduleRetry();
            }
          }}
          // Count rendered frames for FPS display
          onAnimationIteration={() => { frameCountRef.current++; }}
        />
      )}

      {/* AI Detection bounding boxes — only shown when connected */}
      {status === STATUS.CONNECTED && aiDetections.map((det, i) => (
        <div key={i} className="detection-box"
          style={{ left: det.x, top: det.y, width: det.w, height: det.h, zIndex: 8 }}>
          <div className="detection-label">{det.label} {det.confidence}%</div>
          <span className="absolute" style={{ top: -2, left: -2, width: 10, height: 10, borderTop: '2px solid #FF4D4D', borderLeft: '2px solid #FF4D4D' }} />
          <span className="absolute" style={{ top: -2, right: -2, width: 10, height: 10, borderTop: '2px solid #FF4D4D', borderRight: '2px solid #FF4D4D' }} />
          <span className="absolute" style={{ bottom: -2, left: -2, width: 10, height: 10, borderBottom: '2px solid #FF4D4D', borderLeft: '2px solid #FF4D4D' }} />
          <span className="absolute" style={{ bottom: -2, right: -2, width: 10, height: 10, borderBottom: '2px solid #FF4D4D', borderRight: '2px solid #FF4D4D' }} />
        </div>
      ))}

      {/* HUD — overlays when stream is active */}
      {status === STATUS.CONNECTED && (
        <StreamHUD
          streamUrl={streamUrl}
          isFullscreen={isFullscreen}
          onFullscreen={toggleFullscreen}
          onSnapshot={snapshotUrl ? takeSnapshot : null}
          fps={fps || '–'}
          zone={zone}
        />
      )}

      {/* Fullscreen button always visible */}
      {status !== STATUS.CONNECTED && (
        <button onClick={toggleFullscreen}
          className="absolute top-3 right-3 w-7 h-7 rounded flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', zIndex: 25, cursor: 'pointer' }}>
          {isFullscreen ? <Minimize2 size={12} color="#94A3B8" /> : <Maximize2 size={12} color="#94A3B8" />}
        </button>
      )}

      {/* Loading / error overlay */}
      {showOverlay && (
        <StreamLoadingOverlay
          status={status}
          retryCount={retryCount}
          maxRetries={MAX_RETRIES}
          onManualRetry={manualRetry}
        />
      )}
    </div>
  );
}
