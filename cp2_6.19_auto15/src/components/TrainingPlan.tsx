import { Droppable, Draggable } from 'react-beautiful-dnd';
import { Trash2 } from 'lucide-react';
import './TrainingPlan.css';

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export type MuscleGroup = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core';

export interface PlannedExercise {
  planId: string;
  actionId: string;
  name: string;
  muscleGroup: MuscleGroup;
  targetSets: number;
  targetReps: number;
  targetWeight: number;
}

export interface WeeklyPlan {
  weekKey: string;
  days: Record<DayOfWeek, PlannedExercise[]>;
}

interface TrainingPlanProps {
  weekKey: string;
  plan: WeeklyPlan;
  onUpdateExercise: (day: DayOfWeek, planId: string, field: keyof PlannedExercise, value: number) => void;
  onRemoveExercise: (day: DayOfWeek, planId: string) => void;
}

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'monday', label: '周一' },
  { key: 'tuesday', label: '周二' },
  { key: 'wednesday', label: '周三' },
  { key: 'thursday', label: '周四' },
  { key: 'friday', label: '周五' },
  { key: 'saturday', label: '周六' },
  { key: 'sunday', label: '周日' },
];

const MUSCLE_COLORS: Record<MuscleGroup, string> = {
  chest: '#e53935',
  back: '#43a047',
  legs: '#fb8c00',
  shoulders: '#8e24aa',
  arms: '#1e88e5',
  core: '#00acc1',
};

export default function TrainingPlan({
  plan,
  onUpdateExercise,
  onRemoveExercise,
}: TrainingPlanProps) {
  const maxExercises = Math.max(...DAYS.map((d) => plan.days[d.key].length), 0);
  const rows = maxExercises === 0 ? 1 : maxExercises;

  return (
    <div className="plan-wrapper">
      <table className="plan-table">
        <thead>
          <tr>
            {DAYS.map((day) => (
              <th key={day.key}>{day.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {DAYS.map((day) => {
                const exercises = plan.days[day.key];
                if (rowIndex === 0) {
                  return (
                    <td key={day.key} rowSpan={rows}>
                      <Droppable droppableId={`day-${day.key}`} type="EXERCISE" direction="vertical">
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`day-cell ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
                          >
                            {exercises.length === 0 ? (
                              <div className="empty-placeholder">拖拽动作到此处</div>
                            ) : (
                              exercises.map((exercise, idx) => (
                                <Draggable
                                  key={`plan-${exercise.planId}`}
                                  draggableId={`plan-${exercise.planId}`}
                                  index={idx}
                                >
                                  {(dragProvided, dragSnapshot) => (
                                    <div
                                      ref={dragProvided.innerRef}
                                      {...dragProvided.draggableProps}
                                      {...dragProvided.dragHandleProps}
                                      className={`planned-card ${dragSnapshot.isDragging ? 'dragging' : ''}`}
                                    >
                                      <div className="planned-card-header">
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                                          <span
                                            style={{
                                              width: '8px',
                                              height: '8px',
                                              borderRadius: '50%',
                                              backgroundColor: MUSCLE_COLORS[exercise.muscleGroup],
                                              flexShrink: 0,
                                            }}
                                          />
                                          <span className="planned-card-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {exercise.name}
                                          </span>
                                        </span>
                                        <button
                                          type="button"
                                          className="remove-btn"
                                          onClick={() => onRemoveExercise(day.key, exercise.planId)}
                                          aria-label="删除动作"
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                      </div>
                                      <div className="params-grid">
                                        <div className="param-group">
                                          <label className="param-label">组</label>
                                          <input
                                            type="number"
                                            className="param-input"
                                            value={exercise.targetSets}
                                            min={0}
                                            onChange={(e) =>
                                              onUpdateExercise(
                                                day.key,
                                                exercise.planId,
                                                'targetSets',
                                                Number(e.target.value) || 0
                                              )
                                            }
                                          />
                                        </div>
                                        <div className="param-group">
                                          <label className="param-label">次</label>
                                          <input
                                            type="number"
                                            className="param-input"
                                            value={exercise.targetReps}
                                            min={0}
                                            onChange={(e) =>
                                              onUpdateExercise(
                                                day.key,
                                                exercise.planId,
                                                'targetReps',
                                                Number(e.target.value) || 0
                                              )
                                            }
                                          />
                                        </div>
                                        <div className="param-group">
                                          <label className="param-label">kg</label>
                                          <input
                                            type="number"
                                            className="param-input"
                                            value={exercise.targetWeight}
                                            min={0}
                                            step={0.5}
                                            onChange={(e) =>
                                              onUpdateExercise(
                                                day.key,
                                                exercise.planId,
                                                'targetWeight',
                                                Number(e.target.value) || 0
                                              )
                                            }
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))
                            )}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </td>
                  );
                }
                return null;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
