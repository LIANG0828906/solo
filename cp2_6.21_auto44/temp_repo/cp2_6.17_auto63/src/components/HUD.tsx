import { useGameStore } from '../stores/gameStore';
import { PowerUpEffectType, ActiveBuff } from '../types';

const BUFF_ICONS: Record<PowerUpEffectType, string> = {
  [PowerUpEffectType.SPEED_BOOST]: '⚡',
  [PowerUpEffectType.GHOST_FREEZE]: '❄',
  [PowerUpEffectType.SCORE_MULTIPLIER]: '★',
};

const BUFF_COLORS: Record<PowerUpEffectType, string> = {
  [PowerUpEffectType.SPEED_BOOST]: '#0096FF',
  [PowerUpEffectType.GHOST_FREEZE]: '#B0E0E6',
  [PowerUpEffectType.SCORE_MULTIPLIER]: '#FFD700',
};

const BUFF_NAMES: Record<PowerUpEffectType, string> = {
  [PowerUpEffectType.SPEED_BOOST]: 'SPD',
  [PowerUpEffectType.GHOST_FREEZE]: 'FRZ',
  [PowerUpEffectType.SCORE_MULTIPLIER]: 'x2',
};

const BuffDisplay = ({
  buff,
  playerId,
}: {
  buff: ActiveBuff;
  playerId: string;
}) => {
  const progress = Math.max(0, buff.remainingTime / buff.totalTime);
  const color = BUFF_COLORS[buff.type];
  const icon = BUFF_ICONS[buff.type];
  const label = BUFF_NAMES[buff.type];
  const seconds = Math.ceil(buff.remainingTime / 1000);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '3px',
        padding: '4px 6px',
        backgroundColor: 'rgba(15, 52, 96, 0.8)',
        border: `1px solid ${color}`,
        borderRadius: '4px',
        minWidth: '48px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          fontSize: '9px',
          color: color,
        }}
      >
        <span style={{ fontSize: '11px' }}>{icon}</span>
        <span>{label}</span>
        <span style={{ fontSize: '8px', opacity: 0.8 }}>{seconds}s</span>
      </div>
      <div
        style={{
          width: '100%',
          height: '4px',
          backgroundColor: '#16213E',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${progress * 100}%`,
            height: '100%',
            backgroundColor: color,
            transition: 'width 0.1s linear',
            boxShadow: `0 0 4px ${color}`,
          }}
        />
      </div>
    </div>
  );
};

export const HUD = () => {
  const { players, twoPlayerMode, status, totalDots, remainingDots } =
    useGameStore();

  const player1 = players.find((p) => p.id === 'player1');
  const player2 = players.find((p) => p.id === 'player2');

  const totalScore = players.reduce((sum, p) => sum + p.score, 0);
  const progress = totalDots > 0 ? ((totalDots - remainingDots) / totalDots) * 100 : 0;

  const renderHearts = (lives: number) => {
    return Array.from({ length: 3 }, (_, i) => (
      <span
        key={i}
        style={{
          color: i < lives ? '#E94560' : '#333',
          fontSize: '16px',
          marginRight: '4px',
        }}
      >
        ♥
      </span>
    ));
  };

  const player1HasBuffs = player1 && player1.activeBuffs && player1.activeBuffs.length > 0;
  const player2HasBuffs = player2 && player2.activeBuffs && player2.activeBuffs.length > 0;

  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '60px',
          backgroundColor: '#0F3460',
          borderBottom: '2px solid #16213E',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          fontFamily: "'Press Start 2P', monospace",
          color: '#fff',
          zIndex: 10,
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {player1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: '10px', color: '#FFE66D' }}>
                P1: {player1.score.toLocaleString()}
              </div>
              <div style={{ display: 'flex' }}>{renderHearts(player1.lives)}</div>
            </div>
          )}

          {player2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: '10px', color: '#4ECDC4' }}>
                P2: {player2.score.toLocaleString()}
              </div>
              <div style={{ display: 'flex' }}>{renderHearts(player2.lives)}</div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ fontSize: '10px' }}>SCORE</div>
          <div style={{ fontSize: '14px', color: '#00FF00' }}>
            {totalScore.toLocaleString()}
          </div>
        </div>

        {twoPlayerMode && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              width: '150px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div style={{ fontSize: '8px', color: '#9B59B6', width: '30px' }}>
                P1
              </div>
              <div
                style={{
                  flex: 1,
                  height: '8px',
                  backgroundColor: '#16213E',
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, (player1?.score || 0) / 10)}%`,
                    backgroundColor: '#9B59B6',
                    transition: 'width 0.3s',
                  }}
                />
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div style={{ fontSize: '8px', color: '#00FFFF', width: '30px' }}>
                P2
              </div>
              <div
                style={{
                  flex: 1,
                  height: '8px',
                  backgroundColor: '#16213E',
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, (player2?.score || 0) / 10)}%`,
                    backgroundColor: '#00FFFF',
                    transition: 'width 0.3s',
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {!twoPlayerMode && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '4px',
            }}
          >
            <div style={{ fontSize: '8px', color: '#888' }}>PROGRESS</div>
            <div
              style={{
                width: '120px',
                height: '8px',
                backgroundColor: '#16213E',
                borderRadius: '2px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progress}%`,
                  backgroundColor: '#00FF00',
                  transition: 'width 0.3s',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {(player1HasBuffs || player2HasBuffs) && status !== 'menu' && (
        <div
          style={{
            position: 'absolute',
            top: '68px',
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            gap: '16px',
            zIndex: 10,
            pointerEvents: 'none',
          }}
        >
          {player1HasBuffs && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '4px',
              }}
            >
              <div
                style={{
                  fontSize: '7px',
                  color: '#FFE66D',
                  fontFamily: "'Press Start 2P', monospace",
                  paddingLeft: '2px',
                }}
              >
                P1
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: '6px',
                  flexWrap: 'wrap',
                  maxWidth: '45vw',
                }}
              >
                {player1!.activeBuffs.map((buff, i) => (
                  <BuffDisplay key={`${buff.type}-${i}`} buff={buff} playerId="player1" />
                ))}
              </div>
            </div>
          )}

          {player2HasBuffs && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '4px',
              }}
            >
              <div
                style={{
                  fontSize: '7px',
                  color: '#4ECDC4',
                  fontFamily: "'Press Start 2P', monospace",
                  paddingLeft: '2px',
                }}
              >
                P2
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: '6px',
                  flexWrap: 'wrap',
                  maxWidth: '45vw',
                }}
              >
                {player2!.activeBuffs.map((buff, i) => (
                  <BuffDisplay key={`${buff.type}-${i}`} buff={buff} playerId="player2" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {status !== 'menu' && (
        <div
          style={{
            position: 'absolute',
            top: '70px',
            right: '80px',
            fontSize: '8px',
            color: '#888',
            fontFamily: "'Press Start 2P', monospace",
            zIndex: 10,
          }}
        >
          {player1?.isPowered && (
            <div style={{ color: '#FFD700', marginTop: '4px' }}>⚡ P1 POWER!</div>
          )}
          {player2?.isPowered && (
            <div style={{ color: '#00FFFF', marginTop: '4px' }}>
              ⚡ P2 POWER!
            </div>
          )}
        </div>
      )}
    </>
  );
};
