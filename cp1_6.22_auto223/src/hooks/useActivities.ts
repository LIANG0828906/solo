import { useState, useCallback } from 'react';
import type { Activity, Participant, CreateActivityRequest, RegisterRequest } from '@/types';
import { activityApi } from '@/api/activityApi';

export const useActivities = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await activityApi.getActivities();
      setActivities(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchActivity = useCallback(async (id: string): Promise<Activity | null> => {
    setLoading(true);
    setError(null);
    try {
      const data = await activityApi.getActivity(id);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createActivity = useCallback(async (data: CreateActivityRequest): Promise<Activity | null> => {
    setLoading(true);
    setError(null);
    try {
      const newActivity = await activityApi.createActivity(data);
      setActivities(prev => [...prev, newActivity]);
      return newActivity;
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const registerActivity = useCallback(async (data: RegisterRequest): Promise<Participant | null> => {
    setLoading(true);
    setError(null);
    try {
      const participant = await activityApi.register(data);
      return participant;
    } catch (err) {
      setError(err instanceof Error ? err.message : '报名失败');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const checkIn = useCallback(async (activityId: string, participantId: string): Promise<Participant | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await activityApi.checkIn(activityId, participantId);
      return result.participant;
    } catch (err) {
      setError(err instanceof Error ? err.message : '签到失败');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchParticipants = useCallback(async (activityId: string): Promise<Participant[]> => {
    setLoading(true);
    setError(null);
    try {
      const data = await activityApi.getParticipants(activityId);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    activities,
    loading,
    error,
    fetchActivities,
    fetchActivity,
    createActivity,
    registerActivity,
    checkIn,
    fetchParticipants,
  };
};
