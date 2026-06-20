import React from 'react';
import { useScaleStore } from '../store/scaleStore';

export const Toolbar: React.FC = () => {
  const { levels, addLevel, toggleExportModal } = useScaleStore((state) => ({
    levels: state.levels,
    addLevel: state.addLevel,
    toggleExportModal: state.toggleExportModal,
  }));

  const canAddLevel = levels.length < 6;

  return (
    <div className="toolbar">
      <button
        className="btn btn-primary"
        onClick={addLevel}
        disabled={!canAddLevel}
        title={canAddLevel ? '添加层级' : '最多6个层级'}
      >
        + 添加层级
      </button>
      <button className="btn btn-secondary" onClick={toggleExportModal}>
        导出
      </button>
    </div>
  );
};
