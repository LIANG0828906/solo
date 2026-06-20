import { create } from 'zustand';
import { produce } from 'immer';
import type { Component, ThemePalette, EditorStateSnapshot } from '../types';
import { DEFAULT_THEMES, DEFAULT_TEMPLATES } from '../templates';
import { UndoStack } from '../utils/undoStack';
import { applyTheme, updateSingleThemeColor } from '../utils/themeEngine';
import {
  findTwoColumnPair,
  applyColumnRatio,
  isTwoColumnTemplate,
} from '../utils/twoColumnUtils';

interface EditorState {
  components: Component[];
  selectedId: string | null;
  theme: ThemePalette;
  themes: ThemePalette[];
  currentTemplateId: string | null;
  zoom: number;
  pan: { x: number; y: number };
  canUndo: boolean;
  canRedo: boolean;
  isThemeTransition: boolean;

  selectComponent: (id: string | null) => void;
  updateComponent: (id: string, updates: Partial<Component>, recordUndo?: boolean) => void;
  addComponent: (component: Component) => void;
  deleteComponent: (id: string) => void;
  setTheme: (themeId: string) => void;
  updateThemeColor: (index: number, color: string) => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  loadTemplate: (templateId: string) => void;
  undo: () => void;
  redo: () => void;
  setColumnRatio: (ratio: number) => void;
  getColumnRatio: () => number | null;
  getIsTwoColumn: () => boolean;
  recordAction: () => void;
}

function getSnapshot(state: EditorState): EditorStateSnapshot {
  return {
    components: state.components,
    theme: state.theme,
  };
}

export const useEditorStore = create<EditorState>((set, get) => {
  const initialTheme = DEFAULT_THEMES[0];
  const initialTemplate = DEFAULT_TEMPLATES[0];
  const undoStack = new UndoStack<EditorStateSnapshot>({
    components: initialTemplate.components,
    theme: initialTheme,
  });

  return {
    components: initialTemplate.components,
    selectedId: null,
    theme: initialTheme,
    themes: DEFAULT_THEMES,
    currentTemplateId: initialTemplate.id,
    zoom: 1,
    pan: { x: 0, y: 0 },
    canUndo: false,
    canRedo: false,
    isThemeTransition: false,

    selectComponent: (id) => {
      set({ selectedId: id });
    },

    updateComponent: (id, updates, recordUndo = true) => {
      set(
        produce((state: EditorState) => {
          const idx = state.components.findIndex((c) => c.id === id);
          if (idx !== -1) {
            state.components[idx] = { ...state.components[idx], ...updates };
          }
          state.isThemeTransition = false;
        })
      );
      if (recordUndo) {
        get().recordAction();
      }
    },

    addComponent: (component) => {
      set(
        produce((state: EditorState) => {
          state.components.push(component);
          state.isThemeTransition = false;
        })
      );
      get().recordAction();
    },

    deleteComponent: (id) => {
      set(
        produce((state: EditorState) => {
          state.components = state.components.filter((c) => c.id !== id);
          if (state.selectedId === id) {
            state.selectedId = null;
          }
          state.isThemeTransition = false;
        })
      );
      get().recordAction();
    },

    setTheme: (themeId) => {
      const state = get();
      const newTheme = state.themes.find((t) => t.id === themeId);
      if (!newTheme || newTheme.id === state.theme.id) return;

      const newComponents = applyTheme(state.components, state.theme, newTheme);

      set({
        components: newComponents,
        theme: newTheme,
        isThemeTransition: true,
      });

      setTimeout(() => {
        set({ isThemeTransition: false });
      }, 300);

      get().recordAction();
    },

    updateThemeColor: (index, color) => {
      const state = get();
      const newThemes = state.themes.map((t) => {
        if (t.id === state.theme.id) {
          const newColors = [...t.colors];
          newColors[index] = color;
          return { ...t, colors: newColors };
        }
        return t;
      });

      const newTheme = newThemes.find((t) => t.id === state.theme.id)!;
      const newComponents = updateSingleThemeColor(state.components, index, color);

      set({
        themes: newThemes,
        theme: newTheme,
        components: newComponents,
        isThemeTransition: true,
      });

      setTimeout(() => {
        set({ isThemeTransition: false });
      }, 300);

      get().recordAction();
    },

    setZoom: (zoom) => {
      const clamped = Math.max(0.5, Math.min(2.0, zoom));
      set({ zoom: clamped });
    },

    setPan: (pan) => {
      set({ pan });
    },

    loadTemplate: (templateId) => {
      const template = DEFAULT_TEMPLATES.find((t) => t.id === templateId);
      if (!template) return;

      const state = get();
      const newComponents = applyTheme(template.components, state.theme, state.theme);

      set({
        components: newComponents,
        selectedId: null,
        currentTemplateId: templateId,
      });

      undoStack.reset({
        components: newComponents,
        theme: state.theme,
      });

      set({
        canUndo: false,
        canRedo: false,
      });
    },

    undo: () => {
      const prev = undoStack.undo();
      if (prev) {
        set({
          components: prev.components,
          theme: prev.theme,
          canUndo: undoStack.canUndo,
          canRedo: true,
          selectedId: null,
        });
      }
    },

    redo: () => {
      const next = undoStack.redo();
      if (next) {
        set({
          components: next.components,
          theme: next.theme,
          canUndo: true,
          canRedo: undoStack.canRedo,
          selectedId: null,
        });
      }
    },

    setColumnRatio: (ratio) => {
      const state = get();
      if (!state.selectedId) return;

      const pair = findTwoColumnPair(state.components, state.selectedId);
      if (!pair) return;

      const newComponents = applyColumnRatio(state.components, pair, ratio);
      set({
        components: newComponents,
      });
      get().recordAction();
    },

    getColumnRatio: () => {
      const state = get();
      if (!state.selectedId) return null;

      const pair = findTwoColumnPair(state.components, state.selectedId);
      if (!pair) return null;

      const availableWidth = pair.totalWidth - pair.gap;
      const leftRatio = (pair.left.width / availableWidth) * 100;
      return Math.round(leftRatio);
    },

    getIsTwoColumn: () => {
      return isTwoColumnTemplate(get().components);
    },

    recordAction: () => {
      undoStack.push(getSnapshot(get()));
      set({
        canUndo: undoStack.canUndo,
        canRedo: undoStack.canRedo,
      });
    },
  };
});
