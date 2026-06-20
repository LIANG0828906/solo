import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import GestureTracker from './GestureTracker';
import ParticleRenderer from './ParticleRenderer';
import SceneManager from './SceneManager';
import { eventBus } from './EventBus';
import { useGestureStore } from './store';
import { TrajectoryPoint, TrajectoryFeatures, TrajectoryData } from './types';

const MAX_TRAJECTORIES = 5;

function SceneContent({
  sceneManagerRef,
  gestureTrackerRef,
  particleRendererRef,
  controlsRef,
}: {
  sceneManagerRef: React.MutableRefObject<SceneManager | null>;
  gestureTrackerRef: React.MutableRefObject<GestureTracker | null>;
  particleRendererRef: React.MutableRefObject<ParticleRenderer | null>;
  controlsRef: React.MutableRefObject<any>;
}) {
  const { scene, camera, gl } = useThree();
  const store = useGestureStore;
  const lastTimeRef = useRef(performance.now());
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const sm = new SceneManager(scene);
    sceneManagerRef.current = sm;

    const pr = new ParticleRenderer(scene);
    particleRendererRef.current = pr;
    pr.start();

    const gt = new GestureTracker(
      scene,
      camera,
      gl.domElement,
      controlsRef.current,
    );
    gestureTrackerRef.current = gt;
    gt.start();
  }, [scene, camera, gl, sceneManagerRef, gestureTrackerRef, particleRendererRef, controlsRef]);

  useEffect(() => {
    const onStart = (data: { point: TrajectoryPoint; trajectoryId: string }) => {
      store.getState().setActiveTrajectoryId(data.trajectoryId);
      store.getState().setIsDrawing(true);
    };

    const onMove = (data: { point: TrajectoryPoint; trajectoryId: string }) => {
      const gt = gestureTrackerRef.current;
      if (!gt) return;
      const points = gt.getCurrentPoints();
      const sm = sceneManagerRef.current;
      if (!sm) return;
      sm.updateTrajectoryLine(points, data.trajectoryId);
    };

    const onEnd = (data: {
      points: TrajectoryPoint[];
      features: TrajectoryFeatures;
      trajectoryId: string;
    }) => {
      store.getState().setIsDrawing(false);
      store.getState().setActiveTrajectoryId(null);

      const sm = sceneManagerRef.current;
      if (sm) {
        sm.updateTrajectoryLine(data.points, data.trajectoryId);
      }

      const trajectory: TrajectoryData = {
        id: data.trajectoryId,
        points: data.points,
        features: data.features,
        createdAt: Date.now(),
        fadingOut: false,
        fadeStartTime: 0,
        lineObject: null,
      };
      store.getState().addTrajectory(trajectory);
    };

    eventBus.on('gesture:start', onStart);
    eventBus.on('gesture:move', onMove);
    eventBus.on('gesture:end', onEnd);

    return () => {
      eventBus.off('gesture:start', onStart);
      eventBus.off('gesture:move', onMove);
      eventBus.off('gesture:end', onEnd);
    };
  }, [gestureTrackerRef, sceneManagerRef]);

  useFrame(() => {
    const now = performance.now();
    const delta = (now - lastTimeRef.current) / 1000;
    lastTimeRef.current = now;

    const pr = particleRendererRef.current;
    if (pr) {
      pr.update(Math.min(delta, 0.05));
    }
  });

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 20, 10]} intensity={0.8} />
      <Grid
        args={[200, 20]}
        cellColor="#45A29E"
        sectionColor="#45A29E"
        position={[0, 0, 0]}
        fadeDistance={200}
        fadeStrength={1}
        cellSize={10}
      />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.1}
      />
    </>
  );
}

function PolarChart({ data, size = 80 }: { data: number[]; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 8;

    ctx.clearRect(0, 0, size, size);

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
      ctx.stroke();
    }

    if (data.length === 8) {
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
        const val = data[i] * r;
        const x = cx + Math.cos(angle) * val;
        const y = cy + Math.sin(angle) * val;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(79, 195, 247, 0.3)';
      ctx.fill();
      ctx.strokeStyle = '#4FC3F7';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }, [data, size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
    />
  );
}

function FeaturePanel() {
  const trajectories = useGestureStore((s) => s.trajectories);
  const panelCollapsed = useGestureStore((s) => s.panelCollapsed);
  const setPanelCollapsed = useGestureStore((s) => s.setPanelCollapsed);
  const curvatureThreshold = useGestureStore((s) => s.curvatureThreshold);
  const setCurvatureThreshold = useGestureStore((s) => s.setCurvatureThreshold);

  const latestTrajectory = trajectories.length > 0
    ? trajectories[trajectories.length - 1]
    : null;

  const features = latestTrajectory?.features ?? null;

  const avgCurvature = features?.avgCurvature ?? 0;
  const totalLength = features?.length ?? 0;
  const dirDistribution = features?.directionDistribution ?? [0, 0, 0, 0, 0, 0, 0, 0];

  return (
    <div
      className={`feature-panel ${panelCollapsed ? 'collapsed' : ''}`}
      style={{
        position: 'fixed',
        top: 16,
        right: 16,
        width: 280,
        background: 'rgba(30, 30, 30, 0.85)',
        borderRadius: 12,
        color: '#C5C6C7',
        fontSize: 14,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        zIndex: 100,
        backdropFilter: 'blur(8px)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          cursor: 'pointer',
          borderBottom: '1px solid #333',
        }}
        onClick={() => setPanelCollapsed(!panelCollapsed)}
      >
        <span style={{ fontWeight: 600, fontSize: 14, color: '#C5C6C7' }}>
          特征分析
        </span>
        <span style={{ fontSize: 16, color: '#666' }}>
          {panelCollapsed ? '◀' : '▶'}
        </span>
      </div>

      {!panelCollapsed && (
        <div style={{ padding: '12px 16px' }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>轨迹数量</div>
            <div style={{ color: '#4FC3F7', fontWeight: 600 }}>{trajectories.length}</div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>总长度</div>
            <div style={{ color: '#4FC3F7', fontWeight: 600 }}>
              {totalLength.toFixed(1)} 单位
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>平均曲率</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  flex: 1,
                  height: 8,
                  background: '#333',
                  borderRadius: 4,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(avgCurvature * 100, 100)}%`,
                    background: avgCurvature < 0.5
                      ? '#4FC3F7'
                      : avgCurvature < 1.0
                        ? '#FFA726'
                        : '#E53935',
                    borderRadius: 4,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
              <span style={{ color: '#C5C6C7', fontSize: 12, minWidth: 40 }}>
                {avgCurvature.toFixed(2)}
              </span>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>方向分布</div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <PolarChart data={dirDistribution} size={100} />
            </div>
          </div>

          <div>
            <div style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>
              曲率阈值: {curvatureThreshold.toFixed(1)}
            </div>
            <input
              type="range"
              min="0.1"
              max="5.0"
              step="0.1"
              value={curvatureThreshold}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setCurvatureThreshold(val);
              }}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function CrosshairOverlay() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [visible, setVisible] = useState(false);
  const isDrawing = useGestureStore((s) => s.isDrawing);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      setVisible(true);
    };
    const handleLeave = () => setVisible(false);
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.addEventListener('mousemove', handleMove);
      canvas.addEventListener('mouseleave', handleLeave);
    }
    return () => {
      if (canvas) {
        canvas.removeEventListener('mousemove', handleMove);
        canvas.removeEventListener('mouseleave', handleLeave);
      }
    };
  }, []);

  if (!visible || isDrawing) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: pos.x - 16,
        top: pos.y - 16,
        width: 32,
        height: 32,
        pointerEvents: 'none',
        zIndex: 50,
      }}
    >
      <svg width="32" height="32" viewBox="0 0 32 32">
        <line x1="16" y1="4" x2="16" y2="28" stroke="white" strokeWidth="2" opacity="0.8" />
        <line x1="4" y1="16" x2="28" y2="16" stroke="white" strokeWidth="2" opacity="0.8" />
      </svg>
    </div>
  );
}

function ControlButtons({
  onClear,
  onScreenshot,
}: {
  onClear: () => void;
  onScreenshot: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 16,
        left: 16,
        display: 'flex',
        gap: 12,
        zIndex: 100,
      }}
    >
      <button
        onClick={onClear}
        title="清空所有"
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: 'none',
          background: '#333',
          color: '#C5C6C7',
          fontSize: 18,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#555')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '#333')}
      >
        ✕
      </button>
      <button
        onClick={onScreenshot}
        title="保存截图"
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: 'none',
          background: '#333',
          color: '#C5C6C7',
          fontSize: 16,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#555')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '#333')}
      >
        📷
      </button>
    </div>
  );
}

function BackgroundGradient() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, #0B0C10 0%, #1F2833 100%)',
        zIndex: -1,
      }}
    />
  );
}

export default function App() {
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const gestureTrackerRef = useRef<GestureTracker | null>(null);
  const particleRendererRef = useRef<ParticleRenderer | null>(null);
  const controlsRef = useRef<any>(null);

  const handleClear = useCallback(() => {
    const sm = sceneManagerRef.current;
    const pr = particleRendererRef.current;
    if (sm) sm.clearAll();
    if (pr) pr.clearAll();
    useGestureStore.getState().clearAll();
  }, []);

  const handleScreenshot = useCallback(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `gesture-trajectory-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      window.dispatchEvent(new Event('resize'));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    return () => {
      const gt = gestureTrackerRef.current;
      const pr = particleRendererRef.current;
      const sm = sceneManagerRef.current;
      if (gt) gt.stop();
      if (pr) pr.stop();
      if (sm) sm.dispose();
    };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <BackgroundGradient />
      <Canvas
        camera={{ position: [0, 30, 50], fov: 60, near: 0.1, far: 1000 }}
        style={{ background: 'transparent' }}
        gl={{ preserveDrawingBuffer: true, antialias: true }}
      >
        <SceneContent
          sceneManagerRef={sceneManagerRef}
          gestureTrackerRef={gestureTrackerRef}
          particleRendererRef={particleRendererRef}
          controlsRef={controlsRef}
        />
      </Canvas>
      <CrosshairOverlay />
      <FeaturePanel />
      <ControlButtons onClear={handleClear} onScreenshot={handleScreenshot} />
    </div>
  );
}
