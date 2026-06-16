import { useEffect, useRef, useCallback } from 'react';
import { Ship, SonarResult, ShipCell, EchoResult, SHIP_CONFIGS, GRID_SIZE } from '@/types';
import { includesCell } from '@/utils/arrayHelpers';
import { SonarPulse } from '@/game/SonarPulse';
import { useGameStore } from '@/store/gameStore';
import { X } from 'lucide-react';

interface GameGridProps {
  type: 'own' | 'opponent';
  ships: Ship[];
  sonarResults: SonarResult[];
  onCellClick?: (x: number, y: number) => void;
  disabled?: boolean;
  cellSize?: number;
}

const getEchoColor = (result: EchoResult): string => {
  switch (result) {
    case 'HIT': return 'bg-danger-red/70';
    case 'CLOSE': return 'bg-warning-orange/70';
    case 'WARM': return 'bg-yellow-400/70';
    case 'COLD': return 'bg-blue-500/70';
  }
};

const getEchoGlow = (result: EchoResult): string => {
  switch (result) {
    case 'HIT': return 'glow-red';
    case 'CLOSE': return 'glow-orange';
    case 'WARM': return 'glow-yellow';
    case 'COLD': return 'glow-blue';
  }
};

const getShipGradient = (type: string, isHit: boolean, isSunk: boolean): string => {
  if (isSunk) return 'bg-gradient-to-r from-gray-600 to-gray-700 opacity-50';
  if (isHit) return 'bg-gradient-to-r from-danger-red to-red-400';
  
  const config = SHIP_CONFIGS.find(c => c.type === type);
  if (!config) return 'bg-gray-500';
  
  const [start, mid] = config.colors;
  return `linear-gradient(to right, ${start}, ${mid})`;
};

function GameGrid({ type, ships, sonarResults, onCellClick, disabled = false, cellSize = 40 }: GameGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sonarPulseRef = useRef<SonarPulse | null>(null);
  const { activePulse, pendingTarget, confirmSonarAttack, cancelSonarAttack, gameEngine } = useGameStore();
  const pendingTargetRef = useRef<ShipCell | null>(null);

  useEffect(() => {
    pendingTargetRef.current = pendingTarget;
  }, [pendingTarget]);

  useEffect(() => {
    if (canvasRef.current && type === 'opponent') {
      sonarPulseRef.current = new SonarPulse(
        canvasRef.current,
        GRID_SIZE,
        cellSize
      );
    }

    return () => {
      if (sonarPulseRef.current) {
        sonarPulseRef.current.destroy();
      }
    };
  }, [type, cellSize]);

  useEffect(() => {
    if (sonarPulseRef.current) {
      sonarPulseRef.current.resize(cellSize);
    }
  }, [cellSize]);

  useEffect(() => {
    if (activePulse && type === 'opponent' && sonarPulseRef.current) {
      const pulseId = sonarPulseRef.current.startPulse(activePulse.x, activePulse.y, activePulse.isHit);
      
      setTimeout(() => {
        const latestTarget = pendingTargetRef.current;
        if (latestTarget && sonarPulseRef.current) {
          sonarPulseRef.current.triggerParticles(latestTarget.x, latestTarget.y, 10);
        }
      }, 1400);
      
      return () => {
        if (sonarPulseRef.current && sonarPulseRef.current.getActivePulseId() === pulseId) {
          sonarPulseRef.current.clear();
        }
      };
    }
  }, [activePulse, type]);

  const handleCellClick = useCallback((x: number, y: number) => {
    if (disabled || type === 'own') return;
    
    const alreadyProbed = sonarResults.some(r => r.x === x && r.y === y);
    if (alreadyProbed) return;

    if (onCellClick) {
      onCellClick(x, y);
    }
  }, [disabled, type, sonarResults, onCellClick]);

  const getShipAtCell = useCallback((x: number, y: number): Ship | undefined => {
    return ships.find(ship => 
      includesCell(ship.cells, { x, y })
    );
  }, [ships]);

  const isHighlightedCell = useCallback((x: number, y: number): boolean => {
    if (type !== 'opponent') return false;
    
    const hitResults = sonarResults.filter(r => r.result === 'HIT');
    for (const hit of hitResults) {
      const ship = gameEngine.getShipAtPosition(ships, hit.x, hit.y);
      if (ship && !ship.sunk) {
        const remaining = gameEngine.getRemainingShipCells(ship);
        if (includesCell(remaining, { x, y })) {
          return true;
        }
      }
    }
    return false;
  }, [type, sonarResults, ships, gameEngine]);

  const renderCells = () => {
    const cells = [];
    
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const ship = getShipAtCell(x, y);
        const sonarResult = sonarResults.find(r => r.x === x && r.y === y);
        const isPendingTarget = pendingTarget?.x === x && pendingTarget?.y === y;
        const isHighlighted = isHighlightedCell(x, y);
        const isShipHit = ship && includesCell(ship.hits, { x, y });
        const isProbed = !!sonarResult;

        let cellContent = null;
        let cellBg = '';
        let cellStyle: React.CSSProperties = {};

        if (type === 'own' && ship) {
          const gradient = getShipGradient(ship.type, !!isShipHit, ship.sunk);
          if (gradient.startsWith('linear-gradient')) {
            cellStyle.background = gradient;
          } else {
            cellBg = gradient;
          }
          
          if (isShipHit) {
            cellContent = (
              <X className="w-4 h-4 text-white" />
            );
          }
        }

        if (sonarResult) {
          cellContent = (
            <div 
              className={`w-3/4 h-3/4 rounded-full ${getEchoColor(sonarResult.result)} ${getEchoGlow(sonarResult.result)} flex items-center justify-center`}
            >
              <span className="text-[8px] font-bold text-white font-orbitron">
                {sonarResult.result[0]}
              </span>
            </div>
          );
        }

        if (isHighlighted && !sonarResult) {
          cellBg = 'bg-danger-red/20';
        }

        if (isPendingTarget) {
          cellBg = 'bg-electric-blue/30 ring-2 ring-electric-blue';
        }

        cells.push(
          <div
            key={`${x}-${y}`}
            className={`
              grid-cell border border-grid-line/30 flex items-center justify-center
              ${cellBg}
              ${type === 'opponent' && !disabled && !isProbed ? 'cursor-pointer' : ''}
              ${type === 'own' ? 'cursor-default' : ''}
            `}
            style={{
              width: cellSize,
              height: cellSize,
              ...cellStyle,
            }}
            onClick={() => handleCellClick(x, y)}
          >
            {cellContent}
          </div>
        );
      }
    }

    return cells;
  };

  const gridWidth = GRID_SIZE * cellSize;
  const gridHeight = GRID_SIZE * cellSize;

  return (
    <div className="relative">
      <div 
        className="relative rounded-lg overflow-hidden"
        style={{
          width: gridWidth,
          height: gridHeight,
          background: 'linear-gradient(135deg, #0A1929 0%, #0D2137 100%)',
        }}
      >
        <div 
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${GRID_SIZE}, ${cellSize}px)`,
          }}
        >
          {renderCells()}
        </div>

        {type === 'opponent' && (
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 pointer-events-none"
            style={{ zIndex: 10 }}
          />
        )}

        {pendingTarget && type === 'opponent' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
            <div className="card p-6 text-center">
              <p className="text-gray-300 mb-4">
                确认对坐标 <span className="text-electric-blue font-bold font-orbitron">
                  ({String.fromCharCode(65 + pendingTarget.x)}, {pendingTarget.y + 1})
                </span> 发射声纳？
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={cancelSonarAttack}
                  className="btn-secondary"
                >
                  取消
                </button>
                <button
                  onClick={confirmSonarAttack}
                  className="btn-primary flex items-center gap-2 animate-pulse-glow"
                >
                  <span className="w-3 h-3 rounded-full bg-electric-blue animate-ping" />
                  发射声纳
                </button>
              </div>
            </div>
          </div>
        )}

        {disabled && type === 'opponent' && (
          <div className="absolute inset-0 bg-gray-900/60 flex items-center justify-center z-20">
            <div className="text-center">
              <div className="text-gray-400 text-lg font-orbitron">等待对手操作...</div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between mt-2 text-xs text-gray-500 font-orbitron">
        <span>{type === 'own' ? '己方海域' : '敌方海域'}</span>
        <span>{GRID_SIZE}×{GRID_SIZE}</span>
      </div>
    </div>
  );
}

export default GameGrid;
