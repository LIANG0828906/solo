import React, { useEffect, useRef, useState, useCallback } from 'react';
import { WeatherEffectSystem } from './WeatherEffectSystem';
import {
  WeatherType,
  BlendConfig,
  RuntimeParams,
  WEATHER_PRESETS,
  WEATHER_LIST,
  DEFAULT_RUNTIME_PARAMS,
  DEFAULT_BLEND_CONFIG,
} from './WeatherConfig';

const WeatherApp: React.FC = () => {
  const sceneRef = useRef<HTMLDivElement>(null);
  const systemRef = useRef<WeatherEffectSystem | null>(null);

  const [currentWeather, setCurrentWeather] = useState<WeatherType>('rain');
  const [blendConfig, setBlendConfig] = useState<BlendConfig>({
    ...DEFAULT_BLEND_CONFIG,
  });
  const [runtimeParams, setRuntimeParams] = useState<RuntimeParams>({
    ...DEFAULT_RUNTIME_PARAMS,
  });
  const [fps, setFps] = useState<number>(60);
  const [isBlendMode, setIsBlendMode] = useState<boolean>(false);

  useEffect(() => {
    if (!sceneRef.current) return;
    const system = new WeatherEffectSystem(sceneRef.current, (f) => setFps(f));
    systemRef.current = system;
    return () => {
      system.dispose();
      systemRef.current = null;
    };
  }, []);

  const handleWeatherClick = useCallback((type: WeatherType) => {
    setCurrentWeather(type);
    setIsBlendMode(false);
    setBlendConfig((prev) => ({ ...prev, enabled: false }));
    systemRef.current?.setWeather(type, true);
  }, []);

  const handleBlendModeToggle = useCallback(() => {
    const newEnabled = !isBlendMode;
    setIsBlendMode(newEnabled);
    const cfg: BlendConfig = {
      ...blendConfig,
      enabled: newEnabled,
    };
    setBlendConfig(cfg);
    systemRef.current?.setBlendConfig(cfg);
    if (!newEnabled) {
      systemRef.current?.setWeather(currentWeather, true);
    }
  }, [isBlendMode, blendConfig, currentWeather]);

  const handleBlendWeatherA = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const w = e.target.value as WeatherType;
      const cfg: BlendConfig = { ...blendConfig, weatherA: w };
      setBlendConfig(cfg);
      if (cfg.enabled) systemRef.current?.setBlendConfig(cfg);
    },
    [blendConfig]
  );

  const handleBlendWeatherB = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const w = e.target.value as WeatherType;
      const cfg: BlendConfig = { ...blendConfig, weatherB: w };
      setBlendConfig(cfg);
      if (cfg.enabled) systemRef.current?.setBlendConfig(cfg);
    },
    [blendConfig]
  );

  const handleRatioChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const ratio = parseFloat(e.target.value) / 100;
      const cfg: BlendConfig = { ...blendConfig, ratio };
      setBlendConfig(cfg);
      if (cfg.enabled) systemRef.current?.setBlendConfig(cfg);
    },
    [blendConfig]
  );

  const handleDensity = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = parseFloat(e.target.value);
      const mapped = v / 1000;
      setRuntimeParams((p) => ({ ...p, densityMultiplier: mapped }));
      systemRef.current?.setRuntimeParams({ densityMultiplier: mapped });
    },
    []
  );

  const handleSpeed = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = parseFloat(e.target.value);
      setRuntimeParams((p) => ({ ...p, speedMultiplier: v }));
      systemRef.current?.setRuntimeParams({ speedMultiplier: v });
    },
    []
  );

  const handleWind = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = parseFloat(e.target.value);
      setRuntimeParams((p) => ({ ...p, windAngle: v }));
      systemRef.current?.setRuntimeParams({ windAngle: v });
    },
    []
  );

  const handleSize = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = parseFloat(e.target.value);
      const mapped = v * 10;
      setRuntimeParams((p) => ({ ...p, sizeMultiplier: mapped }));
      systemRef.current?.setRuntimeParams({ sizeMultiplier: mapped });
    },
    []
  );

  const handleBrightness = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = parseFloat(e.target.value);
      setRuntimeParams((p) => ({ ...p, brightnessMultiplier: v }));
      systemRef.current?.setRuntimeParams({ brightnessMultiplier: v });
    },
    []
  );

  const densityDisplay = Math.round(runtimeParams.densityMultiplier * 1000);
  const sizeDisplay = Math.round(runtimeParams.sizeMultiplier * 100) / 1000;

  return (
    <div style={styles.root}>
      <aside style={styles.panel}>
        <div style={styles.header}>
          <div style={styles.title}>🌤️ 天气实验室</div>
          <div style={styles.subtitle}>Weather Lab 3D</div>
        </div>

        <section style={styles.section}>
          <div style={styles.sectionTitle}>预设天气</div>
          <div style={styles.buttonGroup}>
            {WEATHER_LIST.map((type) => {
              const preset = WEATHER_PRESETS[type];
              const active = !isBlendMode && currentWeather === type;
              return (
                <button
                  key={type}
                  onClick={() => handleWeatherClick(type)}
                  style={{
                    ...styles.weatherButton,
                    ...(active ? styles.weatherButtonActive : {}),
                  }}
                  onMouseDown={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform =
                      'scale(0.95)';
                  }}
                  onMouseUp={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform =
                      'scale(1)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform =
                      'scale(1)';
                  }}
                >
                  <span style={styles.buttonIcon}>{preset.icon}</span>
                  <span style={styles.buttonText}>{preset.name}</span>
                </button>
              );
            })}
          </div>
        </section>

        <div style={styles.divider} />

        <section style={styles.section}>
          <div style={styles.sectionTitle}>
            组合模式
            <label style={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={isBlendMode}
                onChange={handleBlendModeToggle}
                style={styles.toggleInput}
              />
              <span style={styles.toggleSwitch} />
            </label>
          </div>

          <div style={styles.blendRow}>
            <div style={styles.blendItem}>
              <label style={styles.blendLabel}>天气 A</label>
              <select
                value={blendConfig.weatherA}
                onChange={handleBlendWeatherA}
                disabled={!isBlendMode}
                style={{
                  ...styles.select,
                  ...(!isBlendMode ? styles.selectDisabled : {}),
                }}
              >
                {WEATHER_LIST.map((t) => (
                  <option key={t} value={t}>
                    {WEATHER_PRESETS[t].icon} {WEATHER_PRESETS[t].name}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.blendItem}>
              <label style={styles.blendLabel}>天气 B</label>
              <select
                value={blendConfig.weatherB}
                onChange={handleBlendWeatherB}
                disabled={!isBlendMode}
                style={{
                  ...styles.select,
                  ...(!isBlendMode ? styles.selectDisabled : {}),
                }}
              >
                {WEATHER_LIST.map((t) => (
                  <option key={t} value={t}>
                    {WEATHER_PRESETS[t].icon} {WEATHER_PRESETS[t].name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div
            style={{
              ...styles.sliderContainer,
              ...(!isBlendMode ? styles.sliderContainerDisabled : {}),
            }}
          >
            <div style={styles.sliderHeader}>
              <span style={styles.sliderLabel}>混合比例</span>
              <span style={styles.sliderValue}>
                {Math.round(blendConfig.ratio * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={Math.round(blendConfig.ratio * 100)}
              onChange={handleRatioChange}
              disabled={!isBlendMode}
              style={styles.slider}
            />
            <div style={styles.sliderLegend}>
              <span>{WEATHER_PRESETS[blendConfig.weatherA].icon}</span>
              <span>{WEATHER_PRESETS[blendConfig.weatherB].icon}</span>
            </div>
          </div>
        </section>

        <div style={styles.divider} />

        <section style={styles.section}>
          <div style={styles.sectionTitle}>参数调节</div>

          <div style={styles.sliderContainer}>
            <div style={styles.sliderHeader}>
              <span style={styles.sliderLabel}>💧 粒子密度</span>
              <span style={styles.sliderValue}>{densityDisplay}</span>
            </div>
            <input
              type="range"
              min="100"
              max="5000"
              step="50"
              value={densityDisplay}
              onChange={handleDensity}
              style={styles.slider}
            />
          </div>

          <div style={styles.sliderContainer}>
            <div style={styles.sliderHeader}>
              <span style={styles.sliderLabel}>⚡ 下落速度</span>
              <span style={styles.sliderValue}>
                {runtimeParams.speedMultiplier.toFixed(2)}x
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.05"
              value={runtimeParams.speedMultiplier}
              onChange={handleSpeed}
              style={styles.slider}
            />
          </div>

          <div style={styles.sliderContainer}>
            <div style={styles.sliderHeader}>
              <span style={styles.sliderLabel}>🌬️ 风力方向</span>
              <span style={styles.sliderValue}>
                {Math.round(runtimeParams.windAngle)}°
              </span>
            </div>
            <input
              type="range"
              min="-90"
              max="90"
              step="1"
              value={runtimeParams.windAngle}
              onChange={handleWind}
              style={styles.slider}
            />
          </div>

          <div style={styles.sliderContainer}>
            <div style={styles.sliderHeader}>
              <span style={styles.sliderLabel}>📏 粒子大小</span>
              <span style={styles.sliderValue}>
                {sizeDisplay.toFixed(2)}x
              </span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.5"
              step="0.01"
              value={sizeDisplay}
              onChange={handleSize}
              style={styles.slider}
            />
          </div>

          <div style={styles.sliderContainer}>
            <div style={styles.sliderHeader}>
              <span style={styles.sliderLabel}>☀️ 场景亮度</span>
              <span style={styles.sliderValue}>
                {runtimeParams.brightnessMultiplier.toFixed(2)}x
              </span>
            </div>
            <input
              type="range"
              min="0.2"
              max="1.5"
              step="0.05"
              value={runtimeParams.brightnessMultiplier}
              onChange={handleBrightness}
              style={styles.slider}
            />
          </div>
        </section>

        <div style={styles.footer}>
          <div style={styles.fpsBadge}>
            <span
              style={{
                ...styles.fpsDot,
                backgroundColor: fps >= 50 ? '#4CAF50' : fps >= 40 ? '#FF9800' : '#F44336',
              }}
            />
            <span style={styles.fpsText}>FPS: {fps}</span>
          </div>
          <div style={styles.currentBadge}>
            {isBlendMode
              ? `${WEATHER_PRESETS[blendConfig.weatherA].icon}↔${
                  WEATHER_PRESETS[blendConfig.weatherB].icon
                }`
              : WEATHER_PRESETS[currentWeather].icon +
                ' ' +
                WEATHER_PRESETS[currentWeather].name}
          </div>
        </div>
      </aside>

      <main ref={sceneRef} style={styles.scene} />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex',
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: '#0a0a0f',
  },
  panel: {
    width: '280px',
    minWidth: '280px',
    height: '100%',
    backgroundColor: 'rgba(15, 15, 26, 0.9)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    borderRight: '1px solid rgba(255, 255, 255, 0.06)',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    padding: '16px',
    gap: '8px',
    zIndex: 10,
    boxShadow: '4px 0 20px rgba(0, 0, 0, 0.3)',
  },
  header: {
    marginBottom: '12px',
    paddingBottom: '12px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  },
  title: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#FFFFFF',
    letterSpacing: '0.5px',
  },
  subtitle: {
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: '2px',
    letterSpacing: '1px',
    textTransform: 'uppercase',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  sectionTitle: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'rgba(255, 215, 0, 0.9)',
    letterSpacing: '0.5px',
    marginBottom: '2px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  weatherButton: {
    width: '100%',
    maxWidth: '200px',
    alignSelf: 'center',
    height: '44px',
    backgroundColor: '#2D2D44',
    color: '#FFFFFF',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    transition: 'background-color 0.15s ease, border-color 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease',
    outline: 'none',
    padding: '0 16px',
    fontFamily: 'inherit',
  },
  weatherButtonActive: {
    backgroundColor: '#3D3D55',
    borderColor: '#FFD700',
    boxShadow: '0 0 0 2px rgba(255, 215, 0, 0.15), 0 4px 12px rgba(255, 215, 0, 0.1)',
  },
  buttonIcon: {
    fontSize: '18px',
    lineHeight: 1,
  },
  buttonText: {
    fontSize: '14px',
  },
  divider: {
    height: '20px',
    margin: '4px 0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    cursor: 'pointer',
    position: 'relative',
    userSelect: 'none',
  },
  toggleInput: {
    position: 'absolute',
    opacity: 0,
    width: 0,
    height: 0,
  },
  toggleSwitch: {
    width: '36px',
    height: '20px',
    backgroundColor: '#2D2D44',
    borderRadius: '10px',
    position: 'relative',
    transition: 'background-color 0.2s ease',
    display: 'inline-block',
  },
  blendRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '4px',
  },
  blendItem: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  blendLabel: {
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  select: {
    width: '100%',
    height: '34px',
    backgroundColor: '#1A1A2E',
    color: '#FFFFFF',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '0 10px',
    fontSize: '12px',
    cursor: 'pointer',
    outline: 'none',
    appearance: 'none',
    fontFamily: 'inherit',
  },
  selectDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  sliderContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    padding: '8px 10px',
    backgroundColor: 'rgba(26, 26, 46, 0.5)',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.04)',
  },
  sliderContainerDisabled: {
    opacity: 0.5,
    pointerEvents: 'none',
  },
  sliderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderLabel: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  sliderValue: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#FFD700',
    fontFamily: '"SF Mono", Consolas, monospace',
    minWidth: '40px',
    textAlign: 'right',
  },
  slider: {
    width: '100%',
    maxWidth: '180px',
    alignSelf: 'center',
    height: '6px',
    WebkitAppearance: 'none',
    appearance: 'none',
    background: 'rgba(26, 26, 46, 0.8)',
    borderRadius: '3px',
    outline: 'none',
    cursor: 'pointer',
    padding: 0,
    margin: 0,
  },
  sliderLegend: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    opacity: 0.8,
    padding: '0 20px',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: '16px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '8px',
  },
  fpsBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '6px',
  },
  fpsDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    animation: 'pulse 2s ease-in-out infinite',
  },
  fpsText: {
    fontSize: '11px',
    fontFamily: '"SF Mono", Consolas, monospace',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  currentBadge: {
    fontSize: '13px',
    color: '#FFFFFF',
    padding: '4px 12px',
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    borderRadius: '6px',
    border: '1px solid rgba(255, 215, 0, 0.2)',
  },
  scene: {
    flex: 1,
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    cursor: 'grab',
  },
};

const sliderCss = `
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #FFD700;
    cursor: pointer;
    box-shadow: 0 0 8px rgba(255, 215, 0, 0.5), 0 2px 6px rgba(0,0,0,0.3);
    border: 2px solid #FFFFFF;
    transition: transform 0.1s ease;
  }
  input[type="range"]::-webkit-slider-thumb:hover {
    transform: scale(1.1);
  }
  input[type="range"]::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #FFD700;
    cursor: pointer;
    box-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
    border: 2px solid #FFFFFF;
  }
  input[type="range"]:disabled::-webkit-slider-thumb {
    background: #666;
    box-shadow: none;
    cursor: not-allowed;
  }
  input[type="range"]:disabled::-moz-range-thumb {
    background: #666;
    box-shadow: none;
    cursor: not-allowed;
  }
  button:hover {
    background-color: #3D3D55 !important;
  }
  label input[type="checkbox"]:checked + span {
    background-color: #FFD700 !important;
  }
  label input[type="checkbox"]:checked + span::before {
    transform: translateX(16px);
    background-color: #1A1A2E;
  }
  label span::before {
    content: '';
    position: absolute;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background-color: #FFFFFF;
    top: 2px;
    left: 2px;
    transition: transform 0.2s ease;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  ::-webkit-scrollbar {
    width: 6px;
  }
  ::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.02);
  }
  ::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 3px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.25);
  }
`;

const StyleInjector: React.FC = () => {
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = sliderCss;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  return null;
};

const WeatherAppWithStyles: React.FC = () => (
  <>
    <StyleInjector />
    <WeatherApp />
  </>
);

export default WeatherAppWithStyles;
