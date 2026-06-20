import { create } from 'zustand';
import { Plant, Post, User, Comment, PlantVariety, plantAPI, postAPI, authAPI } from '../services/api';

interface PlantState {
  user: User | null;
  plants: Plant[];
  posts: Post[];
  currentPlant: Plant | null;
  isLoading: boolean;
  error: string | null;
  
  setUser: (user: User | null) => void;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  
  fetchPlants: () => Promise<void>;
  createPlant: (variety: PlantVariety, name: string) => Promise<void>;
  setCurrentPlant: (plant: Plant | null) => void;
  updatePlantInStore: (plant: Plant) => void;
  
  waterPlant: (id: number) => Promise<void>;
  fertilizePlant: (id: number) => Promise<void>;
  sunlightPlant: (id: number) => Promise<void>;
  
  fetchPosts: (page?: number, variety?: string, sortBy?: string) => Promise<void>;
  createPost: (plantId: number, imageUrl: string, variety: string) => Promise<void>;
  likePost: (postId: number) => Promise<void>;
  addComment: (postId: number, content: string) => Promise<void>;
}

const getStoredUser = (): User | null => {
  try {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const usePlantStore = create<PlantState>((set, get) => ({
  user: getStoredUser(),
  plants: [],
  posts: [],
  currentPlant: null,
  isLoading: false,
  error: null,

  setUser: (user) => {
    set({ user });
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  },

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.login(username, password);
      const { access_token, user } = response.data;
      localStorage.setItem('token', access_token);
      set({ user, isLoading: false });
      localStorage.setItem('user', JSON.stringify(user));
    } catch (err: any) {
      set({ error: err.response?.data?.detail || '登录失败', isLoading: false });
      throw err;
    }
  },

  register: async (username, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.register(username, email, password);
      const { access_token, user } = response.data;
      localStorage.setItem('token', access_token);
      set({ user, isLoading: false });
      localStorage.setItem('user', JSON.stringify(user));
    } catch (err: any) {
      set({ error: err.response?.data?.detail || '注册失败', isLoading: false });
      throw err;
    }
  },

  logout: () => {
    set({ user: null, plants: [], currentPlant: null });
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  fetchPlants: async () => {
    set({ isLoading: true });
    try {
      const response = await plantAPI.getPlants();
      set({ plants: response.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  createPlant: async (variety, name) => {
    set({ isLoading: true });
    try {
      const response = await plantAPI.createPlant(variety, name);
      set((state) => ({
        plants: [...state.plants, response.data],
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  setCurrentPlant: (plant) => {
    set({ currentPlant: plant });
  },

  updatePlantInStore: (plant) => {
    set((state) => ({
      plants: state.plants.map((p) => (p.id === plant.id ? plant : p)),
      currentPlant: state.currentPlant?.id === plant.id ? plant : state.currentPlant,
    }));
  },

  waterPlant: async (id) => {
    try {
      const response = await plantAPI.water(id);
      get().updatePlantInStore(response.data);
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  fertilizePlant: async (id) => {
    try {
      const response = await plantAPI.fertilize(id);
      get().updatePlantInStore(response.data);
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  sunlightPlant: async (id) => {
    try {
      const response = await plantAPI.sunlight(id);
      get().updatePlantInStore(response.data);
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  fetchPosts: async (page = 1, variety, sortBy) => {
    set({ isLoading: true });
    try {
      const response = await postAPI.getPosts(page, variety, sortBy);
      set((state) => ({
        posts: page === 1 ? response.data : [...state.posts, ...response.data],
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  createPost: async (plantId, imageUrl, variety) => {
    try {
      const response = await postAPI.createPost(plantId, imageUrl, variety);
      set((state) => ({
        posts: [response.data, ...state.posts],
      }));
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  likePost: async (postId) => {
    try {
      const response = await postAPI.likePost(postId);
      const { likes, liked } = response.data;
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId ? { ...p, likes, liked_by_me: liked } : p
        ),
      }));
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  addComment: async (postId, content) => {
    try {
      const response = await postAPI.addComment(postId, content);
      const newComment = response.data;
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId
            ? { ...p, comments: [...p.comments.slice(-2), newComment] }
            : p
        ),
      }));
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },
}));
