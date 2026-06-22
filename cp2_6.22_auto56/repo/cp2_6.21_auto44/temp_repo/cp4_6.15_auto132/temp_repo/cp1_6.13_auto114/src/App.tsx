import ControlPanel from '@/components/ControlPanel';
import SimulationCanvas from '@/components/SimulationCanvas';
import TimelineSlider from '@/components/TimelineSlider';

export default function App() {
  return (
    <div className="w-screen h-screen relative overflow-hidden bg-[#1a1a2e]">
      <ControlPanel />
      <SimulationCanvas />
      <TimelineSlider />
    </div>
  );
}
