import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppStore } from '../store';
import { WorkoutLogger } from '../components/WorkoutLogger';
import type { Workout } from '../types';
import './styles/WorkoutPage.css';

export function WorkoutPage() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { plans, addWorkout, currentPlanId, setCurrentPlan } = useAppStore();
  const [isCompleted, setIsCompleted] = useState(false);

  const activePlanId = planId || currentPlanId;
  const plan = plans.find(p => p.id === activePlanId);

  useEffect(() => {
    if (planId) {
      setCurrentPlan(planId);
    }
  }, [planId, setCurrentPlan]);

  const handleComplete = async (workout: Omit<Workout, 'id'>) => {
    await addWorkout(workout);
    setIsCompleted(true);
  };

  const handleCancel = () => {
    navigate('/');
  };

  const handleBackToPlans = () => {
    navigate('/');
  };

  const handleViewSocial = () => {
    navigate('/social');
  };

  if (!plan) {
    return (
      <div className="workout-page">
        <div className="workout-page__empty">
          <h2>未找到训练计划</h2>
          <button className="btn btn-primary" onClick={handleBackToPlans}>
            返回计划列表
          </button>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="workout-page">
        <div className="workout-page__complete fade-in">
          <div className="workout-page__complete-icon">✓</div>
          <h2>训练完成！</h2>
          <p>干得漂亮，{plan.name} 已完成记录</p>
          <div className="workout-page__complete-actions">
            <button className="btn btn-secondary" onClick={handleBackToPlans}>
              返回计划
            </button>
            <button className="btn btn-primary" onClick={handleViewSocial}>
              查看社群
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="workout-page">
      <div className="workout-page__header">
        <button className="btn btn-ghost" onClick={handleCancel}>
          ← 返回
        </button>
        <h1>{plan.name}</h1>
        <div style={{ width: 60 }} />
      </div>
      <div className="workout-page__content">
        <WorkoutLogger
          plan={plan}
          onComplete={handleComplete}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
