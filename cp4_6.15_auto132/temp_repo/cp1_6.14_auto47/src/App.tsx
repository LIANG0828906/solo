import { useState, useEffect, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import SkylineViewer, { exportScreenshot } from './SkylineViewer';
import ControlPanel from './ControlPanel';
import { fetchPresets } from './api';
import { Building, BuildingShape, ClimateMode, ClimateParams, PresetData } from './types';

const CLIMATE_PARAMS: Record<ClimateMode, ClimateParams> = {
  sunny: {
    name: '晴天',
    mode: 'sunny',
    ambientIntensity: 0.3,
    directionalIntensity: 1.2,
    lightColor: '#ffffff',
    ambientColor: '#87ceeb',
    sunPosition: [30, 50, 20],
    shadowBlur: 1,
  },
  cloudy: {
    name: '阴天',
    mode: 'cloudy',
    ambientIntensity: 0.6,
    directionalIntensity: 0.5,
    lightColor: '#c0c0c0',
    ambientColor: '#708090',
    sunPosition: [10, 30, 10],
    shadowBlur: 4,
  },
  dusk: {
    name: '黄昏',
    mode: 'dusk',
    ambientIntensity: 0.4,
    directionalIntensity: 0.8,
    lightColor: '#ff8c42',
    ambientColor: '#4a3728',
    sunPosition: [50, 15, 0],
    shadowBlur: 2,
  },
};

interface DeleteModalState {
  isOpen: boolean;
  buildingId: string | null;
  buildingName: string;
}

export default function App() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedShape, setSelectedShape] = useState<BuildingShape>('box');
  const [selectedHeight, setSelectedHeight] = useState(15);
  const [selectedWidth, setSelectedWidth] = useState(5);
  const [climateMode, setClimateMode] = useState<ClimateMode>('sunny');
  const [presets, setPresets] = useState<PresetData[]>([]);
  const [cameraTarget, setCameraTarget] = useState<[number, number, number] | undefined>();
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
    isOpen: false,
    buildingId: null,
    buildingName: '',
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPresets = async () => {
      try {
        setIsLoading(true);
        const data = await fetchPresets();
        setPresets(data);
      } catch (error) {
        console.error('Failed to load presets:', error);
        setPresets([
          {
            id: 'cbd-preset-1',
            name: 'CBD商业区',
            terrainHeight: 0,
            cameraPosition: [40, 30, 40],
            buildings: [
              { shape: 'box', position: [-10, 0, -5], height: 35, width: 8, depth: 8 },
              { shape: 'box', position: [0, 0, -8], height: 45, width: 10, depth: 10 },
              { shape: 'box', position: [12, 0, -5], height: 38, width: 7, depth: 7 },
              { shape: 'cylinder', position: [-5, 0, 8], height: 28, width: 6, depth: 6 },
              { shape: 'box', position: [8, 0, 10], height: 32, width: 8, depth: 8 },
              { shape: 'pyramid', position: [-15, 0, 5], height: 25, width: 8, depth: 8 },
              { shape: 'box', position: [5, 0, -15], height: 20, width: 6, depth: 6 },
            ],
          },
          {
            id: 'residential-preset-1',
            name: '住宅区',
            terrainHeight: 0,
            cameraPosition: [35, 25, 35],
            buildings: [
              { shape: 'box', position: [-12, 0, -8], height: 15, width: 10, depth: 8 },
              { shape: 'box', position: [-2, 0, -10], height: 18, width: 12, depth: 8 },
              { shape: 'box', position: [10, 0, -8], height: 16, width: 10, depth: 8 },
              { shape: 'cylinder', position: [-8, 0, 5], height: 20, width: 7, depth: 7 },
              { shape: 'box', position: [5, 0, 8], height: 14, width: 9, depth: 7 },
              { shape: 'box', position: [-15, 0, 10], height: 12, width: 8, depth: 6 },
            ],
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    loadPresets();
  }, []);

  const handleAddBuilding = useCallback((buildingData: Omit<Building, 'id' | 'isAnimating'>) => {
    const newBuilding: Building = {
      ...buildingData,
      id: uuidv4(),
      isAnimating: true,
    };
    setBuildings(prev => [...prev, newBuilding]);

    setTimeout(() => {
      setBuildings(prev =>
        prev.map(b =>
          b.id === newBuilding.id ? { ...b, isAnimating: false } : b
        )
      );
    }, 600);
  }, []);

  const handleDeleteBuilding = useCallback((id: string) => {
    const building = buildings.find(b => b.id === id);
    if (building) {
      setDeleteModal({
        isOpen: true,
        buildingId: id,
        buildingName: `${building.shape} (${building.height.toFixed(0)}m)`,
      });
    }
  }, [buildings]);

  const confirmDelete = useCallback(() => {
    if (deleteModal.buildingId) {
      setBuildings(prev => prev.filter(b => b.id !== deleteModal.buildingId));
    }
    setDeleteModal({ isOpen: false, buildingId: null, buildingName: '' });
  }, [deleteModal.buildingId]);

  const cancelDelete = useCallback(() => {
    setDeleteModal({ isOpen: false, buildingId: null, buildingName: '' });
  }, []);

  const handleMoveBuilding = useCallback((id: string, position: [number, number, number]) => {
    setBuildings(prev =>
      prev.map(b =>
        b.id === id ? { ...b, position, isDragging: true } : b
      )
    );
    setTimeout(() => {
      setBuildings(prev =>
        prev.map(b =>
          b.id === id ? { ...b, isDragging: false } : b
        )
      );
    }, 100);
  }, []);

  const handleLoadPreset = useCallback((preset: PresetData) => {
    const presetBuildings: Building[] = preset.buildings.map((b, index) => ({
      ...b,
      id: uuidv4(),
      isAnimating: true,
    }));
    setBuildings(presetBuildings);
    setCameraTarget(preset.cameraPosition);

    setTimeout(() => {
      setBuildings(prev =>
        prev.map(b => ({ ...b, isAnimating: false }))
      );
    }, 600);
  }, []);

  const handleExportScreenshot = useCallback(() => {
    exportScreenshot();
  }, []);

  const handleClearAll = useCallback(() => {
    if (buildings.length === 0) return;
    if (confirm('确定要清空所有楼宇吗？')) {
      setBuildings([]);
    }
  }, [buildings.length]);

  const currentClimate = CLIMATE_PARAMS[climateMode];

  return (
    <div className="app-container">
      <Routes>
        <Route
          path="/"
          element={
            <>
              {isLoading && (
                <div className="loading-indicator">正在加载预设数据...</div>
              )}

              <SkylineViewer
                buildings={buildings}
                climate={currentClimate}
                onAddBuilding={handleAddBuilding}
                onDeleteBuilding={handleDeleteBuilding}
                onMoveBuilding={handleMoveBuilding}
                selectedShape={selectedShape}
                selectedHeight={selectedHeight}
                selectedWidth={selectedWidth}
                cameraTarget={cameraTarget}
              />

              <ControlPanel
                selectedShape={selectedShape}
                onShapeChange={setSelectedShape}
                selectedHeight={selectedHeight}
                onHeightChange={setSelectedHeight}
                selectedWidth={selectedWidth}
                onWidthChange={setSelectedWidth}
                climateMode={climateMode}
                onClimateChange={setClimateMode}
                buildings={buildings}
                presets={presets}
                onLoadPreset={handleLoadPreset}
                onExportScreenshot={handleExportScreenshot}
                onClearAll={handleClearAll}
                isPanelOpen={isPanelOpen}
                onTogglePanel={() => setIsPanelOpen(!isPanelOpen)}
              />

              <div className="hint-text">
                💡 点击地面添加楼宇，拖拽移动，右键删除
              </div>

              {deleteModal.isOpen && (
                <div className="modal-overlay" onClick={cancelDelete}>
                  <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <h3 className="modal-title">确认删除</h3>
                    <p className="modal-message">
                      确定要删除该楼宇吗？<br />
                      <span style={{ color: '#8ab4ff' }}>{deleteModal.buildingName}</span>
                    </p>
                    <div className="modal-buttons">
                      <button className="modal-btn cancel" onClick={cancelDelete}>
                        取消
                      </button>
                      <button className="modal-btn confirm" onClick={confirmDelete}>
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          }
        />
      </Routes>
    </div>
  );
}
