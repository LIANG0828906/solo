import { create } from 'zustand';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

const API_BASE = '/api';
const TIMEOUT_MS = 2000;

async function fetchWithTimeout(url: string, options?: RequestInit) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

export interface TourEvent {
  id: string;
  date: string;
  bandName: string;
  city: string;
  venue: string;
  expectedTickets: number;
  ticketPrice: number;
  color?: string;
}

export interface EquipmentOrder {
  id: string;
  tourEventId: string;
  equipmentName: string;
  days: number;
  unitPrice: number;
}

export interface ConflictError {
  error: string;
  message: string;
  existingEvent: TourEvent;
}

interface TourState {
  tourEvents: TourEvent[];
  equipmentOrders: EquipmentOrder[];
  selectedDate: Date;
  selectedTourId: string | null;
  isLoading: boolean;
  conflictError: ConflictError | null;

  fetchTours: () => Promise<void>;
  fetchEquipment: (tourEventId: string) => Promise<void>;
  createTour: (data: Omit<TourEvent, 'id' | 'color'>) => Promise<TourEvent | null>;
  updateTour: (id: string, data: Partial<TourEvent>) => Promise<TourEvent | null>;
  deleteTour: (id: string) => Promise<void>;
  addEquipment: (data: Omit<EquipmentOrder, 'id'>) => Promise<EquipmentOrder | null>;
  removeEquipment: (id: string) => Promise<void>;
  setSelectedDate: (date: Date) => void;
  setSelectedTourId: (id: string | null) => void;
  clearConflict: () => void;
  getToursForDate: (date: Date) => TourEvent[];
  getToursForMonth: (date: Date) => TourEvent[];
  getEquipmentForTour: (tourId: string) => EquipmentOrder[];
  getMonthlyStats: (date: Date) => { totalIncome: number; totalExpense: number; netIncome: number };
}

const BAND_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
const bandColorMap: Record<string, string> = {};
let colorIndex = 0;

function getBandColor(bandName: string): string {
  if (!bandColorMap[bandName]) {
    bandColorMap[bandName] = BAND_COLORS[colorIndex % BAND_COLORS.length];
    colorIndex++;
  }
  return bandColorMap[bandName];
}

export const useTourStore = create<TourState>((set, get) => ({
  tourEvents: [],
  equipmentOrders: [],
  selectedDate: new Date(),
  selectedTourId: null,
  isLoading: false,
  conflictError: null,

  fetchTours: async () => {
    set({ isLoading: true });
    try {
      const res = await fetchWithTimeout(`${API_BASE}/tours`);
      const data = await res.json();
      const events = data.map((t: TourEvent) => ({ ...t, color: t.color || getBandColor(t.bandName) }));
      set({ tourEvents: events, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchEquipment: async (tourEventId: string) => {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/equipment?tourEventId=${tourEventId}`);
      const data = await res.json();
      set(state => {
        const other = state.equipmentOrders.filter(o => o.tourEventId !== tourEventId);
        return { equipmentOrders: [...other, ...data] };
      });
    } catch {
      // silent
    }
  },

  createTour: async (data) => {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/tours`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.status === 409) {
        const conflict: ConflictError = await res.json();
        set({ conflictError: conflict });
        return null;
      }
      const newEvent: TourEvent = await res.json();
      newEvent.color = newEvent.color || getBandColor(newEvent.bandName);
      set(state => ({ tourEvents: [...state.tourEvents, newEvent] }));
      return newEvent;
    } catch {
      return null;
    }
  },

  updateTour: async (id, data) => {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/tours/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.status === 409) {
        const conflict: ConflictError = await res.json();
        set({ conflictError: conflict });
        return null;
      }
      const updated: TourEvent = await res.json();
      updated.color = updated.color || getBandColor(updated.bandName);
      set(state => ({
        tourEvents: state.tourEvents.map(t => (t.id === id ? updated : t)),
      }));
      return updated;
    } catch {
      return null;
    }
  },

  deleteTour: async (id) => {
    try {
      await fetchWithTimeout(`${API_BASE}/tours/${id}`, { method: 'DELETE' });
      set(state => ({
        tourEvents: state.tourEvents.filter(t => t.id !== id),
        equipmentOrders: state.equipmentOrders.filter(o => o.tourEventId !== id),
        selectedTourId: state.selectedTourId === id ? null : state.selectedTourId,
      }));
    } catch {
      // silent
    }
  },

  addEquipment: async (data) => {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/equipment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const newOrder: EquipmentOrder = await res.json();
      set(state => ({ equipmentOrders: [...state.equipmentOrders, newOrder] }));
      return newOrder;
    } catch {
      return null;
    }
  },

  removeEquipment: async (id) => {
    try {
      await fetchWithTimeout(`${API_BASE}/equipment/${id}`, { method: 'DELETE' });
      set(state => ({
        equipmentOrders: state.equipmentOrders.filter(o => o.id !== id),
      }));
    } catch {
      // silent
    }
  },

  setSelectedDate: (date: Date) => set({ selectedDate: date }),
  setSelectedTourId: (id: string | null) => set({ selectedTourId: id }),
  clearConflict: () => set({ conflictError: null }),

  getToursForDate: (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return get().tourEvents.filter(t => t.date === dateStr);
  },

  getToursForMonth: (date: Date) => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    return get().tourEvents.filter(t => {
      const eventDate = parseISO(t.date);
      return isWithinInterval(eventDate, { start: monthStart, end: monthEnd });
    });
  },

  getEquipmentForTour: (tourId: string) => {
    return get().equipmentOrders.filter(o => o.tourEventId === tourId);
  },

  getMonthlyStats: (date: Date) => {
    const tours = get().getToursForMonth(date);
    const orders = get().equipmentOrders;
    let totalIncome = 0;
    let totalExpense = 0;
    for (const tour of tours) {
      totalIncome += tour.expectedTickets * tour.ticketPrice;
      const tourOrders = orders.filter(o => o.tourEventId === tour.id);
      for (const order of tourOrders) {
        totalExpense += order.days * order.unitPrice;
      }
    }
    return { totalIncome, totalExpense, netIncome: totalIncome - totalExpense };
  },
}));
