import { create } from 'zustand';
import { SceneEngine } from '../engine/SceneEngine';
import { PathSimulator } from '../engine/PathSimulator';
import { HeatmapRenderer } from '../engine/HeatmapRenderer';
import type {
  Point2D,
  HallConfig,
  Showcase,
  Exhibit,
  ExhibitType,
  VisitorStart,
  Scene,
  ToolMode,
  ExhibitStats,
} from '../types';

interface SceneStoreState {
  scene: Scene;
  selectedId: string | null;
  selectedType: 'showcase' | 'exhibit' | 'start' | null;
  toolMode: ToolMode;
  isSimulating: boolean;
  showHeatmap: boolean;
  heatmapOpacity: number;
  hoveredPointInfo: {
    position: Point2D;
    dwellTime: number;
    nearestExhibitDistance: number;
  } | null;
  clickedExhibitStats: ExhibitStats | null;
  performanceMetrics: {
    pathCalcTime: number;
    heatmapRenderTime: number;
    fps: number;
  };
  isPanelOpen: boolean;
  errorMessage: string | null;
  engine: SceneEngine;
  pathSimulator: PathSimulator;
  heatmapRenderer: HeatmapRenderer;
}

interface SceneStoreActions {
  setHallConfig: (config: Partial<HallConfig>) => void;
  addShowcase: (position: Point2D) => void;
  updateShowcase: (id: string, updates: Partial<Showcase>) => void;
  removeShowcase: (id: string) => void;
  addExhibit: (showcaseId: string, type: ExhibitType) => void;
  updateExhibit: (id: string, updates: Partial<Exhibit>) => void;
  removeExhibit: (id: string) => void;
  addVisitorStart: (position: Point2D) => void;
  updateVisitorStart: (id: string, updates: Partial<VisitorStart>) => void;
  removeVisitorStart: (id: string) => void;
  selectObject: (
    id: string | null,
    type: 'showcase' | 'exhibit' | 'start' | null
  ) => void;
  setToolMode: (mode: ToolMode) => void;
  runSimulation: () => Promise<void>;
  setShowHeatmap: (show: boolean) => void;
  setHeatmapOpacity: (opacity: number) => void;
  setHoveredPointInfo: (info: SceneStoreState['hoveredPointInfo']) => void;
  setClickedExhibitStats: (stats: ExhibitStats | null) => void;
  setPerformanceMetrics: (
    metrics: Partial<SceneStoreState['performanceMetrics']>
  ) => void;
  togglePanel: () => void;
  exportScene: () => string;
  importScene: (jsonString: string) => boolean;
  clearError: () => void;
}

export type SceneStore = SceneStoreState & SceneStoreActions;

const createInitialEngine = (): {
  engine: SceneEngine;
  pathSimulator: PathSimulator;
  heatmapRenderer: HeatmapRenderer;
} => {
  const engine = new SceneEngine();
  const scene = engine.getScene();
  const pathSimulator = new PathSimulator(scene.hall, scene.showcases);
  const heatmapRenderer = new HeatmapRenderer(scene.hall);
  return { engine, pathSimulator, heatmapRenderer };
};

export const useSceneStore = create<SceneStore>((set, get) => {
  const { engine, pathSimulator, heatmapRenderer } = createInitialEngine();

  return {
    scene: engine.getScene(),
    selectedId: null,
    selectedType: null,
    toolMode: 'select',
    isSimulating: false,
    showHeatmap: false,
    heatmapOpacity: 0.7,
    hoveredPointInfo: null,
    clickedExhibitStats: null,
    performanceMetrics: {
      pathCalcTime: 0,
      heatmapRenderTime: 0,
      fps: 0,
    },
    isPanelOpen: true,
    errorMessage: null,
    engine,
    pathSimulator,
    heatmapRenderer,

    setHallConfig: (config: Partial<HallConfig>) => {
      const { engine } = get();
      engine.setHallConfig(config);
      set({ scene: engine.getScene() });
    },

    addShowcase: (position: Point2D) => {
      const { engine } = get();
      engine.addShowcase(position);
      set({ scene: engine.getScene() });
    },

    updateShowcase: (id: string, updates: Partial<Showcase>) => {
      const { engine } = get();
      engine.updateShowcase(id, updates);
      set({ scene: engine.getScene() });
    },

    removeShowcase: (id: string) => {
      const { engine, selectedId } = get();
      engine.removeShowcase(id);
      if (selectedId === id) {
        set({ selectedId: null, selectedType: null });
      }
      set({ scene: engine.getScene() });
    },

    addExhibit: (showcaseId: string, type: ExhibitType) => {
      const { engine } = get();
      engine.addExhibit(showcaseId, type);
      set({ scene: engine.getScene() });
    },

    updateExhibit: (id: string, updates: Partial<Exhibit>) => {
      const { engine } = get();
      engine.updateExhibit(id, updates);
      set({ scene: engine.getScene() });
    },

    removeExhibit: (id: string) => {
      const { engine, selectedId } = get();
      engine.removeExhibit(id);
      if (selectedId === id) {
        set({ selectedId: null, selectedType: null });
      }
      set({ scene: engine.getScene() });
    },

    addVisitorStart: (position: Point2D) => {
      const { engine } = get();
      engine.addVisitorStart(position);
      set({ scene: engine.getScene() });
    },

    updateVisitorStart: (id: string, updates: Partial<VisitorStart>) => {
      const { engine } = get();
      engine.updateVisitorStart(id, updates);
      set({ scene: engine.getScene() });
    },

    removeVisitorStart: (id: string) => {
      const { engine, selectedId } = get();
      engine.removeVisitorStart(id);
      if (selectedId === id) {
        set({ selectedId: null, selectedType: null });
      }
      set({ scene: engine.getScene() });
    },

    selectObject: (
      id: string | null,
      type: 'showcase' | 'exhibit' | 'start' | null
    ) => {
      set({ selectedId: id, selectedType: type });
    },

    setToolMode: (mode: ToolMode) => {
      set({ toolMode: mode });
    },

    runSimulation: async () => {
      const { engine, pathSimulator, heatmapRenderer, setPerformanceMetrics } = get();
      const scene = engine.getScene();

      if (scene.visitorStarts.length === 0) {
        set({
          errorMessage: '请先添加参观者起点',
          isSimulating: false,
        });
        return;
      }

      if (scene.showcases.length === 0) {
        set({
          errorMessage: '请先添加展柜',
          isSimulating: false,
        });
        return;
      }

      set({ isSimulating: true, errorMessage: null });

      try {
        pathSimulator.updateSceneData(scene.hall, scene.showcases);

        const pathStart = performance.now();
        const paths = await pathSimulator.simulatePaths(scene.visitorStarts);
        const pathCalcTime = performance.now() - pathStart;

        engine.setPaths(paths);

        const heatmapStart = performance.now();
        const heatmapData = heatmapRenderer.generateHeatmapData(paths);
        const heatmapRenderTime = performance.now() - heatmapStart;

        engine.setHeatmapData(heatmapData);

        setPerformanceMetrics({
          pathCalcTime,
          heatmapRenderTime,
        });

        set({
          scene: engine.getScene(),
          showHeatmap: true,
          isSimulating: false,
        });
      } catch (error) {
        set({
          errorMessage: `模拟失败: ${(error as Error).message}`,
          isSimulating: false,
        });
      }
    },

    setShowHeatmap: (show: boolean) => {
      set({ showHeatmap: show });
    },

    setHeatmapOpacity: (opacity: number) => {
      set({ heatmapOpacity: Math.max(0, Math.min(1, opacity)) });
    },

    setHoveredPointInfo: (info: SceneStoreState['hoveredPointInfo']) => {
      set({ hoveredPointInfo: info });
    },

    setClickedExhibitStats: (stats: ExhibitStats | null) => {
      set({ clickedExhibitStats: stats });
    },

    setPerformanceMetrics: (
      metrics: Partial<SceneStoreState['performanceMetrics']>
    ) => {
      set((state) => ({
        performanceMetrics: {
          ...state.performanceMetrics,
          ...metrics,
        },
      }));
    },

    togglePanel: () => {
      set((state) => ({ isPanelOpen: !state.isPanelOpen }));
    },

    exportScene: (): string => {
      const { engine } = get();
      return engine.exportScene();
    },

    importScene: (jsonString: string): boolean => {
      const { engine, pathSimulator, heatmapRenderer } = get();
      const result = engine.importScene(jsonString);

      if (!result.success) {
        set({
          errorMessage: result.errors?.join('; ') || '导入失败',
        });
        return false;
      }

      const scene = engine.getScene();
      pathSimulator.updateSceneData(scene.hall, scene.showcases);
      heatmapRenderer.updateHallConfig(scene.hall);

      set({
        scene,
        selectedId: null,
        selectedType: null,
        errorMessage: null,
        showHeatmap: false,
      });

      return true;
    },

    clearError: () => {
      set({ errorMessage: null });
    },
  };
});
