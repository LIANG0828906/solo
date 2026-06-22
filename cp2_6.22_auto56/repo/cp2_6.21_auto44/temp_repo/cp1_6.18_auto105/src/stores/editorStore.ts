import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface Block {
  id: string;
  type: 'title' | 'text' | 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  lockedBy?: string;
}

export interface User {
  id: string;
  name: string;
  color: string;
  online: boolean;
  editingBlockId?: string;
}

interface EditorState {
  blocks: Block[];
  users: User[];
  selectedBlockId: string | null;
  currentUserId: string;
  collaborationOpen: boolean;
  setSelectedBlockId: (id: string | null) => void;
  addBlock: (type: 'title' | 'text' | 'image') => void;
  updateBlock: (id: string, updates: Partial<Block>) => void;
  deleteBlock: (id: string) => void;
  lockBlock: (blockId: string, userId: string) => void;
  unlockBlock: (blockId: string) => void;
  toggleCollaboration: () => void;
  setUserEditingBlock: (userId: string, blockId: string | null) => void;
}

const mockUsers: User[] = [
  { id: 'user-1', name: '我', color: '#3B82F6', online: true },
  { id: 'user-2', name: '张三', color: '#10B981', online: true },
  { id: 'user-3', name: '李四', color: '#F59E0B', online: true },
  { id: 'user-4', name: '王五', color: '#EF4444', online: false },
];

export const useEditorStore = create<EditorState>((set, get) => ({
  blocks: [],
  users: mockUsers,
  selectedBlockId: null,
  currentUserId: 'user-1',
  collaborationOpen: false,

  setSelectedBlockId: (id) => set({ selectedBlockId: id }),

  addBlock: (type) => {
    const defaultSizes = {
      title: { width: 600, height: 60, content: '请输入标题' },
      text: { width: 500, height: 120, content: '请输入文本内容...' },
      image: { width: 400, height: 300, content: '' },
    };
    const defaults = defaultSizes[type];
    const newBlock: Block = {
      id: uuidv4(),
      type,
      x: 97,
      y: 100 + get().blocks.length * 50,
      width: defaults.width,
      height: defaults.height,
      content: defaults.content,
    };
    set({ blocks: [...get().blocks, newBlock], selectedBlockId: newBlock.id });
  },

  updateBlock: (id, updates) => {
    set({
      blocks: get().blocks.map((b) =>
        b.id === id ? { ...b, ...updates } : b
      ),
    });
  },

  deleteBlock: (id) => {
    set({
      blocks: get().blocks.filter((b) => b.id !== id),
      selectedBlockId: get().selectedBlockId === id ? null : get().selectedBlockId,
    });
  },

  lockBlock: (blockId, userId) => {
    set({
      blocks: get().blocks.map((b) =>
        b.id === blockId ? { ...b, lockedBy: userId } : b
      ),
    });
  },

  unlockBlock: (blockId) => {
    const state = get();
    const block = state.blocks.find((b) => b.id === blockId);
    if (block) {
      set({
        blocks: state.blocks.map((b) =>
          b.id === blockId ? { ...b, lockedBy: undefined } : b
        ),
      });
    }
  },

  toggleCollaboration: () => {
    set({ collaborationOpen: !get().collaborationOpen });
  },

  setUserEditingBlock: (userId, blockId) => {
    set({
      users: get().users.map((u) =>
        u.id === userId ? { ...u, editingBlockId: blockId || undefined } : u
      ),
    });
  },
}));
