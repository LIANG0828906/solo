import React, { useCallback } from 'react';
import { Sun, Calendar, Clock, Eye, Grid3X3 } from 'lucide-react';
import type { ViewMode } from '@/types';

interface SunControlCardProps {
  date: Date;
  onDateChange: (date: Date) => void;
  timeMinutes: number;
  onTimeChange: (minutes: number) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

const SunControlCard: React.FC<SunControlCardProps> = ({
  date,
  onDateChange,
  timeMinutes,
  onTimeChange,
  viewMode,
  onViewModeChange,
}) => {
  const timeMinutesToTimeStr = useCallback((minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }, []);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onDateChange(new Date(e.target.value));
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onTimeChange(parseInt(e.target.value, 10));
  };

  return (
    <div className="card">
      <div className="card-title">
        <Sun className="card-title-icon" />
        <span>日照参数控制</span>
      </div>

      <div className="form-group">
        <label className="form-label">日期选择</label>
        <input
          type="date"
          className="date-input"
          value={date.toISOString().slice(0, 10)}
          min={`${date.getFullYear()}-01-01`}
          max={`${date.getFullYear()}-12-31`}
          onChange={handleDateChange}
        />
      </div>

      <div className="form-group">
        <label className="form-label">时间控制 {timeMinutesToTimeStr(timeMinutes)}</label>
        <div className="slider-container">
          <input
            type="range"
            className="time-slider"
            min={360}
            max={1200}
            step={15}
            value={timeMinutes}
            onChange={handleTimeChange}
          />
        </div>
        <div className="slider-value">
          <span>06:00</span>
          <span>20:00</span>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">观察视角</label>
        <div className="view-toggle">
          <button
            className={`view-toggle-btn ${viewMode === 'perspective' ? 'active' : ''}`}
            onClick={() => onViewModeChange('perspective')}
          >
            <Eye className="btn-icon" />
            <span>透视漫游</span>
          </button>
          <button
            className={`view-toggle-btn ${viewMode === 'topdown' ? 'active' : ''}`}
            onClick={() => onViewModeChange('topdown')}
          >
            <Grid3X3 className="btn-icon" />
            <span>顶视俯瞰</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SunControlCard;
