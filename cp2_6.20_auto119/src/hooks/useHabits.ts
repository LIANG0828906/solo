import axios from 'axios';
import dayjs from 'dayjs';
import { message } from 'antd';
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
  } = useHabitsStore();

  const handleError = (err: unknown) => {
    const errorMessage = err instanceof Error ? err.message : '请求失败，请稍后重试';
    setError(errorMessage);
    message.error(errorMessage);
  };

  const fetchHabits = async () => {
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
  };

  const addHabit = async (name: string) => {
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
  };

  const deleteHabit = async (name: string) => {
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
  };

  const toggleHabit = async (habitName: string, date: string) => {
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
  };

  const fetchRecords = async (date: string) => {
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
  };

  const fetchStats = async (days: number = 30) => {
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
  };

  const fetchHeatmap = async (year: number = dayjs().year()) => {
    try {
      setLoading(true);
      const response = await api.get<HeatmapDataItem[]>('/heatmap', {
        params: { year },
      });
      setHeatmapData(response.data);
      setError(null);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const refreshAll = async (date?: string, days?: number, year?: number) => {
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
        fetchHeatmap(targetYear),
      ]);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    habits,
    records,
    heatmapData,
    stats,
    loading,
    error,
    fetchHabits,
    addHabit,
    deleteHabit,
    toggleHabit,
    fetchRecords,
    fetchStats,
    fetchHeatmap,
    refreshAll,
  };
}
