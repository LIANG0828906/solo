import { NavBar } from './render/NavBar';
import { EnvControls } from './render/EnvControls';
import { GenePanel } from './render/GenePanel';
import { LogPanel } from './render/LogPanel';
import { SceneContainer } from './render/SceneContainer';

export default function App() {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        background: '#212121',
        fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
        color: '#fff',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          top: 40,
        }}
      >
        <SceneContainer />
      </div>
      <NavBar />
      <EnvControls />
      <GenePanel />
      <LogPanel />
    </div>
  );
}
