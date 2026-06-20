import React, { useCallback } from 'react';
import { useParticleStore, PRESET_THEMES } from './particleStore';
import { GalaxyType, GALAXY_TYPE_NAMES } from './types';
import { CustomSlider } from './components/CustomSlider';
import { MiniPreview } from './components/MiniPreview';

export const ParticleControls: React.FC = () => {
  const params = useParticleStore((state) => state.params);
  const fps = useParticleStore((state) => state.fps);
  const activePresetId = useParticleStore((state) => state.activePresetId);
  const setParams = useParticleStore((state) => state.setParams);
  const startTransition = useParticleStore((state) => state.startTransition);
  const applyPreset = useParticleStore((state) => state.applyPreset);
  const isTransitioning = useParticleStore((state) => state.isTransitioning);

  const handleTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newType = e.target.value as GalaxyType;
      if (newType !== params.type && !isTransitioning) {
        startTransition(newType);
      }
    },
    [params.type, isTransitioning, startTransition]
  );

  const handleRotationSpeedChange = useCallback(
    (value: number) => {
      setParams({ rotationSpeed: value });
    },
    [setParams]
  );

  const handleGravityStrengthChange = useCallback(
    (value: number) => {
      setParams({ gravityStrength: value });
    },
    [setParams]
  );

  const handleDispersionRangeChange = useCallback(
    (value: number) => {
      if (!isTransitioning) {
        setParams({ dispersionRange: value });
      }
    },
    [setParams, isTransitioning]
  );

  const handleParticleCountChange = useCallback(
    (value: number) => {
      if (!isTransitioning) {
        setParams({ particleCount: value });
      }
    },
    [setParams, isTransitioning]
  );

  const handlePresetClick = useCallback(
    (preset: typeof PRESET_THEMES[0]) => {
      if (!isTransitioning) {
        applyPreset(preset);
      }
    },
    [applyPreset, isTransitioning]
  );

  return (
    <div className="control-panel">
      <div className="panel-header">
        <h1 className="galaxy-title">
          {GALAXY_TYPE_NAMES[params.type]}
        </h1>
        <div className={`fps-display ${fps >= 30 ? 'fps-high' : 'fps-low'}`}>
          {fps} FPS
        </div>
      </div>

      <div className="param-card">
        <div className="param-label">
          <span>星系形态</span>
        </div>
        <select
          className="galaxy-select"
          value={params.type}
          onChange={handleTypeChange}
          disabled={isTransitioning}
        >
          {Object.values(GalaxyType).map((type) => (
            <option key={type} value={type}>
              {GALAXY_TYPE_NAMES[type]}
            </option>
          ))}
        </select>
      </div>

      <div className="param-card">
        <div className="param-label">
          <span>旋转速度</span>
          <span className="param-value">{params.rotationSpeed}</span>
        </div>
        <CustomSlider
          value={params.rotationSpeed}
          min={0}
          max={100}
          step={1}
          onChange={handleRotationSpeedChange}
        />
      </div>

      <div className="param-card">
        <div className="param-label">
          <span>引力强度</span>
          <span className="param-value">{params.gravityStrength}</span>
        </div>
        <CustomSlider
          value={params.gravityStrength}
          min={0}
          max={100}
          step={1}
          onChange={handleGravityStrengthChange}
        />
      </div>

      <div className="param-card">
        <div className="param-label">
          <span>色散范围</span>
          <span className="param-value">{params.dispersionRange}</span>
        </div>
        <CustomSlider
          value={params.dispersionRange}
          min={0}
          max={100}
          step={1}
          onChange={handleDispersionRangeChange}
        />
      </div>

      <div className="param-card">
        <div className="param-label">
          <span>粒子数量</span>
          <span className="param-value">{params.particleCount}</span>
        </div>
        <CustomSlider
          value={params.particleCount}
          min={500}
          max={5000}
          step={100}
          onChange={handleParticleCountChange}
        />
      </div>

      <div className="presets-container">
        {PRESET_THEMES.map((preset) => (
          <div
            key={preset.id}
            className={`preset-card ${activePresetId === preset.id ? 'active' : ''}`}
            onClick={() => handlePresetClick(preset)}
          >
            <MiniPreview params={preset.params} />
            <span className="preset-name">{preset.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
