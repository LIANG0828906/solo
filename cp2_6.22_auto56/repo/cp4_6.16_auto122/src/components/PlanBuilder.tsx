import { useState, useEffect, useRef, useCallback } from 'react';
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
const FLIP_DURATION = 250;

interface Rect {
  left: number;
  top: number;
}

export function PlanBuilder({ plan, onSave, onCancel, onDelete }: PlanBuilderProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [exercises, setExercises] = useState<(Exercise | null)[]>(
    Array(MAX_SLOTS).fill(null)
  );
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggedPreset, setDraggedPreset] = useState<PresetExercise | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [liveExercises, setLiveExercises] = useState<(Exercise | null)[] | null>(null);

  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const firstRectsRef = useRef<Map<number, Rect>>(new Map());
  const animFrameRef = useRef<number | null>(null);
  const animTimeoutRef = useRef<number | null>(null);
  const prevDragOverRef = useRef<number | null>(null);

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

  useEffect(() => {
    return () => {
      if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current);
      if (animTimeoutRef.current !== null) window.clearTimeout(animTimeoutRef.current);
    };
  }, []);

  const recordFirstRects = useCallback(() => {
    firstRectsRef.current.clear();
    slotRefs.current.forEach((el, index) => {
      if (el) {
        const rect = el.getBoundingClientRect();
        firstRectsRef.current.set(index, { left: rect.left, top: rect.top });
      }
    });
  }, []);

  const playFlipAnimation = useCallback((callback?: () => void) => {
    animFrameRef.current = requestAnimationFrame(() => {
      slotRefs.current.forEach((el, index) => {
        if (!el) return;
        const firstRect = firstRectsRef.current.get(index);
        if (!firstRect) return;

        const lastRect = el.getBoundingClientRect();
        const deltaX = firstRect.left - lastRect.left;
        const deltaY = firstRect.top - lastRect.top;

        if (deltaX === 0 && deltaY === 0) return;

        el.style.transition = 'none';
        el.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        el.style.zIndex = '10';
      });

      animFrameRef.current = requestAnimationFrame(() => {
        slotRefs.current.forEach((el) => {
          if (!el) return;
          el.style.transition = `transform ${FLIP_DURATION}ms cubic-bezier(0.2, 0, 0, 1)`;
          el.style.transform = 'translate(0, 0)';
        });

        animTimeoutRef.current = window.setTimeout(() => {
          slotRefs.current.forEach((el) => {
            if (!el) return;
            el.style.transition = '';
            el.style.transform = '';
            el.style.zIndex = '';
          });
          setIsAnimating(false);
          if (callback) callback();
        }, FLIP_DURATION + 20);
      });
    });
  }, []);

  const handlePresetDragStart = (e: React.DragEvent, preset: PresetExercise) => {
    if (isAnimating) { e.preventDefault(); return; }
    recordFirstRects();
    setDraggedPreset(preset);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', preset.id);
  };

  const handlePresetDragEnd = () => {
    setDraggedPreset(null);
    setDragOverIndex(null);
    setLiveExercises(null);
    prevDragOverRef.current = null;
  };

  const handleSlotDragStart = (e: React.DragEvent, index: number) => {
    if (isAnimating) { e.preventDefault(); return; }
    recordFirstRects();
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleSlotDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    setLiveExercises(null);
    prevDragOverRef.current = null;
  };

  const handleSlotDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = draggedPreset ? 'copy' : 'move';

    if (prevDragOverRef.current === index) return;
    prevDragOverRef.current = index;
    setDragOverIndex(index);

    if (draggedIndex !== null && draggedIndex !== index && !isAnimating) {
      recordFirstRects();

      const preview = [...exercises];
      const [removed] = preview.splice(draggedIndex, 1);
      preview.splice(index, 0, removed);
      preview.forEach((ex, i) => { if (ex) ex.order = i; });
      setLiveExercises(preview);

      requestAnimationFrame(() => {
        playFlipAnimation();
      });
    }
  };

  const handleSlotDragLeave = () => {
    setDragOverIndex(null);
    if (draggedIndex !== null) {
      setLiveExercises(null);
      prevDragOverRef.current = null;
    }
  };

  const handleSlotDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    prevDragOverRef.current = null;

    if (draggedPreset) {
      recordFirstRects();
      setIsAnimating(true);
      const newExercise: Exercise = {
        id: generateId(),
        name: draggedPreset.name,
        presetId: draggedPreset.id,
        order: dropIndex,
      };
      const newExercises = [...exercises];
      newExercises[dropIndex] = newExercise;
      newExercises.forEach((ex, i) => { if (ex) ex.order = i; });
      setExercises(newExercises);
      setDraggedPreset(null);
      setLiveExercises(null);

      requestAnimationFrame(() => playFlipAnimation());
    } else if (draggedIndex !== null && draggedIndex !== dropIndex) {
      const committed = [...(liveExercises || exercises)];
      committed.forEach((ex, i) => { if (ex) ex.order = i; });
      setExercises(committed);
      setDraggedIndex(null);
      setLiveExercises(null);
      setIsAnimating(false);
    } else {
      setDraggedIndex(null);
      setLiveExercises(null);
    }
  };

  const handleRemoveExercise = (index: number) => {
    if (isAnimating) return;
    recordFirstRects();
    setIsAnimating(true);

    const newExercises = [...exercises];
    newExercises[index] = null;
    newExercises.forEach((ex, i) => { if (ex) ex.order = i; });
    setExercises(newExercises);

    requestAnimationFrame(() => playFlipAnimation());
  };

  const handleSave = () => {
    const validExercises = exercises.filter((ex): ex is Exercise => ex !== null);
    onSave({
      name,
      description,
      exercises: validExercises.map((ex, i) => ({ ...ex, order: i })),
    });
  };

  const displayExercises = liveExercises || exercises;
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
                draggable={!isAnimating}
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
            {displayExercises.map((exercise, index) => (
              <div
                key={`slot-${index}`}
                ref={(el) => { slotRefs.current[index] = el; }}
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
                    draggable={!isAnimating}
                    onDragStart={(e) => handleSlotDragStart(e, index)}
                    onDragEnd={handleSlotDragEnd}
                  >
                    <span className="slot-order">{index + 1}</span>
                    <span className="slot-name">{exercise.name}</span>
                    <button
                      className="slot-remove"
                      onClick={() => handleRemoveExercise(index)}
                      title="移除"
                      disabled={isAnimating}
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
            <button className="btn btn-danger" onClick={onDelete} disabled={isAnimating}>
              删除计划
            </button>
          )}
        </div>
        <div className="footer-right">
          {onCancel && (
            <button className="btn btn-ghost" onClick={onCancel} disabled={isAnimating}>
              取消
            </button>
          )}
          <button className="btn btn-primary" onClick={handleSave} disabled={!canSave || isAnimating}>
            保存计划
          </button>
        </div>
      </div>
    </div>
  );
}
