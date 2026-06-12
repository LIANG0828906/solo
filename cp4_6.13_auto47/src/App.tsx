import ControlPanel from './ui/ControlPanel';
import ParticleScene from './ParticleScene';

export default function App() {
  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100vh',
        margin: 0,
        padding: 0,
        background: '#000',
      }}
    >
      <ControlPanel />
      <div
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <ParticleScene />
      </div>
    </div>
  );
}
