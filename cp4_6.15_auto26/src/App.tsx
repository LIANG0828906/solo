import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { EmotionRecord, ViewMode, AnalysisMode } from '@/shared/types';
import { getAllRecords, saveRecord, getRecordByDate } from '@/shared/storage';
import { computeStats } from '@/analysis/statsEngine';
import { ColorWheel } from '@/color/ColorWheel';
import { ColorRecord } from '@/color/ColorRecord';
import { TrendChart } from '@/analysis/TrendChart';
import { SummaryCard } from '@/analysis/SummaryCard';

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getMonthDays(year: number, month: number): string[] {
  const days: string[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(formatDate(new Date(year, month, d)));
  }
  return days;
}

function getMonthGrid(year: number, month: number): (string | null)[][] {
  const firstDay = new Date(year, month, 1);
  const startDow = firstDay.getDay();
  const days = getMonthDays(year, month);
  const grid: (string | null)[][] = [];
  let week: (string | null)[] = [];

  for (let i = 0; i < startDow; i++) {
    week.push(null);
  }

  days.forEach(d => {
    week.push(d);
    if (week.length === 7) {
      grid.push(week);
      week = [];
    }
  });

  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    grid.push(week);
  }

  return grid;
}

const App: React.FC = () => {
  const [records, setRecords] = useState<EmotionRecord[]>(() => getAllRecords());
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('intensity');
  const [hoveredDay, setHoveredDay] = useState<{ date: string; x: number; y: number } | null>(null);
  const [calendarTransition, setCalendarTransition] = useState<'none' | 'left' | 'right'>('none');
  const [activeTab, setActiveTab] = useState<'calendar' | 'trend'>('calendar');

  useEffect(() => {
    setRecords(getAllRecords());
  }, []);

  const handleColorSelect = useCallback((record: EmotionRecord) => {
    saveRecord(record);
    setRecords(getAllRecords());
  }, []);

  const todayRecord = useMemo(() => {
    return getRecordByDate(selectedDate);
  }, [records, selectedDate]);

  const recentRecords = useMemo(() => {
    return [...records]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 10);
  }, [records]);

  const calendarGrid = useMemo(() => {
    return getMonthGrid(calendarYear, calendarMonth);
  }, [calendarYear, calendarMonth]);

  const monthLabel = useMemo(() => {
    return `${calendarYear}年${calendarMonth + 1}月`;
  }, [calendarYear, calendarMonth]);

  const dateRange = useMemo(() => {
    const today = new Date();
    const days = viewMode === 'week' ? 7 : 30;
    const dates: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      dates.push(formatDate(d));
    }
    return dates;
  }, [viewMode]);

  const stats = useMemo(() => {
    return computeStats(records, dateRange);
  }, [records, dateRange]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCalendarTransition(direction === 'prev' ? 'right' : 'left');
    setTimeout(() => {
      if (direction === 'prev') {
        if (calendarMonth === 0) {
          setCalendarYear(prev => prev - 1);
          setCalendarMonth(11);
        } else {
          setCalendarMonth(prev => prev - 1);
        }
      } else {
        if (calendarMonth === 11) {
          setCalendarYear(prev => prev + 1);
          setCalendarMonth(0);
        } else {
          setCalendarMonth(prev => prev + 1);
        }
      }
      setCalendarTransition('none');
    }, 150);
  };

  const getRecordForDate = (date: string): EmotionRecord | undefined => {
    return records.find(r => r.date === date);
  };

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className="app">
      <header className="app-header glass">
        <div className="header-title">
          <span className="header-icon">🌈</span>
          <h1>色彩情绪记录仪</h1>
        </div>
        <div className="header-date">{selectedDate}</div>
      </header>

      <main className="app-main">
        <section className="panel-left">
          <div className="wheel-section">
            <ColorWheel onColorSelect={handleColorSelect} selectedDate={selectedDate} />
          </div>

          {todayRecord && (
            <div className="today-record">
              <div className="section-title">今日记录</div>
              <ColorRecord record={todayRecord} index={0} />
            </div>
          )}

          <div className="recent-records">
            <div className="section-title">近期记录</div>
            <div className="records-list">
              {recentRecords.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">🎨</span>
                  <p>还没有记录，点击色环开始吧</p>
                </div>
              ) : (
                recentRecords.map((record, i) => (
                  <ColorRecord key={record.id} record={record} index={i} />
                ))
              )}
            </div>
          </div>
        </section>

        <section className="panel-right">
          <div className="tab-switcher">
            <button
              className={`tab-btn ${activeTab === 'calendar' ? 'active' : ''}`}
              onClick={() => setActiveTab('calendar')}
            >
              📅 情绪日历
            </button>
            <button
              className={`tab-btn ${activeTab === 'trend' ? 'active' : ''}`}
              onClick={() => setActiveTab('trend')}
            >
              📊 趋势分析
            </button>
          </div>

          {activeTab === 'calendar' && (
            <div className="calendar-section glass">
              <div className="calendar-nav">
                <button className="nav-btn" onClick={() => navigateMonth('prev')}>‹</button>
                <span className="month-label">{monthLabel}</span>
                <button className="nav-btn" onClick={() => navigateMonth('next')}>›</button>
              </div>

              <div className={`calendar-grid-wrapper ${calendarTransition}`}>
                <div className="calendar-weekdays">
                  {weekDays.map(d => (
                    <span key={d} className="weekday-label">{d}</span>
                  ))}
                </div>
                <div className="calendar-grid">
                  {calendarGrid.flat().map((date, i) => {
                    if (!date) return <div key={`empty-${i}`} className="calendar-cell empty" />;
                    const record = getRecordForDate(date);
                    const dayNum = parseInt(date.slice(8));
                    const isToday = date === formatDate(new Date());
                    const isSelected = date === selectedDate;
                    const intensity = record ? record.intensity : 0;
                    const scale = record ? 0.6 + (intensity / 100) * 0.4 : 0;
                    const opacity = record ? 0.5 + (intensity / 100) * 0.5 : 0;

                    return (
                      <div
                        key={date}
                        className={`calendar-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${record ? 'has-record' : ''}`}
                        onClick={() => setSelectedDate(date)}
                        onMouseEnter={(e) => {
                          if (record) {
                            setHoveredDay({
                              date,
                              x: e.clientX,
                              y: e.clientY,
                            });
                          }
                        }}
                        onMouseLeave={() => setHoveredDay(null)}
                      >
                        <span className="cell-day">{dayNum}</span>
                        {record && (
                          <div
                            className="cell-color-block"
                            style={{
                              background: record.color,
                              transform: `scale(${scale})`,
                              opacity,
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {hoveredDay && (
                <div
                  className="calendar-tooltip glass"
                  style={{
                    left: Math.min(hoveredDay.x + 12, window.innerWidth - 260),
                    top: hoveredDay.y - 80,
                  }}
                >
                  {(() => {
                    const rec = getRecordForDate(hoveredDay.date);
                    return rec ? (
                      <>
                        <div className="tooltip-header">
                          <div className="tooltip-color-dot" style={{ background: rec.color }} />
                          <span className="tooltip-date">{hoveredDay.date}</span>
                        </div>
                        <div className="tooltip-emotion">{rec.emotion}</div>
                        {rec.note && <div className="tooltip-note">"{rec.note}"</div>}
                        <div className="tooltip-hex">{rec.color.toUpperCase()}</div>
                      </>
                    ) : null;
                  })()}
                </div>
              )}
            </div>
          )}

          {activeTab === 'trend' && (
            <div className="trend-section">
              <div className="trend-controls glass">
                <div className="control-group">
                  <label>时间范围</label>
                  <div className="toggle-group">
                    <button
                      className={`toggle-btn ${viewMode === 'week' ? 'active' : ''}`}
                      onClick={() => setViewMode('week')}
                    >
                      一周
                    </button>
                    <button
                      className={`toggle-btn ${viewMode === 'month' ? 'active' : ''}`}
                      onClick={() => setViewMode('month')}
                    >
                      一个月
                    </button>
                  </div>
                </div>
                <div className="control-group">
                  <label>分析维度</label>
                  <div className="toggle-group">
                    <button
                      className={`toggle-btn ${analysisMode === 'intensity' ? 'active' : ''}`}
                      onClick={() => setAnalysisMode('intensity')}
                    >
                      情绪强度
                    </button>
                    <button
                      className={`toggle-btn ${analysisMode === 'diversity' ? 'active' : ''}`}
                      onClick={() => setAnalysisMode('diversity')}
                    >
                      情绪多样性
                    </button>
                  </div>
                </div>
              </div>

              <TrendChart
                records={records}
                viewMode={viewMode}
                analysisMode={analysisMode}
              />

              <SummaryCard stats={stats} viewMode={viewMode} />
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default App;
