import { useState, useCallback, useMemo, useEffect } from 'react';
import axios from 'axios';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Dumbbell,
  Clock,
  Flame,
  Layers,
} from 'lucide-react';
import type { TrainingPlan, PlanDay, Client, Exercise } from '../../../../shared/types';
import { DAY_LABELS } from './types';
import type { PlanExerciseWithDetails } from './types';
import SortableExerciseCard, { DragOverlayCard } from './SortableExerciseCard';
import CreatePlanModal from './CreatePlanModal';

function parseReps(repsStr: string): number {
  const n = parseInt(repsStr, 10);
  return isNaN(n) ? 0 : n;
}

function exerciseToDetail(
  pe: PlanDay['exercises'][number],
  exercises: Exercise[]
): PlanExerciseWithDetails {
  const ex = exercises.find((e) => e.id === pe.exerciseId);
  return {
    exerciseId: pe.exerciseId,
    name: ex?.name ?? '未知动作',
    muscleGroup: ex?.muscleGroup ?? '',
    difficulty: ex?.difficulty ?? 1,
    sets: pe.sets,
    reps: pe.reps,
    restSeconds: pe.restSeconds,
    order: pe.order,
  };
}

interface TrainingPlanProps {
  clientId: string;
}

export default function TrainingPlan({ clientId }: TrainingPlanProps) {
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState(clientId);
  const [activeDay, setActiveDay] = useState(0);
  const [weekOffset, setWeekOffset] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const fetchPlan = useCallback(async () => {
    if (!selectedClientId) return;
    setLoading(true);
    try {
      const [planRes, exRes, clientRes] = await Promise.all([
        axios.get<TrainingPlan>(`/api/trainingPlans/${selectedClientId}`),
        axios.get<Exercise[]>('/api/exercises'),
        axios.get<Client[]>('/api/clients'),
      ]);
      setPlan(planRes.data);
      setExercises(exRes.data);
      setClients(clientRes.data);
    } catch {
      setPlan(null);
    } finally {
      setLoading(false);
    }
  }, [selectedClientId]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  const currentDayExercises: PlanExerciseWithDetails[] = useMemo(() => {
    if (!plan) return [];
    const day = plan.days.find((d) => d.dayIndex === activeDay);
    if (!day) return [];
    return day.exercises
      .sort((a, b) => a.order - b.order)
      .map((pe) => exerciseToDetail(pe, exercises));
  }, [plan, activeDay, exercises]);

  const summary = useMemo(() => {
    const totalExercises = currentDayExercises.length;
    const totalSets = currentDayExercises.reduce((sum, e) => sum + e.sets, 0);
    const totalVolume = currentDayExercises.reduce(
      (sum, e) => sum + e.sets * parseReps(e.reps),
      0
    );
    const estimatedMinutes = currentDayExercises.reduce(
      (sum, e) =>
        sum + e.sets * (1.5 + e.restSeconds / 60),
      0
    );
    const estimatedCalories = Math.round(totalSets * 8);
    return { totalExercises, totalSets, totalVolume, estimatedMinutes, estimatedCalories };
  }, [currentDayExercises]);

  const weekStart = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset + weekOffset * 7);
    return monday.toISOString().slice(0, 10);
  }, [weekOffset]);

  const activeExercise = useMemo(
    () => currentDayExercises.find((e) => e.exerciseId === activeId) ?? null,
    [currentDayExercises, activeId]
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id || !plan) return;

    const oldIndex = currentDayExercises.findIndex(
      (e) => e.exerciseId === active.id
    );
    const newIndex = currentDayExercises.findIndex(
      (e) => e.exerciseId === over.id
    );
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(currentDayExercises, oldIndex, newIndex);
    const updatedDays = plan.days.map((day) => {
      if (day.dayIndex !== activeDay) return day;
      return {
        ...day,
        exercises: reordered.map((ex, i) => ({
          exerciseId: ex.exerciseId,
          sets: ex.sets,
          reps: ex.reps,
          restSeconds: ex.restSeconds,
          order: i,
        })),
      };
    });

    const updatedPlan = { ...plan, days: updatedDays };
    setPlan(updatedPlan);

    try {
      await axios.put(`/api/trainingPlans/${plan.id}`, updatedPlan);
    } catch {
      setPlan(plan);
    }
  };

  const handleCreatePlan = async (data: {
    clientId: string;
    trainingDays: number[];
    duration: number;
    focusAreas: string[];
  }) => {
    try {
      await axios.post('/api/trainingPlans', {
        clientId: data.clientId,
        trainingDays: data.trainingDays,
        duration: data.duration,
        focusAreas: data.focusAreas,
        weekStart,
      });
      fetchPlan();
    } catch {
      // handle error
    }
  };

  const handleEdit = (exerciseId: string) => {
    console.log('Edit exercise:', exerciseId);
  };

  const handleDelete = (exerciseId: string) => {
    if (!plan) return;
    const updatedDays = plan.days.map((day) => {
      if (day.dayIndex !== activeDay) return day;
      return {
        ...day,
        exercises: day.exercises
          .filter((e) => e.exerciseId !== exerciseId)
          .map((e, i) => ({ ...e, order: i })),
      };
    });
    setPlan({ ...plan, days: updatedDays });
  };

  const hasTrainingDay = plan?.days.some((d) => d.dayIndex === activeDay);

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <select
          value={selectedClientId}
          onChange={(e) => {
            setSelectedClientId(e.target.value);
            setActiveDay(0);
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-orange-500 outline-none"
        >
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-medium text-gray-700 min-w-[100px] text-center">
            {weekStart}
          </span>
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors"
        >
          <Plus size={16} />
          创建新计划
        </button>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-4 gap-3">
        <div className="card rounded-xl p-3 bg-white shadow text-center">
          <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
            <Dumbbell size={14} />
            <span className="text-xs">动作数</span>
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {summary.totalExercises}
          </div>
        </div>
        <div className="card rounded-xl p-3 bg-white shadow text-center">
          <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
            <Layers size={14} />
            <span className="text-xs">总组数</span>
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {summary.totalSets}
          </div>
        </div>
        <div className="card rounded-xl p-3 bg-white shadow text-center">
          <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
            <Clock size={14} />
            <span className="text-xs">预计时长</span>
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {Math.round(summary.estimatedMinutes)}分钟
          </div>
        </div>
        <div className="card rounded-xl p-3 bg-white shadow text-center">
          <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
            <Flame size={14} />
            <span className="text-xs">预计消耗</span>
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {summary.estimatedCalories}kcal
          </div>
        </div>
      </div>

      {/* Day tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {DAY_LABELS.map((label, i) => {
          const hasDay = plan?.days.some((d) => d.dayIndex === i);
          return (
            <button
              key={i}
              onClick={() => setActiveDay(i)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                activeDay === i
                  ? 'bg-orange-500 text-white shadow'
                  : hasDay
                  ? 'text-gray-700 hover:bg-gray-200'
                  : 'text-gray-400'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Exercise list */}
      <div className="min-h-[300px]">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            加载中...
          </div>
        ) : !hasTrainingDay ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Dumbbell size={40} className="mb-3 opacity-30" />
            <p>今天没有训练安排</p>
          </div>
        ) : currentDayExercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <p>暂无训练动作</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={currentDayExercises.map((e) => e.exerciseId)}
              strategy={verticalListSortingStrategy}
            >
              {currentDayExercises.map((exercise) => (
                <SortableExerciseCard
                  key={exercise.exerciseId}
                  exercise={exercise}
                  isDragging={activeId === exercise.exerciseId}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </SortableContext>
            <DragOverlay dropAnimation={null}>
              {activeExercise ? (
                <DragOverlayCard exercise={activeExercise} />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      <CreatePlanModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreatePlan}
        clientId={selectedClientId}
      />
    </div>
  );
}
