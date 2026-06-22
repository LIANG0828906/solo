import { useTerrainStore } from '../store';
import type { PresetType } from '../types';

const presets: { type: PresetType; label: string; icon: string }[] = [
  { type: 'plain', label: '平原', icon: '🏞' },
  { type: 'mountain', label: '山地', icon: '⛰' },
  { type: 'basin', label: '盆地', icon: '🕳' },
];

export default function PresetBar() {
  const { applyPreset, resetTerrain, isTerrainAnimating } = useTerrainStore();

  return (
    <div className="preset-bar">
      <div className="preset-label">地形预设</div>
      <div className="preset-buttons">
        {presets.map((p) => (
          <button
            key={p.type}
            className="preset-btn"
            onClick={() => applyPreset(p.type)}
            disabled={isTerrainAnimating}
          >
            <span className="preset-icon">{p.icon}</span>
            <span>{p.label}</span>
          </button>
        ))}
        <button
          className="preset-btn reset"
          onClick={resetTerrain}
          disabled={isTerrainAnimating}
        >
          <span className="preset-icon">↺</span>
          <span>重置</span>
        </button>
      </div>
    </div>
  );
}
