import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import TopNavbar from '@/components/TopNavbar';
import ControlPanel from '@/components/ControlPanel';
import Scene3D, { type Scene3DHandle } from '@/components/Scene3D';
import BuildingInfo from '@/components/BuildingInfo';
import { calculateSunPosition, getSeasonLabel } from '@/utils/SunCalculator';
import { generateHeatmap, exportSVG } from '@/utils/ShadowAnalyzer';
import { downloadPNG, downloadSVG, formatTimestamp } from '@/utils/exportUtils';
import type { Building, HeatmapResult, SunPosition, ViewMode } from '@/types';

const BUILDING_COUNT = 10;
const GROUND_SIZE = 100;

const BUILDING_COLORS = [
  '#6B8E9F', '#7B9EB2', '#5A7A8C', '#8FAFC4', '#647D8C',
  '#7A9BAD', '#5E8499', '#8DB2C7', '#6A8DA0', '#7093A6',
];

function generateBuildings(): Building[] {
  const buildings: Building[] = [];
  const types: Array<'cube' | 'cylinder' | 'L-shape'> = ['cube', 'cylinder', 'L-shape'];
  const usedPositions: Array<{ x: number; z: number; r: number }> = [];

  for (let i = 0; i < BUILDING_COUNT; i++) {
    let attempts = 0;
    let validPosition = false;
    let px = 0, pz = 0;
    const width = 6 + Math.random() * 10;
    const depth = 6 + Math.random() * 10;
    const collisionR = Math.max(width, depth) / 2 + 4;

    while (attempts < 100 && !validPosition) {
      px = (Math.random() - 0.5) * (GROUND_SIZE - 24);
      pz = (Math.random() - 0.5) * (GROUND_SIZE - 24);
      validPosition = true;
      for (const up of usedPositions) {
        const dx = px - up.x;
        const dz = pz - up.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < collisionR + up.r) {
          validPosition = false;
          break;
        }
      }
      attempts++;
    }

    const type = types[Math.floor(Math.random() * types.length)];
    const height = 5 + Math.random() * 25;

    const footprintArea = type === 'cylinder'
      ? Math.PI * Math.pow(Math.min(width, depth) / 2, 2)
      : width * depth;

    buildings.push({
      id: `B${(i + 1).toString().padStart(2, '0')}`,
      type,
      position: { x: px, z: pz },
      dimensions: { width, depth, height },
      color: BUILDING_COLORS[i % BUILDING_COLORS.length],
      shadowAreaPercent: 0,
      footprintArea,
    });

    usedPositions.push({ x: px, z: pz, r: collisionR });
  }

  return buildings;
}

const App: React.FC = () => {
  const sceneRef = useRef<Scene3DHandle>(null);
  const sceneContainerRef = useRef<HTMLDivElement>(null);

  const [buildings] = useState<Building[]>(() => generateBuildings());
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date(2024, 5, 21));
  const [timeMinutes, setTimeMinutes] = useState<number>(14 * 60 + 30);
  const [viewMode, setViewMode] = useState<ViewMode>('perspective');
  const [heatmapResult, setHeatmapResult] = useState<HeatmapResult | null>(null);
  const [isGeneratingHeatmap, setIsGeneratingHeatmap] = useState(false);
  const [isExportingScreenshot, setIsExportingScreenshot] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [selectedBuildingScreenPos, setSelectedBuildingScreenPos] = useState({ x: 0, y: 0 });
  const [heatmapAnimState, setHeatmapAnimState] = useState<'hidden' | 'visible' | 'hiding'>('hidden');
  const [fps, setFps] = useState(0);

  const fpsFramesRef = useRef(0);
  const fpsLastTimeRef = useRef(performance.now());

  const seasonLabel = useMemo(() => getSeasonLabel(currentDate), [currentDate]);

  const sunPosition: SunPosition = useMemo(() => {
    const hours = Math.floor(timeMinutes / 60);
    const minutes = timeMinutes % 60;
    return calculateSunPosition(currentDate, hours, minutes);
  }, [currentDate, timeMinutes]);

  const displayTime = useMemo(() => {
    const hours = Math.floor(timeMinutes / 60);
    const minutes = timeMinutes % 60;
    return formatTimestamp(currentDate, hours, minutes);
  }, [currentDate, timeMinutes]);

  useEffect(() => {
    let rafId: number;
    const tick = () => {
      fpsFramesRef.current++;
      const now = performance.now();
      const elapsed = now - fpsLastTimeRef.current;
      if (elapsed >= 1000) {
        const currentFps = Math.round((fpsFramesRef.current * 1000) / elapsed);
        setFps(currentFps);
        fpsFramesRef.current = 0;
        fpsLastTimeRef.current = now;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const handleDateChange = useCallback((date: Date) => {
    setCurrentDate(date);
  }, []);

  const handleTimeChange = useCallback((minutes: number) => {
    setTimeMinutes(minutes);
  }, []);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  const handleBuildingClick = useCallback((building: Building, screenPos: { x: number; y: number }) => {
    let shadowPercent = 0;
    if (sceneRef.current) {
      shadowPercent = sceneRef.current.calculateBuildingShadowPercent(building);
    }
    const updatedBuilding = { ...building, shadowAreaPercent: shadowPercent };
    setSelectedBuilding(updatedBuilding);

    const container = sceneContainerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      const maxX = rect.width - 250;
      const maxY = rect.height - 220;
      setSelectedBuildingScreenPos({
        x: Math.min(Math.max(10, screenPos.x + 20), maxX),
        y: Math.min(Math.max(10, screenPos.y - 10), maxY),
      });
    } else {
      setSelectedBuildingScreenPos({ x: screenPos.x + 20, y: screenPos.y - 10 });
    }
  }, []);

  const handleBuildingInfoClose = useCallback(() => {
    setSelectedBuilding(null);
  }, []);

  const handleGenerateHeatmap = useCallback(async () => {
    if (!sceneRef.current || isGeneratingHeatmap) return;

    setIsGeneratingHeatmap(true);
    if (heatmapAnimState === 'visible') {
      setHeatmapAnimState('hiding');
      await new Promise(r => setTimeout(r, 500));
    }

    try {
      const gridData = await sceneRef.current.captureShadowGrid();
      const result = await generateHeatmap(gridData);
      setHeatmapResult(result);
      setHeatmapAnimState('visible');
    } catch (err) {
      console.error('Generate heatmap error:', err);
    } finally {
      setIsGeneratingHeatmap(false);
    }
  }, [isGeneratingHeatmap, heatmapAnimState]);

  const handleExportScreenshot = useCallback(async () => {
    if (!sceneRef.current || isExportingScreenshot) return;

    setIsExportingScreenshot(true);
    try {
      const hours = Math.floor(timeMinutes / 60);
      const minutes = timeMinutes % 60;
      const timestamp = formatTimestamp(currentDate, hours, minutes);
      const fileName = `shadowsim_${currentDate.getFullYear()}${(currentDate.getMonth() + 1).toString().padStart(2, '0')}${currentDate.getDate().toString().padStart(2, '0')}_${hours.toString().padStart(2, '0')}${minutes.toString().padStart(2, '0')}.png`;

      const dataUrl = await sceneRef.current.captureScreenshot(1920, 1080, timestamp);
      downloadPNG(dataUrl, fileName);
    } catch (err) {
      console.error('Export screenshot error:', err);
    } finally {
      setIsExportingScreenshot(false);
    }
  }, [isExportingScreenshot, timeMinutes, currentDate]);

  const handleExportHeatmap = useCallback(() => {
    if (!heatmapResult) return;

    const hours = Math.floor(timeMinutes / 60);
    const minutes = timeMinutes % 60;
    const fileName = `heatmap_${currentDate.getFullYear()}${(currentDate.getMonth() + 1).toString().padStart(2, '0')}${currentDate.getDate().toString().padStart(2, '0')}_${hours.toString().padStart(2, '0')}${minutes.toString().padStart(2, '0')}.svg`;

    const combinedSvg = exportSVG(heatmapResult.svgString, heatmapResult.pieSvgString);
    downloadSVG(combinedSvg, fileName);
  }, [heatmapResult, timeMinutes, currentDate]);

  return (
    <div className="app-container">
      <TopNavbar displayTime={displayTime} seasonLabel={seasonLabel} />

      <div className="main-layout">
        <div className="scene-container" ref={sceneContainerRef}>
          <Scene3D
            ref={sceneRef}
            sunPosition={sunPosition}
            viewMode={viewMode}
            buildings={buildings}
            onBuildingClick={handleBuildingClick}
          />

          <div className="scene-overlay">
            <div className="fps-counter">FPS: {fps}</div>
            <div className="controls-hint">
              <span>🖱️ 拖拽旋转</span>
              <span>🔍 滚轮缩放</span>
              <span>⌨️ WASD 平移</span>
            </div>

            {heatmapResult && (
              <div className={`heatmap-overlay ${heatmapAnimState}`}>
                <div dangerouslySetInnerHTML={{ __html: heatmapResult.svgString }} />
              </div>
            )}

            {selectedBuilding && (
              <BuildingInfo
                building={selectedBuilding}
                position={selectedBuildingScreenPos}
                onClose={handleBuildingInfoClose}
              />
            )}
          </div>
        </div>

        <ControlPanel
          date={currentDate}
          onDateChange={handleDateChange}
          timeMinutes={timeMinutes}
          onTimeChange={handleTimeChange}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          onGenerateHeatmap={handleGenerateHeatmap}
          isGenerating={isGeneratingHeatmap}
          heatmapResult={heatmapResult}
          onExportScreenshot={handleExportScreenshot}
          onExportHeatmap={handleExportHeatmap}
          heatmapAvailable={!!heatmapResult}
          isExportingScreenshot={isExportingScreenshot}
        />
      </div>
    </div>
  );
};

export default App;
