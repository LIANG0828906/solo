import { useEffect, useRef, useState, useCallback, memo } from 'react';
import {
  BOARD_SIZE,
  CELL_SIZE,
  ELEMENT_CONFIGS,
  PIECE_SIZE,
  PLAYER_COLORS,
  type BoardCell,
  type ElementType,
  type Piece,
  type PlayerId,
} from './entities';
import { useGameState } from './GameState';
import { AnimationModule, type Particle } from './AnimationModule';
import { EventBus, type EventName } from './EventBus';

interface RangeCell {
  x: number;
  y: number;
  isTarget: boolean;
}

const getRangeCells = (piece: Piece, board: BoardCell[][]): RangeCell[] => {
  const cells: RangeCell[] = [];
  const { x: px, y: py } = piece.position;
  const r = piece.range;

  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const x = px + dx;
      const y = py + dy;
      if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) continue;
      if (dx === 0 && dy === 0) continue;
      if (Math.max(Math.abs(dx), Math.abs(dy)) > r) continue;

      const cellPiece = board[y][x].piece;
      const isTarget = !!cellPiece && cellPiece.player !== piece.player;
      cells.push({ x, y, isTarget });
    }
  }
  return cells;
};

const PieceView = memo(function PieceView({
  piece,
  isSelected,
  isHit,
  onClick,
}: {
  piece: Piece;
  isSelected: boolean;
  isHit: boolean;
  onClick: () => void;
}) {
  const config = ELEMENT_CONFIGS[piece.element];
  const playerColor = PLAYER_COLORS[piece.player];
  const hpPercent = (piece.hp / piece.maxHp) * 100;

  const elementIcons: Record<ElementType, string> = {
    fire: '🔥',
    ice: '❄️',
    wind: '🌀',
    earth: '🪨',
  };

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={{
        position: 'absolute',
        width: CELL_SIZE,
        height: CELL_SIZE,
        left: piece.position.x * CELL_SIZE,
        top: piece.position.y * CELL_SIZE,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transform: isHit ? 'translate(3px, 0)' : 'translate(0, 0)',
        transition: 'transform 200ms ease-out',
        zIndex: isSelected ? 20 : 10,
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: PIECE_SIZE + 12,
          height: PIECE_SIZE + 12,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${playerColor}33 0%, transparent 70%)`,
          bottom: 2,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          width: PIECE_SIZE,
          height: PIECE_SIZE,
          borderRadius: '50%',
          background: `radial-gradient(circle at 30% 30%, ${config.colorStart}, ${config.colorEnd})`,
          boxShadow: isSelected
            ? `0 0 20px ${config.colorStart}, 0 0 40px ${config.colorStart}88, inset 0 -8px 16px rgba(0,0,0,0.4)`
            : `0 4px 12px rgba(0,0,0,0.5), inset 0 -8px 16px rgba(0,0,0,0.4)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          transition: 'box-shadow 200ms ease',
          transform: isSelected ? 'scale(1.05)' : 'scale(1)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 12,
            width: 16,
            height: 8,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.35)',
            filter: 'blur(2px)',
          }}
        />

        <span style={{ fontSize: 24, position: 'relative', zIndex: 2 }}>
          {elementIcons[piece.element]}
        </span>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 4,
          width: 46,
          height: 5,
          borderRadius: 3,
          background: 'rgba(0,0,0,0.6)',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.2)',
        }}
      >
        <div
          style={{
            width: `${hpPercent}%`,
            height: '100%',
            background:
              hpPercent > 60
                ? 'linear-gradient(90deg, #4CAF50, #8BC34A)'
                : hpPercent > 30
                  ? 'linear-gradient(90deg, #FFC107, #FF9800)'
                  : 'linear-gradient(90deg, #F44336, #E91E63)',
            transition: 'width 300ms ease',
          }}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          width: PIECE_SIZE + 4,
          height: PIECE_SIZE + 4,
          borderRadius: '50%',
          border: isSelected ? `3px solid ${config.colorStart}` : '2px solid transparent',
          pointerEvents: 'none',
          animation: isSelected ? 'pulse-ring 1s infinite' : 'none',
        }}
      />
    </div>
  );
});

const ParticleView = memo(function ParticleView({
  particles,
}: {
  particles: Particle[];
}) {
  return (
    <>
      {particles.map((p) => {
        const opacity = p.life / p.maxLife;
        const scale = 0.5 + opacity * 0.5;

        let shapeStyle: React.CSSProperties = {
          borderRadius: '50%',
        };

        if (p.shape === 'fire') {
          shapeStyle = {
            borderRadius: '50% 0 50% 50%',
            transform: `scale(${scale}) rotate(45deg)`,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
          };
        } else if (p.shape === 'ice') {
          shapeStyle = {
            clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
            transform: `scale(${scale})`,
            boxShadow: `0 0 ${p.size}px ${p.color}`,
          };
        } else if (p.shape === 'wind') {
          shapeStyle = {
            borderRadius: '50%',
            border: `2px solid ${p.color}`,
            background: 'transparent',
            transform: `scale(${scale * 1.5})`,
          };
        } else if (p.shape === 'rock') {
          shapeStyle = {
            borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
            transform: `scale(${scale}) rotate(${p.life * 10}deg)`,
          };
        }

        return (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: p.x - p.size / 2,
              top: p.y - p.size / 2,
              width: p.size,
              height: p.size,
              background: p.shape === 'wind' ? 'transparent' : p.color,
              opacity,
              pointerEvents: 'none',
              zIndex: 30,
              ...shapeStyle,
            }}
          />
        );
      })}
    </>
  );
});

const RangeHighlight = memo(function RangeHighlight({
  cells,
  attackableIds,
}: {
  cells: RangeCell[];
  attackableIds: Set<string>;
}) {
  return (
    <>
      {cells.map((cell, idx) => {
        const cellKey = `${cell.x}-${cell.y}`;
        const isTarget = attackableIds.has(cellKey);
        return (
          <div
            key={idx}
            style={{
              position: 'absolute',
              left: cell.x * CELL_SIZE + 6,
              top: cell.y * CELL_SIZE + 6,
              width: CELL_SIZE - 12,
              height: CELL_SIZE - 12,
              borderRadius: 8,
              background: isTarget
                ? 'rgba(244, 67, 54, 0.35)'
                : 'rgba(76, 175, 80, 0.25)',
              border: isTarget
                ? '2px dashed rgba(244, 67, 54, 0.8)'
                : '2px dashed rgba(76, 175, 80, 0.6)',
              animation: isTarget ? 'blink-target 0.6s infinite' : 'blink-range 0.8s infinite',
              pointerEvents: isTarget ? 'auto' : 'none',
              cursor: isTarget ? 'crosshair' : 'default',
              zIndex: 5,
            }}
          />
        );
      })}
    </>
  );
});

const VictoryFlag = memo(function VictoryFlag({ winner }: { winner: PlayerId }) {
  const color = PLAYER_COLORS[winner];
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        bottom: 0,
        transform: 'translateX(-50%)',
        zIndex: 100,
        pointerEvents: 'none',
        animation: 'flag-rise 2s ease-out forwards',
      }}
    >
      <div
        style={{
          width: 6,
          height: 280,
          background: 'linear-gradient(180deg, #5D4037, #3E2723)',
          borderRadius: 3,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 6,
            width: 100,
            height: 60,
            background: `linear-gradient(135deg, ${color}, ${color}CC)`,
            clipPath: 'polygon(0 0, 100% 0, 85% 50%, 100% 100%, 0 100%)',
            boxShadow: `0 4px 16px ${color}88`,
            transformOrigin: 'left center',
            animation: 'flag-wave 1.5s ease-in-out infinite',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 24,
              fontWeight: 'bold',
              textShadow: '0 2px 4px rgba(0,0,0,0.5)',
            }}
          >
            🏆
          </div>
        </div>
      </div>
    </div>
  );
});

export function Board() {
  const {
    board,
    currentPlayer,
    selectedPieceId,
    selectPiece,
    performAttack,
    getPieceById,
    getAttackableTargets,
    hitPieceIds,
    winner,
  } = useGameState();

  const canvasRef = useRef<HTMLDivElement>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [rangeCells, setRangeCells] = useState<RangeCell[]>([]);
  const [attackableCellIds, setAttackableCellIds] = useState<Set<string>>(new Set());

  const selectedPiece = selectedPieceId ? getPieceById(selectedPieceId) : null;

  useEffect(() => {
    if (!selectedPiece) {
      setRangeCells([]);
      setAttackableCellIds(new Set());
      return;
    }
    const cells = getRangeCells(selectedPiece, board);
    const targets = getAttackableTargets(selectedPieceId!);
    const targetSet = new Set(targets.map((t) => `${t.position.x}-${t.position.y}`));
    setRangeCells(cells);
    setAttackableCellIds(targetSet);
  }, [selectedPieceId, board, selectedPiece, getAttackableTargets]);

  useEffect(() => {
    let animId: number;
    const tick = () => {
      const ps = AnimationModule.getAllParticles();
      setParticles(ps.particles);
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  useEffect(() => {
    const off1 = EventBus.on('PIECE_SELECT' as EventName, ({ pieceId }) => {
      const piece = useGameState.getState().getPieceById(pieceId);
      if (piece) {
        AnimationModule.spawnBoardEdgeParticles(piece.element);
      }
    });
    const off2 = EventBus.on('PIECE_ATTACK' as EventName, ({ attackerId, targetId }) => {
      const state = useGameState.getState();
      const attacker = state.getPieceById(attackerId);
      const target = state.getPieceById(targetId);
      if (attacker && target) {
        AnimationModule.playAttackAnimation(attacker, target);
      }
    });
    const off3 = EventBus.on('GAME_END' as EventName, ({ winner: w }) => {
      AnimationModule.playVictoryAnimation(w);
    });

    return () => {
      off1();
      off2();
      off3();
    };
  }, []);

  const handleCellClick = useCallback(
    (x: number, y: number) => {
      if (winner) return;
      const cell = board[y][x];
      const clickedPiece = cell.piece;

      if (selectedPiece) {
        const targetKey = `${x}-${y}`;
        if (attackableCellIds.has(targetKey) && clickedPiece) {
          performAttack(selectedPieceId!, clickedPiece.id);
          return;
        }
      }

      if (clickedPiece) {
        if (clickedPiece.player === currentPlayer) {
          selectPiece(selectedPieceId === clickedPiece.id ? null : clickedPiece.id);
        } else if (selectedPiece && attackableCellIds.has(`${x}-${y}`)) {
          performAttack(selectedPieceId!, clickedPiece.id);
        }
      } else {
        selectPiece(null);
      }
    },
    [
      board,
      selectedPiece,
      selectedPieceId,
      currentPlayer,
      attackableCellIds,
      selectPiece,
      performAttack,
      winner,
    ]
  );

  const allPieces: Piece[] = [];
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (board[y][x].piece) allPieces.push(board[y][x].piece!);
    }
  }

  const boardPixelSize = BOARD_SIZE * CELL_SIZE;

  return (
    <div
      ref={canvasRef}
      style={{
        position: 'relative',
        width: boardPixelSize,
        height: boardPixelSize,
        background: `
          linear-gradient(135deg, #3E2723 0%, #4E342E 50%, #3E2723 100%),
          repeating-linear-gradient(90deg, rgba(0,0,0,0.03) 0px, transparent 2px, transparent 8px),
          repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0px, transparent 2px, transparent 8px)
        `,
        backgroundBlendMode: 'multiply',
        borderRadius: 12,
        boxShadow:
          '0 12px 40px rgba(0,0,0,0.6), inset 0 0 80px rgba(0,0,0,0.3)',
        padding: 0,
        overflow: 'hidden',
        border: '4px solid #5D4037',
      }}
    >
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: boardPixelSize,
          height: boardPixelSize,
          pointerEvents: 'none',
        }}
      >
        {Array.from({ length: BOARD_SIZE + 1 }).map((_, i) => (
          <line
            key={`v-${i}`}
            x1={i * CELL_SIZE}
            y1={0}
            x2={i * CELL_SIZE}
            y2={boardPixelSize}
            stroke="#5D4037"
            strokeWidth={2}
          />
        ))}
        {Array.from({ length: BOARD_SIZE + 1 }).map((_, i) => (
          <line
            key={`h-${i}`}
            x1={0}
            y1={i * CELL_SIZE}
            x2={boardPixelSize}
            y2={i * CELL_SIZE}
            stroke="#5D4037"
            strokeWidth={2}
          />
        ))}
      </svg>

      {Array.from({ length: BOARD_SIZE }).map((_, y) =>
        Array.from({ length: BOARD_SIZE }).map((_, x) => (
          <div
            key={`cell-${x}-${y}`}
            onClick={() => handleCellClick(x, y)}
            style={{
              position: 'absolute',
              left: x * CELL_SIZE,
              top: y * CELL_SIZE,
              width: CELL_SIZE,
              height: CELL_SIZE,
              cursor: 'pointer',
              background:
                (x + y) % 2 === 0
                  ? 'rgba(93, 64, 55, 0.15)'
                  : 'rgba(62, 39, 35, 0.1)',
            }}
          />
        ))
      )}

      {rangeCells.length > 0 && (
        <RangeHighlight cells={rangeCells} attackableIds={attackableCellIds} />
      )}

      {allPieces.map((piece) => (
        <PieceView
          key={piece.id}
          piece={piece}
          isSelected={selectedPieceId === piece.id}
          isHit={hitPieceIds.has(piece.id)}
          onClick={() => {
            if (piece.player === currentPlayer) {
              selectPiece(selectedPieceId === piece.id ? null : piece.id);
            } else if (selectedPiece && attackableCellIds.has(`${piece.position.x}-${piece.position.y}`)) {
              performAttack(selectedPieceId!, piece.id);
            }
          }}
        />
      ))}

      <ParticleView particles={particles} />

      {winner && <VictoryFlag winner={winner} />}

      <style>{`
        @keyframes pulse-ring {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.4); }
          50% { box-shadow: 0 0 0 8px rgba(255,255,255,0); }
        }
        @keyframes blink-range {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.9; }
        }
        @keyframes blink-target {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.03); }
        }
        @keyframes flag-rise {
          0% { transform: translateX(-50%) translateY(320px); }
          100% { transform: translateX(-50%) translateY(0); }
        }
        @keyframes flag-wave {
          0%, 100% { transform: skewY(0deg) scaleX(1); }
          25% { transform: skewY(-3deg) scaleX(0.95); }
          75% { transform: skewY(3deg) scaleX(1.05); }
        }
      `}</style>
    </div>
  );
}
