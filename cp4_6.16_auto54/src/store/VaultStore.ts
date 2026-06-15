import { create } from 'zustand';
import {
  VaultEntry,
  Category,
  getAllEntries,
  saveEntry,
  updateEntry as updateEntryInStore,
  deleteEntry as deleteEntryFromStore,
  hasMasterKey,
  setupMasterPassword,
  unlockWithMasterPassword,
} from '@/modules/storage/DataStore';
import { v4 as uuidv4 } from 'uuid';

interface VaultStore {
  entries: VaultEntry[];
  category: 'all' | Category;
  searchQuery: string;
  isUnlocked: boolean;
  isAddPanelOpen: boolean;
  editingEntry: VaultEntry | null;
  cryptoKey: CryptoKey | null;
  notification: string | null;
  isFirstTime: boolean;
  isCheckingMaster: boolean;

  checkMasterKey: () => Promise<void>;
  setupAndUnlock: (password: string) => Promise<void>;
  unlock: (password: string) => Promise<void>;
  lock: () => void;
  setCategory: (cat: 'all' | Category) => void;
  setSearchQuery: (q: string) => void;
  loadEntries: () => Promise<void>;
  addEntry: (entry: Omit<VaultEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEntry: (entry: VaultEntry) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  openAddPanel: () => void;
  closeAddPanel: () => void;
  setEditingEntry: (entry: VaultEntry | null) => void;
  showNotification: (msg: string) => void;
  filteredEntries: () => VaultEntry[];
}

const useVaultStore = create<VaultStore>((set, get) => ({
  entries: [],
  category: 'all',
  searchQuery: '',
  isUnlocked: false,
  isAddPanelOpen: false,
  editingEntry: null,
  cryptoKey: null,
  notification: null,
  isFirstTime: false,
  isCheckingMaster: false,

  checkMasterKey: async () => {
    set({ isCheckingMaster: true });
    const result = await hasMasterKey();
    set({ isFirstTime: !result, isCheckingMaster: false });
  },

  setupAndUnlock: async (password: string) => {
    const key = await setupMasterPassword(password);
    set({ cryptoKey: key, isUnlocked: true });
    await get().loadEntries();
    set({ isFirstTime: false });
  },

  unlock: async (password: string) => {
    const key = await unlockWithMasterPassword(password);
    if (key !== null) {
      set({ cryptoKey: key, isUnlocked: true });
      await get().loadEntries();
    } else {
      throw new Error('Invalid master password');
    }
  },

  lock: () => {
    set({ isUnlocked: false, cryptoKey: null, entries: [] });
  },

  setCategory: (cat) => {
    set({ category: cat });
  },

  setSearchQuery: (q) => {
    set({ searchQuery: q });
  },

  loadEntries: async () => {
    const { cryptoKey } = get();
    if (cryptoKey) {
      const all = await getAllEntries(cryptoKey);
      set({ entries: all });
    }
  },

  addEntry: async (entry) => {
    const now = Date.now();
    const full: VaultEntry = {
      ...entry,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    await saveEntry(full);
    await get().loadEntries();
    get().showNotification('条目已保存');
    get().closeAddPanel();
  },

  updateEntry: async (entry) => {
    await updateEntryInStore(entry);
    await get().loadEntries();
    get().showNotification('条目已更新');
    get().closeAddPanel();
    get().setEditingEntry(null);
  },

  deleteEntry: async (id) => {
    await deleteEntryFromStore(id);
    await get().loadEntries();
    get().showNotification('条目已删除');
  },

  openAddPanel: () => {
    set({ isAddPanelOpen: true });
  },

  closeAddPanel: () => {
    set({ isAddPanelOpen: false });
  },

  setEditingEntry: (entry) => {
    set({ editingEntry: entry });
  },

  showNotification: (msg) => {
    set({ notification: msg });
    setTimeout(() => {
      set({ notification: null });
    }, 3000);
  },

  filteredEntries: () => {
    const { entries, category, searchQuery } = get();
    return entries.filter((e) => {
      const catMatch = category === 'all' || e.category === category;
      const q = searchQuery.toLowerCase();
      const searchMatch =
        !q ||
        e.title.toLowerCase().includes(q) ||
        e.username.toLowerCase().includes(q);
      return catMatch && searchMatch;
    });
  },
}));

export default useVaultStore;
