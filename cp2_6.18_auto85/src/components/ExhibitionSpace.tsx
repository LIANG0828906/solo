import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useExhibitionStore } from '@/store/useExhibitionStore';
import { getWallsForVenue, VENUE_CONFIGS } from '@/utils/venueConfigs';
import { screenToRay, raycastWalls, clampWorkPosition, snapToGrid } from '@/utils/snapAlgorithm';
import { ResizeRotatePanel } from './ResizeRotatePanel';
import { TourController } from './TourController';
import { VenueTemplate, VenueWall, WorkMaterial, WallPlacement } from '@/types';

interface VenueSceneProps {
  template: VenueTemplate;
  layoutIndex: number;
  placements: WallPlacement[];
  works: WorkMaterial[];
  readonly?: boolean;
}

const VenueScene: React.FC<VenueSceneProps> = ({ template, layoutIndex, placements, works, readonly = false }) => {
  const walls = useMemo(() => getWallsForVenue(template, layoutIndex), [template, layoutIndex]);
  const config = VENUE_CONFIGS[template];
  const { scene, camera, gl } = useThree();
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const [hoveredWall, setHoveredWall] = useState<number | null>(null);
  const [pulseWall, setPulseWall] = useState<{ wallIndex: number; time: number } | null>(null);
  const [hoveredWork, setHoveredWork] = useState<string | null>(null);

  const {
    draggingWorkId,
    addWorkToWall,
    selectedWorkId,
    setSelectedWork,
    updateWorkPlacement,
    setDraggingWork,
    isTourMode,
    setCurrentTourWork,
    getWorkById,
    getPlacementByWorkId,
  } = useExhibitionStore();

  const draggingFromWall = useRef<{ workId: string; wallIndex: number } | null>(null);

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
    const dom = gl.domElement;
    const onDragOver = (e: DragEvent) => {
      if (!draggingWorkId && !draggingFromWall.current) return;
      e.preventDefault();
      if (!camera) return;
      const raycaster = screenToRay(e.clientX, e.clientY, dom, camera);
      const hit = raycastWalls(walls, raycaster, camera.position.clone());
      setHoveredWall(hit?.wallIndex ?? null);
    };

    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      if (!camera) return;
      let workId = draggingWorkId || '';
      if (!workId) {
        workId = e.dataTransfer.getData('text/plain') || '';
      }
      if (!workId) {
        draggingFromWall.current = null;
        setHoveredWall(null);
        return;
      }
      const raycaster = screenToRay(e.clientX, e.clientY, dom, camera);
      const hit = raycastWalls(walls, raycaster, camera.position.clone());
      if (hit) {
        const work = getWorkById(workId);
        if (work) {
          const ratioW = 0.6 / walls[hit.wallIndex].width;
          const ratioH = 0.6 / walls[hit.wallIndex].height;
          const workWidthRatio = Math.min(ratioW, ratioH * (work.originalWidth / work.originalHeight));
          const workHeightRatio = workWidthRatio * (work.originalHeight / work.originalWidth);
          const pos = clampWorkPosition(
            snapToGrid(hit.positionX, 0.02),
            snapToGrid(hit.positionY, 0.02),
            Math.min(workWidthRatio, 0.5),
            Math.min(workHeightRatio, 0.5)
          );
          addWorkToWall(workId, hit.wallIndex, pos.positionX, pos.positionY);
          setPulseWall({ wallIndex: hit.wallIndex, time: Date.now() });
          setTimeout(() => setPulseWall(null), 600);
        }
      }
      setDraggingWork(null);
      draggingFromWall.current = null;
      setHoveredWall(null);
    };

    const onDragLeave = () => {
      setHoveredWall(null);
    };

    dom.addEventListener('dragover', onDragOver);
    dom.addEventListener('drop', onDrop);
    dom.addEventListener('dragleave', onDragLeave);

    return () => {
      dom.removeEventListener('dragover', onDragOver);
      dom.removeEventListener('drop', onDrop);
      dom.removeEventListener('dragleave', onDragLeave);
    };
  }, [walls, camera, draggingWorkId, addWorkToWall, gl.domElement, getWorkById, setDraggingWork]);

  useFrame(() => {
    if (cameraRef.current && (camera as THREE.PerspectiveCamera)) {
      const cam = camera as THREE.PerspectiveCamera;
      if (!cameraRef.current.position.equals(cam.position)) {
        cameraRef.current.position.copy(cam.position);
      }
      const target = new THREE.Vector3();
      cam.getWorldDirection(target);
      target.add(cam.position);
    }
  });

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

        const isSelected = selectedWorkId === work.id;
        const isHovered = hoveredWork === work.id;
        const workRotation = placement.rotation;
        const isTourActive = !!isTourMode;

        const handleDoubleClick = (e: any) => {
          e.stopPropagation();
          if (readonly || isTourActive) return;
          setSelectedWork(isSelected ? null : work.id);
        };

        const handlePointerDown = (e: any) => {
          e.stopPropagation();
          if (readonly || isTourActive) return;
          setSelectedWork(work.id);
          if (e.button === 0) {
            draggingFromWall.current = { workId: work.id, wallIndex: wallIdx };
            setDraggingWork(work.id);
          }
        };

        const handlePointerUp = (e: any) => {
          e.stopPropagation();
          if (draggingFromWall.current?.workId === work.id) {
            draggingFromWall.current = null;
            setDraggingWork(null);
          }
        };

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
              {isSelected && (
                <mesh position={[0, 0, -0.01]}>
                  <planeGeometry args={[finalW + 0.15, finalH + 0.15]} />
                  <meshBasicMaterial color="#A3E635" transparent opacity={0.6} />
                </mesh>
              )}
              <mesh
                onPointerOver={(e) => {
                  e.stopPropagation();
                  setHoveredWork(work.id);
                  if (isTourActive) setCurrentTourWork(work.id);
                  document.body.style.cursor = 'pointer';
                }}
                onPointerOut={() => {
                  setHoveredWork(null);
                  if (isTourActive) setCurrentTourWork(null);
                  document.body.style.cursor = 'grab';
                }}
                onDoubleClick={handleDoubleClick}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
              >
                <planeGeometry args={[finalW, finalH]} />
                <meshBasicMaterial map={texture} toneMapped={false} />
              </mesh>
              <mesh position={[0, 0, -0.005]}>
                <planeGeometry args={[finalW + 0.04, finalH + 0.04]} />
                <meshBasicMaterial color={isHovered ? '#A3E635' : isSelected ? '#A3E635' : '#1F2937'} transparent opacity={isHovered || isSelected ? 0.9 : 1} />
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

      {walls.map((wall, idx) => {
        const isHovered = hoveredWall === idx;
        const isPulsing = pulseWall?.wallIndex === idx;
        return (
          <group key={`wall-${idx}`}>
            <mesh
              position={wall.position}
              rotation={wall.rotation}
              onPointerOver={() => !readonly && !isTourMode && draggingWorkId && setHoveredWall(idx)}
              onPointerOut={() => setHoveredWall(null)}
            >
              <planeGeometry args={[wall.width, wall.height]} />
              <meshStandardMaterial
                color={wall.color ?? config.wallColor}
                side={THREE.DoubleSide}
                roughness={0.85}
              />
            </mesh>

            {isHovered && !readonly && !isTourMode && (
              <mesh position={wall.position} rotation={wall.rotation}>
                <planeGeometry args={[wall.width + 0.1, wall.height + 0.1]} />
                <meshBasicMaterial
                  color="#A3E635"
                  transparent
                  opacity={0.12}
                  side={THREE.DoubleSide}
                />
              </mesh>
            )}

            {isPulsing && (
              <mesh position={wall.position} rotation={wall.rotation}>
                <planeGeometry args={[wall.width + 0.2, wall.height + 0.2]} />
                <meshBasicMaterial
                  color="#A3E635"
                  transparent
                  opacity={0.3 + 0.3 * Math.sin(((Date.now() - pulseWall.time) / 600) * Math.PI)}
                  side={THREE.DoubleSide}
                />
              </mesh>
            )}

            {renderWorkOnWall(wall, idx)}
          </group>
        );
      })}

      <primitive object={(camera as THREE.PerspectiveCamera)} ref={cameraRef} attach="camera" />

      {!readonly && !isTourMode && (
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={3}
          maxDistance={30}
          target={[0, 2, 0]}
          maxPolarAngle={Math.PI / 2 + 0.1}
          makeDefault
        />
      )}
      {readonly && (
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
      )}
    </>
  );
};

const CameraRefBridge: React.FC<{ cameraRef: React.RefObject<THREE.PerspectiveCamera | null> }> = ({ cameraRef }) => {
  const { camera } = useThree();
  useEffect(() => {
    if (cameraRef && 'current' in cameraRef) {
      (cameraRef as React.MutableRefObject<THREE.PerspectiveCamera | null>).current = camera as THREE.PerspectiveCamera;
    }
  }, [camera, cameraRef]);
  return null;
};

interface ExhibitionSpaceProps {
  readonly?: boolean;
}

export const ExhibitionSpace: React.FC<ExhibitionSpaceProps> = ({ readonly = false }) => {
  const {
    currentExhibitionId,
    getExhibitionById,
    getWorksByExhibition,
    getPlacementsByExhibition,
    selectedWorkId,
    getWorkById,
    getPlacementByWorkId,
    isTourMode,
  } = useExhibitionStore();

  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const exhibition = currentExhibitionId ? getExhibitionById(currentExhibitionId) : undefined;
  const works = currentExhibitionId ? getWorksByExhibition(currentExhibitionId) : [];
  const placements = currentExhibitionId ? getPlacementsByExhibition(currentExhibitionId) : [];
  const selectedWork = selectedWorkId ? getWorkById(selectedWorkId) : undefined;
  const selectedPlacement = selectedWorkId ? getPlacementByWorkId(selectedWorkId) : undefined;

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
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          color: '#94A3B8',
        }}
      >
        <div style={{ fontSize: 80, marginBottom: 24, opacity: 0.3 }}>🎨</div>
        <div style={{ fontSize: 20, fontWeight: 600, color: '#CBD5E1', marginBottom: 8 }}>
          欢迎使用虚拟艺术展览平台
        </div>
        <div style={{ fontSize: 14, opacity: 0.7, textAlign: 'center', maxWidth: 420 }}>
          点击右上角「新建展览」按钮创建您的第一个虚拟展览
          <br />
          上传作品、布置3D展厅、开启虚拟导览
        </div>
        <div style={{ marginTop: 32, display: 'flex', gap: 24, fontSize: 12, color: '#64748B' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>🏛️</div>
            <div>3种场馆模板</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>🖌️</div>
            <div>自由拖拽布展</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>🎬</div>
            <div>自动导览漫游</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>🔗</div>
            <div>一键发布分享</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: exhibition ? VENUE_CONFIGS[exhibition.venueTemplate].bgColor : '#0F172A',
      }}
      onDragOver={(e) => e.preventDefault()}
    >
      <Canvas
        shadows
        camera={{ position: [0, 3, 14], fov: 60, near: 0.1, far: 1000 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <CameraRefBridge cameraRef={cameraRef} />
        <color attach="background" args={[VENUE_CONFIGS[exhibition.venueTemplate].bgColor]} />
        <fog attach="fog" args={[VENUE_CONFIGS[exhibition.venueTemplate].bgColor, 25, 55]} />
        <VenueScene
          template={exhibition.venueTemplate}
          layoutIndex={exhibition.wallLayout}
          placements={placements}
          works={works}
          readonly={readonly}
        />
      </Canvas>

      {!readonly && selectedWork && selectedPlacement && !isTourMode && (
        <ResizeRotatePanel work={selectedWork} placement={selectedPlacement} />
      )}

      {!readonly && <TourController cameraRef={cameraRef} />}
    </div>
  );
};
