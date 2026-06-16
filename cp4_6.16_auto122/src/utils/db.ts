import { get, set, del, keys } from 'idb-keyval';
import type { Plan, Workout } from '../types';

const PLANS_KEY = 'irontrack_plans';
const WORKOUTS_KEY = 'irontrack_workouts';

export async function getPlans(): Promise<Plan[]> {
  const plans = await get<Plan[]>(PLANS_KEY);
  return plans || [];
}

export async function savePlans(plans: Plan[]): Promise<void> {
  const startTime = performance.now();
  await set(PLANS_KEY, plans);
  const duration = performance.now() - startTime;
  console.debug(`[DB] savePlans completed in ${duration.toFixed(2)}ms`);
}

export async function addPlan(plan: Plan): Promise<void> {
  const plans = await getPlans();
  plans.push(plan);
  await savePlans(plans);
}

export async function updatePlan(plan: Plan): Promise<void> {
  const plans = await getPlans();
  const index = plans.findIndex(p => p.id === plan.id);
  if (index !== -1) {
    plans[index] = plan;
    await savePlans(plans);
  }
}

export async function deletePlan(planId: string): Promise<void> {
  const plans = await getPlans();
  const filtered = plans.filter(p => p.id !== planId);
  await savePlans(filtered);
}

export async function getWorkouts(): Promise<Workout[]> {
  const workouts = await get<Workout[]>(WORKOUTS_KEY);
  return workouts || [];
}

export async function saveWorkouts(workouts: Workout[]): Promise<void> {
  const startTime = performance.now();
  await set(WORKOUTS_KEY, workouts);
  const duration = performance.now() - startTime;
  console.debug(`[DB] saveWorkouts completed in ${duration.toFixed(2)}ms`);
}

export async function addWorkout(workout: Workout): Promise<void> {
  const workouts = await getWorkouts();
  workouts.push(workout);
  await saveWorkouts(workouts);
}

export async function getWorkoutsByPlan(planId: string): Promise<Workout[]> {
  const workouts = await getWorkouts();
  return workouts.filter(w => w.planId === planId);
}

export async function getLastWorkoutForExercise(
  planId: string,
  exerciseId: string
): Promise<WorkoutSet | null> {
  const workouts = await getWorkoutsByPlan(planId);
  const sorted = workouts.sort((a, b) => b.date - a.date);

  for (const workout of sorted) {
    const exercise = workout.exercises.find(e => e.exerciseId === exerciseId);
    if (exercise && exercise.sets.length > 0) {
      const maxSet = exercise.sets.reduce((max, set) =>
        set.weight > max.weight ? set : max
      );
      return maxSet;
    }
  }
  return null;
}

export async function getExerciseMaxWeightHistory(
  exerciseName: string,
  days: number = 30
): Promise<{ date: number; weight: number }[]> {
  const workouts = await getWorkouts();
  const result: { date: number; weight: number }[] = [];
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

  const dailyMax = new Map<number, number>();

  for (const workout of workouts) {
    if (workout.date < cutoff) continue;

    for (const ex of workout.exercises) {
      if (ex.exerciseName === exerciseName && ex.sets.length > 0) {
        const maxWeight = Math.max(...ex.sets.map(s => s.weight));
        const dayStart = new Date(workout.date);
        dayStart.setHours(0, 0, 0, 0);
        const dayKey = dayStart.getTime();

        if (!dailyMax.has(dayKey) || maxWeight > dailyMax.get(dayKey)!) {
          dailyMax.set(dayKey, maxWeight);
        }
      }
    }
  }

  for (const [date, weight] of dailyMax) {
    result.push({ date, weight });
  }

  return result.sort((a, b) => a.date - b.date);
}

export async function clearAllData(): Promise<void> {
  await del(PLANS_KEY);
  await del(WORKOUTS_KEY);
}

export async function getAllKeys(): Promise<IDBValidKey[]> {
  return await keys();
}
