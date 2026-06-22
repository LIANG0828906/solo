import React from 'react';
import { Group, Circle, Rect, Ellipse, Line } from 'react-konva';
import { Plant, GrowthStage, PLANT_PARAMS } from '../types';

interface PlantSpriteProps {
  plant: Plant;
  cellSize: number;
  x: number;
  y: number;
  onClick: () => void;
  isSelected: boolean;
}

export const PlantSprite: React.FC<PlantSpriteProps> = ({
  plant,
  cellSize,
  x,
  y,
  onClick,
  isSelected,
}) => {
  const params = PLANT_PARAMS[plant.type];
  const centerX = x + cellSize / 2;
  const centerY = y + cellSize / 2;
  const scale = getPlantScale(plant.stage);

  const renderPlant = () => {
    switch (plant.type) {
      case 'sunflower':
        return renderSunflower(centerX, centerY, plant.stage, scale);
      case 'tomato':
        return renderTomato(centerX, centerY, plant.stage, scale);
      case 'rose':
        return renderRose(centerX, centerY, plant.stage, scale);
      case 'cactus':
        return renderCactus(centerX, centerY, plant.stage, scale);
      case 'oak':
        return renderOak(centerX, centerY, plant.stage, scale);
      default:
        return null;
    }
  };

  return (
    <Group onClick={onClick}>
      {isSelected && (
        <Rect
          x={x + 2}
          y={y + 2}
          width={cellSize - 4}
          height={cellSize - 4}
          stroke="#FFD700"
          strokeWidth={2}
          dash={[4, 2]}
          cornerRadius={4}
        />
      )}
      {renderPlant()}
    </Group>
  );
};

function getPlantScale(stage: GrowthStage): number {
  switch (stage) {
    case 'seed':
      return 0.15;
    case 'sprout':
      return 0.3;
    case 'young':
      return 0.5;
    case 'adult':
      return 0.75;
    case 'flowering':
      return 0.9;
    case 'fruiting':
      return 1.0;
    default:
      return 0.5;
  }
}

function renderSunflower(cx: number, cy: number, stage: GrowthStage, scale: number) {
  const elements: React.ReactNode[] = [];
  const stemHeight = 20 * scale;

  if (stage === 'seed') {
    elements.push(
      <Ellipse key="seed" x={cx} y={cy + 5} radiusX={4 * scale} radiusY={3 * scale} fill="#8B4513" />
    );
  } else {
    elements.push(
      <Line
        key="stem"
        points={[cx, cy + 10, cx, cy + 10 - stemHeight]}
        stroke="#228B22"
        strokeWidth={2 * scale}
        lineCap="round"
      />
    );

    elements.push(
      <Ellipse
        key="leaf1"
        x={cx - 6 * scale}
        y={cy + 5 - stemHeight * 0.5}
        radiusX={6 * scale}
        radiusY={3 * scale}
        fill="#32CD32"
        rotation={-30}
      />
    );
    elements.push(
      <Ellipse
        key="leaf2"
        x={cx + 6 * scale}
        y={cy + 2 - stemHeight * 0.3}
        radiusX={6 * scale}
        radiusY={3 * scale}
        fill="#32CD32"
        rotation={30}
      />
    );

    if (stage === 'sprout' || stage === 'young') {
      elements.push(
        <Circle
          key="bud"
          x={cx}
          y={cy + 10 - stemHeight}
          radius={5 * scale}
          fill="#90EE90"
          stroke="#228B22"
          strokeWidth={1}
        />
      );
    }

    if (stage === 'adult' || stage === 'flowering' || stage === 'fruiting') {
      const petalCount = 12;
      const petalRadius = 10 * scale;
      const centerRadius = 6 * scale;
      const flowerY = cy + 10 - stemHeight;

      for (let i = 0; i < petalCount; i++) {
        const angle = (i / petalCount) * Math.PI * 2;
        const petalX = cx + Math.cos(angle) * centerRadius * 0.8;
        const petalY = flowerY + Math.sin(angle) * centerRadius * 0.8;
        elements.push(
          <Ellipse
            key={`petal-${i}`}
            x={petalX}
            y={petalY}
            radiusX={petalRadius * 0.5}
            radiusY={petalRadius}
            fill="#FFD700"
            rotation={(angle * 180) / Math.PI + 90}
          />
        );
      }

      elements.push(
        <Circle
          key="center"
          x={cx}
          y={flowerY}
          radius={centerRadius}
          fill="#8B4513"
        />
      );

      if (stage === 'fruiting') {
        for (let i = 0; i < 5; i++) {
          const angle = (i / 5) * Math.PI * 2 + 0.3;
          const seedX = cx + Math.cos(angle) * centerRadius * 0.6;
          const seedY = flowerY + Math.sin(angle) * centerRadius * 0.6;
          elements.push(
            <Ellipse
              key={`seed-${i}`}
              x={seedX}
              y={seedY}
              radiusX={2 * scale}
              radiusY={3 * scale}
              fill="#4a2c0a"
              rotation={(angle * 180) / Math.PI}
            />
          );
        }
      }
    }
  }

  return <Group>{elements}</Group>;
}

function renderTomato(cx: number, cy: number, stage: GrowthStage, scale: number) {
  const elements: React.ReactNode[] = [];
  const stemHeight = 18 * scale;

  if (stage === 'seed') {
    elements.push(
      <Ellipse key="seed" x={cx} y={cy + 5} radiusX={3 * scale} radiusY={2 * scale} fill="#8B4513" />
    );
  } else {
    elements.push(
      <Line
        key="stem"
        points={[cx, cy + 10, cx, cy + 10 - stemHeight]}
        stroke="#228B22"
        strokeWidth={2 * scale}
        lineCap="round"
      />
    );

    elements.push(
      <Ellipse
        key="leaf1"
        x={cx - 8 * scale}
        y={cy - stemHeight * 0.3}
        radiusX={8 * scale}
        radiusY={4 * scale}
        fill="#32CD32"
        rotation={-20}
      />
    );
    elements.push(
      <Ellipse
        key="leaf2"
        x={cx + 8 * scale}
        y={cy - stemHeight * 0.5}
        radiusX={8 * scale}
        radiusY={4 * scale}
        fill="#32CD32"
        rotation={20}
      />
    );
    elements.push(
      <Ellipse
        key="leaf3"
        x={cx - 6 * scale}
        y={cy - stemHeight * 0.7}
        radiusX={6 * scale}
        radiusY={3 * scale}
        fill="#228B22"
        rotation={-25}
      />
    );

    if (stage === 'adult' || stage === 'flowering' || stage === 'fruiting') {
      const flowerY = cy + 5 - stemHeight;
      elements.push(
        <Circle key="flower" x={cx} y={flowerY} radius={4 * scale} fill="#FFD700" />
      );
    }

    if (stage === 'fruiting') {
      const tomatoPositions = [
        { x: cx - 6 * scale, y: cy - stemHeight * 0.2 },
        { x: cx + 5 * scale, y: cy - stemHeight * 0.4 },
        { x: cx + 2 * scale, y: cy - stemHeight * 0.65 },
      ];
      tomatoPositions.forEach((pos, i) => {
        elements.push(
          <Circle
            key={`tomato-${i}`}
            x={pos.x}
            y={pos.y}
            radius={5 * scale}
            fill="#FF6347"
            stroke="#DC143C"
            strokeWidth={0.5}
          />
        );
        elements.push(
          <Ellipse
            key={`tomato-leaf-${i}`}
            x={pos.x}
            y={pos.y - 4 * scale}
            radiusX={2 * scale}
            radiusY={1.5 * scale}
            fill="#228B22"
          />
        );
      });
    }
  }

  return <Group>{elements}</Group>;
}

function renderRose(cx: number, cy: number, stage: GrowthStage, scale: number) {
  const elements: React.ReactNode[] = [];
  const stemHeight = 22 * scale;

  if (stage === 'seed') {
    elements.push(
      <Ellipse key="seed" x={cx} y={cy + 5} radiusX={3 * scale} radiusY={2.5 * scale} fill="#8B4513" />
    );
  } else {
    elements.push(
      <Line
        key="stem"
        points={[cx, cy + 10, cx, cy + 10 - stemHeight]}
        stroke="#228B22"
        strokeWidth={1.5 * scale}
        lineCap="round"
      />
    );

    for (let i = 0; i < 3; i++) {
      const thornY = cy + 5 - stemHeight * (0.3 + i * 0.25);
      const thornX = cx + (i % 2 === 0 ? 2 : -2) * scale;
      elements.push(
        <Line
          key={`thorn-${i}`}
          points={[cx, thornY, thornX, thornY - 2 * scale]}
          stroke="#228B22"
          strokeWidth={1 * scale}
        />
      );
    }

    elements.push(
      <Ellipse
        key="leaf1"
        x={cx - 7 * scale}
        y={cy - stemHeight * 0.25}
        radiusX={6 * scale}
        radiusY={3 * scale}
        fill="#228B22"
        rotation={-15}
      />
    );
    elements.push(
      <Ellipse
        key="leaf2"
        x={cx + 7 * scale}
        y={cy - stemHeight * 0.55}
        radiusX={6 * scale}
        radiusY={3 * scale}
        fill="#228B22"
        rotation={15}
      />
    );

    if (stage === 'sprout' || stage === 'young') {
      elements.push(
        <Ellipse
          key="bud"
          x={cx}
          y={cy + 5 - stemHeight}
          radiusX={4 * scale}
          radiusY={5 * scale}
          fill="#90EE90"
          stroke="#228B22"
          strokeWidth={0.5}
        />
      );
    }

    if (stage === 'flowering' || stage === 'fruiting') {
      const flowerY = cy + 5 - stemHeight;
      const petalLayers = 3;

      for (let layer = 0; layer < petalLayers; layer++) {
        const layerScale = 1 - layer * 0.3;
        const petalCount = 5 - layer;
        for (let i = 0; i < petalCount; i++) {
          const angle = (i / petalCount) * Math.PI * 2 + layer * 0.3;
          const petalX = cx + Math.cos(angle) * 3 * scale * layerScale;
          const petalY = flowerY + Math.sin(angle) * 3 * scale * layerScale;
          elements.push(
            <Ellipse
              key={`petal-${layer}-${i}`}
              x={petalX}
              y={petalY}
              radiusX={5 * scale * layerScale}
              radiusY={6 * scale * layerScale}
              fill={layer === 0 ? '#FF69B4' : '#FF1493'}
              rotation={(angle * 180) / Math.PI + 90}
            />
          );
        }
      }

      elements.push(
        <Circle key="flower-center" x={cx} y={flowerY} radius={2 * scale} fill="#FFD700" />
      );
    }
  }

  return <Group>{elements}</Group>;
}

function renderCactus(cx: number, cy: number, stage: GrowthStage, scale: number) {
  const elements: React.ReactNode[] = [];

  if (stage === 'seed') {
    elements.push(
      <Ellipse key="seed" x={cx} y={cy + 5} radiusX={3 * scale} radiusY={2 * scale} fill="#8B4513" />
    );
  } else {
    const mainHeight = 20 * scale;
    const mainWidth = 8 * scale;

    elements.push(
      <Rect
        key="main-body"
        x={cx - mainWidth / 2}
        y={cy + 10 - mainHeight}
        width={mainWidth}
        height={mainHeight}
        fill="#228B22"
        cornerRadius={mainWidth / 2}
      />
    );

    if (stage !== 'sprout') {
      const armWidth = 5 * scale;
      const armHeight = 8 * scale;

      elements.push(
        <Rect
          key="left-arm"
          x={cx - mainWidth / 2 - armWidth}
          y={cy + 5 - mainHeight * 0.5}
          width={armWidth}
          height={armHeight}
          fill="#228B22"
          cornerRadius={armWidth / 2}
        />
      );
      elements.push(
        <Rect
          key="right-arm"
          x={cx + mainWidth / 2}
          y={cy + 2 - mainHeight * 0.4}
          width={armWidth}
          height={armHeight}
          fill="#228B22"
          cornerRadius={armWidth / 2}
        />
      );
    }

    const spineCount = 6;
    for (let i = 0; i < spineCount; i++) {
      const spineY = cy + 8 - (mainHeight * (i + 1)) / (spineCount + 1);
      elements.push(
        <Line
          key={`spine-l-${i}`}
          points={[cx - mainWidth / 2 + 1, spineY, cx - mainWidth / 2 - 3 * scale, spineY - 1]}
          stroke="#FFD700"
          strokeWidth={0.8}
        />
      );
      elements.push(
        <Line
          key={`spine-r-${i}`}
          points={[cx + mainWidth / 2 - 1, spineY, cx + mainWidth / 2 + 3 * scale, spineY - 1]}
          stroke="#FFD700"
          strokeWidth={0.8}
        />
      );
    }

    if (stage === 'flowering' || stage === 'fruiting') {
      elements.push(
        <Circle key="flower" x={cx} y={cy + 10 - mainHeight - 2 * scale} radius={4 * scale} fill="#FF69B4" />
      );
      elements.push(
        <Circle key="flower-center" x={cx} y={cy + 10 - mainHeight - 2 * scale} radius={2 * scale} fill="#FFD700" />
      );
    }
  }

  return <Group>{elements}</Group>;
}

function renderOak(cx: number, cy: number, stage: GrowthStage, scale: number) {
  const elements: React.ReactNode[] = [];
  const trunkHeight = 18 * scale;
  const trunkWidth = 6 * scale;

  if (stage === 'seed') {
    elements.push(
      <Ellipse key="seed" x={cx} y={cy + 5} radiusX={4 * scale} radiusY={3 * scale} fill="#8B4513" />
    );
  } else if (stage === 'sprout') {
    elements.push(
      <Line
        key="sprout-stem"
        points={[cx, cy + 8, cx, cy - 5 * scale]}
        stroke="#90EE90"
        strokeWidth={1.5 * scale}
        lineCap="round"
      />
    );
    elements.push(
      <Ellipse
        key="sprout-leaf"
        x={cx}
        y={cy - 7 * scale}
        radiusX={4 * scale}
        radiusY={3 * scale}
        fill="#90EE90"
      />
    );
  } else {
    elements.push(
      <Rect
        key="trunk"
        x={cx - trunkWidth / 2}
        y={cy + 10 - trunkHeight}
        width={trunkWidth}
        height={trunkHeight}
        fill="#8B4513"
        cornerRadius={1}
      />
    );

    const canopyRadius = stage === 'young' ? 10 * scale : 16 * scale;
    const canopyY = cy + 10 - trunkHeight - canopyRadius * 0.5;

    if (stage === 'young' || stage === 'adult') {
      elements.push(
        <Circle key="canopy-1" x={cx} y={canopyY} radius={canopyRadius} fill="#228B22" />
      );
      elements.push(
        <Circle key="canopy-2" x={cx - canopyRadius * 0.6} y={canopyY + 3 * scale} radius={canopyRadius * 0.7} fill="#2E8B57" />
      );
      elements.push(
        <Circle key="canopy-3" x={cx + canopyRadius * 0.6} y={canopyY + 3 * scale} radius={canopyRadius * 0.7} fill="#2E8B57" />
      );
    }

    if (stage === 'flowering') {
      elements.push(
        <Circle key="canopy-1" x={cx} y={canopyY} radius={canopyRadius} fill="#228B22" />
      );
      const flowerCount = 8;
      for (let i = 0; i < flowerCount; i++) {
        const angle = (i / flowerCount) * Math.PI * 2;
        const fx = cx + Math.cos(angle) * canopyRadius * 0.7;
        const fy = canopyY + Math.sin(angle) * canopyRadius * 0.7;
        elements.push(
          <Circle key={`flower-${i}`} x={fx} y={fy} radius={2 * scale} fill="#90EE90" />
        );
      }
    }

    if (stage === 'fruiting') {
      elements.push(
        <Circle key="canopy-1" x={cx} y={canopyY} radius={canopyRadius} fill="#228B22" />
      );
      elements.push(
        <Circle key="canopy-2" x={cx - canopyRadius * 0.6} y={canopyY + 3 * scale} radius={canopyRadius * 0.7} fill="#2E8B57" />
      );
      elements.push(
        <Circle key="canopy-3" x={cx + canopyRadius * 0.6} y={canopyY + 3 * scale} radius={canopyRadius * 0.7} fill="#2E8B57" />
      );

      const acornCount = 6;
      for (let i = 0; i < acornCount; i++) {
        const angle = (i / acornCount) * Math.PI * 2 + 0.5;
        const ax = cx + Math.cos(angle) * canopyRadius * 0.6;
        const ay = canopyY + Math.sin(angle) * canopyRadius * 0.5;
        elements.push(
          <Ellipse
            key={`acorn-${i}`}
            x={ax}
            y={ay}
            radiusX={2.5 * scale}
            radiusY={3.5 * scale}
            fill="#8B4513"
          />
        );
        elements.push(
          <Ellipse
            key={`acorn-cap-${i}`}
            x={ax}
            y={ay - 2 * scale}
            radiusX={3 * scale}
            radiusY={1.5 * scale}
            fill="#654321"
          />
        );
      }
    }
  }

  return <Group>{elements}</Group>;
}
