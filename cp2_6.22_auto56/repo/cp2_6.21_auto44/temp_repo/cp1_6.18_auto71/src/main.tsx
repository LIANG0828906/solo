import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import { BeachCanvas } from './components/BeachCanvas';
import { CapsuleModal } from './components/CapsuleModal';
import { SidePanel } from './components/SidePanel';
import { useGameStore } from './store/gameStore';

const App: React.FC = () => {
  const { showModal, modalCapsule, setShowModal } = useGameStore();

  return (
    <div className="app-container">
      <BeachCanvas />
      <SidePanel />
      {showModal && (
        <CapsuleModal
          capsule={modalCapsule}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
