import React, { useState, useRef, useEffect, useCallback } from 'react';
import useGameStore from './gameStore';
import type { Molecule } from './types';
import { GRID_SIZE, CELL_SIZE } from './types';

const MOLECULE_COLORS: Record<string, string> = {
  A: '#E74C3C',
  B: '#3498DB',
  C: '#95A5A6',
};

const BOARD_SIZE = GRID_SIZE * CELL_SIZE;

interface Particle {
  id: string;
  x: number;
  y: number;
  color: string;
  angle: number;
}

const Board: React.FC = () => {
  const molecules = useGameStore((state) => state.grid.molecules);
  const moveAtom = useGameStore((state) => state.moveAtom);
  const checkReactionConditions = useGameStore((state) => state.checkReactionConditions);
  const reactionInterval = useGameStore((state) => state.reactionInterval);
  const resetBoard = useGameStore((state) => state.resetBoard);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<Particle[]>([]);

  const boardRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastReactionTimeRef = useRef<number>(0);

  const createParticles = useCallback((x: number, y: number, color: string) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 8; i++) {
      newParticles.push({
        id: Math.random().toString(36).substring(2, 9),
        x: x * CELL_SIZE + CELL_SIZE / 2,
        y: y * CELL_SIZE + CELL_SIZE / 2,
        color,
        angle: (i / 8) * Math.PI * 2,
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.find((np) => np.id === p.id)));
    }, 600);
  }, []);

  useEffect(() => {
    const animatingMols = molecules.filter((m) => m.isAnimating);
    animatingMols.forEach((mol) => {
      createParticles(mol.x, mol.y, MOLECULE_COLORS[mol.color]);
    });
  }, [molecules, createParticles]);

  useEffect(() => {
    if (reactionInterval === Infinity) return;

    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastReactionTimeRef.current >= reactionInterval) {
        checkReactionConditions();
        lastReactionTimeRef.current = now;
      }
    }, 100);

    return () => clearInterval(interval);
  }, [reactionInterval, checkReactionConditions]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'r') {
        resetBoard();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resetBoard]);

  const handleMouseDown = (e: React.MouseEvent, mol: Molecule) => {
    if (mol.isAnimating) return;
    e.preventDefault();

    const boardRect = boardRef.current?.getBoundingClientRect();
    if (!boardRect) return;

    setDraggingId(mol.id);
    setDragOffset({
      x: e.clientX - boardRect.left - mol.x * CELL_SIZE,
      y: e.clientY - boardRect.top - mol.y * CELL_SIZE,
    });
    setDragPos({
      x: mol.x * CELL_SIZE,
      y: mol.y * CELL_SIZE,
    });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!draggingId || !boardRef.current) return;

      const boardRect = boardRef.current.getBoundingClientRect();
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        const newX = e.clientX - boardRect.left - dragOffset.x;
        const newY = e.clientY - boardRect.top - dragOffset.y;
        setDragPos({ x: newX, y: newY });
      });
    },
    [draggingId, dragOffset]
  );

  const handleMouseUp = useCallback(() => {
    if (!draggingId || !boardRef.current) {
      setDraggingId(null);
      return;
    }

    const boardRect = boardRef.current.getBoundingClientRect();
    const gridX = Math.round(dragPos.x / CELL_SIZE);
    const gridY = Math.round(dragPos.y / CELL_SIZE);

    const clampedX = Math.max(0, Math.min(GRID_SIZE - 1, gridX));
    const clampedY = Math.max(0, Math.min(GRID_SIZE - 1, gridY));

    const originalMol = molecules.find((m) => m.id === draggingId);
    if (originalMol) {
      const existingMol = molecules.find(
        (m) => m.x === clampedX && m.y === clampedY && m.id !== draggingId
      );

      if (existingMol && existingMol.color === originalMol.color) {
        moveAtom(draggingId, clampedX, clampedY);
      } else if (!existingMol) {
        moveAtom(draggingId, clampedX, clampedY);
      }
    }

    setDraggingId(null);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, [draggingId, dragPos, molecules, moveAtom]);

  useEffect(() => {
    if (draggingId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingId, handleMouseMove, handleMouseUp]);

  const renderGrid = () => {
    const cells = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        cells.push(
          <div
            key={`${x}-${y}`}
            className="board-cell"
            style={{
              width: CELL_SIZE,
              height: CELL_SIZE,
              position: 'absolute',
              left: x * CELL_SIZE,
              top: y * CELL_SIZE,
              backgroundColor: '#E0E0E0',
              border: '1px solid #4A4A4A',
              boxSizing: 'border-box',
              boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.1)',
            }}
          />
        );
      }
    }
    return cells;
  };

  const getMoleculeStyle = (mol: Molecule): React.CSSProperties => {
    const isDragging = draggingId === mol.id;
    const pos = isDragging ? dragPos : { x: mol.x * CELL_SIZE, y: mol.y * CELL_SIZE };

    let boxShadow = `0 0 12px ${MOLECULE_COLORS[mol.color]}80`;
    if (mol.isAnimating) {
      if (mol.animationType === 'forward') {
        boxShadow = '0 0 20px #FFFFFF, 0 0 30px #FFFFFF';
      } else if (mol.animationType === 'reverse') {
        boxShadow = '0 0 20px #FFFACD, 0 0 30px #FFFACD';
      }
    }

    return {
      position: 'absolute',
      width: CELL_SIZE - 16,
      height: CELL_SIZE - 16,
      left: pos.x + 8,
      top: pos.y + 8,
      borderRadius: '50%',
      backgroundColor: mol.isAnimating
        ? mol.animationType === 'forward'
          ? '#FFFFFF'
          : '#FFFACD'
        : MOLECULE_COLORS[mol.color],
      cursor: isDragging ? 'grabbing' : 'grab',
      transform: isDragging ? 'scale(1.2)' : 'scale(1)',
      transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      boxShadow,
      zIndex: isDragging ? 100 : mol.isAnimating ? 50 : 1,
      animation: mol.isAnimating
        ? mol.animationType === 'forward'
          ? 'pulse-white 0.5s ease-in-out infinite'
          : 'pulse-yellow 0.5s ease-in-out infinite'
        : undefined,
      userSelect: 'none',
    };
  };

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div
        ref={boardRef}
        className="game-board"
        style={{
          width: BOARD_SIZE,
          height: BOARD_SIZE,
          position: 'relative',
          backgroundColor: '#2C3E50',
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          overflow: 'hidden',
        }}
      >
        {renderGrid()}

        {molecules.map((mol) => (
          <div
            key={mol.id}
            style={getMoleculeStyle(mol)}
            onMouseDown={(e) => handleMouseDown(e, mol)}
          />
        ))}

        {particles.map((p) => (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: p.color,
              left: p.x,
              top: p.y,
              pointerEvents: 'none',
              animation: `particle-fly 0.6s ease-out forwards`,
              ['--angle' as string]: `${p.angle}rad`,
              zIndex: 200,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default Board;
