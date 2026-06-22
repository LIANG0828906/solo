import React from 'react';
import type { CelestialObject, CelestialType } from '../data/CelestialDataModel';
import { getTypeLabel, getTypeColor } from '../data/CelestialDataModel';

interface ControlsPanelProps {
  celestialData: CelestialObject[];
  selectedView: string;
  selectedType: CelestialType | 'all';
  cameraDistance: number;
  autoRotate: boolean;
  panelCollapsed: boolean;
  hoveredObject: CelestialObject | null;
  onViewChange: (view: string) => void;
  onTypeChange: (type: CelestialType | 'all') => void;
  onDistanceChange: (distance: number) => void;
  onAutoRotateChange: (enabled: boolean) => void;
  onTogglePanel: () => void;
}

const ControlsPanel: React.FC<ControlsPanelProps> = ({
  celestialData,
  selectedView,
  selectedType,
  cameraDistance,
  autoRotate,
  panelCollapsed,
  hoveredObject,
  onViewChange,
  onTypeChange,
  onDistanceChange,
  onAutoRotateChange,
  onTogglePanel,
}) => {
  const typeOptions = [
    { value: 'all', label: '全部类型' },
    { value: 'nebula', label: '星云' },
    { value: 'galaxy', label: '星系' },
    { value: 'starcluster', label: '星团' },
  ];

  const viewOptions = [
    { value: 'overview', label: '全览视图' },
    ...celestialData.map((obj) => ({
      value: obj.id,
      label: obj.name,
    })),
  ];

  return (
    <>
      <button
        className={`panel-toggle ${!panelCollapsed ? 'panel-open' : ''}`}
        onClick={onTogglePanel}
      >
        {panelCollapsed ? '☰' : '✕'}
      </button>

      <div className={`control-panel ${panelCollapsed ? 'collapsed' : ''}`}>
        <div className="panel-title">深空天体控制台</div>

        <div className="panel-section">
          <div className="panel-label">观测目标</div>
          <select
            className="panel-select"
            value={selectedView}
            onChange={(e) => onViewChange(e.target.value)}
          >
            {viewOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="panel-section">
          <div className="panel-label">天体类型</div>
          <select
            className="panel-select"
            value={selectedType}
            onChange={(e) => onTypeChange(e.target.value as CelestialType | 'all')}
          >
            {typeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="panel-section">
          <div className="panel-label">视点距离</div>
          <div className="panel-slider-container">
            <input
              type="range"
              className="panel-slider"
              min={5}
              max={50}
              value={cameraDistance}
              onChange={(e) => onDistanceChange(Number(e.target.value))}
            />
            <span className="panel-slider-value">{cameraDistance}</span>
          </div>
        </div>

        <div className="panel-section">
          <div className="panel-toggle-row">
            <span className="panel-toggle-label">自动旋转</span>
            <div
              className={`panel-switch ${autoRotate ? 'active' : ''}`}
              onClick={() => onAutoRotateChange(!autoRotate)}
            >
              <div className="panel-switch-knob" />
            </div>
          </div>
        </div>

        {hoveredObject && (
          <div className="panel-info">
            <div className="panel-info-name">{hoveredObject.name}</div>
            <div className="panel-info-detail">
              类型：{getTypeLabel(hoveredObject.type)}
              <br />
              距离：{hoveredObject.observationData.distance.toLocaleString()} 光年
              <br />
              视星等：{hoveredObject.observationData.apparentMagnitude}
              <br />
              发现者：{hoveredObject.observationData.discoverer}
              <br />
              年龄：{hoveredObject.observationData.age}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ControlsPanel;
