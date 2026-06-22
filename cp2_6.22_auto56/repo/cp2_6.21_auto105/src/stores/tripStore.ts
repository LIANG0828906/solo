import { create } from 'zustand';
import type { Trip, Attraction, AttractionCreateData, Comment, TripStoreState, TripStoreActions } from '@/types';
import api from '@/utils/api';

const MAX_UNDO_STACK = 50;

type TripStore = TripStoreState & TripStoreActions;

const initialState: TripStoreState = {
  trip: null,
  selectedAttractionId: null,
  selectedDayId: null,
  isEditing: false,
  undoStack: [],
  redoStack: [],
  isLoading: false,
  error: null,
};

function isFullAttraction(data: AttractionCreateData | Attraction): data is Attraction {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    typeof (data as Attraction).id === 'string' &&
    'comments' in data &&
    Array.isArray((data as Attraction).comments) &&
    'createdAt' in data &&
    typeof (data as Attraction).createdAt === 'string' &&
    'updatedAt' in data &&
    typeof (data as Attraction).updatedAt === 'string' &&
    'order' in data &&
    typeof (data as Attraction).order === 'number'
  );
}

export const useTripStore = create<TripStore>((set, get) => ({
  ...initialState,

  setTrip: (trip) => {
    set({ trip });
  },

  setSelectedAttraction: (id) => {
    set({ selectedAttractionId: id });
  },

  setSelectedDay: (id) => {
    set({ selectedDayId: id });
  },

  setIsEditing: (editing) => {
    set({ isEditing: editing });
  },

  saveToUndoStack: () => {
    const { trip, undoStack } = get();
    if (!trip) return;

    const newUndoStack = [...undoStack, JSON.parse(JSON.stringify(trip))];
    if (newUndoStack.length > MAX_UNDO_STACK) {
      newUndoStack.shift();
    }

    set({
      undoStack: newUndoStack,
      redoStack: [],
    });
  },

  addAttraction: (dayId, attractionData) => {
    const { trip, saveToUndoStack } = get();
    if (!trip) return;

    saveToUndoStack();

    const fullAttraction: Attraction = isFullAttraction(attractionData)
      ? attractionData
      : {
          name: attractionData.name,
          lat: attractionData.lat,
          lng: attractionData.lng,
          description: attractionData.description,
          duration: attractionData.duration,
          notes: attractionData.notes,
          transportMode: attractionData.transportMode,
          id: `attr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          order: 0,
          comments: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

    const newDays = trip.days.map((day) => {
      if (day.id === dayId) {
        if (!isFullAttraction(attractionData)) {
          fullAttraction.order = day.attractions.length;
        }
        const newAttractions = [...day.attractions, fullAttraction];
        return { ...day, attractions: newAttractions };
      }
      return day;
    });

    set({
      trip: {
        ...trip,
        days: newDays,
        updatedAt: new Date().toISOString(),
      },
    });
  },

  updateAttraction: (dayId, attractionId, updates) => {
    const { trip, saveToUndoStack } = get();
    if (!trip) return;

    saveToUndoStack();

    const newDays = trip.days.map((day) => {
      if (day.id === dayId) {
        const newAttractions = day.attractions.map((attr) =>
          attr.id === attractionId
            ? { ...attr, ...updates, updatedAt: new Date().toISOString() }
            : attr
        );
        return { ...day, attractions: newAttractions };
      }
      return day;
    });

    set({
      trip: {
        ...trip,
        days: newDays,
        updatedAt: new Date().toISOString(),
      },
    });
  },

  deleteAttraction: (dayId, attractionId) => {
    const { trip, saveToUndoStack } = get();
    if (!trip) return;

    saveToUndoStack();

    const newDays = trip.days.map((day) => {
      if (day.id === dayId) {
        const newAttractions = day.attractions
          .filter((attr) => attr.id !== attractionId)
          .map((attr, index) => ({ ...attr, order: index }));
        return { ...day, attractions: newAttractions };
      }
      return day;
    });

    set({
      trip: {
        ...trip,
        days: newDays,
        updatedAt: new Date().toISOString(),
      },
      selectedAttractionId: get().selectedAttractionId === attractionId ? null : get().selectedAttractionId,
    });
  },

  moveAttraction: (fromDayId, toDayId, attractionId, toIndex) => {
    const { trip, saveToUndoStack } = get();
    if (!trip) return;

    saveToUndoStack();

    let movedAttraction: Attraction | null = null;

    const newDays = trip.days.map((day) => {
      if (day.id === fromDayId) {
        movedAttraction = day.attractions.find((a) => a.id === attractionId) || null;
        const newAttractions = day.attractions
          .filter((a) => a.id !== attractionId)
          .map((a, i) => ({ ...a, order: i }));
        return { ...day, attractions: newAttractions };
      }
      return day;
    });

    if (!movedAttraction) return;

    const finalDays = newDays.map((day) => {
      if (day.id === toDayId) {
        const newAttractions = [...day.attractions];
        newAttractions.splice(toIndex, 0, { ...movedAttraction! });
        const reordered = newAttractions.map((a, i) => ({ ...a, order: i }));
        return { ...day, attractions: reordered };
      }
      return day;
    });

    set({
      trip: {
        ...trip,
        days: finalDays,
        updatedAt: new Date().toISOString(),
      },
    });
  },

  addComment: (dayId, attractionId, comment) => {
    const { trip, saveToUndoStack } = get();
    if (!trip) return;

    saveToUndoStack();

    const newDays = trip.days.map((day) => {
      if (day.id === dayId) {
        const newAttractions = day.attractions.map((attr) =>
          attr.id === attractionId
            ? { ...attr, comments: [...attr.comments, comment] }
            : attr
        );
        return { ...day, attractions: newAttractions };
      }
      return day;
    });

    set({
      trip: {
        ...trip,
        days: newDays,
        updatedAt: new Date().toISOString(),
      },
    });
  },

  undo: () => {
    const { undoStack, redoStack, trip } = get();
    if (undoStack.length === 0) return;

    const newUndoStack = [...undoStack];
    const previousTrip = newUndoStack.pop()!;

    const newRedoStack = trip ? [trip, ...redoStack] : [...redoStack];
    if (newRedoStack.length > MAX_UNDO_STACK) {
      newRedoStack.pop();
    }

    set({
      trip: previousTrip,
      undoStack: newUndoStack,
      redoStack: newRedoStack,
    });
  },

  redo: () => {
    const { undoStack, redoStack, trip } = get();
    if (redoStack.length === 0) return;

    const newRedoStack = [...redoStack];
    const nextTrip = newRedoStack.shift()!;

    const newUndoStack = trip ? [...undoStack, trip] : [...undoStack];
    if (newUndoStack.length > MAX_UNDO_STACK) {
      newUndoStack.shift();
    }

    set({
      trip: nextTrip,
      undoStack: newUndoStack,
      redoStack: newRedoStack,
    });
  },

  canUndo: () => {
    return get().undoStack.length > 0;
  },

  canRedo: () => {
    return get().redoStack.length > 0;
  },

  fetchTrip: async (tripId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<Trip>(`/trips/${tripId}`);
      set({ trip: response.data, isLoading: false });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '获取行程失败';
      set({ error: errorMessage, isLoading: false });
    }
  },

  syncWithAPI: async () => {
    const { trip } = get();
    if (!trip) return;

    set({ isLoading: true, error: null });
    try {
      const response = await api.put<Trip>(`/trips/${trip.id}`, trip);
      set({ trip: response.data, isLoading: false });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '同步失败';
      set({ error: errorMessage, isLoading: false });
    }
  },
}));

export default useTripStore;
