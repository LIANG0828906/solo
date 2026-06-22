import React, { useCallback, useRef, useEffect, useState } from 'react';
import type { DungeonData, PlacedMonster, PlayerCharacter, CombatParticipant, CombatAction } from '../types';

interface MapViewProps {
  dungeon: DungeonData | null;
  monsters: PlacedMonster[];
  players: PlayerCharacter[];
  mode: 'generate' | 'place' | 'battle';
  onDropMonster: (templateId: string, x: number, y: number) => void;
  onMonsterDoubleClick: (monsterId: string) => void;
  currentActorId: string | null;
  combatParticipants: CombatParticipant[];
  shakeMap: boolean;
  hitEffect: { x: number; y: number } | null;
}

const CELL_SIZE = 52;

const MapView: React.FC<MapViewProps> = ({
  dungeon,
  monsters,
  players,
  mode,
  onDropMonster,
  onMonsterDoubleClick,
  currentActorId,
  combatParticipants,
  shakeMap,
  hitEffect,
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [revealedCells, setRevealedCells] = useState<Set<string>>(new Set());
  const [dragOverCell, setDragOverCell] = useState<{ x: number; y: number } | null>(null);
  const [animatingPlace, setAnimatingPlace] = useState<string | null>(null);
  const prevDungeonSeed = useRef<string | null>(null);

  useEffect(() => {
    if (!dungeon) return;
    if (prevDungeonSeed.current === dungeon.seed) return;
    prevDungeonSeed.current = dungeon.seed;

    setRevealedCells(new Set());

    const totalCells = dungeon.grid.length * dungeon.grid[0].length;
    const delay = Math.max(15, Math.min(60, 800 / totalCells));

    dungeon.grid.forEach((row, y) => {
      row.forEach((_, x) => {
        const key = `${x}-${y}`;
        const centerDist = Math.sqrt(
          Math.pow(x - 4.5, 2) + Math.pow(y - 4.5, 2)
        );
        const baseDelay = centerDist * delay * 2;
        const randomOffset = Math.random() * delay;
        setTimeout(() => {
          setRevealedCells((prev) => new Set(prev).add(key));
        }, baseDelay + randomOffset);
      });
    });
  }, [dungeon]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, x: number, y: number) => {
      e.preventDefault();
      const templateId = e.dataTransfer.getData('monster-template-id');
      if (templateId && dungeon) {
        const cell = dungeon.grid[y]?.[x];
        if (cell && (cell.type === 'floor' || cell.type === 'room_entrance' || cell.type === 'corridor')) {
          onDropMonster(templateId, x, y);
          setAnimatingPlace(`${x}-${y}`);
          setTimeout(() => setAnimatingPlace(null), 600);
        }
      }
      setDragOverCell(null);
    },
    [dungeon, onDropMonster]
  );

  const handleDragEnterCell = useCallback((x: number, y: number) => {
    setDragOverCell({ x, y });
  }, []);

  const handleDragLeaveCell = useCallback(() => {
    setDragOverCell(null);
  }, []);

  const getMonsterAt = useCallback(
    (x: number, y: number) => monsters.find((m) => m.gridX === x && m.gridY === y),
    [monsters]
  );

  const getPlayerAt = useCallback(
    (x: number, y: number) => players.find((p) => p.gridX === x && p.gridY === y),
    [players]
  );

  const getCombatParticipantAt = useCallback(
    (x: number, y: number) => combatParticipants.find((p) => p.gridX === x && p.gridY === y),
    [combatParticipants]
  );

  if (!dungeon) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <div className="text-amber-200/60 text-lg font-medieval text-center">
          <p className="text-4xl mb-4">🏰</p>
          <p>输入种子值并点击生成，开始创建你的地牢</p>
        </div>
      </div>
    );
  }

  const gridWidth = dungeon.grid[0].length;
  const gridHeight = dungeon.grid.length;

  return (
    <div
      className={`relative ${shakeMap ? 'map-shake' : ''}`}
      ref={gridRef}
    >
      {hitEffect && (
        <div
          className="absolute pointer-events-none z-20"
          style={{
            left: hitEffect.x * CELL_SIZE + CELL_SIZE / 2,
            top: hitEffect.y * CELL_SIZE + CELL_SIZE / 2,
          }}
        >
          <div className="hit-particle-burst" />
        </div>
      )}
      <div
        className="grid border border-amber-900/40"
        style={{
          gridTemplateColumns: `repeat(${gridWidth}, ${CELL_SIZE}px)`,
          gridTemplateRows: `repeat(${gridHeight}, ${CELL_SIZE}px)`,
        }}
        onDragOver={handleDragOver}
      >
        {dungeon.grid.map((row, y) =>
          row.map((cell, x) => {
            const key = `${x}-${y}`;
            const isRevealed = revealedCells.has(key);
            const monster = getMonsterAt(x, y);
            const player = getPlayerAt(x, y);
            const combatPart = getCombatParticipantAt(x, y);
            const isDragOver = dragOverCell?.x === x && dragOverCell?.y === y;
            const isAnimatingPlace = animatingPlace === key;
            const isCurrentActor = currentActorId && (
              (monster && monster.id === currentActorId) ||
              (player && player.id === currentActorId) ||
              (combatPart && combatPart.id === currentActorId)
            );

            let cellBg = '';
            let cellContent: React.ReactNode = null;

            switch (cell.type) {
              case 'wall':
                cellBg = 'wall-texture';
                break;
              case 'floor':
                cellBg = (x + y) % 2 === 0 ? 'floor-texture-a' : 'floor-texture-b';
                break;
              case 'corridor':
                cellBg = 'corridor-texture';
                break;
              case 'chest':
                cellBg = (x + y) % 2 === 0 ? 'floor-texture-a' : 'floor-texture-b';
                cellContent = <span className="chest-icon">💎</span>;
                break;
              case 'trap':
                cellBg = 'corridor-texture';
                cellContent = <span className="trap-icon">☠️</span>;
                break;
              case 'room_entrance':
                cellBg = 'entrance-texture';
                break;
            }

            return (
              <div
                key={key}
                className={`relative border border-amber-900/20 cell-container ${cellBg} ${
                  isDragOver ? 'ring-2 ring-amber-400/60' : ''
                } ${isCurrentActor ? 'current-actor-cell' : ''}`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, x, y)}
                onDragEnter={() => handleDragEnterCell(x, y)}
                onDragLeave={handleDragLeaveCell}
                onDoubleClick={() => {
                  if (monster) onMonsterDoubleClick(monster.id);
                }}
              >
                <div
                  className={`cell-flip ${isRevealed ? 'cell-revealed' : ''}`}
                >
                  <div className="cell-front" />
                  <div className="cell-back">
                    {cellContent}
                  </div>
                </div>
                {monster && isRevealed && (
                  <div
                    className={`absolute inset-0 flex flex-col items-center justify-center z-10 ${
                      isAnimatingPlace ? 'monster-drop-anim' : ''
                    } ${isCurrentActor ? 'actor-glow' : ''}`}
                  >
                    <div className="relative">
                      <span className="text-lg leading-none">{monster.icon}</span>
                      {isAnimatingPlace && <div className="scan-ring" />}
                    </div>
                    <div className="w-10 h-1.5 bg-gray-800 rounded-full mt-0.5 overflow-hidden border border-amber-900/40">
                      <div
                        className="h-full bg-red-600 rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(0, (monster.hp / monster.maxHp) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                {player && isRevealed && mode === 'battle' && (
                  <div
                    className={`absolute inset-0 flex flex-col items-center justify-center z-10 ${
                      isCurrentActor ? 'actor-glow' : ''
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white border-2"
                      style={{
                        backgroundColor: player.color + '33',
                        borderColor: player.color,
                      }}
                    >
                      {player.class.charAt(0)}
                    </div>
                    <div className="w-10 h-1.5 bg-gray-800 rounded-full mt-0.5 overflow-hidden border border-amber-900/40">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(0, (player.hp / player.maxHp) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MapView;
