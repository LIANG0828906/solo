import React from 'react';
import { useFitTrackyStore } from '../store';
import WorkoutCard from '../components/WorkoutCard';
import { getWeekStartDate, formatDisplayDate } from '../utils/dateUtils';
import { GOAL_LABELS } from '../types';
import './PlanPage.css';

const PlanPage: React.FC = () => {
  const {
    userSettings,
    generateWeeklyPlan,
    getCurrentWeekPlan,
    getWeeklyStats,
  } = useFitTrackyStore();

  const weekStartDate = getWeekStartDate();
  const currentPlan = getCurrentWeekPlan();
  const weeklyStats = getWeeklyStats(weekStartDate);

  const handleGeneratePlan = () => {
    generateWeeklyPlan(weekStartDate);
  };

  const weekEndDate = currentPlan
    ? currentPlan.days[currentPlan.days.length - 1].date
    : '';

  const totalExpectedCalories = currentPlan
    ? currentPlan.days.reduce((sum, day) => sum + day.expectedCalories, 0)
    : 0;

  const totalPlannedDuration = currentPlan
    ? currentPlan.days.reduce((sum, day) => sum + day.duration, 0)
    : 0;

  return (
    <div className="plan-page fade-in">
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">训练计划</h1>
          <p className="page-subtitle">基于您的历史数据，智能生成个性化训练方案</p>
        </div>
        <button className="generate-btn" onClick={handleGeneratePlan}>
          {currentPlan ? '重新生成计划' : '生成本周计划'}
        </button>
      </div>

      <div className="plan-summary">
        <div className="summary-card">
          <span className="summary-label">本周目标</span>
          <span className="summary-value highlight">{GOAL_LABELS[userSettings.goal]}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">计划周期</span>
          <span className="summary-value">
            {currentPlan
              ? `${formatDisplayDate(weekStartDate)} - ${formatDisplayDate(weekEndDate)}`
              : '暂无计划'}
          </span>
        </div>
        <div className="summary-card">
          <span className="summary-label">预计总消耗</span>
          <span className="summary-value">{totalExpectedCalories} 卡</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">计划总时长</span>
          <span className="summary-value">{totalPlannedDuration} 分钟</span>
        </div>
      </div>

      {!currentPlan ? (
        <div className="no-plan">
          <div className="no-plan-icon">📅</div>
          <h3>还没有本周训练计划</h3>
          <p>点击上方按钮，基于您的运动数据生成个性化训练计划</p>
        </div>
      ) : (
        <div className="plan-cards">
          {currentPlan.days.map((day, index) => (
            <WorkoutCard key={day.date} day={day} dayIndex={index} />
          ))}
        </div>
      )}

      {currentPlan && (
        <div className="plan-tips">
          <h3 className="tips-title">💪 温馨提示</h3>
          <div className="tips-content">
            <div className="tip-item">
              <span className="tip-icon">⏰</span>
              <p>尽量在固定时间运动，养成规律的运动习惯</p>
            </div>
            <div className="tip-item">
              <span className="tip-icon">💧</span>
              <p>运动前中后都要及时补水，保持身体水分平衡</p>
            </div>
            <div className="tip-item">
              <span className="tip-icon">🥗</span>
              <p>配合合理饮食，运动效果会更加显著</p>
            </div>
            <div className="tip-item">
              <span className="tip-icon">😴</span>
              <p>保证充足睡眠，给身体足够的恢复时间</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanPage;
