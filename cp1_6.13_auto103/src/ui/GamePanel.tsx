import React from 'react';
import type { GameState, PlayerId, TrapType } from '../game/types';
import { TRAP_NAMES, TRAP_COLORS } from '../game/TrapManager';
import { TURN_DURATION, WIN_SCORE } from '../game/GameEngine';

interface GamePanelProps {
  gameState: GameState;
  onPlaceTrap: () => void;
  onStartGame: () => void;
  onNextRound: () => void;
  onRestart: () => void;
}

const PLAYER_COLORS: Record<PlayerId, string> = {
  blue: '#4a90d9',
  red: '#e74c3c',
};

const PLAYER_KEYS: Record<PlayerId, string> = {
  blue: 'W A S D',
  red: '↑ ↓ ← →',
};

export const GamePanel: React.FC<GamePanelProps> = ({
  gameState,
  onPlaceTrap,
  onStartGame,
  onNextRound,
  onRestart,
}) => {
  const { currentPlayer, players, turnTimer, scores, round, phase, winner, matchWinner, lastAction } = gameState;
  const timerPercent = (turnTimer / TURN_DURATION) * 100;

  const progressGradient = `linear-gradient(90deg, ${PLAYER_COLORS.blue} ${100 - timerPercent}%, ${PLAYER_COLORS.red} ${100 - timerPercent}%)`;
  const timerColor = timerPercent > 50 ? PLAYER_COLORS.blue : timerPercent > 20 ? '#f39c12' : PLAYER_COLORS.red;

  const getNextTrapType = (id: PlayerId): TrapType | null => {
    const p = players[id];
    return p.trapTypes.length > 0 ? p.trapTypes[0] : null;
  };

  return (
    <div style={styles.panel}>
      <div style={styles.titleSection}>
        <h1 style={styles.title}>ECHO MAZE</h1>
        <div style={styles.subtitle}>回合制迷宫探索</div>
      </div>

      <div style={styles.roundInfo}>
        <div style={styles.roundLabel}>第 {round} 局</div>
        <div style={styles.scoreBoard}>
          {(['blue', 'red'] as PlayerId[]).map((id) => (
            <div key={id} style={styles.scoreItem}>
              <div
                style={{
                  ...styles.scoreDot,
                  backgroundColor: PLAYER_COLORS[id],
                  boxShadow: `0 0 10px ${PLAYER_COLORS[id]}`,
                }}
              />
              <span style={styles.scoreLabel}>{players[id].name}</span>
              <span style={{ ...styles.scoreValue, color: PLAYER_COLORS[id] }}>
                {scores[id]}
              </span>
              <span style={styles.scoreWinTarget}>/ {WIN_SCORE}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.currentTurnSection}>
        <div style={styles.turnLabel}>当前回合</div>
        <div style={styles.turnPlayerRow}>
          <div
            style={{
              ...styles.playerAvatar,
              backgroundColor: PLAYER_COLORS[currentPlayer],
              boxShadow: `0 0 20px ${PLAYER_COLORS[currentPlayer]}`,
            }}
          >
            <span style={styles.avatarText}>{currentPlayer === 'blue' ? '1' : '2'}</span>
          </div>
          <div>
            <div style={{ ...styles.turnPlayerName, color: PLAYER_COLORS[currentPlayer] }}>
              {players[currentPlayer].name}
            </div>
            <div style={styles.turnKeys}>控制：{PLAYER_KEYS[currentPlayer]}</div>
          </div>
        </div>

        <div style={styles.timerContainer}>
          <div style={styles.timerHeader}>
            <span style={styles.timerLabel}>剩余时间</span>
            <span style={{ ...styles.timerValue, color: timerColor }}>
              {Math.ceil(turnTimer)}s
            </span>
          </div>
          <div style={styles.progressBarBg}>
            <div
              style={{
                ...styles.progressBarFill,
                width: `${timerPercent}%`,
                background: progressGradient,
              }}
            />
          </div>
        </div>
      </div>

      <div style={styles.playerCards}>
        {(['blue', 'red'] as PlayerId[]).map((id) => {
          const p = players[id];
          const nextTrap = getNextTrapType(id);
          const isCurrent = id === currentPlayer;
          return (
            <div
              key={id}
              style={{
                ...styles.playerCard,
                borderColor: isCurrent ? PLAYER_COLORS[id] : 'transparent',
                boxShadow: isCurrent ? `0 0 15px ${PLAYER_COLORS[id]}40` : 'none',
              }}
            >
              <div style={styles.cardHeader}>
                <div
                  style={{
                    ...styles.cardDot,
                    backgroundColor: PLAYER_COLORS[id],
                    boxShadow: `0 0 8px ${PLAYER_COLORS[id]}`,
                  }}
                />
                <span style={{ ...styles.cardName, color: PLAYER_COLORS[id] }}>
                  {p.name}
                </span>
              </div>

              <div style={styles.cardStats}>
                <div style={styles.statRow}>
                  <span style={styles.statLabel}>位置</span>
                  <span style={styles.statValue}>({p.position.x}, {p.position.y})</span>
                </div>
                <div style={styles.statRow}>
                  <span style={styles.statLabel}>剩余陷阱</span>
                  <span style={{ ...styles.statValue, color: TRAP_COLORS[nextTrap || 'sleep'] }}>
                    {p.trapsRemaining}
                    {nextTrap && (
                      <span style={styles.nextTrapBadge}>
                        下一个：{TRAP_NAMES[nextTrap]}
                      </span>
                    )}
                  </span>
                </div>
                {p.sleepTurns > 0 && (
                  <div style={{ ...styles.statusBadge, backgroundColor: '#9b59b633' }}>
                    💤 催眠 {p.sleepTurns}回合
                  </div>
                )}
                {p.lockedDirection && (
                  <div style={{ ...styles.statusBadge, backgroundColor: '#f39c1233' }}>
                    ⚡ 方向锁定
                  </div>
                )}
                {!p.canMove && (
                  <div style={{ ...styles.statusBadge, backgroundColor: '#e74c3c33' }}>
                    🚫 本回合不能移动
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={styles.actionSection}>
        {phase === 'waiting' ? (
          <button style={styles.primaryButton} onClick={onStartGame}>
            ▶ 开始游戏
          </button>
        ) : phase === 'playing' ? (
          <button
            style={{
              ...styles.primaryButton,
              backgroundColor: TRAP_COLORS[getNextTrapType(currentPlayer) || 'sleep'],
            }}
            onClick={onPlaceTrap}
            disabled={players[currentPlayer].trapsRemaining <= 0}
          >
            🪤 放置陷阱 (T)
          </button>
        ) : phase === 'roundEnd' && !matchWinner ? (
          <button style={styles.primaryButton} onClick={onNextRound}>
            ⏭ 开始下一局
          </button>
        ) : (
          <button style={styles.primaryButton} onClick={onRestart}>
            🔄 重新开始
          </button>
        )}
      </div>

      <div style={styles.statusBox}>
        <div style={styles.statusTitle}>状态提示</div>
        <div style={styles.statusContent}>{lastAction}</div>
      </div>

      <div style={styles.tutorialSection}>
        <div style={styles.tutorialTitle}>操作教程</div>
        <div style={styles.tutorialContent}>
          <div style={styles.tutorialItem}>
            <span style={{ color: PLAYER_COLORS.blue }}>玩家1（蓝）</span>
            <span style={styles.tutorialKeys}>W/A/S/D 移动</span>
          </div>
          <div style={styles.tutorialItem}>
            <span style={{ color: PLAYER_COLORS.red }}>玩家2（红）</span>
            <span style={styles.tutorialKeys}>方向键 移动</span>
          </div>
          <div style={styles.tutorialItem}>
            <span>通用操作</span>
            <span style={styles.tutorialKeys}>T 键放置陷阱</span>
          </div>
        </div>

        <div style={styles.trapInfo}>
          <div style={styles.trapInfoTitle}>陷阱类型</div>
          <div style={styles.trapInfoRow}>
            <span style={{ ...styles.trapDot, backgroundColor: TRAP_COLORS.sleep }} />
            <span style={styles.trapName}>{TRAP_NAMES.sleep}</span>
            <span style={styles.trapDesc}>3x3范围，减速3回合</span>
          </div>
          <div style={styles.trapInfoRow}>
            <span style={{ ...styles.trapDot, backgroundColor: TRAP_COLORS.fence }} />
            <span style={styles.trapName}>{TRAP_NAMES.fence}</span>
            <span style={styles.trapDesc}>踏入后锁定方向1回合</span>
          </div>
        </div>
      </div>

      {(phase === 'roundEnd' || phase === 'matchEnd') && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalIcon}>
              {matchWinner ? '🏆' : '🎉'}
            </div>
            <div
              style={{
                ...styles.modalTitle,
                color: matchWinner ? PLAYER_COLORS[matchWinner] : PLAYER_COLORS[winner!],
              }}
            >
              {matchWinner
                ? `${players[matchWinner].name} 赢得比赛！`
                : `${players[winner!].name} 赢得第${round}局！`}
            </div>
            <div style={styles.modalScore}>
              当前比分 — 蓝方 {scores.blue} : {scores.red} 红方
            </div>
            {!matchWinner ? (
              <button style={styles.modalButton} onClick={onNextRound}>
                继续下一局
              </button>
            ) : (
              <button style={styles.modalButton} onClick={onRestart}>
                再来一场
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  panel: {
    height: '100%',
    width: '100%',
    padding: '20px',
    backgroundColor: 'rgba(22, 33, 62, 0.92)',
    borderRadius: '12px',
    color: '#e8e8e8',
    fontFamily: "'Courier New', monospace",
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    overflowY: 'auto',
    boxSizing: 'border-box',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(74, 144, 217, 0.2)',
  },
  titleSection: {
    textAlign: 'center',
    paddingBottom: '8px',
    borderBottom: '1px solid rgba(74, 144, 217, 0.3)',
  },
  title: {
    margin: 0,
    fontSize: '28px',
    fontWeight: 'bold',
    letterSpacing: '6px',
    background: 'linear-gradient(90deg, #4a90d9, #e74c3c)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textShadow: '0 0 30px rgba(74,144,217,0.3)',
  },
  subtitle: {
    fontSize: '12px',
    color: '#888',
    marginTop: '4px',
    letterSpacing: '2px',
  },
  roundInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  roundLabel: {
    fontSize: '14px',
    color: '#aaa',
    textAlign: 'center',
    letterSpacing: '2px',
  },
  scoreBoard: {
    display: 'flex',
    justifyContent: 'space-around',
    gap: '10px',
  },
  scoreItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: '8px',
    flex: 1,
    justifyContent: 'center',
  },
  scoreDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  scoreLabel: {
    fontSize: '12px',
    color: '#bbb',
  },
  scoreValue: {
    fontSize: '20px',
    fontWeight: 'bold',
  },
  scoreWinTarget: {
    fontSize: '12px',
    color: '#666',
  },
  currentTurnSection: {
    backgroundColor: 'rgba(74, 144, 217, 0.08)',
    padding: '14px',
    borderRadius: '10px',
    border: '1px solid rgba(74, 144, 217, 0.2)',
  },
  turnLabel: {
    fontSize: '11px',
    color: '#888',
    letterSpacing: '1px',
    marginBottom: '10px',
    textTransform: 'uppercase',
  },
  turnPlayerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    marginBottom: '12px',
  },
  playerAvatar: {
    width: '46px',
    height: '46px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: '18px',
  },
  turnPlayerName: {
    fontSize: '18px',
    fontWeight: 'bold',
  },
  turnKeys: {
    fontSize: '12px',
    color: '#888',
    marginTop: '2px',
  },
  timerContainer: {},
  timerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '6px',
  },
  timerLabel: {
    fontSize: '11px',
    color: '#888',
  },
  timerValue: {
    fontSize: '14px',
    fontWeight: 'bold',
  },
  progressBarBg: {
    width: '100%',
    height: '8px',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    transition: 'width 0.1s linear',
    borderRadius: '4px',
  },
  playerCards: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  playerCard: {
    padding: '12px',
    borderRadius: '8px',
    backgroundColor: 'rgba(255,255,255,0.03)',
    border: '2px solid',
    transition: 'all 0.3s ease',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '10px',
  },
  cardDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
  cardName: {
    fontWeight: 'bold',
    fontSize: '14px',
  },
  cardStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
  },
  statLabel: {
    color: '#888',
  },
  statValue: {
    color: '#ddd',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  nextTrapBadge: {
    fontSize: '10px',
    padding: '2px 6px',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: '4px',
  },
  statusBadge: {
    fontSize: '11px',
    padding: '4px 8px',
    borderRadius: '4px',
    marginTop: '4px',
    display: 'inline-block',
  },
  actionSection: {
    marginTop: '4px',
  },
  primaryButton: {
    width: '100%',
    padding: '14px',
    border: 'none',
    borderRadius: '10px',
    backgroundColor: '#4a90d9',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: "'Courier New', monospace",
    letterSpacing: '1px',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 15px rgba(74, 144, 217, 0.3)',
  },
  statusBox: {
    padding: '12px',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: '8px',
    borderLeft: '3px solid #4a90d9',
  },
  statusTitle: {
    fontSize: '11px',
    color: '#888',
    marginBottom: '6px',
    letterSpacing: '1px',
  },
  statusContent: {
    fontSize: '13px',
    color: '#ddd',
    lineHeight: '1.4',
  },
  tutorialSection: {
    padding: '12px',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: '8px',
  },
  tutorialTitle: {
    fontSize: '11px',
    color: '#888',
    marginBottom: '10px',
    letterSpacing: '1px',
  },
  tutorialContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '12px',
  },
  tutorialItem: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    alignItems: 'center',
  },
  tutorialKeys: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#ccc',
  },
  trapInfo: {
    borderTop: '1px solid rgba(255,255,255,0.06)',
    paddingTop: '10px',
  },
  trapInfoTitle: {
    fontSize: '11px',
    color: '#888',
    marginBottom: '8px',
  },
  trapInfoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '11px',
    marginBottom: '4px',
  },
  trapDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  trapName: {
    width: '60px',
    color: '#ddd',
  },
  trapDesc: {
    color: '#888',
    flex: 1,
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(5px)',
  },
  modalContent: {
    backgroundColor: '#16213e',
    padding: '40px 50px',
    borderRadius: '16px',
    textAlign: 'center',
    border: '2px solid rgba(74,144,217,0.3)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
    maxWidth: '90%',
  },
  modalIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  modalTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '12px',
  },
  modalScore: {
    fontSize: '16px',
    color: '#aaa',
    marginBottom: '28px',
  },
  modalButton: {
    padding: '14px 40px',
    border: 'none',
    borderRadius: '10px',
    backgroundColor: '#4a90d9',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: "'Courier New', monospace",
    letterSpacing: '2px',
    boxShadow: '0 4px 20px rgba(74,144,217,0.4)',
    transition: 'transform 0.2s',
  },
};
