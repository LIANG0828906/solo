import { useRef, useEffect, useState, useMemo } from 'react';
import { Scene3D, Scene3DHandle, ViewPreset } from '@/scene/Scene3D';
import { ControlPanel } from '@/ui/ControlPanel';
import { InfoOverlay } from '@/ui/InfoOverlay';
import { useGeoStore } from '@/store/useGeoStore';
import { presets, getDensityAtSlice } from '@/utils/geoUtils';
import './App.css';

function App() {
  const sceneRef = useRef<Scene3DHandle>(null);
  const { 
    setGeoData, 
    addAnnotation, 
    resetAll, 
    clearAnnotations,
    sliceX, 
    sliceY, 
    sliceZ,
    geoData,
    gridSize
  } = useGeoStore();

  const [activeSliceInfo, setActiveSliceInfo] = useState<{
    axis: 'x' | 'y' | 'z' | null;
    position: number;
    avgDensity: number;
  }>({
    axis: null,
    position: 0,
    avgDensity: 0
  });

  useEffect(() => {
    const defaultPreset = presets.find(p => p.id === 'cylindrical');
    if (defaultPreset) {
      const size = 16;
      const data = defaultPreset.generator(size);
      setGeoData(data, { x: size, y: size, z: size }, 'cylindrical');
    }
  }, [setGeoData]);

  useEffect(() => {
    if (!geoData) return;

    if (sliceX > 0) {
      const { avgDensity } = getDensityAtSlice(geoData, 'x', sliceX, gridSize);
      setActiveSliceInfo({ axis: 'x', position: sliceX, avgDensity });
    } else if (sliceY > 0) {
      const { avgDensity } = getDensityAtSlice(geoData, 'y', sliceY, gridSize);
      setActiveSliceInfo({ axis: 'y', position: sliceY, avgDensity });
    } else if (sliceZ > 0) {
      const { avgDensity } = getDensityAtSlice(geoData, 'z', sliceZ, gridSize);
      setActiveSliceInfo({ axis: 'z', position: sliceZ, avgDensity });
    } else {
      setActiveSliceInfo({ axis: null, position: 0, avgDensity: 0 });
    }
  }, [sliceX, sliceY, sliceZ, geoData, gridSize]);

  const handleVoxelClick = (pos: { x: number; y: number; z: number }, density: number) => {
    addAnnotation(pos, density);
  };

  const handleViewChange = (view: ViewPreset) => {
    sceneRef.current?.animateToView(view);
  };

  const handleExport = () => {
    const dataUrl = sceneRef.current?.exportScreenshot();
    if (dataUrl) {
      const link = document.createElement('a');
      link.download = `geo_section_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  const handleReset = () => {
    resetAll();
    clearAnnotations();
    sceneRef.current?.animateToView('global');
  };

  return (
    <div className="app-container">
      <div className="scene-container">
        <Scene3D ref={sceneRef} onVoxelClick={handleVoxelClick} />
        <InfoOverlay activeSliceInfo={activeSliceInfo} />
      </div>
      <ControlPanel
        onViewChange={handleViewChange}
        onExport={handleExport}
        onReset={handleReset}
      />
    </div>
  );
}

export default App;
