import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as THREE from 'three';
import { UILayer } from '@/ui/UILayer';
import { ThreeRenderer } from '@/renderer/ThreeRenderer';
import { useComparisonStore } from '@/store/useComparisonStore';
import AnnotationSystem from '@/comparison/AnnotationSystem';

const Home: React.FC = () => {
  const [
    hotspotPositions,
    setHotspotPositions,
  ] = useState<Map<string, { x: number; y: number; visible: boolean }>>(new Map());
  const frameRef = useRef<number | null>(null);
  const camARef = useRef<THREE.PerspectiveCamera | null>(null);
  const camBRef = useRef<THREE.PerspectiveCamera | null>(null);

  const annotations = useComparisonStore((s) => s.annotations);
  const mode = useComparisonStore((s) => s.mode);
  const splitRatio = useComparisonStore((s) => s.splitRatio);
  const cameraA = useComparisonStore((s) => s.cameraA);
  const cameraB = useComparisonStore((s) => s.cameraB);

  const ensureCameras = useCallback(() => {
    if (!camARef.current) {
      camARef.current = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    }
    if (!camBRef.current) {
      camBRef.current = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    }
    return { camA: camARef.current, camB: camBRef.current };
  }, []);

  const updateHotspotPositions = useCallback(() => {
    if (annotations.length === 0) {
      if (hotspotPositions.size > 0) setHotspotPositions(new Map());
      return;
    }

    const { camA, camB } = ensureCameras();

    camA.position.set(...cameraA.position);
    camA.lookAt(...cameraA.target);
    camB.position.set(...cameraB.position);
    camB.lookAt(...cameraB.target);

    const w = window.innerWidth;
    const h = window.innerHeight - 56 - 70;
    const splitW = w * splitRatio;

    const positions = AnnotationSystem.updateAnnotationPositions(
      camA,
      camB,
      mode === 'split' ? splitW : w,
      h,
      mode === 'split' ? w - splitW : w,
      h
    );

    let changed = positions.size !== hotspotPositions.size;
    if (!changed) {
      for (const [k, v] of positions) {
        const existing = hotspotPositions.get(k);
        if (!existing || Math.abs(existing.x - v.x) > 0.5 || Math.abs(existing.y - v.y) > 0.5 || existing.visible !== v.visible) {
          changed = true;
          break;
        }
      }
    }

    if (changed) {
      setHotspotPositions(new Map(positions));
    }
  }, [annotations, cameraA, cameraB, mode, splitRatio, hotspotPositions, ensureCameras]);

  useEffect(() => {
    const tick = () => {
      updateHotspotPositions();
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [updateHotspotPositions]);

  const handleHotspotClick = useCallback((id: string) => {
    const state = useComparisonStore.getState();
    const anno = state.annotations.find((a) => a.id === id);
    if (anno) {
      const pos = hotspotPositions.get(id);
      if (pos) {
        useComparisonStore.getState().setActiveAnnotation(anno, {
          x: Math.min(Math.max(pos.x, 20), window.innerWidth - 340),
          y: Math.min(Math.max(pos.y + 56, 80), window.innerHeight - 200),
        });
      }
    }
  }, [hotspotPositions]);

  return (
    <div className="w-full h-screen overflow-hidden bg-[#121212]">
      <ThreeRenderer />
      <UILayer
        hotspotPositions={hotspotPositions}
        onHotspotClick={handleHotspotClick}
      />
    </div>
  );
};

export default Home;
