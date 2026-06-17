import React, { useState } from 'react';
import { useCharacterStore } from '../stores/characterStore';
import { Undo2, Redo2 } from 'lucide-react';

export const HistoryBar: React.FC = () => {
  const undo = useCharacterStore((s) => s.undo);
  const redo = useCharacterStore((s) => s.redo);
  const historyIndex = useCharacterStore((s) => s.historyIndex);
  const history = useCharacterStore((s) => s.history);

  const [undoRotating, setUndoRotating] = useState(false);
  const [redoRotating, setRedoRotating] = useState(false);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleUndo = () => {
    if (!canUndo) return;
    setUndoRotating(true);
    undo();
    setTimeout(() => setUndoRotating(false), 200);
  };

  const handleRedo = () => {
    if (!canRedo) return;
    setRedoRotating(true);
    redo();
    setTimeout(() => setRedoRotating(false), 200);
  };

  return (
    <div className="history-bar">
      <button
        className={`history-btn undo ${undoRotating ? 'rotating' : ''} ${!canUndo ? 'disabled' : ''}`}
        onClick={handleUndo}
        disabled={!canUndo}
        title="撤销"
      >
        <Undo2 size={18} />
      </button>
      <button
        className={`history-btn redo ${redoRotating ? 'rotating' : ''} ${!canRedo ? 'disabled' : ''}`}
        onClick={handleRedo}
        disabled={!canRedo}
        title="重做"
      >
        <Redo2 size={18} />
      </button>
      <span className="history-count">
        {historyIndex + 1} / {history.length}
      </span>
    </div>
  );
};

export default HistoryBar;
