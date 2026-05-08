import { MOCK_BLOCKCHAIN_LOGS } from '../data/mockData';
import { useLiveBlockchain } from '../hooks/useRealtime';
import { Link, CheckCircle, Clock } from 'lucide-react';

export default function BlockchainLogs() {
  const logs = useLiveBlockchain(MOCK_BLOCKCHAIN_LOGS);

  return (
    <div className="glass-card p-4 flex flex-col h-full" style={{ minHeight: 0 }}>
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Link size={14} color="#8B5CF6" />
          <span className="font-orbitron text-xs font-semibold tracking-widest" style={{ color: '#8B5CF6' }}>BLOCKCHAIN LEDGER</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#00FF87', boxShadow: '0 0 6px #00FF87', animation: 'pulse-dot 1.5s infinite' }} />
          <span className="font-mono-code text-xs" style={{ color: 'rgba(0,255,135,0.7)', fontSize: '10px', letterSpacing: '0.1em' }}>CHAIN SYNC ACTIVE</span>
        </div>
      </div>

      {/* Chain header */}
      <div className="flex gap-2 text-xs font-mono-code mb-2 px-2 flex-shrink-0" style={{ color: 'rgba(139,92,246,0.5)', letterSpacing: '0.1em', fontSize: '9px' }}>
        <span className="w-24">BLOCK</span>
        <span className="flex-1">TX HASH</span>
        <span className="w-16 text-center">TIME</span>
        <span className="w-28">ACTION</span>
        <span className="w-16 text-right">STATUS</span>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-1" style={{ minHeight: 0 }}>
        {logs.map((log, i) => (
          <div key={`${log.hash}-${i}`} className="blockchain-entry flex gap-2 items-center"
            style={{ animationDelay: `${i * 0.05}s`, opacity: 1 - i * 0.12 }}>
            <span className="w-24 text-purple-400" style={{ fontSize: '10px' }}>{log.block}</span>
            <span className="flex-1 text-cyan-400" style={{ color: '#00D1FF99', fontSize: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {log.hash}
            </span>
            <span className="w-16 text-center" style={{ color: 'rgba(148,163,184,0.5)', fontSize: '10px' }}>{log.timestamp}</span>
            <span className="w-28" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {log.action}
            </span>
            <span className="w-16 text-right flex items-center justify-end gap-1">
              {log.status === 'VERIFIED'
                ? <><CheckCircle size={10} color="#00FF87" /><span style={{ color: '#00FF87', fontSize: '9px' }}>OK</span></>
                : <><Clock size={10} color="#FF8A00" /><span style={{ color: '#FF8A00', fontSize: '9px' }}>PEND</span></>
              }
            </span>
          </div>
        ))}
      </div>

      {/* Block count */}
      <div className="mt-2 pt-2 flex items-center justify-between flex-shrink-0"
        style={{ borderTop: '1px solid rgba(139,92,246,0.15)' }}>
        <span className="font-mono-code text-xs" style={{ color: 'rgba(139,92,246,0.5)', fontSize: '10px' }}>
          CHAIN HEIGHT: #48,291
        </span>
        <span className="font-mono-code text-xs" style={{ color: 'rgba(0,255,135,0.6)', fontSize: '10px' }}>
          INTEGRITY: 100%
        </span>
      </div>
    </div>
  );
}
