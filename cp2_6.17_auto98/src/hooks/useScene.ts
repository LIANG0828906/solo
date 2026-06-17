import { useRef, useEffect, useCallback, useState } from 'react';
import * as THREE from 'three';
import { TreeParams } from '../store/useStore';
import { generateTree, TreeData } from '../utils/treeGenerator';

export const useScene = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const [treeData, setTreeData] = useState<TreeData | null>(null);

  const setCanvas = useCallback((canvas: HTMLCanvasElement) => {
    canvasRef.current = canvas;
  }, []);

  const setScene = useCallback((scene: THREE.Scene) => {
    sceneRef.current = scene;
  }, []);

  const setCamera = useCallback((camera: THREE.PerspectiveCamera) => {
    cameraRef.current = camera;
  }, []);

  const setRenderer = useCallback((renderer: THREE.WebGLRenderer) => {
    rendererRef.current = renderer;
  }, []);

  const updateTree = useCallback((params: TreeParams) => {
    const data = generateTree(params);
    setTreeData(data);
    return data;
  }, []);

  const exportScreenshot = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `ltree-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const copyParamLink = useCallback(
    async (params: TreeParams): Promise<boolean> => {
      const query = new URLSearchParams({
        angle: String(params.angle),
        scale: String(params.scale),
        depth: String(params.depth),
        thicknessDecay: String(params.thicknessDecay),
        randomness: String(params.randomness),
        leafDensity: String(params.leafDensity),
      }).toString();

      const url = `${window.location.origin}${window.location.pathname}?${query}`;
      try {
        await navigator.clipboard.writeText(url);
        return true;
      } catch {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return true;
      }
    },
    []
  );

  const computeBranchLOD = useCallback((cameraDistance: number, level: number): number => {
    const levelFactor = 1 + (7 - Math.min(level, 7)) * 0.15;
    const adjustedDistance = cameraDistance * levelFactor;
    if (adjustedDistance < 3) return 8;
    if (adjustedDistance < 6) return 6;
    if (adjustedDistance < 10) return 4;
    return 3;
  }, []);

  const computeLeafLOD = useCallback((cameraDistance: number): number => {
    if (cameraDistance < 3) return 8;
    if (cameraDistance < 6) return 6;
    if (cameraDistance < 10) return 4;
    return 3;
  }, []);

  const getCameraDistance = useCallback((): number => {
    if (!cameraRef.current) return 8;
    return cameraRef.current.position.length();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const loadedParams: Partial<TreeParams> = {};
    const angle = params.get('angle');
    const scale = params.get('scale');
    const depth = params.get('depth');
    const thicknessDecay = params.get('thicknessDecay');
    const randomness = params.get('randomness');
    const leafDensity = params.get('leafDensity');

    if (angle !== null) loadedParams.angle = Number(angle);
    if (scale !== null) loadedParams.scale = Number(scale);
    if (depth !== null) loadedParams.depth = Number(depth);
    if (thicknessDecay !== null) loadedParams.thicknessDecay = Number(thicknessDecay);
    if (randomness !== null) loadedParams.randomness = Number(randomness);
    if (leafDensity !== null) loadedParams.leafDensity = Number(leafDensity);

    const hasParams = Object.keys(loadedParams).length > 0;
    if (hasParams) {
      window.dispatchEvent(
        new CustomEvent('ltree-load-params', { detail: loadedParams })
      );
    }
  }, []);

  return {
    canvasRef,
    sceneRef,
    cameraRef,
    rendererRef,
    treeData,
    setCanvas,
    setScene,
    setCamera,
    setRenderer,
    updateTree,
    exportScreenshot,
    copyParamLink,
    computeBranchLOD,
    computeLeafLOD,
    getCameraDistance,
  };
};
