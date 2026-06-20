import { useState, useCallback, useEffect } from 'react';
import Scene3D from './components/Scene3D';
import ControlPanel from './components/ControlPanel';
import InfoPanel from './components/InfoPanel';
import { CityParams, HeightDistributionMode, Building } from './modules/BuildingGenerator';
import { CityStats } from './modules/StatsCalculator';

export type DisplayMode = 'normal' | 'heightColor' | 'shadow' | 'heatmap';
export type ViewPreset = 'default' | 'top45' | 'north' | 'east' | 'walk';

function App() {
  const [cityParams, setCityParams] = useState<CityParams>({
    gridSize: 20,
    density: 50,
    minHeight: 10,
    maxHeight: 80,
    heightMode: 'centerHigh',
  });

  const [displayMode, setDisplayMode] = useState<DisplayMode>('normal');
  const [viewPreset, setViewPreset] = useState<ViewPreset>('default');
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [showBuildingModal, setShowBuildingModal] = useState(false);
  const [sunAngle, setSunAngle] = useState(45);
  const [walkSpeed, setWalkSpeed] = useState(20);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [stats, setStats] = useState<CityStats | null>(null);
  const [configs, setConfigs] = useState<any[]>([]);
  const [configName, setConfigName] = useState('');

  const handleParamsChange = useCallback((params: Partial<CityParams>) => {
    setCityParams((prev) => ({ ...prev, ...params }));
    setViewPreset('default');
  }, []);

  const handleHeightModeChange = useCallback((mode: HeightDistributionMode) => {
    setCityParams((prev) => ({ ...prev, heightMode: mode }));
    setViewPreset('default');
  }, []);

  const handleDisplayModeChange = useCallback((mode: DisplayMode) => {
    setDisplayMode(mode);
  }, []);

  const handleViewPresetChange = useCallback((preset: ViewPreset) => {
    setViewPreset(preset);
  }, []);

  const handleBuildingSelect = useCallback((building: Building | null) => {
    setSelectedBuilding(building);
    if (building) {
      setShowBuildingModal(true);
    }
  }, []);

  const handleBuildingHeightChange = useCallback((buildingId: string, newHeight: number) => {
    console.log('Change building height:', buildingId, newHeight);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowBuildingModal(false);
    setSelectedBuilding(null);
  }, []);

  const loadConfigs = useCallback(async () => {
    try {
      const response = await fetch('/api/configs');
      const data = await response.json();
      setConfigs(data);
    } catch (error) {
      console.error('Failed to load configs:', error);
    }
  }, []);

  const handleSaveConfig = useCallback(async () => {
    if (!configName.trim()) return;
    try {
      const response = await fetch('/api/configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: configName, params: cityParams }),
      });
      if (response.ok) {
        setConfigName('');
        loadConfigs();
      }
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  }, [configName, cityParams, loadConfigs]);

  const handleLoadConfig = useCallback((config: any) => {
    setCityParams(config.params);
    setViewPreset('default');
  }, []);

  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  return (
    <div className="app-container">
      <div className="top-toolbar">
        <button
          className={`tool-btn ${viewPreset === 'top45' ? 'active' : ''}`}
          onClick={() => handleViewPresetChange('top45')}
          title="俯视45度"
        >
          <svg viewBox="0 0 24 24">
            <path d="M12 3L3 8v8l9 5 9-5V8L12 3z" />
            <path d="M3 8l9 5 9-5" />
            <path d="M12 13v8" />
          </svg>
          <span>俯视</span>
        </button>
        <button
          className={`tool-btn ${viewPreset === 'north' ? 'active' : ''}`}
          onClick={() => handleViewPresetChange('north')}
          title="正北视角"
        >
          <svg viewBox="0 0 24 24">
            <path d="M12 2L4 12h5v8h6v-8h5L12 2z" />
          </svg>
          <span>正北</span>
        </button>
        <button
          className={`tool-btn ${viewPreset === 'east' ? 'active' : ''}`}
          onClick={() => handleViewPresetChange('east')}
          title="正东视角"
        >
          <svg viewBox="0 0 24 24">
            <path d="M2 12l10-10v5h8v10h-8v5L2 12z" />
          </svg>
          <span>正东</span>
        </button>
        <button
          className={`tool-btn ${viewPreset === 'walk' ? 'active' : ''}`}
          onClick={() => handleViewPresetChange('walk')}
          title="城市漫游"
        >
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="4" r="2" />
            <path d="M12 8v5" />
            <path d="M8 12l4 2 4-2" />
            <path d="M10 22l2-6 2 6" />
          </svg>
          <span>漫游</span>
        </button>
      </div>

      <ControlPanel
        params={cityParams}
        displayMode={displayMode}
        sunAngle={sunAngle}
        walkSpeed={walkSpeed}
        onParamsChange={handleParamsChange}
        onHeightModeChange={handleHeightModeChange}
        onDisplayModeChange={handleDisplayModeChange}
        onSunAngleChange={setSunAngle}
        onWalkSpeedChange={setWalkSpeed}
        collapsed={leftPanelCollapsed}
        onToggleCollapse={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
        configs={configs}
        configName={configName}
        onConfigNameChange={setConfigName}
        onSaveConfig={handleSaveConfig}
        onLoadConfig={handleLoadConfig}
      />

      <InfoPanel
        stats={stats}
        selectedBuilding={selectedBuilding}
        showModal={showBuildingModal}
        onCloseModal={handleCloseModal}
        onHeightChange={handleBuildingHeightChange}
        collapsed={rightPanelCollapsed}
        onToggleCollapse={() => setRightPanelCollapsed(!rightPanelCollapsed)}
      />

      <div className="canvas-container">
        <Scene3D
          params={cityParams}
          displayMode={displayMode}
          viewPreset={viewPreset}
          sunAngle={sunAngle}
          walkSpeed={walkSpeed}
          onBuildingSelect={handleBuildingSelect}
          onStatsUpdate={setStats}
          onBuildingHeightChange={handleBuildingHeightChange}
        />
      </div>
    </div>
  );
}

export default App;
