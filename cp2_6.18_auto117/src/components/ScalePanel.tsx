import React from 'react';
import { useScaleStore } from '../store/scaleStore';
import { ScaleCard } from './ScaleCard';
import type { GridBase } from '../types';

export const ScalePanel: React.FC = () => {
  const { levels, selectedLevelId, gridBase, setGridBase } = useScaleStore(
    (state) => ({
      levels: state.levels,
      selectedLevelId: state.selectedLevelId,
      gridBase: state.gridBase,
      setGridBase: state.setGridBase,
    })
  );

  const handleGridToggle = (base: GridBase) => {
    setGridBase(gridBase === base ? null : base);
  };

  return (
    <div className="scale-panel">
      <div className="panel-header">
        <h2 className="panel-title">字体层级</h2>
        <div className="grid-toggle">
          <button
            className={gridBase === 4 ? 'active' : ''}
            onClick={() => handleGridToggle(4)}
            title="4px 网格"
          >
            4px
          </button>
          <button
            className={gridBase === 8 ? 'active' : ''}
            onClick={() => handleGridToggle(8)}
            title="8px 网格"
          >
            8px
          </button>
        </div>
      </div>
      <div className="panel-content">
        {levels.map((level) => (
          <ScaleCard
            key={level.id}
            level={level}
            isSelected={level.id === selectedLevelId}
          />
        ))}
      </div>
    </div>
  );
};
