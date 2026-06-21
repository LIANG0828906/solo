import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SceneEngine } from './module_scene/SceneEngine';
import { HeatmapRenderer } from './module_scene/HeatmapRenderer';
import { ControlPanel } from './module_control/ControlPanel';
import { ChartModule, ChartData } from './module_control/ChartModule';
import { BlockData, ThermalApi, ThermalCurrent } from './module_api/ThermalApi';

export default function App() {
  const [blocks, setBlocks] = useState<BlockData[]>([]);
  const [heatValues, setHeatValues] = useState<Map<string, number>>(new Map());
  const [solarIntensity, setSolarIntensity] = useState(50);
  const [greenRate, setGreenRate] = useState(30);
  const [buildingDensity, setBuildingDensity] = useState(60);
  const [heatmapEnabled, setHeatmapEnabled] = useState(true);
  const [selectedBlock, setSelectedBlock] = useState<BlockData | null>(null);
  const [selectedBlockScreenPos, setSelectedBlockScreenPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [selectedBlockIds, setSelectedBlockIds] = useState<string[]>([]);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [thermalCurrent, setThermalCurrent] = useState<ThermalCurrent | null>(null);
  const [fps, setFps] = useState(0);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const heatmapRenderer = useRef(new HeatmapRenderer());

  const calculateHeat = useCallback(
    (block: BlockData, solar: number, green: number, density: number): number => {
      const solarFactor = (solar / 100) * 0.5;
      const densityFactor = block.buildingDensity * (density / 100) * 0.3;
      const greenFactor = block.greenRate * (green / 100) * 0.25;
      return Math.max(0, Math.min(1, block.baseHeat + solarFactor + densityFactor - greenFactor));
    },
    [],
  );

  const recalculateHeatValues = useCallback(
    (solar: number, green: number, density: number) => {
      const newHeatMap = new Map<string, number>();
      const updatedBlocks = blocks.map((b) => {
        const heat = calculateHeat(b, solar, green, density);
        newHeatMap.set(b.id, heat);
        return { ...b, heatValue: heat, temperature: 20 + heat * 20 };
      });
      setHeatValues(newHeatMap);
      setBlocks(updatedBlocks);

      const heats = Array.from(newHeatMap.values());
      const avgHeat = heats.reduce((a, b) => a + b, 0) / heats.length;
      const maxHeat = Math.max(...heats);
      setThermalCurrent({
        hour: thermalCurrent?.hour || 12,
        averageHeat: avgHeat,
        maxHeat: maxHeat,
        averageTemperature: 20 + avgHeat * 20,
        maxTemperature: 20 + maxHeat * 20,
        solarIntensity: solar,
        globalGreenRate: green,
        globalBuildingDensity: density,
      });
    },
    [blocks, calculateHeat, thermalCurrent?.hour],
  );

  useEffect(() => {
    const handleResize = () => {
      setIsPanelCollapsed(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [initialBlocks, current] = await Promise.all([
          ThermalApi.getBlocks(),
          ThermalApi.getCurrentThermal(),
        ]);
        setBlocks(initialBlocks);
        setThermalCurrent(current);
        setSolarIntensity(current.solarIntensity);
        setGreenRate(current.globalGreenRate);
        setBuildingDensity(current.globalBuildingDensity);

        const heatMap = new Map<string, number>();
        initialBlocks.forEach((b) => {
          if (b.heatValue !== undefined) heatMap.set(b.id, b.heatValue);
        });
        setHeatValues(heatMap);
      } catch (err) {
        console.error('Failed to load initial data:', err);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const current = await ThermalApi.getCurrentThermal();
        setThermalCurrent(current);
        if (blocks.length > 0) {
          recalculateHeatValues(
            thermalCurrent?.solarIntensity || solarIntensity,
            thermalCurrent?.globalGreenRate || greenRate,
            thermalCurrent?.globalBuildingDensity || buildingDensity,
          );
        }
      } catch (err) {
        console.error('Thermal update failed:', err);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [blocks.length, recalculateHeatValues, solarIntensity, greenRate, buildingDensity, thermalCurrent]);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let rafId: number;
    const measureFps = () => {
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = now;
      }
      rafId = requestAnimationFrame(measureFps);
    };
    rafId = requestAnimationFrame(measureFps);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const handleBlockClick = useCallback(
    (block: BlockData, screenX: number, screenY: number) => {
      setSelectedBlock(block);
      setSelectedBlockScreenPos({ x: screenX, y: screenY });
    },
    [],
  );

  const handleSelectionChange = useCallback(async (blockIds: string[]) => {
    setSelectedBlockIds(blockIds);
    if (blockIds.length > 0) {
      try {
        const history = await ThermalApi.getThermalHistory(blockIds);
        setChartData({ labels: history.labels, values: history.values });
      } catch (err) {
        console.error('Failed to load chart data:', err);
      }
    } else {
      setChartData(null);
    }
  }, []);

  const handleSliderPreview = useCallback(
    (type: 'solar' | 'green' | 'density', value: number) => {
      if (type === 'solar') setSolarIntensity(value);
      else if (type === 'green') setGreenRate(value);
      else setBuildingDensity(value);

      if (heatmapRenderer.current.isEnabled()) {
        const solar = type === 'solar' ? value : solarIntensity;
        const green = type === 'green' ? value : greenRate;
        const density = type === 'density' ? value : buildingDensity;
        const previewMap = new Map<string, number>();
        blocks.forEach((b) => {
          previewMap.set(b.id, calculateHeat(b, solar, green, density));
        });
        heatmapRenderer.current.updatePreview(previewMap);
      }
    },
    [blocks, calculateHeat, solarIntensity, greenRate, buildingDensity],
  );

  const handleSliderChangeEnd = useCallback(
    (type: 'solar' | 'green' | 'density', value: number) => {
      const solar = type === 'solar' ? value : solarIntensity;
      const green = type === 'green' ? value : greenRate;
      const density = type === 'density' ? value : buildingDensity;
      recalculateHeatValues(solar, green, density);
      ThermalApi.updateParams({
        solarIntensity: solar,
        globalGreenRate: green,
        globalBuildingDensity: density,
      });
    },
    [solarIntensity, greenRate, buildingDensity, recalculateHeatValues],
  );

  return (
    <div className="app-container">
      <SceneEngine
        blocks={blocks}
        heatValues={heatValues}
        heatmapEnabled={heatmapEnabled}
        onBlockClick={handleBlockClick}
        onSelectionChange={handleSelectionChange}
        greenRate={greenRate / 100}
        heatmapRenderer={heatmapRenderer}
      />

      {thermalCurrent && (
        <div className="stats-panel">
          <h3>🌡️ 实时热力数据</h3>
          <div className="stats-row">
            <span>平均温度</span>
            <span className="stats-value">{thermalCurrent.averageTemperature.toFixed(1)}°C</span>
          </div>
          <div className="stats-row">
            <span>最高温度</span>
            <span className="stats-value">{thermalCurrent.maxTemperature.toFixed(1)}°C</span>
          </div>
          <div className="stats-row">
            <span>模拟时间</span>
            <span className="stats-value">
              {Math.floor(thermalCurrent.hour)}:{String(Math.floor((thermalCurrent.hour % 1) * 60)).padStart(2, '0')}
            </span>
          </div>
        </div>
      )}

      <ControlPanel
        solarIntensity={solarIntensity}
        greenRate={greenRate}
        buildingDensity={buildingDensity}
        heatmapEnabled={heatmapEnabled}
        onSolarChange={(v) => handleSliderPreview('solar', v)}
        onGreenRateChange={(v) => handleSliderPreview('green', v)}
        onBuildingDensityChange={(v) => handleSliderPreview('density', v)}
        onHeatmapToggle={setHeatmapEnabled}
        onSolarChangeEnd={(v) => handleSliderChangeEnd('solar', v)}
        onGreenRateChangeEnd={(v) => handleSliderChangeEnd('green', v)}
        onBuildingDensityChangeEnd={(v) => handleSliderChangeEnd('density', v)}
        selectedBlock={selectedBlock}
        selectedBlockScreenPos={selectedBlockScreenPos}
        onCloseBlockInfo={() => {
          setSelectedBlock(null);
          setSelectedBlockScreenPos(null);
        }}
        isPanelCollapsed={isPanelCollapsed}
        onTogglePanel={() => setIsPanelCollapsed(!isPanelCollapsed)}
      />

      <ChartModule
        data={chartData}
        onClose={() => {
          setChartData(null);
          setSelectedBlockIds([]);
        }}
        isPanelCollapsed={isPanelCollapsed}
      />

      <div className="fps-counter">FPS: {fps}</div>
    </div>
  );
}
