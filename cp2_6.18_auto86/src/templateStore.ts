import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface Shape {
  id: string;
  type: 'rect' | 'circle';
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  fill: string;
}

export interface Template {
  id: string;
  name: string;
  thumbnail: string;
  shapes: Shape[];
  createdAt: number;
  updatedAt: number;
}

export interface TemplateStore {
  templates: Template[];
  currentTemplateId: string | null;
  shapes: Shape[];
  zoom: number;
  offsetX: number;
  offsetY: number;
  selectedShapeId: string | null;

  addShape: (shape: Omit<Shape, 'id'>) => void;
  updateShape: (id: string, patch: Partial<Shape>) => void;
  deleteShape: (id: string) => void;
  setZoom: (zoom: number, centerX?: number, centerY?: number) => void;
  setOffset: (offsetX: number, offsetY: number) => void;
  setSelectedShape: (id: string | null) => void;
  saveTemplate: (name: string, thumbnail: string) => void;
  switchTemplate: (id: string) => void;
  createTemplate: (name?: string) => void;
  deleteTemplate: (id: string) => void;
  renameTemplate: (id: string, name: string) => void;
}

const initialTemplateId = uuidv4();

const initialTemplates: Template[] = [
  {
    id: initialTemplateId,
    name: '默认模板',
    thumbnail: '',
    shapes: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

export const useTemplateStore = create<TemplateStore>((set, get) => ({
  templates: initialTemplates,
  currentTemplateId: initialTemplateId,
  shapes: [],
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
  selectedShapeId: null,

  addShape: (shape) => {
    const newShape: Shape = { id: uuidv4(), ...shape };
    set({ shapes: [...get().shapes, newShape] });
  },

  updateShape: (id, patch) => {
    set({
      shapes: get().shapes.map((s) =>
        s.id === id ? { ...s, ...patch } : s
      ),
    });
  },

  deleteShape: (id) => {
    set({
      shapes: get().shapes.filter((s) => s.id !== id),
      selectedShapeId: get().selectedShapeId === id ? null : get().selectedShapeId,
    });
  },

  setZoom: (zoom, centerX, centerY) => {
    const clamped = Math.max(0.5, Math.min(3, zoom));
    const state = get();
    if (centerX !== undefined && centerY !== undefined) {
      const scale = clamped / state.zoom;
      set({
        zoom: clamped,
        offsetX: centerX - (centerX - state.offsetX) * scale,
        offsetY: centerY - (centerY - state.offsetY) * scale,
      });
    } else {
      set({ zoom: clamped });
    }
  },

  setOffset: (offsetX, offsetY) => {
    set({ offsetX, offsetY });
  },

  setSelectedShape: (id) => {
    set({ selectedShapeId: id });
  },

  saveTemplate: (name, thumbnail) => {
    const state = get();
    const id = state.currentTemplateId;
    if (!id) return;
    set({
      templates: state.templates.map((t) =>
        t.id === id
          ? {
              ...t,
              name,
              thumbnail,
              shapes: [...state.shapes],
              updatedAt: Date.now(),
            }
          : t
      ),
    });
  },

  switchTemplate: (id) => {
    const state = get();
    const template = state.templates.find((t) => t.id === id);
    if (!template) return;
    set({
      currentTemplateId: id,
      shapes: [...template.shapes],
      selectedShapeId: null,
    });
  },

  createTemplate: (name) => {
    const id = uuidv4();
    const template: Template = {
      id,
      name: name || `模板 ${get().templates.length + 1}`,
      thumbnail: '',
      shapes: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    set({
      templates: [...get().templates, template],
      currentTemplateId: id,
      shapes: [],
      selectedShapeId: null,
    });
  },

  deleteTemplate: (id) => {
    const state = get();
    const remaining = state.templates.filter((t) => t.id !== id);
    if (remaining.length === 0) {
      const newId = uuidv4();
      const template: Template = {
        id: newId,
        name: '默认模板',
        thumbnail: '',
        shapes: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      set({
        templates: [template],
        currentTemplateId: newId,
        shapes: [],
        selectedShapeId: null,
      });
      return;
    }
    set({
      templates: remaining,
      currentTemplateId:
        state.currentTemplateId === id
          ? remaining[0].id
          : state.currentTemplateId,
      shapes:
        state.currentTemplateId === id
          ? [...remaining[0].shapes]
          : state.shapes,
      selectedShapeId: null,
    });
  },

  renameTemplate: (id, name) => {
    const safeName = name.slice(0, 30);
    set({
      templates: get().templates.map((t) =>
        t.id === id ? { ...t, name: safeName, updatedAt: Date.now() } : t
      ),
    });
  },
}));
