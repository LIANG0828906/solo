import { useState, useCallback } from 'react';
import { useAppStore } from './store';
import { DataProcessor } from './DataProcessor';
import type { PresetType } from './types';
import './styles.css';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
}

function CollapsibleSection({ title, children, defaultCollapsed = false }: CollapsibleSectionProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div className="section">
      <div className="section-header" onClick={() => setCollapsed(!collapsed)}>
        <span className="section-title">{title}</span>
        <svg
          className={`section-arrow ${collapsed ? 'collapsed' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
      {!collapsed && <div className="section-content">{children}</div>}
    </div>
  );
}

interface ColorThemeButtonProps {
  lowColor: string;
  highColor: string;
  active: boolean;
  onClick: () => void;
}

function ColorThemeButton({ lowColor, highColor, active, onClick }: ColorThemeButtonProps) {
  return (
    <button
      className={`color-theme-btn ${active ? 'active' : ''}`}
      onClick={onClick}
      style={{
        background: `linear-gradient(to right, ${lowColor}, ${highColor})`,
      }}
      aria-label={`颜色主题 ${lowColor} 到 ${highColor}`}
    />
  );
}

const presetOptions: { id: PresetType; name: string; description: string }[] = [
  { id: 'hills', name: '简单山丘', description: '正弦波合成地形' },
  { id: 'mountains', name: '复杂山脉', description: 'Perlin噪声生成地形' },
  { id: 'craters', name: '随机凹陷', description: '随机高斯分布地形' },
];

export default function ControlPanel() {
  const {
    selectedPreset,
    colorTheme,
    colorThemes,
    isLoading,
    setSelectedPreset,
    setColorTheme,
    setTerrainData,
    setIsLoading,
    setError,
    triggerCameraReset,
  } = useAppStore();

  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsLoading(true);
      setError(null);
      setFileName(file.name);
      setSelectedPreset(null);

      try {
        const points = await DataProcessor.parseCSV(file);
        const terrainData = DataProcessor.generateTerrainData(points, colorTheme);
        setTerrainData(terrainData);
        triggerCameraReset();
      } catch (error) {
        setError(error instanceof Error ? error.message : '文件上传失败');
        setFileName(null);
      } finally {
        setIsLoading(false);
      }

      event.target.value = '';
    },
    [colorTheme, setIsLoading, setError, setSelectedPreset, setTerrainData, triggerCameraReset]
  );

  const handlePresetSelect = useCallback(
    async (presetId: PresetType) => {
      setIsLoading(true);
      setError(null);
      setSelectedPreset(presetId);
      setFileName(null);

      try {
        await new Promise((resolve) => setTimeout(resolve, 100));
        const points = DataProcessor.generatePresetData(presetId);
        const terrainData = DataProcessor.generateTerrainData(points, colorTheme);
        setTerrainData(terrainData);
        triggerCameraReset();
      } catch (error) {
        setError(error instanceof Error ? error.message : '数据集加载失败');
        setSelectedPreset(null);
      } finally {
        setIsLoading(false);
      }
    },
    [colorTheme, setIsLoading, setError, setSelectedPreset, setTerrainData, triggerCameraReset]
  );

  const handleColorThemeChange = useCallback(
    async (themeId: string) => {
      const theme = colorThemes.find((t) => t.id === themeId);
      if (!theme) return;

      setColorTheme(theme);

      const currentTerrain = useAppStore.getState().terrainData;
      const currentPreset = useAppStore.getState().selectedPreset;

      if (currentTerrain && currentPreset) {
        setIsLoading(true);
        try {
          const points = DataProcessor.generatePresetData(currentPreset);
          const terrainData = DataProcessor.generateTerrainData(points, theme);
          setTerrainData(terrainData);
        } catch (error) {
          setError(error instanceof Error ? error.message : '颜色主题更新失败');
        } finally {
          setIsLoading(false);
        }
      } else if (currentTerrain && fileName) {
        setError('请重新上传文件以应用新的颜色主题');
      }
    },
    [colorThemes, setColorTheme, setIsLoading, setError, setTerrainData]
  );

  const handleResetCamera = useCallback(() => {
    triggerCameraReset();
  }, [triggerCameraReset]);

  return (
    <div className="control-panel">
      <h1 className="panel-title">数据地貌</h1>

      <CollapsibleSection title="数据上传" defaultCollapsed={false}>
        <button className="upload-btn" disabled={isLoading}>
          {isLoading ? '加载中...' : '上传CSV文件'}
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={isLoading}
          />
        </button>
        {fileName && <div className="file-name">已加载: {fileName}</div>}
      </CollapsibleSection>

      <CollapsibleSection title="预设数据集" defaultCollapsed={false}>
        <div className="preset-buttons">
          {presetOptions.map((preset) => (
            <button
              key={preset.id}
              className={`preset-btn ${selectedPreset === preset.id ? 'active' : ''}`}
              onClick={() => handlePresetSelect(preset.id)}
              disabled={isLoading}
            >
              <div style={{ fontWeight: 600 }}>{preset.name}</div>
              <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>
                {preset.description}
              </div>
            </button>
          ))}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="颜色主题" defaultCollapsed={false}>
        <div className="color-theme-container">
          {colorThemes.map((theme) => (
            <ColorThemeButton
              key={theme.id}
              lowColor={theme.lowColor}
              highColor={theme.highColor}
              active={colorTheme.id === theme.id}
              onClick={() => handleColorThemeChange(theme.id)}
            />
          ))}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="视角控制" defaultCollapsed={true}>
        <button className="reset-btn" onClick={handleResetCamera}>
          重置视角
        </button>
        <div style={{ marginTop: 12, fontSize: 11, color: '#8888aa', lineHeight: 1.6 }}>
          <div>🖱️ 左键拖拽：旋转视角</div>
          <div>🔍 滚轮：缩放</div>
          <div>➡️ 右键拖拽：平移</div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="CSV格式说明" defaultCollapsed={true}>
        <div style={{ fontSize: 11, color: '#8888aa', lineHeight: 1.6 }}>
          <p style={{ marginBottom: 8, color: '#ccccdd' }}>CSV文件需包含以下列：</p>
          <code
            style={{
              display: 'block',
              background: 'rgba(0,0,0,0.3)',
              padding: 8,
              borderRadius: 4,
              fontFamily: 'monospace',
              color: '#3b82f6',
            }}
          >
            x,y,value
            <br />
            -10,-10,0.5
            <br />
            -10,-9,0.3
            <br />
            ...
          </code>
          <p style={{ marginTop: 8 }}>x和y为坐标值，value为该点的数值</p>
        </div>
      </CollapsibleSection>
    </div>
  );
}
