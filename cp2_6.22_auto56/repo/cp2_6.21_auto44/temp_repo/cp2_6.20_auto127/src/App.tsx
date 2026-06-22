import { useState, useEffect, useCallback } from 'react';
import SceneCanvas from './components/SceneCanvas';
import ControlPanel from './components/ControlPanel';
import TopBar from './components/TopBar';
import ExportModal from './components/ExportModal';
import ConfirmDialog from './components/ConfirmDialog';
import { useSceneStore } from './store/sceneStore';
import type { TransformMode } from './types';
import './styles.css';

function App() {
  const [showExportModal, setShowExportModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const { selectedId, removeGeometry, setTransformMode } = useSceneStore();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key.toLowerCase();
      if (key === 'r') {
        setTransformMode('rotate' as TransformMode);
      } else if (key === 's') {
        setTransformMode('scale' as TransformMode);
      } else if (key === 'g' || key === 'w') {
        setTransformMode('translate' as TransformMode);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) {
          removeGeometry(selectedId);
        }
      } else if (e.key === 'Escape') {
        useSceneStore.getState().selectGeometry(null);
      }
    },
    [selectedId, removeGeometry, setTransformMode]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="app-container">
      <TopBar
        onExport={() => setShowExportModal(true)}
        onClear={() => setShowClearConfirm(true)}
      />
      <div className="main-content">
        <ControlPanel />
        <div className="canvas-container">
          <SceneCanvas />
        </div>
      </div>
      {showExportModal && (
        <ExportModal onClose={() => setShowExportModal(false)} />
      )}
      {showClearConfirm && (
        <ConfirmDialog
          title="确认清空场景"
          message="确定要移除所有几何体并重置灯光吗？此操作不可撤销。"
          onConfirm={() => {
            useSceneStore.getState().clearScene();
            setShowClearConfirm(false);
          }}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}
    </div>
  );
}

export default App;
