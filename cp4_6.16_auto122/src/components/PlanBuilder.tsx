import { useState, useEffect } from 'react';
import type { Plan, Exercise, PresetExercise } from '../types';
import { PRESET_EXERCISE_LIST } from '../utils/mockData';
import { generateId } from '../utils/helpers';
import './PlanBuilder.css';

interface PlanBuilderProps {
  plan?: Plan;
  onSave: (plan: Omit<Plan, 'id' | 'createdAt'>) => void;
  onCancel?: () => void;
  onDelete?: () => void;
}

const MAX_SLOTS = 8;

export function PlanBuilder({ plan, onSave, onCancel, onDelete }: PlanBuilderProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [exercises, setExercises] = useState<(Exercise | null)[]>(
    Array(MAX_SLOTS).fill(null)
  );
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggedPreset, setDraggedPreset] = useState<PresetExercise | null>(null);

  useEffect(() => {
    if (plan) {
      setName(plan.name);
      setDescription(plan.description);
      const slots: (Exercise | null)[] = Array(MAX_SLOTS).fill(null);
      plan.exercises.forEach((ex) => {
        if (ex.order < MAX_SLOTS) {
          slots[ex.order] = ex;
        }
      });
      setExercises(slots);
    }
  }, [plan]);

  const handlePresetDragStart = (e: React.DragEvent, preset: PresetExercise) => {
    setDraggedPreset(preset);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', preset.id);
  };

  const handlePresetDragEnd = () => {
    setDraggedPreset(null);
  };

  const handleSlotDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleSlotDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleSlotDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = draggedPreset ? 'copy' : 'move';
    setDragOverIndex(index);
  };

  const handleSlotDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleSlotDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (draggedPreset) {
      const newExercise: Exercise = {
        id: generateId(),
        name: draggedPreset.name,
        presetId: draggedPreset.id,
        order: dropIndex,
      };
      const newExercises = [...exercises];
      newExercises[dropIndex] = newExercise;
      newExercises.forEach((ex, i) => {
        if (ex) ex.order = i;
      });
      setExercises(newExercises);
      setDraggedPreset(null);
    } else if (draggedIndex !== null && draggedIndex !== dropIndex) {
      const newExercises = [...exercises];
      const [removed] = newExercises.splice(draggedIndex, 1);
      newExercises.splice(dropIndex, 0, removed);
      newExercises.forEach((ex, i) => {
        if (ex) ex.order = i;
      });
      setExercises(newExercises);
      setDraggedIndex(null);
    }
  };

  const handleRemoveExercise = (index: number) => {
    const newExercises = [...exercises];
    newExercises[index] = null;
    newExercises.forEach((ex, i) => {
      if (ex) ex.order = i;
    });
    setExercises(newExercises);
  };

  const handleSave = () => {
    const validExercises = exercises.filter((ex): ex is Exercise => ex !== null);
    onSave({
      name,
      description,
      exercises: validExercises.map((ex, i) => ({ ...ex, order: i })),
    });
  };

  const validExercises = exercises.filter((ex) => ex !== null);
  const canSave = name.trim() && validExercises.length > 0;

  return (
    <div className="plan-builder">
      <div className="plan-builder-header">
        <h2>{plan ? '编辑计划' : '创建新计划'}</h2>
      </div>

      <div className="plan-builder-body">
        <div className="preset-panel">
          <h3>动作预设库</h3>
          <div className="preset-list">
            {PRESET_EXERCISE_LIST.map((preset) => (
              <div
                key={preset.id}
                className={`preset-card ${draggedPreset?.id === preset.id ? 'dragging' : ''}`}
                draggable
                onDragStart={(e) => handlePresetDragStart(e, preset)}
                onDragEnd={handlePresetDragEnd}
              >
                <span className="preset-name">{preset.name}</span>
                <span className="preset-category">{preset.category}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="build-panel">
          <div className="plan-info">
            <div className="form-group">
              <label>计划名称</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="请输入计划名称"
                className="plan-input"
              />
            </div>
            <div className="form-group">
              <label>计划说明</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="请输入计划说明"
                className="plan-textarea"
                rows={3}
              />
            </div>
          </div>

          <h3>计划槽位（{validExercises.length}/{MAX_SLOTS}）</h3>
          <div className="slot-grid">
            {exercises.map((exercise, index) => (
              <div
                key={index}
                className={`slot ${exercise ? 'filled' : 'empty'} ${
                  dragOverIndex === index ? 'drag-over' : ''
                } ${draggedIndex === index ? 'dragging' : ''}`}
                onDragOver={(e) => handleSlotDragOver(e, index)}
                onDragLeave={handleSlotDragLeave}
                onDrop={(e) => handleSlotDrop(e, index)}
              >
                {exercise ? (
                  <div
                    className="slot-content"
                    draggable
                    onDragStart={(e) => handleSlotDragStart(e, index)}
                    onDragEnd={handleSlotDragEnd}
                  >
                    <span className="slot-order">{index + 1}</span>
                    <span className="slot-name">{exercise.name}</span>
                    <button
                      className="slot-remove"
                      onClick={() => handleRemoveExercise(index)}
                      title="移除"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="slot-placeholder">
                    <span className="slot-add">+ 添加动作</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="plan-builder-footer">
        <div className="footer-left">
          {plan && onDelete && (
            <button className="btn btn-danger" onClick={onDelete}>
              删除计划
            </button>
          )}
        </div>
        <div className="footer-right">
          {onCancel && (
            <button className="btn btn-ghost" onClick={onCancel}>
              取消
            </button>
          )}
          <button className="btn btn-primary" onClick={handleSave} disabled={!canSave}>
            保存计划
          </button>
        </div>
      </div>
    </div>
  );
}
