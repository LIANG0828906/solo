import React from 'react';
import type { RegionType } from './types';
import { getRegionConfig } from './RegionManager';
import { getVisibilityColor } from './EffectsLibrary';

interface PlayerStatusPanelProps {
  region: RegionType;
  temperature: number;
  visibility: number;
}

const PlayerStatusPanel: React.FC<PlayerStatusPanelProps> = ({
  region,
  temperature,
  visibility,
}) => {
  const regionConfig = getRegionConfig(region);
  const visibilityColor = getVisibilityColor(visibility);

  return (
    <div className="status-panel">
      <div className="status-item">
        <span className="status-icon" aria-hidden="true">
          {regionConfig.icon}
        </span>
        <div>
          <div className="status-label">当前区域</div>
          <div className="status-value">{regionConfig.name}</div>
        </div>
      </div>

      <div className="status-item">
        <span className="status-icon" aria-hidden="true">
          🌡️
        </span>
        <div>
          <div className="status-label">体感温度</div>
          <div className="status-value">{temperature > 0 ? '+' : ''}{temperature}℃</div>
        </div>
      </div>

      <div className="status-item">
        <span className="status-icon" aria-hidden="true">
          👁️
        </span>
        <div>
          <div className="status-label">可见度</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="visibility-bar">
              <div
                className="visibility-fill"
                style={{
                  width: `${visibility}%`,
                  background: visibilityColor,
                }}
              />
            </div>
            <div className="status-value" style={{ fontSize: 16 }}>
              {visibility}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerStatusPanel;
