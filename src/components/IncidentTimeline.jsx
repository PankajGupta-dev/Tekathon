import { MOCK_TIMELINE } from '../data/mockData';

const TYPE_COLORS = {
  critical: { dot: '#FF4D4D', line: 'rgba(255,77,77,0.4)', bg: 'rgba(255,77,77,0.06)' },
  warning: { dot: '#FF8A00', line: 'rgba(255,138,0,0.4)', bg: 'rgba(255,138,0,0.06)' },
  alert: { dot: '#FFD700', line: 'rgba(255,215,0,0.4)', bg: 'rgba(255,215,0,0.06)' },
  info: { dot: '#00D1FF', line: 'rgba(0,209,255,0.4)', bg: 'rgba(0,209,255,0.06)' },
};

export default function IncidentTimeline() {
  return (
    <div className="glass-card p-4 flex flex-col gap-3 h-full" style={{ minHeight: 0 }}>
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400" style={{ boxShadow: '0 0 6px #00D1FF', animation: 'pulse-dot 2s infinite' }} />
          <span className="font-orbitron text-xs font-semibold tracking-widest" style={{ color: '#00D1FF' }}>INCIDENT TIMELINE</span>
        </div>
        <span className="font-mono-code text-xs px-2 py-0.5 rounded"
          style={{ color: 'rgba(148,163,184,0.5)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          LIVE
        </span>
      </div>

      <div className="overflow-y-auto flex-1" style={{ minHeight: 0 }}>
        <div className="flex flex-col" style={{ paddingLeft: '4px' }}>
          {MOCK_TIMELINE.map((item, i) => {
            const colors = TYPE_COLORS[item.type];
            return (
              <div key={i} className="flex gap-3 group" style={{ animation: `float-up 0.4s ease ${i * 0.05}s both` }}>
                {/* Dot + line */}
                <div className="flex flex-col items-center" style={{ width: '16px', flexShrink: 0 }}>
                  <div className="timeline-dot" style={{
                    background: colors.dot,
                    boxShadow: `0 0 6px ${colors.dot}`,
                    marginTop: '12px',
                    flexShrink: 0,
                  }} />
                  {i < MOCK_TIMELINE.length - 1 && (
                    <div style={{ width: '1px', flexGrow: 1, minHeight: '16px', background: `linear-gradient(to bottom, ${colors.line}, transparent)` }} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-3 rounded-lg px-3 py-2 mb-1 transition-all duration-200 group-hover:scale-[1.01]"
                  style={{ background: colors.bg, border: `1px solid ${colors.dot}20` }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">{item.icon}</span>
                    <span className="font-mono-code text-xs" style={{ color: 'rgba(148,163,184,0.5)', fontSize: '10px' }}>{item.time}</span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.8)' }}>{item.event}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
