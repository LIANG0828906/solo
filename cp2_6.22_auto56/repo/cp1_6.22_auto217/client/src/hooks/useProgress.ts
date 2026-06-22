import { useState, useEffect, useCallback } from 'react';
import type { Course, UserProgress, RecommendedCourse, DailyActivity } from '../../../shared/types';

interface ProgressState {
  courses: Course[];
  progress: UserProgress[];
  recommendations: RecommendedCourse[];
  activity: DailyActivity[];
  loading: boolean;
  error: string | null;
}

export function useProgress() {
  const [state, setState] = useState<ProgressState>({
    courses: [],
    progress: [],
    recommendations: [],
    activity: [],
    loading: true,
    error: null
  });

  const fetchAll = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const [coursesRes, progressRes, recsRes, activityRes] = await Promise.all([
        fetch('/api/courses'),
        fetch('/api/progress'),
        fetch('/api/recommendations?limit=5'),
        fetch('/api/activity?days=7')
      ]);

      if (!coursesRes.ok || !progressRes.ok || !recsRes.ok || !activityRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [courses, progress, recommendations, activity] = await Promise.all([
        coursesRes.json() as Promise<Course[]>,
        progressRes.json() as Promise<UserProgress[]>,
        recsRes.json() as Promise<RecommendedCourse[]>,
        activityRes.json() as Promise<DailyActivity[]>
      ]);

      setState({ courses, progress, recommendations, activity, loading: false, error: null });
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      }));
    }
  }, []);

  const updateProgress = useCallback(async (progressData: UserProgress): Promise<boolean> => {
    try {
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(progressData)
      });

      if (!response.ok) {
        throw new Error('Failed to update progress');
      }

      const updated = await response.json() as UserProgress;
      setState(prev => {
        const newProgress = [...prev.progress];
        const idx = newProgress.findIndex(p => p.courseId === updated.courseId);
        if (idx >= 0) {
          newProgress[idx] = updated;
        } else {
          newProgress.push(updated);
        }
        return { ...prev, progress: newProgress };
      });

      await fetchRecommendations();
      return true;
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to update progress'
      }));
      return false;
    }
  }, []);

  const fetchRecommendations = useCallback(async () => {
    try {
      const response = await fetch('/api/recommendations?limit=5');
      if (response.ok) {
        const recommendations = (await response.json()) as RecommendedCourse[];
        setState(prev => ({ ...prev, recommendations }));
      }
    } catch {
    }
  }, []);

  const addDailyMinutes = useCallback(async (minutes: number): Promise<boolean> => {
    try {
      const response = await fetch('/api/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minutes })
      });

      if (!response.ok) {
        return false;
      }

      const activityRes = await fetch('/api/activity?days=7');
      if (activityRes.ok) {
        const activity = await activityRes.json() as DailyActivity[];
        setState(prev => ({ ...prev, activity }));
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    ...state,
    refresh: fetchAll,
    updateProgress,
    addDailyMinutes
  };
}
