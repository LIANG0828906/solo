import { Scene } from './scene/Scene';
import { Controls } from './ui/Controls';
import { PlanetInfo } from './ui/PlanetInfo';

export default function App() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Scene />
      <Controls />
      <PlanetInfo />
    </div>
  );
}
