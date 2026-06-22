import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { DailyEmotionSummary, EmotionType } from '../shared/types';
import { getDailySummaries, filterRecordsByEmotion } from './VisualizationModule';
import { emotionConfigs } from '../tracker/TrackerModule';
import { storageService } from '../shared/storageService';
import './CalendarHeatmap.css';

interface CalendarHeatmapProps {
  refreshTrigger: number;
}

const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({ refreshTrigger }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [summaries, setSummaries] = useState<DailyEmotionSummary[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedEmotionFilter, setSelectedEmotionFilter] = useState<EmotionType | null>(null);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dayRecords, setDayRecords] = useState<DailyEmotionSummary | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await getDailySummaries(year, month);
        setSummaries(data);
      } catch (err) {
        console.error('加载日历数据失败:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [year, month, refreshTrigger]);

  const handlePrevMonth = useCallback(() => {
    setSlideDirection('right');
    setTimeout(() => {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
      setSelectedDate(null);
      setDayRecords(null);
      setSlideDirection(null);
    }, 200);
  }, []);

  const handleNextMonth = useCallback(() => {
    setSlideDirection('left');
    setTimeout(() => {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
      setSelectedDate(null);
      setDayRecords(null);
      setSlideDirection(null);
    }, 200);
  }, []);

  const handleDateClick = useCallback(async (date: string) => {
    if (selectedDate === date) {
      setSelectedDate(null);
      setDayRecords(null);
      return;
    }
    setSelectedDate(date);
    try {
      const records = await storageService.getRecordsByDateRange(date, date);
      const emotionCounts: Record<EmotionType, number> = {
        happy: 0, sad: 0, angry: 0, calm: 0, anxious: 0, surprised: 0
      };
      records.forEach(r => { emotionCounts[r.emotion]++; });
      const dominant = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0][0] as EmotionType;
      const avgIntensity = records.length > 0
        ? records.reduce((sum, r) => sum + emotionConfigs[r.emotion].intensity, 0) / records.length
        : 0;
      setDayRecords({
        date,
        avgIntensity,
        records,
        dominantEmotion: dominant
      });
    } catch (err) {
      console.error('加载日期记录失败:', err);
      setDayRecords(null);
    }
  }, [selectedDate]);

  const handleFilterChange = useCallback((emotion: EmotionType | null) => {
    setSelectedEmotionFilter(emotion);
  }, []);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days: Array<{ day: number | null; summary?: DailyEmotionSummary }> = [];
    
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: null });
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const summary = summaries.find(s => {
        const summaryDay = parseInt(s.date.split('-')[2]);
        return summaryDay === day;
      });
      days.push({ day, summary });
    }
    
    return days;
  }, [year, month, summaries]);

  const filteredRecords = useMemo(() => {
    if (!dayRecords) return [];
    return filterRecordsByEmotion(dayRecords.records, selectedEmotionFilter);
  }, [dayRecords, selectedEmotionFilter]);

  const getIntensityColor = useCallback((summary: DailyEmotionSummary | undefined): string => {
    if (!summary || summary.records.length === 0) return 'rgba(255, 255, 255, 0.3)';
    
    const intensity = Math.max(0, Math.min(10, summary.avgIntensity));
    const ratio = intensity / 10;
    
    const startColor = { r: 232, g: 245, b: 233 };
    const endColor = { r: 27, g: 94, b: 32 };
    
    const r = Math.round(startColor.r + (endColor.r - startColor.r) * ratio);
    const g = Math.round(startColor.g + (endColor.g - startColor.g) * ratio);
    const b = Math.round(startColor.b + (endColor.b - startColor.b) * ratio);
    
    return `rgb(${r}, ${g}, ${b})`;
  }, []);

  const formatMonthYear = (date: Date): string => {
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
  };

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const emotions = Object.entries(emotionConfigs) as [EmotionType, typeof emotionConfigs[EmotionType]][];

  return (
    <div className="calendar-heatmap">
      <h2 className="section-title">
        <span className="title-icon">📅</span>
        情绪日历
      </h2>

      <div className="glass-card">
        <div className="calendar-header">
          <button className="nav-button" onClick={handlePrevMonth} type="button">
            ‹
          </button>
          <h3 className="month-title">{formatMonthYear(currentDate)}</h3>
          <button className="nav-button" onClick={handleNextMonth} type="button">
            ›
          </button>
        </div>

        <div className={`calendar-grid ${slideDirection ? `slide-${slideDirection}` : ''}`}>
          <div className="weekday-row">
            {weekDays.map(day => (
              <div key={day} className="weekday-label">{day}</div>
            ))}
          </div>
          
          <div className="days-grid">
            {calendarDays.map(({ day, summary }, index) => (
              <div
                key={index}
                className={`day-cell ${day ? 'has-day' : ''} ${selectedDate === summary?.date ? 'selected' : ''} ${summary && summary.records.length > 0 ? 'has-records' : ''}`}
                onClick={() => day && handleDateClick(summary?.date || `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`)}
              >
                {day && (
                  <>
                    <span className="day-number">{day}</span>
                    <div 
                      className="intensity-indicator"
                      style={{ backgroundColor: getIntensityColor(summary) }}
                    />
                    {summary && summary.records.length > 0 && (
                      <span className="emoji-preview">
                        {emotionConfigs[summary.dominantEmotion].emoji}
                      </span>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="legend">
          <span className="legend-label">情绪强度：</span>
          <div className="legend-gradient" />
          <span className="legend-text">低潮</span>
          <span className="legend-text">高潮</span>
        </div>
      </div>

      {selectedDate && dayRecords && (
        <div className="modal-overlay" onClick={() => { setSelectedDate(null); setDayRecords(null); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedDate} 情绪记录</h3>
              <button className="close-button" onClick={() => { setSelectedDate(null); setDayRecords(null); }} type="button">×</button>
            </div>

            <div className="modal-stats">
              <div className="stat-item">
                <span className="stat-emoji">{emotionConfigs[dayRecords.dominantEmotion].emoji}</span>
                <span className="stat-label">主要情绪：{emotionConfigs[dayRecords.dominantEmotion].label}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">平均强度：{dayRecords.avgIntensity.toFixed(1)}/10</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">记录数：{dayRecords.records.length}</span>
              </div>
            </div>

            <div className="filter-section">
              <span className="filter-label">筛选：</span>
              <button
                className={`filter-button ${selectedEmotionFilter === null ? 'active' : ''}`}
                onClick={() => handleFilterChange(null)}
                type="button"
              >
                全部
              </button>
              {emotions.map(([type, config]) => (
                <button
                  key={type}
                  className={`filter-button ${selectedEmotionFilter === type ? 'active' : ''}`}
                  onClick={() => handleFilterChange(type)}
                  style={{ '--filter-color': config.color } as React.CSSProperties}
                  type="button"
                >
                  {config.emoji}
                </button>
              ))}
            </div>

            <div className="records-list">
              {filteredRecords.length === 0 ? (
                <p className="empty-state">该日无符合条件的记录</p>
              ) : (
                filteredRecords.map(record => (
                  <div key={record.id} className="record-item">
                    <span className="record-emoji">{emotionConfigs[record.emotion].emoji}</span>
                    <div className="record-content">
                      <div className="record-meta">
                        <span className="record-time">
                          {new Date(record.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="record-emotion-label" style={{ color: emotionConfigs[record.emotion].color }}>
                          {emotionConfigs[record.emotion].label}
                        </span>
                        {record.tags.length > 0 && (
                          <div className="record-tags">
                            {record.tags.map(tag => (
                              <span key={tag} className="record-tag">{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      {record.note && <p className="record-note">{record.note}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {isLoading && <div className="loading-overlay"><div className="spinner" /></div>}
    </div>
  );
};

export default CalendarHeatmap;
