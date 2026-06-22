import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  Presentation,
  Slide,
  SlideElement,
  Collaborator,
  AnimationConfig,
  ElementType,
  ShapeType,
} from '../types';

interface EditorState {
  presentation: Presentation;
  selectedElementId: string | null;
  collaborators: Collaborator[];
  localCollaboratorId: string | null;
  animationPanelOpen: boolean;
  previewingAnimations: Set<string>;

  setPresentation: (p: Presentation) => void;
  setCurrentSlide: (slideId: string) => void;
  setSelectedElement: (id: string | null) => void;
  addSlide: () => void;
  addElement: (slideId: string, type: ElementType, shapeType?: ShapeType) => void;
  updateElement: (slideId: string, elementId: string, updates: Partial<SlideElement>) => void;
  deleteElement: (slideId: string, elementId: string) => void;
  addAnimation: (slideId: string, elementId: string, animation: Omit<AnimationConfig, 'id'>) => void;
  updateAnimation: (slideId: string, elementId: string, animationId: string, updates: Partial<AnimationConfig>) => void;
  deleteAnimation: (slideId: string, elementId: string, animationId: string) => void;
  toggleAnimationPanel: () => void;
  setCollaborators: (collaborators: Collaborator[]) => void;
  addCollaborator: (collaborator: Collaborator) => void;
  removeCollaborator: (id: string) => void;
  updateCollaboratorSelection: (collaboratorId: string, elementId: string | null) => void;
  setLocalCollaboratorId: (id: string) => void;
  setPreviewingAnimation: (elementId: string, isPreviewing: boolean) => void;
}

const createInitialSlide = (): Slide => ({
  id: uuidv4(),
  elements: [],
  backgroundColor: '#FFFFFF',
});

const createInitialPresentation = (): Presentation => {
  const slide1 = createInitialSlide();
  const slide2 = createInitialSlide();
  return {
    id: uuidv4(),
    slides: [slide1, slide2],
    currentSlideId: slide1.id,
  };
};

const createInitialElement = (type: ElementType, shapeType?: ShapeType): SlideElement => {
  const base = {
    id: uuidv4(),
    type,
    x: 440,
    y: 260,
    rotation: 0,
    animations: [],
  };

  switch (type) {
    case 'text':
      return {
        ...base,
        width: 300,
        height: 80,
        content: '双击编辑文字',
      };
    case 'image':
      return {
        ...base,
        width: 200,
        height: 150,
        content: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20landscape&image_size=square',
      };
    case 'shape':
      return {
        ...base,
        width: 160,
        height: 120,
        shapeType: shapeType || 'rectangle',
      };
  }
};

export const useEditorStore = create<EditorState>((set, get) => ({
  presentation: createInitialPresentation(),
  selectedElementId: null,
  collaborators: [],
  localCollaboratorId: null,
  animationPanelOpen: false,
  previewingAnimations: new Set(),

  setPresentation: (p) => set({ presentation: p }),

  setCurrentSlide: (slideId) =>
    set((state) => ({
      presentation: { ...state.presentation, currentSlideId: slideId },
      selectedElementId: null,
    })),

  setSelectedElement: (id) => set({ selectedElementId: id }),

  addSlide: () =>
    set((state) => {
      const newSlide = createInitialSlide();
      return {
        presentation: {
          ...state.presentation,
          slides: [...state.presentation.slides, newSlide],
          currentSlideId: newSlide.id,
        },
      };
    }),

  addElement: (slideId, type, shapeType) =>
    set((state) => {
      const newElement = createInitialElement(type, shapeType);
      return {
        presentation: {
          ...state.presentation,
          slides: state.presentation.slides.map((s) =>
            s.id === slideId ? { ...s, elements: [...s.elements, newElement] } : s
          ),
        },
        selectedElementId: newElement.id,
      };
    }),

  updateElement: (slideId, elementId, updates) =>
    set((state) => ({
      presentation: {
        ...state.presentation,
        slides: state.presentation.slides.map((s) =>
          s.id === slideId
            ? {
                ...s,
                elements: s.elements.map((e) =>
                  e.id === elementId ? { ...e, ...updates } : e
                ),
              }
            : s
        ),
      },
    })),

  deleteElement: (slideId, elementId) =>
    set((state) => ({
      presentation: {
        ...state.presentation,
        slides: state.presentation.slides.map((s) =>
          s.id === slideId
            ? { ...s, elements: s.elements.filter((e) => e.id !== elementId) }
            : s
        ),
      },
      selectedElementId:
        state.selectedElementId === elementId ? null : state.selectedElementId,
    })),

  addAnimation: (slideId, elementId, animation) =>
    set((state) => ({
      presentation: {
        ...state.presentation,
        slides: state.presentation.slides.map((s) =>
          s.id === slideId
            ? {
                ...s,
                elements: s.elements.map((e) =>
                  e.id === elementId
                    ? { ...e, animations: [...e.animations, { ...animation, id: uuidv4() }] }
                    : e
                ),
              }
            : s
        ),
      },
    })),

  updateAnimation: (slideId, elementId, animationId, updates) =>
    set((state) => ({
      presentation: {
        ...state.presentation,
        slides: state.presentation.slides.map((s) =>
          s.id === slideId
            ? {
                ...s,
                elements: s.elements.map((e) =>
                  e.id === elementId
                    ? {
                        ...e,
                        animations: e.animations.map((a) =>
                          a.id === animationId ? { ...a, ...updates } : a
                        ),
                      }
                    : e
                ),
              }
            : s
        ),
      },
    })),

  deleteAnimation: (slideId, elementId, animationId) =>
    set((state) => ({
      presentation: {
        ...state.presentation,
        slides: state.presentation.slides.map((s) =>
          s.id === slideId
            ? {
                ...s,
                elements: s.elements.map((e) =>
                  e.id === elementId
                    ? { ...e, animations: e.animations.filter((a) => a.id !== animationId) }
                    : e
                ),
              }
            : s
        ),
      },
    })),

  toggleAnimationPanel: () =>
    set((state) => ({ animationPanelOpen: !state.animationPanelOpen })),

  setCollaborators: (collaborators) => set({ collaborators }),

  addCollaborator: (collaborator) =>
    set((state) => ({
      collaborators: [...state.collaborators, collaborator],
    })),

  removeCollaborator: (id) =>
    set((state) => ({
      collaborators: state.collaborators.filter((c) => c.id !== id),
    })),

  updateCollaboratorSelection: (collaboratorId, elementId) =>
    set((state) => ({
      collaborators: state.collaborators.map((c) =>
        c.id === collaboratorId ? { ...c, selectedElementId: elementId } : c
      ),
    })),

  setLocalCollaboratorId: (id) => set({ localCollaboratorId: id }),

  setPreviewingAnimation: (elementId, isPreviewing) =>
    set((state) => {
      const newSet = new Set(state.previewingAnimations);
      if (isPreviewing) {
        newSet.add(elementId);
      } else {
        newSet.delete(elementId);
      }
      return { previewingAnimations: newSet };
    }),
}));
