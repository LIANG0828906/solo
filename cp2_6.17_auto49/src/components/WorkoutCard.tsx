import React, { useState } from 'react';
import { PlanDay, WORKOUT_TYPE_LABELS } from '../types';
import { formatDisplayDate } from '../utils/dateUtils';
import './WorkoutCard.css';

interface WorkoutCardProps {
  day: PlanDay;
  dayIndex: number;
}

const WorkoutCard: React.FC<WorkoutCardProps> = ({ day, dayIndex }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const isRestDay = day.intensity === 'rest';
  const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

  const intensityLabels: Record<string, string> = {
    rest: '休息日',
    light: '轻度训练',
    moderate: '中度训练',
    high: '高强度训练',
  };

  const intensityColors: Record<string, string> = {
    rest: '#9E9E9E',
    light: '#4CAF50',
    moderate: '#FF9800',
    high: '#F44336',
  };

  return (
    <div
      className={`workout-card ${isExpanded ? 'expanded' : ''} ${isRestDay ? 'rest-day' : ''}`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="card-header">
        <div className="day-info">
          <span className="day-name">{dayNames[dayIndex]}</span>
          <span className="day-date">{formatDisplayDate(day.date)}</span>
        </div>
        <div
          className="intensity-badge"
          style={{ backgroundColor: intensityColors[day.intensity] }}
        >
          {intensityLabels[day.intensity]}
        </div>
      </div>

      {!isRestDay ? (
        <>
          <div className="card-content">
            <div className="workout-type">
              <span className="label">运动类型</span>
              <span className="value">{WORKOUT_TYPE_LABELS[day.workoutType]}</span>
            </div>
            <div className="workout-stats">
              <div className="stat-item">
                <span className="stat-value">{day.duration}</span>
                <span className="stat-label">分钟</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-value">{day.expectedCalories}</span>
                <span className="stat-label">卡路里</span>
              </div>
            </div>
          </div>

          <div className={`card-details ${isExpanded ? 'show' : ''}`}>
            <div className="details-section">
              <h4>💡 训练建议</h4>
              <ul>
                {day.tips.map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
            </div>
            {day.alternatives.length > 0 && (
              <div className="details-section">
                <h4>🔄 替换运动</h4>
                <div className="alternatives">
                  {day.alternatives.map((alt, index) => (
                    <span key={index} className="alt-tag">
                      {WORKOUT_TYPE_LABELS[alt]}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="card-footer">
            <span className="expand-hint">
              {isExpanded ? '收起详情' : '点击查看详情'}
            </span>
          </div>
        </>
      ) : (
        <div className="rest-content">
          <span className="rest-icon">😴</span>
          <p className="rest-text">好好休息，恢复体力</p>
          <div className="card-details show">
            <div className="details-section">
              <h4>💡 休息日建议</h4>
              <ul>
                {day.tips.map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutCard;
