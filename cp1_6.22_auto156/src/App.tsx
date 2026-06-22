import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameEngine, EnergyAllocation, SystemStatus, LogEntry, GamePhase, ThreatEvent, SystemType } from './GameEngine';
import EnergyKnob from './EnergyKnob';
import EventLog from './EventLog';
import StarShipVisual from './StarShipVisual';

const SYSTEM_COLORS: Record<SystemType, string> = {
  shield: '#66FCF1',
  weapon: '#F33535',
  engine: '#45A29E',
  lifeSupport: '#9457EB',
};

const SYSTEM_LABELS: Record<SystemType, string> = {
  shield: '护盾',
  weapon: '武器',
  engine: '引擎',
  lifeSupport: '生命维持',
};

const App: React.FC = () => {
  const engineRef = useRef<GameEngine | null>(null);
  const [allocation, setAllocation] = useState<EnergyAllocation>({
    shield: 25,
    weapon: 25,
    engine: 25,
    lifeSupport: 25,
  });
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    shield: 100,
    weapon: 100,
    engine: 100,
    lifeSupport: 100,
  });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [phase, setPhase] = useState<GamePhase>('playing');
  const [activeThreat, setActiveThreat] = useState<ThreatEvent | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [btnPressed, setBtnPressed] = useState(false);
  const [lowSystems, setLowSystems] = useState<Record<SystemType, boolean>>({
    shield: false, weapon: false, engine: false, lifeSupport: false,
  });
  const [stats, setStats] = useState({ survived: 0, defeated: 0 });

  const totalEnergy = allocation.shield + allocation.weapon + allocation.engine + allocation.lifeSupport;
  const isTotalValid = totalEnergy === 100;

  useEffect(() => {
    const engine = new GameEngine();
    engineRef.current = engine;

    engine.onStatusChange = (status) => {
      setSystemStatus(status);
      setLowSystems({
        shield: status.shield < 20,
        weapon: status.weapon < 20,
        engine: status.engine < 20,
        lifeSupport: status.lifeSupport < 20,
      });
      setStats(engine.getStats());
    };
    engine.onLogEntry = (entry) => {
      setLogs((prev) => [...prev.slice(-99), entry]);
    };
    engine.onPhaseChange = (p) => setPhase(p);
    engine.onActiveThreatChange = (t) => setActiveThreat(t);

    engine.start();

    return () => {
      engine.stop();
    };
  }, []);

  useEffect(() => {
    if (!engineRef.current) return;
    const interval = setInterval(() => {
      setStats(engineRef.current!.getStats());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleEnergyChange = useCallback((system: SystemType, newValue: number) => {
    setAllocation((prev) => {
      const currentTotal = prev.shield + prev.weapon + prev.engine + prev.lifeSupport;
      const oldValue = prev[system];
      const diff = newValue - oldValue;
      const newTotal = currentTotal + diff;

      if (newTotal <= 100) {
        return { ...prev, [system]: newValue };
      }

      const excess = newTotal - 100;
      const others = (['shield', 'weapon', 'engine', 'lifeSupport'] as SystemType[]).filter((s) => s !== system);
      const otherValues = others.map((s) => prev[s]);
      const otherTotal = otherValues.reduce((a, b) => a + b, 0);

      if (otherTotal < excess + others.length * 10) {
        const available = otherTotal - others.length * 10;
        const actualExcess = Math.min(excess, available);
        const actualNew = newValue - (excess - actualExcess);
        const result: EnergyAllocation = { ...prev, [system]: actualNew };
        let remaining = actualExcess;
        for (const s of others) {
          if (remaining <= 0) break;
          const canReduce = result[s] - 10;
          const reduce = Math.min(canReduce, remaining);
          result[s] -= reduce;
          remaining -= reduce;
        }
        return result;
      }

      const result: EnergyAllocation = { ...prev, [system]: newValue };
      let remaining = excess;
      const ratio = otherTotal > 0 ? 1 : 0;
      for (let i = 0; i < others.length && remaining > 0; i++) {
        const s = others[i];
        const proportional = Math.ceil((result[s] / (otherTotal || 1)) * excess * ratio);
        const minKeep = 10;
        const canReduce = Math.max(0, result[s] - minKeep);
        const reduce = Math.min(proportional, canReduce, remaining);
        result[s] -= reduce;
        remaining -= reduce;
      }
      if (remaining > 0) {
        for (const s of others) {
          if (remaining <= 0) break;
          const canReduce = result[s] - 10;
          const reduce = Math.min(canReduce, remaining);
          result[s] -= reduce;
          remaining -= reduce;
        }
      }
      if (remaining > 0) {
        result[system] = newValue - remaining;
      }
      return result;
    });
  }, []);

  const handleExecute = useCallback(() => {
    if (isExecuting || phase !== 'playing' || !engineRef.current) return;
    if (!isTotalValid) return;

    setIsExecuting(true);
    setBtnPressed(true);
    setTimeout(() => setBtnPressed(false), 150);

    engineRef.current.executeTurn(allocation);

    setTimeout(() => {
      setIsExecuting(false);
    }, 1100);
  }, [isExecuting, phase, allocation, isTotalValid]);

  const handleRestart = useCallback(() => {
    if (!engineRef.current) return;
    setAllocation({ shield: 25, weapon: 25, engine: 25, lifeSupport: 25 });
    setSystemStatus({ shield: 100, weapon: 100, engine: 100, lifeSupport: 100 });
    setLogs([]);
    setActiveThreat(null);
    setIsExecuting(false);
    setLowSystems({ shield: false, weapon: false, engine: false, lifeSupport: false });
    setStats({ survived: 0, defeated: 0 });
    engineRef.current.start();
  }, []);

  const systems: SystemType[] = ['shield', 'weapon', 'engine', 'lifeSupport'];

  return (
    <div
      style={{
        width: 960,
        height: 640,
        background: 'radial-gradient(ellipse at 50% 40%, #1F2833 0%, #0B0C10 70%, #050608 100%)',
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 0 60px rgba(102, 252, 241, 0.08), 0 20px 60px rgba(0,0,0,0.5)',
        border: '1px solid rgba(69, 162, 158, 0.15)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.4) 50%, transparent 51%),
          radial-gradient(1px 1px at 80% 20%, rgba(255,255,255,0.3) 50%, transparent 51%),
          radial-gradient(1px 1px at 40% 70%, rgba(255,255,255,0.35) 50%, transparent 51%),
          radial-gradient(1px 1px at 90% 60%, rgba(255,255,255,0.25) 50%, transparent 51%),
          radial-gradient(1.5px 1.5px at 10% 80%, rgba(255,255,255,0.3) 50%, transparent 51%),
          radial-gradient(1px 1px at 60% 10%, rgba(255,255,255,0.3) 50%, transparent 51%),
          radial-gradient(1px 1px at 30% 50%, rgba(255,255,255,0.2) 50%, transparent 51%)
        `,
        pointerEvents: 'none',
        opacity: 0.7,
      }} />

      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        borderBottom: '1px solid rgba(69, 162, 158, 0.2)',
        background: 'rgba(11, 12, 16, 0.6)',
        backdropFilter: 'blur(8px)',
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 28, height: 28,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #45A29E, #66FCF1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 12px rgba(102, 252, 241, 0.4)',
            fontWeight: 900,
            fontSize: 14,
            color: '#0B0C10',
          }}>
            ⚡
          </div>
          <div>
            <div style={{
              fontSize: 16,
              fontWeight: 700,
              color: '#fff',
              letterSpacing: 1,
            }}>
              星舰能量指挥系统
            </div>
            <div style={{
              fontSize: 10,
              color: 'rgba(197, 198, 199, 0.5)',
              letterSpacing: 2,
              textTransform: 'uppercase',
              marginTop: 1,
            }}>
              STARSHIP ENERGY COMMAND v2.0
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{
              fontSize: 10,
              color: 'rgba(197, 198, 199, 0.5)',
              letterSpacing: 1,
            }}>
              存活威胁
            </div>
            <div style={{
              fontSize: 18,
              fontWeight: 800,
              color: '#66FCF1',
              textShadow: '0 0 8px rgba(102, 252, 241, 0.5)',
            }}>
              {stats.survived}<span style={{ fontSize: 11, fontWeight: 500, opacity: 0.5 }}>/10</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{
              fontSize: 10,
              color: 'rgba(197, 198, 199, 0.5)',
              letterSpacing: 1,
            }}>
              击退威胁
            </div>
            <div style={{
              fontSize: 18,
              fontWeight: 800,
              color: '#45A29E',
              textShadow: '0 0 8px rgba(69, 162, 158, 0.5)',
            }}>
              {stats.defeated}<span style={{ fontSize: 11, fontWeight: 500, opacity: 0.5 }}>/5</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{
        position: 'relative',
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
      }}>
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '16px 20px 0 20px',
          position: 'relative',
        }}>
          <div style={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 4,
            minHeight: 48,
          }}>
            {activeThreat ? (
              <div className="fade-in" style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 18px',
                background: 'rgba(255, 107, 107, 0.1)',
                border: '1px solid rgba(255, 107, 107, 0.3)',
                borderRadius: 10,
              }}>
                <span className="warning-blink" style={{
                  fontSize: 16,
                  color: '#FF6B6B',
                }}>⚠</span>
                <div>
                  <div style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#FF6B6B',
                  }}>
                    {activeThreat.name}
                  </div>
                  <div style={{
                    fontSize: 10,
                    color: 'rgba(255, 107, 107, 0.7)',
                    marginTop: 1,
                  }}>
                    剩余强度: {Math.max(0, Math.round(activeThreat.hp))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 18px',
                background: 'rgba(102, 252, 241, 0.05)',
                border: '1px solid rgba(102, 252, 241, 0.15)',
                borderRadius: 10,
              }}>
                <div style={{
                  width: 6, height: 6,
                  borderRadius: '50%',
                  background: '#66FCF1',
                  boxShadow: '0 0 6px #66FCF1',
                }} />
                <span style={{ fontSize: 12, color: 'rgba(102, 252, 241, 0.7)' }}>
                  全系统扫描中 - 等待下一个威胁
                </span>
              </div>
            )}
          </div>

          <div style={{
            position: 'relative',
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            marginTop: -10,
          }}>
            <StarShipVisual systemStatus={systemStatus} />
          </div>

          <div style={{
            position: 'relative',
            padding: '12px 24px 16px 24px',
            background: 'rgba(11, 12, 16, 0.5)',
            borderTop: '1px solid rgba(69, 162, 158, 0.1)',
            borderRadius: '12px 12px 0 0',
            margin: '0 -20px',
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 12,
              marginBottom: 14,
            }}>
              {systems.map((sys) => (
                <EnergyKnob
                  key={sys}
                  value={allocation[sys]}
                  min={10}
                  max={70}
                  onChange={(v) => handleEnergyChange(sys, v)}
                  systemColor={SYSTEM_COLORS[sys]}
                  label={SYSTEM_LABELS[sys]}
                  disabled={isExecuting || phase !== 'playing'}
                />
              ))}
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  fontSize: 11,
                  color: 'rgba(197, 198, 199, 0.6)',
                  letterSpacing: 0.5,
                }}>
                  总能量
                </div>
                <div style={{
                  fontSize: 22,
                  fontWeight: 900,
                  color: isTotalValid ? '#66FCF1' : '#F33535',
                  textShadow: isTotalValid ? '0 0 10px rgba(102, 252, 241, 0.5)' : '0 0 10px rgba(243, 53, 53, 0.5)',
                }}>
                  {totalEnergy}
                </div>
                <div style={{
                  fontSize: 12,
                  color: isTotalValid ? 'rgba(102, 252, 241, 0.5)' : 'rgba(243, 53, 53, 0.7)',
                }}>
                  / 100
                </div>
                {!isTotalValid && (
                  <div style={{
                    fontSize: 10,
                    color: '#F33535',
                    padding: '2px 8px',
                    background: 'rgba(243, 53, 53, 0.1)',
                    borderRadius: 4,
                    border: '1px solid rgba(243, 53, 53, 0.3)',
                  }}>
                    需正好为 100 单位
                  </div>
                )}
              </div>

              <button
                onClick={handleExecute}
                disabled={isExecuting || phase !== 'playing' || !isTotalValid}
                onMouseDown={() => !isExecuting && phase === 'playing' && isTotalValid && setBtnPressed(true)}
                onMouseUp={() => setBtnPressed(false)}
                style={{
                  padding: '12px 36px',
                  borderRadius: 10,
                  border: 'none',
                  cursor: isExecuting || phase !== 'playing' || !isTotalValid ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  fontWeight: 800,
                  letterSpacing: 2,
                  color: '#0B0C10',
                  background: isExecuting || phase !== 'playing' || !isTotalValid
                    ? 'rgba(69, 162, 158, 0.3)'
                    : '#45A29E',
                  boxShadow: isExecuting || phase !== 'playing' || !isTotalValid
                    ? 'none'
                    : '0 0 20px rgba(69, 162, 158, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
                  transform: btnPressed ? 'scale(0.96)' : 'scale(1)',
                  transition: 'all 0.15s ease-out',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  if (!isExecuting && phase === 'playing' && isTotalValid) {
                    (e.currentTarget as HTMLButtonElement).style.background = '#66FCF1';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 30px rgba(102, 252, 241, 0.5), inset 0 1px 0 rgba(255,255,255,0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  setBtnPressed(false);
                  if (!isExecuting && phase === 'playing' && isTotalValid) {
                    (e.currentTarget as HTMLButtonElement).style.background = '#45A29E';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 20px rgba(69, 162, 158, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)';
                  }
                }}
              >
                {isExecuting ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      width: 10, height: 10,
                      borderRadius: '50%',
                      border: '2px solid rgba(11, 12, 16, 0.3)',
                      borderTopColor: '#0B0C10',
                      animation: 'spin 0.8s linear infinite',
                    }} />
                    计算中...
                  </span>
                ) : (
                  '▶ 执 行 分 配'
                )}
              </button>
            </div>

            <style>{`
              @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
          </div>

          <div style={{
            position: 'absolute',
            left: 20,
            right: 300,
            bottom: 150,
            display: 'flex',
            justifyContent: 'space-around',
            gap: 16,
            pointerEvents: 'none',
            zIndex: 5,
          }}>
            {systems.map((sys) => {
              const color = SYSTEM_COLORS[sys];
              const val = systemStatus[sys];
              const isLow = lowSystems[sys];

              return (
                <div
                  key={sys}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 5,
                    opacity: isLow ? 0.6 : 1,
                    animation: isLow ? 'systemShake 0.2s ease-in-out infinite' : 'none',
                    animationDelay: '0s, 1.5s',
                  }}
                >
                  <div style={{
                    fontSize: 10,
                    color: color,
                    fontWeight: 700,
                    letterSpacing: 1,
                    textShadow: `0 0 4px ${color}60`,
                  }}>
                    {SYSTEM_LABELS[sys]}
                  </div>
                  <div style={{
                    width: 150,
                    height: 12,
                    background: '#0B0C10',
                    borderRadius: 6,
                    overflow: 'hidden',
                    boxShadow: `inset 0 0 4px rgba(0,0,0,0.6), 0 0 0 1px ${color}30`,
                    position: 'relative',
                  }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.max(0, Math.min(100, val))}%`,
                        background: `linear-gradient(90deg, ${color}80, ${color})`,
                        borderRadius: 6,
                        transition: 'width 0.3s ease-out, background 0.3s ease-out',
                        boxShadow: `0 0 8px ${color}80`,
                        position: 'relative',
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 9,
                      fontWeight: 800,
                      color: val > 50 ? '#0B0C10' : '#fff',
                      textShadow: val > 50 ? 'none' : '0 1px 2px rgba(0,0,0,0.6)',
                      mixBlendMode: val > 50 ? 'normal' : 'normal',
                    }}>
                      {Math.round(val)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <EventLog logs={logs} />
      </div>

      {(phase === 'victory' || phase === 'defeat') && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(11, 12, 16, 0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
        }} className="fade-in">
          <div style={{
            padding: '40px 60px',
            borderRadius: 16,
            background: phase === 'victory'
              ? 'linear-gradient(135deg, rgba(81, 207, 102, 0.1), rgba(102, 252, 241, 0.05))'
              : 'linear-gradient(135deg, rgba(243, 53, 53, 0.1), rgba(255, 107, 107, 0.05))',
            border: `1px solid ${phase === 'victory' ? 'rgba(81, 207, 102, 0.3)' : 'rgba(243, 53, 53, 0.3)'}`,
            boxShadow: phase === 'victory'
              ? '0 0 60px rgba(81, 207, 102, 0.15)'
              : '0 0 60px rgba(243, 53, 53, 0.15)',
            textAlign: 'center',
            minWidth: 400,
          }}>
            <div style={{
              fontSize: 56,
              marginBottom: 16,
            }}>
              {phase === 'victory' ? '🏆' : '💥'}
            </div>
            <div style={{
              fontSize: 28,
              fontWeight: 900,
              color: phase === 'victory' ? '#51CF66' : '#F33535',
              letterSpacing: 3,
              marginBottom: 12,
              textShadow: phase === 'victory'
                ? '0 0 20px rgba(81, 207, 102, 0.5)'
                : '0 0 20px rgba(243, 53, 53, 0.5)',
            }}>
              {phase === 'victory' ? '任 务 完 成' : '任 务 失 败'}
            </div>
            <div style={{
              fontSize: 13,
              color: 'rgba(197, 198, 199, 0.7)',
              lineHeight: 1.8,
              marginBottom: 28,
            }}>
              存活威胁数：<span style={{ color: '#66FCF1', fontWeight: 700 }}>{stats.survived}</span> 次<br />
              击退威胁数：<span style={{ color: '#45A29E', fontWeight: 700 }}>{stats.defeated}</span> 个
            </div>
            <button
              onClick={handleRestart}
              style={{
                padding: '12px 40px',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: 2,
                color: '#0B0C10',
                background: '#45A29E',
                boxShadow: '0 0 20px rgba(69, 162, 158, 0.4)',
                transition: 'all 0.15s ease-out',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#66FCF1';
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.02)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 30px rgba(102, 252, 241, 0.5)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#45A29E';
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 20px rgba(69, 162, 158, 0.4)';
              }}
              onMouseDown={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.97)';
              }}
              onMouseUp={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.02)';
              }}
            >
              ↻ 重 新 开 始
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
