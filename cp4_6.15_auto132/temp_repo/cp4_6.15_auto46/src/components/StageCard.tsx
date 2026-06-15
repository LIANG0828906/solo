import { useState, useCallback } from 'react';
import type { Stage, SubTask, SkillScore } from '@/types/index';
import { getStageProgress, getStageStatus, createSubTask } from '@/utils/dataHelpers';
import SubTaskItem from './SubTaskItem';
import './StageCard.css';

interface StageCardProps {
  stage: Stage;
  onToggleSubTask: (stageId: string, subTaskId: string, actualMinutes: number) => void;
  onEditSubTask: (stageId: string, subTaskId: string, title: string, estimatedMinutes: number, actualMinutes: number) => void;
  onDeleteSubTask: (stageId: string, subTaskId: string) => void;
  onAddSubTask: (stageId: string, subTask: SubTask) => void;
  onUpdateSkillScore: (stageId: string, scoreId: string, score: number) => void;
  onToggleExpand: (stageId: string) => void;
  onDragStart: (e: React.DragEvent, stageId: string) => void;
  onDragOver: (e: React.DragEvent, stageId: string) => void;
  onDrop: (e: React.DragEvent, stageId: string) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  isDragging: boolean;
  dragOverStageId: string | null;
  isGlobalDragging: boolean;
}

function StageCard({
  stage,
  onToggleSubTask,
  onEditSubTask,
  onDeleteSubTask,
  onAddSubTask,
  onUpdateSkillScore,
  onToggleExpand,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onDragLeave,
  isDragging,
  dragOverStageId,
  isGlobalDragging,
}: StageCardProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskMinutes, setNewTaskMinutes] = useState(30);

  const progress = getStageProgress(stage);
  const status = getStageStatus(stage);

  const statusClass =
    status === 'completed' ? 'status-completed' : status === 'in_progress' ? 'status-in-progress' : 'status-not-started';

  const handleAddTask = useCallback(() => {
    const trimmed = newTaskTitle.trim();
    if (!trimmed) return;
    const subTask = createSubTask(stage.id, trimmed, newTaskMinutes);
    onAddSubTask(stage.id, subTask);
    setNewTaskTitle('');
    setNewTaskMinutes(30);
  }, [newTaskTitle, newTaskMinutes, stage.id, onAddSubTask]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleAddTask();
    },
    [handleAddTask]
  );

  return (
    <div
      className={`stage-card ${statusClass} ${isDragging ? 'dragging' : ''} ${dragOverStageId === stage.id ? 'drag-over' : ''} ${isGlobalDragging && !isDragging ? 'sibling-dragging' : ''}`}
      draggable
      onDragStart={(e) => onDragStart(e, stage.id)}
      onDragOver={(e) => onDragOver(e, stage.id)}
      onDrop={(e) => onDrop(e, stage.id)}
      onDragEnd={onDragEnd}
      onDragLeave={onDragLeave}
    >
      <div className="stage-header" onClick={() => onToggleExpand(stage.id)}>
        <div className="stage-color-bar" style={{ backgroundColor: stage.color }} />
        <div className="stage-header-content">
          <div className="stage-title-row">
            <span className="stage-order">阶段 {stage.order + 1}</span>
            <h3 className="stage-name">{stage.name}</h3>
            <span className="stage-target">{stage.targetDays}天</span>
            <span className={`stage-status-badge ${statusClass}`}>
              {status === 'completed' ? '已完成' : status === 'in_progress' ? '进行中' : '未开始'}
            </span>
          </div>
          <div className="stage-progress-row">
            <div className="stage-progress-bar">
              <div className="stage-progress-fill" style={{ width: `${progress}%`, backgroundColor: stage.color }} />
            </div>
            <span className="stage-progress-text">{progress}%</span>
          </div>
        </div>
        <span className={`stage-expand-icon ${stage.expanded ? 'expanded' : ''}`}>▼</span>
      </div>

      {stage.expanded && (
        <div className="stage-body">
          <div className="subtask-list">
            {stage.subTasks.map((st) => (
              <SubTaskItem
                key={st.id}
                subTask={st}
                onToggle={(id, actual) => onToggleSubTask(stage.id, id, actual)}
                onEdit={(id, title, est, act) => onEditSubTask(stage.id, id, title, est, act)}
                onDelete={(id) => onDeleteSubTask(stage.id, id)}
              />
            ))}
          </div>

          <div className="add-subtask-row">
            <input
              className="add-subtask-input"
              type="text"
              placeholder="添加子任务..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <input
              className="add-subtask-minutes"
              type="number"
              min={1}
              value={newTaskMinutes}
              onChange={(e) => setNewTaskMinutes(Number(e.target.value))}
              title="预估分钟"
            />
            <span className="minutes-label">分钟</span>
            <button className="add-subtask-btn" onClick={handleAddTask}>
              +
            </button>
          </div>

          <div className="skill-scores-section">
            <h4 className="skill-scores-title">技能评分</h4>
            <div className="skill-scores-grid">
              {stage.skillScores.map((ss) => (
                <div key={ss.id} className="skill-score-item">
                  <span className="skill-score-name">{ss.skillName}</span>
                  <input
                    className="skill-score-slider"
                    type="range"
                    min={0}
                    max={10}
                    step={0.5}
                    value={ss.score}
                    onChange={(e) => onUpdateSkillScore(stage.id, ss.id, Number(e.target.value))}
                  />
                  <span className="skill-score-value">{ss.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StageCard;
