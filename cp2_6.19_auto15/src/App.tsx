import { useState, useMemo, useCallback } from 'react';
import {
  DragDropContext,
  DropResult,
} from 'react-beautiful-dnd';
import { v4 as uuidv4 } from 'uuid';
import {
  ChevronLeft,
  ChevronRight,
  Dumbbell,
} from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage';
import ActionLibrary from './components/ActionLibrary';
import TrainingPlan from './components/TrainingPlan';
import TrainingLog from './components/TrainingLog';

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
  }, [currentWeek, setCurrentWeek]);

  const nextWeek = useCallback(() => {
    setCurrentWeek(addDaysToDate(currentWeek, 7));
  }, [currentWeek, setCurrentWeek]);

  const updatePlannedExercise = useCallback(
    (
      day: DayOfWeek,
      planId: string,
      field: keyof PlannedExercise,
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

  const handleUpdateLog = useCallback((log: TrainingLogEntry) => {
    const exists = trainingLogs.some(l => l.logId === log.logId);
    if (exists) {
      setTrainingLogs(prev => prev.map(l => l.logId === log.logId ? log : l));
    } else {
      setTrainingLogs(prev => [...prev, log]);
    }
  }, [trainingLogs, setTrainingLogs]);

  const onDragEnd = useCallback(
    (result: DropResult) => {
      const { source, destination } = result;
      if (!destination) return;

      const plan = weeklyPlans[currentWeek] || createEmptyWeek(currentWeek);
      const newDays = { ...plan.days };

      if (source.droppableId === 'action-library') {
        const destDay = destination.droppableId.replace('day-', '') as DayOfWeek;
        const actionId = result.draggableId.replace('action-', '');
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

      if (source.droppableId.startsWith('day-')) {
        const srcDay = source.droppableId.replace('day-', '') as DayOfWeek;
        const destDay = destination.droppableId.replace('day-', '') as DayOfWeek;

        const srcList = [...newDays[srcDay]];
        const movedPlanId = result.draggableId.replace('plan-', '');
        const movedIndex = srcList.findIndex(ex => ex.planId === movedPlanId);
        if (movedIndex === -1) return;

        const [moved] = srcList.splice(movedIndex, 1);
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
              />
            </div>
          </div>

          <TrainingLog
            weekKey={currentWeek}
            plan={currentWeeklyPlan}
            logs={trainingLogs}
            onUpdateLog={handleUpdateLog}
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
