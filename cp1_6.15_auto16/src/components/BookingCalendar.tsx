import { useState, useEffect, useMemo, useRef } from 'react';
import type { Artist, Slot } from '../types';
import { getSlots, createBooking } from '../utils/api';
import './BookingCalendar.css';

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
  const [conflictError, setConflictError] = useState<{ message: string; suggestion?: string } | null>(null);
  const [conflictSlotKey, setConflictSlotKey] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
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

  const getWeekStartDate = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    return d;
  };

  const weekDaysList = useMemo(() => {
    if (!selectedDate) {
      const today = new Date();
      const weekStart = getWeekStartDate(today);
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        return d;
      });
    }
    const selected = new Date(selectedDate);
    const weekStart = getWeekStartDate(selected);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [selectedDate, currentDate]);

  const formatDateKey = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const monthDateRange = useMemo(() => {
    const start = formatDateKey(new Date(year, month, 1));
    const end = formatDateKey(new Date(year, month + 1, 0));
    return { start, end };
  }, [year, month]);

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
  }, [artist.id, monthDateRange.start, monthDateRange.end]);

  useEffect(() => {
    if (!selectedDate) return;
    
    const daySlots = monthSlots.filter((s) => s.date === selectedDate);
    setSlots(daySlots);
  }, [selectedDate, monthSlots]);

  const hasAvailableSlots = (date: Date) => {
    const key = formatDateKey(date);
    return monthSlots.some((s) => s.date === key && !s.booked);
  };

  const hasBookedSlots = (date: Date) => {
    const key = formatDateKey(date);
    return monthSlots.some((s) => s.date === key && s.booked);
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

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

  const goToPrevWeek = () => {
    const baseDate = selectedDate ? new Date(selectedDate) : new Date();
    const newDate = new Date(baseDate);
    newDate.setDate(newDate.getDate() - 7);
    setSelectedDate(null);
    setSlots([]);
    if (newDate.getMonth() !== month) {
      setCurrentDate(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
    }
  };

  const goToNextWeek = () => {
    const baseDate = selectedDate ? new Date(selectedDate) : new Date();
    const newDate = new Date(baseDate);
    newDate.setDate(newDate.getDate() + 7);
    setSelectedDate(null);
    setSlots([]);
    if (newDate.getMonth() !== month) {
      setCurrentDate(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;
    
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
      const error = err as Error & { suggestion?: string };
      if (error.message.includes('已被预约') || selectedSlot) {
        setConflictSlotKey(`${selectedSlot?.date}-${selectedSlot?.startHour}`);
        setConflictError({
          message: '该时段已被预约，建议选择相邻时段',
          suggestion: error.suggestion,
        });
        setMonthSlots((prev) =>
          prev.map((s) =>
            s.date === selectedSlot?.date && s.startHour === selectedSlot?.startHour
              ? { ...s, booked: true }
              : s
          )
        );
        setSlots((prev) =>
          prev.map((s) =>
            s.date === selectedSlot?.date && s.startHour === selectedSlot?.startHour
              ? { ...s, booked: true }
              : s
          )
        );
        setTimeout(() => setConflictSlotKey(null), 3000);
        onToast('error', '预约冲突：该时段已被预约');
      } else {
        onToast('error', error.message || '预约失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getWeekTitle = () => {
    const weekStart = weekDaysList[0];
    const weekEnd = weekDaysList[6];
    if (weekStart.getMonth() === weekEnd.getMonth()) {
      return `${weekStart.getFullYear()}年${monthNames[weekStart.getMonth()]} 第${Math.ceil(weekEnd.getDate() / 7)}周`;
    }
    return `${weekStart.getFullYear()}年${monthNames[weekStart.getMonth()]} - ${monthNames[weekEnd.getMonth()]}`;
  };

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
        <div className="conflict-error">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>
            <strong>{conflictError.message}</strong>
            {conflictError.suggestion && (
              <p>{conflictError.suggestion}</p>
            )}
          </div>
        </div>
      )}

      {isMobile ? (
        <div
          className="calendar-wrapper week-view"
          ref={weekViewRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="calendar-nav">
            <button className="nav-btn" onClick={goToPrevWeek}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <h3>{getWeekTitle()}</h3>
            <button className="nav-btn" onClick={goToNextWeek}>
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

          <div className="week-calendar-grid">
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
                  className={`day-cell week-day ${past ? 'past' : ''} ${isSelected ? 'selected' : ''} ${allBooked ? 'all-booked' : ''} ${isToday ? 'today' : ''}`}
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
              <span className="dot available" /> 可预约
            </div>
            <div className="legend-item">
              <span className="dot booked" /> 已预约
            </div>
            <div className="legend-item swipe-hint">
              ← 左右滑动切换周 →
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
                const isConflict = conflictSlotKey === slotKey;
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
