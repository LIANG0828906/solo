import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  arrayMove,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus, BarChart3 } from 'lucide-react';
import GoalCard from '../components/GoalCard';
import type { Goal } from '../types';
import { goalsApi } from '../api';

interface Props {
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
}

const DashboardPage: React.FC<Props> = ({ goals, setGoals }) => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [formName, setFormName] = useState('');
  const [formHours, setFormHours] = useState('');
  const [formDaily, setFormDaily] = useState('60');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const oldIndex = goals.findIndex((g) => g.id === active.id);
        const newIndex = goals.findIndex((g) => g.id === over.id);
        if (oldIndex >= 0 && newIndex >= 0) {
          const reordered = arrayMove(goals, oldIndex, newIndex).map(
            (g, idx) => ({ ...g, order: idx })
          );
          setGoals(reordered);
          reordered.forEach((g, i) => {
            goalsApi.reorder(g.id, i).catch(() => {});
          });
        }
      }
    },
    [goals, setGoals]
  );

  const handleCreateGoal = async () => {
    if (!formName.trim() || !formHours) return;
    const created = await goalsApi.create({
      name: formName.trim(),
      totalPlannedHours: Number(formHours),
      dailyGoalMinutes: Number(formDaily) || 60,
    });
    setGoals((prev) => [...prev, created]);
    setShowModal(false);
    setFormName('');
    setFormHours('');
    setFormDaily('60');
  };

  const sortedGoals = useMemo(
    () => [...goals].sort((a, b) => a.order - b.order),
    [goals]
  );

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">学习目标</h1>
          <p className="page-subtitle">坚持每一天，离目标更近一步</p>
        </div>
        <div className="header-actions">
          <button className="nav-link" onClick={() => navigate('/stats')}>
            <BarChart3 size={16} />
            统计报告
          </button>
          <button className="btn-gradient" onClick={() => setShowModal(true)}>
            <Plus size={18} />
            新建目标
          </button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sortedGoals.map((g) => g.id)} strategy={verticalListSortingStrategy}>
          <div className="goals-grid">
            {sortedGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onClick={() => navigate(`/goal/${goal.id}`)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {sortedGoals.length === 0 && (
        <div className="empty-dashboard">
          <div className="empty-illustration">📚</div>
          <h3>还没有学习目标</h3>
          <p>点击右上角「新建目标」开始规划你的学习之旅</p>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal glass" onClick={(e) => e.stopPropagation()}>
            <h3>新建学习目标</h3>
            <div className="form-group">
              <label>目标名称</label>
              <input
                type="text"
                placeholder="例如：掌握 React"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>计划总时长 (小时)</label>
              <input
                type="number"
                placeholder="80"
                value={formHours}
                onChange={(e) => setFormHours(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>每日目标 (分钟)</label>
              <input
                type="number"
                placeholder="60"
                value={formDaily}
                onChange={(e) => setFormDaily(e.target.value)}
              />
            </div>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setShowModal(false)}>
                取消
              </button>
              <button className="btn-gradient" onClick={handleCreateGoal}>
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .page-subtitle {
          color: #6b7280;
          font-size: 14px;
          margin-top: 4px;
        }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .btn-gradient {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          padding: 10px 18px;
        }
        .nav-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
        }
        .goals-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 20px;
        }
        .empty-dashboard {
          text-align: center;
          padding: 80px 20px;
          color: #9ca3af;
        }
        .empty-illustration {
          font-size: 56px;
          margin-bottom: 16px;
        }
        .empty-dashboard h3 {
          font-size: 20px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }
        .empty-dashboard p {
          font-size: 14px;
        }
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(30, 27, 75, 0.4);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          animation: fadeIn 0.25s ease;
        }
        .modal {
          width: 90%;
          max-width: 440px;
          border-radius: 20px;
          padding: 28px;
          animation: modalIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes modalIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .modal h3 {
          font-size: 20px;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 20px;
        }
        .form-group {
          margin-bottom: 16px;
        }
        .form-group label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 6px;
        }
        .form-group input {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid rgba(102, 126, 234, 0.2);