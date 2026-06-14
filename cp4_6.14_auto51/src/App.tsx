import React, { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import CardEditor from './CardEditor';
import DeckManager from './DeckManager';
import BattleSimulator from './BattleSimulator';
import type { Card, Deck, BattleLogEntry } from './types';

const App: React.FC = () => {
  const [cardLibrary, setCardLibrary] = useState<Card[]>(() => {
    const sample = [
      { id: uuidv4(), name: '火焰剑客', cost: 3, attack: 4, health: 3, maxHealth: 3, effectText: '召唤时对敌方造成1点伤害。' },
      { id: uuidv4(), name: '冰霜守卫', cost: 4, attack: 2, health: 6, maxHealth: 6, effectText: '受到伤害减少1点（最低1点）。' },
      { id: uuidv4(), name: '雷电法师', cost: 5, attack: 5, health: 4, maxHealth: 4, effectText: '攻击附带2点魔法伤害。' },
      { id: uuidv4(), name: '森林游侠', cost: 2, attack: 2, health: 2, maxHealth: 2, effectText: '召唤时抽一张牌。' },
      { id: uuidv4(), name: '圣光骑士', cost: 6, attack: 6, health: 7, maxHealth: 7, effectText: '每回合恢复2点生命值。' },
      { id: uuidv4(), name: '暗影刺客', cost: 2, attack: 3, health: 1, maxHealth: 1, effectText: '攻击敌方首领不受阻挡。' },
      { id: uuidv4(), name: '巨石巨像', cost: 7, attack: 4, health: 10, maxHealth: 10, effectText: '嘲讽：敌方优先攻击此单位。' },
      { id: uuidv4(), name: '疾风刺客', cost: 1, attack: 2, health: 1, maxHealth: 1, effectText: '召唤当回合可立即攻击。' },
    ];
    return sample;
  });

  const [deck, setDeck] = useState<Deck>([]);
  const [logs, setLogs] = useState<BattleLogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'editor' | 'battle'>('battle');
  const [isSmall, setIsSmall] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setIsSmall(w < 900);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleAddCard = useCallback((card: Card) => {
    setCardLibrary(prev => [...prev, card]);
  }, []);

  const handleDeckChange = useCallback((newDeck: Deck) => {
    setDeck(newDeck);
  }, []);

  const handleLogsChange = useCallback((newLogs: BattleLogEntry[]) => {
    setLogs(newLogs);
  }, []);

  const sidebarWidth = isSmall ? '100%' : '300px';
  const logsWidth = isSmall ? '100%' : '260px';

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      backgroundColor: '#1e293b',
      color: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: isSmall ? '10px 14px' : '12px 24px',
        borderBottom: '1px solid #334155',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        flexShrink: 0,
        backgroundColor: '#0f172a',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <span style={{ fontSize: isSmall ? '24px' : '30px' }}>🎮</span>
          <div>
            <h1 style={{
              fontSize: isSmall ? '16px' : '20px',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              background: 'linear-gradient(135deg, #0ea5e9, #06b6d4, #22d3ee)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              卡牌战斗策略模拟器
            </h1>
            {!isSmall && (
              <p style={{
                fontSize: '11px',
                color: '#64748b',
                marginTop: '2px',
              }}>
                创建卡组 · 搭配策略 · 模拟战斗
              </p>
            )}
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '6px',
          backgroundColor: '#1e293b',
          padding: '4px',
          borderRadius: '10px',
          border: '1px solid #334155',
        }}>
          <button
            onClick={() => setActiveTab('editor')}
            style={{
              padding: isSmall ? '6px 12px' : '6px 16px',
              borderRadius: '7px',
              fontSize: isSmall ? '12px' : '13px',
              fontWeight: 600,
              backgroundColor: activeTab === 'editor' ? '#0ea5e9' : 'transparent',
              color: activeTab === 'editor' ? '#fff' : '#94a3b8',
              transition: 'all 0.2s',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'editor') {
                e.currentTarget.style.backgroundColor = '#334155';
                e.currentTarget.style.color = '#f8fafc';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'editor') {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#94a3b8';
              }
            }}
          >
            🎴 编辑器
          </button>
          <button
            onClick={() => setActiveTab('battle')}
            style={{
              padding: isSmall ? '6px 12px' : '6px 16px',
              borderRadius: '7px',
              fontSize: isSmall ? '12px' : '13px',
              fontWeight: 600,
              backgroundColor: activeTab === 'battle' ? '#0ea5e9' : 'transparent',
              color: activeTab === 'battle' ? '#fff' : '#94a3b8',
              transition: 'all 0.2s',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'battle') {
                e.currentTarget.style.backgroundColor = '#334155';
                e.currentTarget.style.color = '#f8fafc';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'battle') {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#94a3b8';
              }
            }}
          >
            ⚔️ 战斗
          </button>
        </div>
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: isSmall ? 'column' : 'row',
        overflow: 'hidden',
      }}>
        <div style={{
          width: sidebarWidth,
          height: isSmall ? '38%' : '100%',
          flexShrink: 0,
          padding: isSmall ? '8px' : '12px',
          paddingRight: isSmall ? '8px' : isSmall ? '8px' : '6px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <DeckManager
            cardLibrary={cardLibrary}
            deck={deck}
            onDeckChange={handleDeckChange}
          />
        </div>

        <div style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: isSmall ? '4px 8px' : '12px 8px',
          gap: isSmall ? '4px' : '12px',
        }}>
          <div style={{
            flex: 1,
            minHeight: 0,
            borderRadius: '12px',
            overflow: 'hidden',
            backgroundColor: '#0f172a',
            border: '1px solid #334155',
          }}>
            {activeTab === 'editor' ? (
              <div style={{ width: '100%', height: '100%' }}>
                <CardEditor
                  cardLibrary={cardLibrary}
                  onAddCard={handleAddCard}
                />
              </div>
            ) : (
              <BattleSimulator
                deck={deck}
                logs={logs}
                onLogsChange={handleLogsChange}
              />
            )}
          </div>
        </div>

        {!isSmall && (
          <div style={{
            width: logsWidth,
            height: '100%',
            flexShrink: 0,
            padding: '12px',
            paddingLeft: '6px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            <div style={{
              flex: '0 0 auto',
              padding: '16px',
              backgroundColor: '#0f172a',
              borderRadius: '12px',
              border: '1px solid #334155',
            }}>
              <h3 style={{
                fontSize: '13px',
                fontWeight: 700,
                marginBottom: '12px',
                color: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                📊 卡组概览
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
              }}>
                <div style={{
                  padding: '8px',
                  backgroundColor: '#1e293b',
                  borderRadius: '8px',
                  textAlign: 'center',
                }}>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#0ea5e9',
                  }}>
                    {deck.length}
                  </div>
                  <div style={{
                    fontSize: '10px',
                    color: '#64748b',
                    marginTop: '2px',
                  }}>
                    卡牌数
                  </div>
                </div>
                <div style={{
                  padding: '8px',
                  backgroundColor: '#1e293b',
                  borderRadius: '8px',
                  textAlign: 'center',
                }}>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color:
                      deck.reduce((s, c) => s + c.cost, 0) > 50 ? '#ef4444' : '#22c55e',
                  }}>
                    {deck.reduce((s, c) => s + c.cost, 0)}
                  </div>
                  <div style={{
                    fontSize: '10px',
                    color: '#64748b',
                    marginTop: '2px',
                  }}>
                    总费用
                  </div>
                </div>
                <div style={{
                  padding: '8px',
                  backgroundColor: '#1e293b',
                  borderRadius: '8px',
                  textAlign: 'center',
                }}>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#f87171',
                  }}>
                    {deck.reduce((s, c) => s + c.attack, 0)}
                  </div>
                  <div style={{
                    fontSize: '10px',
                    color: '#64748b',
                    marginTop: '2px',
                  }}>
                    总攻击
                  </div>
                </div>
                <div style={{
                  padding: '8px',
                  backgroundColor: '#1e293b',
                  borderRadius: '8px',
                  textAlign: 'center',
                }}>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#4ade80',
                  }}>
                    {deck.reduce((s, c) => s + c.health, 0)}
                  </div>
                  <div style={{
                    fontSize: '10px',
                    color: '#64748b',
                    marginTop: '2px',
                  }}>
                    总生命
                  </div>
                </div>
              </div>

              {cardLibrary.length > 0 && (
                <>
                  <div style={{
                    marginTop: '14px',
                    marginBottom: '8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#94a3b8',
                  }}>
                    费用曲线
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: '2px',
                    height: '40px',
                    padding: '0 2px',
                  }}>
                    {Array.from({ length: 11 }).map((_, i) => {
                      const count = deck.filter(c => c.cost === (i === 10 ? 10 : i + 1)).length;
                      const maxCount = Math.max(1, ...Array.from({ length: 11 }).map((_, j) =>
                        deck.filter(c => c.cost === (j === 10 ? 10 : j + 1)).length
                      ));
                      const h = count === 0 ? 4 : Math.max(8, (count / maxCount) * 36);
                      return (
                        <div key={i}
                          style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '2px',
                          }}
                        >
                          <div style={{
                            width: '100%',
                            height: `${h}px`,
                            backgroundColor: count === 0 ? '#334155' :
                              (i + 1 <= 3 ? '#22c55e' : i + 1 <= 6 ? '#0ea5e9' : '#ef4444'),
                            borderRadius: '3px',
                            transition: 'height 0.3s',
                          }} />
                          <span style={{
                            fontSize: '9px',
                            color: count === 0 ? '#475569' : '#94a3b8',
                            fontWeight: 600,
                          }}>
                            {i === 10 ? '10+' : i + 1}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#0f172a',
              borderRadius: '12px',
              border: '1px solid #334155',
              overflow: 'hidden',
              minHeight: 0,
            }}>
              <div style={{
                padding: '12px 14px',
                borderBottom: '1px solid #334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <h3 style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  📜 战斗日志
                </h3>
                <span style={{
                  fontSize: '10px',
                  color: '#64748b',
                }}>
                  {logs.length}/50
                </span>
              </div>
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '8px 12px',
                fontSize: '11px',
                lineHeight: 1.6,
              }} id="sidebar-logs">
                {logs.length === 0 ? (
                  <div style={{
                    color: '#475569',
                    textAlign: 'center',
                    padding: '24px 8px',
                    fontSize: '11px',
                  }}>
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>📝</div>
                    开始战斗后，所有行动将记录在此
                  </div>
                ) : (
                  logs.map(log => (
                    <div key={log.id} style={{
                      padding: '4px 0',
                      borderBottom: '1px solid rgba(51, 65, 85, 0.4)',
                      color: '#cbd5e1',
                      wordBreak: 'break-word',
                    }}>
                      <span style={{
                        color: '#475569',
                        fontWeight: 600,
                        fontFamily: 'monospace',
                      }}>
                        [{String(log.turn).padStart(2, '0')}]
                      </span>{' '}
                      {log.message}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
