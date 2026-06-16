import { useState } from 'react';
import MaterialPanel from './components/MaterialPanel';
import Canvas from './components/Canvas';
import ExportModal from './components/ExportModal';

function App() {
  const [showExportModal, setShowExportModal] = useState(false);

  return (
    <div style={styles.app}>
      <MaterialPanel />
      <Canvas onExportClick={() => setShowExportModal(true)} />
      {showExportModal && (
        <ExportModal onClose={() => setShowExportModal(false)} />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
    padding: '20px',
    gap: '24px',
  },
};

export default App;
