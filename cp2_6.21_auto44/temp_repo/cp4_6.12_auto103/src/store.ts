import { create } from 'zustand';
import { getCodes, getFolders, createCode, createFolder, updateCode, type CodeSnippet, type Folder } from './api';

interface AppState {
  codes: CodeSnippet[];
  folders: Folder[];
  selectedFolderId: string | null;
  sidebarOpen: boolean;
  loading: boolean;
  toast: { message: string; visible: boolean };
  detailCodeId: string | null;

  fetchCodes: () => Promise<void>;
  fetchFolders: () => Promise<void>;
  setSelectedFolderId: (id: string | null) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  addCode: (data: Partial<CodeSnippet>) => Promise<CodeSnippet>;
  addFolder: (data: Partial<Folder>) => Promise<Folder>;
  editCode: (id: string, data: Partial<CodeSnippet>) => Promise<void>;
  showToast: (message: string) => void;
  setDetailCodeId: (id: string | null) => void;
}

export const useStore = create<AppState>((set, get) => ({
  codes: [],
  folders: [],
  selectedFolderId: null,
  sidebarOpen: false,
  loading: false,
  toast: { message: '', visible: false },
  detailCodeId: null,

  fetchCodes: async () => {
    set({ loading: true });
    try {
      const codes = await getCodes();
      set({ codes });
    } finally {
      set({ loading: false });
    }
  },

  fetchFolders: async () => {
    try {
      const folders = await getFolders();
      set({ folders });
    } catch {}
  },

  setSelectedFolderId: (id) => set({ selectedFolderId: id }),

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  addCode: async (data) => {
    const newCode = await createCode(data);
    set((s) => ({ codes: [newCode, ...s.codes] }));
    await get().fetchFolders();
    return newCode;
  },

  addFolder: async (data) => {
    const newFolder = await createFolder(data);
    set((s) => ({ folders: [...s.folders, newFolder] }));
    return newFolder;
  },

  editCode: async (id, data) => {
    const updated = await updateCode(id, data);
    set((s) => ({
      codes: s.codes.map((c) => (c.id === id ? updated : c)),
    }));
    await get().fetchFolders();
  },

  showToast: (message) => {
    set({ toast: { message, visible: true } });
    setTimeout(() => {
      set((s) => ({ toast: { ...s.toast, visible: false } }));
    }, 2000);
  },

  setDetailCodeId: (id) => set({ detailCodeId: id }),
}));
