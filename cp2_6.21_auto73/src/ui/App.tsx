import { useEffect, useRef, useState, useCallback } from 'react';
import { GameBoard } from './GameBoard';
import { PlayerPanel } from './PlayerPanel';
import { WaitingRoom } from './WaitingRoom';
import { GameResult } from './GameResult';
import { BattleModal } from './BattleModal';
import { GameEngine } from '../game/gameEngine';
import { createSocketService } from '../game/socketService';
import { useGameStore } from '../store/useGameStore';
import type { BattleResult, InitialGameData, Piece, TerrainType } from '../game/types';
import './App.css';

const gameEngine = new GameEngine();
const socketService = createSocketService(gameEngine, { useMock: true });

export function App() {
  const {
    page,
    gameState,
    yourPlayerId,
    selectedPieceId,
    battleResult,
    showBattle,
    setPage,
    setGameState,
    setSelectedPieceId,
    setBattleResult,
    setShowBattle,
    initFromGameData,
    resetGame,
  } = useGameStore();

  const [battleAttackerId, setBattleAttackerId] = useState('');
  const [terrainStats, setTerrainStats] = useState<Record<string, Record<TerrainType, number>>>({});
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initializedRef = useRef(false);

  const handleGameStart = useCallback((data: InitialGameData) => {
    gameEngine.initGame(data);
    initFromGameData(data);
    setTerrainStats(gameEngine.getTerrainStats());
  }, [initFromGameData]);

  const handleBattle = useCallback((result: BattleResult) => {
    setBattleAttackerId(result.attackerId);
    setBattleResult(result);
    setShowBattle(true);
  }, [setBattleResult, setShowBattle]);

  const handleBattleClose = useCallback(() => {
    setShowBattle(false);
    setBattleResult(null);
  }, [setShowBattle, setBattleResult]);

  const handleGameEnd = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setTerrainStats(gameEngine.getTerrainStats());
    setPage('result');
  }, [setPage]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const connectAndJoin = async () => {
      try {
        await socketService.connect();
        socketService.joinQueue('玩家 1');
      } catch (err) {
        console.error('连接失败:', err);
      }
    };

    const unsubGameStart = socketService.on('game_start', (data: unknown) => {
      handleGameStart(data as InitialGameData);
    });

    const unsubStateChange = gameEngine.on('stateChange', () => {
      setGameState(gameEngine.getState());
      setTerrainStats(gameEngine.getTerrainStats());
    });

    const unsubBattle = gameEngine.on('battle', (result: unknown) => {
      handleBattle(result as BattleResult);
    });

    const unsubGameEnd = gameEngine.on('gameEnd', () => {
      handleGameEnd();
    });

    connectAndJoin();

    return () => {
      unsubGameStart();
      unsubStateChange();
      unsubBattle();
      unsubGameEnd();
      socketService.disconnect();
    };
  }, [handleGameStart, handleBattle, handleGameEnd, setGameState]);

  useEffect(() => {
    if (gameState?.gameStatus === 'playing' && !timerRef.current) {
      timerRef.current = setInterval(() => {
        gameEngine.decrementTime();
      }, 1000);
    }

    return () => {
      if (timerRef.current && gameState?.gameStatus !== 'playing') {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [gameState?.gameStatus]);

  const handleMove = useCallback(
    (pieceId: string, targetX: number, targetY: number) => {
      if (!gameState || gameState.gameStatus !== 'playing') return;
      if (gameState.currentPlayerId !== yourPlayerId) return;

      socketService.sendMove(pieceId, targetX, targetY);
    },
    [gameState, yourPlayerId],
  );

  const handleRematch = useCallback(() => {
    resetGame();
    initializedRef.current = false;
    setTimeout(() => {
      initializedRef.current = true;
      socketService.rematch();
    }, 100);
  }, [resetGame]);

  const getPieces = useCallback((): Piece[] => {
    if (!gameState) return [];
    const pieces: Piece[] = [];
    for (const playerId in gameState.players) {
      pieces.push(...gameState.players[playerId].pieces);
    }
    return pieces;
  }, [gameState]);

  const isYourTurn = gameState?.currentPlayerId === yourPlayerId;

  if (page === 'waiting') {
    return <WaitingRoom playerName="玩家 1" />;
  }

  const player1 = gameState?.players['player1'];
  const player2 = gameState?.players['player2'];

  return (
    <div className="app-container">
      <div className="game-header">
        <h1 className="app-title">策略战棋</h1>
        <div className="turn-indicator">
          {gameState?.gameStatus === 'playing' && (
            <>
              <span className="turn-label">当前回合:</span>
              <span
                className="turn-player"
                style={{
                  color: gameState.players[gameState.currentPlayerId]?.color || 'white',
                }}
              >
                {gameState.players[gameState.currentPlayerId]?.name || ''}
                {isYourTurn ? ' (你)' : ''}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="game-layout">
        {player1 && (
          <div className="side-panel left-panel">
            <PlayerPanel
              player={player1}
              isCurrentTurn={gameState?.currentPlayerId === 'player1'}
              isYou={yourPlayerId === 'player1'}
              turnTimeLeft={
                gameState?.currentPlayerId === 'player1'
                  ? gameState.turnTimeLeft
                  : undefined
              }
              isLeft={true}
            />
          </div>
        )}

        <div className="board-area">
          {gameState && (
            <GameBoard
              board={gameState.board}
              pieces={getPieces()}
              currentPlayerId={gameState.currentPlayerId}
              yourPlayerId={yourPlayerId}
              selectedPieceId={selectedPieceId}
              onSelectPiece={setSelectedPieceId}
              onMove={handleMove}
              isYourTurn={isYourTurn && gameState.gameStatus === 'playing'}
            />
          )}
        </div>

        {player2 && (
          <div className="side-panel right-panel">
            <PlayerPanel
              player={player2}
              isCurrentTurn={gameState?.currentPlayerId === 'player2'}
              isYou={yourPlayerId === 'player2'}
              turnTimeLeft={
                gameState?.currentPlayerId === 'player2'
                  ? gameState.turnTimeLeft
                  : undefined
              }
              isLeft={false}
            />
          </div>
        )}
      </div>

      {page === 'result' && gameState && player1 && player2 && (
        <GameResult
          players={gameState.players}
          winner={gameState.winner}
          yourPlayerId={yourPlayerId}
          terrainStats={terrainStats}
          onRematch={handleRematch}
        />
      )}

      <BattleModal
        result={battleResult}
        show={showBattle}
        onClose={handleBattleClose}
        player1Name={player1?.name || '玩家 1'}
        player2Name={player2?.name || '玩家 2'}
        attackerId={battleAttackerId}
      />
    </div>
  );
}
