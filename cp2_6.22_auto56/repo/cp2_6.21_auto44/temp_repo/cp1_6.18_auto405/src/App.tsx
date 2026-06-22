import Scene from '@/components/Scene';
import ControlPanel from '@/components/ControlPanel';

export default function App() {
  return (
    <div className="w-screen h-screen overflow-hidden relative">
      <Scene />
      <ControlPanel />
    </div>
  );
}
