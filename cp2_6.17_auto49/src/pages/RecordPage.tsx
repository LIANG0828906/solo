import React from 'react';
import { useFitTrackyStore } from '../store';
import WorkoutForm from '../components/WorkoutForm';
import MealForm from '../components/MealForm';
import CalendarHeatmap from '../components/CalendarHeatmap';
import MixedChart from '../components/MixedChart';
import GoalBadge from '../components/GoalBadge';
import { GoalType, GOAL_LABELS } from '../types';
import './RecordPage.css';

const RecordPage: React.FC = () => {
  const {
    userSettings,
    updateUserSettings,
    getDailyTotalCalories,
    getTodayDuration,
    workoutRecords,
    getWorkoutRecordsByDate,
    getMealRecordsByDate,
  } = useFitTrackyStore();

  const todayDuration = getTodayDuration();
  const goalReached = todayDuration >= userSettings.dailyDurationGoal;
  
  const todayStr = new Date().toISOString().split('T')[0];
  const todayWorkoutCount = workoutRecords.filter(r => r.date === todayStr).length;

  const getDailyCalories = (date: string): number => {
    return getDailyTotalCalories(date).burned;
  };

  const handleGoalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateUserSettings({ goal: e.target.value as GoalType });
  };

  const handleDurationGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    if (value > 0) {
      updateUserSettings({ dailyDurationGoal: value });
    }
  };

  const todayStats = getDailyTotalCalories(new Date().toISOString().split('T')[0]);

  return (
    <div className="record-page fade-in">
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">运动与饮食记录</h1>
          <p className="page-subtitle">记录每一天的进步，向目标前进</p>
        </div>
        <div className="header-right">
          <div className="today-stats">
            <div className="stat">
              <span className="stat-num">{todayDuration}</span>
              <span className="stat-label">今日运动(分钟)</span>
            </div>
            <div className="stat">
              <span className="stat-num">{todayStats.burned}</span>
              <span className="stat-label">消耗(卡)</span>
            </div>
            <div className="stat">
              <span className="stat-num">{todayStats.consumed}</span>
              <span className="stat-label">摄入(卡)</span>
            </div>
          </div>
          <GoalBadge show={goalReached} triggerKey={todayWorkoutCount} />
        </div>
      </div>

      <div className="goal-settings">
        <h3 className="section-title">🎯 目标设定</h3>
        <div className="goal-controls">
          <div className="goal-control">
            <label>健身目标</label>
            <select
              value={userSettings.goal}
              onChange={handleGoalChange}
              className="goal-select"
            >
              {Object.entries(GOAL_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="goal-control">
            <label>每日运动时长目标 (分钟)</label>
            <input
              type="number"
              value={userSettings.dailyDurationGoal}
              onChange={handleDurationGoalChange}
              min="5"
              max="300"
              className="goal-input"
            />
          </div>
        </div>
      </div>

      <div className="forms-section">
        <WorkoutForm />
        <MealForm />
      </div>

      <div className="heatmap-section">
        <CalendarHeatmap
          getDailyCalories={getDailyCalories}
          getWorkoutRecordsByDate={getWorkoutRecordsByDate}
          getMealRecordsByDate={getMealRecordsByDate}
        />
      </div>

      <div className="chart-section">
        <MixedChart />
      </div>
    </div>
  );
};

export default RecordPage;
