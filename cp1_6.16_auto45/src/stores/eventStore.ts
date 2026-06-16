import { create } from "zustand";

export interface Tier {
  name: string;
  price: number;
  total: number;
  remaining: number;
}

export interface EventItem {
  id: string;
  name: string;
  posterUrl: string;
  date: string;
  venue: string;
  artistId: string;
  artistName: string;
  artistBio: string;
  tiers: Tier[];
  tracks: string[];
  status: "pending" | "approved" | "rejected";
}

interface EventState {
  events: EventItem[];
  currentEvent: EventItem | null;
  loading: boolean;
  searchKeyword: string;
  dateFrom: string;
  dateTo: string;
  fetchEvents: () => Promise<void>;
  fetchEventById: (id: string) => Promise<void>;
  setSearchKeyword: (keyword: string) => void;
  setDateFilter: (from: string, to: string) => void;
}

export const useEventStore = create<EventState>((set, get) => ({
  events: [],
  currentEvent: null,
  loading: false,
  searchKeyword: "",
  dateFrom: "",
  dateTo: "",

  fetchEvents: async () => {
    set({ loading: true });
    try {
      const { searchKeyword, dateFrom, dateTo } = get();
      const params = new URLSearchParams();
      if (searchKeyword) params.set("keyword", searchKeyword);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      const res = await fetch(`/api/events?${params.toString()}`);
      const data = await res.json();
      set({ events: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchEventById: async (id) => {
    set({ loading: true });
    try {
      const res = await fetch(`/api/events/${id}`);
      const data = await res.json();
      set({ currentEvent: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  setSearchKeyword: (keyword) => {
    set({ searchKeyword: keyword });
  },

  setDateFilter: (from, to) => {
    set({ dateFrom: from, dateTo: to });
  },
}));
