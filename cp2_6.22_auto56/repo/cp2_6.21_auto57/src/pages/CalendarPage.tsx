import React, { useState, useEffect, useCallback } from 'react';
import CalendarHeatmap from '../components/CalendarHeatmap';
import { emotionAPI, DaySummary, EmotionRecord } from '../api/emotionAPI';

const CalendarPage: React.FC = () => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [monthData, setMonthData] = useState<DaySummary[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayRecords, setDayRecords] = useState<EmotionRecord[]>([]);
  const [slideDir, setSlideDir] = useState<'left' | 'right' | null>(null);

  const monthStr = `${year}-${String(month).padStart(2, '0')}`;

  const fetchCalendar = useCallback(async () => {
    try {
      const res = await emotionAPI.getCalendar(monthStr);
      setMonthData(res.data);
    } catch {
      setMonthData([]);
    }
  }, [monthStr]);

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  const handlePrev = () => {
    setSlideDir('right');
    setTimeout(() => {
      if (month === 1) {
        setYear(y => y - 1);
        setMonth(12);
      } else {
        setMonth(m => m - 1);
      }
      setSlideDir(null);
    }, 300);
  };

  const handleNext = () => {
    setSlideDir('left');
    setTimeout(() => {
      if (month === 12) {
        setYear(y => y + 1);
        setMonth(1);
      } else {
        setMonth(m => m + 1);
      }
      setSlideDir(null);
    }, 300);
  };

  const handleDayClick = async (date: string) => {
    setSelectedDate(prev => (prev === date ? null : date));
    if (date !== selectedDate) {
      try {
        const res = await emotionAPI.getRecords(date);
        setDayRecords(res.data);
      } catch {
        setDayRecords([]);
      }
    }
  };

  const CATEGORY_ICONS: Record<string, string> = {
    '快乐': 'far fa-smile',
    '平静': 'far fa-meh',
    '悲伤': 'far fa-sad-tear',
    '愤怒': 'far fa-angry',
    '焦虑': 'far fa-frown-open',
    '疲惫': 'far fa-tired',
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const monthNames = [
    '', '一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月',
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <i className="far fa-calendar-alt" />
          日历视图
        </div>
      </div>

      <div className="card">
        <div className="calendar-header">
          <button className="calendar-nav-btn" onClick={handlePrev}>
            <i className="fas fa-chevron-left" />
          </button>
          <div className="calendar-month-label">
            {year}年 {monthNames[month]}
          </div>
          <button className="calendar-nav-btn" onClick={handleNext}>
            <i className="fas fa-chevron-right" />
          </button>
        </div>

        <CalendarHeatmap
          monthData={monthData}
          year={year}
          month={month}
          onDayClick={handleDayClick}
          selectedDate={selectedDate}
          slideDir={slideDir}
        />

        {selectedDate && (
          <div className="day-detail-panel">
            <div className="day-detail-title">
              <i className="far fa-list-alt" style={{ marginRight: 6 }} />
              {selectedDate} 的记录
            </div>
            {dayRecords.length === 0 ? (
              <div style={{ color: '#bbb', textAlign: 'center', padding: '12px 0' }}>
                当天暂无记录
              </div>
            ) : (
              <ul className="record-list">
                {dayRecords.map(r => (
                  <li key={r.id} className="record-item">
                    <div className="record-emoji">
                      <i className={CATEGORY_ICONS[r.category] || 'far fa-question-circle'} />
                    </div>
                    <div className="record-info">
                      <div className="record-detail">
                        {r.category} · 强度 {r.intensity} · 精力 {r.energy}
                      </div>
                      <div className="record-time">{formatTime(r.timestamp)}</div>
                      {r.tags && r.tags.trim() && (
                        <div className="record-tags">
                          {r.tags.split(',').map((tag, i) => (
                            <span key={i} className="record-tag-badge">{tag.trim()}</span>
                          ))}
                        </div>
                      )}
                      {r.note && <div className="record-note">{r.note}</div>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarPage;
