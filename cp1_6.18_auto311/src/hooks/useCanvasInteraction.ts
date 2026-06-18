import { useRef, useCallback, useEffect } from 'react';
import { useLayerStore } from '../store/layerStore';
import { createShapeFromDrag } from '../canvas/VectorTools';
import type { DragState, LayerTransform } from '../types';

export function useCanvasInteraction(svgRef: React.RefObject<SVGSVGElement | null>) {
  const dragState = useRef<DragState>({
    isDragging: false,
    mode: null,
    startX: 0,
    startY: 0,
    targetLayerId: null,
    originalTransform: null
  });

  const rafId = useRef<number | null>(null);
  const pendingTransform = useRef<{ id: string; transform: Partial<LayerTransform> } | null>(null);

  const {
    currentTool,
    currentColor,
    layers,
    addLayer,
    updateLayerTransform,
    selectLayer,
    saveToHistory
  } = useLayerStore();

  const getSVGPoint = useCallback((e: React.MouseEvent | MouseEvent): { x: number; y: number } => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * svg.viewBox.baseVal.width;
    const y = ((e.clientY - rect.top) / rect.height) * svg.viewBox.baseVal.height;
    return { x, y };
  }, [svgRef]);

  const flushPendingTransform = useCallback(() => {
    if (pendingTransform.current && rafId.current === null) {
      const { id, transform } = pendingTransform.current;
      updateLayerTransform(id, transform);
      pendingTransform.current = null;
    }
  }, [updateLayerTransform]);

  const scheduleTransformUpdate = useCallback((id: string, transform: Partial<LayerTransform>) => {
    pendingTransform.current = { id, transform };
    if (rafId.current === null) {
      rafId.current = requestAnimationFrame(() => {
        flushPendingTransform();
        rafId.current = null;
      });
    }
  }, [flushPendingTransform]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const point = getSVGPoint(e);
    
    dragState.current = {
      isDragging: true,
      mode: 'create',
      startX: point.x,
      startY: point.y,
      targetLayerId: null,
      originalTransform: null
    };

    selectLayer(null);
  }, [getSVGPoint, selectLayer]);

  const handleLayerMouseDown = useCallback((e: React.MouseEvent, layerId: string) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const point = getSVGPoint(e);
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;

    selectLayer(layerId);

    dragState.current = {
      isDragging: true,
      mode: 'move',
      startX: point.x,
      startY: point.y,
      targetLayerId: layerId,
      originalTransform: { ...layer.transform }
    };
  }, [getSVGPoint, layers, selectLayer]);

  const handleResizeStart = useCallback((e: React.MouseEvent, layerId: string) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const point = getSVGPoint(e);
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;

    dragState.current = {
      isDragging: true,
      mode: 'resize',
      startX: point.x,
      startY: point.y,
      targetLayerId: layerId,
      originalTransform: { ...layer.transform }
    };
  }, [getSVGPoint, layers]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.current.isDragging || !svgRef.current) return;

    const point = getSVGPoint(e);
    const { mode, startX, startY, targetLayerId, originalTransform } = dragState.current;

    if (mode === 'create') {
      const existingTempLayer = layers.find(l => l.name === '__temp__');
      const { pathData, transform } = createShapeFromDrag(
        currentTool,
        startX,
        startY,
        point.x,
        point.y
      );

      if (existingTempLayer) {
        updateLayerTransform(existingTempLayer.id, transform);
      } else {
        addLayer({
          name: '__temp__',
          shapeType: currentTool,
          color: currentColor,
          transform: {
            ...transform,
            rotation: 0,
            opacity: 1.0,
            blur: 0
          },
          pathData
        }, false);
      }
    } else if (mode === 'move' && targetLayerId && originalTransform) {
      const dx = point.x - startX;
      const dy = point.y - startY;
      scheduleTransformUpdate(targetLayerId, {
        x: originalTransform.x + dx,
        y: originalTransform.y + dy
      });
    } else if (mode === 'resize' && targetLayerId && originalTransform) {
      const dx = point.x - startX;
      const dy = point.y - startY;
      const newWidth = Math.max(20, originalTransform.width + dx);
      const newHeight = Math.max(20, originalTransform.height + dy);
      scheduleTransformUpdate(targetLayerId, {
        width: newWidth,
        height: newHeight
      });
    }
  }, [getSVGPoint, currentTool, currentColor, layers, addLayer, updateLayerTransform, scheduleTransformUpdate, svgRef]);

  const handleMouseUp = useCallback(() => {
    if (!dragState.current.isDragging) return;

    const { mode, targetLayerId } = dragState.current;

    if (mode === 'create') {
      const tempLayer = layers.find(l => l.name === '__temp__');
      if (tempLayer) {
        const shapeNames = { rect: '矩形', circle: '圆形', triangle: '三角形', star: '星形' };
        const existingCount = layers.filter(l => l.shapeType === tempLayer.shapeType && l.name !== '__temp__').length + 1;
        useLayerStore.getState().updateLayer(
          tempLayer.id,
          { name: `${shapeNames[tempLayer.shapeType]} ${existingCount}` },
          false
        );
        saveToHistory();
      }
    } else if ((mode === 'move' || mode === 'resize') && targetLayerId) {
      saveToHistory();
    }

    dragState.current = {
      isDragging: false,
      mode: null,
      startX: 0,
      startY: 0,
      targetLayerId: null,
      originalTransform: null
    };
  }, [layers, saveToHistory]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [handleMouseMove, handleMouseUp]);

  return {
    handleCanvasMouseDown,
    handleLayerMouseDown,
    handleResizeStart
  };
}
