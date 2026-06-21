import React from 'react';
import { Building2, X, Ruler, Layout, Shapes } from 'lucide-react';
import type { Building } from '@/types';

interface BuildingInfoProps {
  building: Building;
  position: { x: number; y: number };
  onClose: () => void;
}

const BuildingInfo: React.FC<BuildingInfoProps> = ({
  building,
  position,
  onClose,
}) => {
  const containerWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const containerHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;
  const maxX = containerWidth - 250;
  const maxY = containerHeight - 210;
  const left = Math.min(position.x, maxX);
  const top = Math.min(position.y, maxY);

  const getBuildingTypeLabel = (type: string): string => {
    switch (type) {
      case 'cube':
        return '立方体';
      case 'cylinder':
        return '圆柱';
      case 'L-shape':
        return 'L型';
      default:
        return type;
    }
  };

  const calculateFootprintArea = (): number => {
    if (building.footprintArea !== undefined) {
      return building.footprintArea;
    }
    const { width, depth } = building.dimensions;
    if (building.type === 'cylinder') {
      return Math.PI * Math.pow(width / 2, 2);
    }
    return width * depth;
  };

  const footprintArea = calculateFootprintArea();
  const shadowPercent = building.shadowAreaPercent || 0;

  return (
    <div
      className="building-info-modal"
      style={{ left, top }}
    >
      <div className="building-info-card">
        <div className="building-info-header">
          <div className="building-info-title">
            <Building2 className="card-title-icon" />
            <span>建筑 {building.id}</span>
          </div>
          <button className="building-close-btn" onClick={onClose}>
            <X className="btn-icon" />
          </button>
        </div>

        <div className="building-info-list">
          <div className="building-info-row">
            <span className="building-info-label">
              <Ruler className="btn-icon" style={{ marginRight: 6 }} />
              建筑高度
            </span>
            <span className="building-info-value">
              {building.dimensions.height.toFixed(1)}m
            </span>
          </div>

          <div className="building-info-row">
            <span className="building-info-label">
              <Layout className="btn-icon" style={{ marginRight: 6 }} />
              占地面积
            </span>
            <span className="building-info-value">
              {footprintArea.toFixed(1)}㎡
            </span>
          </div>

          <div className="building-info-row">
            <span className="building-info-label">
              <Shapes className="btn-icon" style={{ marginRight: 6 }} />
              建筑类型
            </span>
            <span className="building-info-value">
              {getBuildingTypeLabel(building.type)}
            </span>
          </div>

          <div className="shadow-bar-container">
            <div className="building-info-row">
              <span className="building-info-label">阴影遮挡</span>
              <span className="building-info-value">
                {shadowPercent.toFixed(0)}%
              </span>
            </div>
            <div className="shadow-bar">
              <div
                className="shadow-bar-fill"
                style={{ width: `${shadowPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuildingInfo;
