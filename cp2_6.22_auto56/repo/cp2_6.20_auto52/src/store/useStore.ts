import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  DesktopIcon,
  Folder,
  StickyNote,
  ContextMenuState,
  OrganizeSuggestion,
  DesktopLayout,
  IconType,
  NoteColor,
} from '@/types';
import { storageService } from '@/services/storage';
import { generateSuggestions, applySuggestions } from '@/utils/organizer';
import { findEmptySlot } from '@/utils/drag';
import { ICON_COLORS } from '@/types';

interface DesktopState {
  icons: DesktopIcon[];
  folders: Folder[];
  notes: StickyNote[];
  selectedIconId: string | null;
  highlightedIconId: string | null;
  contextMenu: ContextMenuState | null;
  locked: boolean;
  searchQuery: string;
  sidebarVisible: boolean;
  organizerPanelVisible: boolean;
  currentFolderId: string | null;
  maxZIndex: number;

  initializeLayout: () => void;
  saveLayout: () => void;
  addIcon: (icon: Omit<DesktopIcon, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateIcon: (id: string, updates: Partial<DesktopIcon>) => void;
  deleteIcon: (id: string) => void;
  moveIcon: (id: string, x: number, y: number) => void;
  selectIcon: (id: string | null) => void;
  highlightIcon: (id: string | null) => void;
  createFolder: (name: string, iconIds: string[]) => void;
  updateFolder: (id: string, updates: Partial<Folder>) => void;
  deleteFolder: (id: string) => void;
  openFolder: (id: string | null) => void;
  addNote: (note: Omit<StickyNote, 'id' | 'createdAt' | 'updatedAt' | 'zIndex'>) => void;
  updateNote: (id: string, updates: Partial<StickyNote>) => void;
  deleteNote: (id: string) => void;
  bringNoteToFront: (id: string) => void;
  toggleLock: () => void;
  setContextMenu: (menu: ContextMenuState | null) => void;
  setSearchQuery: (query: string) => void;
  setSidebarVisible: (visible: boolean) => void;
  setOrganizerPanelVisible: (visible: boolean) => void;
  generateOrganizeSuggestions: () => OrganizeSuggestion[];
  applyOrganizeSuggestions: (suggestions: OrganizeSuggestion[]) => void;
  moveIconToFolder: (iconId: string, folderId: string | null) => void;
  renameIcon: (id: string, newName: string) => void;
}

const createDefaultIcons = (containerWidth: number, containerHeight: number): DesktopIcon[] => {
  const now = Date.now();
  const defaultIcons = [
    { type: 'app' as IconType, name: 'Chrome', label: '浏览器' },
    { type: 'app' as IconType, name: 'VSCode', label: '代码编辑器' },
    { type: 'folder' as IconType, name: 'Projects', label: '项目文件夹' },
    { type: 'document' as IconType, name: 'report.docx', label: '工作报告' },
    { type: 'document' as IconType, name: 'photo.jpg', label: '风景照片' },
    { type: 'link' as IconType, name: 'GitHub', label: 'GitHub 网站' },
    { type: 'document' as IconType, name: 'notes.pdf', label: '学习笔记' },
    { type: 'document' as IconType, name: 'design.png', label: '设计稿' },
  ];

  const icons: DesktopIcon[] = [];
  const positions: Array<{ id: string; x: number; y: number }> = [];

  defaultIcons.forEach((icon, index) => {
    const pos = findEmptySlot(containerWidth, containerHeight, positions);
    positions.push({ id: `temp-${index}`, ...pos });
    
    icons.push({
      id: uuidv4(),
      ...icon,
      x: pos.x,
      y: pos.y,
      width: 100,
      height: 110,
      parentId: null,
      color: ICON_COLORS[icon.type],
      metadata: {},
      createdAt: now,
      updatedAt: now,
    });
  });

  return icons;
};

export const useStore = create<DesktopState>((set, get) => ({
  icons: [],
  folders: [],
  notes: [],
  selectedIconId: null,
  highlightedIconId: null,
  contextMenu: null,
  locked: false,
  searchQuery: '',
  sidebarVisible: false,
  organizerPanelVisible: false,
  currentFolderId: null,
  maxZIndex: 1,

  initializeLayout: () => {
    const saved = storageService.loadLayout();
    if (saved) {
      set({
        icons: saved.icons,
        folders: saved.folders,
        notes: saved.notes,
        locked: saved.locked,
        maxZIndex: saved.notes.length > 0 ? Math.max(...saved.notes.map(n => n.zIndex)) + 1 : 1,
      });
    } else {
      const containerWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
      const containerHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
      const defaultIcons = createDefaultIcons(containerWidth, containerHeight);
      set({ icons: defaultIcons });
      get().saveLayout();
    }
  },

  saveLayout: () => {
    const state = get();
    const layout: DesktopLayout = {
      icons: state.icons,
      folders: state.folders,
      notes: state.notes,
      gridSize: { cols: 8, rows: 6 },
      locked: state.locked,
      lastSyncedAt: Date.now(),
    };
    storageService.saveLayout(layout);
  },

  addIcon: (icon) => {
    const newIcon: DesktopIcon = {
      ...icon,
      id: uuidv4(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    set((state) => ({ icons: [...state.icons, newIcon] }));
    get().saveLayout();
  },

  updateIcon: (id, updates) => {
    set((state) => ({
      icons: state.icons.map((icon) =>
        icon.id === id ? { ...icon, ...updates, updatedAt: Date.now() } : icon
      ),
    }));
    get().saveLayout();
  },

  deleteIcon: (id) => {
    set((state) => {
      const icon = state.icons.find((i) => i.id === id);
      let folders = state.folders;
      
      if (icon) {
        folders = state.folders.map((folder) => ({
          ...folder,
          iconIds: folder.iconIds.filter((i) => i !== id),
        }));
      }
      
      return {
        icons: state.icons.filter((i) => i.id !== id),
        folders,
        selectedIconId: state.selectedIconId === id ? null : state.selectedIconId,
      };
    });
    get().saveLayout();
  },

  moveIcon: (id, x, y) => {
    if (get().locked) return;
    set((state) => ({
      icons: state.icons.map((icon) =>
        icon.id === id ? { ...icon, x, y, updatedAt: Date.now() } : icon
      ),
    }));
    get().saveLayout();
  },

  selectIcon: (id) => {
    set({ selectedIconId: id });
  },

  highlightIcon: (id) => {
    set({ highlightedIconId: id });
    if (id) {
      setTimeout(() => set({ highlightedIconId: null }), 2000);
    }
  },

  createFolder: (name, iconIds) => {
    const now = Date.now();
    const newFolder: Folder = {
      id: uuidv4(),
      name,
      iconIds,
      viewMode: 'grid',
      expanded: false,
    };

    const containerWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const containerHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    const existingPositions = get().icons.map((i) => ({ id: i.id, x: i.x, y: i.y }));
    const pos = findEmptySlot(containerWidth, containerHeight, existingPositions);

    const folderIcon: DesktopIcon = {
      id: uuidv4(),
      type: 'folder',
      name: name,
      label: name,
      x: pos.x,
      y: pos.y,
      width: 100,
      height: 110,
      parentId: null,
      color: ICON_COLORS.folder,
      metadata: { folderId: newFolder.id },
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({
      folders: [...state.folders, newFolder],
      icons: [
        ...state.icons.map((icon) =>
          iconIds.includes(icon.id)
            ? { ...icon, parentId: newFolder.id, updatedAt: now }
            : icon
        ),
        folderIcon,
      ],
    }));
    get().saveLayout();
  },

  updateFolder: (id, updates) => {
    set((state) => ({
      folders: state.folders.map((folder) =>
        folder.id === id ? { ...folder, ...updates } : folder
      ),
    }));
    get().saveLayout();
  },

  deleteFolder: (id) => {
    set((state) => {
      const folder = state.folders.find((f) => f.id === id);
      return {
        folders: state.folders.filter((f) => f.id !== id),
        icons: state.icons
          .filter((i) => !(i.type === 'folder' && i.metadata?.folderId === id))
          .map((icon) =>
            folder?.iconIds.includes(icon.id)
              ? { ...icon, parentId: null, updatedAt: Date.now() }
              : icon
          ),
      };
    });
    get().saveLayout();
  },

  openFolder: (id) => {
    set({ currentFolderId: id });
  },

  addNote: (note) => {
    const newZIndex = get().maxZIndex + 1;
    const newNote: StickyNote = {
      ...note,
      id: uuidv4(),
      zIndex: newZIndex,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    set((state) => ({
      notes: [...state.notes, newNote],
      maxZIndex: newZIndex,
    }));
    get().saveLayout();
  },

  updateNote: (id, updates) => {
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === id ? { ...note, ...updates, updatedAt: Date.now() } : note
      ),
    }));
    get().saveLayout();
  },

  deleteNote: (id) => {
    set((state) => ({
      notes: state.notes.filter((note) => note.id !== id),
    }));
    get().saveLayout();
  },

  bringNoteToFront: (id) => {
    const newZIndex = get().maxZIndex + 1;
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === id ? { ...note, zIndex: newZIndex } : note
      ),
      maxZIndex: newZIndex,
    }));
  },

  toggleLock: () => {
    set((state) => ({ locked: !state.locked }));
    get().saveLayout();
  },

  setContextMenu: (menu) => {
    set({ contextMenu: menu });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  setSidebarVisible: (visible) => {
    set({ sidebarVisible: visible });
  },

  setOrganizerPanelVisible: (visible) => {
    set({ organizerPanelVisible: visible });
  },

  generateOrganizeSuggestions: () => {
    return generateSuggestions(get().icons);
  },

  applyOrganizeSuggestions: (suggestions) => {
    const { icons, folders } = get();
    const existingFolders = folders.map((f) => ({ id: f.id, name: f.name }));
    
    const result = applySuggestions(suggestions, icons, existingFolders);
    
    const now = Date.now();
    const containerWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const containerHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    const existingPositions = result.updatedIcons.map((i) => ({ id: i.id, x: i.x, y: i.y }));

    const tempPositions: Array<{ id: string; x: number; y: number }> = [];
    const newFolderIcons: DesktopIcon[] = result.newFolders.map((folder) => {
      const pos = findEmptySlot(containerWidth, containerHeight, [
        ...existingPositions,
        ...tempPositions,
      ]);
      tempPositions.push({ id: `temp-${folder.id}`, ...pos });
      return {
        id: uuidv4(),
        type: 'folder' as IconType,
        name: folder.name,
        label: folder.name,
        x: pos.x,
        y: pos.y,
        width: 100,
        height: 110,
        parentId: null,
        color: ICON_COLORS.folder,
        metadata: { folderId: folder.id },
        createdAt: now,
        updatedAt: now,
      };
    });

    const newFolders: Folder[] = result.newFolders.map((folder) => ({
      id: folder.id,
      name: folder.name,
      iconIds: folder.iconIds,
      viewMode: 'grid',
      expanded: false,
    }));

    const repositionedIcons = result.updatedIcons.map((icon) => {
      if (icon.parentId === null) {
        const pos = findEmptySlot(containerWidth, containerHeight, [
          ...existingPositions.filter((p) => p.id !== icon.id),
          ...newFolderIcons.map((i) => ({ id: i.id, x: i.x, y: i.y })),
        ]);
        return { ...icon, x: pos.x, y: pos.y, updatedAt: now };
      }
      return icon;
    });

    set((state) => ({
      icons: [...repositionedIcons, ...newFolderIcons],
      folders: [...state.folders, ...newFolders],
    }));
    get().saveLayout();
  },

  moveIconToFolder: (iconId, folderId) => {
    set((state) => {
      let folders = state.folders;
      
      if (folderId) {
        folders = state.folders.map((folder) => {
          if (folder.id === folderId && !folder.iconIds.includes(iconId)) {
            return { ...folder, iconIds: [...folder.iconIds, iconId] };
          }
          return folder;
        });
      }
      
      return {
        icons: state.icons.map((icon) =>
          icon.id === iconId
            ? { ...icon, parentId: folderId, updatedAt: Date.now() }
            : icon
        ),
        folders,
      };
    });
    get().saveLayout();
  },

  renameIcon: (id, newName) => {
    set((state) => ({
      icons: state.icons.map((icon) =>
        icon.id === id
          ? { ...icon, name: newName, label: newName, updatedAt: Date.now() }
          : icon
      ),
    }));
    get().saveLayout();
  },
}));
