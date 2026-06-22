import Scene from './components/Scene';
import Panel from './components/Panel';

export default function App() {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
        background: '#1a1a2e',
        margin: 0,
        padding: 0,
      }}
    >
      <Scene />
      <Panel />
    </div>
  );
}
