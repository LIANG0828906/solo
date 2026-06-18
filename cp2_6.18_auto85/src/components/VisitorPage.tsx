import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useExhibitionStore } from '@/store/useExhibitionStore';
import { getWallsForVenue, VENUE_CONFIGS } from '@/utils/venueConfigs';
import { WorkInfoPopup } from './WorkInfoPopup';
import { VenueTemplate, VenueWall, WorkMaterial, WallPlacement } from '@/types';

interface VisitorSceneProps {
  template: VenueTemplate;
  layoutIndex: number;
  placements: WallPlacement[];
  works: WorkMaterial[];
  onWorkHover: (workId: string | null) => void;
}

const VisitorScene: React.FC<VisitorSceneProps> = ({ template, layoutIndex, placements, works, onWorkHover }) => {
  const walls = useMemo(() => getWallsForVenue(template, layoutIndex), [template, layoutIndex]);
  const config = VENUE_CONFIGS[template];
  const { scene } = useThree();
  const [hoveredWork, setHoveredWork] = useState<string | null>(null);

  const textures = useMemo(() => {
    const map = new Map<string, THREE.Texture>();
    works.forEach((w) => {
      const loader = new THREE.TextureLoader();
      loader.crossOrigin = 'anonymous';
      const tex = loader.load(w.imageUrl, (t) => {
        t.needsUpdate = true;
        t.colorSpace = THREE.SRGBColorSpace;
      });
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      map.set(w.id, tex);
    });
    return map;
  }, [works.map((w) => w.id + w.imageUrl).join('|')]);

  useEffect(() => {
    if (scene) {
      scene.background = new THREE.Color(config.bgColor);
    }
  }, [scene, config.bgColor]);

  const renderWorkOnWall = (wall: VenueWall, wallIdx: number) => {
    return placements
      .filter((p) => p.wallIndex === wallIdx)
      .map((placement) => {
        const work = works.find((w) => w.id === placement.workId);
        if (!work) return null;
        const texture = textures.get(work.id);
        if (!texture) return null;

        const aspect = work.originalWidth / work.originalHeight;
        const baseWorldWidth = 2;
        const worldWidth = baseWorldWidth * placement.scale;
        const worldHeight = worldWidth / aspect;

        const maxW = wall.width * 0.9;
        const maxH = wall.height * 0.9;
        let finalW = Math.min(worldWidth, maxW);
        let finalH = finalW / aspect;
        if (finalH > maxH) {
          finalH = maxH;
          finalW = finalH * aspect;
        }

        const offset = 0.02;
        const [wx, wy, wz] = wall.position;
        const [rx, ry, rz] = wall.rotation;
        const euler = new THREE.Euler(rx, ry, rz);
        const right = new THREE.Vector3(1, 0, 0).applyEuler(euler);
        const up = new THREE.Vector3(0, 1, 0).applyEuler(euler);
        const forward = new THREE.Vector3(0, 0, 1).applyEuler(euler);

        const localX = (placement.positionX - 0.5) * wall.width;
        const localY = (placement.positionY - 0.5) * wall.height;

        const isHovered = hoveredWork === work.id;
        const workRotation = placement.rotation;

        return (
          <group
            key={placement.id}
            position={
              new THREE.Vector3(wx, wy, wz)
                .add(right.clone().multiplyScalar(localX))
                .add(up.clone().multiplyScalar(localY))
                .add(forward.clone().multiplyScalar(offset))
            }
            rotation={euler}
          >
            <group rotation={[0, 0, workRotation]}>
              <mesh
                onPointerOver={(e) => {
                  e.stopPropagation();
                  setHoveredWork(work.id);
                  onWorkHover(work.id);
                  document.body.style.cursor = 'pointer';
                }}
                onPointerOut={() => {
                  setHoveredWork(null);
                  onWorkHover(null);
                  document.body.style.cursor = 'grab';
                }}
              >
                <planeGeometry args={[finalW, finalH]} />
                <meshBasicMaterial map={texture} toneMapped={false} />
              </mesh>
              <mesh position={[0, 0, -0.005]}>
                <planeGeometry args={[finalW + 0.04, finalH + 0.04]} />
                <meshBasicMaterial
                  color={isHovered ? '#A3E635' : '#1F2937'}
                  transparent
                  opacity={isHovered ? 0.9 : 1}
                />
              </mesh>
            </group>
          </group>
        );
      });
  };

  return (
    <>
      <ambientLight intensity={config.ambientIntensity} />
      <directionalLight
        position={template === 'outdoor_park' ? [10, 20, 10] : [5, 10, 5]}
        intensity={config.directionalIntensity}
        color={template === 'industrial_warehouse' ? '#FCD34D' : template === 'outdoor_park' ? '#FEF3C7' : '#FFFFFF'}
        castShadow
      />
      {template === 'industrial_warehouse' && (
        <>
          <pointLight position={[-8, 4, -8]} intensity={0.8} color="#F59E0B" distance={15} />
          <pointLight position={[8, 4, 8]} intensity={0.8} color="#F59E0B" distance={15} />
        </>
      )}
      {template === 'outdoor_park' && (
        <>
          <hemisphereLight args={['#87CEEB', '#22C55E', 0.5]} />
        </>
      )}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color={config.floorColor} roughness={0.9} />
      </mesh>

      {walls.map((wall, idx) => (
        <group key={`wall-${idx}`}>
          <mesh position={wall.position} rotation={wall.rotation}>
            <planeGeometry args={[wall.width, wall.height]} />
            <meshStandardMaterial color={config.wallColor} side={THREE.DoubleSide} roughness={0.85} />
          </mesh>
          {renderWorkOnWall(wall, idx)}
        </group>
      ))}

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={3}
        maxDistance={30}
        target={[0, 2, 0]}
        maxPolarAngle={Math.PI / 2 + 0.1}
        makeDefault
        autoRotate={false}
      />
    </>
  );
};

interface VisitorPageProps {
  exhibitionId: string;
  onBack: () => void;
}

export const VisitorPage: React.FC<VisitorPageProps> = ({ exhibitionId, onBack }) => {
  const { getExhibitionById, getWorksByExhibition, getPlacementsByExhibition, incrementVisitCount, getWorkById } =
    useExhibitionStore();
  const [hoveredWorkId, setHoveredWorkId] = useState<string | null>(null);
  const visitedRef = useRef(false);

  const exhibition = getExhibitionById(exhibitionId);
  const works = exhibitionId ? getWorksByExhibition(exhibitionId) : [];
  const placements = exhibitionId ? getPlacementsByExhibition(exhibitionId) : [];
  const hoveredWork = hoveredWorkId ? getWorkById(hoveredWorkId) : null;

  useEffect(() => {
    if (exhibitionId && !visitedRef.current) {
      visitedRef.current = true;
      incrementVisitCount(exhibitionId);
    }
  }, [exhibitionId, incrementVisitCount]);

  if (!exhibition) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0F172A',
          color: '#94A3B8',
        }}
      >
        <div style={{ fontSize: 80, marginBottom: 20, opacity: 0.3 }}>🔍</div>
        <div style={{ fontSize: 22, fontWeight: 600, color: '#CBD5E1', marginBottom: 8 }}>展览不存在</div>
        <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 24 }}>该展览可能已被下架或链接无效</div>
        <button className="btn-gradient" onClick={onBack}>
          返回首页
        </button>
      </div>
    );
  }

  if (!exhibition.isPublished) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0F172A',
          color: '#94A3B8',
        }}
      >
        <div style={{ fontSize: 80, marginBottom: 20, opacity: 0.3 }}>🔒</div>
        <div style={{ fontSize: 22, fontWeight: 600, color: '#CBD5E1', marginBottom: 8 }}>展览尚未发布</div>
        <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 24 }}>策展人暂未开放该展览的公开访问</div>
        <button className="btn-gradient" onClick={onBack}>
          返回首页
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: VENUE_CONFIGS[exhibition.venueTemplate].bgColor,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '16px 28px',
          background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.85) 0%, rgba(15, 23, 42, 0) 100%)',
          zIndex: 100,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          pointerEvents: 'none',
        }}
      >
        <div style={{ pointerEvents: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <button
              onClick={onBack}
              className="btn-secondary"
              style={{ padding: '8px 14px', fontSize: 12 }}
            >
              ← 返回
            </button>
            <div
              style={{
                padding: '6px 14px',
                background: 'rgba(79, 70, 229, 0.25)',
                border: '1px solid rgba(79, 70, 229, 0.4)',
                borderRadius: 8,
                fontSize: 11,
                color: '#A5B4FC',
                fontWeight: 600,
              }}
            >
              👁️ 访客视图
            </div>
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#F8FAFC', marginTop: 8 }}>
            {exhibition.name}
          </div>
          {exhibition.description && (
            <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, maxWidth: 480, lineHeight: 1.6 }}>
              {exhibition.description}
            </div>
          )}
        </div>
        <div
          style={{
            pointerEvents: 'auto',
            textAlign: 'right',
            padding: '10px 16px',
            background: 'rgba(30, 41, 59, 0.8)',
            backdropFilter: 'blur(8px)',
            borderRadius: 12,
            border: '1px solid #334155',
          }}
        >
          <div style={{ fontSize: 10, color: '#64748B', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            访问次数
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: '#A3E635', lineHeight: 1 }}>
              {exhibition.visitCount.toLocaleString()}
            </span>
            <span style={{ fontSize: 11, color: '#94A3B8' }}>次</span>
          </div>
        </div>
      </div>

      <Canvas
        shadows
        camera={{ position: [0, 3, 14], fov: 60, near: 0.1, far: 1000 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={[VENUE_CONFIGS[exhibition.venueTemplate].bgColor]} />
        <fog
          attach="fog"
          args={[VENUE_CONFIGS[exhibition.venueTemplate].bgColor, 25, 55]}
        />
        <VisitorScene
          template={exhibition.venueTemplate}
          layoutIndex={exhibition.wallLayout}
          placements={placements}
          works={works}
          onWorkHover={setHoveredWorkId}
        />
      </Canvas>

      <div
        style={{
          position: 'absolute',
          left: 24,
          bottom: 24,
          background: 'rgba(30, 41, 59, 0.85)',
          backdropFilter: 'blur(10px)',
          border: '1px solid #334155',
          borderRadius: 12,
          padding: '14px 18px',
          zIndex: 100,
          maxWidth: 320,
        }}
      >
        <div style={{ fontSize: 11, color: '#A3E635', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          操作提示
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#CBD5E1' }}>
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: 4,
                background: 'rgba(163, 230, 53, 0.15)',
                border: '1px solid rgba(163, 230, 53, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                color: '#A3E635',
                fontWeight: 600,
              }}
            >
              ⇆
            </span>
            鼠标拖拽 — 旋转视角
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#CBD5E1' }}>
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: 4,
                background: 'rgba(163, 230, 53, 0.15)',
                border: '1px solid rgba(163, 230, 53, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                color: '#A3E635',
                fontWeight: 600,
              }}
            >
              ⊕
            </span>
            滚轮 — 缩放画面
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#CBD5E1' }}>
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: 4,
                background: 'rgba(163, 230, 53, 0.15)',
                border: '1px solid rgba(163, 230, 53, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                color: '#A3E635',
                fontWeight: 600,
              }}
            >
              ✦
            </span>
            悬停作品 — 查看详情
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          right: 24,
          bottom: 24,
          padding: '14px 28px',
          background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.9), rgba(34, 197, 94, 0.9))',
          backdropFilter: 'blur(10px)',
          borderRadius: 14,
          zIndex: 100,
          boxShadow: '0 8px 30px rgba(79, 70, 229, 0.4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 18 }}>👥</div>
          <div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.75)', marginBottom: 1, letterSpacing: 0.3 }}>
              TOTAL VISITS
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'white', lineHeight: 1 }}>
              {exhibition.visitCount.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {hoveredWork && <WorkInfoPopup work={hoveredWork} />}
    </div>
  );
};
