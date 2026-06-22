import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { SceneManager } from '@/three/SceneManager';
import { ControlPanel } from '@/ui/ControlPanel';
import { NavBar } from '@/ui/NavBar';
import { InfoPopup } from '@/ui/InfoPopup';
import { getGridData, GRID_SIZE_CONST } from '@/data/weatherGenerator';
import './index.css';

function App() {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const lastUpdateTime = useRef<number>(0);

  const {
    dataSource,
    simulationHour,
    isPlaying,
    temperatureLevel,
    humidityLevel,
    windLevel,
    selectedGrid,
    setSimulationHour,
    setSelectedGrid,
  } = useStore();

  const handleResetCamera = useCallback(() => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.resetCamera();
    }
  }, []);

  const handleExportScreenshot = useCallback(() => {
    if (sceneManagerRef.current) {
      const dataUrl = sceneManagerRef.current.exportScreenshot();
      const link = document.createElement('a');
      link.download = `weather-visualization-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    }
  }, []);

  const handleGridClick = useCallback((x: number, y: number) => {
    setSelectedGrid({ x, y });
  }, [setSelectedGrid]);

  const handleClosePopup = useCallback(() => {
    setSelectedGrid(null);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setSelectedGrid(null, null);
    }
  }, [setSelectedGrid]);

  useEffect(() => {
    if (!canvasContainerRef.current) return;

    const sceneManager = new SceneManager(canvasContainerRef.current);
    sceneManagerRef.current = sceneManager;

    sceneManager.setOnGridClick(handleGridClick);

    const gridData = getGridData(
      dataSource,
      simulationHour,
      temperatureLevel,
      humidityLevel,
      windLevel
    );
    sceneManager.updateWeather({
      gridData,
      gridSize: GRID_SIZE_CONST,
    });

    return () => {
      sceneManager.dispose();
      sceneManagerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!sceneManagerRef.current) return;

    const gridData = getGridData(
      dataSource,
      simulationHour,
      temperatureLevel,
      humidityLevel,
      windLevel
    );

    sceneManagerRef.current.startTransition(() => {
      sceneManagerRef.current?.updateWeather({
        gridData,
        gridSize: GRID_SIZE_CONST,
      });
    });
  }, [dataSource]);

  useEffect(() => {
    if (!sceneManagerRef.current || !isPlaying) return;

    let animationFrameId: number;
    let lastTime = performance.now();
    let accumulatedTime = 0;

    const animate = (currentTime: number) => {
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      const newHour = simulationHour + delta * 10;
      accumulatedTime += delta;

      setSimulationHour(newHour % 24);

      if (accumulatedTime > 0.1) {
        accumulatedTime = 0;
        const gridData = getGridData(
          dataSource,
          newHour,
          temperatureLevel,
          humidityLevel,
          windLevel
        );
        sceneManagerRef.current?.updateWeather({
          gridData,
          gridSize: GRID_SIZE_CONST,
        });
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, dataSource, temperatureLevel, humidityLevel, windLevel]);

  useEffect(() => {
    if (!sceneManagerRef.current || isPlaying) return;

    const gridData = getGridData(
      dataSource,
      simulationHour,
      temperatureLevel,
      humidityLevel,
      windLevel
    );
    sceneManagerRef.current.updateWeather({
      gridData,
      gridSize: GRID_SIZE_CONST,
    });
  }, [temperatureLevel, humidityLevel, windLevel, simulationHour, dataSource, isPlaying]);

  useEffect(() => {
    if (selectedGrid && sceneManagerRef.current) {
      sceneManagerRef.current.setSelectedGrid(selectedGrid.x, selectedGrid.y);
    }
  }, [selectedGrid]);

  return (
    <div className="app-container">
      <div ref={canvasContainerRef} className="canvas-container" />
      
      <NavBar />
      
      <ControlPanel
        onResetCamera={handleResetCamera}
        onExportScreenshot={handleExportScreenshot}
      />

      {selectedGrid && (
        <div className="info-popup-wrapper">
          <InfoPopup
            gridX={selectedGrid.x}
            gridY={selectedGrid.y}
            onClose={handleClosePopup}
          />
        </div>
      )}
    </div>
  );
}

export default App;
