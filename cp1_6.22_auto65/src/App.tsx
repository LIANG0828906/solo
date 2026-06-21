import React, { useEffect } from 'react';
import { Matchmaking } from './Matchmaking';
import { GameBoard } from './GameBoard';
import { ResultPanel } from './ResultPanel';
import { useWebSocket } from './hooks/useWebSocket';
import { useGameStore, Player, SongData, GameResult, LeaderboardEntry } from './store/gameStore';

const App: React.FC = () => {
  const { gameState, setPlayerId, setRoomId, setPlayers, addPlayer, removePlayer, setGameState, setCountdown, setSongData, updateScore, setResults, setLeaderboard } = useGameStore();
  const { on, send } = useWebSocket();

  useEffect(() => {
    const storedId = localStorage.getItem('rhythm_player_id');
    if (storedId) {
      setPlayerId(storedId);
    }

    const unsubscribers: (() => void)[] = [];

    unsubscribers.push(on('LEADERBOARD_UPDATE', (data) => {
      setLeaderboard(data.leaderboard as LeaderboardEntry[]);
    }));

    unsubscribers.push(on('ROOM_JOINED', (data) => {
      setRoomId(data.roomId as string);
      setPlayers(data.players as Player[]);
      if (data.leaderboard) {
        setLeaderboard(data.leaderboard as LeaderboardEntry[]);
      }
      setGameState('waiting');
    }));

    unsubscribers.push(on('PLAYER_JOINED', (data) => {
      addPlayer(data.player as Player);
    }));

    unsubscribers.push(on('PLAYER_LEFT', (data) => {
      removePlayer(data.playerId as string);
    }));

    unsubscribers.push(on('GAME_COUNTDOWN', (data) => {
      setCountdown(data.countdown as number);
      setGameState('countdown');
    }));

    unsubscribers.push(on('GAME_START', (data) => {
      setSongData(data.songData as SongData, data.startTime as number);
      setGameState('playing');
    }));

    unsubscribers.push(on('SCORE_UPDATE', (data) => {
      updateScore(data.playerId as string, data.score as Partial<Player> & { hitType?: 'perfect' | 'good' | 'miss' });
    }));

    unsubscribers.push(on('GAME_END', (data) => {
      setResults(data.results as GameResult[]);
      setGameState('finished');
    }));

    unsubscribers.push(on('ERROR', (data) => {
      console.error('Server error:', data.message);
      alert(data.message as string);
    }));

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [on, setPlayerId, setRoomId, setPlayers, addPlayer, removePlayer, setGameState, setCountdown, setSongData, updateScore, setResults, setLeaderboard, send]);

  return (
    <div className="w-full h-full">
      {gameState === 'lobby' || gameState === 'waiting' ? (
        <Matchmaking />
      ) : gameState === 'countdown' || gameState === 'playing' ? (
        <GameBoard />
      ) : (
        <>
          <GameBoard />
          <ResultPanel />
        </>
      )}
    </div>
  );
};

export default App;
