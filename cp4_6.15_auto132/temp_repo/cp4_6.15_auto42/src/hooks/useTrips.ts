import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { storage } from '@/utils/storage';
import type { Trip, Activity, ExpenseCategory, CategoryTotal, DailySpending } from '@/types';

const TRIPS_KEY = 'travel_planner_trips';
const ACTIVITIES_KEY = 'travel_planner_activities';

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  transport: '#4ECDC4',
  accommodation: '#FF6B6B',
  food: '#FFD93D',
  ticket: '#6BCB77',
  other: '#9B59B6'
};

const CATEGORY_NAMES: Record<ExpenseCategory, string> = {
  transport: '交通',
  accommodation: '住宿',
  food: '餐饮',
  ticket: '门票',
  other: '其他'
};

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedTrips = storage.get<Trip[]>(TRIPS_KEY, []);
    const savedActivities = storage.get<Activity[]>(ACTIVITIES_KEY, []);
    setTrips(savedTrips);
    setActivities(savedActivities);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      storage.set(TRIPS_KEY, trips);
    }
  }, [trips, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      storage.set(ACTIVITIES_KEY, activities);
    }
  }, [activities, isLoaded]);

  const addTrip = useCallback((data: Omit<Trip, 'id' | 'createdAt'>) => {
    const newTrip: Trip = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString()
    };
    setTrips(prev => [...prev, newTrip]);
    return newTrip;
  }, []);

  const deleteTrip = useCallback((tripId: string) => {
    setTrips(prev => prev.filter(t => t.id !== tripId));
    setActivities(prev => prev.filter(a => a.tripId !== tripId));
  }, []);

  const updateTrip = useCallback((tripId: string, data: Partial<Omit<Trip, 'id' | 'createdAt'>>) => {
    setTrips(prev => prev.map(t => t.id === tripId ? { ...t, ...data } : t));
  }, []);

  const addActivity = useCallback((data: Omit<Activity, 'id' | 'completed'>) => {
    const trip = trips.find(t => t.id === data.tripId);
    if (!trip) {
      throw new Error('行程不存在');
    }
    
    const activityDate = data.date;
    if (activityDate < trip.startDate || activityDate > trip.endDate) {
      throw new Error(`活动日期必须在行程日期范围内 (${trip.startDate} ~ ${trip.endDate})`);
    }
    
    const newActivity: Activity = {
      ...data,
      id: uuidv4(),
      completed: false
    };
    setActivities(prev => [...prev, newActivity]);
    return newActivity;
  }, [trips]);

  const updateActivity = useCallback((activityId: string, data: Partial<Omit<Activity, 'id' | 'tripId'>>) => {
    setActivities(prev => prev.map(a => a.id === activityId ? { ...a, ...data } : a));
  }, []);

  const deleteActivity = useCallback((activityId: string) => {
    setActivities(prev => prev.filter(a => a.id !== activityId));
  }, []);

  const toggleActivityCompleted = useCallback((activityId: string) => {
    setActivities(prev => prev.map(a =>
      a.id === activityId ? { ...a, completed: !a.completed } : a
    ));
  }, []);

  const getTripActivities = useCallback((tripId: string) => {
    return activities
      .filter(a => a.tripId === tripId)
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.time.localeCompare(b.time);
      });
  }, [activities]);

  const getTripTotalSpent = useCallback((tripId: string) => {
    return activities
      .filter(a => a.tripId === tripId)
      .reduce((sum, a) => sum + a.cost, 0);
  }, [activities]);

  const getTripDays = useCallback((trip: Trip) => {
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(diff, 1);
  }, []);

  const getCategoryTotals = useCallback((tripId: string): CategoryTotal[] => {
    const tripActivities = activities.filter(a => a.tripId === tripId);
    const totals: Record<ExpenseCategory, number> = {
      transport: 0,
      accommodation: 0,
      food: 0,
      ticket: 0,
      other: 0
    };
    tripActivities.forEach(a => {
      totals[a.category] += a.cost;
    });
    return (Object.keys(totals) as ExpenseCategory[])
      .map(cat => ({
        category: cat,
        name: CATEGORY_NAMES[cat],
        value: totals[cat],
        color: CATEGORY_COLORS[cat]
      }))
      .filter(item => item.value > 0);
  }, [activities]);

  const getDailySpending = useCallback((tripId: string): DailySpending[] => {
    const tripActivities = activities.filter(a => a.tripId === tripId);
    const dailyMap = new Map<string, number>();
    tripActivities.forEach(a => {
      dailyMap.set(a.date, (dailyMap.get(a.date) || 0) + a.cost);
    });
    return Array.from(dailyMap.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [activities]);

  const getTripById = useCallback((tripId: string) => {
    return trips.find(t => t.id === tripId);
  }, [trips]);

  return {
    trips,
    activities,
    addTrip,
    deleteTrip,
    updateTrip,
    addActivity,
    updateActivity,
    deleteActivity,
    toggleActivityCompleted,
    getTripActivities,
    getTripTotalSpent,
    getTripDays,
    getCategoryTotals,
    getDailySpending,
    getTripById
  };
}
