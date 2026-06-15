import { useState, useMemo, useRef, useEffect } from 'react';
import type { TourDate, Venue } from './types';

interface Props {
  venues: Venue[];
  tourDates: TourDate[];
  setTourDates: React.Dispatch<React.SetStateAction<TourDate[]>>;
}

const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

export default function CalendarView({ venues, tourDates, setTourDates }: Props) {
  const today = new Date(2026, 5, 15);
  const [currentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedEvent, setSelectedEvent] = useState<TourDate | null>(null);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
  const [showPopup, setShowPopup] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const { daysInMonth, firstDayOfWeek } = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    return {
      daysInMonth: lastDay.getDate(),
      firstDayOfWeek: firstDay.getDay()
    };
  }, [currentYear, currentMonth]);

  const tourDateMap = useMemo(() => {
    const map = new Map<string, TourDate>();
    tourDates.forEach(td => {
      const d = new Date(td.date);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        map.set(td.date, td);
      }
    });
    return map;
  }, [tourDates, currentYear, currentMonth]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setShowPopup(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDateClick = (dateStr: string, dayNum: number, weekIdx: number, e: React.MouseEvent) => {
    const event = tourDateMap.get(dateStr);
    if (event) {
      const cell = cellRefs.current.get(`${weekIdx}-${dayNum}`);
      if (cell) {
        const rect = cell.getBoundingClientRect();
        const mainContent = (e.currentTarget as HTMLElement).closest('main');
        const mainRect = mainContent?.getBoundingClientRect();
        if (mainRect) {
          setPopupPos({
            x: rect.left - mainRect.left + rect.width / 2,
            y: rect.top - mainRect.top - 8
          });
        }
      }
      setSelectedEvent(event);
      setShowPopup(true);
    }
  };

  const prevMonth = () => {
    setCurrentMonth(prev => prev === 0 ? 11 : prev - 1);
  };

  const nextMonth = () => {
    setCurrentMonth(prev => prev === 11 ? 0 : prev + 1);
  };

  const deleteTourDate = async (id: string) => {
    try {
      await fetch(`/api/tour-dates/${id}`, { method: 'DELETE' });
      setTourDates(prev => prev.filter(td => td.id !== id));
      setShowPopup(false);
    } catch (e) {
      console.error(e);
    }
  };

  const renderCalendarDays = () => {
    const rows: JSX.Element[] = [];
    let dayCounter = 1;
    const totalWeeks = Math.ceil((firstDayOfWeek + daysInMonth) / 7);

    for (let week = 0; week < totalWeeks; week++) {
      const cells: JSX.Element[] = [];
      for (let day = 0; day < 7; day++) {
        const isEmpty = (week === 0 && day < firstDayOfWeek) || dayCounter > daysInMonth;

        if (isEmpty) {
          cells.push(<div key={`empty-${week}-${day}`} />);
        } else {
          const currentDayNum = dayCounter;
          const dateObj = new Date(currentYear, currentMonth, currentDayNum);
          const dateStr = dateObj.toISOString().split('T')[0];
          const hasEvent = tourDateMap.has(dateStr);
          const isToday = dateObj.toDateString() === today.toDateString();
          const dayColor = isToday ? '#ffbf66' : (hasEvent ? '#fff' : 'rgba(255,255,255,0.6)');

          cells.push(
            <div
              key={`${week}-${currentDayNum}`}
              ref={(el) => {
                if (el) cellRefs.current.set(`${week}-${currentDayNum}`, el);
              }}
              onClick={(e) => handleDateClick(dateStr, currentDayNum, week, e)}
              style={{
                aspectRatio: '1 / 0.85',
                background: hasEvent
                  ? 'linear-gradient(135deg, rgba(255,191,102,0.12), rgba(255,154,60,0.06))'
                  : 'rgba(255,255,255,0.03)',
                borderRadius: 10,
                padding: '10px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: hasEvent ? 'pointer' : 'default',
                border: isToday ? '1px solid rgba(255,191,102,0.4)' : '1px solid transparent',
                transition: 'all 0.25s ease',
                position: 'relative',
                boxShadow: hasEvent ? '0 2px 8px rgba(255,191,102,0.1)' : 'none',
                minHeight: 70
              }}
              onMouseEnter={(e) => {
                if (hasEvent) {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(255,191,102,0.2)';
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = '';
                (e.currentTarget as HTMLElement).style.boxShadow = hasEvent ? '0 2px 8px rgba(255,191,102,0.1)' : 'none';
              }}
            >
              <div style={{
                fontSize: 14,
                fontWeight: isToday ? 700 : 500,
                color: dayColor
              }}>{currentDayNum}</div>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                {hasEvent && (
                  <>
                    <div style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: 'radial-gradient(circle at 30% 30%, #ffd699, #ffbf66)',
                      boxShadow: '0 0 8px rgba(255,191,102,0.6)',
                      animation: 'pulse 2s ease-in-out infinite'
                    }} />
                    <span style={{
                      fontSize: 10,
                      color: 'rgba(255,255,255,0.5)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: 'calc(100% - 14px)'
                    }}>
                      {tourDateMap.get(dateStr)?.city}
                    </span>
                  </>
                )}
              </div>
            </div>
          );
          dayCounter++;
        }
      }
      rows.push(
        <div key={`week-${week}`} style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 8,
          marginBottom: 8
        }}>
          {cells}
        </div>
      );
    }
    return rows;
  };

  const upcomingShows = tourDates
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4);

  const btnHoverStyle = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.background = 'rgba(255,191,102,0.15)';
    e.currentTarget.style.color = '#ffbf66';
  };
  const btnLeaveStyle = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
    e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
  };

  return (
    <div style={{ padding: 28, minHeight: '100%' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          color: '#fff',
          fontSize: 26,
          fontWeight: 700,
          marginBottom: 6,
          letterSpacing: 0.5
        }}>
          2026 夏季巡演
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>
          管理你的演出日期和场地安排
        </p>
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <div style={{
          flex: 1,
          background: 'rgba(255,255,255,0.02)',
          borderRadius: 18,
          padding: 24,
          border: '1px solid rgba(255,255,255,0.05)',
          position: 'relative'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20
          }}>
            <button
              onClick={prevMonth}
              style={{
                width: 36, height: 36,
                borderRadius: 10,
                background: 'rgba(255,255,255,0.05)',
                border: 'none',
                color: 'rgba(255,255,255,0.7)',
                cursor: 'pointer',
                fontSize: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={btnHoverStyle}
              onMouseLeave={btnLeaveStyle}
            >
              ‹
            </button>
            <h2 style={{
              color: '#fff',
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: 1
            }}>
              {currentYear}年 {monthNames[currentMonth]}
            </h2>
            <button
              onClick={nextMonth}
              style={{
                width: 36, height: 36,
                borderRadius: 10,
                background: 'rgba(255,255,255,0.05)',
                border: 'none',
                color: 'rgba(255,255,255,0.7)',
                cursor: 'pointer',
                fontSize: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={btnHoverStyle}
              onMouseLeave={btnLeaveStyle}
            >
              ›
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 8,
            marginBottom: 12
          }}>
            {weekDays.map(d => (
              <div key={d} style={{
                textAlign: 'center',
                fontSize: 12,
                color: 'rgba(255,255,255,0.4)',
                paddingBottom: 8,
                fontWeight: 600,
                letterSpacing: 1
              }}>
                {d}
              </div>
            ))}
          </div>
          {renderCalendarDays()}

          {showPopup && selectedEvent && (
            <div
              ref={popupRef}
              style={{
                position: 'absolute',
                zIndex: 100,
                left: popupPos.x,
                top: popupPos.y,
                transformOrigin: 'bottom center',
                pointerEvents: 'auto',
                willChange: 'transform, opacity',
                transform: 'translateZ(0) translate(-50%, -100%)',
                animation: 'popupBounce 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55) both'
              }}
            >
              <div style={{
                position: 'absolute',
                bottom: -5,
                left: '50%',
                marginLeft: -6,
                width: 12,
                height: 12,
                background: '#252542',
                transform: 'translateZ(0) rotate(45deg)',
                zIndex: 1,
                willChange: 'transform'
              }} />
              <div style={{
                background: 'linear-gradient(135deg, #1e1e3a 0%, #252542 100%)',
                borderRadius: 14,
                padding: 18,
                minWidth: 260,
                border: '1px solid rgba(255,191,102,0.2)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                position: 'relative',
                zIndex: 2,
                transform: 'translateZ(0)',
                willChange: 'transform'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 14
                }}>
                  <div style={{
                    width: 44, height: 44,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #ffbf66, #ff9a3c)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#1a1a2e',
                    fontWeight: 700
                  }}>
                    <div style={{ fontSize: 9, opacity: 0.8 }}>
                      {new Date(selectedEvent.date).getMonth() + 1}月
                    </div>
                    <div style={{ fontSize: 16, lineHeight: 1 }}>
                      {new Date(selectedEvent.date).getDate()}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>
                      {selectedEvent.venueName}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                      📍 {selectedEvent.city}
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: 8,
                  marginBottom: 14
                }}>
                  <div style={{
                    fontSize: 11,
                    color: '#ffbf66',
                    marginBottom: 4,
                    fontWeight: 600,
                    letterSpacing: 0.5
                  }}>
                    备注
                  </div>
                  <div style={{
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.8)',
                    lineHeight: 1.5
                  }}>
                    {selectedEvent.notes}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'transparent',
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: 12,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => deleteTourDate(selectedEvent.id)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: 'none',
                      background: 'linear-gradient(135deg, #ff6b6b, #ee5a5a)',
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(255,107,107,0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = '';
                      e.currentTarget.style.boxShadow = '';
                    }}
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ width: 300, flexShrink: 0 }}>
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            borderRadius: 18,
            padding: 20,
            border: '1px solid rgba(255,255,255,0.05)',
            marginBottom: 16
          }}>
            <h3 style={{
              color: '#fff',
              fontSize: 15,
              fontWeight: 600,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <span style={{
                width: 4,
                height: 16,
                background: 'linear-gradient(180deg, #ffbf66, #ff9a3c)',
                borderRadius: 2
              }} />
              即将到来
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {upcomingShows.map((show, idx) => (
                <div key={show.id} style={{
                  padding: 12,
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.04)',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'center',
                  animation: `slideInRight 0.4s ease ${idx * 0.08}s both`
                }}>
                  <div style={{
                    width: 36, height: 36,
                    borderRadius: 10,
                    background: 'rgba(255,191,102,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffbf66',
                    fontWeight: 700,
                    fontSize: 13,
                    flexShrink: 0
                  }}>
                    {new Date(show.date).getDate()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: 500,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {show.venueName}
                    </div>
                    <div style={{
                      color: 'rgba(255,255,255,0.45)',
                      fontSize: 11,
                      marginTop: 2
                    }}>
                      {show.city}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, rgba(255,191,102,0.1) 0%, rgba(255,154,60,0.05) 100%)',
            borderRadius: 18,
            padding: 20,
            border: '1px solid rgba(255,191,102,0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{
                width: 40, height: 40,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #ffbf66, #ff9a3c)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20
              }}>
                🎵
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>
                  巡演统计
                </div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
                  2026 Summer Tour
                </div>
              </div>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              marginBottom: 14
            }}>
              <div style={{
                padding: 12,
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 10
              }}>
                <div style={{
                  color: '#ffbf66',
                  fontSize: 22,
                  fontWeight: 700,
                  lineHeight: 1
                }}>
                  {tourDates.length}
                </div>
                <div style={{
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: 11,
                  marginTop: 4
                }}>
                  演出场次
                </div>
              </div>
              <div style={{
                padding: 12,
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 10
              }}>
                <div style={{
                  color: '#ffbf66',
                  fontSize: 22,
                  fontWeight: 700,
                  lineHeight: 1
                }}>
                  {venues.length}
                </div>
                <div style={{
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: 11,
                  marginTop: 4
                }}>
                  合作场地
                </div>
              </div>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 10,
              fontSize: 12,
              color: 'rgba(255,255,255,0.7)'
            }}>
              <span>总可售座位</span>
              <span style={{ color: '#ffbf66', fontWeight: 600 }}>
                {venues.reduce((sum, v) => sum + v.capacity, 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: translateZ(0) scale(1); }
          50% { opacity: 0.7; transform: translateZ(0) scale(0.9); }
        }
        @keyframes popupBounce {
          0% {
            opacity: 0;
            transform: translateZ(0) translate(-50%, calc(-100% + 16px)) scale(0.75) translateY(6px);
          }
          55% {
            opacity: 1;
            transform: translateZ(0) translate(-50%, -100%) scale(1.06) translateY(-2px);
          }
          75% {
            transform: translateZ(0) translate(-50%, calc(-100% - 3px)) scale(0.97) translateY(1px);
          }
          100% {
            opacity: 1;
            transform: translateZ(0) translate(-50%, -100%) scale(1) translateY(0);
          }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateZ(0) translateX(20px); }
          to { opacity: 1; transform: translateZ(0) translateX(0); }
        }
        .card, .cell, .panel, button {
          will-change: transform;
          backface-visibility: hidden;
        }
      `}</style>
    </div>
  );
}
