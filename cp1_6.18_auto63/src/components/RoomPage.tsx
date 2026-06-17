import React, { useEffect, useRef, useState } from 'react';
import { useRoomStore } from '@/store/roomStore';
import { ParticleEngine } from '@/engine/particleEngine';

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    background: '#0B0E27',
    overflow: 'hidden',
  },
  sidebar: {
    width: '240px',
    background: 'linear-gradient(180deg, #1A0530 0%, #1A1A2E 100%)',
    borderRight: '1px solid #2A2A44',
    padding: '20px 10px',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    flexShrink: 0,
  },
  header: {
    color: '#FFFFFF',
    fontSize: '18px',
    fontWeight: 700,
    marginBottom: '4px',
    padding: '0 10px',
  },
  roomId: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '12px',
    padding: '0 10px',
    marginBottom: '20px',
    letterSpacing: '2px',
  },
  sectionTitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '13px',
    fontWeight: 600,
    padding: '0 10px',
    marginBottom: '12px',
    letterSpacing: '1px',
  },
  cardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '0 10px',
    flex: 1,
  },
  card: {
    width: '220px',
    borderRadius: '12px',
    background: '#1A1A2E',
    border: '1px solid #2A2A44',
    padding: '12px',
    boxSizing: 'border-box',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    transition: 'transform 0.15s ease, box-shadow 0.3s ease, border-color 0.15s ease',
    position: 'relative',
    overflow: 'hidden',
  },
  cardAvatar: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    flexShrink: 0,
  },
  cardInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    flex: 1,
    minWidth: 0,
  },
  cardName: {
    color: '#FFFFFF',
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '4px',
  },
  cardVotes: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '12px',
  },
  pulse: {
    position: 'absolute',
    inset: 0,
    borderRadius: '12px',
    pointerEvents: 'none',
    opacity: 0,
  },
  canvasWrap: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  canvas: {
    width: '100%',
    height: '100%',
    display: 'block',
  },
  topBar: {
    position: 'absolute',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '12px',
    zIndex: 10,
  },
  topBtn: {
    padding: '10px 20px',
    borderRadius: '8px',
    background: 'rgba(26, 26, 46, 0.8)',
    border: '1px solid #2A2A44',
    color: '#FFFFFF',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.2s ease',
    letterSpacing: '1px',
  },
  voteInfo: {
    position: 'absolute',
    top: '20px',
    right: '24px',
    color: 'rgba(255,255,255,0.6)',
    fontSize: '14px',
    zIndex: 10,
  },
  resultPanel: {
    position: 'absolute',
    right: '24px',
    top: '80px',
    width: '300px',
    background: '#1A1A2E',
    borderRadius: '16px',
    border: '1px solid #2A2A44',
    padding: '20px',
    boxSizing: 'border-box',
    zIndex: 20,
    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
    animation: 'slideInRight 0.5s ease forwards',
  },
  resultTitle: {
    color: '#FFFFFF',
    fontSize: '18px',
    fontWeight: 700,
    marginBottom: '4px',
  },
  resultSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '12px',
    marginBottom: '20px',
  },
  resultItem: {
    marginBottom: '16px',
  },
  resultItemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  resultItemName: {
    color: '#FFFFFF',
    fontSize: '14px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  resultItemVotes: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: '13px',
  },
  barBg: {
    width: '100%',
    height: '12px',
    borderRadius: '6px',
    background: '#0B0E27',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: '6px',
    transition: 'width 1s ease',
  },
  resultBtn: {
    width: '100%',
    height: '40px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #6BCB77 0%, #4ECDC4 100%)',
    color: '#FFFFFF',
    border: 'none',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'all 0.2s ease',
    letterSpacing: '1px',
  },
  leaveBtn: {
    position: 'absolute',
    top: '20px',
    left: '24px',
    padding: '8px 14px',
    borderRadius: '8px',
    background: 'rgba(255, 107, 107, 0.15)',
    border: '1px solid rgba(255, 107, 107, 0.3)',
    color: '#FF6B6B',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    zIndex: 10,
  },
};

interface PulseCard {
  id: string;
  color: string;
}

export const RoomPage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ParticleEngine | null>(null);
  const { room, results, submitVote, endVoting, resetRoom, leaveRoom } = useRoomStore();
  const [pulses, setPulses] = useState<PulseCard[]>([]);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new ParticleEngine(canvasRef.current);
    engineRef.current = engine;
    engine.start();

    const handleResize = () => {
      engine.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.stop();
    };
  }, []);

  const handleVote = async (candidateId: string, color: string) => {
    if (!room || room.status === 'ended') return;

    const pulseId = `${candidateId}-${Date.now()}`;
    setPulses((prev) => [...prev, { id: pulseId, color }]);
    setTimeout(() => {
      setPulses((prev) => prev.filter((p) => p.id !== pulseId));
    }, 600);

    await submitVote(candidateId);
    if (engineRef.current) {
      engineRef.current.addVoteParticles(color, candidateId);
    }
  };

  const handleEndVoting = async () => {
    if (engineRef.current) {
      engineRef.current.startResultAnimation(() => {
        setShowResults(true);
      });
    }
    await endVoting();
  };

  const handleReset = async () => {
    setShowResults(false);
    if (engineRef.current) {
      engineRef.current.reset();
    }
    await resetRoom();
  };

  if (!room) return null;

  const sortedResults = results
    ? [...results].sort((a, b) => b.votes - a.votes)
    : [];

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes cardPulse {
          0% { box-shadow: 0 0 0 0 currentColor; opacity: 0.6; }
          100% { box-shadow: 0 0 0 24px transparent; opacity: 0; }
        }
        @keyframes barGrow {
          from { width: 0; }
        }
      `}</style>

      <div style={styles.sidebar}>
        <div style={styles.header}>幻境投票机</div>
        <div style={styles.roomId}>房间ID: {room.id}</div>
        <div style={styles.sectionTitle}>候 选 列 表</div>

        <div style={styles.cardList}>
          {room.candidates.map((c) => {
            const hasPulse = pulses.some((p) => p.id.startsWith(c.id));
            const isHovered = hoveredCard === c.id;

            return (
              <div
                key={c.id}
                style={{
                  ...styles.card,
                  ...(isHovered
                    ? {
                        transform: 'translateX(4px)',
                        borderColor: c.color,
                        boxShadow: `0 4px 20px ${c.color}33`,
                      }
                    : {}),
                }}
                onClick={() => handleVote(c.id, c.color)}
                onMouseEnter={() => setHoveredCard(c.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {hasPulse && (
                  <div
                    style={{
                      ...styles.pulse,
                      color: c.color,
                      animation: 'cardPulse 0.6s ease-out forwards',
                      boxShadow: `0 0 0 0 ${c.color}`,
                    }}
                  />
                )}
                <div
                  style={{
                    ...styles.cardAvatar,
                    background: `${c.color}22`,
                    border: `1px solid ${c.color}44`,
                  }}
                >
                  {c.emoji}
                </div>
                <div style={styles.cardInfo}>
                  <div style={styles.cardName}>{c.name}</div>
                  <div style={styles.cardVotes}>{c.votes} 票</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={styles.canvasWrap}>
        <button
          style={{
            ...styles.leaveBtn,
            ...({ ':hover': { background: 'rgba(255, 107, 107, 0.25)' } } as any),
          }}
          onClick={leaveRoom}
          onMouseEnter={(e) => {
            (e.currentTarget.style as any).background = 'rgba(255, 107, 107, 0.25)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget.style as any).background = 'rgba(255, 107, 107, 0.15)';
          }}
        >
          ← 退出房间
        </button>

        <div style={styles.voteInfo}>总票数: {room.totalVotes}</div>

        <div style={styles.topBar}>
          {room.status === 'voting' && (
            <button
              style={styles.topBtn}
              onClick={handleEndVoting}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(78, 205, 196, 0.2)';
                e.currentTarget.style.borderColor = '#4ECDC4';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(26, 26, 46, 0.8)';
                e.currentTarget.style.borderColor = '#2A2A44';
              }}
            >
              结束投票
            </button>
          )}
        </div>

        <canvas ref={canvasRef} style={styles.canvas} />

        {showResults && sortedResults.length > 0 && (
          <div style={styles.resultPanel}>
            <div style={styles.resultTitle}>投票结果</div>
            <div style={styles.resultSub}>总票数: {room.totalVotes}</div>

            {sortedResults.map((r, idx) => (
              <div key={r.candidateId} style={styles.resultItem}>
                <div style={styles.resultItemHeader}>
                  <span style={styles.resultItemName}>
                    {idx === 0 && '👑'} {r.emoji} {r.name}
                  </span>
                  <span style={styles.resultItemVotes}>
                    {r.votes} 票 ({r.percentage.toFixed(1)}%)
                  </span>
                </div>
                <div style={styles.barBg}>
                  <div
                    style={{
                      ...styles.barFill,
                      width: `${r.percentage}%`,
                      background: r.color,
                      animation: 'barGrow 1s ease forwards',
                    }}
                  />
                </div>
              </div>
            ))}

            <button
              style={styles.resultBtn}
              onClick={handleReset}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(107, 203, 119, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              🔄 再 来 一 局
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
