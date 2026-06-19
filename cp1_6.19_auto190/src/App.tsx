import Scene from './components/Scene';
import ControlPanel from './components/ControlPanel';

function App() {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0 }}>
        <Scene />
      </div>
      <ControlPanel />
    </div>
  );
}

export default App;
