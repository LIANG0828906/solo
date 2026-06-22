import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { DailyEmotionSummary, EmotionType } from '../shared/types';
import { getDailySummaries, filterRecordsByEmotion } from './VisualizationModule';
import { emotionConfigs } from '../tracker/TrackerModule';
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
      setSlideDirection(null);
    }, 200);
  }, []);

  const handleNextMonth = useCallback(() => {
    setSlideDirection('left');
    setTimeout(() => {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
      setSelectedDate(null);
      setSlideDirection(null);
    }, 200);
  }, []);

  const handleDateClick = useCallback((date: string) => {
    setSelectedDate(prev => prev === date ? null : date);
  }, []);

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

  const selectedSummary = useMemo(() => {
    if (!selectedDate) return null;
    return summaries.find(s => s.date === selectedDate) || null;
  }, [selectedDate, summaries]);

  const filteredRecords = useMemo(() => {
    if (!selectedSummary) return [];
    return filterRecordsByEmotion(selectedSummary.records, selectedEmotionFilter);
  }, [selectedSummary, selectedEmotionFilter]);

  const getIntensityColor = (intensity: number): string => {
    if (intensity === 0) return 'rgba(255, 255, 255, 0.3)';
    const alpha = 0.2 + (intensity / 10) * 0.7;
    return `rgba(139, 156, 246, ${alpha})`;
  };

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
          <button className="nav-button" onClick={handlePrevMonth}>
            ‹
          </button>
          <h3 className="month-title">{formatMonthYear(currentDate)}</h3>
          <button className="nav-button" onClick={handleNextMonth}>
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
                className={`day-cell ${day ? 'has-day' : ''} ${selectedDate === summary?.date ? 'selected' : ''}`}
                onClick={() => day && summary && handleDateClick(summary.date)}
              >
                {day && (
                  <>
                    <span className="day-number">{day}</span>
                    {summary && summary.records.length > 0 && (
                      <div 
                        className="intensity-indicator"
                        style={{ backgroundColor: getIntensityColor(summary.avgIntensity) }}
                      />
                    )}
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
          <span className="legend-text">低</span>
          <span className="legend-text">高</span>
        </div>
      </div>

      {selectedSummary && (
        <div className="modal-overlay" onClick={() => setSelectedDate(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedDate}</h3>
              <button className="close-button" onClick={() => setSelectedDate(null)}>×</button>
            </div>

            <div className="filter-section">
              <span className="filter-label">筛选：</span>
              <button
                className={`filter-button ${selectedEmotionFilter === null ? 'active' : ''}`}
                onClick={() => handleFilterChange(null)}
              >
                全部
              </button>
              {emotions.map(([type, config]) => (
                <button
                  key={type}
                  className={`filter-button ${selectedEmotionFilter === type ? 'active' : ''}`}
                  onClick={() => handleFilterChange(type)}
                  style={{ '--filter-color': config.color } as React.CSSProperties}
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
