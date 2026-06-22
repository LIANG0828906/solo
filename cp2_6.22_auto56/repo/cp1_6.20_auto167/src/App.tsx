import { useState, useEffect, useRef, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import type {
  PlayerStats,
  LeaderboardEntry,
  LeaderboardCategory,
  UnlockNotification,
} from './types';
import Leaderboard from './components/Leaderboard';
import AchievementWall from './components/AchievementWall';
import { BADGES } from '../server/gameLogic';

interface LeaderboardData {
  kills: LeaderboardEntry[];
  survival: LeaderboardEntry[];
  winStreak: LeaderboardEntry[];
}

interface NotificationItem extends UnlockNotification {
  id: string;
}

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardData>({
    kills: [],
    survival: [],
    winStreak: [],
  });
  const [activeTab, setActiveTab] = useState<LeaderboardCategory>('kills');
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerStats | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const lastUpdateRef = useRef(0);
  const pendingUpdateRef = useRef<LeaderboardData | null>(null);
  const animationFrameRef = useRef<number>();
  const selectedPlayerIdRef = useRef<string | null>(null);

  const throttledUpdate = useCallback((data: LeaderboardData) => {
    const now = performance.now();
    const timeSinceLast = now - lastUpdateRef.current;

    if (timeSinceLast >= 100) {
      lastUpdateRef.current = now;
      setLeaderboard(data);
    } else {
      pendingUpdateRef.current = data;
      if (!animationFrameRef.current) {
        animationFrameRef.current = requestAnimationFrame(() => {
          if (pendingUpdateRef.current) {
            lastUpdateRef.current = performance.now();
            setLeaderboard(pendingUpdateRef.current);
            pendingUpdateRef.current = null;
          }
          animationFrameRef.current = undefined;
        });
      }
    }
  }, []);

  useEffect(() => {
    const newSocket = io({
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
      newSocket.emit('player:register', {});
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    newSocket.on('player:registered', (data: { playerId: string; playerName: string; stats: PlayerStats }) => {
      setPlayerStats(data.stats);

      setTimeout(() => {
        const kills = Math.floor(Math.random() * 20) + 3;
        const survivalTime = Math.floor(Math.random() * 600) + 120;
        const won = Math.random() > 0.4;

        newSocket.emit('game:submit', {
          playerId: data.playerId,
          playerName: data.playerName,
          kills,
          survivalTime,
          winStreak: won ? Math.floor(Math.random() * 3) + 1 : 0,
          won,
        });
      }, 500);
    });

    newSocket.on('leaderboard:update', (data: LeaderboardData) => {
      throttledUpdate(data);
    });

    newSocket.on('player:stats', (stats: PlayerStats) => {
      setPlayerStats((prev) => {
        if (prev && prev.playerId === stats.playerId) {
          return stats;
        }
        return prev;
      });

      if (selectedPlayerIdRef.current === stats.playerId) {
        setSelectedPlayer(stats);
      }
    });

    newSocket.on('badge:unlocked', (notification: UnlockNotification) => {
      const id = `${Date.now()}-${Math.random()}`;
      setNotifications((prev) => [...prev, { ...notification, id }]);

      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 4000);
    });

    newSocket.on('player:update', (data: { playerId: string; stats: PlayerStats }) => {
      if (selectedPlayerIdRef.current === data.playerId) {
        setSelectedPlayer(data.stats);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [throttledUpdate]);

  useEffect(() => {
    selectedPlayerIdRef.current = selectedPlayer?.playerId || null;
  }, [selectedPlayer?.playerId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showModal) {
        handleCloseModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal]);

  const handlePlayerClick = (entry: LeaderboardEntry) => {
    selectedPlayerIdRef.current = entry.playerId;

    if (playerStats && entry.playerId === playerStats.playerId) {
      setSelectedPlayer(playerStats);
      setShowModal(true);
      return;
    }

    if (socket) {
      socket.emit('player:get', entry.playerId);
      const cachedStats = {
        playerId: entry.playerId,
        playerName: entry.playerName,
        totalKills: 0,
        totalSurvivalTime: 0,
        winStreak: 0,
        maxWinStreak: 0,
        totalGames: 0,
        totalWins: 0,
        unlockedBadges: [],
      };
      setSelectedPlayer(cachedStats);
      setShowModal(true);
    }
  };

  const handleCloseModal = () => {
    selectedPlayerIdRef.current = null;
    setShowModal(false);
    setTimeout(() => setSelectedPlayer(null), 300);
  };

  const formatSurvivalTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="app-container">
      <div className="notification-feed">
        {notifications.map((notif) => (
          <div key={notif.id} className={`notification-item ${notif.tier}`}>
            <div className="notification-title">🏆 Badge Unlocked!</div>
            <div className="notification-text">
              <strong style={{ color: '#00d4ff' }}>{notif.playerName}</strong> unlocked{' '}
              <strong>{notif.badgeName}</strong>
            </div>
          </div>
        ))}
      </div>

      <header className="app-header">
        <h1 className="app-title">IO Shooter Arena</h1>
        <p className="app-subtitle">
          {isConnected ? '⚡ LIVE - Real-time Leaderboard' : '🔌 Connecting...'}
          {playerStats && ` | You: ${playerStats.playerName}`}
        </p>
      </header>

      <div className="main-layout">
        <div className="leaderboard-section">
          <Leaderboard
            data={leaderboard[activeTab]}
            category={activeTab}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onPlayerClick={handlePlayerClick}
            selfPlayerId={playerStats?.playerId}
            formatValue={(val) => {
              if (activeTab === 'survival') return formatSurvivalTime(val);
              return val.toString();
            }}
          />
        </div>

        <div className="achievement-section">
          <AchievementWall
            badges={BADGES}
            unlockedBadges={playerStats?.unlockedBadges || []}
            playerStats={playerStats}
            isOwnWall={true}
          />
        </div>
      </div>

      {showModal && selectedPlayer && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={handleCloseModal}>
              ✕
            </button>
            <h2 className="modal-title">Player Profile</h2>

            <div className="modal-player-info">
              <div className="modal-player-name">{selectedPlayer.playerName}</div>
              {playerStats?.playerId === selectedPlayer.playerId && (
                <span className="self-indicator">YOU</span>
              )}
              <div className="modal-player-stats">
                <div className="modal-stat">
                  <span className="modal-stat-value">{selectedPlayer.totalKills}</span>
                  <span className="modal-stat-label">Kills</span>
                </div>
                <div className="modal-stat">
                  <span className="modal-stat-value">
                    {formatSurvivalTime(selectedPlayer.totalSurvivalTime)}
                  </span>
                  <span className="modal-stat-label">Survival</span>
                </div>
                <div className="modal-stat">
                  <span className="modal-stat-value">{selectedPlayer.maxWinStreak}</span>
                  <span className="modal-stat-label">Best Streak</span>
                </div>
                <div className="modal-stat">
                  <span className="modal-stat-value">{selectedPlayer.totalGames}</span>
                  <span className="modal-stat-label">Games</span>
                </div>
              </div>
            </div>

            <AchievementWall
              badges={BADGES}
              unlockedBadges={selectedPlayer.unlockedBadges}
              playerStats={selectedPlayer}
              isOwnWall={playerStats?.playerId === selectedPlayer.playerId}
              isModal={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
