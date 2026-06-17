import React, { useMemo, useState, useEffect } from 'react';
import { getLast12Months, getMonthDays, formatDate, formatDisplayDate } from '../utils/dateUtils';
import { WorkoutRecord, MealRecord, WORKOUT_TYPE_LABELS } from '../types';
import './CalendarHeatmap.css';

interface CalendarHeatmapProps {
  getDailyCalories: (date: string) => number;
  getWorkoutRecordsByDate: (date: string) => WorkoutRecord[];
  getMealRecordsByDate: (date: string) => MealRecord[];
}

const DEFAULT_THRESHOLDS = [200, 400, 600, 800, 1000];

const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({
  getDailyCalories,
  getWorkoutRecordsByDate,
  getMealRecordsByDate,
}) => {
  const months = useMemo(() => getLast12Months(), []);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [thresholds, setThresholds] = useState<number[]>(DEFAULT_THRESHOLDS);
  const [tempThresholds, setTempThresholds] = useState<string[]>(DEFAULT_THRESHOLDS.map(String));
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('fittracky_heatmap_thresholds');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 5) {
          setThresholds(parsed);
          setTempThresholds(parsed.map(String));
        }
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const getHeatLevel = (calories: number): number => {
    if (calories === 0) return 0;
    if (calories < thresholds[0]) return 1;
    if (calories < thresholds[1]) return 2;
    if (calories < thresholds[2]) return 3;
    if (calories < thresholds[3]) return 4;
    return 5;
  };

  const handleCellClick = (dateStr: string) => {
    setSelectedDate(dateStr);
  };

  const handleCloseModal = () => {
    setSelectedDate(null);
  };

  const handleThresholdChange = (index: number, value: string) => {
    const newTemp = [...tempThresholds];
    newTemp[index] = value;
    setTempThresholds(newTemp);
  };

  const applyThresholds = () => {
    const newThresholds = tempThresholds
      .map(Number)
      .filter(n => !isNaN(n) && n > 0)
      .sort((a, b) => a - b);
    
    if (newThresholds.length === 5) {
      setThresholds(newThresholds);
      localStorage.setItem('fittracky_heatmap_thresholds', JSON.stringify(newThresholds));
      setShowSettings(false);
    }
  };

  const resetThresholds = () => {
    setThresholds(DEFAULT_THRESHOLDS);
    setTempThresholds(DEFAULT_THRESHOLDS.map(String));
    localStorage.removeItem('fittracky_heatmap_thresholds');
  };

  const weekDays = ['一', '二', '三', '四', '五', '六', '日'];

  const selectedWorkouts = selectedDate ? getWorkoutRecordsByDate(selectedDate) : [];
  const selectedMeals = selectedDate ? getMealRecordsByDate(selectedDate) : [];
  const selectedCalories = selectedDate ? getDailyCalories(selectedDate) : 0;

  return (
    <div className="calendar-heatmap-container">
      <div className="heatmap-header">
        <div className="heatmap-title-row">
          <h3 className="section-title">📅 运动日历</h3>
          <button
            className="settings-btn"
            onClick={() => setShowSettings(!showSettings)}
            title="设置颜色阈值"
          >
            ⚙️ 阈值设置
          </button>
        </div>

        {showSettings && (
          <div className="threshold-settings">
            <div className="settings-title">自定义颜色阈值（卡路里上限）</div>
            <div className="threshold-inputs">
              {[0, 1, 2, 3, 4].map((index) => (
                <div key={index} className="threshold-input-group">
                  <div className="threshold-label">
                    <div className={`heatmap-cell level-${index + 1}`} />
                    <span>{index === 0 ? '1档' : index === 1 ? '2档' : index === 2 ? '3档' : index === 3 ? '4档' : '5档'}</span>
                  </div>
                  <input
                    type="number"
                    value={tempThresholds[index]}
                    onChange={(e) => handleThresholdChange(index, e.target.value)}
                    className="threshold-input"
                    min="1"
                  />
                  <span className="threshold-suffix">卡</span>
                </div>
              ))}
            </div>
            <div className="settings-actions">
              <button className="apply-btn" onClick={applyThresholds}>
                应用设置
              </button>
              <button className="reset-btn" onClick={resetThresholds}>
                恢复默认
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="heatmap-scroll-wrapper">
        <div className="heatmap-months">
          {months.map((month, monthIndex) => {
            const days = getMonthDays(month.year, month.month);
            const firstDay = days[0];
            const firstDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
            
            return (
              <div key={monthIndex} className="heatmap-month">
                <div className="month-title">{month.label}</div>
                <div className="weekday-labels">
                  {weekDays.map((day, i) => (
                    <div key={i} className="weekday-label">{day}</div>
                  ))}
                </div>
                <div className="heatmap-grid">
                  {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                    <div key={`empty-${i}`} className="heatmap-cell empty" />
                  ))}
                  {days.map((date) => {
                    const dateStr = formatDate(date);
                    const calories = getDailyCalories(dateStr);
                    const level = getHeatLevel(calories);
                    const isSelected = selectedDate === dateStr;
                    
                    return (
                      <div
                        key={dateStr}
                        className={`heatmap-cell level-${level} ${isSelected ? 'selected' : ''}`}
                        title={`${dateStr}\n消耗: ${calories} 卡路里\n点击查看详情`}
                        onClick={() => handleCellClick(dateStr)}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="heatmap-legend">
        <span className="legend-label">少</span>
        <div className="legend-cells">
          {[0, 1, 2, 3, 4, 5].map((level) => (
            <div key={level} className={`heatmap-cell level-${level}`} />
          ))}
        </div>
        <span className="legend-label">多</span>
      </div>

      {selectedDate && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                📅 {formatDisplayDate(selectedDate)} 记录详情
              </h3>
              <button className="modal-close" onClick={handleCloseModal}>
                ✕
              </button>
            </div>

            <div className="modal-summary">
              <div className="summary-item">
                <span className="summary-value">{selectedCalories}</span>
                <span className="summary-label">总消耗 (卡)</span>
              </div>
              <div className="summary-item">
                <span className="summary-value">{selectedWorkouts.length}</span>
                <span className="summary-label">运动记录</span>
              </div>
              <div className="summary-item">
                <span className="summary-value">{selectedMeals.length}</span>
                <span className="summary-label">饮食记录</span>
              </div>
            </div>

            <div className="modal-body">
              <div className="records-section">
                <h4>🏃 运动记录</h4>
                {selectedWorkouts.length === 0 ? (
                  <p className="no-records">暂无运动记录</p>
                ) : (
                  <div className="records-list">
                    {selectedWorkouts.map((record) => (
                      <div key={record.id} className="record-item workout">
                        <div className="record-icon">🏃</div>
                        <div className="record-info">
                          <div className="record-name">{WORKOUT_TYPE_LABELS[record.type]}</div>
                          <div className="record-meta">
                            {record.duration} 分钟 · {record.calories} 卡
                          </div>
                        </div>
                        <div className="record-calories">-{record.calories}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="records-section">
                <h4>🍽️ 饮食记录</h4>
                {selectedMeals.length === 0 ? (
                  <p className="no-records">暂无饮食记录</p>
                ) : (
                  <div className="records-list">
                    {selectedMeals.map((record) => (
                      <div key={record.id} className="record-item meal">
                        <div className="record-icon">🍽️</div>
                        <div className="record-info">
                          <div className="record-name">{record.foodName}</div>
                          <div className="record-meta">
                            {record.portion} 克 · {record.calories} 卡
                          </div>
                        </div>
                        <div className="record-calories positive">+{record.calories}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarHeatmap;
