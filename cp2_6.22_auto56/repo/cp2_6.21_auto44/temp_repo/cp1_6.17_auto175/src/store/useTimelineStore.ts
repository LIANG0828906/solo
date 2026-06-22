import { create } from 'zustand';
import axios from 'axios';

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: number;
}

export interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  tags: string[];
  content: string;
  images: string[];
  createdAt: number;
  likes: number;
  comments: Comment[];
  isPublic: boolean;
  userId: string;
  authorName: string;
  authorAvatar: string;
}

interface TimelineState {
  events: TimelineEvent[];
  selectedEventId: string | null;
  isModalOpen: boolean;
  modalType: 'comment' | 'image' | null;
  modalEventId: string | null;
  isLoggedIn: boolean;
  currentUser: { id: string; name: string; avatar: string } | null;
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  communityEvents: TimelineEvent[];
  communityPage: number;
  communityTotal: number;
  commentSidebarOpen: boolean;
  commentSidebarEventId: string | null;

  setSelectedEvent: (id: string | null) => void;
  openModal: (type: 'comment' | 'image', eventId: string) => void;
  closeModal: () => void;
  toggleCommentSidebar: (eventId: string | null) => void;
  setLoggedIn: (logged: boolean, user?: { id: string; name: string; avatar: string }) => void;
  loadEvents: (page?: number, isPublic?: boolean) => Promise<void>;
  loadCommunityEvents: (page?: number) => Promise<void>;
  addEvent: (event: Omit<TimelineEvent, 'id' | 'createdAt' | 'likes' | 'comments'>) => Promise<void>;
  updateEvent: (id: string, updates: Partial<TimelineEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  likeEvent: (id: string) => Promise<void>;
  addComment: (eventId: string, content: string) => Promise<void>;
  loadMoreEvents: () => Promise<void>;
  loadMoreCommunityEvents: () => Promise<void>;
}

export const useTimelineStore = create<TimelineState>((set, get) => ({
  events: [],
  selectedEventId: null,
  isModalOpen: false,
  modalType: null,
  modalEventId: null,
  isLoggedIn: true,
  currentUser: { id: 'user0', name: '我', avatar: '' },
  currentPage: 1,
  totalPages: 1,
  isLoading: false,
  communityEvents: [],
  communityPage: 1,
  communityTotal: 0,
  commentSidebarOpen: false,
  commentSidebarEventId: null,

  setSelectedEvent: (id) => set({ selectedEventId: id }),

  openModal: (type, eventId) => set({ isModalOpen: true, modalType: type, modalEventId: eventId }),

  closeModal: () => set({ isModalOpen: false, modalType: null, modalEventId: null }),

  toggleCommentSidebar: (eventId) => {
    const { commentSidebarOpen, commentSidebarEventId } = get();
    if (commentSidebarOpen && commentSidebarEventId === eventId) {
      set({ commentSidebarOpen: false, commentSidebarEventId: null });
    } else {
      set({ commentSidebarOpen: true, commentSidebarEventId: eventId });
    }
  },

  setLoggedIn: (logged, user) => set({ isLoggedIn: logged, currentUser: user || null }),

  loadEvents: async (page = 1, isPublic) => {
    set({ isLoading: true });
    try {
      const params: Record<string, string> = { page: String(page), limit: '10' };
      if (isPublic !== undefined) params.isPublic = String(isPublic);
      const res = await axios.get('/api/events', { params });
      set({
        events: page === 1 ? res.data.events : [...get().events, ...res.data.events],
        currentPage: page,
        totalPages: Math.ceil(res.data.total / 10),
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  loadCommunityEvents: async (page = 1) => {
    set({ isLoading: true });
    try {
      const res = await axios.get('/api/community', { params: { page, limit: 9 } });
      set({
        communityEvents: page === 1 ? res.data.timelines : [...get().communityEvents, ...res.data.timelines],
        communityPage: page,
        communityTotal: res.data.total,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  addEvent: async (event) => {
    try {
      const res = await axios.post('/api/events', event);
      set(state => ({ events: [res.data, ...state.events] }));
    } catch (e) {
      console.error('Failed to add event', e);
    }
  },

  updateEvent: async (id, updates) => {
    try {
      const res = await axios.put(`/api/events/${id}`, updates);
      set(state => ({
        events: state.events.map(e => (e.id === id ? res.data : e)),
      }));
    } catch (e) {
      console.error('Failed to update event', e);
    }
  },

  deleteEvent: async (id) => {
    try {
      await axios.delete(`/api/events/${id}`);
      set(state => ({
        events: state.events.filter(e => e.id !== id),
        selectedEventId: state.selectedEventId === id ? null : state.selectedEventId,
      }));
    } catch (e) {
      console.error('Failed to delete event', e);
    }
  },

  likeEvent: async (id) => {
    try {
      const res = await axios.post(`/api/events/${id}/like`);
      set(state => ({
        events: state.events.map(e => (e.id === id ? res.data : e)),
        communityEvents: state.communityEvents.map(e => (e.id === id ? res.data : e)),
      }));
    } catch (e) {
      console.error('Failed to like event', e);
    }
  },

  addComment: async (eventId, content) => {
    const { currentUser } = get();
    if (!currentUser) return;
    try {
      const res = await axios.post(`/api/events/${eventId}/comment`, {
        userId: currentUser.id,
        userName: currentUser.name,
        content,
      });
      set(state => ({
        events: state.events.map(e => (e.id === eventId ? res.data : e)),
        communityEvents: state.communityEvents.map(e => (e.id === eventId ? res.data : e)),
      }));
    } catch (e) {
      console.error('Failed to add comment', e);
    }
  },

  loadMoreEvents: async () => {
    const { currentPage, totalPages, isLoading } = get();
    if (isLoading || currentPage >= totalPages) return;
    await get().loadEvents(currentPage + 1);
  },

  loadMoreCommunityEvents: async () => {
    const { communityPage, communityTotal, isLoading } = get();
    if (isLoading || communityPage * 9 >= communityTotal) return;
    await get().loadCommunityEvents(communityPage + 1);
  },
}));
