import StarField from '@/components/StarField';
import Scene from '@/components/Scene';
import ControlPanel from '@/components/ControlPanel';

export default function App() {
  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <StarField />
      <Scene />
      <ControlPanel />
    </div>
  );
}
