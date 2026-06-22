import { useState, useCallback, useRef, useEffect } from 'react';
import HSVRing from './components/HSVRing';
import Scene from './components/Scene';
import SunControl from './components/SunControl';
import ShadowViewer from './components/ShadowViewer';
import { BuildingBlock, DEFAULT_BUILDINGS, SHADOW_COLOR_PRESETS } from './data/buildingData';
import './App.css';

export interface SunParams {
  azimuth: number;
  altitude: number;
  shadowSoftness: number;
  shadowIntensity: number;
  shadowColor: string;
}

export interface SceneRef {
  updateSun: (params: SunParams) => void;
  updateBuilding: (id: string, updates: Partial<BuildingBlock>) => void;
  getShadowCanvas: () => HTMLCanvasElement | null;
}

function App() {
  const [buildings, setBuildings] = useState<BuildingBlock[]>(DEFAULT_BUILDINGS);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [sunParams, setSunParams] = useState<SunParams>({
    azimuth: 135,
    altitude: 45,
    shadowSoftness: 2,
    shadowIntensity: 0.6,
    shadowColor: SHADOW_COLOR_PRESETS[0].value
  });
  const [autoRotate, setAutoRotate] = useState(false);
  const [autoRotateProgress, setAutoRotateProgress] = useState(0);
  const [panels, setPanels] = useState({
    sun: true,
    building: true,
    shadow: true
  });
  const [isDragging, setIsDragging] = useState(false);

  const shadowCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<SceneRef>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const fixedAltitudeRef = useRef<number>(sunParams.altitude);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 0;
    canvas.height = 0;
    shadowCanvasRef.current = canvas;
    return () => {
      shadowCanvasRef.current = null;
    };
  }, []);

  const updateSunParams = useCallback((updates: Partial<SunParams>) => {
    setSunParams(prev => {
      const next = { ...prev, ...updates };
      sceneRef.current?.updateSun(next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (autoRotate) {
      fixedAltitudeRef.current = sunParams.altitude;
      startTimeRef.current = performance.now();
      const cycleDuration = 30000;

      const animate = (now: number) => {
        const elapsed = now - startTimeRef.current;
        const progress = (elapsed % cycleDuration) / cycleDuration;
        const newAzimuth = progress * 360;
        setAutoRotateProgress(progress);
        setSunParams(prev => {
          const next = { ...prev, azimuth: newAzimuth, altitude: fixedAltitudeRef.current };
          sceneRef.current?.updateSun(next);
          return next;
        });
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      setAutoRotateProgress(0);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [autoRotate]);

  const handleBuildingUpdate = useCallback((id: string, updates: Partial<BuildingBlock>) => {
    setBuildings(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    sceneRef.current?.updateBuilding(id, updates);
  }, []);

  const handleBuildingClick = useCallback((id: string | null) => {
    setSelectedBuildingId(id);
  }, []);

  const togglePanel = useCallback((panel: keyof typeof panels) => {
    setPanels(prev => ({ ...prev, [panel]: !prev[panel] }));
  }, []);

  const selectedBuilding = buildings.find(b => b.id === selectedBuildingId) || null;

  const hueAngle = sunParams.azimuth;

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <h1 className="app-title">☀️ 阳光模拟器</h1>
          <p className="app-subtitle">建筑与景观光照分析</p>
        </div>

        <div className={`panel ${panels.sun ? 'expanded' : 'collapsed'}`}>
          <div className="panel-header" onClick={() => togglePanel('sun')}>
            <span className="panel-icon">🌞</span>
            <span className="panel-title">太阳控制</span>
            <span className={`panel-arrow ${panels.sun ? 'up' : ''}`}>▼</span>
          </div>
          <div className="panel-content">
            <SunControl
              sunParams={sunParams}
              onUpdate={updateSunParams}
              autoRotate={autoRotate}
              onToggleAutoRotate={() => setAutoRotate(v => !v)}
              autoRotateProgress={autoRotateProgress}
            />
          </div>
        </div>

        <div className={`panel ${panels.building ? 'expanded' : 'collapsed'}`}>
          <div className="panel-header" onClick={() => togglePanel('building')}>
            <span className="panel-icon">🏢</span>
            <span className="panel-title">建筑控制</span>
            <span className={`panel-arrow ${panels.building ? 'up' : ''}`}>▼</span>
          </div>
          <div className="panel-content">
            <div className="building-hint">
              💡 提示：点击建筑选中后，可在3D视图中直接拖拽调整位置（XZ平面），松开后有0.2秒弹性回正动画。
            </div>
            <div className="building-list">
              {buildings.map(b => (
                <div
                  key={b.id}
                  className={`building-item ${selectedBuildingId === b.id ? 'selected' : ''}`}
                  onClick={() => handleBuildingClick(b.id)}
                >
                  <div
                    className="building-color-dot"
                    style={{ background: b.color }}
                  />
                  <span className="building-name">{b.name}</span>
                  <span className="building-size">
                    {b.size[0]}×{b.size[1]}×{b.size[2]}m
                  </span>
                </div>
              ))}
            </div>

            {selectedBuilding && (
              <div className="building-editor">
                <div className="editor-title">编辑 {selectedBuilding.name}</div>

                <div className="control-row">
                  <label>高度 (2-20米)</label>
                  <div className="control-inputs">
                    <input
                      type="range"
                      min={2}
                      max={20}
                      step={1}
                      value={selectedBuilding.size[1]}
                      onChange={(e) => {
                        const newHeight = Number(e.target.value);
                        handleBuildingUpdate(selectedBuilding.id, {
                          size: [selectedBuilding.size[0], newHeight, selectedBuilding.size[2]],
                          position: [selectedBuilding.position[0], newHeight / 2, selectedBuilding.position[2]]
                        });
                      }}
                    />
                    <input
                      type="number"
                      min={2}
                      max={20}
                      step={1}
                      value={selectedBuilding.size[1]}
                      onChange={(e) => {
                        const newHeight = Math.min(20, Math.max(2, Number(e.target.value)));
                        handleBuildingUpdate(selectedBuilding.id, {
                          size: [selectedBuilding.size[0], newHeight, selectedBuilding.size[2]],
                          position: [selectedBuilding.position[0], newHeight / 2, selectedBuilding.position[2]]
                        });
                      }}
                    />
                  </div>
                </div>

                <div className="control-row">
                  <label>X 位置 (-20~20)</label>
                  <div className="control-inputs">
                    <input
                      type="range"
                      min={-20}
                      max={20}
                      step={0.5}
                      value={selectedBuilding.position[0]}
                      onChange={(e) => {
                        const newX = Number(e.target.value);
                        handleBuildingUpdate(selectedBuilding.id, {
                          position: [newX, selectedBuilding.position[1], selectedBuilding.position[2]]
                        });
                      }}
                    />
                    <input
                      type="number"
                      min={-20}
                      max={20}
                      step={0.5}
                      value={selectedBuilding.position[0]}
                      onChange={(e) => {
                        const newX = Math.min(20, Math.max(-20, Number(e.target.value)));
                        handleBuildingUpdate(selectedBuilding.id, {
                          position: [newX, selectedBuilding.position[1], selectedBuilding.position[2]]
                        });
                      }}
                    />
                  </div>
                </div>

                <div className="control-row">
                  <label>Z 位置 (-20~20)</label>
                  <div className="control-inputs">
                    <input
                      type="range"
                      min={-20}
                      max={20}
                      step={0.5}
                      value={selectedBuilding.position[2]}
                      onChange={(e) => {
                        const newZ = Number(e.target.value);
                        handleBuildingUpdate(selectedBuilding.id, {
                          position: [selectedBuilding.position[0], selectedBuilding.position[1], newZ]
                        });
                      }}
                    />
                    <input
                      type="number"
                      min={-20}
                      max={20}
                      step={0.5}
                      value={selectedBuilding.position[2]}
                      onChange={(e) => {
                        const newZ = Math.min(20, Math.max(-20, Number(e.target.value)));
                        handleBuildingUpdate(selectedBuilding.id, {
                          position: [selectedBuilding.position[0], selectedBuilding.position[1], newZ]
                        });
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={`panel ${panels.shadow ? 'expanded' : 'collapsed'}`}>
          <div className="panel-header" onClick={() => togglePanel('shadow')}>
            <span className="panel-icon">🌑</span>
            <span className="panel-title">阴影控制</span>
            <span className={`panel-arrow ${panels.shadow ? 'up' : ''}`}>▼</span>
          </div>
          <div className="panel-content">
            <div className="control-row">
              <label>阴影强度 (0.2-1.0)</label>
              <div className="control-inputs">
                <input
                  type="range"
                  min={0.2}
                  max={1.0}
                  step={0.1}
                  value={sunParams.shadowIntensity}
                  onChange={(e) => updateSunParams({ shadowIntensity: Number(e.target.value) })}
                />
                <input
                  type="number"
                  min={0.2}
                  max={1.0}
                  step={0.1}
                  value={sunParams.shadowIntensity}
                  onChange={(e) => updateSunParams({
                    shadowIntensity: Math.min(1.0, Math.max(0.2, Number(e.target.value)))
                  })}
                />
              </div>
            </div>

            <div className="control-row">
              <label>当前阴影柔和度 PCF: {sunParams.shadowSoftness}</label>
              <div className="control-hint">
                可在「太阳控制」面板中调节 0-5 级
              </div>
            </div>

            <div className="control-row">
              <label>阴影颜色预设</label>
              <div className="color-presets">
                {SHADOW_COLOR_PRESETS.map(preset => (
                  <div
                    key={preset.value}
                    className={`color-preset ${sunParams.shadowColor === preset.value ? 'active' : ''}`}
                    title={preset.name}
                    onClick={() => updateSunParams({ shadowColor: preset.value })}
                    style={{ background: preset.value }}
                  >
                    {sunParams.shadowColor === preset.value && <span className="check-mark">✓</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="scene-container">
        <Scene
          ref={sceneRef}
          buildings={buildings}
          selectedBuildingId={selectedBuildingId}
          onBuildingClick={handleBuildingClick}
          sunParams={sunParams}
          isDragging={isDragging}
          onDraggingChange={setIsDragging}
          onBuildingUpdate={handleBuildingUpdate}
          shadowCanvasRef={shadowCanvasRef}
        />
        <ShadowViewer sunParams={sunParams} shadowCanvas={shadowCanvasRef.current} />
        <div className="hsv-ring-container">
          <HSVRing hueAngle={hueAngle} />
        </div>
      </div>
    </div>
  );
}

export default App;
