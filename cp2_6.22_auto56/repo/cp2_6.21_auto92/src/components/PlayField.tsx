import React, { useEffect, useRef, useMemo } from 'react';
import type { Note, TrackIndex, Judgment, GameStateData, ComboBurstEffect } from '../types';
import { TRACK_KEYS, TRACK_COLORS } from '../types';

interface PlayFieldProps {
  gameState: Partial<GameStateData>;
  isTrackPressed: (track: TrackIndex) => boolean;
  fallDuration: number;
  onExit: () => void;
}

const NOTE_WIDTH = 80;
const NOTE_HEIGHT = 30;

const JUDGMENT_COLORS: Record<Judgment, string> = {
  perfect: '#ffd700',
  good: '#3b82f6',
  miss: '#ef4444',
};

const JUDGMENT_TEXT: Record<Judgment, string> = {
  perfect: 'PERFECT',
  good: 'GOOD',
  miss: 'MISS',
};

export const PlayField: React.FC<PlayFieldProps> = ({
  gameState,
  isTrackPressed,
  fallDuration,
  onExit,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const playHeight = dimensions.height;
  const playWidth = Math.min(dimensions.width, 600);
  const judgeLineY = playHeight - 120;
  const fieldStartX = (dimensions.width - playWidth) / 2;
  const trackGap = playWidth / 4;

  const currentTime = gameState.currentTime ?? 0;
  const combo = gameState.combo ?? 0;
  const score = gameState.score ?? 0;
  const isPausedForMiss = gameState.isPausedForMiss ?? false;
  const missIndicator = gameState.missIndicator ?? null;
  const wrongKeyPress = gameState.wrongKeyPress ?? null;
  const screenFlash = gameState.screenFlash ?? null;

  const calcNoteY = (noteTime: number): number => {
    const timeDiff = noteTime - currentTime;
    const progress = timeDiff / fallDuration;
    return judgeLineY - progress * (judgeLineY - 50);
  };

  const trackPositionX = (track: TrackIndex): number => {
    return fieldStartX + track * trackGap + trackGap / 2;
  };

  const renderNote = (note: Note) => {
    const y = calcNoteY(note.time);
    if (y < -100 || y > playHeight + 100) return null;

    const x = trackPositionX(note.track);
    const trackColor = TRACK_COLORS[note.track];
    const isHit = gameState.hitNotes?.has(note.id);
    const judgment = gameState.hitNotes?.get(note.id);

    if (isHit && judgment !== 'miss') return null;

    const holdProgress = gameState.holdProgress?.get(note.id) ?? 0;
    const isHold = note.type === 'hold' && note.duration;

    return (
      <React.Fragment key={note.id}>
        {isHold && (
          <div
            style={{
              position: 'absolute',
              left: x - NOTE_WIDTH / 2,
              top: y,
              width: NOTE_WIDTH,
              height: Math.max(4, (note.duration! / fallDuration) * (judgeLineY - 50)),
              background: `linear-gradient(to bottom, ${trackColor}40, ${trackColor}20)`,
              borderRadius: NOTE_HEIGHT / 2,
              border: `1px solid ${trackColor}50`,
              pointerEvents: 'none',
            }}
          >
            {holdProgress > 0 && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: `${holdProgress * 100}%`,
                  background: `linear-gradient(to top, ${trackColor}80, ${trackColor}40)`,
                  borderRadius: `0 0 ${NOTE_HEIGHT / 2}px ${NOTE_HEIGHT / 2}px`,
                }}
              />
            )}
          </div>
        )}

        <div
          className="note-card"
          style={{
            position: 'absolute',
            left: x - NOTE_WIDTH / 2,
            top: y - NOTE_HEIGHT / 2,
            width: NOTE_WIDTH,
            height: NOTE_HEIGHT,
            borderRadius: 8,
            background: `linear-gradient(135deg, ${trackColor}, ${trackColor}cc 60%, #ffffff40)`,
            boxShadow: `0 0 15px ${trackColor}80, inset 0 1px 2px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.3)`,
            border: `1px solid rgba(255,255,255,0.25)`,
            pointerEvents: 'none',
            opacity: judgment === 'miss' ? 0.3 : 1,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 4,
              left: 8,
              right: 8,
              height: 4,
              borderRadius: 2,
              background: 'rgba(255,255,255,0.5)',
            }}
          />
          {note.type === 'hold' && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'white', fontWeight: 700, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
              HOLD
            </div>
          )}
          {note.type === 'swipe' && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'white', fontWeight: 700, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
              ↔
            </div>
          )}
        </div>
      </React.Fragment>
    );
  };

  const renderRipple = (ripple: Exclude<GameStateData['rippleEffects'], undefined>[number]) => {
    const x = trackPositionX(ripple.track);
    const y = judgeLineY;
    const color = JUDGMENT_COLORS[ripple.judgment];
    return (
      <div
        key={ripple.id}
        className="ripple-effect"
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: 80,
          height: 80,
          borderRadius: '50%',
          border: `3px solid ${color}`,
          boxShadow: `0 0 20px ${color}80, inset 0 0 20px ${color}40`,
          pointerEvents: 'none',
        }}
      />
    );
  };

  const particleCount = useMemo(() => {
    const baseCount = Math.round(dimensions.width / 80);
    return Math.max(12, Math.min(32, baseCount));
  }, [dimensions.width]);

  const renderComboBurst = (burst: ComboBurstEffect) => {
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;

    let textClass = '';
    let color = 'white';
    let fontSize = 72;
    let ringCount = 0;
    let particleNum = 0;

    switch (burst.level) {
      case 10:
        textClass = 'comboBurst10';
        color = '#ffffff';
        fontSize = 64;
        ringCount = 0;
        particleNum = 0;
        break;
      case 30:
        textClass = 'comboBurst30';
        color = '#ffd700';
        fontSize = 80;
        ringCount = 0;
        particleNum = particleCount;
        break;
      case 50:
        textClass = 'comboBurst50';
        color = '#ff8c00';
        fontSize = 96;
        ringCount = 2;
        particleNum = particleCount + 8;
        break;
      case 100:
        textClass = 'comboBurst100';
        color = '#ff1744';
        fontSize = 120;
        ringCount = 3;
        particleNum = particleCount + 16;
        break;
    }

    const displayText = burst.level === 100 ? `COMBO x${burst.combo}` : `${burst.combo} COMBO!`;

    const particles = [];
    for (let i = 0; i < particleNum; i++) {
      const angle = (i / particleNum) * Math.PI * 2;
      const dist = 180 + (i % 3) * 60 + Math.random() * 40;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist;
      const angleDeg = (angle * 180) / Math.PI;
      particles.push(
        <div
          key={`p-${i}`}
          className="golden-particle"
          style={{
            ['--dx' as string]: `${dx}px`,
            ['--dy' as string]: `${dy}px`,
            ['--angle' as string]: `${angleDeg}deg`,
            ['--color' as string]: color,
            position: 'fixed',
            left: centerX,
            top: centerY,
            width: 16,
            height: 6,
            borderRadius: 3,
            background: `linear-gradient(90deg, ${color}00, ${color}cc, ${color})`,
            boxShadow: `0 0 8px ${color}aa`,
            pointerEvents: 'none',
            zIndex: 95,
          } as React.CSSProperties}
        />
      );
      if (i % 2 === 0) {
        particles.push(
          <div
            key={`h-${i}`}
            className="particle-head"
            style={{
              ['--dx' as string]: `${dx}px`,
              ['--dy' as string]: `${dy}px`,
              ['--color' as string]: color,
              position: 'fixed',
              left: centerX,
              top: centerY,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: color,
              pointerEvents: 'none',
              zIndex: 96,
            } as React.CSSProperties}
          />
        );
      }
    }

    return (
      <React.Fragment key={burst.id}>
        {Array.from({ length: ringCount }).map((_, i) => (
          <div
            key={`ring-${i}`}
            className="combo-ring"
            style={{
              position: 'fixed',
              left: centerX,
              top: centerY,
              width: 300 + i * 80,
              height: 300 + i * 80,
              borderRadius: '50%',
              border: `${4 - i}px solid ${color}${Math.max(40, 100 - i * 30).toString(16).padStart(2, '0')}`,
              animationDelay: `${i * 0.08}s`,
              pointerEvents: 'none',
              zIndex: 90,
            }}
          />
        ))}

        {particles}

        <div
          className={textClass}
          style={{
            position: 'fixed',
            left: centerX,
            top: centerY,
            transform: 'translate(-50%, -50%)',
            fontFamily: 'Orbitron, sans-serif',
            fontWeight: 900,
            fontSize,
            color,
            textShadow: `0 0 30px ${color}aa, 0 0 60px ${color}66, 0 4px 16px rgba(0,0,0,0.6)`,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 100,
          }}
        >
          {displayText}
        </div>
      </React.Fragment>
    );
  };

  const edgeFlashLevel = useMemo(() => {
    if (combo >= 100) return 100;
    if (combo >= 50) return 50;
    if (combo >= 30) return 30;
    if (combo >= 10) return 10;
    return 0;
  }, [combo]);

  const lastEventTime = gameState.lastHitEvent?.time ?? 0;
  const showEdgeFlash = useMemo(() => {
    const justHit = currentTime - lastEventTime < 300;
    return justHit && [10, 30, 50, 100].includes(edgeFlashLevel);
  }, [combo, currentTime, lastEventTime, edgeFlashLevel]);

  const lastJudgment = gameState.lastHitEvent;
  const showJudgmentText = lastJudgment && currentTime - lastJudgment.time < 500;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a2e 50%, #16213e 100%)',
        overflow: 'hidden',
        zIndex: 50,
      }}
    >
      {screenFlash && screenFlash.level >= 50 && (
        <>
          {screenFlash.level >= 100 && (
            <div
              className="screen-flash"
              style={{
                position: 'absolute',
                inset: 0,
                background: 'white',
                pointerEvents: 'none',
                zIndex: 250,
              }}
            />
          )}
          <div
            className="screen-flash-color"
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(ellipse at center, ${
                screenFlash.level >= 100 ? 'rgba(255,23,68,0.5)' : 'rgba(255,140,0,0.4)'
              } 0%, transparent 70%)`,
              pointerEvents: 'none',
              zIndex: 200,
            }}
          />
        </>
      )}

      {showEdgeFlash && (
        <>
          <div
            className="edge-flash"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 120,
              background: `linear-gradient(to bottom, ${
                edgeFlashLevel >= 100
                  ? 'rgba(255,23,68,0.6)'
                  : edgeFlashLevel >= 50
                  ? 'rgba(255,140,0,0.5)'
                  : edgeFlashLevel >= 30
                  ? 'rgba(255,215,0,0.4)'
                  : 'rgba(233,69,96,0.4)'
              }, transparent)`,
              pointerEvents: 'none',
              zIndex: 150,
            }}
          />
          <div
            className="edge-flash"
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 120,
              background: `linear-gradient(to top, ${
                edgeFlashLevel >= 100
                  ? 'rgba(255,23,68,0.6)'
                  : edgeFlashLevel >= 50
                  ? 'rgba(255,140,0,0.5)'
                  : edgeFlashLevel >= 30
                  ? 'rgba(255,215,0,0.4)'
                  : 'rgba(233,69,96,0.4)'
              }, transparent)`,
              pointerEvents: 'none',
              zIndex: 150,
            }}
          />
        </>
      )}

      <div className="tracks-horizontal" style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center' }}>
        {([0, 1, 2, 3] as TrackIndex[]).map((track) => {
          const pressed = isTrackPressed(track);
          const isWrongKey = wrongKeyPress?.track === track;
          const trackX = fieldStartX + track * trackGap;
          return (
            <div
              key={track}
              style={{
                position: 'absolute',
                left: trackX,
                top: 0,
                width: trackGap,
                height: '100%',
                background: isWrongKey
                  ? `linear-gradient(to bottom, rgba(239,68,68,0.1), rgba(239,68,68,0.25), rgba(239,68,68,0.1))`
                  : pressed
                  ? `linear-gradient(to bottom, rgba(255,255,255,0.02), ${TRACK_COLORS[track]}15, ${TRACK_COLORS[track]}30)`
                  : `linear-gradient(to bottom, rgba(255,255,255,0.02), rgba(255,255,255,0.05), rgba(255,255,255,0.02))`,
                borderLeft: `1px solid ${
                  isWrongKey
                    ? 'rgba(239,68,68,0.6)'
                    : pressed
                    ? TRACK_COLORS[track] + '60'
                    : 'rgba(255,255,255,0.05)'
                }`,
                borderRight: `1px solid ${
                  isWrongKey
                    ? 'rgba(239,68,68,0.6)'
                    : pressed
                    ? TRACK_COLORS[track] + '60'
                    : 'rgba(255,255,255,0.05)'
                }`,
                transition: 'all 0.08s ease',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  bottom: 20,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontFamily: 'Orbitron, sans-serif',
                  fontSize: 14,
                  fontWeight: 700,
                  color: isWrongKey
                    ? '#ef4444'
                    : pressed
                    ? TRACK_COLORS[track]
                    : 'rgba(255,255,255,0.3)',
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: `1px solid ${
                    isWrongKey
                      ? 'rgba(239,68,68,0.6)'
                      : pressed
                      ? TRACK_COLORS[track]
                      : 'rgba(255,255,255,0.1)'
                  }`,
                  background: isWrongKey
                    ? 'rgba(239,68,68,0.2)'
                    : pressed
                    ? `${TRACK_COLORS[track]}20`
                    : 'rgba(0,0,0,0.3)',
                  transition: 'all 0.08s ease',
                }}
              >
                {TRACK_KEYS[track].label}
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="judge-line-breath"
        style={{
          position: 'absolute',
          left: fieldStartX,
          right: dimensions.width - fieldStartX - playWidth,
          top: judgeLineY - 2,
          height: 4,
          background: 'linear-gradient(90deg, transparent, #ffffff, #ffffff, #ffffff, transparent)',
          borderRadius: 2,
          zIndex: 10,
        }}
      />

      {gameState.activeNotes?.map(renderNote)}

      {gameState.rippleEffects?.map(renderRipple)}

      {missIndicator && (
        <div
          className="miss-indicator"
          style={{
            position: 'absolute',
            left: trackPositionX(missIndicator.track),
            top: judgeLineY + 10,
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '16px solid transparent',
            borderRight: '16px solid transparent',
            borderBottom: `24px solid ${TRACK_COLORS[missIndicator.track]}cc`,
            filter: `drop-shadow(0 0 10px ${TRACK_COLORS[missIndicator.track]}aa)`,
            zIndex: 20,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 28,
              left: '50%',
              transform: 'translateX(-50%)',
              whiteSpace: 'nowrap',
              fontFamily: 'Orbitron, sans-serif',
              fontWeight: 700,
              fontSize: 14,
              color: TRACK_COLORS[missIndicator.track],
              textShadow: `0 0 10px ${TRACK_COLORS[missIndicator.track]}80`,
            }}
          >
            按 {TRACK_KEYS[missIndicator.track].label}
          </div>
        </div>
      )}

      {gameState.comboBurstEffects?.map(renderComboBurst)}

      {showJudgmentText && lastJudgment && (
        <div
          style={{
            position: 'absolute',
            left: dimensions.width / 2,
            top: judgeLineY - 80,
            transform: 'translateX(-50%)',
            fontFamily: 'Orbitron, sans-serif',
            fontWeight: 900,
            fontSize: 28,
            color: JUDGMENT_COLORS[lastJudgment.judgment],
            textShadow: `0 0 20px ${JUDGMENT_COLORS[lastJudgment.judgment]}80, 0 2px 4px rgba(0,0,0,0.5)`,
            letterSpacing: '0.1em',
            pointerEvents: 'none',
            zIndex: 50,
            opacity: Math.max(0, 1 - (currentTime - lastJudgment.time) / 500),
          }}
        >
          {JUDGMENT_TEXT[lastJudgment.judgment]}
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          top: 24,
          left: 32,
          pointerEvents: 'none',
        }}
      >
        <div className="label-text" style={{ marginBottom: 4 }}>COMBO</div>
        <div
          className="font-display"
          style={{
            fontSize: combo >= 50 ? 64 : combo >= 30 ? 56 : combo >= 10 ? 48 : 40,
            fontWeight: 900,
            color: combo >= 100
              ? '#ff1744'
              : combo >= 50
              ? '#ff8c00'
              : combo >= 30
              ? '#ffd700'
              : combo >= 10
              ? '#e94560'
              : '#ffffff',
            textShadow: combo >= 10 ? `0 0 20px currentColor, 0 0 40px currentColor60` : '0 2px 4px rgba(0,0,0,0.5)',
            lineHeight: 1,
          }}
        >
          {combo}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 24,
          right: 32,
          textAlign: 'right',
          pointerEvents: 'none',
        }}
      >
        <div className="label-text" style={{ marginBottom: 4 }}>SCORE</div>
        <div
          className="font-display"
          style={{
            fontSize: 40,
            fontWeight: 900,
            color: '#e94560',
            textShadow: '0 0 15px rgba(233,69,96,0.5), 0 2px 4px rgba(0,0,0,0.5)',
            lineHeight: 1,
          }}
        >
          {score.toLocaleString()}
        </div>
      </div>

      {isPausedForMiss && (
        <div
          style={{
            position: 'absolute',
            left: dimensions.width / 2,
            top: 80,
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            pointerEvents: 'none',
            zIndex: 60,
          }}
        >
          <div
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              fontFamily: 'Noto Sans SC, sans-serif',
              fontSize: 14,
              color: '#fca5a5',
              fontWeight: 500,
            }}
          >
            MISS - 按下正确按键继续
          </div>
          {wrongKeyPress && (
            <div
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                fontFamily: 'Noto Sans SC, sans-serif',
                fontSize: 12,
                color: '#fca5a5',
                animation: 'wrongKeyShake 0.3s ease',
              }}
            >
              按错了！再试一次
            </div>
          )}
        </div>
      )}

      <button
        onClick={onExit}
        className="btn-secondary"
        style={{
          position: 'absolute',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: 'Noto Sans SC, sans-serif',
          fontSize: 13,
          padding: '6px 16px',
          zIndex: 300,
        }}
      >
        ESC 退出
      </button>

      <div
        style={{
          position: 'absolute',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 24,
          fontFamily: 'Orbitron, sans-serif',
          fontSize: 12,
          color: 'rgba(255,255,255,0.4)',
          pointerEvents: 'none',
        }}
      >
        <span>P: {gameState.perfectCount ?? 0}</span>
        <span>G: {gameState.goodCount ?? 0}</span>
        <span>M: {gameState.missCount ?? 0}</span>
        <span>MAX: {gameState.maxCombo ?? 0}</span>
      </div>

      <style>{`
        @keyframes wrongKeyShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
};
