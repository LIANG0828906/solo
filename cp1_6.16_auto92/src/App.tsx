import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GreenhouseCanvas } from './GreenhouseCanvas';
import { ClimateControl } from './ClimateControl';
import {
  PlantData,
  PlantType,
  ClimateParams,
  updatePlant,
  createPlant,
  waterPlant,
  determineWeather,
  GrowthStage,
} from './PlantManager';
import './style.css';

const STAGE_NAMES: Record<GrowthStage, string> = {
  [GrowthStage.Seed]: '种子',
  [GrowthStage.Seedling]: '小苗',
  [GrowthStage.Young]: '中苗',
  [GrowthStage.Mature]: '成株',
};

const PLANT_NAMES: Record<PlantType, string> = {
  [PlantType.Cactus]: '仙人掌',
  [PlantType.Fern]: '蕨类',
  [PlantType.Orchid]: '兰花',
};

const App: React.FC = () => {
  const [climate, setClimate] = useState<ClimateParams>({
    temperature: 22,
    humidity: 50,
    lightIntensity: 5000,
  });
  const [plants, setPlants] = useState<PlantData[]>([]);
  const [selectedPlantType, setSelectedPlantType] = useState<PlantType | null>(null);
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);

  const weather = determineWeather(climate);
  const selectedPlant = plants.find((p) => p.id === selectedPlantId) || null;

  const handlePlacePlant = useCallback(
    (gridX: number, gridY: number) => {
      if (selectedPlantType === null) return;
      const occupied = plants.some((p) => p.gridX === gridX && p.gridY === gridY);
      if (occupied) return;
      const newPlant = createPlant(selectedPlantType, gridX, gridY);
      setPlants((prev) => [...prev, newPlant]);
    },
    [selectedPlantType, plants]
  );

  const handleSelectPlant = useCallback((id: string) => {
    setSelectedPlantId((prev) => (prev === id ? null : id));
  }, []);

  const handleWaterAll = useCallback(() => {
    setPlants((prev) => prev.map(waterPlant));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlants((prev) => prev.map((p) => updatePlant(p, climate, 100)));
    }, 100);
    return () => clearInterval(interval);
  }, [climate]);

  const handleRemovePlant = useCallback(() => {
    if (selectedPlantId) {
      setPlants((prev) => prev.filter((p) => p.id !== selectedPlantId));
      setSelectedPlantId(null);
    }
  }, [selectedPlantId]);

  const getPopupPosition = () => {
    if (!selectedPlant) return { left: 0, top: 0 };
    const px = selectedPlant.gridX * 120 + 60;
    const py = selectedPlant.gridY * 120 + 20;
    return {
      left: Math.min(px + 15, window.innerWidth - 380),
      top: Math.max(py - 20, 10),
    };
  };

  return (
    <div className="app-container">
      <GreenhouseCanvas
        plants={plants}
        climate={climate}
        weather={weather}
        selectedPlantType={selectedPlantType}
        onPlacePlant={handlePlacePlant}
        onSelectPlant={handleSelectPlant}
        selectedPlantId={selectedPlantId}
      />
      <ClimateControl
        climate={climate}
        onClimateChange={setClimate}
        weather={weather}
        selectedPlantType={selectedPlantType}
        onSelectPlantType={setSelectedPlantType}
        onWaterAll={handleWaterAll}
      />
      {selectedPlant && (
        <div className="plant-detail-popup" style={getPopupPosition()}>
          <h3>{PLANT_NAMES[selectedPlant.type]}</h3>
          <div className="detail-row">
            <span className="label">生长阶段</span>
            <span className="value">{STAGE_NAMES[selectedPlant.growthStage]}</span>
          </div>
          <div className="detail-row">
            <span className="label">生长进度</span>
            <span className="value">{selectedPlant.growthProgress.toFixed(1)}%</span>
          </div>
          <div className="detail-row">
            <span className="label">健康评分</span>
            <span className="value" style={{ color: selectedPlant.health >= 70 ? '#81c784' : selectedPlant.health >= 40 ? '#ffb74d' : '#ef5350' }}>
              {selectedPlant.health.toFixed(1)}%
            </span>
          </div>
          <div className="health-bar">
            <div
              className="health-bar-fill"
              style={{
                width: `${selectedPlant.health}%`,
                background: selectedPlant.health >= 70 ? '#4caf50' : selectedPlant.health >= 40 ? '#ff9800' : '#f44336',
              }}
            />
          </div>
          <div className="detail-row" style={{ marginTop: 8 }}>
            <span className="label">温度</span>
            <span className="value">{climate.temperature}°C</span>
          </div>
          <div className="detail-row">
            <span className="label">湿度</span>
            <span className="value">{climate.humidity}%</span>
          </div>
          <div className="detail-row">
            <span className="label">光照</span>
            <span className="value">{climate.lightIntensity} lux</span>
          </div>
          {selectedPlant.flowers.length > 0 && (
            <div className="detail-row">
              <span className="label">花朵</span>
              <span className="value" style={{ color: '#ce93d8' }}>
                {selectedPlant.flowers.length} 朵 🌸
              </span>
            </div>
          )}
          <button className="remove-btn" onClick={handleRemovePlant}>
            移除此植物
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
