import { get, set, del, keys } from 'idb-keyval';
import type { Plan, Workout, WorkoutSet } from '../types';

const PLANS_KEY = 'irontrack_plans';
const WORKOUTS_KEY = 'irontrack_workouts';
const LS_PLANS_KEY = 'irontrack_plans_cache';
const LS_WORKOUTS_KEY = 'irontrack_workouts_cache';
const WRITE_TIMEOUT_MS = 200;

type TimeoutFallback = {
  __fallback: boolean;
};

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  fallbackValue: T
): Promise<T> {
  return new Promise<T>((resolve) => {
    const timeoutId = setTimeout(() => {
      resolve(fallbackValue);
    }, timeoutMs);

    promise
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch(() => {
        clearTimeout(timeoutId);
        resolve(fallbackValue);
      });
  });
}

const fallbackWriteResult: TimeoutFallback = { __fallback: true };

function savePlansToLS(plans: Plan[]): void {
  try {
    localStorage.setItem(LS_PLANS_KEY, JSON.stringify(plans));
  } catch (e) {
    console.error('[DB] Failed to save plans to localStorage', e);
  }
}

function getPlansFromLS(): Plan[] {
  try {
    const raw = localStorage.getItem(LS_PLANS_KEY);
    if (raw) {
      return JSON.parse(raw) as Plan[];
    }
  } catch (e) {
    console.error('[DB] Failed to read plans from localStorage', e);
  }
  return [];
}

function saveWorkoutsToLS(workouts: Workout[]): void {
  try {
    localStorage.setItem(LS_WORKOUTS_KEY, JSON.stringify(workouts));
  } catch (e) {
    console.error('[DB] Failed to save workouts to localStorage', e);
  }
}

function getWorkoutsFromLS(): Workout[] {
  try {
    const raw = localStorage.getItem(LS_WORKOUTS_KEY);
    if (raw) {
      return JSON.parse(raw) as Workout[];
    }
  } catch (e) {
    console.error('[DB] Failed to read workouts from localStorage', e);
  }
  return [];
}

async function retryIndexedDBPlans(plans: Plan[]): Promise<void> {
  try {
    const startTime = performance.now();
    await set(PLANS_KEY, plans);
    const duration = performance.now() - startTime;
    console.debug(`[DB] retry savePlans completed in ${duration.toFixed(2)}ms`);
  } catch (e) {
    console.error('[DB] Failed to retry savePlans to IndexedDB', e);
  }
}

async function retryIndexedDBWorkouts(workouts: Workout[]): Promise<void> {
  try {
    const startTime = performance.now();
    await set(WORKOUTS_KEY, workouts);
    const duration = performance.now() - startTime;
    console.debug(`[DB] retry saveWorkouts completed in ${duration.toFixed(2)}ms`);
  } catch (e) {
    console.error('[DB] Failed to retry saveWorkouts to IndexedDB', e);
  }
}

export async function initDB(): Promise<void> {
  try {
    const startTime = performance.now();
    await get(PLANS_KEY);
    const duration = performance.now() - startTime;
    console.debug(`[DB] initDB completed in ${duration.toFixed(2)}ms`);
  } catch (e) {
    console.debug('[DB] initDB warmed up with fallback to localStorage', e);
  }
}

export async function getPlans(): Promise<Plan[]> {
  const startTime = performance.now();

  try {
    const plans = await get<Plan[]>(PLANS_KEY);
    const duration = performance.now() - startTime;
    console.debug(`[DB] getPlans (IndexedDB) completed in ${duration.toFixed(2)}ms`);
    if (plans) {
      return plans;
    }
  } catch (e) {
    const duration = performance.now() - startTime;
    console.debug(`[DB] getPlans (IndexedDB failed) in ${duration.toFixed(2)}ms, falling back to localStorage`);
  }

  const lsStart = performance.now();
  const lsPlans = getPlansFromLS();
  const lsDuration = performance.now() - lsStart;
  console.debug(`[DB] getPlans (localStorage) completed in ${lsDuration.toFixed(2)}ms`);
  return lsPlans;
}

export async function savePlans(plans: Plan[]): Promise<void> {
  const startTime = performance.now();

  const idbPromise = new Promise<TimeoutFallback>((resolve, reject) => {
    set(PLANS_KEY, plans)
      .then(() => resolve({ __fallback: false }))
      .catch(reject);
  });

  const result = await withTimeout<TimeoutFallback>(
    idbPromise,
    WRITE_TIMEOUT_MS,
    fallbackWriteResult
  );

  const duration = performance.now() - startTime;

  if (result.__fallback) {
    console.debug(`[DB] savePlans timed out after ${duration.toFixed(2)}ms, falling back to localStorage`);
    savePlansToLS(plans);
    void retryIndexedDBPlans(plans);
  } else {
    console.debug(`[DB] savePlans completed in ${duration.toFixed(2)}ms`);
    savePlansToLS(plans);
  }
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
  const startTime = performance.now();

  try {
    const workouts = await get<Workout[]>(WORKOUTS_KEY);
    const duration = performance.now() - startTime;
    console.debug(`[DB] getWorkouts (IndexedDB) completed in ${duration.toFixed(2)}ms`);
    if (workouts) {
      return workouts;
    }
  } catch (e) {
    const duration = performance.now() - startTime;
    console.debug(`[DB] getWorkouts (IndexedDB failed) in ${duration.toFixed(2)}ms, falling back to localStorage`);
  }

  const lsStart = performance.now();
  const lsWorkouts = getWorkoutsFromLS();
  const lsDuration = performance.now() - lsStart;
  console.debug(`[DB] getWorkouts (localStorage) completed in ${lsDuration.toFixed(2)}ms`);
  return lsWorkouts;
}

export async function saveWorkouts(workouts: Workout[]): Promise<void> {
  const startTime = performance.now();

  const idbPromise = new Promise<TimeoutFallback>((resolve, reject) => {
    set(WORKOUTS_KEY, workouts)
      .then(() => resolve({ __fallback: false }))
      .catch(reject);
  });

  const result = await withTimeout<TimeoutFallback>(
    idbPromise,
    WRITE_TIMEOUT_MS,
    fallbackWriteResult
  );

  const duration = performance.now() - startTime;

  if (result.__fallback) {
    console.debug(`[DB] saveWorkouts timed out after ${duration.toFixed(2)}ms, falling back to localStorage`);
    saveWorkoutsToLS(workouts);
    void retryIndexedDBWorkouts(workouts);
  } else {
    console.debug(`[DB] saveWorkouts completed in ${duration.toFixed(2)}ms`);
    saveWorkoutsToLS(workouts);
  }
}

export async function addWorkout(workout: Workout): Promise<void> {
  const workouts = await getWorkouts();
  workouts.push(workout);
  await saveWorkouts(workouts);
}

export async function getWorkoutsByPlan(planId: string): Promise<Workout[]> {
  const startTime = performance.now();
  const workouts = await getWorkouts();
  const result = workouts.filter(w => w.planId === planId);
  const duration = performance.now() - startTime;
  console.debug(`[DB] getWorkoutsByPlan completed in ${duration.toFixed(2)}ms, found ${result.length} workouts`);
  return result;
}

export async function getLastWorkoutForExercise(
  planId: string,
  exerciseId: string
): Promise<WorkoutSet | null> {
  const startTime = performance.now();
  const workouts = await getWorkoutsByPlan(planId);
  const sorted = workouts.sort((a, b) => b.date - a.date);

  for (const workout of sorted) {
    const exercise = workout.exercises.find(e => e.exerciseId === exerciseId);
    if (exercise && exercise.sets.length > 0) {
      const maxSet = exercise.sets.reduce((max, set) =>
        set.weight > max.weight ? set : max
      );
      const duration = performance.now() - startTime;
      console.debug(`[DB] getLastWorkoutForExercise completed in ${duration.toFixed(2)}ms`);
      return maxSet;
    }
  }

  const duration = performance.now() - startTime;
  console.debug(`[DB] getLastWorkoutForExercise completed in ${duration.toFixed(2)}ms, no result`);
  return null;
}

export async function getExerciseMaxWeightHistory(
  exerciseName: string,
  days: number = 30
): Promise<{ date: number; weight: number }[]> {
  const startTime = performance.now();
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

  const sortedResult = result.sort((a, b) => a.date - b.date);
  const duration = performance.now() - startTime;
  console.debug(`[DB] getExerciseMaxWeightHistory completed in ${duration.toFixed(2)}ms, ${sortedResult.length} entries`);
  return sortedResult;
}

export async function clearAllData(): Promise<void> {
  const startTime = performance.now();

  try {
    await del(PLANS_KEY);
    await del(WORKOUTS_KEY);
  } catch (e) {
    console.error('[DB] Failed to clear IndexedDB data', e);
  }

  try {
    localStorage.removeItem(LS_PLANS_KEY);
    localStorage.removeItem(LS_WORKOUTS_KEY);
  } catch (e) {
    console.error('[DB] Failed to clear localStorage data', e);
  }

  const duration = performance.now() - startTime;
  console.debug(`[DB] clearAllData completed in ${duration.toFixed(2)}ms`);
}

export async function getAllKeys(): Promise<IDBValidKey[]> {
  const startTime = performance.now();
  const result = await keys();
  const duration = performance.now() - startTime;
  console.debug(`[DB] getAllKeys completed in ${duration.toFixed(2)}ms, ${result.length} keys`);
  return result;
}
