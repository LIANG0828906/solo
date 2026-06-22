import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { Artist, Slot } from '../types';
import { getSlots, createBooking } from '../utils/api';
import './BookingCalendar.css';

type ConflictType = 'time_overlap' | 'resource_unavailable';

interface ConflictInfo {
  type: ConflictType;
  message: string;
  suggestion?: string;
  slotKey: string;
}

interface BookingCalendarProps {
  artist: Artist;
  onBack: () => void;
  onBookSuccess: () => void;
  onToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export default function BookingCalendar({ artist, onBack, onBookSuccess, onToast }: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [monthSlots, setMonthSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [conflictError, setConflictError] = useState<ConflictInfo | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchCurrentX = useRef<number>(0);
  const weekViewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

  const getWeekStartDate = useCallback((baseDate: Date, offset = 0) => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + offset * 7);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    return d;
  }, []);

  const weekDaysList = useMemo(() => {
    const baseDate = selectedDate ? new Date(selectedDate) : new Date();
    const weekStart = getWeekStartDate(baseDate, weekOffset);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [selectedDate, weekOffset, getWeekStartDate]);

  const formatDateKey = useCallback((date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const monthDateRange = useMemo(() => {
    const start = formatDateKey(new Date(year, month, 1));
    const end = formatDateKey(new Date(year, month + 1, 0));
    return { start, end };
  }, [year, month, formatDateKey]);

  const daysInMonth = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];
    
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  }, [year, month]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setConflictError(null);

    getSlots(artist.id)
      .then((allSlots) => {
        if (cancelled) return;
        const filtered = allSlots.filter((s) => {
          return s.date >= monthDateRange.start && s.date <= monthDateRange.end;
        });
        setMonthSlots(filtered);
      })
      .catch(() => {
        if (!cancelled) onToast('error', '加载时段失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [artist.id, monthDateRange.start, monthDateRange.end, onToast]);

  useEffect(() => {
    if (!selectedDate) return;
    
    const daySlots = monthSlots.filter((s) => s.date === selectedDate);
    setSlots(daySlots);
  }, [selectedDate, monthSlots]);

  const hasAvailableSlots = useCallback((date: Date) => {
    const key = formatDateKey(date);
    return monthSlots.some((s) => s.date === key && !s.booked);
  }, [monthSlots, formatDateKey]);

  const hasBookedSlots = useCallback((date: Date) => {
    const key = formatDateKey(date);
    return monthSlots.some((s) => s.date === key && s.booked);
  }, [monthSlots, formatDateKey]);

  const isPastDate = useCallback((date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }, []);

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
    setSlots([]);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
    setSlots([]);
  };

  const goToPrevWeek = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setSlideDirection('right');
    
    setTimeout(() => {
      setWeekOffset(prev => prev - 1);
      setSelectedDate(null);
      setSlots([]);
      
      const firstDay = weekDaysList[0];
      const newFirstDay = new Date(firstDay);
      newFirstDay.setDate(newFirstDay.getDate() - 7);
      
      if (newFirstDay.getMonth() !== month) {
        setCurrentDate(new Date(newFirstDay.getFullYear(), newFirstDay.getMonth(), 1));
      }
      
      setSlideDirection(null);
      setTimeout(() => setIsAnimating(false), 50);
    }, 280);
  }, [isAnimating, weekDaysList, month]);

  const goToNextWeek = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setSlideDirection('left');
    
    setTimeout(() => {
      setWeekOffset(prev => prev + 1);
      setSelectedDate(null);
      setSlots([]);
      
      const lastDay = weekDaysList[6];
      const newLastDay = new Date(lastDay);
      newLastDay.setDate(newLastDay.getDate() + 7);
      
      if (newLastDay.getMonth() !== month) {
        setCurrentDate(new Date(newLastDay.getFullYear(), newLastDay.getMonth(), 1));
      }
      
      setSlideDirection(null);
      setTimeout(() => setIsAnimating(false), 50);
    }, 280);
  }, [isAnimating, weekDaysList, month]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchCurrentX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      e.preventDefault();
    }
    touchCurrentX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchCurrentX.current;
    const threshold = 60;
    
    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        goToNextWeek();
      } else {
        goToPrevWeek();
      }
    }
  };

  const handleDateClick = (date: Date) => {
    if (isPastDate(date)) return;
    setSelectedDate(formatDateKey(date));
    setConflictError(null);
  };

  const handleSlotClick = (slot: Slot) => {
    if (slot.booked) return;
    setSelectedSlot(slot);
    setShowModal(true);
    setConflictError(null);
  };

  const analyzeConflict = useCallback((slot: Slot, error: Error & { suggestion?: string; status?: number }): ConflictInfo => {
    const slotKey = `${slot.date}-${slot.startHour}`;
    
    if (error.message.includes('已被预约') || error.status === 409) {
      return {
        type: 'time_overlap',
        message: '该时段已被预约，建议选择相邻时段',
        suggestion: error.suggestion,
        slotKey,
      };
    }
    
    if (error.message.includes('不存在') || error.status === 404) {
      return {
        type: 'resource_unavailable',
        message: '该时段已取消或不可用，请选择其他时段',
        suggestion: '请刷新页面查看最新可用时段',
        slotKey,
      };
    }
    
    return {
      type: 'resource_unavailable',
      message: '预约失败，该时段暂时无法预约',
      suggestion: error.suggestion || '请稍后重试或选择其他时段',
      slotKey,
    };
  }, []);

  const handleConfirmBooking = async () => {
    if (!selectedSlot || !userName.trim()) return;

    setSubmitting(true);
    setConflictError(null);

    try {
      await createBooking({
        artistId: selectedSlot.artistId,
        date: selectedSlot.date,
        startHour: selectedSlot.startHour,
        userName: userName.trim(),
        userPhone: userPhone.trim(),
      });

      setMonthSlots((prev) =>
        prev.map((s) =>
          s.id === selectedSlot.id ? { ...s, booked: true } : s
        )
      );
      setSlots((prev) =>
        prev.map((s) =>
          s.id === selectedSlot.id ? { ...s, booked: true } : s
        )
      );

      setShowModal(false);
      setSelectedSlot(null);
      setUserName('');
      setUserPhone('');
      onToast('success', '预约成功！期待与您见面');
      onBookSuccess();
    } catch (err) {
      const error = err as Error & { suggestion?: string; status?: number };
      const conflict = analyzeConflict(selectedSlot, error);
      
      setConflictError(conflict);
      
      setMonthSlots((prev) =>
        prev.map((s) =>
          s.date === selectedSlot.date && s.startHour === selectedSlot.startHour
            ? { ...s, booked: true }
            : s
        )
      );
      setSlots((prev) =>
        prev.map((s) =>
          s.date === selectedSlot.date && s.startHour === selectedSlot.startHour
            ? { ...s, booked: true }
            : s
        )
      );
      
      onToast('error', conflict.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getWeekTitle = useCallback(() => {
    const weekStart = weekDaysList[0];
    const weekEnd = weekDaysList[6];
    if (weekStart.getMonth() === weekEnd.getMonth()) {
      return `${weekStart.getFullYear()}年${monthNames[weekStart.getMonth()]} 第${Math.ceil(weekEnd.getDate() / 7)}周`;
    }
    return `${weekStart.getFullYear()}年${monthNames[weekStart.getMonth()]} - ${monthNames[weekEnd.getMonth()]}`;
  }, [weekDaysList, monthNames]);

  const getConflictSlotKey = () => conflictError?.slotKey || null;

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <button className="back-btn" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          返回艺术家列表
        </button>
        <div className="current-artist">
          <div
            className="mini-avatar"
            style={{ backgroundColor: artist.avatarColor }}
          >
            {artist.avatar}
          </div>
          <div>
            <h2>{artist.name}</h2>
            <span>{artist.specialty}</span>
          </div>
        </div>
      </div>

      {conflictError && (
        <div className={`conflict-error conflict-${conflictError.type}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {conflictError.type === 'time_overlap' ? (
              <>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </>
            ) : (
              <>
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </>
            )}
          </svg>
          <div className="conflict-content">
            <strong className="conflict-title">{conflictError.message}</strong>
            {conflictError.suggestion && (
              <p className="conflict-suggestion">
                <span className="conflict-label">建议：</span>
                {conflictError.suggestion}
              </p>
            )}
          </div>
        </div>
      )}

      {isMobile ? (
        <div
          className={`calendar-wrapper week-view ${slideDirection ? `slide-${slideDirection}` : ''}`}
          ref={weekViewRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="calendar-nav">
            <button className="nav-btn" onClick={goToPrevWeek} disabled={isAnimating}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <h3>{getWeekTitle()}</h3>
            <button className="nav-btn" onClick={goToNextWeek} disabled={isAnimating}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          <div className="weekday-row week-compact">
            {weekDays.map((d) => (
              <div key={d} className="weekday-cell compact">{d}</div>
            ))}
          </div>

          <div className="week-calendar-grid">
            <div className="week-dates-track">
              {weekDaysList.map((date) => {
                const dateKey = formatDateKey(date);
                const past = isPastDate(date);
                const hasAvailable = hasAvailableSlots(date);
                const hasBooked = hasBookedSlots(date);
                const isSelected = selectedDate === dateKey;
                const allBooked = hasBooked && !hasAvailable;
                const isToday = formatDateKey(new Date()) === dateKey;

                return (
                  <button
                    key={dateKey}
                    className={`week-day-cell ${past ? 'past' : ''} ${isSelected ? 'selected' : ''} ${allBooked ? 'all-booked' : ''} ${isToday ? 'today' : ''}`}
                    onClick={() => handleDateClick(date)}
                    disabled={past}
                  >
                    <span className="week-day-label">{weekDays[date.getDay()]}</span>
                    <span className="week-day-number">{date.getDate()}</span>
                    <div className="week-day-dots">
                      {hasAvailable && <span className="dot available" />}
                      {hasBooked && <span className="dot booked" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="calendar-legend week-legend">
            <div className="legend-item">
              <span className="dot available" /> 可约
            </div>
            <div className="legend-item">
              <span className="dot booked" /> 已约
            </div>
            <div className="legend-item swipe-hint">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              滑动切换
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </div>
        </div>
      ) : (
        <div className="calendar-wrapper">
          <div className="calendar-nav">
            <button className="nav-btn" onClick={goToPrevMonth}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <h3>{year}年 {monthNames[month]}</h3>
            <button className="nav-btn" onClick={goToNextMonth}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          <div className="weekday-row">
            {weekDays.map((d) => (
              <div key={d} className="weekday-cell">{d}</div>
            ))}
          </div>

          <div className="calendar-grid">
            {daysInMonth.map((date, idx) => {
              if (!date) return <div key={`empty-${idx}`} className="day-cell empty" />;

              const dateKey = formatDateKey(date);
              const past = isPastDate(date);
              const hasAvailable = hasAvailableSlots(date);
              const hasBooked = hasBookedSlots(date);
              const isSelected = selectedDate === dateKey;
              const allBooked = hasBooked && !hasAvailable;

              return (
                <button
                  key={dateKey}
                  className={`day-cell ${past ? 'past' : ''} ${isSelected ? 'selected' : ''} ${allBooked ? 'all-booked' : ''}`}
                  onClick={() => handleDateClick(date)}
                  disabled={past}
                >
                  <span className="day-number">{date.getDate()}</span>
                  <div className="day-dots">
                    {hasAvailable && <span className="dot available" />}
                    {hasBooked && <span className="dot booked" />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="calendar-legend">
            <div className="legend-item">
              <span className="dot available" /> 有可预约
            </div>
            <div className="legend-item">
              <span className="dot booked" /> 已预约
            </div>
            <div className="legend-item all-booked-indicator">
              已约满
            </div>
          </div>
        </div>
      )}

      {selectedDate && (
        <div className="slots-section">
          <h4>{selectedDate} 可用时段</h4>
          {loading ? (
            <div className="slots-loading">加载中...</div>
          ) : slots.length === 0 ? (
            <div className="slots-empty">该日期暂无可预约时段</div>
          ) : (
            <div className="slots-grid">
              {slots.map((slot) => {
                const slotKey = `${slot.date}-${slot.startHour}`;
                const isConflict = getConflictSlotKey() === slotKey;
                return (
                  <button
                    key={slot.id}
                    className={`slot-btn ${slot.booked ? 'booked' : ''} ${isConflict ? 'conflict-flash' : ''}`}
                    onClick={() => handleSlotClick(slot)}
                    disabled={slot.booked}
                  >
                    <span className="slot-time">
                      {String(slot.startHour).padStart(2, '0')}:00
                      <span className="slot-duration"> - {String(slot.startHour + 1).padStart(2, '0')}:00</span>
                    </span>
                    <span className="slot-status">
                      {slot.booked ? '已预约' : '可预约'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {showModal && selectedSlot && (
        <div className="modal-overlay" onClick={() => !submitting && setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>确认预约</h3>
            <div className="modal-info">
              <div className="info-row">
                <span className="info-label">艺术家</span>
                <span className="info-value">{artist.name}</span>
              </div>
              <div className="info-row">
                <span className="info-label">日期</span>
                <span className="info-value">{selectedSlot.date}</span>
              </div>
              <div className="info-row">
                <span className="info-label">时段</span>
                <span className="info-value">
                  {String(selectedSlot.startHour).padStart(2, '0')}:00 - {String(selectedSlot.startHour + 1).padStart(2, '0')}:00
                </span>
              </div>
            </div>
            <div className="form-group">
              <label>您的姓名 *</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="请输入您的姓名"
              />
            </div>
            <div className="form-group">
              <label>联系电话（可选）</label>
              <input
                type="tel"
                value={userPhone}
                onChange={(e) => setUserPhone(e.target.value)}
                placeholder="便于我们与您联系"
              />
            </div>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setShowModal(false)}
                disabled={submitting}
              >
                取消
              </button>
              <button
                className="btn-primary"
                onClick={handleConfirmBooking}
                disabled={!userName.trim() || submitting}
              >
                {submitting ? '提交中...' : '确认预约'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
