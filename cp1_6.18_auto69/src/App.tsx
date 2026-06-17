import { PoemCanvas } from './components/PoemCanvas';
import { SidePanel } from './components/SidePanel';
import { ProgressBar } from './components/ProgressBar';

function App() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        gap: '24px',
        background:
          'radial-gradient(ellipse at center, #1a1a2e 0%, #0f0f1a 100%)',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
        }}
      >
        <PoemCanvas />
        <ProgressBar />
      </div>
      <SidePanel />
    </div>
  );
}

export default App;
