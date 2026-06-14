import { useState, useEffect, useMemo, useRef } from 'react';
import type { Property, CalendarDay, BookingStatus } from '../types';
import { propertyApi, calendarApi } from '../api';

const statusLabels: Record<BookingStatus, string> = {
  booked: '已预订',
  pending: '待确认',
  available: '空闲',
  maintenance: '维护中',
};

export default function CalendarView() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedDay, setSelectedDay] = useState<{ propertyId: string; date: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [props, cal] = await Promise.all([
          propertyApi.getAll(),
          calendarApi.getRange(
            getDateString(addMonths(new Date(), -1)),
            getDateString(addMonths(new Date(), 2))
          ),
        ]);
        setProperties(props.filter(p => p.isActive));
        setCalendarData(cal);
      } catch (error) {
        console.error('Failed to fetch calendar data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuPosition(null);
        setSelectedDay(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { dates, dayHeaders } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const start = new Date(today);
    start.setDate(1);
    start.setMonth(currentMonth.getMonth());
    start.setFullYear(currentMonth.getFullYear());

    let daysToShow: number;
    if (viewMode === 'month') {
      const firstDay = new Date(start.getFullYear(), start.getMonth(), 1);
      const lastDay = new Date(start.getFullYear(), start.getMonth() + 1, 0);
      daysToShow = lastDay.getDate();
      start.setDate(1);
    } else {
      daysToShow = 7;
      start.setDate(today.getDate() - today.getDay());
    }

    const dates: Date[] = [];
    for (let i = 0; i < daysToShow; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(d);
    }

    const dayHeaders = dates.map(d => ({
      date: getDateString(d),
      day: d.getDate(),
      weekday: d.toLocaleDateString('zh-CN', { weekday: 'short' }),
      isToday: isSameDay(d, today),
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
    }));

    return { dates, dayHeaders };
  }, [viewMode, currentMonth]);

  const calendarMap = useMemo(() => {
    const map = new Map<string, CalendarDay>();
    calendarData.forEach(day => {
      map.set(`${day.propertyId}-${day.date}`, day);
    });
    return map;
  }, [calendarData]);

  const handleCellClick = (e: React.MouseEvent, propertyId: string, date: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({
      x: rect.left + rect.width / 2,
      y: rect.bottom + 8,
    });
    setSelectedDay({ propertyId, date });
  };

  const handleStatusChange = async (status: BookingStatus) => {
    if (!selectedDay) return;
    
    const startTime = performance.now();
    try {
      const updated = await calendarApi.update({
        propertyId: selectedDay.propertyId,
        date: selectedDay.date,
        status,
      });
      
      setCalendarData(prev => {
        const filtered = prev.filter(
          d => !(d.propertyId === selectedDay.propertyId && d.date === selectedDay.date)
        );
        return [...filtered, updated];
      });
      
      const renderTime = performance.now() - startTime;
      console.log(`Calendar update rendered in ${renderTime.toFixed(0)}ms`);
    } catch (error) {
      console.error('Failed to update calendar:', error);
    } finally {
      setMenuPosition(null);
      setSelectedDay(null);
    }
  };

  const navigateMonth = (direction: number) => {
    const startTime = performance.now();
    setCurrentMonth(prev => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + direction);
      return next;
    });
    requestAnimationFrame(() => {
      const renderTime = performance.now() - startTime;
      console.log(`Month switch rendered in ${renderTime.toFixed(0)}ms`);
    });
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="page-transition">
      <div className="page-header">
        <h1 className="page-title">日历看板</h1>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div className="view-toggle">
            <button
              className={viewMode === 'month' ? 'active' : ''}
              onClick={() => setViewMode('month')}
            >
              月视图
            </button>
            <button
              className={viewMode === 'week' ? 'active' : ''}
              onClick={() => setViewMode('week')}
            >
              周视图
            </button>
          </div>
          <div className="month-nav">
            <button onClick={() => navigateMonth(-1)}>‹</button>
            <span className="current-month">
              {currentMonth.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
            </span>
            <button onClick={() => navigateMonth(1)}>›</button>
          </div>
        </div>
      </div>

      <div className="status-legend">
        {(Object.keys(statusLabels) as BookingStatus[]).map(status => (
          <div key={status} className="status-legend-item">
            <span className={`status-dot ${status}`}></span>
            {statusLabels[status]}
          </div>
        ))}
      </div>

      <div className="card">
        <div className="calendar-container">
          <div
            className="calendar-grid"
            style={{
              gridTemplateColumns: `180px repeat(${dayHeaders.length}, 1fr)`,
            }}
          >
            <div className="calendar-header">
              <div className="calendar-header-cell">房源</div>
              {dayHeaders.map(h => (
                <div
                  key={h.date}
                  className={`calendar-header-cell ${h.isWeekend ? 'weekend' : ''}`}
                >
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{h.weekday}</div>
                  <div style={{ fontSize: h.isToday ? 16 : 14, fontWeight: h.isToday ? 700 : 500 }}>
                    {h.day}
                  </div>
                </div>
              ))}
            </div>

            {properties.map(property => (
              <div key={property.id} className="calendar-row">
                <div className="calendar-property-name">{property.name}</div>
                {dayHeaders.map(h => {
                  const day = calendarMap.get(`${property.id}-${h.date}`);
                  const status = day?.status || 'available';
                  return (
                    <div
                      key={h.date}
                      className={`calendar-day-cell status-${status} ${h.isToday ? 'today' : ''} ${h.isWeekend ? 'weekend' : ''}`}
                      onClick={(e) => handleCellClick(e, property.id, h.date)}
                      title={day?.guestName ? `${statusLabels[status]} - ${day.guestName}` : statusLabels[status]}
                    >
                      {day?.guestName && status !== 'available' && status !== 'maintenance' ? (
                        <span style={{ fontSize: 9 }}>{day.guestName.slice(0, 1)}</span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {menuPosition && selectedDay && (
        <div
          ref={menuRef}
          className="status-menu"
          style={{
            left: Math.min(menuPosition.x - 70, window.innerWidth - 160),
            top: menuPosition.y,
          }}
        >
          {(Object.keys(statusLabels) as BookingStatus[]).map(status => (
            <button
              key={status}
              className="status-menu-item"
              onClick={() => handleStatusChange(status)}
            >
              <span className={`status-dot ${status}`}></span>
              {statusLabels[status]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function getDateString(d: Date): string {
  return d.toISOString().split('T')[0];
}

function addMonths(d: Date, months: number): Date {
  const result = new Date(d);
  result.setMonth(result.getMonth() + months);
  return result;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth() === b.getMonth() &&
         a.getDate() === b.getDate();
}
