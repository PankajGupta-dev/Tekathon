import { useState } from 'react';
import { MOCK_INCIDENTS, SEVERITY_COLORS, STATUS_COLORS } from '../data/mockData';
import { AlertTriangle } from 'lucide-react';

export default function AlertsTable() {
  const [selected, setSelected] = useState(0);

  return (
    <div className="glass-card p-4 flex flex-col h-full" style={{ minHeight: 0 }}>
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <AlertTriangle size={14} color="#FF4D4D" />
          <span className="font-orbitron text-xs font-semibold tracking-widest" style={{ color: '#FF4D4D' }}>RECENT ALERTS</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono-code text-xs px-2 py-0.5 rounded"
            style={{ color: '#FF4D4D', background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.3)', fontSize: '10px' }}>
            {MOCK_INCIDENTS.filter(i => i.status === 'ACTIVE').length} ACTIVE
          </span>
          <span className="font-mono-code text-xs" style={{ color: 'rgba(148,163,184,0.4)', fontSize: '10px' }}>
            TOTAL: {MOCK_INCIDENTS.length}
          </span>
        </div>
      </div>

      <div className="overflow-auto flex-1" style={{ minHeight: 0 }}>
        <table className="w-full alert-table" style={{ borderCollapse: 'collapse' }}>
          <thead className="sticky top-0" style={{ background: 'rgba(11,18,32,0.9)', backdropFilter: 'blur(8px)', zIndex: 1 }}>
            <tr>
              <th className="text-left">INC ID</th>
              <th className="text-left">TIME</th>
              <th className="text-left">LOCATION</th>
              <th className="text-left">TYPE</th>
              <th className="text-left">SEVERITY</th>
              <th className="text-right">CONFIDENCE</th>
              <th className="text-right">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_INCIDENTS.map((inc, i) => {
              const sev = SEVERITY_COLORS[inc.severity];
              const statusColor = STATUS_COLORS[inc.status];
              const isActive = inc.status === 'ACTIVE';
              return (
                <tr key={i}
                  onClick={() => setSelected(i)}
                  className="cursor-pointer"
                  style={{
                    background: selected === i
                      ? 'rgba(0,209,255,0.06)'
                      : isActive
                      ? 'rgba(255,77,77,0.03)'
                      : 'transparent',
                    animation: isActive ? 'blink-alert 3s ease-in-out infinite' : 'none',
                    borderLeft: selected === i ? '2px solid #00D1FF' : '2px solid transparent',
                    transition: 'background 0.2s',
                  }}>
                  <td>
                    <span className="font-orbitron" style={{ color: '#00D1FF', fontSize: '11px' }}>{inc.id}</span>
                  </td>
                  <td style={{ color: 'rgba(148,163,184,0.7)' }}>{inc.time}</td>
                  <td style={{ color: 'rgba(255,255,255,0.7)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {inc.location}
                  </td>
                  <td>
                    <span className="px-1.5 py-0.5 rounded text-xs"
                      style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      {inc.type}
                    </span>
                  </td>
                  <td>
                    <span className="px-2 py-0.5 rounded font-orbitron"
                      style={{ background: sev.bg, color: sev.text, border: `1px solid ${sev.border}`, fontSize: '10px', letterSpacing: '0.08em' }}>
                      {inc.severity}
                    </span>
                  </td>
                  <td className="text-right">
                    <span style={{ color: inc.confidence > 90 ? '#FF4D4D' : inc.confidence > 75 ? '#FF8A00' : '#FFD700' }}>
                      {inc.confidence}%
                    </span>
                  </td>
                  <td className="text-right">
                    <span className="px-2 py-0.5 rounded font-orbitron"
                      style={{ color: statusColor, background: `${statusColor}18`, border: `1px solid ${statusColor}40`, fontSize: '9px', letterSpacing: '0.08em' }}>
                      {inc.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
