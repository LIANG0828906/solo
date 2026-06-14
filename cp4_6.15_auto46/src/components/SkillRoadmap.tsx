import { useState, useCallback, useRef } from 'react';
import type { Roadmap, Stage, SubTask } from '@/types/index';
import { createRoadmap, getOverallProgress, isRoadmapCompleted } from '@/utils/dataHelpers';
import StageCard from './StageCard';
import Fireworks from './Fireworks';
import './SkillRoadmap.css';

interface SkillRoadmapProps {
  roadmap: Roadmap | null;
  onRoadmapChange: (roadmap: Roadmap) => void;
}

function SkillRoadmap({ roadmap, onRoadmapChange }: SkillRoadmapProps) {
  const [showForm, setShowForm] = useState(!roadmap);
  const [skillName, setSkillName] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [dragStageId, setDragStageId] = useState<string | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const handleCreate = useCallback(() => {
    if (!skillName.trim()) return;
    const newRoadmap = createRoadmap(
      skillName.trim(),
      description.trim(),
      targetDate || new Date(Date.now() + 70 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    );
    onRoadmapChange(newRoadmap);
    setShowForm(false);
  }, [skillName, description, targetDate, onRoadmapChange]);

  const handleToggleSubTask = useCallback(
    (stageId: string, subTaskId: string, actualMinutes: number) => {
      if (!roadmap) return;
      const updated = { ...roadmap, stages: roadmap.stages.map((stage) => {
        if (stage.id !== stageId) return stage;
        return {
          ...stage,
          subTasks: stage.subTasks.map((st) => {
            if (st.id !== subTaskId) return st;
            const nowCompleting = !st.completed;
            return {
              ...st,
              completed: nowCompleting,
              actualMinutes: nowCompleting ? actualMinutes : st.actualMinutes,
              completedAt: nowCompleting ? new Date().toISOString() : null,
            };
          }),
        };
      })};
      updated.completed = isRoadmapCompleted(updated);
      onRoadmapChange(updated);
    },
    [roadmap, onRoadmapChange]
  );

  const handleEditSubTask = useCallback(
    (stageId: string, subTaskId: string, title: string, estimatedMinutes: number, actualMinutes: number) => {
      if (!roadmap) return;
      const updated = { ...roadmap, stages: roadmap.stages.map((stage) => {
        if (stage.id !== stageId) return stage;
        return {
          ...stage,
          subTasks: stage.subTasks.map((st) =>
            st.id === subTaskId ? { ...st, title, estimatedMinutes, actualMinutes } : st
          ),
        };
      })};
      onRoadmapChange(updated);
    },
    [roadmap, onRoadmapChange]
  );

  const handleDeleteSubTask = useCallback(
    (stageId: string, subTaskId: string) => {
      if (!roadmap) return;
      const updated = { ...roadmap, stages: roadmap.stages.map((stage) => {
        if (stage.id !== stageId) return stage;
        return { ...stage, subTasks: stage.subTasks.filter((st) => st.id !== subTaskId) };
      })};
      updated.completed = isRoadmapCompleted(updated);
      onRoadmapChange(updated);
    },
    [roadmap, onRoadmapChange]
  );

  const handleAddSubTask = useCallback(
    (stageId: string, subTask: SubTask) => {
      if (!roadmap) return;
      const updated = { ...roadmap, stages: roadmap.stages.map((stage) => {
        if (stage.id !== stageId) return stage;
        return { ...stage, subTasks: [...stage.subTasks, { ...subTask, stageId }] };
      })};
      onRoadmapChange(updated);
    },
    [roadmap, onRoadmapChange]
  );

  const handleUpdateSkillScore = useCallback(
    (stageId: string, scoreId: string, score: number) => {
      if (!roadmap) return;
      const updated = { ...roadmap, stages: roadmap.stages.map((stage) => {
        if (stage.id !== stageId) return stage;
        return {
          ...stage,
          skillScores: stage.skillScores.map((ss) => (ss.id === scoreId ? { ...ss, score } : ss)),
        };
      })};
      onRoadmapChange(updated);
    },
    [roadmap, onRoadmapChange]
  );

  const handleToggleExpand = useCallback(
    (stageId: string) => {
      if (!roadmap) return;
      const updated = {
        ...roadmap,
        stages: roadmap.stages.map((stage) =>
          stage.id === stageId ? { ...stage, expanded: !stage.expanded } : stage
        ),
      };
      onRoadmapChange(updated);
    },
    [roadmap, onRoadmapChange]
  );

  const handleDragStart = useCallback((e: React.DragEvent, stageId: string) => {
    setDragStageId(stageId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', stageId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStageId(stageId);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetStageId: string) => {
      e.preventDefault();
      if (!roadmap || !dragStageId || dragStageId === targetStageId) {
        setDragStageId(null);
        setDragOverStageId(null);
        return;
      }

      const stages = [...roadmap.stages];
      const dragIndex = stages.findIndex((s) => s.id === dragStageId);
      const dropIndex = stages.findIndex((s) => s.id === targetStageId);

      if (dragIndex === -1 || dropIndex === -1) {
        setDragStageId(null);
        setDragOverStageId(null);
        return;
      }

      const [draggedStage] = stages.splice(dragIndex, 1);
      stages.splice(dropIndex, 0, draggedStage);

      const reordered = stages.map((s, i) => ({ ...s, order: i }));
      onRoadmapChange({ ...roadmap, stages: reordered });
      setDragStageId(null);
      setDragOverStageId(null);
    },
    [roadmap, dragStageId, onRoadmapChange]
  );

  const handleDragEnd = useCallback(() => {
    setDragStageId(null);
    setDragOverStageId(null);
  }, []);

  const handleDeleteRoadmap = useCallback(() => {
    if (roadmap && window.confirm('确定要删除这条学习路线吗？所有数据将丢失。')) {
      onRoadmapChange(null as unknown as Roadmap);
      setShowForm(true);
    }
  }, [roadmap, onRoadmapChange]);

  if (!roadmap) {
    return (
      <div className="skill-roadmap">
        <div className="roadmap-empty">
          <div className="empty-icon">🗺️</div>
          <h2 className="empty-title">创建你的学习路线</h2>
          <p className="empty-desc">规划你的技能学习路径，追踪每一步的进步</p>

          {showForm && (
            <div className="create-form">
              <div className="form-group">
                <label className="form-label">技能名称</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="例如：React 开发"
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">总目标描述</label>
                <textarea
                  className="form-textarea"
                  placeholder="描述你的学习目标..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label className="form-label">预计完成时间</label>
                <input
                  className="form-input"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                />
              </div>
              <button className="form-submit-btn" onClick={handleCreate} disabled={!skillName.trim()}>
                创建学习路线
              </button>
            </div>
          )}

          {!showForm && (
            <button className="form-submit-btn" onClick={() => setShowForm(true)}>
              开始创建
            </button>
          )}
        </div>
      </div>
    );
  }

  const overallProgress = getOverallProgress(roadmap);
  const completed = isRoadmapCompleted(roadmap);

  return (
    <div className="skill-roadmap">
      <div className="roadmap-header">
        <div className="roadmap-info">
          <h2 className="roadmap-skill-name">{roadmap.skillName}</h2>
          {roadmap.description && <p className="roadmap-desc">{roadmap.description}</p>}
          <div className="roadmap-meta">
            <span className="meta-item">目标日期: {roadmap.targetDate}</span>
            <span className="meta-item">总体进度: {overallProgress}%</span>
          </div>
        </div>
        <div className="roadmap-actions">
          <button className="roadmap-delete-btn" onClick={handleDeleteRoadmap}>
            删除路线
          </button>
        </div>
      </div>

      <div className="overall-progress-bar">
        <div className="overall-progress-fill" style={{ width: `${overallProgress}%` }} />
      </div>

      <div className="timeline-container" ref={timelineRef} onDragEnd={handleDragEnd}>
        <div className="timeline-track">
          {roadmap.stages.map((stage, index) => (
            <div key={stage.id} className="timeline-stage-wrapper">
              <StageCard
                stage={stage}
                onToggleSubTask={handleToggleSubTask}
                onEditSubTask={handleEditSubTask}
                onDeleteSubTask={handleDeleteSubTask}
                onAddSubTask={handleAddSubTask}
                onUpdateSkillScore={handleUpdateSkillScore}
                onToggleExpand={handleToggleExpand}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                isDragging={dragStageId === stage.id}
                dragOverStageId={dragOverStageId}
              />
              {index < roadmap.stages.length - 1 && (
                <div className="timeline-connector">
                  <div className="connector-line" />
                  <div className="connector-arrow">→</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {completed && <Fireworks active={completed} />}
    </div>
  );
}

export default SkillRoadmap;
