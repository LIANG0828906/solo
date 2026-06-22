import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from './GameStore';
import {
  BOARD_CELLS,
  CELL_SIZE,
  CELL_GAP,
  CELL_TOTAL,
  BOARD_WIDTH,
  BOARD_HEIGHT,
  PLAYER_COLORS,
  ZONE_COLORS,
  getMarkerForCell,
  getMarkerSymbol,
  getCellCenterByIndex,
  type CellMarker,
} from './BoardConfig';
import type { BoardCell, Piece, Player } from './types';
import DiceRoll from './DiceRoll';
import EventCard from './EventCard';
import Leaderboard from './Leaderboard';
import VictoryPanel from './VictoryPanel';

const ZONE_BG_COLORS: Record<string, string> = {
  red: 'rgba(231, 76, 60, 0.7)',
  blue: 'rgba(52, 152, 219, 0.7)',
  yellow: 'rgba(241, 196, 15, 0.7)',
  green: 'rgba(46, 204, 113, 0.7)',
  center: 'rgba(120, 120, 120, 0.3)',
};

const PIECE_SIZE = 24;
const MOVE_DURATION = 300;

interface PieceAnimationState {
  pieceId: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  path: Array<{ x: number; y: number }>;
  startTime: number;
  duration: number;
}

export default function GameBoard() {
  const {
    players,
    currentPlayerIndex,
    diceValue,
    isRolling,
    phase,
    winner,
    selectedPieceId,
    movingPieceId,
    movingPiecePath,
    movingPieceProgress,
    isAnimating,
    flashingPieceIds,
    activeEventCard,
    selectPiece,
    moveSelectedPiece,
    setMovingProgress,
    finishAnimation,
    clearFlashing,
    dismissEventCard,
  } = useGameStore();

  const currentPlayer = players[currentPlayerIndex];

  const boardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [animationState, setAnimationState] = useState<PieceAnimationState | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const calculateScale = useCallback(() => {
    if (!containerRef.current) return 1;
    const container = containerRef.current;
    const padding = 48;
    const maxWidth = container.clientWidth - padding * 2;
    const maxHeight = container.clientHeight - padding * 2;
    const scaleX = maxWidth / BOARD_WIDTH;
    const scaleY = maxHeight / BOARD_HEIGHT;
    const newScale = Math.min(scaleX, scaleY, 1);
    return Math.max(newScale, 0.4);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const newScale = calculateScale();
      setScale(newScale);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateScale]);

  useEffect(() => {
    if (movingPieceId && movingPiecePath.length > 0) {
      const piece = findPieceById(movingPieceId);
      if (!piece) return;

      const currentIndex = movingPiecePath[0];
      const currentCenter = getCellCenterByIndex(currentIndex);

      const path: Array<{ x: number; y: number }> = [];
      if (piece.position === -1) {
        const startCenter = getCellCenterByIndex(movingPiecePath[0]);
        path.push(startCenter);
      } else {
        const startCenter = getCellCenterByIndex(piece.position);
        path.push(startCenter);
        for (let i = 0; i < movingPiecePath.length; i++) {
          path.push(getCellCenterByIndex(movingPiecePath[i]));
        }
      }

      const startPos = path[0];
      const endPos = path[path.length - 1];

      setAnimationState({
        pieceId: movingPieceId,
        fromX: startPos.x,
        fromY: startPos.y,
        toX: endPos.x,
        toY: endPos.y,
        path,
        startTime: performance.now(),
        duration: MOVE_DURATION,
      });
    }
  }, [movingPieceId, movingPiecePath]);

  useEffect(() => {
    if (!animationState) return;

    const animate = (now: number) => {
      const elapsed = now - animationState.startTime;
      const rawProgress = Math.min(elapsed / animationState.duration, 1);
      const easeOutProgress = 1 - Math.pow(1 - rawProgress, 3);

      setMovingProgress(easeOutProgress);

      if (rawProgress >= 1) {
        setAnimationState(null);
        finishAnimation();
        if (flashingPieceIds.length > 0) {
          setTimeout(() => {
            clearFlashing();
          }, 500);
        }
      } else {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animationState, finishAnimation, setMovingProgress, clearFlashing, flashingPieceIds]);

  const findPieceById = (pieceId: string): Piece | null => {
    for (const player of players) {
      const piece = player.pieces.find((p) => p.id === pieceId);
      if (piece) return piece;
    }
    return null;
  };

  const findPlayerByPieceId = (pieceId: string): Player | null => {
    for (const player of players) {
      if (player.pieces.some((p) => p.id === pieceId)) return player;
    }
    return null;
  };

  const getInterpolatedPosition = (piece: Piece, player: Player): { x: number; y: number } => {
    if (animationState && animationState.pieceId === piece.id) {
      const { fromX, fromY, toX, toY, path, startTime, duration } = animationState;
      const now = performance.now();
      const elapsed = now - startTime;
      const rawProgress = Math.min(elapsed / duration, 1);
      const t = 1 - Math.pow(1 - rawProgress, 3);

      if (path.length <= 2) {
        const x = fromX + (toX - fromX) * t;
        const y = fromY + (toY - fromY) * t - Math.sin(t * Math.PI) * 20;
        return { x, y };
      }

      const segmentCount = path.length - 1;
      const segmentProgress = t * segmentCount;
      const currentSegment = Math.min(Math.floor(segmentProgress), segmentCount - 1);
      const segmentT = segmentProgress - currentSegment;

      const segFrom = path[currentSegment];
      const segTo = path[currentSegment + 1];
      const easeSegT = 1 - Math.pow(1 - segmentT, 2);

      const x = segFrom.x + (segTo.x - segFrom.x) * easeSegT;
      const y = segFrom.y + (segTo.y - segFrom.y) * easeSegT - Math.sin(segmentT * Math.PI) * 15;

      return { x, y };
    }

    if (piece.isHome || piece.position === 28) {
      const startIdx = players.findIndex((p) => p.id === player.id);
      const homeColors: Record<number, [number, number]> = {
        0: [1, 1],
        1: [6, 1],
        2: [6, 6],
        3: [1, 6],
      };
      const [row, col] = homeColors[startIdx] || [3.5, 3.5];
      return { x: col * CELL_TOTAL + CELL_SIZE / 2, y: row * CELL_TOTAL + CELL_SIZE / 2 };
    }

    if (piece.position === -1) {
      const playerIdx = players.findIndex((p) => p.id === player.id);
      const pieceIdx = player.pieces.findIndex((p) => p.id === piece.id);
      const basePositions: Array<Array<[number, number]>> = [
        [
          [0.2, 0.2],
          [0.2, 0.5],
          [0.5, 0.2],
          [0.5, 0.5],
        ],
        [
          [7.3, 0.2],
          [7.3, 0.5],
          [7.6, 0.2],
          [7.6, 0.5],
        ],
        [
          [7.3, 7.2],
          [7.3, 7.5],
          [7.6, 7.2],
          [7.6, 7.5],
        ],
        [
          [0.2, 7.2],
          [0.2, 7.5],
          [0.5, 7.2],
          [0.5, 7.5],
        ],
      ];
      const [row, col] = basePositions[playerIdx]?.[pieceIdx] || [0, 0];
      return { x: col * CELL_TOTAL + CELL_SIZE / 2, y: row * CELL_TOTAL + CELL_SIZE / 2 };
    }

    return getCellCenterByIndex(piece.position);
  };

  const getPiecesOnCell = (cellIndex: number): Array<{ piece: Piece; player: Player }> => {
    const result: Array<{ piece: Piece; player: Player }> = [];
    for (const player of players) {
      for (const piece of player.pieces) {
        if (piece.position === cellIndex && !piece.isHome && piece.position !== -1) {
          result.push({ piece, player });
        }
      }
    }
    return result;
  };

  const handleCellClick = (cell: BoardCell) => {
    if (phase !== 'moving' || isAnimating) return;
    const currentPlayer = players[currentPlayerIndex];
    if (!currentPlayer) return;

    const piecesOnCell = getPiecesOnCell(cell.index);
    const currentPlayerPieces = piecesOnCell.filter((p) => p.player.id === currentPlayer.id);

    if (currentPlayerPieces.length === 1 && diceValue !== null) {
      const movablePieces = currentPlayer.pieces.filter((p) => {
        if (p.isHome) return false;
        if (p.position === -1) return diceValue === 6;
        return true;
      });
      if (movablePieces.some((p) => p.id === currentPlayerPieces[0].piece.id)) {
        selectPiece(currentPlayerPieces[0].piece.id);
        setTimeout(() => moveSelectedPiece(), 50);
      }
    }
  };

  const handlePieceClick = (piece: Piece, player: Player) => {
    if (phase !== 'moving' || isAnimating) return;
    const currentPlayer = players[currentPlayerIndex];
    if (!currentPlayer || player.id !== currentPlayer.id) return;
    if (diceValue === null) return;

    const canMove = piece.isHome
      ? false
      : piece.position === -1
        ? diceValue === 6
        : true;

    if (canMove) {
      selectPiece(piece.id);
      setTimeout(() => moveSelectedPiece(), 50);
    }
  };

  const renderCellMarker = (cell: BoardCell) => {
    const marker: CellMarker = getMarkerForCell(
      cell.index,
      cell.isStart,
      cell.isEvent,
      cell.isShortcut,
      cell.zone,
    );
    const symbol = getMarkerSymbol(marker);

    if (!symbol) return null;

    const markerClasses: Record<CellMarker, string> = {
      'star-solid': 'text-yellow-400 text-lg drop-shadow-md',
      'star-outline': 'text-yellow-300 text-lg drop-shadow-md',
      'arrow-left': 'text-white text-xl drop-shadow-md',
      'arrow-right': 'text-white text-xl drop-shadow-md',
      'dot': 'text-white/50 text-sm',
      'none': '',
    };

    return (
      <span
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-bold pointer-events-none select-none ${markerClasses[marker]}`}
      >
        {symbol}
      </span>
    );
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-screen bg-[#5a3d2b] flex items-center justify-center overflow-hidden relative"
      style={{
        backgroundImage: `
          radial-gradient(ellipse at center, rgba(90, 61, 43, 0.8) 0%, rgba(70, 45, 30, 1) 100%),
          repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.05) 10px, rgba(0,0,0,0.05) 20px)
        `,
      }}
    >
      <div className="absolute top-0 left-0 right-0 z-20">
        <Leaderboard />
      </div>

      <div
        ref={boardRef}
        className="relative flex-shrink-0 transition-transform duration-300 ease-out"
        style={{
          width: BOARD_WIDTH,
          height: BOARD_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        <div className="absolute inset-0 rounded-xl border-4 border-[#c9a94e] shadow-2xl overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(135deg, rgba(201, 169, 78, 0.1) 0%, transparent 50%, rgba(201, 169, 78, 0.1) 100%)
              `,
            }}
          />

          {BOARD_CELLS.map((cell) => {
            const piecesOnCell = getPiecesOnCell(cell.index);
            const isClickable =
              phase === 'moving' &&
              !isAnimating &&
              piecesOnCell.some(
                (p) => p.player.id === players[currentPlayerIndex]?.id,
              );

            return (
              <div
                key={cell.index}
                className={`absolute border border-[#c9a94e] transition-all duration-150 ${
                  isClickable ? 'cursor-pointer hover:brightness-110 hover:scale-105 ring-2 ring-yellow-400/50' : ''
                }`}
                style={{
                  left: cell.col * CELL_TOTAL,
                  top: cell.row * CELL_TOTAL,
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  backgroundColor: ZONE_BG_COLORS[cell.zone] || ZONE_BG_COLORS.center,
                  borderRadius: cell.isStart ? '8px' : '4px',
                }}
                onClick={() => handleCellClick(cell)}
              >
                <span className="absolute top-1 left-1 text-[10px] text-white/60 font-mono select-none">
                  {cell.index}
                </span>
                {renderCellMarker(cell)}
              </div>
            );
          })}

          {players.map((player, playerIdx) =>
            player.pieces.map((piece, pieceIdx) => {
              const pos = getInterpolatedPosition(piece, player);
              const isFlashing = flashingPieceIds.includes(piece.id);
              const isSelected = selectedPieceId === piece.id;
              const isMoving = movingPieceId === piece.id;
              const isCurrentPlayerPiece = playerIdx === currentPlayerIndex;
              const currentPlayer = players[currentPlayerIndex];
              const canMove =
                phase === 'moving' &&
                !isAnimating &&
                isCurrentPlayerPiece &&
                !piece.isHome &&
                diceValue !== null &&
                (piece.position === -1 ? diceValue === 6 : true);

              const pieceColor = PLAYER_COLORS[player.color];
              const darkerColor = player.color === 'red' ? '#b91c1c' :
                player.color === 'blue' ? '#1d4ed8' :
                player.color === 'yellow' ? '#b45309' : '#15803d';

              let offsetX = 0;
              let offsetY = 0;
              if (piece.position >= 0 && piece.position < 28 && !piece.isHome) {
                const piecesOnSameCell = getPiecesOnCell(piece.position);
                const idx = piecesOnSameCell.findIndex((p) => p.piece.id === piece.id);
                if (idx > 0) {
                  const angle = (idx * Math.PI * 2) / Math.max(piecesOnSameCell.length, 1);
                  const radius = 10;
                  offsetX = Math.cos(angle) * radius;
                  offsetY = Math.sin(angle) * radius;
                }
              }

              return (
                <div
                  key={piece.id}
                  className={`absolute rounded-full ${
                    isFlashing ? 'animate-pulse' : ''
                  } ${isMoving ? 'z-50' : 'z-10'} ${
                    canMove ? 'cursor-pointer hover:scale-125' : ''
                  } ${isSelected ? 'ring-4 ring-yellow-300 scale-110 z-30' : ''}`}
                  style={{
                    left: pos.x - PIECE_SIZE / 2 + offsetX,
                    top: pos.y - PIECE_SIZE / 2 + offsetY,
                    width: PIECE_SIZE,
                    height: PIECE_SIZE,
                    background: `
                      radial-gradient(circle at 30% 30%, ${pieceColor} 0%, ${darkerColor} 70%, rgba(0,0,0,0.4) 100%)
                    `,
                    boxShadow: isFlashing
                      ? `0 0 20px 5px rgba(239, 68, 68, 0.8), inset 0 -2px 4px rgba(0,0,0,0.4)`
                      : isSelected
                        ? `0 0 15px 3px rgba(250, 204, 21, 0.6), inset 0 -2px 4px rgba(0,0,0,0.4)`
                        : `0 2px 6px rgba(0,0,0,0.4), inset 0 -2px 4px rgba(0,0,0,0.3)`,
                    transition: canMove ? 'transform 0.15s ease-out' : 'none',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePieceClick(piece, player);
                  }}
                >
                  <div
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{
                      background: `
                        radial-gradient(circle at 35% 35%, rgba(255,255,255,0.6) 0%, transparent 40%)
                      `,
                    }}
                  />
                  <div
                    className="absolute inset-1 rounded-full pointer-events-none"
                    style={{
                      border: `1px solid rgba(255,255,255,0.3)`,
                    }}
                  />
                </div>
              );
            }),
          )}
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-4">
        <DiceRoll />
        {phase === 'waiting' && players[currentPlayerIndex]?.eventCards.length > 0 && (
          <EventCard />
        )}
        {phase === 'moving' && currentPlayer?.pieces && diceValue !== null && (
          <div className="text-white text-sm bg-black/60 px-4 py-2 rounded-lg backdrop-blur-sm">
            点击你要移动的棋子（骰子点数：{diceValue}）
          </div>
        )}
      </div>

      {activeEventCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-amber-600 to-amber-800 text-white p-8 rounded-2xl shadow-2xl text-center transform rotate-y-180 animate-flip">
            <h3 className="text-2xl font-bold mb-4 font-serif">事件卡</h3>
            <p className="text-lg">
              {activeEventCard === 'advance2_clear' && '前进2格并清空目标格棋子！'}
              {activeEventCard === 'retreat3_collision' && '后退3格并触发附近碰撞！'}
              {activeEventCard === 'teleport_ally' && '传送至己方棋子位置！'}
            </p>
            <button
              onClick={dismissEventCard}
              className="mt-6 px-6 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              确认
            </button>
          </div>
        </div>
      )}

      {winner && <VictoryPanel />}

      <style>{`
        @keyframes flip {
          0% { transform: perspective(1000px) rotateY(90deg); opacity: 0; }
          50% { transform: perspective(1000px) rotateY(0deg); opacity: 1; }
          100% { transform: perspective(1000px) rotateY(0deg); opacity: 1; }
        }
        .animate-flip {
          animation: flip 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
