import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  Exhibit,
  ExhibitType,
  PathPoint,
  Scene,
  AnalysisResult,
  EditorMode,
} from '@/types';

interface SceneState {
  scenes: Scene[];
  currentSceneId: string | null;
  selectedExhibitId: string | null;
  editorMode: EditorMode;
  isPlayingPath: boolean;
  pathProgress: number;
  analysisResults: AnalysisResult[];
  cameraPosition: [number, number, number];
  isSaving: boolean;
  saveProgress: number;
  shareUrl: string | null;
  errorMessage: string | null;

  setScenes: (scenes: Scene[]) => void;
  setCurrentSceneId: (id: string | null) => void;
  setSelectedExhibitId: (id: string | null) => void;
  setEditorMode: (mode: EditorMode) => void;
  setIsPlayingPath: (playing: boolean) => void;
  setPathProgress: (progress: number) => void;
  setAnalysisResults: (results: AnalysisResult[]) => void;
  setCameraPosition: (pos: [number, number, number]) => void;
  setIsSaving: (saving: boolean) => void;
  setSaveProgress: (progress: number) => void;
  setShareUrl: (url: string | null) => void;
  setErrorMessage: (msg: string | null) => void;

  getCurrentScene: () => Scene | undefined;
  addExhibit: (type: ExhibitType) => void;
  removeExhibit: (id: string) => void;
  updateExhibit: (id: string, updates: Partial<Exhibit>) => void;
  addPathPoint: (position: [number, number, number]) => void;
  removePathPoint: (id: string) => void;
  clearPath: () => void;
  createEmptyScene: () => void;
  loadScene: (scene: Scene) => void;
  resetOcclusionStats: () => void;
}

export const useSceneStore = create<SceneState>((set, get) => ({
  scenes: [],
  currentSceneId: null,
  selectedExhibitId: null,
  editorMode: 'select',
  isPlayingPath: false,
  pathProgress: 0,
  analysisResults: [],
  cameraPosition: [10, 8, 10],
  isSaving: false,
  saveProgress: 0,
  shareUrl: null,
  errorMessage: null,

  setScenes: (scenes) => set({ scenes }),
  setCurrentSceneId: (id) => set({ currentSceneId: id }),
  setSelectedExhibitId: (id) => set({ selectedExhibitId: id }),
  setEditorMode: (mode) => set({ editorMode: mode }),
  setIsPlayingPath: (playing) => set({ isPlayingPath: playing }),
  setPathProgress: (progress) => set({ pathProgress: progress }),
  setAnalysisResults: (results) => set({ analysisResults: results }),
  setCameraPosition: (pos) => set({ cameraPosition: pos }),
  setIsSaving: (saving) => set({ isSaving: saving }),
  setSaveProgress: (progress) => set({ saveProgress: progress }),
  setShareUrl: (url) => set({ shareUrl: url }),
  setErrorMessage: (msg) => set({ errorMessage: msg }),

  getCurrentScene: () => {
    const { scenes, currentSceneId } = get();
    return scenes.find((s) => s.id === currentSceneId);
  },

  addExhibit: (type) => {
    const { currentSceneId, scenes } = get();
    if (!currentSceneId) return;

    const typeNames: Record<ExhibitType, string> = {
      cube: '立方体',
      sphere: '球体',
      cylinder: '柱体',
      torus: '环体',
    };

    const newExhibit: Exhibit = {
      id: uuidv4(),
      name: `${typeNames[type]} ${Date.now()}`,
      type,
      position: [
        (Math.random() - 0.5) * 6,
        0.5 + Math.random() * 1,
        (Math.random() - 0.5) * 6,
      ],
      rotation: [0, 0, 0],
      scale: 1,
      color: `hsl(${Math.floor(Math.random() * 360)}, 60%, 55%)`,
      opacity: 1,
    };

    set({
      scenes: scenes.map((s) =>
        s.id === currentSceneId
          ? {
              ...s,
              exhibits: [...s.exhibits, newExhibit],
              updatedAt: Date.now(),
            }
          : s
      ),
      selectedExhibitId: newExhibit.id,
    });
  },

  removeExhibit: (id) => {
    const { currentSceneId, scenes, selectedExhibitId } = get();
    if (!currentSceneId) return;

    set({
      scenes: scenes.map((s) =>
        s.id === currentSceneId
          ? {
              ...s,
              exhibits: s.exhibits.filter((e) => e.id !== id),
              updatedAt: Date.now(),
            }
          : s
      ),
      selectedExhibitId: selectedExhibitId === id ? null : selectedExhibitId,
    });
  },

  updateExhibit: (id, updates) => {
    const { currentSceneId, scenes } = get();
    if (!currentSceneId) return;

    set({
      scenes: scenes.map((s) =>
        s.id === currentSceneId
          ? {
              ...s,
              exhibits: s.exhibits.map((e) =>
                e.id === id ? { ...e, ...updates } : e
              ),
              updatedAt: Date.now(),
            }
          : s
      ),
    });
  },

  addPathPoint: (position) => {
    const { currentSceneId, scenes } = get();
    if (!currentSceneId) return;

    const newPoint: PathPoint = {
      id: uuidv4(),
      position,
    };

    set({
      scenes: scenes.map((s) =>
        s.id === currentSceneId
          ? {
              ...s,
              path: [...s.path, newPoint],
              updatedAt: Date.now(),
            }
          : s
      ),
    });
  },

  removePathPoint: (id) => {
    const { currentSceneId, scenes } = get();
    if (!currentSceneId) return;

    set({
      scenes: scenes.map((s) =>
        s.id === currentSceneId
          ? {
              ...s,
              path: s.path.filter((p) => p.id !== id),
              updatedAt: Date.now(),
            }
          : s
      ),
    });
  },

  clearPath: () => {
    const { currentSceneId, scenes } = get();
    if (!currentSceneId) return;

    set({
      scenes: scenes.map((s) =>
        s.id === currentSceneId
          ? { ...s, path: [], updatedAt: Date.now() }
          : s
      ),
    });
  },

  createEmptyScene: () => {
    const newScene: Scene = {
      id: uuidv4(),
      name: '新场景',
      exhibits: [],
      path: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    set((state) => ({
      scenes: [...state.scenes, newScene],
      currentSceneId: newScene.id,
      selectedExhibitId: null,
    }));
  },

  loadScene: (scene) => {
    set((state) => {
      const exists = state.scenes.some((s) => s.id === scene.id);
      return {
        scenes: exists
          ? state.scenes.map((s) => (s.id === scene.id ? scene : s))
          : [...state.scenes, scene],
        currentSceneId: scene.id,
        selectedExhibitId: null,
        isPlayingPath: false,
        pathProgress: 0,
        analysisResults: scene.exhibits.map((e) => ({
          exhibitId: e.id,
          exhibitName: e.name,
          isOccluded: false,
          occlusionPercentage: 0,
          occlusionDuration: 0,
        })),
      };
    });
  },

  resetOcclusionStats: () => {
    const currentScene = get().getCurrentScene();
    if (!currentScene) return;

    set({
      analysisResults: currentScene.exhibits.map((e) => ({
        exhibitId: e.id,
        exhibitName: e.name,
        isOccluded: false,
        occlusionPercentage: 0,
        occlusionDuration: 0,
      })),
    });
  },
}));
