import { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react';
import type { Property, CalendarDay, BookingStatus } from '../types';
import { propertyApi, calendarApi } from '../api';

const statusLabels: Record<BookingStatus, string> = {
  booked: '已预订',
  pending: '待确认',
  available: '空闲',
  maintenance: '维护中',
};

interface CalendarCellProps {
  date: string;
  day: number;
  isToday: boolean;
  isWeekend: boolean;
  status: BookingStatus;
  guestName?: string;
  propertyId: string;
  onClick: (e: React.MouseEvent, propertyId: string, date: string) => void;
}

const CalendarCell = memo(function CalendarCell({
  date,
  day,
  isToday,
  isWeekend,
  status,
  guestName,
  propertyId,
  onClick,
}: CalendarCellProps) {
  const title = guestName && status !== 'available' && status !== 'maintenance'
    ? `${statusLabels[status]} - ${guestName}`
    : statusLabels[status];

  return (
    <div
      className={`calendar-day-cell status-${status} ${isToday ? 'today' : ''} ${isWeekend ? 'weekend' : ''}`}
      onClick={(e) => onClick(e, propertyId, date)}
      title={title}
    >
      <span className="cell-day">{day}</span>
      {guestName && status !== 'available' && status !== 'maintenance' ? (
        <span className="cell-guest">{guestName.slice(0, 1)}</span>
      ) : null}
    </div>
  );
});

interface CalendarRowProps {
  property: Property;
  dayHeaders: Array<{
    date: string;
    day: number;
    isToday: boolean;
    isWeekend: boolean;
  }>;
  calendarMap: Map<string, CalendarDay>;
  onCellClick: (e: React.MouseEvent, propertyId: string, date: string) => void;
}

const CalendarRow = memo(function CalendarRow({
  property,
  dayHeaders,
  calendarMap,
  onCellClick,
}: CalendarRowProps) {
  return (
    <div className="calendar-row">
      <div className="calendar-property-name" title={property.name}>
        {property.name}
      </div>
      {dayHeaders.map((h) => {
        const day = calendarMap.get(`${property.id}-${h.date}`);
        const status = day?.status || 'available';
        return (
          <CalendarCell
            key={h.date}
            date={h.date}
            day={h.day}
            isToday={h.isToday}
            isWeekend={h.isWeekend}
            status={status}
            guestName={day?.guestName}
            propertyId={property.id}
            onClick={onCellClick}
          />
        );
      })}
    </div>
  );
});

export default function CalendarView() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedDay, setSelectedDay] = useState<{ propertyId: string; date: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);
  const renderStartTime = useRef<number>(0);

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
        setProperties(props.filter((p) => p.isActive));
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

  useEffect(() => {
    if (!loading && renderStartTime.current > 0) {
      const renderTime = performance.now() - renderStartTime.current;
      console.log(`Calendar view rendered in ${renderTime.toFixed(0)}ms`);
      renderStartTime.current = 0;
    }
  }, [loading, currentMonth, viewMode, calendarData]);

  const dayHeaders = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(today);
    start.setMonth(currentMonth.getMonth());
    start.setFullYear(currentMonth.getFullYear());

    let daysToShow: number;
    if (viewMode === 'month') {
      const lastDay = new Date(start.getFullYear(), start.getMonth() + 1, 0);
      daysToShow = lastDay.getDate();
      start.setDate(1);
    } else {
      daysToShow = 7;
      start.setDate(today.getDate() - today.getDay());
    }

    const headers: Array<{
      date: string;
      day: number;
      weekday: string;
      isToday: boolean;
      isWeekend: boolean;
    }> = [];

    for (let i = 0; i < daysToShow; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      headers.push({
        date: getDateString(d),
        day: d.getDate(),
        weekday: d.toLocaleDateString('zh-CN', { weekday: 'short' }),
        isToday: isSameDay(d, today),
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
      });
    }

    return headers;
  }, [viewMode, currentMonth]);

  const calendarMap = useMemo(() => {
    const map = new Map<string, CalendarDay>();
    for (let i = 0; i < calendarData.length; i++) {
      const day = calendarData[i];
      map.set(`${day.propertyId}-${day.date}`, day);
    }
    return map;
  }, [calendarData]);

  const handleCellClick = useCallback((e: React.MouseEvent, propertyId: string, date: string) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 140;
    const menuX = Math.min(
      Math.max(rect.left + rect.width / 2 - menuWidth / 2, 10),
      window.innerWidth - menuWidth - 10
    );
    const menuY = Math.min(rect.bottom + 8, window.innerHeight - 160);

    setMenuPosition({ x: menuX, y: menuY });
    setSelectedDay({ propertyId, date });
  }, []);

  const handleStatusChange = useCallback(
    async (status: BookingStatus) => {
      if (!selectedDay) return;

      try {
        const updated = await calendarApi.update({
          propertyId: selectedDay.propertyId,
          date: selectedDay.date,
          status,
        });

        setCalendarData((prev) => {
          const filtered = prev.filter(
            (d) => !(d.propertyId === selectedDay.propertyId && d.date === selectedDay.date)
          );
          return [...filtered, updated];
        });
      } catch (error) {
        console.error('Failed to update calendar:', error);
      } finally {
        setMenuPosition(null);
        setSelectedDay(null);
      }
    },
    [selectedDay]
  );

  const navigateMonth = useCallback((direction: number) => {
    renderStartTime.current = performance.now();
    setCurrentMonth((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + direction);
      return next;
    });
  }, []);

  const handleViewModeChange = useCallback((mode: 'month' | 'week') => {
    renderStartTime.current = performance.now();
    setViewMode(mode);
  }, []);

  if (loading) {
    return (
      <div className="page-transition">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  return (
    <div className="page-transition">
      <div className="page-header">
        <h1 className="page-title">日历看板</h1>
        <div className="header-controls">
          <div className="view-toggle" role="tablist" aria-label="视图切换">
            <button
              className={viewMode === 'month' ? 'active' : ''}
              onClick={() => handleViewModeChange('month')}
              role="tab"
              aria-selected={viewMode === 'month'}
            >
              月视图
            </button>
            <button
              className={viewMode === 'week' ? 'active' : ''}
              onClick={() => handleViewModeChange('week')}
              role="tab"
              aria-selected={viewMode === 'week'}
            >
              周视图
            </button>
          </div>
          <div className="month-nav">
            <button onClick={() => navigateMonth(-1)} aria-label="上一月">
              ‹
            </button>
            <span className="current-month">
              {currentMonth.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
            </span>
            <button onClick={() => navigateMonth(1)} aria-label="下一月">
              ›
            </button>
          </div>
        </div>
      </div>

      <div className="status-legend">
        {(Object.keys(statusLabels) as BookingStatus[]).map((status) => (
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
              {dayHeaders.map((h) => (
                <div
                  key={h.date}
                  className={`calendar-header-cell ${h.isWeekend ? 'weekend' : ''}`}
                >
                  <div className="header-weekday">{h.weekday}</div>
                  <div className={`header-day ${h.isToday ? 'today' : ''}`}>{h.day}</div>
                </div>
              ))}
            </div>

            {properties.map((property) => (
              <CalendarRow
                key={property.id}
                property={property}
                dayHeaders={dayHeaders}
                calendarMap={calendarMap}
                onCellClick={handleCellClick}
              />
            ))}
          </div>
        </div>
      </div>

      {menuPosition && selectedDay && (
        <div
          ref={menuRef}
          className="status-menu"
          style={{
            left: menuPosition.x,
            top: menuPosition.y,
          }}
          role="menu"
          aria-label="切换状态"
        >
          {(Object.keys(statusLabels) as BookingStatus[]).map((status) => (
            <button
              key={status}
              className="status-menu-item"
              onClick={() => handleStatusChange(status)}
              role="menuitem"
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
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addMonths(d: Date, months: number): Date {
  const result = new Date(d);
  result.setMonth(result.getMonth() + months);
  return result;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
