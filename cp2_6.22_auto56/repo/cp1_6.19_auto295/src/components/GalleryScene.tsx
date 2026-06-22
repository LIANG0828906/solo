import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { Suspense, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useGalleryStore } from '../store/galleryStore';
import { Painting } from './Painting';
import { Sculpture } from './Sculpture';
import { LightSource } from './LightSource';
import { GALLERY_DIMENSIONS } from '../utils/helpers';
import type { WallType } from '../types';

const FLOOR_COLOR = '#D5D8DC';
const WALL_COLOR = '#F2F3F4';

interface GallerySceneProps {
  onWallClick?: (wall: WallType, position: { x: number; y: number; z: number }) => void;
}

function GalleryRoom({ onWallClick }: GallerySceneProps) {
  const { width, depth, height } = GALLERY_DIMENSIONS;

  const walls = [
    {
      name: 'north' as WallType,
      position: [0, height / 2, -depth / 2] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
      size: [width, height] as [number, number],
    },
    {
      name: 'south' as WallType,
      position: [0, height / 2, depth / 2] as [number, number, number],
      rotation: [0, Math.PI, 0] as [number, number, number],
      size: [width, height] as [number, number],
    },
    {
      name: 'east' as WallType,
      position: [width / 2, height / 2, 0] as [number, number, number],
      rotation: [0, -Math.PI / 2, 0] as [number, number, number],
      size: [depth, height] as [number, number],
    },
    {
      name: 'west' as WallType,
      position: [-width / 2, height / 2, 0] as [number, number, number],
      rotation: [0, Math.PI / 2, 0] as [number, number, number],
      size: [depth, height] as [number, number],
    },
  ];

  return (
    <>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color={FLOOR_COLOR} />
      </mesh>
      <Grid
        args={[Math.max(width, depth), Math.max(width, depth) * 2]}
        position={[0, 0.001, 0]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#B0B4B8"
        sectionSize={1}
        sectionThickness={1}
        sectionColor="#909498"
        fadeDistance={50}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={false}
      />
      {walls.map((wall) => (
        <mesh
          key={wall.name}
          position={wall.position}
          rotation={wall.rotation}
          receiveShadow
          onClick={(e) => {
            e.stopPropagation();
            const point = e.point;
            onWallClick?.(wall.name, { x: point.x, y: point.y, z: point.z });
          }}
        >
          <planeGeometry args={wall.size} />
          <meshStandardMaterial color={WALL_COLOR} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </>
  );
}

function CameraSetup() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 1.6, 6);
    camera.lookAt(0, 1.6, 0);
  }, [camera]);
  return null;
}

function SceneContent({ onWallClick }: GallerySceneProps) {
  const { artworks, lights, shadowQuality } = useGalleryStore();
  const shadowMapSize = shadowQuality === 'high' ? 2048 : 1024;

  return (
    <>
      <CameraSetup />
      <OrbitControls
        makeDefault
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={2}
        maxDistance={30}
        maxPolarAngle={Math.PI / 2 - 0.05}
        target={[0, 1.6, 0]}
      />
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={0.6}
        castShadow
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      <Suspense fallback={null}>
        <GalleryRoom onWallClick={onWallClick} />
      </Suspense>
      <Suspense fallback={null}>
        {artworks.map((artwork) =>
          artwork.type === 'painting' ? (
            <Painting key={artwork.id} artwork={artwork} />
          ) : (
            <Sculpture key={artwork.id} artwork={artwork} />
          )
        )}
      </Suspense>
      {lights.map((light) => (
        <LightSource key={light.id} light={light} shadowMapSize={shadowMapSize} />
      ))}
    </>
  );
}

export function GalleryScene({ onWallClick }: GallerySceneProps) {
  return (
    <Canvas
      shadows={{ type: THREE.PCFSoftShadowMap }}
      camera={{ fov: 60, near: 0.1, far: 1000 }}
      gl={{ antialias: true }}
      dpr={[1, 2]}
    >
      <fog attach="fog" args={['#E8EAEB', 15, 50]} />
      <color attach="background" args={['#E8EAEB']} />
      <SceneContent onWallClick={onWallClick} />
    </Canvas>
  );
}
