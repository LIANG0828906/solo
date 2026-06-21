import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Stage, Layer, Rect, Group, Text } from 'react-konva';
import { useDrop } from 'react-dnd';
import { useGardenStore } from '../store';
import { PlantSprite } from './PlantSprite';
import { PlantType, PLANT_PARAMS } from '../types';
import Konva from 'konva';

const CELL_SIZE = 50;
const GRID_WIDTH = 10;
const GRID_HEIGHT = 10;
const STAGE_WIDTH = GRID_WIDTH * CELL_SIZE;
const STAGE_HEIGHT = GRID_HEIGHT * CELL_SIZE;

export const GardenGrid: React.FC = () => {
  const grid = useGardenStore((state) => state.grid);
  const isTransitioning = useGardenStore((state) => state.isTransitioning);
  const turnCount = useGardenStore((state) => state.turnCount);
  const selectedPlantId = useGardenStore((state) => state.selectedPlantId);
  const flowerParticles = useGardenStore((state) => state.flowerParticles);
  const plantSeed = useGardenStore((state) => state.plantSeed);
  const selectPlant = useGardenStore((state) => state.selectPlant);
  const updateParticles = useGardenStore((state) => state.updateParticles);

  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [transitionOpacity, setTransitionOpacity] = useState(1);
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);
  const [dropMessage, setDropMessage] = useState<string | null>(null);

  const [, drop] = useDrop(() => ({
    accept: 'SEED',
    drop: (item: { type: PlantType }, monitor) => {
      const offset = monitor.getClientOffset();
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!offset || !containerRect) return;

      const x = Math.floor((offset.x - containerRect.left) / CELL_SIZE);
      const y = Math.floor((offset.y - containerRect.top) / CELL_SIZE);

      if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) {
        return;
      }

      const result = plantSeed(item.type, x, y);
      if (!result.success && result.message) {
        setDropMessage(result.message);
        setTimeout(() => setDropMessage(null), 1500);
      }
    },
    hover: (item, monitor) => {
      const offset = monitor.getClientOffset();
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!offset || !containerRect) return;

      const x = Math.floor((offset.x - containerRect.left) / CELL_SIZE);
      const y = Math.floor((offset.y - containerRect.top) / CELL_SIZE);

      if (x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT) {
        setHoveredCell({ x, y });
      } else {
        setHoveredCell(null);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  useEffect(() => {
    drop(containerRef);
  }, [drop]);

  useEffect(() => {
    if (isTransitioning) {
      setTransitionOpacity(0.3);
    } else {
      setTransitionOpacity(1);
    }
  }, [isTransitioning, turnCount]);

  useEffect(() => {
    if (flowerParticles.length === 0) return;

    const interval = setInterval(() => {
      updateParticles();
    }, 16);

    return () => clearInterval(interval);
  }, [flowerParticles.length, updateParticles]);

  const handleCellClick = useCallback((x: number, y: number) => {
    const plant = grid.cells[y][x];
    if (plant) {
      selectPlant(plant.id);
    } else {
      selectPlant(null);
    }
  }, [grid.cells, selectPlant]);

  const renderGrid = () => {
    const cells = [];
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const isHovered = hoveredCell?.x === x && hoveredCell?.y === y;
        const plant = grid.cells[y][x];
        const isOccupied = plant !== null;

        cells.push(
          <Rect
            key={`cell-${x}-${y}`}
            x={x * CELL_SIZE}
            y={y * CELL_SIZE}
            width={CELL_SIZE}
            height={CELL_SIZE}
            fill={isHovered ? (isOccupied ? '#FF6B6B40' : '#90EE9080') : 'transparent'}
            stroke="#8B4513"
            strokeWidth={0.5}
            onClick={() => handleCellClick(x, y)}
          />
        );
      }
    }
    return cells;
  };

  const renderPlants = () => {
    const plants = [];
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const plant = grid.cells[y][x];
        if (plant) {
          plants.push(
            <PlantSprite
              key={plant.id}
              plant={plant}
              cellSize={CELL_SIZE}
              x={x * CELL_SIZE}
              y={y * CELL_SIZE}
              onClick={() => handleCellClick(x, y)}
              isSelected={plant.id === selectedPlantId}
            />
          );
        }
      }
    }
    return plants;
  };

  const renderParticles = () => {
    return flowerParticles.map((particle) => (
      <Rect
        key={particle.id}
        x={particle.x}
        y={particle.y}
        width={particle.size}
        height={particle.size * 0.7}
        fill={particle.color}
        opacity={particle.opacity}
        rotation={(particle.rotation * 180) / Math.PI}
        cornerRadius={1}
      />
    ));
  };

  const selectedPlant = grid.cells.flat().find((p) => p?.id === selectedPlantId) || null;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div ref={containerRef}>
        <Stage width={STAGE_WIDTH} height={STAGE_HEIGHT} ref={stageRef}>
          <Layer>
            <Rect
              x={0}
              y={0}
              width={STAGE_WIDTH}
              height={STAGE_HEIGHT}
              fill="#8BC34A"
              cornerRadius={8}
              shadowColor="#00000040"
              shadowBlur={10}
              shadowOffset={{ x: 0, y: 4 }}
            />
          </Layer>
          <Layer opacity={transitionOpacity}>
            <Group
              opacity={transitionOpacity}
              tweenDuration={0.3}
            >
              {renderGrid()}
              {renderPlants()}
            </Group>
            {renderParticles()}
          </Layer>
        </Stage>
      </div>

      {dropMessage && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: '#FF6B6B',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            animation: 'fadeInOut 1.5s ease-in-out',
            zIndex: 100,
          }}
        >
          {dropMessage}
        </div>
      )}

      {selectedPlant && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            minWidth: '180px',
            zIndex: 50,
          }}
        >
          <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '8px', color: '#333' }}>
            {PLANT_PARAMS[selectedPlant.type].name}
          </div>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
            阶段：{getStageName(selectedPlant.stage)}
          </div>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
            健康度：{Math.round(selectedPlant.health * 100)}%
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>
            生长进度：{Math.round(selectedPlant.growthProgress * 100)}%
          </div>
          <div style={{ height: '6px', backgroundColor: '#eee', borderRadius: '3px', marginTop: '8px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                backgroundColor: selectedPlant.health > 0.5 ? '#4CAF50' : '#FF5722',
                width: `${selectedPlant.growthProgress * 100}%`,
                borderRadius: '3px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        }
      `}</style>
    </div>
  );
};

function getStageName(stage: string): string {
  const names: Record<string, string> = {
    seed: '种子',
    sprout: '小苗',
    young: '青年株',
    adult: '成年株',
    flowering: '开花',
    fruiting: '结果',
  };
  return names[stage] || stage;
}
