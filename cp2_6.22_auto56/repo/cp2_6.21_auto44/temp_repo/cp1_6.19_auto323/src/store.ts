import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { Event, CreateEventData } from './types';

const EMOJIS = ['🐱', '🐶', '🐰', '🦊', '🐼', '🐨', '🦁', '🐸', '🐵', '🦄', '🐯', '🦝'];

export function getUserId(): string {
  let userId = localStorage.getItem('rc_userId');
  if (!userId) {
    userId = 'user-' + Math.random().toString(36).substring(2, 11);
    localStorage.setItem('rc_userId', userId);
  }
  return userId;
}

export function getUsername(): string {
  let username = localStorage.getItem('rc_username');
  if (!username) {
    const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    username = `匿名${emoji}`;
    localStorage.setItem('rc_username', username);
  }
  return username;
}

export function getAvatar(): string {
  let avatar = localStorage.getItem('rc_avatar');
  if (!avatar) {
    const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    avatar = emoji;
    localStorage.setItem('rc_avatar', emoji);
  }
  return avatar;
}

function sortEvents(events: Event[]): Event[] {
  return [...events].sort((a, b) => {
    if (b.likes !== a.likes) return b.likes - a.likes;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

interface AppStore {
  events: Event[];
  selectedEvent: Event | null;
  connected: boolean;
  onlineCount: number;
  notification: string | null;
  socket: Socket | null;
  currentPage: number;
  showCreateForm: boolean;
  dashboardOpen: boolean;
  newEventId: string | null;
  confirmDialog: { show: boolean; eventId: string; title: string } | null;

  init: () => void;
  fetchEvents: () => Promise<void>;
  selectEvent: (event: Event | null) => void;
  createEvent: (data: CreateEventData) => Promise<void>;
  signUp: (eventId: string) => Promise<void>;
  confirmSignUp: (eventId: string, title: string) => void;
  cancelSignUp: () => void;
  like: (eventId: string) => Promise<void>;
  addComment: (eventId: string, content: string) => Promise<void>;
  setNotification: (msg: string | null) => void;
  setCurrentPage: (page: number) => void;
  setShowCreateForm: (show: boolean) => void;
  setDashboardOpen: (open: boolean) => void;
}

export const useStore = create<AppStore>((set, get) => ({
  events: [],
  selectedEvent: null,
  connected: false,
  onlineCount: 0,
  notification: null,
  socket: null,
  currentPage: 1,
  showCreateForm: false,
  dashboardOpen: false,
  newEventId: null,
  confirmDialog: null,

  init: () => {
    const socket = io();
    socket.on('connect', () => set({ connected: true }));
    socket.on('disconnect', () => set({ connected: false }));
    socket.on('online:count', (count: number) => set({ onlineCount: count }));
    socket.on('event:created', (event: Event) => {
      const events = sortEvents([event, ...get().events]);
      set({ events, newEventId: event.id });
      setTimeout(() => set({ newEventId: null }), 600);
    });
    socket.on('event:updated', (updated: Event) => {
      const prev = get().events;
      const events = sortEvents(
        prev.map((e) => (e.id === updated.id ? updated : e))
      );
      const selectedEvent =
        get().selectedEvent?.id === updated.id ? updated : get().selectedEvent;
      set({ events, selectedEvent });
    });
    set({ socket });
  },

  fetchEvents: async () => {
    const res = await fetch('/api/events');
    const data: Event[] = await res.json();
    set({ events: sortEvents(data) });
  },

  selectEvent: (event) => set({ selectedEvent: event, showCreateForm: false }),

  createEvent: async (data) => {
    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    set({ showCreateForm: false });
    get().setNotification('活动创建成功！');
  },

  signUp: async (eventId) => {
    const userId = getUserId();
    const res = await fetch(`/api/events/${eventId}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    set({ confirmDialog: null });
    if (res.ok) {
      get().setNotification('报名成功！');
    } else {
      const err = await res.json();
      get().setNotification(err.error || '报名失败');
    }
  },

  confirmSignUp: (eventId, title) => {
    set({ confirmDialog: { show: true, eventId, title } });
  },

  cancelSignUp: () => set({ confirmDialog: null }),

  like: async (eventId) => {
    const userId = getUserId();
    await fetch(`/api/events/${eventId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
  },

  addComment: async (eventId, content) => {
    const userId = getUserId();
    const username = getUsername();
    const avatar = getAvatar();
    await fetch(`/api/events/${eventId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, username, avatar, content }),
    });
  },

  setNotification: (msg) => {
    set({ notification: msg });
    if (msg) {
      setTimeout(() => {
        if (get().notification === msg) {
          set({ notification: null });
        }
      }, 2000);
    }
  },

  setCurrentPage: (page) => set({ currentPage: page }),
  setShowCreateForm: (show) => set({ showCreateForm: show, selectedEvent: null }),
  setDashboardOpen: (open) => set({ dashboardOpen: open }),
}));
