import { create } from 'zustand';
import axios from 'axios';
import type { Track, TrackWithCounts, Blog, Comment, AppState, AppActions } from '@/types';

const API_BASE_URL = 'http://localhost:3001/api';

type AppStore = AppState & AppActions;

export const useAppStore = create<AppStore>((set, get) => ({
  tracks: [],
  blogs: [],
  comments: [],
  currentTrack: null,
  currentBlog: null,
  isLoading: false,
  error: null,

  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ error }),

  fetchTracks: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get<TrackWithCounts[]>(`${API_BASE_URL}/tracks`);
      set({ tracks: response.data, isLoading: false });
    } catch (error) {
      set({ error: '加载曲目列表失败', isLoading: false });
    }
  },

  fetchTrack: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get<Track>(`${API_BASE_URL}/tracks/${id}`);
      const track = response.data;
      set({ currentTrack: track, isLoading: false });
      return track;
    } catch (error) {
      set({ error: '加载曲目详情失败', isLoading: false });
      return null;
    }
  },

  deleteTrack: async (id: string) => {
    try {
      await axios.delete(`${API_BASE_URL}/tracks/${id}`);
      set((state) => ({
        tracks: state.tracks.filter((t) => t.id !== id),
      }));
    } catch (error) {
      set({ error: '删除曲目失败' });
    }
  },

  likeTrack: async (id: string) => {
    try {
      await axios.post(`${API_BASE_URL}/tracks/${id}/like`);
      set((state) => ({
        tracks: state.tracks.map((t) =>
          t.id === id ? { ...t, likes: t.likes + 1 } : t
        ),
        currentTrack:
          state.currentTrack?.id === id
            ? { ...state.currentTrack, likes: state.currentTrack.likes + 1 }
            : state.currentTrack,
      }));
    } catch (error) {
      set({ error: '点赞失败' });
    }
  },

  fetchBlogs: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get<Blog[]>(`${API_BASE_URL}/blogs`);
      set({ blogs: response.data, isLoading: false });
    } catch (error) {
      set({ error: '加载博客列表失败', isLoading: false });
    }
  },

  fetchBlog: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get<Blog>(`${API_BASE_URL}/blogs/${id}`);
      const blog = response.data;
      set({ currentBlog: blog, isLoading: false });
      return blog;
    } catch (error) {
      set({ error: '加载博客详情失败', isLoading: false });
      return null;
    }
  },

  deleteBlog: async (id: string) => {
    try {
      await axios.delete(`${API_BASE_URL}/blogs/${id}`);
      set((state) => ({
        blogs: state.blogs.filter((b) => b.id !== id),
      }));
    } catch (error) {
      set({ error: '删除博客失败' });
    }
  },

  fetchComments: async (targetId?: string, targetType?: 'track' | 'blog') => {
    set({ isLoading: true, error: null });
    try {
      let url = `${API_BASE_URL}/comments`;
      const params: Record<string, string> = {};
      if (targetId) params.targetId = targetId;
      if (targetType) params.targetType = targetType;
      const response = await axios.get<Comment[]>(url, { params });
      set({ comments: response.data, isLoading: false });
    } catch (error) {
      set({ error: '加载评论失败', isLoading: false });
    }
  },

  addComment: async (
    targetId: string,
    targetType: 'track' | 'blog',
    content: string,
    author: string
  ) => {
    try {
      const response = await axios.post<Comment>(`${API_BASE_URL}/comments`, {
        targetId,
        targetType,
        content,
        author,
      });
      const newComment = response.data;
      set((state) => ({
        comments: [...state.comments, newComment],
        tracks: state.tracks.map((t) =>
          t.id === targetId && targetType === 'track'
            ? { ...t, commentCount: t.commentCount + 1 }
            : t
        ),
      }));
    } catch (error) {
      set({ error: '提交评论失败' });
    }
  },

  approveComment: async (id: string) => {
    try {
      await axios.put(`${API_BASE_URL}/comments/${id}`);
      set((state) => ({
        comments: state.comments.map((c) =>
          c.id === id ? { ...c, approved: true } : c
        ),
      }));
    } catch (error) {
      set({ error: '审核评论失败' });
    }
  },

  deleteComment: async (id: string) => {
    try {
      await axios.delete(`${API_BASE_URL}/comments/${id}`);
      set((state) => ({
        comments: state.comments.filter((c) => c.id !== id),
      }));
    } catch (error) {
      set({ error: '删除评论失败' });
    }
  },
}));
