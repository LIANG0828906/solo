import React, { useState } from 'react';
import {
  OrganelleData,
  OrganelleType,
  ViewPreset,
  viewPresets,
} from '../data/cellOrganelles';

interface PanelProps {
  organelles: OrganelleData[];
  visibleOrganelles: Record<OrganelleType, boolean>;
  opacity: number;
  activeViewPreset: string | null;
  onVisibilityChange: (type: OrganelleType, visible: boolean) => void;
  onOpacityChange: (opacity: number) => void;
  onViewPreset: (preset: ViewPreset) => void;
  onResetView: () => void;
  onHover: (type: OrganelleType | null) => void;
}

const Panel: React.FC<PanelProps> = ({
  organelles,
  visibleOrganelles,
  opacity,
  activeViewPreset,
  onVisibilityChange,
  onOpacityChange,
  onViewPreset,
  onResetView,
  onHover,
}) => {
  const [mobileExpanded, setMobileExpanded] = useState(false);

  const handleCheckboxChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: OrganelleType
  ) => {
    e.stopPropagation();
    onVisibilityChange(type, e.target.checked);
  };

  return (
    <div
      className={`control-panel ${mobileExpanded ? 'mobile-expanded' : ''}`}
    >
      <div
        className="mobile-toggle"
        onClick={() => setMobileExpanded(!mobileExpanded)}
      >
        控制面板
      </div>
      <div className="panel-content">
        <h2>植物细胞3D探索</h2>

        <hr className="section-divider" />

        <h3 className="section-title">细胞器</h3>
        <div className="organelle-list">
          {organelles.map((organelle) => (
            <div
              key={organelle.id}
              className={`organelle-item ${
                visibleOrganelles[organelle.type] ? 'selected' : ''
              }`}
              onMouseEnter={() => onHover(organelle.type)}
              onMouseLeave={() => onHover(null)}
              onClick={() =>
                onVisibilityChange(
                  organelle.type,
                  !visibleOrganelles[organelle.type]
                )
              }
            >
              <span
                className="color-dot"
                style={{ backgroundColor: organelle.color }}
              />
              <span className="organelle-name">{organelle.name}</span>
              <input
                type="checkbox"
                className="organelle-checkbox"
                checked={visibleOrganelles[organelle.type]}
                onChange={(e) => handleCheckboxChange(e, organelle.type)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          ))}
        </div>

        <hr className="section-divider" />

        <h3 className="section-title">透明度</h3>
        <div className="slider-container">
          <div className="slider-label">
            <span>细胞器透明度</span>
            <span className="slider-value">{opacity.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.1"
            value={opacity}
            onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
            className="opacity-slider"
          />
        </div>

        <hr className="section-divider" />

        <h3 className="section-title">视角预设</h3>
        <div className="view-buttons">
          {viewPresets.map((preset) => (
            <button
              key={preset.name}
              className={`view-btn ${
                activeViewPreset === preset.name ? 'active' : ''
              }`}
              onClick={() => onViewPreset(preset)}
            >
              {preset.name}
            </button>
          ))}
        </div>

        <hr className="section-divider" />

        <button className="reset-btn" onClick={onResetView}>
          重置视角
        </button>
      </div>
    </div>
  );
};

export default Panel;
