import { useState, useEffect } from 'react';
import { useEventStore } from './eventStore';
import './CreateEventModal.css';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CreateEventModal({ open, onClose }: Props) {
  const { createEvent } = useEventStore();
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('100');
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    if (!open) {
      setName('');
      setDate('');
      setLocation('');
      setMaxParticipants('100');
      setShowCalendar(false);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !date || !location.trim()) return;

    await createEvent({
      name: name.trim(),
      date,
      location: location.trim(),
      maxParticipants: parseInt(maxParticipants, 10) || 100,
    });
    onClose();
  };

  const generateCalendarDays = () => {
    const today = date ? new Date(date) : new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    return { year, month, days };
  };

  const { year, month, days } = generateCalendarDays();
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

  const handleDayClick = (day: number) => {
    const d = new Date(year, month, day);
    const formatted = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setDate(formatted);
    setShowCalendar(false);
  };

  const changeMonth = (delta: number) => {
    const d = date ? new Date(date) : new Date();
    d.setMonth(d.getMonth() + delta);
    const formatted = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    setDate(formatted);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>创建活动</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>活动名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入活动名称"
              className="form-input"
              required
            />
          </div>

          <div className="form-group calendar-wrapper">
            <label>活动日期</label>
            <div
              className="form-input calendar-input"
              onClick={() => setShowCalendar(!showCalendar)}
            >
              {date || '选择日期'}
              <span className="calendar-icon">📅</span>
            </div>
            {showCalendar && (
              <div className="calendar-dropdown">
                <div className="calendar-nav">
                  <button type="button" onClick={() => changeMonth(-1)}>‹</button>
                  <span>{year}年 {monthNames[month]}</span>
                  <button type="button" onClick={() => changeMonth(1)}>›</button>
                </div>
                <div className="calendar-weekdays">
                  {['日', '一', '二', '三', '四', '五', '六'].map((d) => (
                    <span key={d}>{d}</span>
                  ))}
                </div>
                <div className="calendar-days">
                  {days.map((day, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`calendar-day ${day ? '' : 'empty'} ${date && day && new Date(date).toDateString() === new Date(year, month, day).toDateString() ? 'selected' : ''}`}
                      onClick={() => day && handleDayClick(day)}
                      disabled={!day}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>活动地点</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="输入活动地点"
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label>最大参与人数</label>
            <input
              type="number"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(e.target.value)}
              min="1"
              className="form-input"
            />
          </div>

          <button type="submit" className="modal-submit">
            创建活动
          </button>
        </form>
      </div>
    </div>
  );
}
