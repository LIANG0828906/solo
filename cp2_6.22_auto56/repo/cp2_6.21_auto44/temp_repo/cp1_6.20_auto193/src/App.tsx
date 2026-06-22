import { useEffect, useRef, useState, useCallback } from 'react';
import { SceneManager, ThemeType, CharacterColor } from './scene/SceneManager';
import { WeatherType } from './scene/WeatherParticles';
import {
  Preset,
  ThemeType as PresetTheme,
  WeatherType as PresetWeather,
  CharacterColor as PresetCharacterColor,
  loadPresetList,
  savePreset,
  loadPreset
} from './presets/PresetManager';

const THEME_OPTIONS: { value: ThemeType; label: string }[] = [
  { value: 'forest', label: '森林' },
  { value: 'desert', label: '沙漠' },
  { value: 'snow', label: '雪原' }
];

const WEATHER_OPTIONS: { value: WeatherType; label: string; icon: string }[] = [
  { value: 'sunny', label: '晴天', icon: '☀️' },
  { value: 'rain', label: '雨天', icon: '🌧️' },
  { value: 'snow', label: '雪天', icon: '❄️' },
  { value: 'sandstorm', label: '沙尘暴', icon: '🌪️' }
];

const CHARACTER_COLORS: { value: CharacterColor; label: string }[] = [
  { value: 'red', label: '红色' },
  { value: 'blue', label: '蓝色' },
  { value: 'green', label: '绿色' }
];

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}/${day} ${hours}:${minutes}`;
}

function getWeatherTagClass(weather: string): string {
  switch (weather) {
    case 'sunny': return 'sunny';
    case 'rain': return 'rain';
    case 'snow': return 'snow-weather';
    case 'sandstorm': return 'sandstorm';
    default: return '';
  }
}

function getWeatherLabel(weather: string): string {
  const found = WEATHER_OPTIONS.find(w => w.value === weather);
  return found ? found.label : weather;
}

function getThemeLabel(theme: string): string {
  const found = THEME_OPTIONS.find(t => t.value === theme);
  return found ? found.label : theme;
}

export default function App() {
  const sceneContainerRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);

  const [theme, setTheme] = useState<ThemeType>('forest');
  const [weather, setWeather] = useState<WeatherType>('sunny');
  const [lightAngle, setLightAngle] = useState<number>(45);
  const [lightIntensity, setLightIntensity] = useState<number>(1.0);
  const [characterColor, setCharacterColor] = useState<CharacterColor>('red');

  const [presets, setPresets] = useState<Preset[]>([]);
  const [presetName, setPresetName] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [fps, setFps] = useState<number>(60);

  useEffect(() => {
    if (!sceneContainerRef.current) return;
    const manager = new SceneManager();
    sceneManagerRef.current = manager;
    manager.setup(sceneContainerRef.current, (currentFps) => {
      setFps(currentFps);
    });
    manager.updateLight(45, 1.0);

    const handlePresets = async () => {
      try {
        const list = await loadPresetList();
        setPresets(list);
      } finally {
        setLoading(false);
      }
    };
    handlePresets();

    return () => {
      manager.dispose();
      sceneManagerRef.current = null;
    };
  }, []);

  const handleThemeChange = useCallback((newTheme: ThemeType) => {
    setTheme(newTheme);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.switchTheme(newTheme);
    }
  }, []);

  const handleWeatherChange = useCallback((newWeather: WeatherType) => {
    setWeather(newWeather);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setWeather(newWeather);
    }
  }, []);

  const handleLightAngleChange = useCallback((value: number) => {
    setLightAngle(value);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.updateLight(value, lightIntensity);
    }
  }, [lightIntensity]);

  const handleLightIntensityChange = useCallback((value: number) => {
    setLightIntensity(value);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.updateLight(lightAngle, value);
    }
  }, [lightAngle]);

  const handleCharacterColorChange = useCallback((color: CharacterColor) => {
    setCharacterColor(color);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setCharacterColor(color);
    }
  }, []);

  const handleSavePreset = useCallback(async () => {
    const name = presetName.trim() || `预设 ${presets.length + 1}`;
    setSaving(true);
    try {
      const newPreset = await savePreset(
        name,
        theme as PresetTheme,
        weather as PresetWeather,
        lightAngle,
        lightIntensity,
        characterColor as PresetCharacterColor
      );
      setPresets(prev => [...prev, newPreset]);
      setPresetName('');
    } finally {
      setSaving(false);
    }
  }, [presetName, theme, weather, lightAngle, lightIntensity, characterColor, presets.length]);

  const handleLoadPreset = useCallback((presetId: string) => {
    const preset = loadPreset(presetId);
    if (!preset) return;

    setTheme(preset.theme as ThemeType);
    setWeather(preset.weather as WeatherType);
    setLightAngle(preset.lightAngle);
    setLightIntensity(preset.lightIntensity);
    setCharacterColor(preset.characterColor as CharacterColor);

    if (sceneManagerRef.current) {
      sceneManagerRef.current.switchTheme(preset.theme as ThemeType);
      sceneManagerRef.current.setWeather(preset.weather as WeatherType);
      sceneManagerRef.current.updateLight(preset.lightAngle, preset.lightIntensity);
      sceneManagerRef.current.setCharacterColor(preset.characterColor as CharacterColor);
    }
  }, []);

  return (
    <div className="app-container">
      <aside className="left-panel">
        <div className="panel-header">
          <div className="panel-title">场景预设</div>
          <div className="panel-subtitle">点击卡片一键加载</div>
        </div>
        <div className="panel-content">
          <div className="section">
            <div className="section-label">保存当前场景</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                type="text"
                placeholder="输入预设名称..."
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
              />
              <button
                className="btn btn-primary btn-block"
                onClick={handleSavePreset}
                disabled={saving}
              >
                {saving ? '保存中...' : '保存预设'}
              </button>
            </div>
          </div>
          <div className="section">
            <div className="section-label">已有预设 ({presets.length})</div>
            {loading ? (
              <div className="empty-state">
                <div className="spinner" style={{ margin: '0 auto' }}></div>
              </div>
            ) : presets.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <div className="empty-state-text">暂无预设方案</div>
              </div>
            ) : (
              <div className="preset-grid">
                {presets.map((preset) => (
                  <div
                    key={preset.id}
                    className="preset-card"
                    onClick={() => handleLoadPreset(preset.id)}
                  >
                    <div className="preset-card-title">{preset.name}</div>
                    <div className="preset-card-meta">
                      <span className={`preset-tag ${preset.theme}`}>
                        {getThemeLabel(preset.theme)}
                      </span>
                      <span className={`preset-tag ${getWeatherTagClass(preset.weather)}`}>
                        {getWeatherLabel(preset.weather)}
                      </span>
                    </div>
                    <div className="preset-card-date">
                      {formatDate(preset.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="center-scene" ref={sceneContainerRef}>
        <div className="fps-counter">{fps} FPS</div>
        {saving && (
          <div className="loading-overlay">
            <div className="spinner"></div>
          </div>
        )}
      </main>

      <aside className="right-panel">
        <div className="panel-header">
          <div className="panel-title">场景控制</div>
          <div className="panel-subtitle">实时调节环境参数</div>
        </div>
        <div className="panel-content">
          <div className="section">
            <div className="section-label">环境主题</div>
            <div className="select-wrapper">
              <select
                className="select"
                value={theme}
                onChange={(e) => handleThemeChange(e.target.value as ThemeType)}
              >
                {THEME_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="section">
            <div className="section-label">天气效果</div>
            <div className="btn-group-4">
              {WEATHER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={`btn ${weather === opt.value ? 'active' : ''}`}
                  onClick={() => handleWeatherChange(opt.value)}
                  title={opt.label}
                >
                  <span style={{ marginRight: 4 }}>{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="section">
            <div className="section-label">光照参数</div>
            <div className="slider-group">
              <div className="slider-label">
                <span>光照角度</span>
                <span className="slider-value">{lightAngle}°</span>
              </div>
              <input
                type="range"
                className="slider"
                min={0}
                max={360}
                step={1}
                value={lightAngle}
                onChange={(e) => handleLightAngleChange(Number(e.target.value))}
              />
            </div>
            <div className="slider-group">
              <div className="slider-label">
                <span>光照强度</span>
                <span className="slider-value">{lightIntensity.toFixed(1)}</span>
              </div>
              <input
                type="range"
                className="slider"
                min={0}
                max={2}
                step={0.1}
                value={lightIntensity}
                onChange={(e) => handleLightIntensityChange(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="section">
            <div className="section-label">角色颜色</div>
            <div className="btn-group">
              {CHARACTER_COLORS.map((opt) => (
                <button
                  key={opt.value}
                  className={`btn color-${opt.value} ${characterColor === opt.value ? 'active' : ''}`}
                  onClick={() => handleCharacterColorChange(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
