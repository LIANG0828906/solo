import { useCallback, useState } from 'react';
import { useGameStore } from './useGameStore';
import type { PlayerInfo } from './types';

export function Lobby() {
  const players = useGameStore((s) => s.players);
  const currentUserId = useGameStore((s) => s.currentUserId);
  const sendChallenge = useGameStore((s) => s.sendChallenge);
  const setGamePhase = useGameStore((s) => s.setGamePhase);
  const rejectNotif = useGameStore((s) => s.rejectNotif);
  const challengeNotif = useGameStore((s) => s.challengeNotif);
  const acceptChallenge = useGameStore((s) => s.acceptChallenge);
  const rejectChallenge = useGameStore((s) => s.rejectChallenge);
  const [pendingTarget, setPendingTarget] = useState<string | null>(null);

  const handleChallenge = useCallback(
    (targetId: string) => {
      setPendingTarget(targetId);
      sendChallenge(targetId);
      setTimeout(() => setPendingTarget(null), 1500);
    },
    [sendChallenge]
  );

  return (
    <div className="lobby-container">
      <h1 className="lobby-title">⚔ 太空竞技场 ⚔</h1>
      <p className="lobby-subtitle">在线指挥官</p>

      <div className="player-list">
        {players
          .filter((p: PlayerInfo) => p.id !== currentUserId)
          .map((player: PlayerInfo) => (
            <div
              key={player.id}
              className={`player-card ${player.online ? 'online' : 'offline'}`}
            >
              <div className="player-avatar">
                <div className="avatar-ship">
                  <div className="avatar-cockpit" />
                  <div className="avatar-wing left" />
                  <div className="avatar-wing right" />
                  <div className="avatar-engine" />
                </div>
              </div>
              <div className="player-info">
                <span className="player-name">{player.name}</span>
                <span className={`player-status ${player.online ? 'online' : 'offline'}`}>
                  {player.online ? '在线' : '离线'}
                </span>
              </div>
              <button
                className="challenge-btn"
                disabled={!player.online || pendingTarget === player.id}
                onClick={() => handleChallenge(player.id)}
              >
                {pendingTarget === player.id ? '发送中...' : '挑战'}
              </button>
            </div>
          ))}
      </div>

      <button className="go-build-btn" onClick={() => setGamePhase('building')}>
        🛠 组装飞船
      </button>

      {challengeNotif && (
        <div className="challenge-notification">
          <span>{challengeNotif.name}向你发起挑战!</span>
          <div className="challenge-actions">
            <button className="accept-btn" onClick={acceptChallenge}>
              接受
            </button>
            <button className="reject-btn" onClick={rejectChallenge}>
              拒绝
            </button>
          </div>
        </div>
      )}

      {rejectNotif && (
        <div className="reject-notification">{rejectNotif}</div>
      )}
    </div>
  );
}
