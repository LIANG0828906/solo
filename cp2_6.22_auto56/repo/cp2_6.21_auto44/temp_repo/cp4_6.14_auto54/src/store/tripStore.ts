import { create } from 'zustand';
import type { Trip, TripEvent, TripDay, OperationRecord, TeamMember } from '../types';
import { getTrip } from '../utils/api';

function calculateTotalSpent(days: TripDay[]): number {
  return days.reduce((sum, day) => {
    const dayTotal = day.events.reduce((s, e) => s + (e.cost || 0), 0);
    return sum + dayTotal;
  }, 0);
}

interface TripState {
  trip: Trip | null;
  loading: boolean;
  error: string | null;
  highlightedEventId: string | null;
  blinkingEvents: Set<string>;
  currentMemberId: string;
  socketId: string | null;
  setTrip: (trip: Trip) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHighlightedEvent: (id: string | null) => void;
  addBlinkingEvent: (id: string) => void;
  setSocketId: (id: string | null) => void;
  updateDay: (day: TripDay) => void;
  addEventToDay: (dayDate: string, event: TripEvent) => void;
  removeEventFromDay: (dayDate: string, eventId: string) => void;
  updateEventInDay: (dayDate: string, event: TripEvent) => void;
  addHistoryRecord: (record: OperationRecord) => void;
  updateMemberStatus: (memberId: string, online: boolean) => void;
  fetchTrip: (tripId: string) => Promise<void>;
}

export const useTripStore = create<TripState>((set, get) => ({
  trip: null,
  loading: false,
  error: null,
  highlightedEventId: null,
  blinkingEvents: new Set(),
  currentMemberId: 'member-001',
  socketId: null,

  setTrip: (trip: Trip) => set({ trip }),

  setLoading: (loading: boolean) => set({ loading }),

  setError: (error: string | null) => set({ error }),

  setHighlightedEvent: (id: string | null) => set({ highlightedEventId: id }),

  addBlinkingEvent: (id: string) => {
    const setRef = get().blinkingEvents;
    const newSet = new Set(setRef);
    newSet.add(id);
    set({ blinkingEvents: newSet });
    setTimeout(() => {
      const currentSet = get().blinkingEvents;
      const afterSet = new Set(currentSet);
      afterSet.delete(id);
      set({ blinkingEvents: afterSet });
    }, 2000);
  },

  setSocketId: (id: string | null) => set({ socketId: id }),

  updateDay: (day: TripDay) => set((state) => {
    if (!state.trip) return {};
    const newDays = state.trip.days.map((d) =>
      d.date === day.date ? day : d
    );
    const totalSpent = calculateTotalSpent(newDays);
    return {
      trip: {
        ...state.trip,
        days: newDays,
        totalSpent,
      },
    };
  }),

  addEventToDay: (dayDate: string, event: TripEvent) => set((state) => {
    if (!state.trip) return {};
    const newDays = state.trip.days.map((day) => {
      if (day.date !== dayDate) return day;
      const newEvents = [...day.events, event].sort((a, b) => a.order - b.order);
      const totalCost = newEvents.reduce((sum, e) => sum + (e.cost || 0), 0);
      return { ...day, events: newEvents, totalCost };
    });
    const totalSpent = calculateTotalSpent(newDays);
    return {
      trip: {
        ...state.trip,
        days: newDays,
        totalSpent,
      },
    };
  }),

  removeEventFromDay: (dayDate: string, eventId: string) => set((state) => {
    if (!state.trip) return {};
    const newDays = state.trip.days.map((day) => {
      if (day.date !== dayDate) return day;
      const newEvents = day.events.filter((e) => e.id !== eventId);
      const totalCost = newEvents.reduce((sum, e) => sum + (e.cost || 0), 0);
      return { ...day, events: newEvents, totalCost };
    });
    const totalSpent = calculateTotalSpent(newDays);
    return {
      trip: {
        ...state.trip,
        days: newDays,
        totalSpent,
      },
    };
  }),

  updateEventInDay: (dayDate: string, event: TripEvent) => set((state) => {
    if (!state.trip) return {};
    const newDays = state.trip.days.map((day) => {
      if (day.date !== dayDate) return day;
      const newEvents = day.events
        .map((e) => (e.id === event.id ? event : e))
        .sort((a, b) => a.order - b.order);
      const totalCost = newEvents.reduce((sum, e) => sum + (e.cost || 0), 0);
      return { ...day, events: newEvents, totalCost };
    });
    const totalSpent = calculateTotalSpent(newDays);
    return {
      trip: {
        ...state.trip,
        days: newDays,
        totalSpent,
      },
    };
  }),

  addHistoryRecord: (record: OperationRecord) => set((state) => {
    if (!state.trip) return {};
    return {
      trip: {
        ...state.trip,
        history: [record, ...state.trip.history],
      },
    };
  }),

  updateMemberStatus: (memberId: string, online: boolean) => set((state) => {
    if (!state.trip) return {};
    const newMembers = state.trip.members.map((m) =>
      m.id === memberId ? { ...m, online } : m
    );
    return {
      trip: {
        ...state.trip,
        members: newMembers,
      },
    };
  }),

  fetchTrip: async (tripId: string) => {
    set({ loading: true, error: null });
    try {
      const trip = await getTrip(tripId);
      set({ trip, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取行程失败';
      set({ error: message, loading: false });
    }
  },
}));
