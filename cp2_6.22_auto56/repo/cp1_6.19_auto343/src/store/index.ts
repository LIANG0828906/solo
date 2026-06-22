import { create } from 'zustand';

type Role = 'annotator' | 'reviewer' | 'admin' | null;

interface AppState {
  role: Role;
  setRole: (role: Role) => void;
  activeModule: string;
  setActiveModule: (module: string) => void;
  errorMessage: string | null;
  setErrorMessage: (message: string | null) => void;
  currentUser: string;
  setCurrentUser: (user: string) => void;
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  logout: () => void;
}

const getStoredRole = (): Role => {
  const stored = localStorage.getItem('role');
  if (stored === 'annotator' || stored === 'reviewer' || stored === 'admin') {
    return stored;
  }
  return null;
};

const getStoredUser = (): string => {
  return localStorage.getItem('currentUser') || '用户';
};

const getDefaultModule = (role: Role): string => {
  if (role === 'annotator') return 'annotation';
  if (role === 'reviewer') return 'review';
  if (role === 'admin') return 'annotation';
  return '';
};

const initialRole = getStoredRole();

export const useAppStore = create<AppState>((set) => ({
  role: initialRole,
  setRole: (role) => {
    if (role) {
      localStorage.setItem('role', role);
    } else {
      localStorage.removeItem('role');
    }
    set({ role, activeModule: getDefaultModule(role), selectedTaskId: null });
  },
  activeModule: getDefaultModule(initialRole),
  setActiveModule: (module) => set({ activeModule: module, selectedTaskId: null }),
  errorMessage: null,
  setErrorMessage: (message) => set({ errorMessage: message }),
  currentUser: getStoredUser(),
  setCurrentUser: (user) => {
    localStorage.setItem('currentUser', user);
    set({ currentUser: user });
  },
  selectedTaskId: null,
  setSelectedTaskId: (id) => set({ selectedTaskId: id }),
  logout: () => {
    localStorage.removeItem('role');
    localStorage.removeItem('currentUser');
    set({
      role: null,
      activeModule: '',
      selectedTaskId: null,
      currentUser: '用户',
    });
  },
}));
