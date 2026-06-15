import React, { useEffect } from 'react';
import { MoleculeProvider, useMoleculeStore } from './store/moleculeStore';
import MoleculeViewer from './components/MoleculeViewer';
import ControlPanel from './components/ControlPanel';
import { PRESET_MOLECULES } from './data/presetMolecules';
import './styles/globals.scss';

const AppContent: React.FC = () => {
  const { setCurrentMolecule, isPanelCollapsed, isVibrating } = useMoleculeStore();

  useEffect(() => {
    const defaultMolecule = PRESET_MOLECULES.find((m) => m.id === 'water');
    if (defaultMolecule) {
      setCurrentMolecule(defaultMolecule);
    }
  }, [setCurrentMolecule]);

  const viewerStyle: React.CSSProperties = {
    flex: isPanelCollapsed ? 1 : '0 0 70%',
  };

  return (
    <div className="app-container">
      <div style={{ ...viewerStyle, position: 'relative', height: '100%' }}>
        <MoleculeViewer />
      </div>
      <ControlPanel />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <MoleculeProvider>
      <AppContent />
    </MoleculeProvider>
  );
};

export default App;
