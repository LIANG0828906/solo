import React from 'react';
import { useGameStore } from '../store';
import { COLOR_HEX } from '../types';
import IconComponent from './Icon';

export const TargetIndicator: React.FC = () => {
  const target = useGameStore((s) => s.target);

  if (!target) return null;

  const previewBg = target.type === 'icon' ? '#2A2A4A' : COLOR_HEX[target.color!];
  const previewIcon = target.type === 'color' ? null : target.icon;

  return (
    <div className="target-indicator">
      <span className="target-label">目标匹配</span>
      <div className="target-content">
        <div
          className="target-preview"
          style={{ backgroundColor: previewBg }}
        >
          {previewIcon ? (
            <IconComponent type={previewIcon} color="rgba(255,255,255,0.95)" />
          ) : (
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>
              ◼
            </span>
          )}
        </div>
        <span className="target-desc">{target.description}</span>
      </div>
    </div>
  );
};

export default TargetIndicator;
