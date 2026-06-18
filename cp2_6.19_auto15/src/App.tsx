import { useState, useMemo, useCallback } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from 'react-beautiful-dnd';
import { v4 as uuidv4 } from 'uuid';
import {
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Trash2,
  Edit3,
  Check,
  Plus,
  TrendingUp,
  Calendar,
  X,
  Target,
} from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'legs'
  | 'shoulders'
  | 'arms'
  | 'core';

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface ExerciseAction {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  imagePlaceholder: string;
}

export interface PlannedExercise {
  planId: string;
  actionId: string;
  name: string;
  muscleGroup: MuscleGroup;
  targetSets: number;
  targetReps: number;
  targetWeight: number;
}

export interface LoggedSet {
  setNumber: number;
  actualReps: number;
  actualWeight: number;
}

export interface TrainingLogEntry {
  logId: string;
  planId: string;
  actionId: string;
  day: DayOfWeek;
  weekKey: string;
  loggedSets: LoggedSet[];
  completedAt?: string;
}

export interface WeeklyPlan {
  weekKey: string;
  days: Record<DayOfWeek, PlannedExercise[]>;
}

const DAYS: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const DAY_NAMES: Record<DayOfWeek, string> = {
  monday: '周一',
  tuesday: '周二',
  wednesday: '周三',
  thursday: '周四',
  friday: '周五',
  saturday: '周六',
  sunday: '周日',
};

const MUSCLE_NAMES: Record<MuscleGroup, string> = {
  chest: '胸部',
  back: '背部',
  legs: '腿部',
  shoulders: '肩部',
  arms: '手臂',
  core: '核心',
};

const MUSCLE_COLORS: Record<MuscleGroup, string> = {
  chest: 'var(--muscle-chest)',
  back: 'var(--muscle-back)',
  legs: 'var(--muscle-legs)',
  shoulders: 'var(--muscle-shoulders)',
  arms: 'var(--muscle-arms)',
  core: 'var(--muscle-core)',
};

const PRESET_ACTIONS: ExerciseAction[] = [
  { id: 'act-001', name: '杠铃卧推', muscleGroup: 'chest', imagePlaceholder: '💪' },
  { id: 'act-002', name: '哑铃卧推', muscleGroup: 'chest', imagePlaceholder: '🏋️' },
  { id: 'act-003', name: '上斜哑铃飞鸟', muscleGroup: 'chest', imagePlaceholder: '🦅' },
  { id: 'act-004', name: '引体向上', muscleGroup: 'back', imagePlaceholder: '🧗' },
  { id: 'act-005', name: '杠铃划船', muscleGroup: 'back', imagePlaceholder: '🚣' },
  { id: 'act-006', name: '硬拉', muscleGroup: 'back', imagePlaceholder: '🦾' },
  { id: 'act-007', name: '高位下拉', muscleGroup: 'back', imagePlaceholder: '⬇️' },
  { id: 'act-008', name: '深蹲', muscleGroup: 'legs', imagePlaceholder: '🦵' },
  { id: 'act-009', name: '腿举', muscleGroup: 'legs', imagePlaceholder: '🦿' },
  { id: 'act-010', name: '罗马尼亚硬拉', muscleGroup: 'legs', imagePlaceholder: '🏋️‍♀️' },
  { id: 'act-011', name: '坐姿推举', muscleGroup: 'shoulders', imagePlaceholder: '🙆' },
  { id: 'act-012', name: '哑铃侧平举', muscleGroup: 'shoulders', imagePlaceholder: '🤸' },
  { id: 'act-013', name: '杠铃二头弯举', muscleGroup: 'arms', imagePlaceholder: '💪' },
  { id: 'act-014', name: '三头肌下压', muscleGroup: 'arms', imagePlaceholder: '🔽' },
  { id: 'act-015', name: '平板支撑', muscleGroup: 'core', imagePlaceholder: '🧘' },
  { id: 'act-016', name: '卷腹', muscleGroup: 'core', imagePlaceholder: '🔄' },
  { id: 'act-017', name: '俄罗斯转体', muscleGroup: 'core', imagePlaceholder: '🌀' },
];

function getWeekKey(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, '0');
  const dayNum = String(monday.getDate()).padStart(2, '0');
  return `${year}-${month}-${dayNum}`;
}

function addDaysToDate(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const dayNum = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${dayNum}`;
}

function createEmptyWeek(weekKey: string): WeeklyPlan {
  const days = {} as Record<DayOfWeek, PlannedExercise[]>;
  for (const day of DAYS) {
    days[day] = [];
  }
  return { weekKey, days };
}

function formatWeekRange(weekKey: string): string {
  const start = new Date(weekKey);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date) =>
    `${d.getMonth() + 1}月${d.getDate()}日`;
  return `${fmt(start)} - ${fmt(end)}`;
}

interface ActionLibraryProps {
  actions: ExerciseAction[];
}

function ActionLibrary({ actions }: ActionLibraryProps) {
  const grouped = useMemo(() => {
    const result: Record<MuscleGroup, ExerciseAction[]> = {
      chest: [],
      back: [],
      legs: [],
      shoulders: [],
      arms: [],
      core: [],
    };
    for (const a of actions) {
      result[a.muscleGroup].push(a);
    }
    return result;
  }, [actions]);

  return (
    <div
      style={{
        background: 'var(--color-bg-card)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-md)',
        padding: 20,
        height: '100%',
        overflow: 'auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 16,
        }}
      >
        <Dumbbell size={22} color="var(--muscle-legs)" />
        <h2
          style={{
            fontSize: 'var(--font-lg)',
            fontWeight: 'var(--font-weight-semibold)',
          }}
        >
          动作库
        </h2>
      </div>

      <Droppable droppableId="action-library" isDropDisabled>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            {(Object.keys(grouped) as MuscleGroup[]).map((mg) => (
              <div key={mg}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: MUSCLE_COLORS[mg],
                      boxShadow: `0 0 0 3px ${MUSCLE_COLORS[mg]}33`,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 'var(--font-sm)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    {MUSCLE_NAMES[mg]}
                  </span>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: 8,
                  }}
                >
                  {grouped[mg].map((action, idx) => (
                    <Draggable
                      key={action.id}
                      draggableId={`action:${action.id}`}
                      index={idx}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{
                            ...provided.draggableProps.style,
                            padding: '10px 12px',
                            borderRadius: 'var(--radius-sm)',
                            background: snapshot.isDragging
                              ? `${MUSCLE_COLORS[action.muscleGroup]}22`
                              : 'var(--color-bg-primary)',
                            border: `1px solid ${
                              snapshot.isDragging
                                ? MUSCLE_COLORS[action.muscleGroup]
                                : 'var(--color-border)'
                            }`,
                            cursor: 'grab',
                            userSelect: 'none',
                            transition: 'all 0.15s ease',
                            fontSize: 'var(--font-sm)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <span style={{ fontSize: 16 }}>
                            {action.imagePlaceholder}
                          </span>
                          <span
                            style={{
                              fontWeight: 'var(--font-weight-medium)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {action.name}
                          </span>
                        </div>
                      )}
                    </Draggable>
                  ))}
                </div>
              </div>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

interface TrainingPlanProps {
  weekKey: string;
  weeklyPlan: WeeklyPlan;
  onUpdatePlannedExercise: (
    day: DayOfWeek,
    planId: string,
    field: 'targetSets' | 'targetReps' | 'targetWeight',
    value: number
  ) => void;
  onRemovePlannedExercise: (day: DayOfWeek, planId: string) => void;
  onStartLogging: (exercise: PlannedExercise, day: DayOfWeek) => void;
}

function TrainingPlan({
  weekKey,
  weeklyPlan,
  onUpdatePlannedExercise,
  onRemovePlannedExercise,
  onStartLogging,
}: TrainingPlanProps) {
  return (
    <div
      style={{
        background: 'var(--color-bg-card)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-md)',
        padding: 20,
        height: '100%',
        overflow: 'auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={22} color="var(--muscle-back)" />
          <h2
            style={{
              fontSize: 'var(--font-lg)',
              fontWeight: 'var(--font-weight-semibold)',
            }}
          >
            周训练计划
          </h2>
        </div>
        <span
          style={{
            fontSize: 'var(--font-sm)',
            color: 'var(--color-text-muted)',
          }}
        >
          {formatWeekRange(weekKey)}
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 10,
        }}
      >
        {DAYS.map((day) => (
          <div
            key={day}
            style={{
              display: 'flex',
              flexDirection: 'column',
              minHeight: 120,
            }}
          >
            <div
              style={{
                padding: '8px 10px',
                background: 'var(--color-bg-primary)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: 8,
                textAlign: 'center',
                fontSize: 'var(--font-sm)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text-secondary)',
              }}
            >
              {DAY_NAMES[day]}
            </div>

            <Droppable droppableId={`plan:${day}`}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  style={{
                    flex: 1,
                    padding: 6,
                    minHeight: 100,
                    borderRadius: 'var(--radius-sm)',
                    background: snapshot.isDraggingOver
                      ? 'var(--muscle-legs)15'
                      : 'transparent',
                    border: `1px dashed ${
                      snapshot.isDraggingOver
                        ? 'var(--muscle-legs)'
                        : 'var(--color-border)'
                    }`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {weeklyPlan.days[day].map((ex, idx) => (
                    <Draggable
                      key={ex.planId}
                      draggableId={`plan:${day}:${ex.planId}`}
                      index={idx}
                    >
                      {(p, s) => (
                        <div
                          ref={p.innerRef}
                          {...p.draggableProps}
                          {...p.dragHandleProps}
                          className="animate-bounce-in"
                          style={{
                            ...p.draggableProps.style,
                            padding: 10,
                            borderRadius: 'var(--radius-sm)',
                            background: s.isDragging
                              ? '#fff'
                              : 'var(--color-bg-primary)',
                            border: `2px solid ${MUSCLE_COLORS[ex.muscleGroup]}`,
                            boxShadow: s.isDragging
                              ? 'var(--shadow-lg)'
                              : 'var(--shadow-sm)',
                            fontSize: 'var(--font-xs)',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginBottom: 6,
                            }}
                          >
                            <span
                              style={{
                                fontWeight: 'var(--font-weight-semibold)',
                                fontSize: 'var(--font-sm)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: 80,
                              }}
                            >
                              {ex.name}
                            </span>
                            <button
                              onClick={() =>
                                onRemovePlannedExercise(day, ex.planId)
                              }
                              style={{
                                color: 'var(--color-text-muted)',
                                padding: 2,
                                borderRadius: 4,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                              title="删除"
                            >
                              <X size={12} />
                            </button>
                          </div>

                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(3, 1fr)',
                              gap: 4,
                              marginBottom: 6,
                            }}
                          >
                            {(
                              [
                                ['targetSets', '组'],
                                ['targetReps', '次'],
                                ['targetWeight', 'kg'],
                              ] as const
                            ).map(([field, label]) => (
                              <div
                                key={field}
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  background: '#fff',
                                  borderRadius: 4,
                                  padding: '4px 2px',
                                  border: '1px solid var(--color-border)',
                                }}
                              >
                                <input
                                  type="number"
                                  min={0}
                                  value={ex[field]}
                                  onChange={(e) =>
                                    onUpdatePlannedExercise(
                                      day,
                                      ex.planId,
                                      field,
                                      Number(e.target.value) || 0
                                    )
                                  }
                                  style={{
                                    width: '100%',
                                    border: 'none',
                                    outline: 'none',
                                    textAlign: 'center',
                                    fontSize: 'var(--font-sm)',
                                    fontWeight: 'var(--font-weight-semibold)',
                                    background: 'transparent',
                                  }}
                                />
                                <span
                                  style={{
                                    fontSize: 10,
                                    color: 'var(--color-text-muted)',
                                  }}
                                >
                                  {label}
                                </span>
                              </div>
                            ))}
                          </div>

                          <button
                            onClick={() => onStartLogging(ex, day)}
                            style={{
                              width: '100%',
                              padding: '4px 6px',
                              borderRadius: 4,
                              background: 'var(--muscle-shoulders)',
                              color: '#1a3a2a',
                              fontSize: 'var(--font-xs)',
                              fontWeight: 'var(--font-weight-semibold)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 4,
                            }}
                          >
                            <Edit3 size={11} />
                            记录
                          </button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </div>
  );
}

interface TrainingLogProps {
  weekKey: string;
  logs: TrainingLogEntry[];
  weeklyPlan: WeeklyPlan;
  activeLog: {
    entry: TrainingLogEntry | null;
    day: DayOfWeek;
    exercise: PlannedExercise | null;
  } | null;
  onAddSet: (logId: string) => void;
  onUpdateSet: (
    logId: string,
    setNumber: number,
    field: 'actualReps' | 'actualWeight',
    value: number
  ) => void;
  onRemoveSet: (logId: string, setNumber: number) => void;
  onCompleteLog: (logId: string) => void;
  onCancelLog: () => void;
  onDeleteLog: (logId: string) => void;
}

function TrainingLog({
  weekKey,
  logs,
  weeklyPlan,
  activeLog,
  onAddSet,
  onUpdateSet,
  onRemoveSet,
  onCompleteLog,
  onCancelLog,
  onDeleteLog,
}: TrainingLogProps) {
  const weekLogs = logs.filter((l) => l.weekKey === weekKey);

  const totalVolume = weekLogs.reduce((sum, log) => {
    return (
      sum +
      log.loggedSets.reduce(
        (s, set) => s + set.actualReps * set.actualWeight,
        0
      )
    );
  }, 0);

  const totalSets = weekLogs.reduce(
    (sum, log) => sum + log.loggedSets.length,
    0
  );

  return (
    <div
      style={{
        background: 'var(--color-bg-card)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-md)',
        padding: 20,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingUp size={22} color="var(--muscle-chest)" />
          <h2
            style={{
              fontSize: 'var(--font-lg)',
              fontWeight: 'var(--font-weight-semibold)',
            }}
          >
            训练日志
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              background: 'var(--muscle-chest)20',
              borderRadius: 20,
            }}
          >
            <Target size={14} color="var(--muscle-chest)" />
            <span
              style={{
                fontSize: 'var(--font-sm)',
                fontWeight: 'var(--font-weight-medium)',
              }}
            >
              {totalSets} 组
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              background: 'var(--muscle-legs)20',
              borderRadius: 20,
            }}
          >
            <Dumbbell size={14} color="var(--muscle-legs)" />
            <span
              style={{
                fontSize: 'var(--font-sm)',
                fontWeight: 'var(--font-weight-medium)',
              }}
            >
              {totalVolume.toFixed(0)} kg 总量
            </span>
          </div>
        </div>
      </div>

      {activeLog?.entry && activeLog.exercise ? (
        <div
          className="animate-slide-up"
          style={{
            padding: 16,
            background: 'var(--color-bg-primary)',
            borderRadius: 'var(--radius-md)',
            border: `2px solid ${MUSCLE_COLORS[activeLog.exercise.muscleGroup]}`,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: MUSCLE_COLORS[activeLog.exercise.muscleGroup],
                }}
              />
              <span
                style={{
                  fontWeight: 'var(--font-weight-semibold)',
                  fontSize: 'var(--font-lg)',
                }}
              >
                {activeLog.exercise.name}
              </span>
              <span
                style={{
                  fontSize: 'var(--font-sm)',
                  color: 'var(--color-text-muted)',
                }}
              >
                {DAY_NAMES[activeLog.day]} · 目标 {activeLog.exercise.targetSets}×
                {activeLog.exercise.targetReps} @ {activeLog.exercise.targetWeight}kg
              </span>
            </div>
            <button
              onClick={onCancelLog}
              style={{
                color: 'var(--color-text-muted)',
                padding: 4,
                borderRadius: 6,
              }}
            >
              <X size={18} />
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '60px 1fr 1fr 40px',
              gap: 8,
              marginBottom: 12,
              padding: '6px 8px',
              background: 'var(--color-bg-card)',
              borderRadius: 6,
              fontSize: 'var(--font-xs)',
              color: 'var(--color-text-muted)',
              fontWeight: 'var(--font-weight-semibold)',
            }}
          >
            <div style={{ textAlign: 'center' }}>组号</div>
            <div style={{ textAlign: 'center' }}>实际次数</div>
            <div style={{ textAlign: 'center' }}>实际重量 (kg)</div>
            <div />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {activeLog.entry.loggedSets.length === 0 && (
              <div
                style={{
                  padding: 16,
                  textAlign: 'center',
                  color: 'var(--color-text-muted)',
                  fontSize: 'var(--font-sm)',
                }}
              >
                还没有记录组数，点击下方按钮添加第一组
              </div>
            )}
            {activeLog.entry.loggedSets.map((set, idx) => (
              <div
                key={set.setNumber}
                className="animate-fade-in"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '60px 1fr 1fr 40px',
                  gap: 8,
                  alignItems: 'center',
                  padding: '6px 8px',
                  background: 'var(--color-bg-card)',
                  borderRadius: 6,
                  border: idx === activeLog.entry!.loggedSets.length - 1 ? `2px solid ${MUSCLE_COLORS[activeLog.exercise!.muscleGroup]}` : '1px solid var(--color-border)',
                }}
              >
                <div
                  style={{
                    textAlign: 'center',
                    fontWeight: 'var(--font-weight-semibold)',
                    fontSize: 'var(--font-sm)',
                  }}
                >
                  #{set.setNumber}
                </div>
                <input
                  type="number"
                  min={0}
                  value={set.actualReps}
                  onChange={(e) =>
                    onUpdateSet(
                      activeLog.entry!.logId,
                      set.setNumber,
                      'actualReps',
                      Number(e.target.value) || 0
                    )
                  }
                  style={{
                    padding: '6px 8px',
                    borderRadius: 4,
                    border: '1px solid var(--color-border)',
                    outline: 'none',
                    textAlign: 'center',
                    fontSize: 'var(--font-sm)',
                  }}
                  placeholder="次数"
                />
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={set.actualWeight}
                  onChange={(e) =>
                    onUpdateSet(
                      activeLog.entry!.logId,
                      set.setNumber,
                      'actualWeight',
                      Number(e.target.value) || 0
                    )
                  }
                  style={{
                    padding: '6px 8px',
                    borderRadius: 4,
                    border: '1px solid var(--color-border)',
                    outline: 'none',
                    textAlign: 'center',
                    fontSize: 'var(--font-sm)',
                  }}
                  placeholder="kg"
                />
                <button
                  onClick={() =>
                    onRemoveSet(activeLog.entry!.logId, set.setNumber)
                  }
                  style={{
                    color: 'var(--muscle-chest)',
                    padding: 4,
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              gap: 8,
              marginTop: 14,
              justifyContent: 'flex-end',
            }}
          >
            <button
              onClick={() => onAddSet(activeLog.entry!.logId)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                borderRadius: 8,
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                fontSize: 'var(--font-sm)',
                fontWeight: 'var(--font-weight-medium)',
              }}
            >
              <Plus size={14} />
              添加组
            </button>
            <button
              onClick={() => onCompleteLog(activeLog.entry!.logId)}
              className="animate-pulse-glow"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 20px',
                borderRadius: 8,
                background: 'var(--muscle-shoulders)',
                color: '#1a3a2a',
                fontSize: 'var(--font-sm)',
                fontWeight: 'var(--font-weight-semibold)',
              }}
            >
              <Check size={14} />
              完成记录
            </button>
          </div>
        </div>
      ) : null}

      {weekLogs.length === 0 ? (
        <div
          style={{
            padding: 32,
            textAlign: 'center',
            color: 'var(--color-text-muted)',
            fontSize: 'var(--font-sm)',
            background: 'var(--color-bg-primary)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          本周还没有训练记录。点击训练计划中动作的「记录」按钮开始记录。
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 12,
          }}
        >
          {weekLogs.map((log) => {
            const ex = DAYS.flatMap((d) => weeklyPlan.days[d]).find(
              (p) => p.planId === log.planId
            );
            const vol = log.loggedSets.reduce(
              (s, set) => s + set.actualReps * set.actualWeight,
              0
            );
            return (
              <div
                key={log.logId}
                className="animate-slide-up"
                style={{
                  padding: 14,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-bg-primary)',
                  border: `1px solid ${
                    ex ? MUSCLE_COLORS[ex.muscleGroup] : 'var(--color-border)'
                  }`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: ex
                          ? MUSCLE_COLORS[ex.muscleGroup]
                          : 'var(--color-text-muted)',
                      }}
                    />
                    <span
                      style={{
                        fontWeight: 'var(--font-weight-semibold)',
                        fontSize: 'var(--font-md)',
                      }}
                    >
                      {ex?.name || '已删除动作'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        fontSize: 'var(--font-xs)',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      {DAY_NAMES[log.day]}
                    </span>
                    <button
                      onClick={() => onDeleteLog(log.logId)}
                      style={{
                        color: 'var(--color-text-muted)',
                        padding: 2,
                        borderRadius: 4,
                      }}
                      title="删除"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 6,
                    marginBottom: 8,
                  }}
                >
                  {log.loggedSets.map((s) => (
                    <span
                      key={s.setNumber}
                      style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: 'var(--color-bg-card)',
                        fontSize: 'var(--font-xs)',
                        fontWeight: 'var(--font-weight-medium)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      #{s.setNumber} {s.actualReps}×{s.actualWeight}kg
                    </span>
                  ))}
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 'var(--font-xs)',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  <span>{log.loggedSets.length} 组</span>
                  <span>总量 {vol.toFixed(0)} kg</span>
                  {log.completedAt && (
                    <span>
                      {new Date(log.completedAt).toLocaleTimeString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [actions, setActions] = useLocalStorage<ExerciseAction[]>(
    'fitplan:actions',
    PRESET_ACTIONS
  );
  const [weeklyPlans, setWeeklyPlans] = useLocalStorage<Record<string, WeeklyPlan>>(
    'fitplan:weeklyPlans',
    {}
  );
  const [trainingLogs, setTrainingLogs] = useLocalStorage<TrainingLogEntry[]>(
    'fitplan:trainingLogs',
    []
  );
  const [currentWeek, setCurrentWeek] = useLocalStorage<string>(
    'fitplan:currentWeek',
    getWeekKey(new Date())
  );

  const [activeLog, setActiveLog] = useState<{
    entry: TrainingLogEntry | null;
    day: DayOfWeek;
    exercise: PlannedExercise | null;
  } | null>(null);

  const currentWeeklyPlan = useMemo<WeeklyPlan>(() => {
    return weeklyPlans[currentWeek] || createEmptyWeek(currentWeek);
  }, [weeklyPlans, currentWeek]);

  const saveWeeklyPlan = useCallback(
    (weekKey: string, plan: WeeklyPlan) => {
      setWeeklyPlans((prev: Record<string, WeeklyPlan>) => ({ ...prev, [weekKey]: plan }));
    },
    [setWeeklyPlans]
  );

  const prevWeek = useCallback(() => {
    setCurrentWeek(addDaysToDate(currentWeek, -7));
    setActiveLog(null);
  }, [currentWeek, setCurrentWeek]);

  const nextWeek = useCallback(() => {
    setCurrentWeek(addDaysToDate(currentWeek, 7));
    setActiveLog(null);
  }, [currentWeek, setCurrentWeek]);

  const updatePlannedExercise = useCallback(
    (
      day: DayOfWeek,
      planId: string,
      field: 'targetSets' | 'targetReps' | 'targetWeight',
      value: number
    ) => {
      const plan = weeklyPlans[currentWeek] || createEmptyWeek(currentWeek);
      const newDays = { ...plan.days };
      newDays[day] = newDays[day].map((ex: PlannedExercise) =>
        ex.planId === planId ? { ...ex, [field]: value } : ex
      );
      saveWeeklyPlan(currentWeek, { ...plan, days: newDays });
    },
    [weeklyPlans, currentWeek, saveWeeklyPlan]
  );

  const removePlannedExercise = useCallback(
    (day: DayOfWeek, planId: string) => {
      const plan = weeklyPlans[currentWeek] || createEmptyWeek(currentWeek);
      const newDays = { ...plan.days };
      newDays[day] = newDays[day].filter((ex: PlannedExercise) => ex.planId !== planId);
      saveWeeklyPlan(currentWeek, { ...plan, days: newDays });
    },
    [weeklyPlans, currentWeek, saveWeeklyPlan]
  );

  const updateTrainingLog = useCallback(
    (logId: string, updater: (log: TrainingLogEntry) => TrainingLogEntry) => {
      setTrainingLogs((prev: TrainingLogEntry[]) =>
        prev.map((l: TrainingLogEntry) => (l.logId === logId ? updater(l) : l))
      );
      setActiveLog((prev) => {
        if (!prev?.entry || prev.entry.logId !== logId) return prev;
        return { ...prev, entry: updater(prev.entry) };
      });
    },
    [setTrainingLogs]
  );

  const addTrainingLog = useCallback(
    (entry: TrainingLogEntry) => {
      setTrainingLogs((prev: TrainingLogEntry[]) => [...prev, entry]);
    },
    [setTrainingLogs]
  );

  const onDragEnd = useCallback(
    (result: DropResult) => {
      const { source, destination } = result;
      if (!destination) return;

      const plan = weeklyPlans[currentWeek] || createEmptyWeek(currentWeek);
      const newDays = { ...plan.days };

      if (source.droppableId === 'action-library') {
        const destDay = destination.droppableId.replace('plan:', '') as DayOfWeek;
        const actionId = result.draggableId.replace('action:', '');
        const action = actions.find((a: ExerciseAction) => a.id === actionId);
        if (!action) return;

        const newExercise: PlannedExercise = {
          planId: uuidv4(),
          actionId: action.id,
          name: action.name,
          muscleGroup: action.muscleGroup,
          targetSets: 4,
          targetReps: 10,
          targetWeight: 20,
        };

        const newList = [...newDays[destDay]];
        const insertIndex = Math.min(destination.index, newList.length);
        newList.splice(insertIndex, 0, newExercise);
        newDays[destDay] = newList;
        saveWeeklyPlan(currentWeek, { ...plan, days: newDays });
        return;
      }

      if (source.droppableId.startsWith('plan:')) {
        const srcDay = source.droppableId.replace('plan:', '') as DayOfWeek;
        const destDay = destination.droppableId.replace('plan:', '') as DayOfWeek;

        const srcList = [...newDays[srcDay]];
        const [moved] = srcList.splice(source.index, 1);
        newDays[srcDay] = srcList;

        if (moved) {
          const destList = [...newDays[destDay]];
          const insertIndex = Math.min(destination.index, destList.length);
          destList.splice(insertIndex, 0, moved);
          newDays[destDay] = destList;
        }

        saveWeeklyPlan(currentWeek, { ...plan, days: newDays });
      }
    },
    [weeklyPlans, currentWeek, actions, saveWeeklyPlan]
  );

  const startLogging = useCallback(
    (exercise: PlannedExercise, day: DayOfWeek) => {
      let existing = trainingLogs.find(
        (l: TrainingLogEntry) => l.planId === exercise.planId && l.weekKey === currentWeek
      );
      if (!existing) {
        existing = {
          logId: uuidv4(),
          planId: exercise.planId,
          actionId: exercise.actionId,
          day,
          weekKey: currentWeek,
          loggedSets: [],
        };
        addTrainingLog(existing);
      }
      setActiveLog({ entry: existing, day, exercise });
    },
    [trainingLogs, currentWeek, addTrainingLog]
  );

  const addSet = useCallback(
    (logId: string) => {
      updateTrainingLog(logId, (log) => {
        const setNumber = log.loggedSets.length + 1;
        return {
          ...log,
          loggedSets: [
            ...log.loggedSets,
            { setNumber, actualReps: 0, actualWeight: 0 },
          ],
        };
      });
    },
    [updateTrainingLog]
  );

  const updateSet = useCallback(
    (
      logId: string,
      setNumber: number,
      field: 'actualReps' | 'actualWeight',
      value: number
    ) => {
      updateTrainingLog(logId, (log) => ({
        ...log,
        loggedSets: log.loggedSets.map((s) =>
          s.setNumber === setNumber ? { ...s, [field]: value } : s
        ),
      }));
    },
    [updateTrainingLog]
  );

  const removeSet = useCallback(
    (logId: string, setNumber: number) => {
      updateTrainingLog(logId, (log) => {
        const filtered = log.loggedSets
          .filter((s) => s.setNumber !== setNumber)
          .map((s, i) => ({ ...s, setNumber: i + 1 }));
        return { ...log, loggedSets: filtered };
      });
    },
    [updateTrainingLog]
  );

  const completeLog = useCallback(
    (logId: string) => {
      updateTrainingLog(logId, (log) => ({
        ...log,
        completedAt: new Date().toISOString(),
      }));
      setActiveLog(null);
    },
    [updateTrainingLog]
  );

  const cancelLog = useCallback(() => {
    setActiveLog(null);
  }, []);

  const deleteLog = useCallback(
    (logId: string) => {
      setTrainingLogs((prev: TrainingLogEntry[]) => prev.filter((l: TrainingLogEntry) => l.logId !== logId));
      if (activeLog?.entry?.logId === logId) {
        setActiveLog(null);
      }
    },
    [setTrainingLogs, activeLog]
  );

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <nav
          style={{
            background: 'var(--color-bg-card)',
            boxShadow: 'var(--shadow-md)',
            padding: '16px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 20,
            borderBottom: '1px solid var(--color-border)',
            position: 'sticky',
            top: 0,
            zIndex: 100,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background:
                  'linear-gradient(135deg, var(--muscle-legs), var(--muscle-shoulders))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <Dumbbell size={24} color="#fff" />
            </div>
            <div>
              <h1
                style={{
                  fontSize: 'var(--font-xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  background:
                    'linear-gradient(135deg, var(--muscle-legs), var(--muscle-chest))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                FitPlan Pro
              </h1>
              <p
                style={{
                  fontSize: 'var(--font-xs)',
                  color: 'var(--color-text-muted)',
                }}
              >
                智能健身计划与训练追踪
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '6px 14px',
              background: 'var(--color-bg-primary)',
              borderRadius: 999,
              border: '1px solid var(--color-border)',
            }}
          >
            <button
              onClick={prevWeek}
              style={{
                padding: 6,
                borderRadius: 999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = 'var(--color-border)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = 'transparent')
              }
              title="上一周"
            >
              <ChevronLeft size={18} />
            </button>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: 160,
              }}
            >
              <span
                style={{
                  fontSize: 'var(--font-sm)',
                  fontWeight: 'var(--font-weight-semibold)',
                }}
              >
                {formatWeekRange(currentWeek)}
              </span>
              <span
                style={{
                  fontSize: 'var(--font-xs)',
                  color: 'var(--color-text-muted)',
                }}
              >
                第 {Math.ceil(
                  (new Date(currentWeek).getTime() -
                    new Date(
                      new Date(currentWeek).getFullYear(),
                      0,
                      1
                    ).getTime()) /
                    (7 * 24 * 60 * 60 * 1000)
                )}{' '}
                周
              </span>
            </div>
            <button
              onClick={nextWeek}
              style={{
                padding: 6,
                borderRadius: 999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = 'var(--color-border)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = 'transparent')
              }
              title="下一周"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </nav>

        <main
          style={{
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            flex: 1,
            maxWidth: 1920,
            width: '100%',
            margin: '0 auto',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 24,
              flexWrap: 'wrap',
              minHeight: 560,
            }}
          >
            <div style={{ flex: '1 1 320px', minWidth: 300 }}>
              <ActionLibrary actions={actions} />
            </div>
            <div style={{ flex: '2 1 600px', minWidth: 500 }}>
              <TrainingPlan
                weekKey={currentWeek}
                weeklyPlan={currentWeeklyPlan}
                onUpdatePlannedExercise={updatePlannedExercise}
                onRemovePlannedExercise={removePlannedExercise}
                onStartLogging={startLogging}
              />
            </div>
          </div>

          <TrainingLog
            weekKey={currentWeek}
            logs={trainingLogs}
            weeklyPlan={currentWeeklyPlan}
            activeLog={activeLog}
            onAddSet={addSet}
            onUpdateSet={updateSet}
            onRemoveSet={removeSet}
            onCompleteLog={completeLog}
            onCancelLog={cancelLog}
            onDeleteLog={deleteLog}
          />
        </main>

        <footer
          style={{
            padding: '16px 28px',
            textAlign: 'center',
            fontSize: 'var(--font-xs)',
            color: 'var(--color-text-muted)',
            borderTop: '1px solid var(--color-border)',
            background: 'var(--color-bg-card)',
          }}
        >
          FitPlan Pro · 科学训练，高效达成
        </footer>
      </div>
    </DragDropContext>
  );
}
