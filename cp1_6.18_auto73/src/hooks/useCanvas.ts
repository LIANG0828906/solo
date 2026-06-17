import { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '@/store/appStore';
import { CanvasEngine } from '@/canvas/CanvasEngine';
import { isCardMatchingFilter } from '@/shared/cardTypes';

export function useCanvas(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const engineRef = useRef<CanvasEngine | null>(null);
  const cards = useAppStore(s => s.cards);
  const relations = useAppStore(s => s.relations);
  const searchQuery = useAppStore(s => s.searchQuery);
  const selectedTags = useAppStore(s => s.selectedTags);
  const addRelation = useAppStore(s => s.addRelation);

  const filteredCardIds = new Set(
    cards.filter(c => isCardMatchingFilter(c, searchQuery, selectedTags)).map(c => c.id)
  );

  const init = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (engineRef.current) {
      engineRef.current.dispose();
    }

    const engine = new CanvasEngine(canvas);
    engine.resize();
    engine.setOnRelationCreate(async (sourceId, targetId) => {
      try {
        await addRelation(sourceId, targetId);
        engine.triggerRelationAnimation(sourceId, targetId);
      } catch {
      }
    });
    engineRef.current = engine;
  }, [canvasRef, addRelation]);

  useEffect(() => {
    init();
    return () => {
      engineRef.current?.dispose();
    };
  }, [init]);

  useEffect(() => {
    const handleResize = () => {
      engineRef.current?.resize();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    engineRef.current?.updateData(cards, relations, filteredCardIds);
  }, [cards, relations, filteredCardIds]);

  return engineRef;
}
