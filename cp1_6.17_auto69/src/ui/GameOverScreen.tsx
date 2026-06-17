import React from 'react';
import { useGameStore } from '../store/gameStore';
import type { Ship, Player } from '../game/types';

export const GameOverScreen: React.FC = () => {
  const gameState = useGameStore((s) => s.gameState);
  const winnerId = useGameStore((s) => s.winnerId);
  const players = useGameStore((s) => s.players);
  const ships = useGameStore((s) => s.ships);
  const resetGame = useGameStore((s) => s.resetGame);

  if (gameState !== 'gameOver') return null;

  const winnerPlayer = players.find((p) => p.id === winnerId);
  const winnerShip = winnerId
    ? ships.find((s) => s.playerId === winnerId) || ships.find((s) => s.id === winnerId)
    : undefined;
  const winnerIdx = winnerShip ? ships.findIndex((s) => s.id === winnerShip.id) : -1;
  const winnerColor = winnerIdx === 0 ? '#4fc3f7' : '#ef5350';
  const winnerName = winnerPlayer?.name ?? (winnerIdx === 0 ? '玩家 1' : '玩家 2');

  const p1Ship = ships[0];
  const p2Ship = ships[1];
  const p1Player = players[0];
  const p2Player = players[1];

  const p1IsWinner = winnerIdx === 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '20px',
      }}
    >
      <div
        style={{
          background: '#1A1D2E',
          borderRadius: '20px',
          padding: '40px',
          minWidth: '500px',
          maxWidth: '600px',
          width: '100%',
          boxShadow: `
            0 20px 60px rgba(0, 0, 0, 0.6),
            0 0 80px ${winnerColor}25,
            inset 0 1px 0 rgba(255,255,255,0.06)
          `,
          fontFamily: '"Courier New", Courier, monospace',
          border: `2px solid ${winnerColor}60`,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-2px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '160px',
            height: '4px',
            background: `linear-gradient(90deg, transparent 0%, #FFD700 50%, transparent 100%)`,
            borderRadius: '0 0 4px 4px',
          }}
        />

        <div
          style={{
            textAlign: 'center',
            fontSize: '14px',
            color: '#8892B0',
            letterSpacing: '8px',
            marginBottom: '16px',
          }}
        >
          🏆 GAME OVER 🏆
        </div>

        <h1
          style={{
            fontSize: '56px',
            fontWeight: 900,
            textAlign: 'center',
            color: '#FFD700',
            WebkitTextStroke: '3px #B8860B',
            textShadow: `
              0 0 20px rgba(255, 215, 0, 0.5),
              0 0 40px rgba(255, 215, 0, 0.3),
              0 4px 12px rgba(0, 0, 0, 0.8),
              0 6px 0 #8B6914,
              0 8px 0 #6B4F10,
              0 10px 30px rgba(0, 0, 0, 0.6)
            `,
            marginBottom: '8px',
            letterSpacing: '4px',
            lineHeight: 1.2,
          }}
        >
          {winnerName} 胜利!
        </h1>

        <div
          style={{
            textAlign: 'center',
            fontSize: '20px',
            color: winnerColor,
            fontWeight: 'bold',
            marginBottom: '32px',
            letterSpacing: '4px',
          }}
        >
          ★ VICTORY ★
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginBottom: '36px',
          }}
        >
          <StatsCard
            label="玩家 1"
            color="#4fc3f7"
            minerals={p1Ship?.minerals ?? 0}
            kills={p1Player?.kills ?? 0}
            isWinner={p1IsWinner}
          />
          <StatsCard
            label="玩家 2"
            color="#ef5350"
            minerals={p2Ship?.minerals ?? 0}
            kills={p2Player?.kills ?? 0}
            isWinner={!p