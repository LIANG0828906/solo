import React, { createContext, useContext, useEffect, useState } from 'react';
import type { GameState } from './GameEngine';

export interface LeaderboardEntry {
  id: string;
  score: number;
  survivalTime: number;
  date: string;
}

interface GameContextValue {
  gameState: GameState;
  restart: () => void;
  saveScore: () => boolean;
  scoreSaved: boolean;
  leaderboard: LeaderboardEntry[];
  showLeaderboard: boolean;
  setShowLeaderboard: (v: boolean) => void;
  showStartScreen: boolean;
  startGame: () => void;
}

export const GameContext = createContext<GameContextValue | null>(null);

export function useGameContext(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGameContext must be used within GameProvider');
  return ctx;
}

const styles: Record<string, React.CSSProperties> = {
  statusBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    background: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    padding: '0 20px',
    gap: 32,
    zIndex: 10,
    borderBottom: '1px solid rgba(59, 130, 246, 0.3)',
  },
  statusItem: {
    color: '#FFFFFF',
    fontFamily: 'monospace',
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  statusLabel: {
    color: '#64748B',
    fontSize: 12,
  },
  scoreValue: {
    fontFamily: 'monospace',
    fontSize: 20,
    color: '#FFFFFF',
    transition: 'transform 0.15s ease-out',
    display: 'inline-block',
    transformOrigin: 'center',
  },
  scorePulse: {
    transform: 'scale(1.2)',
    color: '#00E5FF',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    backdropFilter: 'blur(8px)',
  },
  card: {
    width: 400,
    height: 300,
    background: '#1E293B',
    borderRadius: 16,
    padding: 32,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
  },
  cardTitle: {
    fontFamily: 'monospace',
    fontSize: 28,
    color: '#FF5252',
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  startTitle: {
    fontFamily: 'monospace',
    fontSize: 32,
    color: '#00E5FF',
    fontWeight: 'bold',
    letterSpacing: 2,
    textShadow: '0 0 20px rgba(0, 229, 255, 0.5)',
  },
  statsRow: {
    display: 'flex',
    gap: 48,
    width: '100%',
    justifyContent: 'center',
  },
  statBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  statLabel: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  statValue: {
    fontFamily: 'monospace',
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  btnRow: {
    display: 'flex',
    gap: 16,
  },
  button: {
    width: 180,
    height: 44,
    borderRadius: 8,
    border: 'none',
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    color: '#FFFFFF',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  buttonPrimary: {
    background: '#3B82F6',
  },
  buttonSecondary: {
    background: '#1E293B',
    border: '1px solid #3B82F6',
    color: '#3B82F6',
  },
  buttonSaved: {
    background: '#10B981',
    cursor: 'default',
  },
  leaderboardBtn: {
    width: 260,
    height: 44,
    borderRadius: 8,
    background: 'transparent',
    border: '1px solid rgba(100, 116, 139, 0.5)',
    color: '#94A3B8',
    fontFamily: 'monospace',
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  instructions: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 1.8,
  },
  lbCard: {
    width: 460,
    maxHeight: 500,
    background: '#1E293B',
    borderRadius: 16,
    padding: 28,
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
    overflow: 'hidden',
  },
  lbHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  lbTitle: {
    fontFamily: 'monospace',
    fontSize: 22,
    color: '#00E5FF',
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    background: 'rgba(255, 82, 82, 0.15)',
    border: '1px solid rgba(255, 82, 82, 0.3)',
    color: '#FF5252',
    fontSize: 18,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'monospace',
    transition: 'all 0.2s',
  },
  lbList: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    paddingRight: 4,
  },
  lbItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  lbRank: {
    width: 36,
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#64748B',
  },
  lbRankTop: {
    color: '#FFD740',
  },
  lbInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  lbScore: {
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  lbMeta: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#64748B',
  },
  emptyLb: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    padding: 40,
  },
  topScoreLabel: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#FFD740',
  },
};

export function StatusBar(): React.ReactElement {
  const { gameState, leaderboard, setShowLeaderboard } = useGameContext();
  const [animating, setAnimating] = useState(false);
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    if (gameState.score !== displayScore) {
      setAnimating(true);
      setDisplayScore(gameState.score);
      const t = setTimeout(() => setAnimating(false), 150);
      return () => clearTimeout(t);
    }
  }, [gameState.score, displayScore]);

  const topScore = leaderboard.length > 0 ? leaderboard[0].score : 0;

  return (
    <div style={styles.statusBar}>
      <div style={styles.statusItem}>
        <span style={styles.statusLabel}>SCORE</span>
        <span
          style={{
            ...styles.scoreValue,
            ...(animating ? styles.scorePulse : {}),
          }}
        >
          {displayScore.toLocaleString()}
        </span>
      </div>
      <div style={styles.statusItem}>
        <span style={styles.statusLabel}>TIME</span>
        <span style={{ ...styles.scoreValue, fontSize: 16 }}>
          {gameState.survivalTime}s
        </span>
      </div>
      <div style={styles.statusItem}>
        <span style={styles.statusLabel}>ENEMIES</span>
        <span style={{ ...styles.scoreValue, fontSize: 16, color: '#FFD740' }}>
          {gameState.enemiesRemaining}
        </span>
      </div>
      <div style={{ flex: 1 }} />
      <button
        style={styles.leaderboardBtn}
        onClick={() => setShowLeaderboard(true)}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor =
            'rgba(59, 130, 246, 0.6)';
          (e.currentTarget as HTMLButtonElement).style.color = '#CBD5E1';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor =
            'rgba(100, 116, 139, 0.5)';
          (e.currentTarget as HTMLButtonElement).style.color = '#94A3B8';
        }}
        onFocus={(e) => {
          (e.currentTarget as HTMLButtonElement).style.outline =
            '2px solid #3B82F6';
          (e.currentTarget as HTMLButtonElement).style.outlineOffset = '2px';
        }}
        onBlur={(e) => {
          (e.currentTarget as HTMLButtonElement).style.outline = 'none';
        }}
      >
        🏆 排行榜 · 最高 {topScore.toLocaleString()}
      </button>
    </div>
  );
}

export function StartScreen(): React.ReactElement {
  const { startGame, setShowLeaderboard } = useGameContext();
  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={styles.startTitle}>弹幕射击</div>
          <div style={styles.instructions}>
            WASD / 方向键 移动
            <br />
            鼠标左键 / 空格 射击
            <br />
            击落敌机获得分数
          </div>
        </div>
        <div
          style={{
            ...styles.btnRow,
            flexDirection: 'column',
            gap: 12,
            alignItems: 'center',
          }}
        >
          <button
            style={{ ...styles.button, ...styles.buttonPrimary }}
            onClick={startGame}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#2563EB';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#3B82F6';
            }}
            onFocus={(e) => {
              (e.currentTarget as HTMLButtonElement).style.outline =
                '2px solid #3B82F6';
              (e.currentTarget as HTMLButtonElement).style.outlineOffset = '2px';
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLButtonElement).style.outline = 'none';
            }}
          >
            开始游戏
          </button>
          <button
            style={styles.leaderboardBtn}
            onClick={() => setShowLeaderboard(true)}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                'rgba(59, 130, 246, 0.6)';
              (e.currentTarget as HTMLButtonElement).style.color = '#CBD5E1';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                'rgba(100, 116, 139, 0.5)';
              (e.currentTarget as HTMLButtonElement).style.color = '#94A3B8';
            }}
            onFocus={(e) => {
              (e.currentTarget as HTMLButtonElement).style.outline =
                '2px solid #3B82F6';
              (e.currentTarget as HTMLButtonElement).style.outlineOffset = '2px';
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLButtonElement).style.outline = 'none';
            }}
          >
            🏆 查看排行榜
          </button>
        </div>
      </div>
    </div>
  );
}

export function GameOverModal(): React.ReactElement {
  const { gameState, restart, saveScore, scoreSaved } = useGameContext();

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.cardTitle}>GAME OVER</div>
        <div style={styles.statsRow}>
          <div style={styles.statBox}>
            <div style={styles.statLabel}>得分</div>
            <div style={{ ...styles.statValue, color: '#00E5FF' }}>
              {gameState.score.toLocaleString()}
            </div>
          </div>
          <div style={styles.statBox}>
            <div style={styles.statLabel}>生存</div>
            <div style={{ ...styles.statValue, color: '#FFD740' }}>
              {gameState.survivalTime}s
            </div>
          </div>
        </div>
        <div style={styles.btnRow}>
          <button
            style={{ ...styles.button, ...styles.buttonPrimary }}
            onClick={restart}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#2563EB';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#3B82F6';
            }}
            onFocus={(e) => {
              (e.currentTarget as HTMLButtonElement).style.outline =
                '2px solid #3B82F6';
              (e.currentTarget as HTMLButtonElement).style.outlineOffset = '2px';
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLButtonElement).style.outline = 'none';
            }}
          >
            重新开始
          </button>
          <button
            style={{
              ...styles.button,
              ...(scoreSaved ? styles.buttonSaved : styles.buttonSecondary),
            }}
            onClick={() => saveScore()}
            disabled={scoreSaved}
            onMouseEnter={(e) => {
              if (!scoreSaved) {
                (e.currentTarget as HTMLButtonElement).style.background =
                  'rgba(59, 130, 246, 0.15)';
              }
            }}
            onMouseLeave={(e) => {
              if (!scoreSaved) {
                (e.currentTarget as HTMLButtonElement).style.background = '#1E293B';
              }
            }}
            onFocus={(e) => {
              if (!scoreSaved) {
                (e.currentTarget as HTMLButtonElement).style.outline =
                  '2px solid #3B82F6';
                (e.currentTarget as HTMLButtonElement).style.outlineOffset =
                  '2px';
              }
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLButtonElement).style.outline = 'none';
            }}
          >
            {scoreSaved ? '✓ 已保存' : '保存成绩'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function LeaderboardModal(): React.ReactElement {
  const { leaderboard, setShowLeaderboard } = useGameContext();
  return (
    <div style={styles.overlay} onClick={() => setShowLeaderboard(false)}>
      <div style={styles.lbCard} onClick={(e) => e.stopPropagation()}>
        <div style={styles.lbHeader}>
          <div style={styles.lbTitle}>🏆 排行榜</div>
          <button
            style={styles.closeBtn}
            onClick={() => setShowLeaderboard(false)}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                'rgba(255, 82, 82, 0.3)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                'rgba(255, 82, 82, 0.15)';
            }}
            onFocus={(e) => {
              (e.currentTarget as HTMLButtonElement).style.outline =
                '2px solid #FF5252';
              (e.currentTarget as HTMLButtonElement).style.outlineOffset = '2px';
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLButtonElement).style.outline = 'none';
            }}
          >
            ✕
          </button>
        </div>
        <div style={styles.lbList}>
          {leaderboard.length === 0 ? (
            <div style={styles.emptyLb}>
              暂无记录
              <br />
              <span style={{ fontSize: 11 }}>完成一局游戏后保存成绩</span>
            </div>
          ) : (
            leaderboard.map((entry, idx) => (
              <div key={entry.id} style={styles.lbItem}>
                <div
                  style={{
                    ...styles.lbRank,
                    ...(idx < 3 ? styles.lbRankTop : {}),
                  }}
                >
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                </div>
                <div style={styles.lbInfo}>
                  <div style={styles.lbScore}>
                    {entry.score.toLocaleString()}
                    {idx === 0 && (
                      <span
                        style={{
                          ...styles.topScoreLabel,
                          marginLeft: 8,
                        }}
                      >
                        · 最高纪录
                      </span>
                    )}
                  </div>
                  <div style={styles.lbMeta}>
                    生存 {entry.survivalTime}s · {entry.date}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
