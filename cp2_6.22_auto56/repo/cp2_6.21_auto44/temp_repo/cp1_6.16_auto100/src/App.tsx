import { useEffect, useState, useMemo, useCallback } from 'react';
import MapPanel from './components/MapPanel';
import LogPanel from './components/LogPanel';
import { useStore, CITIES } from './store/useStore';
import type { TripSegment } from './store/useStore';

export default function App() {
  const {
    segments,
    totalBudget,
    setTotalBudget,
    schedulePopup,
    addSegment,
    closeSchedulePopup,
    removeSegment,
    reorderSegments,
    setDraggingSegmentIndex,
    draggingSegmentIndex,
    isLogPanelOpen,
    openLogPanel,
    closeLogPanel,
    getOptimizationSuggestions
  } = useStore();

  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [showWarningBanner, setShowWarningBanner] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [rippleButton, setRippleButton] = useState<{ x: number; y: number } | null>(null);
  const [zoomPhoto, setZoomPhoto] = useState<string | null>(null);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalCost = useMemo(
    () => segments.reduce((sum, s) => sum + s.selectedSchedule.priceMax, 0),
    [segments]
  );

  const remaining = totalBudget - totalCost;
  const costRatio = totalCost / totalBudget;

  useEffect(() => {
    setShowWarningBanner(costRatio >= 0.9 && segments.length > 0);
  }, [costRatio, segments.length]);

  const suggestions = getOptimizationSuggestions();

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    setDraggingSegmentIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  }, [setDraggingSegmentIndex]);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    reorderSegments(draggedIndex, index);
    setDraggedIndex(index);
  }, [draggedIndex, reorderSegments]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDraggingSegmentIndex(null);
  }, [setDraggingSegmentIndex]);

  const handleGenerateLogClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setRippleButton({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setTimeout(() => setRippleButton(null), 600);
    openLogPanel();
  };

  const getCityName = (id: string) => CITIES.find(c => c.id === id)?.name || id;

  const isSegmentOverBudget = (segment: TripSegment) => {
    let running = 0;
    for (let i = 0; i < segments.length; i++) {
      running += segments[i].selectedSchedule.priceMax;
      if (segments[i].id === segment.id) break;
    }
    return running > totalBudget;
  };

  const isMobile = windowWidth < 768;
  const isHorizontal = !isMobile;

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: isHorizontal ? 'row' : 'column',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <style>{`
        @keyframes fadeInBanner {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
        }
        @keyframes ripple {
          0% { width: 0; height: 0; opacity: 0.6; }
          100% { width: 200px; height: 200px; opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.6); }
          50% { box-shadow: 0 0 0 10px rgba(255, 215, 0, 0); }
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .warning-banner {
          animation: fadeInBanner 0.5s ease-out forwards;
        }
        .segment-over-budget {
          border: 2px solid #FF4444 !important;
          animation: shake 0.3s infinite;
        }
        .ripple-circle {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.5);
          animation: ripple 0.6s ease-out forwards;
          pointer-events: none;
        }
        .green-dashed {
          border-bottom: 2px dashed #4CAF50;
          padding-bottom: 2px;
        }
      `}</style>

      {showWarningBanner && (
        <div className="warning-banner" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          padding: '14px 24px',
          background: 'linear-gradient(90deg, #ffb300, #ff8f00, #ffb300)',
          backgroundSize: '200% 200%',
          animation: 'fadeInBanner 0.5s ease-out, gradientShift 3s ease infinite',
          color: '#1a1a1a',
          fontWeight: 600,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          boxShadow: '0 4px 20px rgba(255, 143, 0, 0.4)'
        }}>
          <span>⚠️ 预算警告：当前总费用已达预算的 {Math.round(costRatio * 100)}%</span>
          <button
            onClick={() => setShowWarningBanner(false)}
            style={{
              background: 'rgba(255,255,255,0.3)',
              border: 'none',
              color: '#1a1a1a',
              width: 28,
              height: 28,
              borderRadius: '50%',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.3s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.6)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
          >
            ✕
          </button>
        </div>
      )}

      <div style={{
        flex: isHorizontal ? 6 : 'none',
        height: isHorizontal ? '100%' : '60%',
        width: isHorizontal ? '60%' : '100%',
        position: 'relative',
        minHeight: isMobile ? 400 : 0,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <h1 style={{
            fontSize: 24,
            fontWeight: 700,
            color: '#ffd700',
            marginBottom: 4
          }}>
            🚂 欧洲跨国火车旅行规划器
          </h1>
          <p style={{ fontSize: 13, opacity: 0.75 }}>
            点击地图上的城市节点，规划您的完美旅程
          </p>
        </div>
        <div style={{ flex: 1, position: 'relative' }}>
          <MapPanel />
        </div>

        <button
          onClick={handleGenerateLogClick}
          style={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            width: 120,
            height: 40,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #2e7d32, #1b5e20)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: 15,
            fontWeight: 600,
            boxShadow: '0 4px 15px rgba(46, 125, 50, 0.4)',
            transition: 'all 0.3s ease',
            overflow: 'hidden',
            zIndex: 100
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #43a047, #2e7d32)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #2e7d32, #1b5e20)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          生成日志
          {rippleButton && (
            <span
              className="ripple-circle"
              style={{
                left: rippleButton.x - 100,
                top: rippleButton.y - 100
              }}
            />
          )}
        </button>
      </div>

      <div style={{
        flex: isHorizontal ? 4 : 'none',
        height: isHorizontal ? '100%' : '40%',
        width: isHorizontal ? '40%' : '100%',
        borderLeft: isHorizontal ? '1px solid rgba(255,255,255,0.1)' : 'none',
        borderTop: isHorizontal ? 'none' : '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '16px 20px',
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#ffd700' }}>行程规划</h2>
            <span style={{ fontSize: 12, opacity: 0.6 }}>拖动调整顺序</span>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            borderRadius: 10,
            padding: 14,
            marginBottom: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <label style={{ fontSize: 13, opacity: 0.8, whiteSpace: 'nowrap' }}>总预算（€）：</label>
              <input
                type="number"
                value={totalBudget}
                onChange={e => setTotalBudget(Math.max(0, parseInt(e.target.value) || 0))}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#f5f5f5',
                  fontSize: 14,
                  outline: 'none',
                  transition: 'all 0.3s'
                }}
                onFocus={e => e.currentTarget.style.borderColor = '#ffd700'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <div>
                <span style={{ opacity: 0.7 }}>已花费：</span>
                <span style={{ color: costRatio > 1 ? '#FF4444' : '#f5f5f5', fontWeight: 600 }}>
                  €{totalCost}
                </span>
              </div>
              <div>
                <span style={{ opacity: 0.7 }}>剩余：</span>
                <span style={{
                  color: remaining < 0 ? '#FF4444' : remaining < totalBudget * 0.1 ? '#ffd700' : '#81C784',
                  fontWeight: 600
                }}>
                  €{remaining}
                </span>
              </div>
            </div>
            <div style={{
              marginTop: 10,
              height: 6,
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 3,
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${Math.min(100, costRatio * 100)}%`,
                background: costRatio > 1
                  ? 'linear-gradient(90deg, #FF4444, #d32f2f)'
                  : costRatio >= 0.9
                  ? 'linear-gradient(90deg, #ffb300, #ff8f00)'
                  : 'linear-gradient(90deg, #4fc3f7, #29b6f6)',
                borderRadius: 3,
                transition: 'all 0.5s ease'
              }} />
            </div>
          </div>

          {suggestions.length > 0 && (
            <div style={{
              background: 'rgba(76, 175, 80, 0.15)',
              border: '1px solid rgba(76, 175, 80, 0.3)',
              borderRadius: 8,
              padding: 12,
              fontSize: 12,
              lineHeight: 1.6
            }}>
              <div style={{ fontWeight: 600, color: '#81C784', marginBottom: 6 }}>💡 优化建议：</div>
              {suggestions.map((s, i) => (
                <div key={i} className="green-dashed" style={{ color: '#a5d6a7', display: 'inline-block' }}>
                  • {s}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 16px',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.3) transparent'
        }}>
          {segments.length === 0 ? (
            <div style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              opacity: 0.5,
              textAlign: 'center',
              padding: 20
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🗺️</div>
              <p>暂无行程，点击左侧地图开始规划</p>
              <p style={{ fontSize: 12, marginTop: 6 }}>点击两个城市节点可添加一段行程</p>
            </div>
          ) : (
            segments.map((segment, index) => {
              const overBudget = isSegmentOverBudget(segment);
              return (
                <div
                  key={segment.id}
                  draggable
                  onDragStart={e => handleDragStart(e, index)}
                  onDragOver={e => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={overBudget ? 'segment-over-budget' : ''}
                  style={{
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 14px',
                    marginBottom: 8,
                    borderRadius: 8,
                    background: `linear-gradient(135deg, ${draggingSegmentIndex === index ? 'rgba(79, 195, 247, 0.25)' : 'rgba(255,255,255,0.15)'}, rgba(255,255,255,0.05))`,
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    border: overBudget ? '2px solid #FF4444' : '1px solid rgba(255,255,255,0.1)',
                    cursor: 'grab',
                    transition: 'all 0.3s ease',
                    gap: 10,
                    fontSize: 12.5
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateX(4px)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateX(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <span style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: segment.mode === 'train'
                      ? 'linear-gradient(135deg, #29b6f6, #0288d1)'
                      : 'linear-gradient(135deg, #26a69a, #00897b)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    flexShrink: 0
                  }}>
                    {index + 1}
                  </span>
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    overflow: 'hidden',
                    whiteSpace: 'nowrap'
                  }}>
                    <span style={{ fontWeight: 600 }}>{getCityName(segment.from)}</span>
                    <span style={{
                      color: segment.mode === 'train' ? '#4fc3f7' : '#4db6ac',
                      flexShrink: 0
                    }}>
                      {segment.mode === 'train' ? '🚄' : '⛴️'} →
                    </span>
                    <span style={{ fontWeight: 600 }}>{getCityName(segment.to)}</span>
                  </div>
                  <div style={{
                    textAlign: 'right',
                    fontSize: 11,
                    opacity: 0.85,
                    flexShrink: 0,
                    lineHeight: 1.3
                  }}>
                    <div>{segment.selectedSchedule.departureTime} - {segment.selectedSchedule.arrivalTime}</div>
                    <div style={{ color: overBudget ? '#FF4444' : '#ffd700', fontWeight: 600 }}>
                      €{segment.selectedSchedule.priceMin}-{segment.selectedSchedule.priceMax}
                    </div>
                  </div>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      removeSegment(segment.id);
                    }}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: 'rgba(255,68,68,0.2)',
                      border: 'none',
                      color: '#ff8a80',
                      cursor: 'pointer',
                      fontSize: 12,
                      transition: 'all 0.3s',
                      flexShrink: 0
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(255,68,68,0.5)';
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.transform = 'scale(1.15)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(255,68,68,0.2)';
                      e.currentTarget.style.color = '#ff8a80';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    ✕
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {schedulePopup && (
        <div
          onClick={closeSchedulePopup}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.08))',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.2)',
              padding: 24,
              maxWidth: 480,
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              animation: 'fadeInBanner 0.3s ease-out'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: '#ffd700', marginBottom: 4 }}>
                  选择 {schedulePopup.mode === 'train' ? '🚄 火车' : '⛴️ 轮船'} 班次
                </h3>
                <p style={{ fontSize: 14, opacity: 0.75 }}>
                  {getCityName(schedulePopup.from)} → {getCityName(schedulePopup.to)}
                </p>
              </div>
              <button
                onClick={closeSchedulePopup}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: '#f5f5f5',
                  cursor: 'pointer',
                  fontSize: 16,
                  transition: 'all 0.3s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(255,68,68,0.4)';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {schedulePopup.schedules.map(schedule => (
                <div
                  key={schedule.id}
                  onClick={() => addSegment(schedulePopup.from, schedulePopup.to, schedule, schedulePopup.mode)}
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = schedulePopup.mode === 'train'
                      ? 'rgba(79, 195, 247, 0.15)'
                      : 'rgba(77, 182, 172, 0.15)';
                    e.currentTarget.style.borderColor = schedulePopup.mode === 'train' ? '#4fc3f7' : '#4db6ac';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 10
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: schedulePopup.mode === 'train' ? '#4fc3f7' : '#4db6ac'
                      }}>
                        {schedule.departureTime}
                      </span>
                      <span style={{ opacity: 0.5 }}>→</span>
                      <span style={{ fontSize: 18, fontWeight: 700 }}>{schedule.arrivalTime}</span>
                    </div>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: 20,
                      background: 'rgba(255,255,255,0.1)',
                      fontSize: 12,
                      opacity: 0.9
                    }}>
                      ⏱ {schedule.duration}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 13
                  }}>
                    <span style={{ opacity: 0.8 }}>
                      🎫 {schedule.cabinType}
                    </span>
                    <span style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: '#ffd700'
                    }}>
                      €{schedule.priceMin} - €{schedule.priceMax}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isLogPanelOpen && (
        <div
          onClick={closeLogPanel}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 3000,
            display: 'flex',
            justifyContent: isHorizontal ? 'flex-end' : 'flex-start',
            flexDirection: isHorizontal ? 'row' : 'column'
          }}
        >
          <LogPanel
            onClose={closeLogPanel}
            onZoomPhoto={setZoomPhoto}
            isHorizontal={isHorizontal}
          />
        </div>
      )}

      {zoomPhoto && (
        <div
          onClick={() => setZoomPhoto(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.92)',
            zIndex: 4000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 30,
            cursor: 'zoom-out'
          }}
        >
          <img
            src={zoomPhoto}
            alt="放大照片"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '95%',
              maxHeight: '95%',
              borderRadius: 8,
              boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
              objectFit: 'contain'
            }}
          />
        </div>
      )}
    </div>
  );
}
