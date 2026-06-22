import MusicVisualizer from '@/components/MusicVisualizer';
import ControlPanel from '@/components/ControlPanel';

export default function App() {
  return (
    <div className="w-screen h-screen overflow-hidden bg-[#0a0a1a]">
      <div className="relative w-full h-full">
        <MusicVisualizer />
      </div>
      <ControlPanel />
    </div>
  );
}
