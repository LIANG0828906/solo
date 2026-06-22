import { useState, useMemo, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import HeatmapLayer from './HeatmapLayer';
import { generateDensityPoints, MAP_SIZE, GRID_UNIT } from './HeatmapData';
import type { DensityPoint } from './HeatmapData';

interface DensityStats {
  average: number;
  maximum: number;
  minimum: number;
  count: number;
}

function computeStats(visible: DensityPoint[]): DensityStats {
  if (visible.length === 0) {
    return { average: 0, maximum: 0, minimum: 0, count: 0 };
  }
  let sum = 0;
  let max = -Infinity;
  let min = Infinity;
  for (const p of visible) {
    sum += p.density;
    if (p.density > max) max = p.density;
    if (p.density < min) min = p.density;
  }
  return {
    average: sum / visible.length,
    maximum: max,
    minimum: min,
    count: visible.length,
  };
}

export default function MapScene() {
  const points = useMemo(() => generateDensityPoints(2000), []);
  const [stats, setStats] = useState<DensityStats>({
    average: 0,
    maximum: 0,
    minimum: 0,
    count: 0,
  });

  const handleStatsUpdate = useCallback((visible: DensityPoint[]) => {
    setStats(computeStats(visible));
  }, []);

  const gridDivisions = Math.round(MAP_SIZE / GRID_UNIT);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        camera={{
          position: [35, 35, 35],
          fov: 50,
          near: 0.1,
          far: 1000,
        }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 2]}
        onCreated={({ gl }) => {
          gl.setClearColor('#0B0C10');
        }}
      >
        <color attach="background" args={['#0B0C10']} />
        <fog attach="fog" args={['#0B0C10', 80, 160]} />

        <ambientLight intensity={0.55} />
        <directionalLight position={[30, 50, 20]} intensity={0.9} castShadow={false} />
        <directionalLight position={[-20, 30, -30]} intensity={0.4} color="#8892B0" />

        <mesh
          position={[0, 0, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[MAP_SIZE, MAP_SIZE]} />
          <meshStandardMaterial
            color="#1A1A2E"
            roughness={0.95}
            metalness={0.05}
          />
        </mesh>

        <gridHelper
          args={[MAP_SIZE, gridDivisions, '#8892B0', '#4A5578']}
          position={[0, 0.01, 0]}
        />

        <HeatmapLayer points={points} onStatsUpdate={handleStatsUpdate} />

        <OrbitControls
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.6}
          zoomSpeed={0.9}
          panSpeed={0.7}
          minDistance={15}
          maxDistance={120}
          maxPolarAngle={Math.PI / 2.05}
          minPolarAngle={Math.PI / 8}
          target={[0, 0, 0]}
          makeDefault
        />
      </Canvas>

      <div
        style={{
          position: 'fixed',
          right: '24px',
          bottom: '24px',
          width: '260px',
          background: 'rgba(15, 23, 42, 0.85)',
          borderRadius: '12px',
          padding: '20px',
          color: '#E2E8F0',
          boxShadow: '0 0 10px #6366F1, 0 8px 32px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(99,102,241,0.25)',
          zIndex: 10,
          userSelect: 'none',
        }}
      >
        <div
          style={{
            fontSize: '14px',
            fontWeight: 600,
            marginBottom: '16px',
            color: '#A5B4FC',
            letterSpacing: '0.02em',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#6366F1',
              boxShadow: '0 0 8px #6366F1',
            }}
          />
          实时密度统计
        </div>

        <StatItem
          label="可见采样点"
          value={stats.count.toString()}
          color="#94A3B8"
          suffix="个"
        />
        <StatItem
          label="平均密度"
          value={stats.average.toFixed(2)}
          color="#38BDF8"
          suffix=""
        />
        <StatItem
          label="最大密度"
          value={stats.maximum.toFixed(2)}
          color="#F87171"
          suffix=""
        />
        <StatItem
          label="最小密度"
          value={stats.minimum.toFixed(2)}
          color="#60A5FA"
          suffix=""
          last
        />

        <div
          style={{
            marginTop: '16px',
            paddingTop: '14px',
            borderTop: '1px solid rgba(148,163,184,0.15)',
          }}
        >
          <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '8px' }}>
            密度色谱
          </div>
          <div
            style={{
              height: '8px',
              borderRadius: '4px',
              background:
                'linear-gradient(to right, #0000FF 0%, #00FFFF 33%, #FFFF00 66%, #FF0000 100%)',
              boxShadow: '0 0 8px rgba(99,102,241,0.3)',
            }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '6px',
              fontSize: '10px',
              color: '#64748B',
            }}
          >
            <span>0</span>
            <span>33</span>
            <span>66</span>
            <span>100</span>
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'fixed',
          left: '24px',
          top: '24px',
          background: 'rgba(15, 23, 42, 0.7)',
          borderRadius: '12px',
          padding: '16px 20px',
          color: '#E2E8F0',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(99,102,241,0.2)',
          zIndex: 10,
          userSelect: 'none',
          maxWidth: '320px',
        }}
      >
        <div
          style={{
            fontSize: '18px',
            fontWeight: 700,
            background: 'linear-gradient(90deg, #60A5FA, #A78BFA, #F472B6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '8px',
          }}
        >
          3D城市人口密度热力图
        </div>
        <div style={{ fontSize: '12px', color: '#94A3B8', lineHeight: '1.6' }}>
          左键拖拽旋转 · 滚轮缩放 · 右键平移 · 点击粒子查看详情
        </div>
      </div>
    </div>
  );
}

function StatItem({
  label,
  value,
  color,
  suffix,
  last,
}: {
  label: string;
  value: string;
  color: string;
  suffix: string;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: last ? '10px 0 0 0' : '10px 0',
        borderBottom: last ? 'none' : '1px solid rgba(148,163,184,0.08)',
      }}
    >
      <span style={{ fontSize: '12px', color: '#94A3B8' }}>{label}</span>
      <span
        style={{
          fontSize: '15px',
          fontWeight: 600,
          color,
          fontVariantNumeric: 'tabular-nums',
          display: 'flex',
          alignItems: 'baseline',
          gap: '3px',
        }}
      >
        {value}
        {suffix && (
          <span style={{ fontSize: '11px', fontWeight: 400, color: '#64748B' }}>
            {suffix}
          </span>
        )}
      </span>
    </div>
  );
}
