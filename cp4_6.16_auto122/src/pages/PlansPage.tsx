import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { PlanBuilder } from '../components/PlanBuilder';
import type { Plan } from '../types';
import './styles/PlansPage.css';

export function PlansPage() {
  const navigate = useNavigate();
  const { plans, currentPlanId, setCurrentPlan, addPlan, updatePlan, removePlan } = useAppStore();
  const [isCreating, setIsCreating] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  const currentPlan = plans.find(p => p.id === currentPlanId) || null;

  const handleCreateNew = () => {
    setEditingPlan(null);
    setIsCreating(true);
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setIsCreating(true);
  };

  const handleSave = async (planData: Omit<Plan, 'id' | 'createdAt'>) => {
    if (editingPlan) {
      await updatePlan({
        ...editingPlan,
        ...planData,
      });
    } else {
      await addPlan(planData);
    }
    setIsCreating(false);
    setEditingPlan(null);
  };

  const handleDelete = async () => {
    if (editingPlan && window.confirm('确定要删除这个训练计划吗？')) {
      await removePlan(editingPlan.id);
      setIsCreating(false);
      setEditingPlan(null);
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingPlan(null);
  };

  const handleSelectPlan = (plan: Plan) => {
    setCurrentPlan(plan.id);
  };

  return (
    <div className="plans-page">
      <div className="plans-page__sidebar hide-mobile">
        <div className="plans-page__sidebar-header">
          <h2>我的计划</h2>
          <button className="btn btn-primary btn-sm" onClick={handleCreateNew}>
            + 新建
          </button>
        </div>
        <div className="plans-page__list">
          {plans.length === 0 ? (
            <div className="plans-page__empty">
              暂无计划，点击上方按钮创建
            </div>
          ) : (
            plans.map(plan => (
              <div
                key={plan.id}
                className={`plans-page__item ${currentPlanId === plan.id ? 'active' : ''}`}
                onClick={() => handleSelectPlan(plan)}
              >
                <div className="plans-page__item-name">{plan.name}</div>
                <div className="plans-page__item-info">
                  {plan.exercises.length} 个动作
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="plans-page__content">
        {isCreating ? (
          <div className="fade-in">
            <PlanBuilder
              plan={editingPlan || undefined}
              onSave={handleSave}
              onCancel={handleCancel}
              onDelete={editingPlan ? handleDelete : undefined}
            />
          </div>
        ) : currentPlan ? (
          <div className="plans-page__detail fade-in">
            <div className="plans-page__detail-header">
              <div>
                <h1>{currentPlan.name}</h1>
                <p className="plans-page__detail-desc">{currentPlan.description}</p>
              </div>
              <button className="btn btn-secondary" onClick={() => handleEdit(currentPlan)}>
                编辑计划
              </button>
            </div>
            <div className="plans-page__exercises">
              <h3>动作列表</h3>
              <div className="plans-page__exercise-list">
                {currentPlan.exercises
                  .sort((a, b) => a.order - b.order)
                  .map((ex, idx) => (
                    <div key={ex.id} className="plans-page__exercise-item">
                      <span className="plans-page__exercise-order">{idx + 1}</span>
                      <span className="plans-page__exercise-name">{ex.name}</span>
                    </div>
                  ))}
              </div>
            </div>
            <div className="plans-page__actions">
              <button className="btn btn-primary btn-lg" onClick={() => navigate(`/workout/${currentPlan.id}`)}>
                开始训练
              </button>
            </div>
          </div>
        ) : (
          <div className="plans-page__welcome">
            <h2>欢迎使用 IronTrack</h2>
            <p>创建你的第一个训练计划，开始记录力量训练进度</p>
            <button className="btn btn-primary btn-lg" onClick={handleCreateNew}>
              创建训练计划
            </button>
          </div>
        )}
      </div>

      <div className="hide-desktop plans-page__mobile-nav">
        <button className="btn btn-primary" onClick={handleCreateNew}>
          + 新建计划
        </button>
        <div className="plans-page__mobile-tabs">
          {plans.map(plan => (
            <button
              key={plan.id}
              className={`plans-page__mobile-tab ${currentPlanId === plan.id ? 'active' : ''}`}
              onClick={() => handleSelectPlan(plan)}
            >
              {plan.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
