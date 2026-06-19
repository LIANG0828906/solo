import { MapView } from './components/MapView';
import { ControlPanel } from './components/ControlPanel';
import { StatsPanel } from './components/StatsPanel';

export default function App() {
  return (
    <div style={{
      width: '100%',
      height: '100vh',
      position: 'relative',
      overflow: 'hidden',
      background: '#1A1A2E',
    }}>
      <MapView />
      <ControlPanel />
      <StatsPanel />
    </div>
  );
}
