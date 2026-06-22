import { create } from 'zustand';
import { FossilFragment, BoneGroup, SnapInfo } from '../types';

interface AppState {
  fragments: FossilFragment[];
  groups: BoneGroup[];
  selectedFragmentId: string | null;
  selectedGroupId: string | null;
  isSimulating: boolean;
  snapInfo: SnapInfo | null;
  draggingFragmentId: string | null;
  fps: number;
  
  addFragment: (fragment: FossilFragment) => void;
  updateFragment: (id: string, updates: Partial<FossilFragment>) => void;
  removeFragment: (id: string) => void;
  selectFragment: (id: string | null) => void;
  createGroup: (name: string, fragmentIds: string[]) => void;
  setSimulating: (value: boolean) => void;
  setSnapInfo: (info: SnapInfo | null) => void;
  setDraggingFragmentId: (id: string | null) => void;
  setFps: (fps: number) => void;
}

export const useStore = create<AppState>((set) => ({
  fragments: [],
  groups: [],
  selectedFragmentId: null,
  selectedGroupId: null,
  isSimulating: false,
  snapInfo: null,
  draggingFragmentId: null,
  fps: 60,

  addFragment: (fragment) =>
    set((state) => ({
      fragments: [...state.fragments, fragment]
    })),

  updateFragment: (id, updates) =>
    set((state) => ({
      fragments: state.fragments.map((f) =>
        f.id === id ? { ...f, ...updates } : f
      )
    })),

  removeFragment: (id) =>
    set((state) => ({
      fragments: state.fragments.filter((f) => f.id !== id),
      selectedFragmentId: state.selectedFragmentId === id ? null : state.selectedFragmentId
    })),

  selectFragment: (id) =>
    set(() => ({
      selectedFragmentId: id,
      selectedGroupId: null
    })),

  createGroup: (name, fragmentIds) =>
    set((state) => {
      const newGroup: BoneGroup = {
        id: `group_${Date.now()}`,
        name,
        fragmentIds
      };
      return {
        groups: [...state.groups, newGroup],
        fragments: state.fragments.map((f) =>
          fragmentIds.includes(f.id) ? { ...f, groupId: newGroup.id } : f
        )
      };
    }),

  setSimulating: (value) =>
    set(() => ({
      isSimulating: value
    })),

  setSnapInfo: (info) =>
    set(() => ({
      snapInfo: info
    })),

  setDraggingFragmentId: (id) =>
    set(() => ({
      draggingFragmentId: id
    })),

  setFps: (fps) =>
    set(() => ({
      fps
    }))
}));
