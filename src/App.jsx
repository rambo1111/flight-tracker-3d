import { Scene }          from './components/canvas/Scene';
import { Header }         from './components/ui/Header';
import { StatsBar }       from './components/ui/StatsBar';
import { SearchFilter }   from './components/ui/SearchFilter';
import { InfoCard }       from './components/ui/InfoCard';
import { AltitudeLegend } from './components/ui/AltitudeLegend';
import { ControlsHint }   from './components/ui/ControlsHint';
import { LoadingOverlay } from './components/ui/LoadingOverlay';
import { useFlightData }  from './hooks/useFlightData';
import { useKeyboard }    from './hooks/useKeyboard';

export default function App() {
  useFlightData();
  useKeyboard();

  return (
    <div className="w-screen h-screen overflow-hidden" style={{ background: '#02020E' }}>
      <div className="absolute inset-0"><Scene /></div>
      <Header />
      <StatsBar />
      <SearchFilter />
      <InfoCard />
      <AltitudeLegend />
      <ControlsHint />
      <LoadingOverlay />
    </div>
  );
}