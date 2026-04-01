const CONTROLS = [
  { key: 'DRAG',   desc: 'Rotate globe'    },
  { key: 'SCROLL', desc: 'Zoom'            },
  { key: 'CLICK',  desc: 'Select aircraft' },
  { key: 'ESC',    desc: 'Deselect'        },
  { key: 'F',      desc: 'Follow selected' },
  { key: 'R',      desc: 'Reset camera'    },
];

export function ControlsHint() {
  return (
    <div className="fixed right-4 bottom-4 z-40">
      <div className="neo-panel p-3">
        <div className="label mb-2">CONTROLS</div>
        <ul className="space-y-1.5">
          {CONTROLS.map(({ key, desc }) => (
            <li key={key} className="flex items-center gap-2.5">
              <span className="text-[9px] font-bold tracking-wider w-12" style={{ color: 'var(--accent)' }}>
                {key}
              </span>
              <span className="text-[9px]" style={{ color: 'var(--text-faint)' }}>{desc}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
