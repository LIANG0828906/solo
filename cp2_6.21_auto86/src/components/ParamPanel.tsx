import { useState, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { usePlantStore } from '../stores/plantStore';
import '../styles/ParamPanel.css';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}

const Slider: React.FC<SliderProps> = ({ label, value, min, max, step, unit, onChange }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 150);
    return () => clearTimeout(timer);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    onChange(newValue);
  };

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="slider-container">
      <div className="slider-label">
        <span>{label}</span>
        <span className={`slider-value ${isAnimating ? 'animating' : ''}`}>
          {value.toFixed(1)}{unit}
        </span>
      </div>
      <div className="slider-track">
        <div className="slider-fill" style={{ width: `${percentage}%` }} />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          className="slider-input"
        />
      </div>
    </div>
  );
};

interface PresetButtonProps {
  label: string;
  onClick: () => void;
  active?: boolean;
}

const PresetButton: React.FC<PresetButtonProps> = ({ label, onClick, active }) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    setIsPressed(true);
    onClick();
    setTimeout(() => setIsPressed(false), 100);
  };

  return (
    <button
      className={`preset-button ${active ? 'active' : ''} ${isPressed ? 'pressed' : ''}`}
      onClick={handleClick}
    >
      {label}
    </button>
  );
};

interface NodePropsPanelProps {
  plantId: string | null;
  nodeId: string | null;
}

const NodePropsPanel: React.FC<NodePropsPanelProps> = ({ plantId, nodeId }) => {
  const { plants, updateNodePhysics } = usePlantStore();

  const node = plantId && nodeId
    ? plants.find((p) => p.id === plantId)?.nodes.get(nodeId)
    : null;

  if (!node) return null;

  return (
    <div className="node-props-panel">
      <h3 className="panel-subtitle">节点属性</h3>
      <div className="node-info">
        <span className="node-type">{node.type}</span>
      </div>
      <Slider
        label="弹性系数"
        value={node.elasticity}
        min={0.1}
        max={2.0}
        step={0.1}
        unit=""
        onChange={(v) => updateNodePhysics(nodeId!, { elasticity: v })}
      />
      <Slider
        label="阻尼系数"
        value={node.damping}
        min={0.1}
        max={1.0}
        step={0.05}
        unit=""
        onChange={(v) => updateNodePhysics(nodeId!, { damping: v })}
      />
      <Slider
        label="风力承受因子"
        value={node.windFactor}
        min={0}
        max={1.0}
        step={0.05}
        unit=""
        onChange={(v) => updateNodePhysics(nodeId!, { windFactor: v })}
      />
    </div>
  );
};

const ParamPanel: React.FC = () => {
  const {
    environment,
    setWindStrength,
    setWindDirection,
    setLightIntensity,
    setTargetGrowthDirection,
    selectedPlantId,
    selectedNodeId,
    resetScene,
    fps,
    totalNodeCount,
    addPlant,
    plants,
  } = usePlantStore();

  const [isMobile, setIsMobile] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handlePreset = useCallback((direction: 'up' | 'left' | 'right' | 'random') => {
    let dir = new THREE.Vector3(0, 1, 0);
    switch (direction) {
      case 'up':
        dir = new THREE.Vector3(0, 1, 0);
        break;
      case 'left':
        dir = new THREE.Vector3(-Math.sin(Math.PI / 6), Math.cos(Math.PI / 6), 0);
        break;
      case 'right':
        dir = new THREE.Vector3(Math.sin(Math.PI / 6), Math.cos(Math.PI / 6), 0);
        break;
      case 'random':
        const angle = Math.random() * Math.PI * 2;
        const tilt = Math.random() * 0.5;
        dir = new THREE.Vector3(
          Math.sin(angle) * tilt,
          Math.cos(tilt),
          Math.cos(angle) * tilt
        ).normalize();
        break;
    }
    setTargetGrowthDirection(dir);
  }, [setTargetGrowthDirection]);

  const handleAddPlant = () => {
    if (plants.length >= 4) return;
    const angle = (plants.length * Math.PI * 2) / 4 + Math.PI / 4;
    const distance = 5;
    const pos = new THREE.Vector3(
      Math.cos(angle) * distance,
      0,
      Math.sin(angle) * distance
    );
    addPlant(pos);
  };

  const handleReset = () => {
    resetScene();
  };

  const panelContent = (
    <>
      <div className="panel-header">
        <h2 className="panel-title">环境参数</h2>
      </div>

      <div className="panel-section">
        <Slider
          label="风力强度"
          value={environment.windStrength}
          min={0}
          max={20}
          step={0.5}
          unit=" N"
          onChange={setWindStrength}
        />
        <Slider
          label="风向角"
          value={environment.windDirection}
          min={0}
          max={360}
          step={5}
          unit="°"
          onChange={setWindDirection}
        />
        <Slider
          label="光照强度"
          value={environment.lightIntensity}
          min={0.5}
          max={3.0}
          step={0.1}
          unit=""
          onChange={setLightIntensity}
        />
      </div>

      <div className="panel-section">
        <h3 className="panel-subtitle">生长方向预设</h3>
        <div className="preset-buttons">
          <PresetButton label="向上" onClick={() => handlePreset('up')} />
          <PresetButton label="左倾30°" onClick={() => handlePreset('left')} />
          <PresetButton label="右倾30°" onClick={() => handlePreset('right')} />
          <PresetButton label="随机" onClick={() => handlePreset('random')} />
        </div>
      </div>

      <div className="panel-section">
        <h3 className="panel-subtitle">场景操作</h3>
        <div className="action-buttons">
          <button
            className="action-button primary"
            onClick={handleAddPlant}
            disabled={plants.length >= 4}
          >
            添加植物 ({plants.length}/4)
          </button>
          <button className="action-button" onClick={handleReset}>
            重置场景
          </button>
        </div>
      </div>

      {selectedNodeId && (
        <NodePropsPanel plantId={selectedPlantId} nodeId={selectedNodeId} />
      )}
    </>
  );

  const perfContent = (
    <div className="perf-monitor">
      <div className="perf-item">
        <span className="perf-label">FPS</span>
        <span className={`perf-value ${fps < 30 ? 'low' : ''}`}>{fps}</span>
      </div>
      <div className="perf-item">
        <span className="perf-label">节点数</span>
        <span className="perf-value">{totalNodeCount}</span>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        {perfContent}
        <button
          className="mobile-toggle"
          onClick={() => setIsDrawerOpen(!isDrawerOpen)}
        >
          {isDrawerOpen ? '关闭' : '参数'}
        </button>
        <div className={`mobile-drawer ${isDrawerOpen ? 'open' : ''}`}>
          <div className="drawer-handle" onClick={() => setIsDrawerOpen(!isDrawerOpen)} />
          <div className="drawer-content">{panelContent}</div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="param-panel">{panelContent}</div>
      {perfContent}
    </>
  );
};

export default ParamPanel;
