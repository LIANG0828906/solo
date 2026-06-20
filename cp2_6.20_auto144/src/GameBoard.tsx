import { useMemo } from 'react';
import { useGameStore } from '@/GameStore';
import { getCellPosition, TOTAL_CELLS } from '@/GameLogic';
import CellComponent from '@/components/Cell';
import DiceRoll from '@/DiceRoll';
import Leaderboard from '@/components/Leaderboard';
import PlayerPanel from '@/components/PlayerPanel';
import EventCardOverlay from '@/components/EventCard';
import VictoryModal from '@/components/VictoryModal';
import type { PlayerColor } from '@/types/game';

export default function GameBoard() {
  const players = useGameStore((s) => s.players);
  const cells = useGameStore((s) => s.cells);
  const currentPlayerIndex = useGameStore((s) => s.currentPlayerIndex);
  const diceValue = useGameStore((s) => s.diceValue);
  const isRolling = useGameStore((s) => s.isRolling);
  const activeEvent = useGameStore((s) => s.activeEvent);
  const gamePhase = useGameStore((s) => s.gamePhase);
  const winner = useGameStore((s) => s.winner);
  const collidedPieces = useGameStore((s) => s.collidedPieces);
  const eventMessage = useGameStore((s) => s.eventMessage);

  const rollDice = useGameStore((s) => s.rollDice);
  const setDiceComplete = useGameStore((s) => s.setDiceComplete);
  const movePiece = useGameStore((s) => s.movePiece);
  const useEventCard = useGameStore((s) => s.useEventCard);
  const skipTurn = useGameStore((s) => s.skipTurn);
  const resetGame = useGameStore((s) => s.resetGame);
  const handleTurnTimeout = useGameStore((s) => s.handleTurnTimeout);

  const currentPlayer = players[currentPlayerIndex];
  const currentPlayerId = currentPlayer?.id ?? '';

  const playerColors = useMemo<Record<string, PlayerColor>>(() => {
    const map: Record<string, PlayerColor> = {};
    for (const player of players) {
      map[player.id] = player.color;
    }
    return map;
  }, [players]);

  const piecesByCell = useMemo(() => {
    const map: Record<number, typeof players[0]['pieces']> = {};
    for (const player of players) {
      for (const piece of player.pieces) {
        if (piece.position >= 0 && !piece.isFinished) {
          if (!map[piece.position]) map[piece.position] = [];
          map[piece.position].push(piece);
        }
      }
    }
    return map;
  }, [players]);

  const gridCells = useMemo(() => {
    const grid: (typeof cells[0])[][] = [[], [], [], []];
    for (const cell of cells) {
      grid[cell.row].push(cell);
    }
    for (let r = 0; r < 4; r++) {
      grid[r].sort((a, b) => a.col - b.col);
    }
    return grid;
  }, [cells]);

  const basePieces = useMemo(() => {
    return players.map((player) => ({
      playerId: player.id,
      color: player.color,
      name: player.name,
      pieces: player.pieces.filter((p) => p.position === -1 && !p.isFinished),
      finishedPieces: player.pieces.filter((p) => p.isFinished),
    }));
  }, [players]);

  if (gamePhase !== 'playing' && gamePhase !== 'finished') return null;

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        background: '#5a3d2b',
        overflow: 'auto',
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .game-layout { flex-direction: column !important; }
          .leaderboard-panel { 
            width: 100% !important; 
            height: auto !important; 
            min-height: 120px !important;
            max-height: 200px !important;
          }
        }
      `}</style>

      <div
        className="game-layout"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'row',
          padding: 20,
          gap: 20,
          minWidth: 0,
        }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              padding: 16,
              background: 'rgba(0,0,0,0.2)',
              borderRadius: 12,
              border: '2px solid rgba(212,175,55,0.3)',
            }}
          >
            {gridCells.map((row, rowIdx) => (
              <div key={rowIdx} style={{ display: 'flex', gap: 4 }}>
                {row.map((cell) => (
                  <CellComponent
                    key={cell.id}
                    cell={cell}
                    pieces={piecesByCell[cell.id] || []}
                    playerColors={playerColors}
                    collidedPieces={collidedPieces}
                    currentPlayerId={currentPlayerId}
                    onPieceClick={movePiece}
                    diceValue={diceValue}
                  />
                ))}
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
              justifyContent: 'center',
              padding: '8px 16px',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 8,
            }}
          >
            {basePieces.map((bp) => (
              <div
                key={bp.playerId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 8px',
                  borderRadius: 6,
                  background:
                    bp.playerId === currentPlayerId
                      ? 'rgba(212,175,55,0.2)'
                      : 'transparent',
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background:
                      bp.color === 'red'
                        ? '#e74c3c'
                        : bp.color === 'blue'
                          ? '#3498db'
                          : bp.color === 'yellow'
                            ? '#f1c40f'
                            : '#2ecc71',
                  }}
                />
                <span style={{ color: 'white', fontSize: 12 }}>
                  {bp.name}
                </span>
                <span style={{ color: '#aaa', fontSize: 10 }}>
                  基地:{bp.pieces.length} ✓:{bp.finishedPieces.length}
                </span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 8 }}>
            <DiceRoll
              onRoll={() => {
                rollDice();
                setTimeout(setDiceComplete, 900);
              }}
              isRolling={isRolling}
              diceValue={diceValue}
              disabled={currentPlayerIndex !== 0}
            />
          </div>

          {currentPlayer && (
            <PlayerPanel
              player={currentPlayer}
              diceValue={diceValue}
              isRolling={isRolling}
              onRollDice={() => {
                rollDice();
                setTimeout(setDiceComplete, 900);
              }}
              onUseEventCard={useEventCard}
              onMovePiece={movePiece}
              onSkipTurn={skipTurn}
              collidedPieces={collidedPieces}
            />
          )}
        </div>

        <div className="leaderboard-panel">
          <Leaderboard
            players={players}
            currentPlayerIndex={currentPlayerIndex}
          />
        </div>
      </div>

      {activeEvent && (
        <EventCardOverlay event={activeEvent} message={eventMessage} />
      )}

      {gamePhase === 'finished' && winner && (
        <VictoryModal
          winner={winner}
          players={players}
          onRestart={resetGame}
        />
      )}
    </div>
  );
}
