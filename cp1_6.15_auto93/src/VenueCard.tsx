import { useState, useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import type { Venue, ParkingStatus } from './types';

interface Props {
  venues: Venue[];
  setVenues: React.Dispatch<React.SetStateAction<Venue[]>>;
}

function getParkingStatus(spots: number, total: number): ParkingStatus {
  if (total === 0) return 'full';
  const ratio = spots / total;
  if (ratio > 0.5) return 'abundant';
  if (ratio > 0.15) return 'limited';
  return 'full';
}

function getParkingColor(status: ParkingStatus): string {
  switch (status) {
    case 'abundant': return '#4CAF50';
    case 'limited': return '#FFC107';
    case 'full': return '#F44336';
  }
}

function getParkingLabel(status: ParkingStatus): string {
  switch (status) {
    case 'abundant': return '充足';
    case 'limited': return '紧张';
    case 'full': return '已满';
  }
}

function useCountUp(target: number, duration: number = 1500, start: boolean = true) {
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!start || startedRef.current) return;
    startedRef.current = true;

    const startTime = performance.now();
    let animationId: number;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(easeOut * target));

      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [target, duration, start]);

  return value;
}

function CapacityCounter({ target, animate }: { target: number; animate: boolean }) {
  const value = useCountUp(target, 1500, animate);
  return <span>{value.toLocaleString()}</span>;
}

function VenueCardItem({
  venue,
  onClick,
  index,
  animate
}: {
  venue: Venue;
  onClick: () => void;
  index: number;
  animate: boolean;
}) {
  const parkingStatus = getParkingStatus(venue.parkingSpots, venue.parkingTotal);

  return (
    <div
      onClick={onClick}
      style={{
        background: 'rgba(255,255,255,0.02)',
        borderRadius: 16,
        padding: 22,
        border: '1px solid rgba(255,255,255,0.05)',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        animation: `cardIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.08}s both`,
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-6px) scale(1.01)';
        e.currentTarget.style.borderColor = 'rgba(255,191,102,0.3)';
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      <div style={{
        position: 'absolute',
        top: -30,
        right: -30,
        width: 100,
        height: 100,
        background: 'radial-gradient(circle, rgba(255,191,102,0.08) 0%, transparent 70%)',
        borderRadius: '50%'
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{
            fontSize: 17,
            fontWeight: 700,
            color: '#fff',
            marginBottom: 6,
            letterSpacing: 0.3
          }}>
            {venue.name}
          </div>
          <div style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: 5
          }}>
            <span>📍</span>
            {venue.city}
          </div>
        </div>
        <div style={{
          width: 42, height: 42,
          borderRadius: 12,
          background: 'linear-gradient(135deg, rgba(255,191,102,0.15), rgba(255,154,60,0.08))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18
        }}>
          🏟️
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
        paddingTop: 18,
        borderTop: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{
          padding: 12,
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 10
        }}>
          <div style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.45)',
            marginBottom: 6,
            letterSpacing: 0.3
          }}>
            可容纳人数
          </div>
          <div style={{
            fontSize: 24,
            fontWeight: 700,
            color: '#ffbf66',
            lineHeight: 1.1,
            fontFamily: 'system-ui'
          }}>
            <CapacityCounter target={venue.capacity} animate={animate} />
          </div>
        </div>

        <div style={{
          padding: 12,
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 10
        }}>
          <div style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.45)',
            marginBottom: 10,
            letterSpacing: 0.3
          }}>
            停车位状态
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginTop: 2
          }}>
            <div style={{
              width: 10, height: 10,
              borderRadius: '50%',
              background: getParkingColor(parkingStatus),
              boxShadow: `0 0 10px ${getParkingColor(parkingStatus)}99`,
              animation: parkingStatus === 'full' ? 'blink 1.2s ease-in-out infinite' : 'none',
              transform: 'translateZ(0)',
              willChange: 'opacity'
            }} />
            <span style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.55)',
              fontFamily: 'system-ui'
            }}>
              {venue.parkingSpots} / {venue.parkingTotal}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VenueCard({ venues }: Props) {
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [panelVisible, setPanelVisible] = useState(false);
  const [animateStart, setAnimateStart] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimateStart(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const openPanel = (venue: Venue) => {
    setSelectedVenue(venue);
    setTimeout(() => setPanelVisible(true), 10);
  };

  const closePanel = () => {
    setPanelVisible(false);
    setTimeout(() => setSelectedVenue(null), 400);
  };

  const getChartOption = (venue: Venue) => {
    const months = venue.monthlyData.map(d => d.month);
    const capacityData = venue.monthlyData.map(d => d.capacity);
    const ticketsData = venue.monthlyData.map(d => d.tickets);

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(30, 30, 58, 0.95)',
        borderColor: 'rgba(255,191,102,0.3)',
        borderWidth: 1,
        textStyle: { color: '#fff', fontSize: 12 },
        axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(255,191,102,0.06)' } }
      },
      legend: {
        data: ['场地容量', '实际售票'],
        top: 0,
        right: 0,
        textStyle: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
        itemWidth: 12,
        itemHeight: 12,
        itemGap: 16
      },
      grid: {
        left: '3%',
        right: '3%',
        bottom: '3%',
        top: '18%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: months,
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
        axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }
      },
      animationDuration: 600,
      animationEasing: 'cubicOut',
      series: [
        {
          name: '场地容量',
          type: 'bar',
          data: capacityData,
          barWidth: '32%',
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#ffbf66' },
                { offset: 1, color: '#ff9a3c' }
              ]
            }
          }
        },
        {
          name: '实际售票',
          type: 'bar',
          data: ticketsData,
          barWidth: '32%',
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#667eea' },
                { offset: 1, color: '#764ba2' }
              ]
            }
          }
        }
      ]
    };
  };

  return (
    <div style={{ padding: 28, minHeight: '100%' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 28
      }}>
        <div>
          <h1 style={{
            color: '#fff',
            fontSize: 26,
            fontWeight: 700,
            marginBottom: 6,
            letterSpacing: 0.5
          }}>
            场地管理
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>
            管理和查看所有合作演出场地
          </p>
        </div>
        <button style={{
          padding: '10px 20px',
          borderRadius: 10,
          border: 'none',
          background: 'linear-gradient(135deg, #ffbf66, #ff9a3c)',
          color: '#1a1a2e',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          boxShadow: '0 4px 16px rgba(255,191,102,0.25)'
        }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(255,191,102,0.35)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = '';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(255,191,102,0.25)';
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 400 }}>+</span>
          添加场地
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 20,
        maxWidth: '100%'
      }}>
        {venues.map((venue, idx) => (
          <VenueCardItem
            key={venue.id}
            venue={venue}
            onClick={() => openPanel(venue)}
            index={idx}
            animate={animateStart}
          />
        ))}
      </div>

      <div style={{
        position: 'fixed',
        inset: 0,
        background: panelVisible ? 'rgba(0,0,0,0.5)' : 'transparent',
        pointerEvents: panelVisible ? 'auto' : 'none',
        transition: 'background 0.4s ease',
        zIndex: 1000
      }} onClick={closePanel} />

      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: 520,
        height: '100%',
        background: 'linear-gradient(180deg, #1e1e3a 0%, #16162a 100%)',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.4)',
        transform: panelVisible ? 'translateZ(0) translateX(0)' : 'translateZ(0) translateX(100%)',
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        willChange: 'transform',
        backfaceVisibility: 'hidden',
        zIndex: 1001,
        overflow: 'auto',
        borderLeft: '1px solid rgba(255,255,255,0.06)'
      }}>
        {selectedVenue && (
          <>
            <div style={{
              padding: '28px 28px 20px',
              position: 'sticky',
              top: 0,
              background: 'linear-gradient(180deg, rgba(30,30,58,0.98) 0%, rgba(30,30,58,0.9) 80%, transparent 100%)',
              zIndex: 10,
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 20
              }}>
                <div style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#ffbf66',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  letterSpacing: 0.5
                }}>
                  <div style={{ width: 3, height: 14, background: 'linear-gradient(180deg, #ffbf66, #ff9a3c)', borderRadius: 2 }} />
                  场地详情
                </div>
                <button
                  onClick={closePanel}
                  style={{
                    width: 32, height: 32,
                    borderRadius: 8,
                    border: 'none',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'rgba(255,255,255,0.6)',
                    fontSize: 18,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,107,107,0.15)';
                    e.currentTarget.style.color = '#ff6b6b';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 64, height: 64,
                  borderRadius: 18,
                  background: 'linear-gradient(135deg, #ffbf66, #ff9a3c)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 30,
                  boxShadow: '0 8px 24px rgba(255,191,102,0.3)'
                }}>
                  🏟️
                </div>
                <div>
                  <div style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: '#fff',
                    marginBottom: 4,
                    letterSpacing: 0.3
                  }}>
                    {selectedVenue.name}
                  </div>
                  <div style={{
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    📍 {selectedVenue.city}
                    <span style={{
                      width: 4, height: 4,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.2)'
                    }} />
                    经纬度: {selectedVenue.lat.toFixed(2)}, {selectedVenue.lng.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: '0 28px 28px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 12,
                marginBottom: 28
              }}>
                <div style={{
                  padding: 16,
                  background: 'rgba(255,191,102,0.08)',
                  borderRadius: 12,
                  border: '1px solid rgba(255,191,102,0.15)'
                }}>
                  <div style={{
                    fontSize: 11,
                    color: '#ffbf66',
                    opacity: 0.7,
                    marginBottom: 8,
                    letterSpacing: 0.3
                  }}>
                    场地容量
                  </div>
                  <div style={{
                    fontSize: 26,
                    fontWeight: 700,
                    color: '#ffbf66',
                    lineHeight: 1
                  }}>
                    {selectedVenue.capacity}
                  </div>
                </div>
                <div style={{
                  padding: 16,
                  background: 'rgba(74,222,128,0.08)',
                  borderRadius: 12,
                  border: '1px solid rgba(74,222,128,0.15)'
                }}>
                  <div style={{
                    fontSize: 11,
                    color: '#4ade80',
                    opacity: 0.8,
                    marginBottom: 8,
                    letterSpacing: 0.3
                  }}>
                    可用车位
                  </div>
                  <div style={{
                    fontSize: 26,
                    fontWeight: 700,
                    color: '#4ade80',
                    lineHeight: 1
                  }}>
                    {selectedVenue.parkingSpots}
                  </div>
                </div>
                <div style={{
                  padding: 16,
                  background: 'rgba(102,126,234,0.08)',
                  borderRadius: 12,
                  border: '1px solid rgba(102,126,234,0.15)'
                }}>
                  <div style={{
                    fontSize: 11,
                    color: '#667eea',
                    opacity: 0.8,
                    marginBottom: 8,
                    letterSpacing: 0.3
                  }}>
                    车位总数
                  </div>
                  <div style={{
                    fontSize: 26,
                    fontWeight: 700,
                    color: '#667eea',
                    lineHeight: 1
                  }}>
                    {selectedVenue.parkingTotal}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 28 }}>
                <h3 style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#fff',
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <span style={{
                    width: 4, height: 16,
                    background: 'linear-gradient(180deg, #ffbf66, #ff9a3c)',
                    borderRadius: 2
                  }} />
                  售票数据统计
                </h3>
                <div style={{
                  height: 280,
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 14,
                  padding: 16,
                  border: '1px solid rgba(255,255,255,0.05)'
                }}>
                  {panelVisible && (
                    <ReactECharts
                      className="echarts"
                      option={getChartOption(selectedVenue)}
                      style={{ height: '100%', width: '100%', transform: 'translateZ(0)', willChange: 'transform' }}
                      opts={{ renderer: 'canvas' }}
                    />
                  )}
                </div>
              </div>

              <div style={{
                padding: 18,
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 14,
                border: '1px solid rgba(255,255,255,0.05)',
                marginBottom: 28
              }}>
                <div style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#fff',
                  marginBottom: 14
                }}>
                  停车场可用率
                </div>
                <div style={{
                  height: 8,
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: 4,
                  overflow: 'hidden',
                  marginBottom: 10
                }}>
                  <div
                    className="progress-bar"
                    style={{
                      height: '100%',
                      width: panelVisible
                        ? `${Math.round((selectedVenue.parkingSpots / Math.max(selectedVenue.parkingTotal, 1)) * 100)}%`
                        : '0%',
                      background: `linear-gradient(90deg, ${getParkingColor(getParkingStatus(selectedVenue.parkingSpots, selectedVenue.parkingTotal))}, ${getParkingColor(getParkingStatus(selectedVenue.parkingSpots, selectedVenue.parkingTotal))}aa)`,
                      borderRadius: 4,
                      transition: 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      willChange: 'width',
                      transform: 'translateZ(0)'
                    }}
                  />
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.5)'
                }}>
                  <span>0</span>
                  <span>
                    可用 {Math.round((selectedVenue.parkingSpots / Math.max(selectedVenue.parkingTotal, 1)) * 100)}%
                  </span>
                  <span>{selectedVenue.parkingTotal}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                  }}
                >
                  编辑信息
                </button>
                <button style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: 10,
                  border: 'none',
                  background: 'linear-gradient(135deg, #ffbf66, #ff9a3c)',
                  color: '#1a1a2e',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(255,191,102,0.35)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = '';
                    e.currentTarget.style.boxShadow = '';
                  }}
                >
                  预约场地
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes cardIn {
          from { opacity: 0; transform: translateZ(0) translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateZ(0) translateY(0) scale(1); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; transform: translateZ(0); }
          50% { opacity: 0.4; transform: translateZ(0); }
        }
        .venue-card, .detail-panel, .echarts {
          will-change: transform;
          backface-visibility: hidden;
          transform: translateZ(0);
        }
        .detail-panel {
          will-change: transform, opacity;
        }
        .progress-bar {
          will-change: width;
        }
      `}</style>
    </div>
  );
}
