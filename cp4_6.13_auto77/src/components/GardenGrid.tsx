import { useState } from 'react';
import { useGardenStore } from '../GardenStore';
import { PLANT_CONFIGS, GrowthStage } from '../Plant';
import PlantTag from './PlantTag';
import './GardenGrid.css';

const GRID_ROWS = 4;
const GRID_COLS = 6;
const TOTAL_CELLS = GRID_ROWS * GRID_COLS;

interface PlantingAnimation {
  gridIndex: number;
  phase: 'pit' | 'seed' | 'dust' | 'done';
}

const GardenGrid = () => {
  const plants = useGardenStore((state) => state.plants);
  const selectedSeed = useGardenStore((state) => state.selectedSeed);
  const selectedPlantId = useGardenStore((state) => state.selectedPlantId);
  const addPlant = useGardenStore((state) => state.addPlant);
  const selectPlant = useGardenStore((state) => state.selectPlant);
  const toasts = useGardenStore((state) => state.toasts);
  const getPlantByGridIndex = useGardenStore((state) => state.getPlantByGridIndex);

  const [plantingAnimations, setPlantingAnimations] = useState<PlantingAnimation[]>([]);
  const [dustParticles, setDustParticles] = useState<{ id: number; gridIndex: number; x: number; y: number }[]>([]);

  const handleCellClick = (gridIndex: number) => {
    const existingPlant = getPlantByGridIndex(gridIndex);

    if (existingPlant) {
      selectPlant(existingPlant.id);
      return;
    }

    if (selectedSeed) {
      triggerPlantingAnimation(gridIndex);

      setTimeout(() => {
        addPlant(selectedSeed, gridIndex);
      }, 500);
    }
  };

  const triggerPlantingAnimation = (gridIndex: number) => {
    setPlantingAnimations((prev) => [...prev, { gridIndex, phase: 'pit' }]);

    setTimeout(() => {
      setPlantingAnimations((prev) =>
        prev.map((a) => (a.gridIndex === gridIndex ? { ...a, phase: 'seed' } : a))
      );
    }, 200);

    const particles: { id: number; gridIndex: number; x: number; y: number }[] = [];
    for (let i = 0; i < 8; i++) {
      particles.push({
        id: Date.now() + i,
        gridIndex,
        x: Math.random() * 60 - 30,
        y: Math.random() * 20
      });
    }
    setDustParticles((prev) => [...prev, ...particles]);

    setTimeout(() => {
      setPlantingAnimations((prev) => prev.filter((a) => a.gridIndex !== gridIndex));
      setDustParticles((prev) => prev.filter((p) => p.gridIndex !== gridIndex));
    }, 1000);
  };

  const getPlantingPhase = (gridIndex: number) => {
    return plantingAnimations.find((a) => a.gridIndex === gridIndex)?.phase || null;
  };

  const getCellDustParticles = (gridIndex: number) => {
    return dustParticles.filter((p) => p.gridIndex === gridIndex);
  };

  const cells = Array.from({ length: TOTAL_CELLS }, (_, i) => i);

  return (
    <div className="garden-grid-wrapper">
      <div className="garden-grid">
        {cells.map((gridIndex) => {
          const plant = getPlantByGridIndex(gridIndex);
          const plantingPhase = getPlantingPhase(gridIndex);
          const cellDustParticles = getCellDustParticles(gridIndex);
          const cellToasts = toasts.filter((t) => t.gridIndex === gridIndex);
          const isSelected = plant && selectedPlantId === plant.id;

          const config = plant ? PLANT_CONFIGS[plant.type] : null;

          return (
            <div
              key={gridIndex}
              className={`garden-cell ${plant ? 'has-plant' : ''} ${selectedSeed && !plant ? 'plantable' : ''} ${isSelected ? 'selected' : ''}`}
              onClick={() => handleCellClick(gridIndex)}
            >
              <div className="cell-dirt">
                <div className="dirt-texture" />
              </div>

              {plantingPhase === 'pit' && <div className="planting-pit" />}

              {plantingPhase === 'seed' && selectedSeed && (
                <div className="planting-seed">
                  {PLANT_CONFIGS[selectedSeed].stagesEmoji[0]}
                </div>
              )}

              {cellDustParticles.map((particle) => (
                <div
                  key={particle.id}
                  className="dust-particle"
                  style={{
                    left: `calc(50% + ${particle.x}px)`,
                    top: `calc(50% + ${particle.y}px)`,
                    animationDelay: `${Math.random() * 0.2}s`
                  }}
                />
              ))}

              {plant && config && (
                <div className="plant-display">
                  <span
                    className={`plant-emoji stage-${plant.stage}`}
                    style={{
                      animation: plant.stage === GrowthStage.Flowering ? 'float 3s ease-in-out infinite' : 'none'
                    }}
                  >
                    {config.stagesEmoji[plant.stage]}
                  </span>
                  <div className="plant-growth-bar">
                    <div
                      className="growth-fill"
                      style={{
                        width: `${plant.growthProgress}%`,
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                </div>
              )}

              {plant && plant.tag && <PlantTag plantId={plant.id} tag={plant.tag} />}

              {cellToasts.map((toast) => (
                <div key={toast.id} className="stage-toast">
                  <div className="toast-content">{toast.message}</div>
                  <div className="toast-arrow" />
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GardenGrid;
