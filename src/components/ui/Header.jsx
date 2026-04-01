import { useFlightStore } from '../../store/flightStore';

const SOURCE_CFG = {
  'vatsim':     { color: '#00FF88', label: 'LIVE · VATSIM',   dot: true  },
  'opensky':    { color: '#FFE500', label: 'LIVE · OPENSKY',   dot: true  },
  'mock':       { color: '#80CFFF', label: 'SIMULATED DATA',   dot: false },
  'connecting': { color: '#80CFFF', label: 'CONNECTING…',      dot: true  },
};

export function Header() {
  const lastFetchAt = useFlightStore(s => s.lastFetchAt);
  const isLoading   = useFlightStore(s => s.isLoading);
  const dataSource  = useFlightStore(s => s.dataSource) ?? 'connecting';
  const key = isLoading ? 'connecting' : dataSource;
  const cfg = SOURCE_CFG[key] ?? SOURCE_CFG['connecting'];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-3 neo-panel border-t-0 border-l-0 border-r-0 border-b-2">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold tracking-[0.22em]">FLIGHTWATCH</span>
          <span className="text-base font-bold" style={{ color: 'var(--accent)' }}>3D</span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 pl-4" style={{ borderLeft: '1px solid var(--border-dim)' }}>
          <span className="text-[9px] tracking-widest" style={{ color: 'var(--text-faint)' }}>
            {dataSource === 'vatsim' ? 'VATSIM NETWORK' :
             dataSource === 'opensky' ? 'OPENSKY NETWORK' :
             dataSource === 'mock' ? 'SIMULATED · NO LIVE SOURCE' : '…'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {lastFetchAt && (
          <span className="hidden sm:block text-[10px] tracking-wider tabular-nums" style={{ color: 'var(--text-faint)' }}>
            {new Date(lastFetchAt).toLocaleTimeString()}
          </span>
        )}
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-block w-1.5 h-1.5 rounded-full ${cfg.dot ? 'animate-pulse-slow' : 'opacity-40'}`}
            style={{ background: cfg.color }}
          />
          <span className="text-[10px] font-bold tracking-[0.18em]" style={{ color: cfg.color }}>
            {cfg.label}
          </span>
        </div>
      </div>
    </header>
  );
}