import React from 'react';
import { useSceneStore } from '@/store/sceneStore';
import { cellTypeLabels, cellTypeDescriptions } from '@/constants/presets';
import type { CellType } from '@/types';

export const PresetTab: React.FC = () => {
  const cellType = useSceneStore((state) => state.cellType);
  const setCellType = useSceneStore((state) => state.setCellType);

  const presets: CellType[] = ['liver', 'neuron', 'muscle', 'default'];

  return (
    <div className="preset-section">
      <div className="section-title">选择细胞预设</div>
      {presets.map((preset) => (
        <div
          key={preset}
          className={`preset-card ${cellType === preset ? 'active' : ''}`}
          onClick={() => setCellType(preset)}
        >
          <div className="preset-card-title">{cellTypeLabels[preset]}</div>
          <div className="preset-card-desc">{cellTypeDescriptions[preset]}</div>
        </div>
      ))}
    </div>
  );
};

export default PresetTab;
