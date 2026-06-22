import React, { useState, useEffect, useCallback } from 'react';
import { SkylineScene } from './skylineScene';
import { CityControlPanel, useCityParams } from './cityControl';
import { CameraNavigator, useCameraControls } from './cameraNavigator';
import { generateBuildings, generateTrees, BuildingData, TreeData, CityParams } from './buildingGenerator';

const App: React.FC = () => {
  const { params, updateParam } = useCityParams();
  const { cameraState, updateCamera, jumpToPosition } = useCameraControls();
  
  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [trees, setTrees] = useState<TreeData[]>([]);
  const [generationKey, setGenerationKey] = useState(0);

  const regenerateCity = useCallback((cityParams: CityParams) => {
    const newBuildings = generateBuildings(cityParams);
    const newTrees = generateTrees(cityParams, newBuildings);
    setBuildings(newBuildings);
    setTrees(newTrees);
    setGenerationKey(prev => prev + 1);
  }, []);

  useEffect(() => {
    regenerateCity(params);
  }, [params.density, params.maxHeight, params.greenCoverage, params.eraStyle]);

  const handleParamChange = useCallback((key: keyof CityParams, value: number) => {
    updateParam(key, value);
  }, [updateParam]);

  return (
    <div style={{ width: '100%', height: '100%', margin: 0, padding: 0, overflow: 'hidden' }}>
      <SkylineScene
        buildings={buildings}
        trees={trees}
        params={params}
        cameraState={cameraState}
        onCameraUpdate={updateCamera}
        generationKey={generationKey}
      />
      
      <CityControlPanel
        params={params}
        onParamChange={handleParamChange}
      />
      
      <CameraNavigator
        cameraState={cameraState}
        onJumpTo={jumpToPosition}
        buildingCount={buildings.length}
      />
      
      <div style={{
        position: 'fixed',
        top: '24px',
        left: '24px',
        color: '#fff',
        fontFamily: 'system-ui, sans-serif',
        textShadow: '0 2px 4px rgba(0,0,0,0.3)',
        zIndex: 1000,
      }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: 700,
          margin: 0,
          letterSpacing: '-0.5px',
        }}>
          Skyline Growth Simulator
        </h1>
        <p style={{
          fontSize: '13px',
          margin: '6px 0 0 0',
          opacity: 0.9,
        }}>
          拖拽右侧滑块调整参数 · 鼠标左键拖拽旋转 · 滚轮缩放
        </p>
      </div>
    </div>
  );
};

export default App;
