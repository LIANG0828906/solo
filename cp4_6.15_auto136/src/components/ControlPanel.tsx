import { useState } from 'react';
import {
  LightConfig,
  colorTemperatureToHex,
  colorTemperatureToCSSColor,
} from '@/utils/lightUtils';

interface LightCardProps {
  name: string;
  lightKey: keyof LightConfig;
  enabled: boolean;
  intensity: number;
  colorTemperature: number;
  expanded: boolean;
  onToggle: () => void;
  onExpand: () => void;
  onIntensityChange: (value: number) => void;
  onColorTempChange: (value: number) => void;
}

function LightCard({
  name,
  enabled,
  intensity,
  colorTemperature,
  expanded,
  onToggle,
  onExpand,
  onIntensityChange,
  onColorTempChange,
}: LightCardProps) {
  const intensityPercent = Math.round(intensity * 100);
  const colorHex = colorTemperatureToHex(colorTemperature);

  return (
    <div className="light-card">
      <div className="light-card-header" onClick={onExpand}>
        <div className="light-card-title-area">
          <span className={`light-card-indicator ${enabled ? 'on' : 'off'}`} />
          <span className="light-card-name">{name}</span>
          <span className={`light-card-expand-icon ${expanded ? 'expanded' : ''}`}>
            ▼
          </span>
        </div>
        <button
          className={`light-card-toggle ${enabled ? 'on' : 'off'}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        >
          <div className="light-card-toggle-thumb" />
        </button>
      </div>

      <div className={`light-card-body ${expanded ? 'expanded' : 'collapsed'}`}>
        <div className="slider-group">
          <div className="slider-label">
            <span>强度</span>
            <span className="slider-value">{intensityPercent}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="200"
            value={intensityPercent}
            onChange={(e) => onIntensityChange(Number(e.target.value) / 100)}
            className="intensity-slider"
            disabled={!enabled}
          />
        </div>

        <div className="slider-group">
          <div className="slider-label">
            <span>色温</span>
            <span className="slider-value">{colorTemperature}K</span>
          </div>
          <input
            type="range"
            min="2000"
            max="6500"
            step="50"
            value={colorTemperature}
            onChange={(e) => onColorTempChange(Number(e.target.value))}
            className="color-temp-slider"
            disabled={!enabled}
          />
          <div
            className="color-preview"
            style={{ backgroundColor: colorHex }}
            title={colorHex}
          />
        </div>
      </div>
    </div>
  );
}

interface ControlPanelProps {
  mode: 'day' | 'night';
  lightConfig: LightConfig;
  expandedCards: Record<keyof LightConfig, boolean>;
  panelOpen: boolean;
  onModeToggle: () => void;
  onLightToggle: (key: keyof LightConfig) => void;
  onLightIntensityChange: (key: keyof LightConfig, value: number) => void;
  onLightColorTempChange: (key: keyof LightConfig, value: number) => void;
  onCardExpand: (key: keyof LightConfig) => void;
  onExport: () => void;
  onPanelToggle: () => void;
}

export default function ControlPanel({
  mode,
  lightConfig,
  expandedCards,
  panelOpen,
  onModeToggle,
  onLightToggle,
  onLightIntensityChange,
  onLightColorTempChange,
  onCardExpand,
  onExport,
  onPanelToggle,
}: ControlPanelProps) {
  const lightKeys = [
    { key: 'main' as const, name: '主光源' },
    { key: 'back' as const, name: '背光源' },
    { key: 'fill' as const, name: '补光源' },
  ];

  return (
    <>
      <button className="panel-toggle-btn" onClick={onPanelToggle}>
        {panelOpen ? '✕' : '☰'}
      </button>

      <div className={`control-panel ${panelOpen ? 'open' : ''}`}>
        <div className="section-title">光照模式</div>
        <button
          className={`day-night-toggle ${mode}`}
          onClick={onModeToggle}
          title="切换日/夜模式"
        >
          <div className="day-night-toggle-thumb">
            {mode === 'day' ? '☀️' : '🌙'}
          </div>
          <span className="day-night-toggle-label day-label mode-label">白天</span>
          <span className="day-night-toggle-label night-label mode-label">夜晚</span>
        </button>

        <div className="section-title" style={{ marginTop: '4px' }}>
          光源控制
        </div>

        {lightKeys.map(({ key, name }) => (
          <LightCard
            key={key}
            name={name}
            lightKey={key}
            enabled={lightConfig[key].enabled}
            intensity={lightConfig[key].intensity}
            colorTemperature={lightConfig[key].colorTemperature}
            expanded={expandedCards[key]}
            onToggle={() => onLightToggle(key)}
            onExpand={() => onCardExpand(key)}
            onIntensityChange={(val) => onLightIntensityChange(key, val)}
            onColorTempChange={(val) => onLightColorTempChange(key, val)}
          />
        ))}

        <div className="section-title" style={{ marginTop: '8px' }}>
          导出
        </div>
        <button className="export-btn" style={{ width: '100%', height: '38px', fontSize: '13px' }} onClick={onExport}>
          💾 导出当前方案
        </button>
      </div>
    </>
  );
}
