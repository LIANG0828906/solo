import { useState } from 'react';
import type { TopologyMode } from '@/utils/topologyCalculator';

interface ControlPanelProps {
  particleCount: number;
  speed: number;
  topologyMode: TopologyMode;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onParticleCountChange: (n: number) => void;
  onSpeedChange: (n: number) => void;
  onTopologyModeChange: (mode: TopologyMode) => void;
}

const MODE_OPTIONS: Array<{ value: TopologyMode; label: string }> = [
  { value: 'torus', label: '环面结 Torus Knot' },
  { value: 'trefoil', label: '三叶结 Trefoil' },
  { value: 'mobius', label: '莫比乌斯带 Mobius' },
  { value: 'custom', label: '自定义组合 Custom' },
];

export default function ControlPanel({
  particleCount,
  speed,
  topologyMode,
  collapsed,
  onToggleCollapsed,
  onParticleCountChange,
  onSpeedChange,
  onTopologyModeChange,
}: ControlPanelProps) {
  return (
    <div className={`control-panel ${collapsed ? 'collapsed' : ''}`}>
      <button
        className="panel-toggle"
        onClick={onToggleCollapsed}
        title={collapsed ? '展开面板' : '折叠面板'}
        type="button"
      >
        {collapsed ? '⚙' : '✕'}
      </button>
      <div className="panel-content">
        <div className="panel-title">量子参数 · Parameters</div>

        <div className="field-group">
          <div className="field-label">
            <span>粒子数量</span>
            <span className="field-value">{particleCount}</span>
          </div>
          <input
            type="range"
            className="slider"
            min={100}
            max={1000}
            step={50}
            value={particleCount}
            onChange={e => onParticleCountChange(Number(e.target.value))}
          />
        </div>

        <div className="field-group">
          <div className="field-label">
            <span>运动速度</span>
            <span className="field-value">{speed.toFixed(1)}×</span>
          </div>
          <input
            type="range"
            className="slider"
            min={0.1}
            max={3}
            step={0.1}
            value={speed}
            onChange={e => onSpeedChange(Number(e.target.value))}
          />
        </div>

        <div className="field-group">
          <div className="field-label">
            <span>拓扑模式</span>
          </div>
          <select
            className="mode-select"
            value={topologyMode}
            onChange={e => onTopologyModeChange(e.target.value as TopologyMode)}
          >
            {MODE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
