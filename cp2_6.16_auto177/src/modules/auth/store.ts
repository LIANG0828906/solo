import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  User,
  RegisterInput,
  LoginInput,
  registerUser,
  loginUser,
  updateUserContact,
  updateUserPassword,
} from './models';

interface AuthState {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  register: (input: RegisterInput) => Promise<User>;
  login: (input: LoginInput) => Promise<User>;
  logout: () => void;
  updateContact: (contact: string) => Promise<User>;
  updatePassword: (pw: string) => Promise<User>;
  setCurrentUser: (user: User) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      loading: false,
      error: null,

      register: async (input) => {
        set({ loading: true, error: null });
        try {
          const user = await registerUser(input);
          set({ currentUser: user, loading: false });
          return user;
        } catch (e: any) {
          set({ error: e.message, loading: false });
          throw e;
        }
      },

      login: async (input) => {
        set({ loading: true, error: null });
        try {
          const user = await loginUser(input);
          set({ currentUser: user, loading: false });
          return user;
        } catch (e: any) {
          set({ error: e.message, loading: false });
          throw e;
        }
      },

      logout: () => {
        set({ currentUser: null, error: null });
      },

      updateContact: async (contact) => {
        const { currentUser } = get();
        if (!currentUser) throw new Error('未登录');
        set({ loading: true, error: null });
        try {
          const user = await updateUserContact(currentUser.id, contact);
          set({ currentUser: user, loading: false });
          return user;
        } catch (e: any) {
          set({ error: e.message, loading: false });
          throw e;
        }
      },

      updatePassword: async (pw) => {
        const { currentUser } = get();
        if (!currentUser) throw new Error('未登录');
        set({ loading: true, error: null });
        try {
          const user = await updateUserPassword(currentUser.id, pw);
          set({ currentUser: user, loading: false });
          return user;
        } catch (e: any) {
          set({ error: e.message, loading: false });
          throw e;
        }
      },

      setCurrentUser: (user) => set({ currentUser: user }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'swapbazaar_auth',
      partialize: (state) => ({ currentUser: state.currentUser }),
    }
  )
);
