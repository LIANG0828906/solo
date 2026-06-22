import React, { useState, useMemo } from 'react';
import { WorkoutType, WORKOUT_TYPE_LABELS } from '../types';
import { calculateWorkoutCalories } from '../utils/calories';
import { formatDate } from '../utils/dateUtils';
import { useFitTrackyStore } from '../store';
import './forms.css';

const WorkoutForm: React.FC = () => {
  const [type, setType] = useState<WorkoutType>('running');
  const [duration, setDuration] = useState<number>(30);
  const [date, setDate] = useState<string>(formatDate(new Date()));
  const addWorkoutRecord = useFitTrackyStore((state) => state.addWorkoutRecord);

  const estimatedCalories = useMemo(() => {
    return calculateWorkoutCalories(type, duration);
  }, [type, duration]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (duration <= 0) return;
    
    addWorkoutRecord({
      date,
      type,
      duration,
      calories: estimatedCalories,
    });
    
    setDuration(30);
  };

  return (
    <div className="form-card">
      <h3 className="form-title">🏃 运动记录</h3>
      <form onSubmit={handleSubmit} className="workout-form">
        <div className="form-group">
          <label htmlFor="workout-date">日期</label>
          <input
            type="date"
            id="workout-date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="workout-type">运动类型</label>
          <select
            id="workout-type"
            value={type}
            onChange={(e) => setType(e.target.value as WorkoutType)}
            className="form-select"
          >
            {Object.entries(WORKOUT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="workout-duration">时长 (分钟)</label>
          <input
            type="number"
            id="workout-duration"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            min="1"
            max="300"
            className="form-input"
          />
        </div>

        <div className="calories-display">
          <span className="calories-label">预计消耗</span>
          <span className="calories-value">{estimatedCalories} 卡</span>
        </div>

        <button type="submit" className="submit-btn">
          添加记录
        </button>
      </form>
    </div>
  );
};

export default WorkoutForm;
