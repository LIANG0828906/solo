import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cell, MicrobeType, MICROBE_CONFIGS, GRID_SIZE } from './types';
import { useGameStore } from './store';
import { canUseClearSkill, useClearSkillAction } from './actions';

interface GridProps {
  draggedType: MicrobeType | null;
  onDragEnd: () => void;
}

interface SkillEffect {
  x: number;
  y: number;
  id: number;
}

const Grid: React.FC<GridProps> = ({ draggedType, onDragEnd }) => {
  const grid = useGameStore((state) => state.grid);
  const placeMicrobe = useGameStore((state) => state.placeMicrobe);
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ x: number; y: number; type: MicrobeType } | null>(null);
  const [skillEffects, setSkillEffects] = useState<SkillEffect[]>([]);
  const [placedEffect, setPlacedEffect] = useState<{ x: number; y: number; id: number } | null>(null);
  const effectIdRef = useRef(0);

  const getCellColor = (cell: Cell): string => {
    if (cell.isDesert) return '#696969';
    if (cell.nutrient > 60) return '#6B8E23';
    if (cell.nutrient >= 30) return '#9ACD32';
    return '#8B4513';
  };

  const renderMicrobes = (cell: Cell) => {
    const types: MicrobeType[] = ['cyanobacteria', 'mold', 'ciliate'];
    const elements: React.ReactNode[] = [];

    types.forEach((type) => {
      const count = cell.microbes[type];
      const config = MICROBE_CONFIGS[type];
      if (count === 0) return;

      const positions = getMicrobePositions(count, config.size);

      positions.forEach((pos, idx) => {
        elements.push(
          <div
            key={`${type}-${idx}`}
            className="absolute rounded-full"
            style={{
              width: config.size,
              height: config.size,
              backgroundColor: config.color,
              left: pos.x,
              top: pos.y,
              boxShadow: `0 0 ${config.size / 2}px ${config.color}40`,
            }}
          />
        );
      });
    });

    return elements;
  };

  const getMicrobePositions = (count: number, size: number): { x: number; y: number }[] => {
    const positions: { x: number; y: number }[] = [];
    const centerX = 32 - size / 2;
    const centerY = 32 - size / 2;
    const radius = 18;

    if (count === 1) {
      positions.push({ x: centerX, y: centerY });
    } else if (count === 2) {
      positions.push({ x: centerX - size / 2 - 2, y: centerY });
      positions.push({ x: centerX + size / 2 + 2, y: centerY });
    } else if (count === 3) {
      for (let i = 0; i < 3; i++) {
        const angle = (i * 2 * Math.PI) / 3 - Math.PI / 2;
        positions.push({
          x: centerX + radius * 0.5 * Math.cos(angle),
          y: centerY + radius * 0.5 * Math.sin(angle),
        });
      }
    } else {
      const displayCount = Math.min(count, 6);
      for (let i = 0; i < displayCount; i++) {
        const angle = (i * 2 * Math.PI) / displayCount;
        positions.push({
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        });
      }
    }

    return positions;
  };

  const handleCellClick = useCallback(
    (cell: Cell) => {
      if (selectedCell) {
        const dx = Math.abs(cell.x - selectedCell.x);
        const dy = Math.abs(cell.y - selectedCell.y);
        if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
          const moveMicrobe = useGameStore.getState().moveMicrobe;
          const success = moveMicrobe(selectedCell.x, selectedCell.y, cell.x, cell.y, selectedCell.type);
          if (success) {
            setPlacedEffect({ x: cell.x, y: cell.y, id: effectIdRef.current++ });
            setTimeout(() => setPlacedEffect(null), 300);
          }
        }
        setSelectedCell(null);
        return;
      }

      const totalMicrobes = cell.microbes.cyanobacteria + cell.microbes.mold + cell.microbes.ciliate;
      if (totalMicrobes > 0 && !cell.isDesert) {
        const types: MicrobeType[] = ['cyanobacteria', 'mold', 'ciliate'];
        let selectedType: MicrobeType | null = null;
        for (const type of types) {
          if (cell.microbes[type] > 0) {
            selectedType = type;
            break;
          }
        }
        if (selectedType) {
          setSelectedCell({ x: cell.x, y: cell.y, type: selectedType });
        }
      }
    },
    [selectedCell]
  );

  const handleSkillClick = useCallback(
    (e: React.MouseEvent, x: number, y: number) => {
      e.stopPropagation();
      if (canUseClearSkill(x, y)) {
        const success = useClearSkillAction(x, y);
        if (success) {
          const id = effectIdRef.current++;
          setSkillEffects((prev) => [...prev, { x, y, id }]);
          setTimeout(() => {
            setSkillEffects((prev) => prev.filter((e) => e.id !== id));
          }, 500);
        }
      }
    },
    []
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = useCallback(
    (e: React.DragEvent, cell: Cell) => {
      e.preventDefault();
      if (draggedType && !cell.isDesert) {
        const success = placeMicrobe(cell.x, cell.y, draggedType);
        if (success) {
          setPlacedEffect({ x: cell.x, y: cell.y, id: effectIdRef.current++ });
          setTimeout(() => setPlacedEffect(null), 300);
        }
      }
      onDragEnd();
    },
    [draggedType, placeMicrobe, onDragEnd]
  );

  const isAdjacent = (cell: Cell): boolean => {
    if (!selectedCell) return false;
    const dx = Math.abs(cell.x - selectedCell.x);
    const dy = Math.abs(cell.y - selectedCell.y);
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
  };

  return (
    <div
      className="grid gap-1 p-4"
      style={{
        gridTemplateColumns: `repeat(${GRID_SIZE}, 64px)`,
        gridTemplateRows: `repeat(${GRID_SIZE}, 64px)`,
      }}
    >
      {grid.map((row) =>
        row.map((cell) => {
          const isSelected = selectedCell?.x === cell.x && selectedCell?.y === cell.y;
          const isAdjacentTarget = isAdjacent(cell) && !cell.isDesert;
          const canPlace = draggedType && !cell.isDesert;
          const hasSkillEffect = skillEffects.some((e) => e.x === cell.x && e.y === cell.y);
          const hasPlaceEffect = placedEffect?.x === cell.x && placedEffect?.y === cell.y;

          return (
            <motion.div
              key={cell.id}
              className="relative cursor-pointer overflow-hidden"
              style={{
                width: 64,
                height: 64,
                borderRadius: 4,
                backgroundColor: getCellColor(cell),
                border: isSelected
                  ? '2px solid #FFD700'
                  : isAdjacentTarget
                  ? '2px dashed #00FF00'
                  : hoveredCell?.x === cell.x && hoveredCell?.y === cell.y
                  ? '2px dashed #FFFFFF'
                  : '1px solid rgba(0,0,0,0.2)',
                boxShadow: isSelected ? '0 0 10px #FFD70080' : 'none',
              }}
              whileHover={{ scale: hoveredCell?.x === cell.x && hoveredCell?.y === cell.y ? 1.06 : 1 }}
              transition={{ duration: 0.2 }}
              onMouseEnter={() => setHoveredCell({ x: cell.x, y: cell.y })}
              onMouseLeave={() => setHoveredCell(null)}
              onClick={() => handleCellClick(cell)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, cell)}
            >
              <div className="absolute inset-0 flex items-center justify-center">{renderMicrobes(cell)}</div>

              {!cell.isDesert && (
                <button
                  className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-green-500 text-white text-xs flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity z-10"
                  style={{ fontSize: 10 }}
                  onClick={(e) => handleSkillClick(e, cell.x, cell.y)}
                  title="清除技能 (20能量)"
                >
                  ✦
                </button>
              )}

              <AnimatePresence>
                {hasPlaceEffect && (
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    initial={{ opacity: 0.8 }}
                    animate={{ opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ backgroundColor: '#FFFFFF' }}
                  />
                )}
              </AnimatePresence>

              <AnimatePresence>
                {hasSkillEffect && (
                  <motion.div
                    className="absolute inset-0 pointer-events-none flex items-center justify-center"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <motion.div
                      className="absolute rounded-full border-2 border-green-400"
                      initial={{ width: 10, height: 10, opacity: 1 }}
                      animate={{ width: 80, height: 80, opacity: 0 }}
                      transition={{ duration: 0.5 }}
                    />
                    <motion.div
                      className="absolute rounded-full border border-green-300"
                      initial={{ width: 5, height: 5, opacity: 1 }}
                      animate={{ width: 60, height: 60, opacity: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {canPlace && !cell.isDesert && (
                <div className="absolute inset-0 bg-white bg-opacity-20 pointer-events-none" />
              )}
            </motion.div>
          );
        })
      )}
    </div>
  );
};

export default Grid;
