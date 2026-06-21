import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { MaterialProvider } from './context/MaterialContext';
import MaterialList from './components/MaterialList';
import MaterialDetail from './components/MaterialDetail';

type View = 'list' | 'detail';

function App() {
  const [view, setView] = useState<View>('list');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');

  const handleSelectMaterial = (id: string) => {
    setSelectedMaterialId(id);
    setView('detail');
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    setView('list');
  };

  const handleDelete = () => {
    setView('list');
  };

  return (
    <MaterialProvider>
      <div style={styles.app}>
        {view === 'list' && (
          <MaterialList onSelectMaterial={handleSelectMaterial} />
        )}
        {view === 'detail' && selectedMaterialId && (
          <MaterialDetail
            materialId={selectedMaterialId}
            onBack={handleBack}
            onDelete={handleDelete}
          />
        )}
      </div>
    </MaterialProvider>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    backgroundColor: '#F8FAFC',
    minHeight: '100vh',
  },
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
