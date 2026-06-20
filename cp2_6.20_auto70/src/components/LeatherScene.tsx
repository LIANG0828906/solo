import { useRef, useCallback, useEffect, useMemo } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { useLayoutStore } from '@/store/useLayoutStore';
import { LEATHER_BOUNDS } from '@/types';
import { generateLeatherTexture, generateLeatherNormalMap } from '@/utils/textureGenerator';
import { CuttingPiece3D } from '@/components/CuttingPiece';
import { CuttingPath3D } from '@/components/CuttingPath';

function LeatherMesh() {
  const meshRef = useRef<THREE.Mesh>(null);
  const leatherMaterial = useLayoutStore((s) => s.leatherMaterial);
  const defects = useLayoutStore((s) => s.defects);
  const pieces = useLayoutStore((s) => s.pieces);

  const colorTexture = useMemo(() => generateLeatherTexture(), []);
  const normalMap = useMemo(() => generateLeatherNormalMap(), []);

  useEffect(() => {
    return () => {
      colorTexture.dispose();
      normalMap.dispose();
    };
  }, [colorTexture, normalMap]);

  const defectMarkers = useMemo(() => {
    return defects.map((d) => (
      <mesh key={d.id} position={[d.position.x, 0.002, d.position.y]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[d.radius, 32]} />
        <meshBasicMaterial
          color={d.type === 'scar' ? 0x663322 : 0x554433}
          transparent
          opacity={0.25}
          depthWrite={false}
        />
      </mesh>
    ));
  }, [defects]);

  const unusedOverlayOpacity = pieces.length > 0 ? 0.15 : 0;

  return (
    <group>
      <mesh
        ref={meshRef}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[LEATHER_BOUNDS.width, LEATHER_BOUNDS.height, 64, 48]} />
        <meshStandardMaterial
          map={colorTexture}
          normalMap={normalMap}
          normalScale={new THREE.Vector2(0.3, 0.3)}
          roughness={leatherMaterial.roughness}
          metalness={leatherMaterial.metalness}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <planeGeometry args={[LEATHER_BOUNDS.width, LEATHER_BOUNDS.height]} />
        <meshBasicMaterial
          color={0xffffff}
          transparent
          opacity={0.02}
          wireframe
        />
      </mesh>

      {unusedOverlayOpacity > 0 && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
          <planeGeometry args={[LEATHER_BOUNDS.width, LEATHER_BOUNDS.height]} />
          <meshBasicMaterial
            color={0x333333}
            transparent
            opacity={unusedOverlayOpacity}
            depthWrite={false}
          />
        </mesh>
      )}

      {defectMarkers}
    </group>
  );
}

function SceneContent() {
  const pieces = useLayoutStore((s) => s.pieces);
  const defects = useLayoutStore((s) => s.defects);
  const selectedPieceId = useLayoutStore((s) => s.selectedPieceId);
  const showCuttingPath = useLayoutStore((s) => s.showCuttingPath);
  const updatePiece = useLayoutStore((s) => s.updatePiece);
  const selectPiece = useLayoutStore((s) => s.selectPiece);
  const sceneFadeKey = useLayoutStore((s) => s.sceneFadeKey);

  const { camera, gl } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const mouse = useMemo(() => new THREE.Vector2(), []);
  const leatherPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const draggingId = useRef<string | null>(null);
  const controlsRef = useRef<any>(null);
  const groupRef = useRef<THREE.Group>(null);
  const fadeAlpha = useRef(1);

  useFrame((_, delta) => {
    if (groupRef.current) {
      if (fadeAlpha.current < 1) {
        fadeAlpha.current = Math.min(1, fadeAlpha.current + delta * 2);
        groupRef.current.children.forEach((child) => {
          if ((child as any).material) {
            const mat = (child as any).material;
            if (Array.isArray(mat)) {
              mat.forEach((m: any) => { m.opacity = fadeAlpha.current; });
            }
          }
        });
      }
    }
  });

  useEffect(() => {
    fadeAlpha.current = 0.3;
  }, [sceneFadeKey]);

  const getWorldPos = useCallback(
    (clientX: number, clientY: number) => {
      const rect = gl.domElement.getBoundingClientRect();
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const target = new THREE.Vector3();
      const hit = raycaster.ray.intersectPlane(leatherPlane, target);
      if (!hit) return null;
      return { x: target.x, y: target.z };
    },
    [camera, gl, raycaster, mouse, leatherPlane]
  );

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      if (!draggingId.current) return;
      const pos = getWorldPos(e.clientX, e.clientY);
      if (pos) {
        updatePiece(draggingId.current, {
          position: pos,
          isDragging: true,
        });
      }
    };

    const onPointerUp = () => {
      if (draggingId.current) {
        updatePiece(draggingId.current, { isDragging: false });
        draggingId.current = null;
        if (controlsRef.current) {
          controlsRef.current.enabled = true;
        }
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [getWorldPos, updatePiece]);

  const handleDragStart = useCallback(
    (id: string) => {
      draggingId.current = id;
      if (controlsRef.current) {
        controlsRef.current.enabled = false;
      }
    },
    []
  );

  const handleDragEnd = useCallback((id: string) => {
    updatePiece(id, { isDragging: false });
  }, [updatePiece]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 10, 7]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-3, 5, -5]} intensity={0.2} color={0xd2b48c} />

      <group ref={groupRef}>
        <LeatherMesh />

        {pieces.map((piece) => (
          <CuttingPiece3D
            key={piece.id}
            piece={piece}
            defects={defects}
            isSelected={piece.id === selectedPieceId}
            showPath={showCuttingPath}
            onDragStart={handleDragStart}
            onDrag={(id, x, y) => updatePiece(id, { position: { x, y }, isDragging: true })}
            onDragEnd={handleDragEnd}
            onSelect={selectPiece}
          />
        ))}

        {showCuttingPath &&
          pieces.map((piece) => <CuttingPath3D key={`path-${piece.id}`} piece={piece} />)}
      </group>

      <gridHelper
        args={[10, 20, 0x333333, 0x222222]}
        position={[0, -0.01, 0]}
      />

      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.08}
        minDistance={2}
        maxDistance={12}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, 0, 0]}
      />
    </>
  );
}

export function LeatherScene() {
  return (
    <Canvas
      camera={{ position: [0, 3, 5], fov: 50, near: 0.1, far: 100 }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.0,
      }}
      dpr={[1, 2]}
      shadows
      style={{ background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)' }}
      onPointerMissed={() => {
        useLayoutStore.getState().selectPiece(null);
      }}
    >
      <SceneContent />
    </Canvas>
  );
}
