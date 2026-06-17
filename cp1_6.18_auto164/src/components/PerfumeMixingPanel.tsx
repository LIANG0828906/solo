import React, { useState, useEffect, useCallback } from 'react';
import { usePerfumeStore } from '../stores/perfumeStore';
import { buildTotalGradient } from '../engine/mixEngine';
import type { ScentCard as ScentCardType, FormulaItem } from '../types';
import '../styles/PerfumeMixingPanel.css';

interface FormulaItemRowProps {
  item: FormulaItem;
  isNew: boolean;
  isRemoving: boolean;
  onRemove: (id: string) => void;
  onBounceEnd: (id: string) => void;
  onFadeEnd: (id: string) => void;
}

const FormulaItemRow: React.FC<FormulaItemRowProps> = ({
  item,
  isNew,
  isRemoving,
  onRemove,
  onBounceEnd,
  onFadeEnd,
}) => {
  const className = [
    'formula-item-row',
    isNew ? 'formula-item-bounce' : '',
    isRemoving ? 'formula-item-remove' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={className}
      onAnimationEnd={(e) => {
        if (e.animationName === 'bounceIn') onBounceEnd(item.id);
        if (e.animationName === 'shrinkFade') onFadeEnd(item.id);
      }}
    >
      <div className="formula-item-info">
        <div
          className="formula-item-color-dot"
          style={{ backgroundColor: item.color }}
        />
        <div className="formula-item-name">{item.name}</div>
      </div>
      <div className="formula-item-ratio-bar">
        <div
          className="formula-item-ratio-fill"
          style={{
            width: `${item.ratio}%`,
            backgroundColor: item.liquidColor,
          }}
        />
      </div>
      <div className="formula-item-ratio-text">{item.ratio.toFixed(0)}%</div>
      <button
        className="formula-item-remove-btn"
        onClick={() => onRemove(item.id)}
        aria-label={`移除${item.name}`}
      >
        ✕
      </button>
    </div>
  );
};

const PerfumeMixingPanel: React.FC = () => {
  const currentFormula = usePerfumeStore((s) => s.currentFormula);
  const addScentToFormula = usePerfumeStore((s) => s.addScentToFormula);
  const removeFromFormula = usePerfumeStore((s) => s.removeFromFormula);
  const resetFormula = usePerfumeStore((s) => s.resetFormula);
  const addedInstanceId = usePerfumeStore((s) => s.addedInstanceId);
  const removedInstanceId = usePerfumeStore((s) => s.removedInstanceId);
  const clearAddedInstanceId = usePerfumeStore((s) => s.clearAddedInstanceId);
  const clearRemovedInstanceId = usePerfumeStore((s) => s.clearRemovedInstanceId);

  const [isDragOver, setIsDragOver] = useState(false);
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (!isDragOver) setIsDragOver(true);
  }, [isDragOver]);

  const handleDragLeave = useCallback(() => setIsDragOver(false), []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    try {
      const raw = e.dataTransfer.getData('application/scent');
      if (!raw) return;
      const scent: ScentCardType = JSON.parse(raw);
      addScentToFormula(scent);
    } catch {
      /* ignore parse errors */
    }
  }, [addScentToFormula]);

  const handleRemove = useCallback((id: string) => {
    setPendingRemoveId(id);
  }, []);

  const handleFadeEnd = useCallback((id: string) => {
    if (id === pendingRemoveId) {
      setPendingRemoveId(null);
      removeFromFormula(id);
    }
  }, [pendingRemoveId, removeFromFormula]);

  useEffect(() => {
    if (removedInstanceId) clearRemovedInstanceId();
  }, [removedInstanceId, clearRemovedInstanceId]);

  const totalGradient = buildTotalGradient(currentFormula);
  const totalPercent = currentFormula.length > 0 ? 100 : 0;

  return (
    <div className="perfume-mixing-panel">
      <div
        className={`mixing-drop-zone ${isDragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {currentFormula.length === 0 ? (
          <div className="mixing-placeholder">
            <div className="mixing-placeholder-icon">✨</div>
            <div className="mixing-placeholder-title">将气味卡片拖到此处</div>
            <div className="mixing-placeholder-desc">释放即可开始调配你的专属香水</div>
          </div>
        ) : (
          <div className="formula-list">
            {currentFormula.map((item) => (
              <FormulaItemRow
                key={item.id}
                item={item}
                isNew={item.id === addedInstanceId}
                isRemoving={item.id === pendingRemoveId}
                onRemove={handleRemove}
                onBounceEnd={clearAddedInstanceId}
                onFadeEnd={handleFadeEnd}
              />
            ))}
          </div>
        )}
      </div>

      <div className="formula-footer">
        <div className="formula-total">
          <div className="formula-total-label">总配方比例</div>
          <div className="formula-total-bar">
            <div
              className="formula-total-fill"
              style={{
                width: `${totalPercent}%`,
                background: totalGradient,
              }}
            />
          </div>
          <div className="formula-total-text">{totalPercent}%</div>
        </div>
        <button
          className="formula-reset-btn"
          onClick={resetFormula}
          disabled={currentFormula.length === 0}
        >
          重置配方
        </button>
      </div>
    </div>
  );
};

export default PerfumeMixingPanel;
