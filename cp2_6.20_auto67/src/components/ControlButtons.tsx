import { useState, useCallback } from 'react';
import { Undo2, Trash2, Save, Check } from 'lucide-react';
import { useStarStore } from '@/store/starStore';
import type { ConstellationExport } from '@/types';
import './ControlButtons.css';

export function ControlButtons() {
  const [showSuccess, setShowSuccess] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const constellationLines = useStarStore((state) => state.constellationLines);
  const removeLastLine = useStarStore((state) => state.removeLastLine);
  const clearAllLines = useStarStore((state) => state.clearAllLines);
  const getStarById = useStarStore((state) => state.getStarById);

  const handleUndo = useCallback(() => {
    if (constellationLines.length > 0) {
      removeLastLine();
    }
  }, [constellationLines.length, removeLastLine]);

  const handleClear = useCallback(() => {
    if (constellationLines.length === 0) return;

    setIsClearing(true);
    setTimeout(() => {
      clearAllLines();
      setIsClearing(false);
    }, 500);
  }, [constellationLines.length, clearAllLines]);

  const handleSave = useCallback(() => {
    if (constellationLines.length === 0) return;

    const exportData: ConstellationExport = {
      version: '1.0',
      exportedAt: Date.now(),
      lines: constellationLines.map((line) => {
        const startStar = getStarById(line.startStarId);
        const endStar = getStarById(line.endStarId);

        return {
          startStar: {
            id: line.startStarId,
            name: startStar?.name || 'Unknown',
            position: startStar
              ? [startStar.x, startStar.y, startStar.z]
              : [0, 0, 0],
          },
          endStar: {
            id: line.endStarId,
            name: endStar?.name || 'Unknown',
            position: endStar
              ? [endStar.x, endStar.y, endStar.z]
              : [0, 0, 0],
          },
          distance: line.distance,
        };
      }),
    };

    const timestamp = Date.now();
    const fileName = `constellation_${timestamp}.json`;

    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 500);
  }, [constellationLines, getStarById]);

  return (
    <>
      <div className={`control-buttons ${isClearing ? 'clearing' : ''}`}>
        <button
          className="control-btn"
          onClick={handleUndo}
          disabled={constellationLines.length === 0}
          title="撤销上一步连线"
          aria-label="撤销上一步连线"
        >
          <Undo2 size={20} />
        </button>

        <button
          className="control-btn danger"
          onClick={handleClear}
          disabled={constellationLines.length === 0 || isClearing}
          title="清空所有连线"
          aria-label="清空所有连线"
        >
          <Trash2 size={20} />
        </button>

        <button
          className="control-btn save"
          onClick={handleSave}
          disabled={constellationLines.length === 0}
          title="保存星座"
          aria-label="保存星座"
        >
          <Save size={20} />
        </button>
      </div>

      {showSuccess && (
        <div className="save-success">
          <Check size={32} />
        </div>
      )}
    </>
  );
}
