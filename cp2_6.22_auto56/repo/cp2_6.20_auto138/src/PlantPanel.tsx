import { useEffect, useRef } from 'react';
import { usePlantStore } from './store';
import { PLANTS, PlantSpecies } from './PlantData';

interface PlantCardProps {
  plant: PlantSpecies;
  isSelected: boolean;
  onClick: () => void;
}

function PlantCard({ plant, isSelected, onClick }: PlantCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const baseY = height * 0.85;

    const stemWidth = width * 0.06;
    const stemHeight = height * 0.5;

    const stemGradient = ctx.createLinearGradient(centerX - stemWidth / 2, baseY, centerX + stemWidth / 2, baseY - stemHeight);
    stemGradient.addColorStop(0, plant.colorPalette.stemBottom);
    stemGradient.addColorStop(1, plant.colorPalette.stemTop);

    ctx.fillStyle = stemGradient;
    ctx.beginPath();
    ctx.roundRect(centerX - stemWidth / 2, baseY - stemHeight, stemWidth, stemHeight, stemWidth / 2);
    ctx.fill();

    if (plant.leafCount > 0) {
      const leafCount = Math.min(plant.leafCount, 6);
      for (let i = 0; i < leafCount; i++) {
        const yPos = baseY - stemHeight * 0.2 - (i / leafCount) * stemHeight * 0.7;
        const side = i % 2 === 0 ? 1 : -1;
        const leafWidth = plant.leafSize * 35;
        const leafHeight = plant.leafSize * 20;

        ctx.save();
        ctx.translate(centerX + side * stemWidth * 0.8, yPos);
        ctx.rotate(side * -0.5);

        const leafGradient = ctx.createRadialGradient(0, 0, 0, side * leafWidth / 2, 0, leafWidth / 2);
        leafGradient.addColorStop(0, plant.colorPalette.leaves);
        leafGradient.addColorStop(1, plant.colorPalette.stemBottom);

        ctx.fillStyle = leafGradient;
        ctx.beginPath();
        ctx.ellipse(side * leafWidth / 2, 0, leafWidth / 2, leafHeight / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    }

    if (plant.hasFlower) {
      const flowerY = baseY - stemHeight - plant.flowerSize * 10;
      const flowerRadius = plant.flowerSize * 25;

      for (let i = 0; i < plant.petalCount; i++) {
        const angle = (i / plant.petalCount) * Math.PI * 2;
        const petalX = centerX + Math.cos(angle) * flowerRadius * 0.4;
        const petalY = flowerY + Math.sin(angle) * flowerRadius * 0.4;

        ctx.save();
        ctx.translate(petalX, petalY);
        ctx.rotate(angle);

        ctx.fillStyle = plant.colorPalette.flower;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.ellipse(0, -flowerRadius * 0.3, flowerRadius * 0.25, flowerRadius * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.restore();
      }

      ctx.fillStyle = plant.colorPalette.flowerCenter;
      ctx.beginPath();
      ctx.arc(centerX, flowerY, flowerRadius * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }

    if (plant.id === 'cactus') {
      const spineCount = 8;
      for (let i = 0; i < spineCount; i++) {
        const yPos = baseY - stemHeight * 0.2 - (i / spineCount) * stemHeight * 0.6;
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX - stemWidth, yPos);
        ctx.lineTo(centerX - stemWidth - 6, yPos - 3);
        ctx.moveTo(centerX + stemWidth, yPos);
        ctx.lineTo(centerX + stemWidth + 6, yPos - 3);
        ctx.stroke();
      }
    }
  }, [plant]);

  return (
    <div
      className={`plant-card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="plant-thumb">
        <canvas ref={canvasRef} width={80} height={100} />
      </div>
      <div className="plant-info">
        <h3 className="plant-name">{plant.name}</h3>
        <p className="plant-desc">{plant.description}</p>
      </div>
    </div>
  );
}

export default function PlantPanel() {
  const selectedPlantId = usePlantStore((state) => state.selectedPlantId);
  const setSelectedPlant = usePlantStore((state) => state.setSelectedPlant);

  return (
    <div className="plant-panel">
      <h2 className="panel-title">植物图鉴</h2>
      <div className="plant-list">
        {PLANTS.map((plant) => (
          <PlantCard
            key={plant.id}
            plant={plant}
            isSelected={selectedPlantId === plant.id}
            onClick={() => setSelectedPlant(plant.id)}
          />
        ))}
      </div>
    </div>
  );
}
