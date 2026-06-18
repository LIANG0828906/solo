import { Scene } from './components/Scene';
import { ControlPanel } from './components/ControlPanel';
import { HighlightChart } from './components/HighlightChart';

export default function App() {
  return (
    <div className="app-container">
      <Scene />
      <HighlightChart />
      <ControlPanel />
    </div>
  );
}
