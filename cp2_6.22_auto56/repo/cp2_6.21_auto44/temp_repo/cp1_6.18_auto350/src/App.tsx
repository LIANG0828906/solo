import { useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { useStarStore } from './starStore';
import { calculateCoordinateOffsets } from './dataLoader';
import {
  SceneBackground,
  StarField,
  ConstellationLines,
  ConstellationLabels,
  StarTrajectories,
  TimelineAnimator,
} from './sceneManager';
import { CameraControls, StarInteractionHandler } from './interaction';
import type { StarData, Constellation } from './types';

function ControlPanel() {
  const currentEraIndex = useStarStore((s) => s.currentEraIndex);
  const targetEraIndex = useStarStore((s) => s.targetEraIndex);
  const transitionProgress = useStarStore((s) => s.transitionProgress);
  const isPlaying = useStarStore((s) => s.isPlaying);
  const eras = useStarStore((s) => s.eras);
  const setEra = useStarStore((s) => s.setEra);
  const togglePlay = useStarStore((s) => s.togglePlay);

  const displayEraIndex = useMemo(() => {
    if (transitionProgress < 0.5) return currentEraIndex;
    return targetEraIndex;
  }, [currentEraIndex, targetEraIndex, transitionProgress]);

  const sliderValue = useMemo(() => {
    if (currentEraIndex === targetEraIndex) return currentEraIndex;
    return currentEraIndex + (targetEraIndex - currentEraIndex) * transitionProgress;
  }, [currentEraIndex, targetEraIndex, transitionProgress]);

  const currentEra = eras[displayEraIndex];

  return (
    <div className="control-panel" data-ui-element="true">
      <div className="era-indicator">
        {currentEra ? currentEra.name : ''}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          className="play-pause-btn"
          onClick={togglePlay}
          data-ui-element="true"
          aria-label={isPlaying ? '暂停' : '播放'}
        >
          {isPlaying ? (
            <svg viewBox="0 0 14 14" fill="currentColor">
              <rect x="2" y="1" width="3.5" height="12" rx="0.8" />
              <rect x="8.5" y="1" width="3.5" height="12" rx="0.8" />
            </svg>
          ) : (
            <svg viewBox="0 0 14 14" fill="currentColor">
              <polygon points="3,1 12,7 3,13" />
            </svg>
          )}
        </button>
        <div className="era-slider-container" data-ui-element="true">
          <input
            type="range"
            min={0}
            max={2}
            step={1}
            value={Math.round(sliderValue)}
            onChange={(e) => setEra(parseInt(e.target.value, 10))}
            className="era-slider"
          />
          <div className="era-labels">
            {eras.map((era, idx) => (
              <span
                key={era.index}
                className={`era-label ${idx === displayEraIndex ? 'active' : ''}`}
              >
                {era.year < 0 ? `前${-era.year}` : `${era.year}年`}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StarInfoPanel() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const selectedStarId = useStarStore((s) => s.selectedStarId);
  const stars = useStarStore((s) => s.stars);
  const constellations = useStarStore((s) => s.constellations);
  const selectStar = useStarStore((s) => s.selectStar);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const selectedStar = useMemo<StarData | null>(
    () => (selectedStarId ? stars.find((s) => s.id === selectedStarId) || null : null),
    [selectedStarId, stars]
  );

  const constellationMap = useMemo(() => {
    return new Map<string, Constellation>(constellations.map((c) => [c.id, c]));
  }, [constellations]);

  const offsets = useMemo(() => {
    if (!selectedStar) return null;
    return calculateCoordinateOffsets(selectedStar);
  }, [selectedStar]);

  const constellationName = selectedStar
    ? constellationMap.get(selectedStar.constellationId)?.name || '未知'
    : '';

  return (
    <div
      className={`star-info-panel ${isMobile ? 'mobile' : ''} ${selectedStar ? 'visible' : ''}`}
      data-panel="true"
    >
      {selectedStar && (
        <>
          <button
            className="panel-close-btn"
            onClick={() => selectStar(null)}
            data-ui-element="true"
            aria-label="关闭"
          >
            ×
          </button>
          <div className="panel-title">{selectedStar.name}</div>

          <div className="panel-row">
            <span className="panel-label">所属星座</span>
            <span className="panel-value">{constellationName}</span>
          </div>
          <div className="panel-row">
            <span className="panel-label">星等</span>
            <span className="panel-value">{selectedStar.magnitude.toFixed(2)}</span>
          </div>

          <div className="panel-section-title">坐标偏移量（弧秒）</div>
          <div className="panel-offset-grid">
            <div className="offset-item">
              <span className="offset-label">前2000→元年</span>
              <span className="offset-value">{offsets?.era0To1.toFixed(2) || '0.00'}"</span>
            </div>
            <div className="offset-item">
              <span className="offset-label">元年→1500</span>
              <span className="offset-value">{offsets?.era1To2.toFixed(2) || '0.00'}"</span>
            </div>
            <div className="offset-item" style={{ gridColumn: '1 / -1' }}>
              <span className="offset-label">前2000→1500（总计）</span>
              <span className="offset-value">{offsets?.era0To2.toFixed(2) || '0.00'}"</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function HintOverlay() {
  return (
    <div className="hint-overlay">
      鼠标拖拽旋转 · 滚轮缩放 · 点击星体
    </div>
  );
}

function AppTitle() {
  return <div className="app-title">星 图 演 算</div>;
}

export default function App() {
  const initializeData = useStarStore((s) => s.initializeData);

  useEffect(() => {
    initializeData();
  }, [initializeData]);

  return (
    <div className="app-root">
      <div className="canvas-container">
        <Canvas
          camera={{ position: [0, 0, 18], fov: 55, near: 0.1, far: 200 }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
          }}
          dpr={[1, 2]}
          style={{ background: 'transparent' }}
        >
          <SceneBackground />
          <ambientLight intensity={0.3} />
          <pointLight position={[10, 10, 10]} intensity={0.5} color="#FFD700" />

          <CameraControls />
          <TimelineAnimator />
          <StarTrajectories />
          <ConstellationLines />
          <StarField />
          <ConstellationLabels />
          <StarInteractionHandler />
        </Canvas>
      </div>

      <AppTitle />
      <HintOverlay />
      <ControlPanel />
      <StarInfoPanel />
    </div>
  );
}
