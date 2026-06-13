import { useEffect } from 'react';
import type { BuildingInfo } from '../types';
import './InfoPanel.css';

interface InfoPanelProps {
  building: BuildingInfo | null;
  onClose: () => void;
}

export default function InfoPanel({ building, onClose }: InfoPanelProps) {
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (building && !target.closest('.info-panel') && !target.closest('.building-label')) {
        onClose();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [building, onClose]);

  if (!building) return null;

  return (
    <div className="info-panel">
      <div className="panel-header">
        <h3 className="building-name">{building.name}</h3>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      <div className="panel-content">
        <div className="info-row">
          <span className="info-label">建造年份</span>
          <span className="info-value year-value">{building.year}年</span>
        </div>
        <div className="info-row description-row">
          <span className="info-label">建筑描述</span>
          <p className="info-value description">
            {building.description || '暂无建筑描述信息'}
          </p>
        </div>
      </div>
      <div className="panel-glow"></div>
    </div>
  );
}
