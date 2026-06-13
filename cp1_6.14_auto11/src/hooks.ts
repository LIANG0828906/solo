import { useState, useEffect, useCallback } from 'react';
import type { Plant, Task, CompletionRate } from './types';
import { plantApi, taskApi, statsApi } from './api';

export function usePlants() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlants = useCallback(async () => {
    try {
      const data = await plantApi.getAll();
      setPlants(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlants();
  }, [fetchPlants]);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchPlants();
  }, [fetchPlants]);

  return { plants, loading, refresh, setPlants };
}

export function useWeekTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    try {
      const data = await taskApi.getWeekTasks();
      setTasks(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchTasks();
  }, [fetchTasks]);

  return { tasks, loading, refresh, setTasks };
}

export function useCompletionRates() {
  const [rates, setRates] = useState<CompletionRate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await statsApi.getCompletionRates();
        setRates(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { rates, loading };
}
