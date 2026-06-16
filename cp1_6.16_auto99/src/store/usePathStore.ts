import { create } from 'zustand';
import { produce } from 'immer';
import type { VectorPath, Point, BezierNode, ImageTransform } from '../types';
import { loadImageToCanvas, getImageData, detectEdges } from '../core/edgeDetector';
import { extractPaths, refitPath, generatePathThumbnail } from '../core/pathExtractor';
import { exportToSVG, downloadSVG } from '../utils/svgExport';

interface PathState {
  paths: VectorPath[];
  selectedPathId: string | null;
  hoveredNodeId: string | null;
  draggingNodeId: string | null;
  imageUrl: string | null;
  imageCanvas: HTMLCanvasElement | null;
  imageTransform: ImageTransform;
  isProcessing: boolean;
  error: string | null;
}

interface PathActions {
  setImage: (url: string) => Promise<void>;
  generatePaths: (threshold?: number, rdpEpsilon?: number) => Promise<void>;
  selectPath: (id: string | null) => void;
  deletePath: (id: string) => void;
  clearPaths: () => void;
  updateNode: (pathId: string, nodeId: string, pos: Point, refit?: boolean) => void;
  setHoveredNode: (nodeId: string | null) => void;
  setDraggingNode: (nodeId: string | null) => void;
  setImageTransform: (t: Partial<ImageTransform>) => void;
  exportSVG: () => void;
  resetImageTransform: () => void;
}

export const usePathStore = create<PathState & PathActions>((set, get) => ({
  paths: [],
  selectedPathId: null,
  hoveredNodeId: null,
  draggingNodeId: null,
  imageUrl: null,
  imageCanvas: null,
  imageTransform: { x: 0, y: 0, scale: 1 },
  isProcessing: false,
  error: null,

  setImage: async (url: string) => {
    set({ isProcessing: true, error: null });
    try {
      const canvas = await loadImageToCanvas(url);
      set({
        imageUrl: url,
        imageCanvas: canvas,
        paths: [],
        selectedPathId: null,
        imageTransform: { x: 0, y: 0, scale: 1 },
        isProcessing: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : '加载图片失败',
        isProcessing: false,
      });
    }
  },

  generatePaths: async (threshold: number = 80, rdpEpsilon: number = 2.0) => {
    const { imageCanvas } = get();
    if (!imageCanvas) {
      set({ error: '请先加载图片' });
      return;
    }

    set({ isProcessing: true, error: null });

    try {
      const imageData = getImageData(imageCanvas);
      const edgePoints = detectEdges(imageData, threshold);
      const paths = extractPaths(edgePoints, rdpEpsilon);

      const pathsWithThumbnails = paths.map(path => ({
        ...path,
        thumbnail: generatePathThumbnail(path),
      }));

      set({
        paths: pathsWithThumbnails,
        selectedPathId: null,
        isProcessing: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : '生成路径失败',
        isProcessing: false,
      });
    }
  },

  selectPath: (id: string | null) => {
    set({ selectedPathId: id });
  },

  deletePath: (id: string) => {
    set(
      produce((state: PathState) => {
        const idx = state.paths.findIndex(p => p.id === id);
        if (idx !== -1) {
          state.paths.splice(idx, 1);
          if (state.selectedPathId === id) {
            state.selectedPathId = null;
          }
        }
      })
    );
  },

  clearPaths: () => {
    set({ paths: [], selectedPathId: null });
  },

  updateNode: (pathId: string, nodeId: string, pos: Point, autoRefit: boolean = true) => {
    set(
      produce((state: PathState) => {
        const path = state.paths.find(p => p.id === pathId);
        if (!path) return;

        const nodeIndex = path.nodes.findIndex(n => n.id === nodeId);
        if (nodeIndex === -1) return;

        const node = path.nodes[nodeIndex];
        const dx = pos.x - node.x;
        const dy = pos.y - node.y;

        node.x = pos.x;
        node.y = pos.y;

        if (node.controlIn) {
          node.controlIn.x += dx;
          node.controlIn.y += dy;
        }
        if (node.controlOut) {
          node.controlOut.x += dx;
          node.controlOut.y += dy;
        }

        if (autoRefit && path.nodes.length >= 3) {
          const refitted = refitPath(path.nodes, path.isClosed);
          for (let i = 0; i < path.nodes.length; i++) {
            if (path.nodes[i].id !== nodeId) {
              path.nodes[i] = refitted[i];
            }
          }
        }
      })
    );
  },

  setHoveredNode: (nodeId: string | null) => {
    set({ hoveredNodeId: nodeId });
  },

  setDraggingNode: (nodeId: string | null) => {
    set({ draggingNodeId: nodeId });
  },

  setImageTransform: (t: Partial<ImageTransform>) => {
    set(
      produce((state: PathState) => {
        state.imageTransform = { ...state.imageTransform, ...t };
      })
    );
  },

  resetImageTransform: () => {
    set({ imageTransform: { x: 0, y: 0, scale: 1 } });
  },

  exportSVG: () => {
    const { paths, imageCanvas } = get();
    if (paths.length === 0) {
      set({ error: '没有可导出的路径' });
      return;
    }
    const width = imageCanvas?.width || 800;
    const height = imageCanvas?.height || 600;
    const svg = exportToSVG(paths, width, height);
    downloadSVG(svg, 'sketch-to-vector.svg');
  },
}));
