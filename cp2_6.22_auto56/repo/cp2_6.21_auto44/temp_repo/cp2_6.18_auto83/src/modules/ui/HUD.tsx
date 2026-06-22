import React, { useEffect, useRef, useMemo } from 'react';
import { useGameStore, createEmptyGrid } from '@/store/GameStore';
import { SHIP_DEFINITIONS, ShipType, Ship } from '@/types';

const PixelAnchor: React.FC<{ blinking: boolean }> = ({ blinking }) => {
  const px = 3;
  const pattern = [
    [0,0,0,1,1,0,0,0],
    [0,0,1,0,0,1,0,0],
    [0,0,1,0,0,1,0,0],
    [0,0,0,1,1,0,0,0],
    [0,0,0,1,0,0,0,0],
    [0,0,0,1,0,0,0,0],
    [0,0,0,1,0,0,0,0],
    [0,0,0,1,0,0,0,0],
    [0,0,0,1,0,0,0,0],
    [0,1,0,1,0,1,0,0],
    [1,1,0,1,0,1,1,0],
    [1,0,0,1,0,0,1,0],
  ];

  return (
    <div
      className={`pixel-anchor ${blinking ? 'anchor-blink' : ''}`}
      style={{
        position: 'relative',
        width: 8 * px,
        height: 12 * px,
      }}
    >
      {pattern.map((row, y) =>
        row.map((cell, x) =>
          cell ? (
            <div
              key={`${x}-${y}`}
              className="anchor-pixel-dot"
              style={{
                position: 'absolute',
                left: x * px,
                top: y * px,
                width: px,
                height: px,
                background: '#4CAF50',
                boxShadow: '0 0 2px rgba(76, 175, 80, 0.5)',
              }}
            />
          ) : null
        )
      )}
    </div>
  );
};

const PixelCountdown: React.FC<{ seconds: number }> = ({ seconds }) => {
  const pct = (seconds / 20) * 100;
  const hue = (seconds / 20) * 120;
  const color = `hsl(${hue}, 80%, 45%)`;

  return (
    <div className="pixel-countdown">
      <div className="countdown-ring">
        <svg viewBox="0 0 100 100" className="countdown-svg">
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={`${pct * 2.64} 264`}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
            className="countdown-progress"
          />
        </svg>
        <div className="countdown-number">
          <span className="pixel-num">{seconds}</span>
        </div>
      </div>
      <div className="countdown-border-decor">
        <span className="corner tl" />
        <span className="corner tr" />
        <span className="corner bl" />
        <span className="corner br" />
      </div>
    </div>
  );
};

const ShipStatus: React.FC<{
  type: ShipType;
  label: string;
  color: string;
  size: number;
  hits: boolean[];
  sunk: boolean;
}> = ({ type, label, color, size, hits, sunk }) => {
  const hitCount = hits.filter(Boolean).length;

  const pixelSize = 3;
  const pixelGap = 1;
  const blockPixels = 6;
  const blockSize = blockPixels * pixelSize + (blockPixels - 1) * pixelGap;

  const generatePixelPattern = (isHit: boolean) => {
    const pattern: boolean[] = [];
    for (let y = 0; y < blockPixels; y++) {
      for (let x = 0; x < blockPixels; x++) {
        if (isHit) {
          const isEdge = x === 0 || x === blockPixels - 1 || y === 0 || y === blockPixels - 1;
          if (isEdge) {
            pattern.push(true);
          } else {
            pattern.push((x + y) % 2 === 0);
          }
        } else {
          pattern.push(true);
        }
      }
    }
    return pattern;
  };

  return (
    <div className={`pixel-ship-status ${sunk ? 'status-sunk' : ''}`}>
      <div className="ship-status-header">
        <div className="ship-icon-row">
          {Array.from({ length: size }, (_, i) => (
            <div
              key={i}
              className="ship-icon-block"
            >
              <div
                className="ship-icon-pixel"
                style={{
                  background: hits[i] ? '#2a2a2a' : color,
                }}
              />
            </div>
          ))}
        </div>
        <span className="ship-label">{label}</span>
      </div>
      <div className="ship-hp-blocks">
        {Array.from({ length: size }, (_, i) => {
          const isHit = hits[i];
          const pattern = generatePixelPattern(isHit);
          return (
            <div
              key={i}
              className={`hp-block-pixel ${isHit ? 'hp-hit' : 'hp-intact'}`}
              style={{
                width: blockSize,
                height: blockSize,
              }}
            >
              {pattern.map((filled, idx) => {
                const x = idx % blockPixels;
                const y = Math.floor(idx / blockPixels);
                return filled ? (
                  <div
                    key={idx}
                    className="hp-pixel-dot"
                    style={{
                      position: 'absolute',
                      left: x * (pixelSize + pixelGap),
                      top: y * (pixelSize + pixelGap),
                      width: pixelSize,
                      height: pixelSize,
                      background: isHit ? '#3a3a3a' : color,
                      boxShadow: isHit
                        ? 'none'
                        : `inset -1px -1px 0 rgba(0,0,0,0.25), inset 1px 1px 0 rgba(255,255,255,0.25)`,
                    }}
                  />
                ) : null;
              })}
              {isHit && (
                <div className="crack-overlay">
                  <div className="crack-line-h c1" />
                  <div className="crack-line-h c2" />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="ship-hp-text">
        {size - hitCount}/{size}
      </div>
    </div>
  );
};

const LogIcon: React.FC<{ type: string }> = ({ type }) => {
  switch (type) {
    case 'hit':
      return <span className="log-icon icon-hit">◆</span>;
    case 'miss':
      return <span className="log-icon icon-miss">●</span>;
    case 'sunk':
      return <span className="log-icon icon-sunk">☠</span>;
    case 'timeout':
      return <span className="log-icon icon-timeout">⏱</span>;
    default:
      return <span className="log-icon icon-system">▸</span>;
  }
};

const BattleLog: React.FC = () => {
  const battleLog = useGameStore((s) => s.battleLog);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [battleLog.length]);

  return (
    <div className="battle-log-container">
      <div className="battle-log-title">⚑ 战报</div>
      <div className="battle-log-list" ref={logRef}>
        {battleLog.map((entry) => (
          <div key={entry.id} className={`log-entry log-${entry.type}`}>
            <LogIcon type={entry.type} />
            <span className="log-time">
              {new Date(entry.timestamp).toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
            <span className="log-msg">{entry.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const GameOverModal: React.FC = () => {
  const winner = useGameStore((s) => s.winner);
  const playerShips = useGameStore((s) => s.playerShips);
  const opponentShips = useGameStore((s) => s.opponentShips);
  const showGameOverModal = useGameStore((s) => s.showGameOverModal);

  if (!showGameOverModal) return null;

  const isVictory = winner === 'player';
  const playerAlive = playerShips.filter((s) => !s.sunk).length;
  const opponentAlive = opponentShips.filter((s) => !s.sunk).length;

  const handleRestart = () => {
    useGameStore.setState({
      phase: 'deploy',
      opponentId: null,
      playerGrid: createEmptyGrid(),
      opponentGrid: createEmptyGrid(),
      playerShips: [],
      opponentShips: [],
      currentTurn: 'player',
      turnNumber: 1,
      winner: null,
      battleLog: [],
      countdown: 20,
      timeoutCount: 0,
      opponentTimeoutCount: 0,
      isReady: false,
      opponentReady: false,
      selectedShip: null,
      shipOrientation: 'horizontal',
      hoverCell: null,
      lastAttackCell: null,
      lastAttackResult: null,
      attackPending: false,
      sinkingCells: [],
      showGameOverModal: false,
    });
  };

  return (
    <div className="game-over-overlay">
      <div className="game-over-modal">
        <div className="crystal-particles">
          {Array.from({ length: 20 }, (_, i) => (
            <div
              key={i}
              className="crystal-particle"
              style={{
                '--delay': `${Math.random() * 0.8}s`,
                '--x': `${(Math.random() - 0.5) * 200}px`,
                '--y': `${(Math.random() - 0.5) * 200}px`,
                '--rot': `${Math.random() * 360}deg`,
                '--size': `${4 + Math.random() * 8}px`,
              } as React.CSSProperties}
            />
          ))}
        </div>
        <div className={`game-over-title ${isVictory ? 'victory' : 'defeat'}`}>
          {isVictory ? '⚔ 胜利 ⚔' : '☠ 败北 ☠'}
        </div>
        <div className="game-over-stats">
          <div className="stat-row">
            <span>我方存活</span>
            <span className="stat-value">{playerAlive}/3</span>
          </div>
          <div className="stat-row">
            <span>敌方存活</span>
            <span className="stat-value">{opponentAlive}/3</span>
          </div>
        </div>
        <button className="btn-restart" onClick={handleRestart}>
          再来一局
        </button>
      </div>
    </div>
  );
};

export const HUD: React.FC = () => {
  const phase = useGameStore((s) => s.phase);
  const currentTurn = useGameStore((s) => s.currentTurn);
  const countdown = useGameStore((s) => s.countdown);
  const playerShips = useGameStore((s) => s.playerShips);
  const opponentShips = useGameStore((s) => s.opponentShips);
  const timeoutCount = useGameStore((s) => s.timeoutCount);
  const turnNumber = useGameStore((s) => s.turnNumber);
  const winner = useGameStore((s) => s.winner);
  const showGameOverModal = useGameStore((s) => s.showGameOverModal);

  const getShipHits = (type: ShipType, ships: Ship[]) => {
    const ship = ships.find((s) => s.type === type);
    if (!ship) return { hits: new Array(getShipSize(type)).fill(false), sunk: false };
    return { hits: ship.hits, sunk: ship.sunk };
  };

  function getShipSize(type: ShipType): number {
    return SHIP_DEFINITIONS.find((d) => d.type === type)?.size ?? 0;
  }

  const isPlayerTurn = phase === 'battle' && currentTurn === 'player';

  return (
    <>
      <div className={`hud-panel ${phase === 'gameover' ? 'hud-dimmed' : ''}`}>
        <div className="hud-section countdown-section">
          {phase === 'battle' && <PixelCountdown seconds={countdown} />}
          {phase === 'battle' && (
            <div className="turn-indicator">
              <PixelAnchor blinking={isPlayerTurn} />
              <span className={`turn-text ${isPlayerTurn ? 'active' : 'waiting'}`}>
                {isPlayerTurn ? '你的回合' : '对手回合'}
              </span>
            </div>
          )}
          {phase === 'deploy' && (
            <div className="deploy-phase-label">⚓ 布阵阶段</div>
          )}
        </div>

        <div className="hud-section ships-section">
          <div className="section-title">舰队状态</div>
          {SHIP_DEFINITIONS.map((def) => {
            const { hits, sunk } = getShipHits(def.type, playerShips);
            return (
              <ShipStatus
                key={def.type}
                type={def.type}
                label={def.label}
                color={def.color}
                size={def.size}
                hits={hits}
                sunk={sunk}
              />
            );
          })}
        </div>

        <div className="hud-section info-section">
          {phase === 'battle' && (
            <div className="info-row">
              <span>回合</span>
              <span className="info-value">{turnNumber}</span>
            </div>
          )}
          {phase === 'battle' && (
            <div className="info-row">
              <span>超时</span>
              <span className={`info-value ${timeoutCount > 0 ? 'warning' : ''}`}>
                {timeoutCount}/3
              </span>
            </div>
          )}
        </div>

        <BattleLog />
      </div>
      {showGameOverModal && <GameOverModal />}
    </>
  );
};

export default HUD;
