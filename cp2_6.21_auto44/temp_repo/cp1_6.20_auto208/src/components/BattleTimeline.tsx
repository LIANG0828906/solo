import React, { useState } from 'react';
import { BattleEvent, EVENT_TYPE_LABEL } from '../types';

interface BattleTimelineProps {
  events: BattleEvent[];
  currentIndex: number;
}

const EVENT_COLORS: Record<string, string> = {
  attack: '#ff5c5c',
  defense: '#5c8cff',
  heal: '#5cff8c'
};

const BattleTimeline: React.FC<BattleTimelineProps> = ({ events, currentIndex }) => {
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  const eventsByRound = events.reduce<Record<number, BattleEvent[]>>((acc, event) => {
    if (!acc[event.round]) {
      acc[event.round] = [];
    }
    acc[event.round].push(event);
    return acc;
  }, {});

  const rounds = Object.keys(eventsByRound)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div
      className="battle-timeline"
      style={{
        backgroundColor: '#2a2a3c',
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}
    >
      <div
        style={{
          color: '#c0c0c0',
          fontSize: '16px',
          fontWeight: 'bold',
          marginBottom: '8px',
          paddingBottom: '8px',
          borderBottom: '1px solid #3a3a5c'
        }}
      >
        战斗时间轴
      </div>

      <div
        style={{
          overflowY: 'auto',
          maxHeight: '65vh',
          paddingRight: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        {rounds.map((round) => (
          <div key={round} style={{ display: 'flex', gap: '16px', position: 'relative' }}>
            <div
              style={{
                minWidth: '60px',
                color: '#888',
                fontSize: '13px',
                fontWeight: 'bold',
                paddingTop: '4px',
                textAlign: 'center'
              }}
            >
              回合 {round}
            </div>

            <div
              style={{
                position: 'relative',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                paddingLeft: '12px'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: '17px',
                  top: '6px',
                  bottom: '6px',
                  width: '2px',
                  backgroundColor: '#3a3a5c'
                }}
              />

              {eventsByRound[round].map((event) => {
                const isSelected = event.id === selectedEventId;
                const isCurrent = event.timestamp === currentIndex;
                const isPast = event.timestamp <= currentIndex;
                const color = EVENT_COLORS[event.type];

                return (
                  <div key={event.id} style={{ position: 'relative', paddingLeft: '28px' }}>
                    <div
                      onClick={() => setSelectedEventId(isSelected ? null : event.id)}
                      style={{
                        position: 'absolute',
                        left: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: isSelected ? '16px' : '12px',
                        height: isSelected ? '16px' : '12px',
                        borderRadius: '50%',
                        backgroundColor: color,
                        opacity: isSelected || isCurrent ? 1 : isPast ? 0.8 : 0.4,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        zIndex: 2,
                        boxShadow: isCurrent ? `0 0 0 0 ${color}` : 'none'
                      }}
                      className={isCurrent ? 'timeline-dot-pulse' : ''}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.width = '16px';
                          e.currentTarget.style.height = '16px';
                          e.currentTarget.style.left = '8px';
                          e.currentTarget.style.opacity = '1';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected && !isCurrent) {
                          e.currentTarget.style.width = '12px';
                          e.currentTarget.style.height = '12px';
                          e.currentTarget.style.left = '10px';
                          e.currentTarget.style.opacity = isPast ? '0.8' : '0.4';
                        }
                      }}
                    />

                    <div
                      style={{
                        padding: '6px 10px',
                        backgroundColor: isSelected ? '#3a3a5c' : 'transparent',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        color: '#c0c0c0',
                        fontSize: '13px',
                        transition: 'background-color 0.2s ease'
                      }}
                      onClick={() => setSelectedEventId(isSelected ? null : event.id)}
                    >
                      <span style={{ color, fontWeight: 'bold', marginRight: '8px' }}>
                        [{EVENT_TYPE_LABEL[event.type]}]
                      </span>
                      {event.source} → {event.target}
                      <span
                        style={{
                          marginLeft: '8px',
                          color: event.value >= 0 ? '#5cff8c' : '#ff5c5c',
                          fontWeight: 'bold'
                        }}
                      >
                        {event.value >= 0 ? '+' : ''}
                        {event.value}
                      </span>
                    </div>

                    {isSelected && (
                      <div
                        className="detail-panel"
                        style={{
                          marginTop: '8px',
                          padding: '12px',
                          backgroundColor: '#1e1e2e',
                          borderRadius: '8px',
                          border: `1px solid ${color}40`,
                          animation: 'expandIn 0.2s ease-out'
                        }}
                      >
                        <div
                          style={{
                            fontSize: '13px',
                            color: '#c0c0c0',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px'
                          }}
                        >
                          <div>
                            <span style={{ color: '#888' }}>事件类型: </span>
                            <span style={{ color, fontWeight: 'bold' }}>
                              {EVENT_TYPE_LABEL[event.type]}
                            </span>
                          </div>
                          <div>
                            <span style={{ color: '#888' }}>发起者: </span>
                            <span>{event.source}</span>
                          </div>
                          <div>
                            <span style={{ color: '#888' }}>目标: </span>
                            <span>{event.target}</span>
                          </div>

                          {event.type === 'attack' && (
                            <>
                              <div>
                                <span style={{ color: '#888' }}>攻击力: </span>
                                <span style={{ color: '#ff5c5c' }}>{event.attackPower}</span>
                              </div>
                              <div>
                                <span style={{ color: '#888' }}>防御力: </span>
                                <span style={{ color: '#5c8cff' }}>{event.defensePower}</span>
                              </div>
                              <div>
                                <span style={{ color: '#888' }}>减免百分比: </span>
                                <span style={{ color: '#ffcc5c' }}>{event.reductionPercent?.toFixed(1)}%</span>
                              </div>
                              <div
                                style={{
                                  padding: '8px 12px',
                                  backgroundColor: '#3a3a5c',
                                  borderRadius: '6px',
                                  marginTop: '4px'
                                }}
                              >
                                <span style={{ color: '#888' }}>最终伤害: </span>
                                <span style={{ color: '#ff5c5c', fontWeight: 'bold', fontSize: '16px' }}>
                                  -{event.finalDamage}
                                </span>
                              </div>
                              <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                                公式: 减免 = 防御力 / (防御力 + 100) = {event.defensePower} / ({event.defensePower} + 100) ={' '}
                                {event.reductionPercent?.toFixed(1)}%
                              </div>
                            </>
                          )}

                          {event.type === 'defense' && (
                            <div>
                              <span style={{ color: '#888' }}>护盾值: </span>
                              <span style={{ color: '#5c8cff', fontWeight: 'bold' }}>+{event.value}</span>
                            </div>
                          )}

                          {event.type === 'heal' && (
                            <div>
                              <span style={{ color: '#888' }}>回复量: </span>
                              <span style={{ color: '#5cff8c', fontWeight: 'bold' }}>+{event.value}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {rounds.length === 0 && (
          <div style={{ color: '#666', textAlign: 'center', padding: '20px' }}>暂无战斗数据</div>
        )}
      </div>

      <style>{`
        @keyframes expandIn {
          from {
            opacity: 0;
            transform: scaleY(0.8);
            max-height: 0;
          }
          to {
            opacity: 1;
            transform: scaleY(1);
            max-height: 500px;
          }
        }
        .timeline-dot-pulse::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100%;
          height: 100%;
          border-radius: 50%;
          animation: pulse 0.5s ease-out infinite;
        }
        @keyframes pulse {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.8;
          }
          100% {
            transform: translate(-50%, -50%) scale(2.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default BattleTimeline;
