import { useEffect, useRef, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneStore } from '@/store/useSceneStore';
import {
  checkOcclusions,
  getPointOnPath,
  getPathTangent,
  calculatePathLength,
} from '@/utils/intersectionChecker';

interface ViewAnalysisProps {
  onOcclusionUpdate: (occludedIds: Set<string>) => void;
}

export default function ViewAnalysis({ onOcclusionUpdate }: ViewAnalysisProps) {
  const { camera } = useThree();
  const currentScene = useSceneStore((s) => s.getCurrentScene());
  const isPlaying = useSceneStore((s) => s.isPlayingPath);
  const pathProgress = useSceneStore((s) => s.pathProgress);
  const setPathProgress = useSceneStore((s) => s.setPathProgress);
  const setIsPlayingPath = useSceneStore((s) => s.setIsPlayingPath);
  const setAnalysisResults = useSceneStore((s) => s.setAnalysisResults);
  const analysisResults = useSceneStore((s) => s.analysisResults);
  const resetOcclusionStats = useSceneStore((s) => s.resetOcclusionStats);

  const lastAnalysisTime = useRef(0);
  const animationFrameId = useRef<number | null>(null);
  const totalPlayTime = useRef(0);
  const startTime = useRef(0);
  const originalCameraPos = useRef<THREE.Vector3 | null>(null);
  const originalCameraTarget = useRef<THREE.Vector3 | null>(null);

  const performAnalysis = useCallback(
    (viewPosition: [number, number, number]) => {
      if (!currentScene) return;

      const occludedIds = checkOcclusions(
        viewPosition,
        currentScene.exhibits
      );

      onOcclusionUpdate(new Set(occludedIds));

      const now = Date.now();
      const deltaTime = (now - lastAnalysisTime.current) / 1000;
      lastAnalysisTime.current = now;

      const updatedResults = analysisResults.map((result) => {
        const isOccluded = occludedIds.includes(result.exhibitId);
        const newDuration = isOccluded
          ? result.occlusionDuration + deltaTime
          : result.occlusionDuration;

        let newPercentage = 0;
        if (totalPlayTime.current > 0) {
          newPercentage = (newDuration / totalPlayTime.current) * 100;
        }

        return {
          ...result,
          isOccluded,
          occlusionDuration: newDuration,
          occlusionPercentage: Math.min(newPercentage, 100),
        };
      });

      setAnalysisResults(updatedResults);
    },
    [currentScene, analysisResults, onOcclusionUpdate, setAnalysisResults]
  );

  const updateCameraAlongPath = useCallback(
    (progress: number) => {
      if (!currentScene || currentScene.path.length < 2) return;

      const pathPositions = currentScene.path.map((p) => p.position);
      const cameraPos = getPointOnPath(pathPositions, progress);
      const tangent = getPathTangent(pathPositions, progress);

      camera.position.set(cameraPos[0], cameraPos[1], cameraPos[2]);

      const lookAtPoint = new THREE.Vector3(
        cameraPos[0] + tangent[0] * 5,
        cameraPos[1] + tangent[1] * 2,
        cameraPos[2] + tangent[2] * 5
      );

      camera.lookAt(lookAtPoint);
      camera.updateMatrixWorld();

      return cameraPos;
    },
    [currentScene, camera]
  );

  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      return;
    }

    if (!currentScene || currentScene.path.length < 2) {
      setIsPlayingPath(false);
      return;
    }

    if (!originalCameraPos.current) {
      originalCameraPos.current = camera.position.clone();
      originalCameraTarget.current = new THREE.Vector3();
      camera.getWorldDirection(originalCameraTarget.current);
      originalCameraTarget.current.add(camera.position);
    }

    resetOcclusionStats();
    startTime.current = performance.now();
    lastAnalysisTime.current = Date.now();
    totalPlayTime.current = 0;

    const pathPositions = currentScene.path.map((p) => p.position);
    const pathLength = calculatePathLength(pathPositions);
    const speed = 0.5;
    const totalDuration = pathLength / speed;

    const animate = () => {
      const elapsed = (performance.now() - startTime.current) / 1000;
      totalPlayTime.current = elapsed;

      const progress = Math.min(elapsed / totalDuration, 1);
      setPathProgress(progress);

      const cameraPos = updateCameraAlongPath(progress);

      if (cameraPos) {
        performAnalysis(cameraPos);
      }

      if (progress >= 1) {
        setIsPlayingPath(false);
        setPathProgress(0);

        if (originalCameraPos.current && originalCameraTarget.current) {
          camera.position.copy(originalCameraPos.current);
          camera.lookAt(originalCameraTarget.current);
          camera.updateMatrixWorld();
        }

        originalCameraPos.current = null;
        originalCameraTarget.current = null;
        return;
      }

      animationFrameId.current = requestAnimationFrame(animate);
    };

    animationFrameId.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    };
  }, [
    isPlaying,
    currentScene,
    camera,
    setIsPlayingPath,
    setPathProgress,
    updateCameraAlongPath,
    performAnalysis,
    resetOcclusionStats,
  ]);

  useEffect(() => {
    if (!isPlaying && currentScene) {
      const analysisInterval = setInterval(() => {
        const pos: [number, number, number] = [
          camera.position.x,
          camera.position.y,
          camera.position.z,
        ];
        const occludedIds = checkOcclusions(pos, currentScene.exhibits);
        onOcclusionUpdate(new Set(occludedIds));
      }, 100);

      return () => clearInterval(analysisInterval);
    }
  }, [isPlaying, currentScene, camera, onOcclusionUpdate]);

  return null;
}
