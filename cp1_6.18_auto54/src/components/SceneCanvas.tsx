import React, { useRef, useEffect, useCallback } from 'react';
import SceneRenderer from '@/modules/SceneRenderer';
import { useStarStore, useConstellationStore } from '@/modules/DataManager';
import type { StarData } from '@/types';

interface SceneCanvasProps {
  rendererRef: React.MutableRefObject<SceneRenderer | null>;
}

const SceneCanvas: React.FC<SceneCanvasProps> = ({ rendererRef }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { canvasStars, selectedStarIds, toggleStarSelection, addStarToCanvas, setCanvasStars, setSelectedStarIds, removeStarFromCanvas } = useStarStore();
  const { connections, setConnections, setActiveConstellationId } = useConstellationStore();
  const prevStarIdsRef = useRef<Set<string>>(new Set());
  const prevConnIdsRef = useRef<Set<string>>(new Set());
  const prevSelectedIdsRef = useRef<Set<string>>(new Set());
  const fadeRef = useRef<HTMLDivElement>(null);

  const handleStarClick = useCallback((id: string, shiftKey: boolean) => {
    if (shiftKey) {
      toggleStarSelection(id);
    } else {
      setSelectedStarIds([id]);
    }
  }, [toggleStarSelection, setSelectedStarIds]);

  useEffect(() => {
    if (!containerRef.current) return;
    const renderer = new SceneRenderer(containerRef.current, handleStarClick);
    rendererRef.current = renderer;

    const handleResize = () => {
      if (!containerRef.current) return;
      renderer.resize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      rendererRef.current = null;
    };
  }, [handleStarClick, rendererRef]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    const currentStarIds = new Set(canvasStars.map(s => s.id));
    for (const id of prevStarIdsRef.current) {
      if (!currentStarIds.has(id)) {
        renderer.removeStar(id);
      }
    }
    for (const star of canvasStars) {
      if (!prevStarIdsRef.current.has(star.id)) {
        renderer.addStar(star);
      }
    }
    prevStarIdsRef.current = currentStarIds;
  }, [canvasStars, rendererRef]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    const currentConnIds = new Set(connections.map(c => c.id));
    for (const id of prevConnIdsRef.current) {
      if (!currentConnIds.has(id)) {
        renderer.removeConnection(id);
      }
    }
    for (const conn of connections) {
      if (!prevConnIdsRef.current.has(conn.id)) {
        const star1 = canvasStars.find(s => s.id === conn.starIds[0]);
        const star2 = canvasStars.find(s => s.id === conn.starIds[1]);
        if (star1 && star2) {
          renderer.addConnection(conn, [star1, star2]);
        }
      }
    }
    prevConnIdsRef.current = currentConnIds;
  }, [connections, canvasStars, rendererRef]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    const currentSelected = new Set(selectedStarIds);
    for (const id of prevSelectedIdsRef.current) {
      if (!currentSelected.has(id)) {
        renderer.selectStar(id, false);
      }
    }
    for (const id of currentSelected) {
      if (!prevSelectedIdsRef.current.has(id)) {
        renderer.selectStar(id, true);
      }
    }
    prevSelectedIdsRef.current = currentSelected;
  }, [selectedStarIds, rendererRef]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/star');
    if (!data) return;
    const starTemplate = JSON.parse(data) as StarData;
    const renderer = rendererRef.current;
    if (!renderer) return;
    const pos = renderer.screenTo3D(e.clientX, e.clientY);
    const newStar: Omit<StarData, 'id'> = {
      name: starTemplate.name,
      color: starTemplate.color,
      radius: starTemplate.radius,
      brightness: starTemplate.brightness,
      position: pos,
    };
    addStarToCanvas(newStar);
  }, [rendererRef, addStarToCanvas]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const triggerFade = useCallback(() => {
    const el = fadeRef.current;
    if (!el) return;
    el.style.opacity = '1';
    requestAnimationFrame(() => {
      el.style.transition = 'opacity 0.5s ease-out';
      el.style.opacity = '0';
      setTimeout(() => {
        el.style.transition = '';
      }, 500);
    });
  }, []);

  return (
    <div className="scene-canvas" ref={containerRef} onDrop={handleDrop} onDragOver={handleDragOver}>
      <div className="scene-canvas__fade" ref={fadeRef} />
      <div className="scene-canvas__hint">
        从左侧星库拖拽恒星到此处
      </div>
    </div>
  );
};

export default SceneCanvas;
