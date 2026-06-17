import { useRef, useEffect, useCallback } from 'react';
import { TreeParams } from '../store/useStore';

export const useScene = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const exportScreenshot = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `ltree-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
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

  const setCanvas = useCallback((canvas: HTMLCanvasElement) => {
    canvasRef.current = canvas;
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

  return { exportScreenshot, copyParamLink, setCanvas };
};

export const computeLOD = (cameraDistance: number, depth: number): number => {
  if (depth <= 3) return 8;
  if (cameraDistance < 3) return 6;
  if (cameraDistance < 6) return 4;
  if (cameraDistance < 10) return 3;
  return 2;
};

export const computeLeafLOD = (cameraDistance: number): number => {
  if (cameraDistance < 3) return 8;
  if (cameraDistance < 6) return 6;
  if (cameraDistance < 10) return 4;
  return 3;
};
