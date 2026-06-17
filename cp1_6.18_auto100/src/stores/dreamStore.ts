import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Dream {
  id: string;
  title: string;
  date: string;
  emotionRating: 1 | 2 | 3 | 4 | 5;
  tags: Tag[];
  content: string;
  createdAt: number;
}

export type SortType = 'date-desc' | 'date-asc' | 'emotion-desc' | 'emotion-asc';

interface DreamStore {
  dreams: Dream[];
  selectedDreamId: string | null;
  expandedDreamId: string | null;
  activeTags: string[];
  sortType: SortType;
  editorOpen: boolean;
  editingDream: Dream | null;
  filteredAndSortedDreams: Dream[];
  allTags: Tag[];
  addDream: (dream: Omit<Dream, 'id' | 'createdAt'>) => void;
  updateDream: (id: string, updates: Partial<Dream>) => void;
  deleteDream: (id: string) => void;
  toggleTagFilter: (tagId: string) => void;
  setSortType: (sortType: SortType) => void;
  setSelectedDream: (dreamId: string | null) => void;
  setExpandedDream: (dreamId: string | null) => void;
  openEditor: (dream?: Dream) => void;
  closeEditor: () => void;
}

const STORAGE_KEY = 'dream-map-data';

const loadFromStorage = (): Dream[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveToStorage = (dreams: Dream[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dreams));
  } catch {
    console.error('Failed to save dreams to storage');
  }
};

const filterAndSortDreams = (dreams: Dream[], activeTags: string[], sortType: SortType): Dream[] => {
  let result = [...dreams];

  if (activeTags.length > 0) {
    result = result.filter(dream =>
      dream.tags.some(tag => activeTags.includes(tag.id))
    );
  }

  switch (sortType) {
    case 'date-desc':
      result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      break;
    case 'date-asc':
      result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      break;
    case 'emotion-desc':
      result.sort((a, b) => b.emotionRating - a.emotionRating);
      break;
    case 'emotion-asc':
      result.sort((a, b) => a.emotionRating - b.emotionRating);
      break;
  }

  return result;
};

const getAllTags = (dreams: Dream[]): Tag[] => {
  const tagMap = new Map<string, Tag>();
  dreams.forEach(dream => {
    dream.tags.forEach(tag => {
      if (!tagMap.has(tag.id)) {
        tagMap.set(tag.id, tag);
      }
    });
  });
  return Array.from(tagMap.values());
};

export const useDreamStore = create<DreamStore>((set, get) => ({
  dreams: loadFromStorage(),
  selectedDreamId: null,
  expandedDreamId: null,
  activeTags: [],
  sortType: 'date-desc',
  editorOpen: false,
  editingDream: null,

  get filteredAndSortedDreams() {
    return filterAndSortDreams(get().dreams, get().activeTags, get().sortType);
  },

  get allTags() {
    return getAllTags(get().dreams);
  },

  addDream: (dream) => {
    const newDream: Dream = {
      ...dream,
      id: uuidv4(),
      createdAt: Date.now()
    };
    const newDreams = [...get().dreams, newDream];
    set({ dreams: newDreams });
    saveToStorage(newDreams);
  },

  updateDream: (id, updates) => {
    const newDreams = get().dreams.map(dream =>
      dream.id === id ? { ...dream, ...updates } : dream
    );
    set({ dreams: newDreams });
    saveToStorage(newDreams);
  },

  deleteDream: (id) => {
    const newDreams = get().dreams.filter(dream => dream.id !== id);
    const { selectedDreamId, expandedDreamId } = get();
    set({
      dreams: newDreams,
      selectedDreamId: selectedDreamId === id ? null : selectedDreamId,
      expandedDreamId: expandedDreamId === id ? null : expandedDreamId
    });
    saveToStorage(newDreams);
  },

  toggleTagFilter: (tagId) => {
    const { activeTags } = get();
    const newActiveTags = activeTags.includes(tagId)
      ? activeTags.filter(id => id !== tagId)
      : [...activeTags, tagId];
    set({ activeTags: newActiveTags });
  },

  setSortType: (sortType) => {
    set({ sortType });
  },

  setSelectedDream: (dreamId) => {
    set({ selectedDreamId: dreamId });
  },

  setExpandedDream: (dreamId) => {
    set({ expandedDreamId: dreamId });
  },

  openEditor: (dream) => {
    set({
      editorOpen: true,
      editingDream: dream || null
    });
  },

  closeEditor: () => {
    set({
      editorOpen: false,
      editingDream: null
    });
  }
}));
