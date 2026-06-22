import axios from 'axios';
import dayjs from 'dayjs';
import { message } from 'antd';
import { useCallback } from 'react';
import { useHabitsStore } from '../store/useHabitsStore';
import type { Habit, HabitRecord, HeatmapDataItem, StatsResponse } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export function useHabits() {
  const {
    habits,
    records,
    heatmapData,
    stats,
    loading,
    error,
    setHabits,
    setRecords,
    setHeatmapData,
    setStats,
    setLoading,
    setError,
    toggleRecord: toggleRecordLocal,
    addHabit: addHabitLocal,
    deleteHabit: deleteHabitLocal,
    selectedHabits,
  } = useHabitsStore();

  const handleError = useCallback((err: unknown) => {
    const errorMessage = err instanceof Error ? err.message : '请求失败，请稍后重试';
    setError(errorMessage);
    message.error(errorMessage);
  }, [setError]);

  const fetchHabits = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<Habit[]>('/habits');
      setHabits(response.data);
      setError(null);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setHabits, setError, handleError]);

  const fetchRecords = useCallback(async (date: string) => {
    try {
      setLoading(true);
      const response = await api.get<HabitRecord[]>('/records', {
        params: { date },
      });
      setRecords(response.data);
      setError(null);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setRecords, setError, handleError]);

  const fetchStats = useCallback(async (days: number = 30) => {
    try {
      setLoading(true);
      const response = await api.get<StatsResponse>('/stats', {
        params: { days },
      });
      setStats(response.data);
      setError(null);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setStats, setError, handleError]);

  const fetchHeatmap = useCallback(async (year: number = dayjs().year(), habitNames?: string[]) => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { year };
      if (habitNames && habitNames.length > 0) {
        params.habit_names = habitNames.join(',');
      }
      const response = await api.get('/heatmap', { params });
      const raw = response.data;
      const items: HeatmapDataItem[] = (raw.data || []).map((item: any) => ({
        date: item.date,
        count: item.value ?? 0,
        total: raw.total_habits ?? 0,
        level: 0,
        habitDetails: item.habit_details || undefined,
      }));
      setHeatmapData(items);
      setError(null);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setHeatmapData, setError, handleError]);

  const refreshAll = useCallback(async (date?: string, days?: number, year?: number, habitNames?: string[]) => {
    try {
      setLoading(true);
      setError(null);
      const targetDate = date || dayjs().format('YYYY-MM-DD');
      const targetDays = days || 30;
      const targetYear = year || dayjs().year();

      await Promise.all([
        fetchHabits(),
        fetchRecords(targetDate),
        fetchStats(targetDays),
        fetchHeatmap(targetYear, habitNames),
      ]);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, fetchHabits, fetchRecords, fetchStats, fetchHeatmap, handleError]);

  const addHabit = useCallback(async (name: string) => {
    try {
      setLoading(true);
      const response = await api.post<Habit>('/habits', { name });
      addHabitLocal(response.data);
      message.success('习惯添加成功');
      setError(null);
      await fetchRecords(dayjs().format('YYYY-MM-DD'));
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [setLoading, addHabitLocal, setError, fetchRecords, handleError]);

  const deleteHabit = useCallback(async (name: string) => {
    try {
      setLoading(true);
      await api.delete(`/habits/${encodeURIComponent(name)}`);
      deleteHabitLocal(name);
      message.success('习惯删除成功');
      setError(null);
      await refreshAll();
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [setLoading, deleteHabitLocal, setError, refreshAll, handleError]);

  const deleteRecord = useCallback(async (habitName: string, date: string) => {
    try {
      setLoading(true);
      await api.delete('/records', {
        params: { habit_name: habitName, date },
      });
      message.success('记录删除成功');
      setError(null);
      await refreshAll();
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, refreshAll, handleError]);

  const toggleHabit = useCallback(async (habitName: string, date: string) => {
    try {
      setLoading(true);
      const response = await api.post<HabitRecord>('/habits/toggle', {
        habitName,
        date,
      });
      toggleRecordLocal(habitName, date);
      setError(null);
      return response.data;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setLoading, toggleRecordLocal, setError, handleError]);

  return {
    habits,
    records,
    heatmapData,
    stats,
    loading,
    error,
    selectedHabits,
    fetchHabits,
    addHabit,
    deleteHabit,
    deleteRecord,
    toggleHabit,
    fetchRecords,
    fetchStats,
    fetchHeatmap,
    refreshAll,
  };
}
