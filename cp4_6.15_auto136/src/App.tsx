import { useState, useEffect, useRef, useCallback } from 'react';
import Scene from './components/Scene';
import ControlPanel from './components/ControlPanel';
import {
  LightConfig,
  getDefaultDayConfig,
  getDefaultNightConfig,
  getPresetConfig,
  interpolateLightConfig,
  exportConfigToJSON,
} from './utils/lightUtils';

type Mode = 'day' | 'night';
type LightKey = keyof LightConfig;

const TRANSITION_DURATION = 2000;

export default function App() {
  const [mode, setMode] = useState<Mode>('day');
  const [lightConfig, setLightConfig] = useState<LightConfig>(getDefaultDayConfig());
  const [transitionProgress, setTransitionProgress] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);

  const [expandedCards, setExpandedCards] = useState<Record<LightKey, boolean>>({
    main: true,
    back: false,
    fill: false,
  });

  const [activePreset, setActivePreset] = useState<string | null>(null);

  const transitionRef = useRef<number | null>(null);
  const startConfigRef = useRef<LightConfig>(getDefaultDayConfig());
  const endConfigRef = useRef<LightConfig>(getDefaultDayConfig());

  const animateTransition = useCallback((fromConfig: LightConfig, toConfig: LightConfig) => {
    if (transitionRef.current) {
      cancelAnimationFrame(transitionRef.current);
    }

    startConfigRef.current = fromConfig;
    endConfigRef.current = toConfig;

    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const t = Math.min(1, elapsed / TRANSITION_DURATION);

      const interpolated = interpolateLightConfig(
        startConfigRef.current,
        endConfigRef.current,
        t
      );
      setLightConfig(interpolated);

      const isDayToNight =
        endConfigRef.current.main.colorTemperature <
        startConfigRef.current.main.colorTemperature;
      setTransitionProgress(isDayToNight ? t : 1 - t);

      if (t < 1) {
        transitionRef.current = requestAnimationFrame(animate);
      } else {
        transitionRef.current = null;
      }
    };

    transitionRef.current = requestAnimationFrame(animate);
  }, []);

  const handleModeToggle = useCallback(() => {
    const newMode = mode === 'day' ? 'night' : 'day';
    const targetConfig =
      newMode === 'day' ? getDefaultDayConfig() : getDefaultNightConfig();

    setMode(newMode);
    setActivePreset(null);
    animateTransition(lightConfig, targetConfig);
  }, [mode, lightConfig, animateTransition]);

  const handleLightToggle = useCallback(
    (key: LightKey) => {
      setLightConfig((prev) => ({
        ...prev,
        [key]: { ...prev[key], enabled: !prev[key].enabled },
      }));
    },
    []
  );

  const handleLightIntensityChange = useCallback((key: LightKey, value: number) => {
    setLightConfig((prev) => ({
      ...prev,
      [key]: { ...prev[key], intensity: value },
    }));
    setActivePreset(null);
  }, []);

  const handleLightColorTempChange = useCallback((key: LightKey, value: number) => {
    setLightConfig((prev) => ({
      ...prev,
      [key]: { ...prev[key], colorTemperature: value },
    }));
    setActivePreset(null);
  }, []);

  const handleLightPositionChange = useCallback(
    (key: LightKey, position: [number, number, number]) => {
      setLightConfig((prev) => ({
        ...prev,
        [key]: { ...prev[key], position },
      }));
      setActivePreset(null);
    },
    []
  );

  const handleCardExpand = useCallback((key: LightKey) => {
    setExpandedCards((prev) => ({
      main: key === 'main' ? !prev.main : prev.main,
      back: key === 'back' ? !prev.back : prev.back,
      fill: key === 'fill' ? !prev.fill : prev.fill,
    }));
  }, []);

  const handlePresetSelect = useCallback(
    (presetKey: string) => {
      const targetConfig = getPresetConfig(presetKey);
      setActivePreset(presetKey);
      animateTransition(lightConfig, targetConfig);
    },
    [lightConfig, animateTransition]
  );

  const handleExport = useCallback(() => {
    const json = exportConfigToJSON(lightConfig, mode);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `light-design-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [lightConfig, mode]);

  const handlePanelToggle = useCallback(() => {
    setPanelOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    return () => {
      if (transitionRef.current) {
        cancelAnimationFrame(transitionRef.current);
      }
    };
  }, []);

  const presets = [
    { key: 'warm', name: '温馨暖居' },
    { key: 'office', name: '冷峻办公' },
    { key: 'party', name: '梦幻派对' },
  ];

  return (
    <div className="app-container">
      <div className="top-bar">
        <div className="top-bar-title">🏠 3D灯光设计预览</div>
        <div className="top-bar-actions">
          <button
            className={`day-night-toggle ${mode}`}
            onClick={handleModeToggle}
            title="切换日/夜模式"
          >
            <div className="day-night-toggle-thumb">
              {mode === 'day' ? '☀️' : '🌙'}
            </div>
            <span className="day-night-toggle-label day-label mode-label">白天</span>
            <span className="day-night-toggle-label night-label mode-label">夜晚</span>
          </button>
          <button
            className="export-btn"
            onClick={handleExport}
            title="导出当前方案"
          >
            💾
          </button>
        </div>
      </div>

      <div className="main-content">
        <div className="scene-area">
          <Scene
            lightConfig={lightConfig}
            mode={mode}
            transitionProgress={transitionProgress}
            onLightPositionChange={handleLightPositionChange}
          />
        </div>

        <ControlPanel
          mode={mode}
          lightConfig={lightConfig}
          expandedCards={expandedCards}
          panelOpen={panelOpen}
          onModeToggle={handleModeToggle}
          onLightToggle={handleLightToggle}
          onLightIntensityChange={handleLightIntensityChange}
          onLightColorTempChange={handleLightColorTempChange}
          onCardExpand={handleCardExpand}
          onExport={handleExport}
          onPanelToggle={handlePanelToggle}
        />
      </div>

      <div className="bottom-bar">
        {presets.map((preset) => (
          <button
            key={preset.key}
            className={`preset-card ${activePreset === preset.key ? 'active' : ''}`}
            onClick={() => handlePresetSelect(preset.key)}
          >
            {preset.name}
          </button>
        ))}
        <button className="save-btn" onClick={handleExport}>
          保存当前方案
        </button>
      </div>
    </div>
  );
}
