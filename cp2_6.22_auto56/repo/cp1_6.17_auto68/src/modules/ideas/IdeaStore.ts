import { create } from 'zustand';
import type { Idea, Comment } from '../../types';

interface IdeaStore {
  ideas: Idea[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  currentUserId: string;
  fetchIdeas: (search?: string) => Promise<void>;
  createIdea: (data: { title: string; description: string; author?: string }) => Promise<Idea | null>;
  updateIdea: (id: string, data: { title?: string; description?: string }) => Promise<Idea | null>;
  deleteIdea: (id: string) => Promise<boolean>;
  toggleLike: (id: string) => Promise<{ likes: number; liked: boolean } | null>;
  addComment: (id: string, content: string, author?: string) => Promise<Comment | null>;
  fetchComments: (ideaId: string) => Promise<Comment[]>;
  setSearchQuery: (query: string) => void;
}

const generateUserId = (): string => {
  let userId = localStorage.getItem('idea_storm_user_id');
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('idea_storm_user_id', userId);
  }
  return userId;
};

export const useIdeaStore = create<IdeaStore>((set, get) => ({
  ideas: [],
  loading: false,
  error: null,
  searchQuery: '',
  currentUserId: generateUserId(),

  fetchIdeas: async (search?: string) => {
    set({ loading: true, error: null });
    try {
      const query = search !== undefined ? search : get().searchQuery;
      const url = query ? `/api/ideas?search=${encodeURIComponent(query)}` : '/api/ideas';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch ideas');
      const ideas: Idea[] = await response.json();
      set({ ideas, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  createIdea: async (data) => {
    try {
      const userId = get().currentUserId;
      const response = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          author: data.author || '匿名用户',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`
        })
      });
      if (!response.ok) throw new Error('Failed to create idea');
      const newIdea: Idea = await response.json();
      set(state => ({ ideas: [newIdea, ...state.ideas] }));
      return newIdea;
    } catch (error) {
      set({ error: (error as Error).message });
      return null;
    }
  },

  updateIdea: async (id, data) => {
    try {
      const response = await fetch(`/api/ideas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update idea');
      const updatedIdea: Idea = await response.json();
      set(state => ({
        ideas: state.ideas.map(i => (i.id === id ? updatedIdea : i))
      }));
      return updatedIdea;
    } catch (error) {
      set({ error: (error as Error).message });
      return null;
    }
  },

  deleteIdea: async (id) => {
    try {
      const response = await fetch(`/api/ideas/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete idea');
      set(state => ({
        ideas: state.ideas.filter(i => i.id !== id)
      }));
      return true;
    } catch (error) {
      set({ error: (error as Error).message });
      return false;
    }
  },

  toggleLike: async (id) => {
    try {
      const userId = get().currentUserId;
      const response = await fetch(`/api/ideas/${id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (!response.ok) throw new Error('Failed to toggle like');
      const result: { likes: number; liked: boolean } = await response.json();
      
      set(state => ({
        ideas: state.ideas.map(i =>
          i.id === id
            ? {
                ...i,
                likes: result.likes,
                likedBy: result.liked
                  ? [...i.likedBy, userId]
                  : i.likedBy.filter(u => u !== userId)
              }
            : i
        )
      }));
      
      return result;
    } catch (error) {
      set({ error: (error as Error).message });
      return null;
    }
  },

  addComment: async (id, content, author) => {
    try {
      const userId = get().currentUserId;
      const response = await fetch(`/api/ideas/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: author || '匿名用户',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
          content
        })
      });
      if (!response.ok) throw new Error('Failed to add comment');
      const newComment: Comment = await response.json();
      
      set(state => ({
        ideas: state.ideas.map(i =>
          i.id === id ? { ...i, commentCount: i.commentCount + 1 } : i
        )
      }));
      
      return newComment;
    } catch (error) {
      set({ error: (error as Error).message });
      return null;
    }
  },

  fetchComments: async (ideaId) => {
    try {
      const response = await fetch(`/api/ideas/${ideaId}/comments`);
      if (!response.ok) throw new Error('Failed to fetch comments');
      return await response.json();
    } catch (error) {
      set({ error: (error as Error).message });
      return [];
    }
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
    void get().fetchIdeas(query);
  }
}));
