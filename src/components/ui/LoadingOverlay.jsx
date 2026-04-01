import { useFlightStore } from '../../store/flightStore';

function ErrorToast() {
  return (
    <div className="fixed top-16 left-1/2 z-50 animate-fade-in"
         style={{ transform: 'translateX(-50%)' }}>
      <div className="neo-panel px-4 py-2 flex items-center gap-2"
           style={{ borderColor: '#FF4444', boxShadow: '3px 3px 0 #FF4444' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse-slow" />
        <span className="text-[10px] tracking-widest" style={{ color: '#FF4444' }}>
          NO LIVE SOURCE · USING SIMULATED DATA
        </span>
      </div>
    </div>
  );
}

export function LoadingOverlay() {
  const isLoading   = useFlightStore(s => s.isLoading);
  const fetchError  = useFlightStore(s => s.fetchError);
  const lastFetchAt = useFlightStore(s => s.lastFetchAt);

  if (fetchError && lastFetchAt) return <ErrorToast />;
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
         style={{ background: '#02020E' }}>
      <div className="neo-panel px-10 py-8 text-center space-y-6">
        <div>
          <div className="text-2xl font-bold tracking-[0.3em] mb-1">FLIGHTWATCH</div>
          <div className="text-2xl font-bold tracking-[0.3em]" style={{ color: 'var(--accent)' }}>
            3D TRACKER
          </div>
        </div>
        <hr className="neo-divider" />
        <div className="flex items-center justify-center gap-2.5">
          <span className="w-1.5 h-1.5 rounded-full animate-blink" style={{ background: 'var(--accent)' }} />
          <span className="text-[11px] tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
            CONNECTING TO VATSIM…
          </span>
        </div>
        <p className="text-[9px] tracking-wider" style={{ color: 'var(--text-faint)' }}>
          DATA: VATSIM NETWORK · LIVE PILOT POSITIONS
        </p>
      </div>
    </div>
  );
}