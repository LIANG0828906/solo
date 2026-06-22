import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { HistoryStateManager } from './model';
import { MindMapCanvas } from './components';

const App: React.FC = () => {
  const [model] = useState(() => new HistoryStateManager());
  const [, forceUpdate] = useState(0);
  const [undoAvailable, setUndoAvailable] = useState(false);
  const [redoAvailable, setRedoAvailable] = useState(false);

  const handleStateChange = useCallback(() => {
    forceUpdate(n => n + 1);
    setUndoAvailable(model.canUndo());
    setRedoAvailable(model.canRedo());
  }, [model]);

  useEffect(() => {
    setUndoAvailable(model.canUndo());
    setRedoAvailable(model.canRedo());
  }, [model]);

  return <MindMapCanvas model={model} onStateChange={handleStateChange} />;
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
