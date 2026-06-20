import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type {
  CanvasElement,
  TextElement,
  ImageElement,
  ColorTheme,
  PosterTemplate,
  VersionSnapshot,
  PanelType,
} from '@/types';
import colorThemesData from '@/data/colorThemes.json';
import templatesData from '@/data/templates.json';
import { createTextElement, createImageElement } from '@/utils/elementFactory';
import { saveVersion, getAllVersions } from '@/utils/idb';
import { generateThumbnailDataURL } from '@/utils/canvasExport';

interface EditorState {
  elements: CanvasElement[];
  selectedId: string | null;
  colorThemeId: string;
  canvasBackground: string;
  activePanel: PanelType;
  versions: VersionSnapshot[];
  templateTransitionKey: number;
  isSaving: boolean;
  isPublishing: boolean;
  publishSuccess: boolean;

  colorThemes: ColorTheme[];
  templates: PosterTemplate[];
  currentUserId: string;
  currentUserName: string;

  setActivePanel: (panel: PanelType) => void;
  addTextElement: () => void;
  addImageElement: (src: string) => void;
  selectElement: (id: string | null) => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  updateElement: (id: string, patch: Partial<CanvasElement>) => void;
  updateSelectedTextContent: (content: string) => void;

  moveToTop: (id?: string) => void;
  moveToBottom: (id?: string) => void;
  moveUp: (id?: string) => void;
  moveDown: (id?: string) => void;

  getCurrentTheme: () => ColorTheme;
  switchColorTheme: (themeId: string) => void;

  applyTemplate: (templateId: string) => void;

  saveSnapshot: () => Promise<void>;
  loadVersions: () => Promise<void>;
  restoreVersion: (versionId: string) => void;

  resetCanvas: () => void;
  publishToGallery: (title: string, thumbnailSrc: string, fullImageSrc: string) => Promise<void>;
  clearPublishState: () => void;
}

const colorThemes = colorThemesData as ColorTheme[];
const templates = templatesData as PosterTemplate[];

const defaultThemeId = 'ocean';

export const useEditorStore = create<EditorState>((set, get) => ({
  elements: [],
  selectedId: null,
  colorThemeId: defaultThemeId,
  canvasBackground: colorThemes.find((t) => t.id === defaultThemeId)?.colors.background || '#ffffff',
  activePanel: null,
  versions: [],
  templateTransitionKey: 0,
  isSaving: false,
  isPublishing: false,
  publishSuccess: false,

  colorThemes,
  templates,
  currentUserId: 'user-me',
  currentUserName: '我',

  setActivePanel: (panel) => set({ activePanel: panel }),

  addTextElement: () => {
    const maxZ = get().elements.reduce((m, e) => Math.max(m, e.zIndex), 0);
    const el = createTextElement({ zIndex: maxZ + 1 });
    set({ elements: [...get().elements, el], selectedId: el.id, activePanel: 'properties' });
  },

  addImageElement: (src: string) => {
    const maxZ = get().elements.reduce((m, e) => Math.max(m, e.zIndex), 0);
    const el = createImageElement(src, { zIndex: maxZ + 1 });
    set({ elements: [...get().elements, el], selectedId: el.id, activePanel: 'properties' });
  },

  selectElement: (id) => {
    set({ selectedId: id, activePanel: id ? 'properties' : get().activePanel });
  },

  deleteSelected: () => {
    const { selectedId, elements } = get();
    if (!selectedId) return;
    set({ elements: elements.filter((e) => e.id !== selectedId), selectedId: null });
  },

  duplicateSelected: () => {
    const { selectedId, elements } = get();
    const el = elements.find((e) => e.id === selectedId);
    if (!el) return;
    const maxZ = elements.reduce((m, e) => Math.max(m, e.zIndex), 0);
    const clone = { ...el, id: uuid(), x: el.x + 24, y: el.y + 24, zIndex: maxZ + 1 };
    set({ elements: [...elements, clone], selectedId: clone.id });
  },

  updateElement: (id, patch) => {
    set({
      elements: get().elements.map((e) =>
        e.id === id ? ({ ...e, ...patch } as CanvasElement) : e
      ),
    });
  },

  updateSelectedTextContent: (content) => {
    const { selectedId } = get();
    if (!selectedId) return;
    get().updateElement(selectedId, { content } as Partial<TextElement>);
  },

  moveToTop: (id) => {
    const target = id ?? get().selectedId;
    if (!target) return;
    const maxZ = get().elements.reduce((m, e) => Math.max(m, e.zIndex), 0);
    get().updateElement(target, { zIndex: maxZ + 1 });
  },

  moveToBottom: (id) => {
    const target = id ?? get().selectedId;
    if (!target) return;
    const minZ = get().elements.reduce((m, e) => Math.min(m, e.zIndex), 0);
    get().updateElement(target, { zIndex: minZ - 1 });
  },

  moveUp: (id) => {
    const target = id ?? get().selectedId;
    if (!target) return;
    const el = get().elements.find((e) => e.id === target);
    if (!el) return;
    const sorted = [...get().elements].sort((a, b) => a.zIndex - b.zIndex);
    const idx = sorted.findIndex((e) => e.id === target);
    if (idx < sorted.length - 1) {
      const next = sorted[idx + 1];
      get().updateElement(target, { zIndex: next.zIndex });
      get().updateElement(next.id, { zIndex: el.zIndex });
    }
  },

  moveDown: (id) => {
    const target = id ?? get().selectedId;
    if (!target) return;
    const el = get().elements.find((e) => e.id === target);
    if (!el) return;
    const sorted = [...get().elements].sort((a, b) => a.zIndex - b.zIndex);
    const idx = sorted.findIndex((e) => e.id === target);
    if (idx > 0) {
      const prev = sorted[idx - 1];
      get().updateElement(target, { zIndex: prev.zIndex });
      get().updateElement(prev.id, { zIndex: el.zIndex });
    }
  },

  getCurrentTheme: () => {
    return get().colorThemes.find((t) => t.id === get().colorThemeId) || get().colorThemes[0];
  },

  switchColorTheme: (themeId) => {
    const theme = get().colorThemes.find((t) => t.id === themeId);
    if (!theme) return;
    set({ colorThemeId: themeId });
  },

  applyTemplate: (templateId) => {
    const template = get().templates.find((t) => t.id === templateId);
    if (!template) return;
    const clonedElements: CanvasElement[] = template.elements.map((e) => ({
      ...e,
      id: uuid(),
    })) as CanvasElement[];
    set({
      elements: clonedElements,
      colorThemeId: template.colorThemeId,
      canvasBackground: template.canvasBackground,
      selectedId: null,
      templateTransitionKey: get().templateTransitionKey + 1,
    });
  },

  saveSnapshot: async () => {
    if (get().isSaving) return;
    set({ isSaving: true });
    try {
      const { elements, colorThemeId, canvasBackground, getCurrentTheme } = get();
      const theme = getCurrentTheme();
      const thumbnail = await generateThumbnailDataURL(elements, canvasBackground, theme);
      const snapshot: VersionSnapshot = {
        id: uuid(),
        timestamp: Date.now(),
        thumbnail,
        elements: JSON.parse(JSON.stringify(elements)),
        colorThemeId,
        canvasBackground,
      };
      await saveVersion(snapshot);
      const all = await getAllVersions();
      set({ versions: all.sort((a, b) => b.timestamp - a.timestamp) });
    } finally {
      set({ isSaving: false });
    }
  },

  loadVersions: async () => {
    const all = await getAllVersions();
    set({ versions: all.sort((a, b) => b.timestamp - a.timestamp) });
  },

  restoreVersion: (versionId) => {
    const ver = get().versions.find((v) => v.id === versionId);
    if (!ver) return;
    set({
      elements: JSON.parse(JSON.stringify(ver.elements)),
      colorThemeId: ver.colorThemeId,
      canvasBackground: ver.canvasBackground,
      selectedId: null,
      templateTransitionKey: get().templateTransitionKey + 1,
    });
  },

  resetCanvas: () => {
    const theme = get().getCurrentTheme();
    set({
      elements: [],
      selectedId: null,
      canvasBackground: theme.colors.background,
    });
  },

  publishToGallery: async (title, thumbnailSrc, fullImageSrc) => {
    if (get().isPublishing) return;
    set({ isPublishing: true, publishSuccess: false });
    try {
      await new Promise((r) => setTimeout(r, 800));
      const existing = JSON.parse(localStorage.getItem('gallery_posts') || '[]');
      const newPost = {
        id: uuid(),
        authorId: get().currentUserId,
        authorName: get().currentUserName,
        authorAvatar:
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=friendly%20designer%20avatar%20portrait%20creative%20young%20illustration&image_size=square',
        title,
        thumbnail: thumbnailSrc,
        fullImage: fullImageSrc,
        likes: 0,
        likedByMe: false,
        publishedAt: Date.now(),
        comments: [],
      };
      localStorage.setItem('gallery_posts', JSON.stringify([newPost, ...existing]));
      set({ publishSuccess: true });
    } finally {
      set({ isPublishing: false });
    }
  },

  clearPublishState: () => set({ publishSuccess: false, isPublishing: false }),
}));
