import EditorPanel from './components/EditorPanel';
import PreviewCanvas from './components/PreviewCanvas';
import './index.css';

function App() {
  return (
    <div
      style={{
        display: 'flex',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: '#0a0e17',
        fontFamily: "'Oxanium', 'Segoe UI', sans-serif",
      }}
    >
      <EditorPanel />
      <PreviewCanvas />
    </div>
  );
}

export default App;
