import React, { useEffect, useRef, useState } from 'react';
import { useExhibitionStore } from '@/store/useExhibitionStore';
import { calculateTourPath, interpolatePath } from '@/utils/tourPath';
import * as THREE from 'three';
import { WorkInfoPopup } from './WorkInfoPopup';

interface TourControllerProps {
  cameraRef: React.RefObject<THREE.PerspectiveCamera | null>;
}

export const TourController: React.FC<TourControllerProps> = ({ cameraRef }) => {
  const {
    isTourMode,
    toggleTour,
    tourSpeed,
    setTourSpeed,
    tourPaused,
    toggleTourPause,
    currentExhibitionId,
    getExhibitionById,
    getWorksByExhibition,
    getPlacementsByExhibition,
    getWorkById,
    currentTourWorkId,
    setCurrentTourWork,
  } = useExhibitionStore();

  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const [progress, setProgress] = useState(0);

  const exhibition = currentExhibitionId ? getExhibitionById(currentExhibitionId) : undefined;
  const works = currentExhibitionId ? getWorksByExhibition(currentExhibitionId) : [];
  const placements = currentExhibitionId ? getPlacementsByExhibition(currentExhibitionId) : [];
  const currentWork = currentTourWorkId ? getWorkById(currentTourWorkId) : null;

  const waypoints = React.useMemo(() => {
    if (!exhibition) return [];
    return calculateTourPath(exhibition.venueTemplate, exhibition.wallLayout, placements, works);
  }, [exhibition, placements.length, works.length]);

  const totalDurationMs = React.useMemo(() => {
    if (waypoints.length === 0) return 0;
    const segments = waypoints.length - 1;
    const segmentMs = (3000 / tourSpeed);
    const pauseMs = 2000;
    const workWaypoints = waypoints.filter((w) => w.workId !== null).length;
    return segments * segmentMs + workWaypoints * pauseMs;
  }, [waypoints, tourSpeed]);

  useEffect(() => {
    if (!isTourMode || !cameraRef.current || waypoints.length < 2) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    startTimeRef.current = performance.now();
    pausedTimeRef.current = 0;
    let lastPauseStart = 0;

    const animate = (now: number) => {
      const effectiveNow = tourPaused
        ? (lastPauseStart || now)
        : now - pausedTimeRef.current;

      if (tourPaused && !lastPauseStart) {
        lastPauseStart = now;
      }
      if (!tourPaused && lastPauseStart) {
        pausedTimeRef.current += now - lastPauseStart;
        lastPauseStart = 0;
      }

      const elapsed = effectiveNow - startTimeRef.current;
      const rawProgress = totalDurationMs > 0 ? Math.min(elapsed / totalDurationMs, 1) : 1;
      setProgress(rawProgress);

      if (rawProgress >= 1 && !tourPaused) {
        startTimeRef.current = performance.now();
        pausedTimeRef.current = 0;
      }

      const segments = waypoints.length - 1;
      const segmentMs = (3000 / tourSpeed);
      const pauseMs = 2000;

      let cumulative = 0;
      let segIdx = 0;
      let localT = 0;

      for (let i = 0; i < segments; i++) {
        const wp = waypoints[i];
        const hasPause = wp.workId !== null;
        const dur = segmentMs + (hasPause && i > 0 ? pauseMs : 0);
        if (elapsed <= cumulative + dur) {
          segIdx = i;
          const localElapsed = elapsed - cumulative;
          const offset = hasPause && i > 0 ? Math.min(localElapsed, pauseMs) : 0;
          const moveElapsed = localElapsed - offset;
          localT = Math.min(Math.max(moveElapsed / segmentMs, 0), 1);
          break;
        }
        cumulative += dur;
        segIdx = i;
      }

      if (segIdx >= segments) segIdx = segments - 1;

      const p0 = waypoints[segIdx];
      const p1 = waypoints[Math.min(segIdx + 1, waypoints.length - 1)];
      const t = easeInOutCubic(localT);
      const camPos = new THREE.Vector3().lerpVectors(p0.cameraPos, p1.cameraPos, t);
      const lookAt = new THREE.Vector3().lerpVectors(p0.lookAt, p1.lookAt, t);

      const nearPauseThreshold = 0.05;
      const effectiveWorkId =
        t < nearPauseThreshold && p0.workId
          ? p0.workId
          : t > 1 - nearPauseThreshold && p1.workId
          ? p1.workId
          : null;

      if (cameraRef.current) {
        cameraRef.current.position.lerp(camPos, 0.15);
        cameraRef.current.lookAt(lookAt);
      }
      setCurrentTourWork(effectiveWorkId);

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isTourMode, tourPaused, tourSpeed, waypoints, totalDurationMs, cameraRef]);

  useEffect(() => {
    if (!isTourMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        toggleTourPause();
      } else if (e.code === 'Escape') {
        toggleTour();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTourMode, toggleTour, toggleTourPause]);

  if (!isTourMode) return null;

  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: 30,
          transform: 'translateX(-50%)',
          background: 'rgba(30, 41, 59, 0.9)',
          backdropFilter: 'blur(12px)',
          border: '1px solid #475569',
          borderRadius: 16,
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          zIndex: 200,
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
        }}
      >
        <button
          onClick={toggleTourPause}
          className="btn-gradient"
          style={{ width: 44, height: 44, padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}
        >
          {tourPaused ? '▶' : '❚❚'}
        </button>

        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94A3B8', marginBottom: 6 }}>
            <span>导览进度</span>
            <span>{Math.round(progress * 100)}%</span>
          </div>
          <div style={{ width: '100%', height: 6, background: '#334155', borderRadius: 3, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #4F46E5, #22C55E)',
                borderRadius: 3,
                transition: 'width 0.1s linear',
                width: `${progress * 100}%`,
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 4, background: '#334155', padding: 4, borderRadius: 10 }}>
          {([0.5, 1, 1.5] as const).map((speed) => (
            <button
              key={speed}
              onClick={() => setTourSpeed(speed)}
              style={{
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                border: 'none',
                borderRadius: 7,
                background: tourSpeed === speed ? 'linear-gradient(135deg, #4F46E5, #22C55E)' : 'transparent',
                color: tourSpeed === speed ? 'white' : '#94A3B8',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {speed}x
            </button>
          ))}
        </div>

        <button
          onClick={toggleTour}
          className="btn-secondary"
          style={{ padding: '8px 14px', fontSize: 12 }}
        >
          ✕ 退出 (ESC)
        </button>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 20,
          top: 80,
          background: 'rgba(30, 41, 59, 0.8)',
          backdropFilter: 'blur(8px)',
          border: '1px solid #475569',
          borderRadius: 10,
          padding: '10px 16px',
          fontSize: 12,
          color: '#94A3B8',
          zIndex: 100,
        }}
      >
        <div>空格键：暂停/继续</div>
        <div style={{ marginTop: 4 }}>ESC：退出导览</div>
      </div>

      <WorkInfoPopup work={currentWork ?? null} />
    </>
  );
};

const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
