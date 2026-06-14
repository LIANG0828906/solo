import { Toolbar } from './components/Toolbar';
import { MenuBar } from './components/MenuBar';
import { Canvas } from './components/Canvas';

export default function App() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f8fafc',
      }}
    >
      <MenuBar />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Toolbar />
        <Canvas />
      </div>
    </div>
  );
}
