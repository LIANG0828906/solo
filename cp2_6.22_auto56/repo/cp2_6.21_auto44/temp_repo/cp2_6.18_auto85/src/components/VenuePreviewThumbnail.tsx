import React, { useEffect, useRef, useMemo } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { VenueTemplate } from '@/types';
import { getWallsForVenue, VENUE_CONFIGS } from '@/utils/venueConfigs';

interface ThumbnailSceneProps {
  template: VenueTemplate;
  layoutIndex: number;
  isSelected: boolean;
  onCreated?: (state: {
    scene: THREE.Scene;
    renderer: THREE.WebGLRenderer;
    camera: THREE.Camera;
  }) => void;
}

const ThumbnailScene: React.FC<ThumbnailSceneProps> = ({
  template,
  layoutIndex,
  isSelected,
  onCreated,
}) => {
  const walls = useMemo(() => getWallsForVenue(template, layoutIndex), [template, layoutIndex]);
  const config = VENUE_CONFIGS[template];
  const groupRef = useRef<THREE.Group>(null);
  const tRef = useRef(0);
  const { scene, gl: renderer, camera } = useThree();

  const resourcesRef = useRef<{
    geometries: THREE.BufferGeometry[];
    materials: THREE.Material[];
    textures: THREE.Texture[];
  }>({ geometries: [], materials: [], textures: [] });

  useEffect(() => {
    if (onCreated && scene && renderer && camera) {
      onCreated({ scene, renderer, camera });
    }
  }, [scene, renderer, camera, onCreated]);

  const trackGeometry = (g: THREE.BufferGeometry) => {
    resourcesRef.current.geometries.push(g);
    return g;
  };
  const trackMaterial = (m: THREE.Material) => {
    resourcesRef.current.materials.push(m);
    return m;
  };

  useEffect(() => {
    const cleanup = () => {
      const { geometries, materials, textures } = resourcesRef.current;
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      resourcesRef.current = { geometries: [], materials: [], textures: [] };

      if (scene) {
        scene.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry?.dispose();
            if (Array.isArray(obj.material)) {
              obj.material.forEach((m) => m.dispose());
            } else {
              obj.material?.dispose();
            }
          }
          if (obj instanceof THREE.LineSegments) {
            obj.geometry?.dispose();
            if (Array.isArray(obj.material)) {
              obj.material.forEach((m) => m.dispose());
            } else {
              obj.material?.dispose();
            }
          }
        });
        while (scene.children.length > 0) {
          scene.remove(scene.children[0]);
        }
      }
    };

    return cleanup;
  }, [scene]);

  useFrame((_, delta) => {
    if (groupRef.current && isSelected) {
      tRef.current += delta * 0.4;
      groupRef.current.rotation.y = Math.sin(tRef.current) * 0.25;
    } else if (groupRef.current) {
      tRef.current += delta * 0.25;
      groupRef.current.rotation.y = Math.sin(tRef.current) * 0.12;
    }
  });

  const floorGeom = useMemo(
    () => trackGeometry(new THREE.PlaneGeometry(12, 12)),
    []
  );
  const floorMat = useMemo(
    () =>
      trackMaterial(
        new THREE.MeshStandardMaterial({
          color: config.floorColor,
          roughness: 0.9,
        })
      ),
    [config.floorColor]
  );

  return (
    <>
      <ambientLight intensity={config.ambientIntensity * 1.2} />
      <directionalLight
        position={[4, 8, 6]}
        intensity={config.directionalIntensity * 1.2}
        color={template === 'industrial_warehouse' ? '#FCD34D' : template === 'outdoor_park' ? '#FEF3C7' : '#FFFFFF'}
      />

      <group ref={groupRef} position={[0, -0.8, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} geometry={floorGeom} material={floorMat} />

        {walls.map((wall, idx) => {
          const scale = 0.55;
          const [wx, wy, wz] = wall.position;
          const [rx, ry, rz] = wall.rotation;

          const wallW = wall.width * scale;
          const wallH = wall.height * scale;

          const planeGeom = useMemo(
            () => trackGeometry(new THREE.PlaneGeometry(wallW, wallH)),
            [wallW, wallH]
          );
          const wallMat = useMemo(
            () =>
              trackMaterial(
                new THREE.MeshStandardMaterial({
                  color: config.wallColor,
                  side: THREE.DoubleSide,
                  roughness: 0.8,
                  emissive: new THREE.Color(isSelected ? '#4ade80' : '#000000'),
                  emissiveIntensity: isSelected ? 0.08 : 0,
                })
              ),
            [config.wallColor, isSelected]
          );
          const highlightMat = useMemo(
            () =>
              trackMaterial(
                new THREE.MeshBasicMaterial({
                  color: '#A3E635',
                  transparent: true,
                  opacity: isSelected ? 0.12 : 0,
                })
              ),
            [isSelected]
          );
          const edgesGeom = useMemo(
            () => trackGeometry(new THREE.EdgesGeometry(new THREE.PlaneGeometry(wallW, wallH))),
            [wallW, wallH]
          );
          const edgesMat = useMemo(
            () =>
              trackMaterial(
                new THREE.LineBasicMaterial({
                  color: isSelected ? '#A3E635' : '#475569',
                  transparent: true,
                  opacity: isSelected ? 0.9 : 0.5,
                })
              ),
            [isSelected]
          );

          return (
            <group
              key={`w-${idx}-${template}-${layoutIndex}`}
              position={[wx * scale, wy * scale, wz * scale]}
              rotation={[rx, ry, rz]}
            >
              <mesh geometry={planeGeom} material={wallMat} />
              <mesh position={[0, 0, 0.002]} geometry={planeGeom} material={highlightMat} />
              <lineSegments geometry={edgesGeom} material={edgesMat} />
            </group>
          );
        })}
      </group>
    </>
  );
};

interface VenuePreviewThumbnailProps {
  template: VenueTemplate;
  layoutIndex?: number;
  isSelected?: boolean;
  width?: number | string;
  height?: number | string;
  maxWidth?: number | string;
  maxHeight?: number | string;
  className?: string;
  staticPreview?: boolean;
}

export const VenuePreviewThumbnail: React.FC<VenuePreviewThumbnailProps> = ({
  template,
  layoutIndex = 0,
  isSelected = false,
  width = 200,
  height = 150,
  maxWidth = '100%',
  maxHeight = '100%',
  className = '',
  staticPreview = false,
}) => {
  const config = VENUE_CONFIGS[template];
  const camPos = useMemo<[number, number, number]>(() => {
    if (template === 'white_gallery') return [4.5, 3.5, 6.5];
    if (template === 'industrial_warehouse') return [5.5, 4, 7.5];
    return [5, 3.8, 7];
  }, [template]);

  const [mounted, setMounted] = React.useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <div
      className={`venue-thumbnail ${className}`}
      style={{
        width,
        height,
        maxWidth,
        maxHeight,
        background: config.bgColor,
        borderRadius: 10,
        overflow: 'hidden',
        border: isSelected ? `2px solid #A3E635` : '1px solid #475569',
        boxShadow: isSelected
          ? '0 4px 20px rgba(163, 230, 53, 0.25), inset 0 0 20px rgba(163, 230, 53, 0.05)'
          : '0 2px 10px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.25s ease',
        position: 'relative',
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'stretch',
      }}
    >
      {mounted && !staticPreview && (
        <Canvas
          key={`${template}-${layoutIndex}`}
          camera={{ position: camPos, fov: 42, near: 0.1, far: 100 }}
          dpr={[1, 1.25]}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: 'low-power',
            failIfMajorPerformanceCaveat: true,
          }}
          style={{ width: '100%', height: '100%', background: 'transparent' }}
          frameloop={isSelected ? 'always' : 'demand'}
          performance={{ min: 0.5 }}
          onCreated={({ scene, gl, camera }) => {
            gl.setClearColor(new THREE.Color(config.bgColor), 1);
            scene.background = new THREE.Color(config.bgColor);
            const ext = gl.getContext().getExtension('WEBGL_lose_context');
            const origDispose = gl.dispose.bind(gl);
            gl.dispose = () => {
              origDispose();
              ext?.loseContext?.();
            };
          }}
        >
          <ThumbnailScene template={template} layoutIndex={layoutIndex} isSelected={isSelected} />
        </Canvas>
      )}

      {staticPreview && (
        <div
          style={{
            width: '100%',
            height: '100%',
            background: config.thumbnail,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '45%',
              height: '40%',
              background: `rgba(255,255,255,${template === 'industrial_warehouse' ? '0.08' : '0.3'})`,
              border: `2px solid rgba(163, 230, 53, ${isSelected ? '0.7' : '0.3'})`,
              borderRadius: 2,
            }}
          />
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          bottom: 4,
          right: 8,
          fontSize: 9,
          padding: '2px 6px',
          borderRadius: 4,
          background: isSelected ? 'rgba(163, 230, 53, 0.2)' : 'rgba(71, 85, 105, 0.5)',
          color: isSelected ? '#A3E635' : '#CBD5E1',
          fontWeight: 600,
          letterSpacing: 0.3,
          userSelect: 'none',
        }}
      >
        {template === 'white_gallery' ? 'GALLERY' : template === 'industrial_warehouse' ? 'WAREHOUSE' : 'PARK'}
      </div>
    </div>
  );
};
