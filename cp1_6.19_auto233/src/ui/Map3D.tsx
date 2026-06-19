import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '@/store/appStore';
import type { Building, FacadeData, ShadowPolygon } from '@/types';
import { buildingManager } from '@/model/buildingManager';

interface BuildingMeshProps {
  building: Building;
  facadeData: FacadeData[];
  isSelected: boolean;
  onSelect: (id: string) => void;
  onSelectFacade: (buildingId: string, facadeIndex: number) => void;
}

const BuildingMesh = ({ building, facadeData, isSelected, onSelect, onSelectFacade }: BuildingMeshProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);

  const facadeColors = useMemo(() => {
    return [0, 1, 2, 3].map((i) => {
      const fd = facadeData.find(
        (f) => f.buildingId === building.id && f.facadeIndex === i
      );
      return fd?.color || '#3A3A5A';
    });
  }, [facadeData, building.id]);

  const concreteTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#4A4A5A';
    ctx.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * 64;
      const y = Math.random() * 64;
      const size = Math.random() * 2 + 0.5;
      const gray = Math.random() * 30 + 50;
      ctx.fillStyle = `rgba(${gray}, ${gray}, ${gray + 5}, 0.6)`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }, []);

  const facadeGeometries = useMemo(() => {
    const { width, height, depth } = building.size;
    return [
      new THREE.PlaneGeometry(depth, height),
      new THREE.PlaneGeometry(width, height),
      new THREE.PlaneGeometry(depth, height),
      new THREE.PlaneGeometry(width, height),
    ];
  }, [building.size]);

  const facadePositions = useMemo(() => {
    const { width, height, depth } = building.size;
    const hw = width / 2;
    const hd = depth / 2;
    const hh = height / 2;
    return [
      { pos: [hw, hh, 0], rot: [0, Math.PI / 2, 0] },
      { pos: [0, hh, -hd], rot: [0, 0, 0] },
      { pos: [-hw, hh, 0], rot: [0, -Math.PI / 2, 0] },
      { pos: [0, hh, hd], rot: [0, Math.PI, 0] },
    ];
  }, [building.size]);

  return (
    <group
      ref={groupRef}
      position={[building.position.x, building.position.y, building.position.z]}
      rotation={[0, building.rotation, 0]}
    >
      {facadeGeometries.map((geom, i) => {
        const pos = facadePositions[i];
        return (
          <mesh
            key={i}
            ref={(el) => {
              meshRefs.current[i] = el;
            }}
            geometry={geom}
            position={pos.pos as [number, number, number]}
            rotation={pos.rot as [number, number, number]}
            onClick={(e) => {
              e.stopPropagation();
              onSelectFacade(building.id, i);
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              if (e.button === 0) {
                onSelect(building.id);
              }
            }}
          >
            <meshStandardMaterial
              color={facadeColors[i]}
              map={concreteTexture}
              roughness={0.9}
              metalness={0.1}
              side={THREE.FrontSide}
            />
          </mesh>
        );
      })}

      <mesh position={[0, building.size.height / 2, 0]}>
        <boxGeometry args={[building.size.width, building.size.height, building.size.depth]} />
        <meshStandardMaterial
          color="#3A3A5A"
          map={concreteTexture}
          roughness={0.9}
          metalness={0.1}
          side={THREE.BackSide}
        />
      </mesh>

      {isSelected && (
        <mesh position={[0, building.size.height / 2, 0]}>
          <boxGeometry args={[building.size.width + 0.1, building.size.height + 0.1, building.size.depth + 0.1]} />
          <meshBasicMaterial
            color="#4FC3F7"
            wireframe
            transparent
            opacity={0.8}
          />
        </mesh>
      )}
    </group>
  );
};

interface ShadowMeshProps {
  polygon: ShadowPolygon;
}

const ShadowMesh = ({ polygon }: ShadowMeshProps) => {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    if (polygon.points.length > 0) {
      shape.moveTo(polygon.points[0].x, polygon.points[0].z);
      for (let i = 1; i < polygon.points.length; i++) {
        shape.lineTo(polygon.points[i].x, polygon.points[i].z);
      }
      shape.closePath();
    }
    const geo = new THREE.ShapeGeometry(shape);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, [polygon.points]);

  return (
    <mesh geometry={geometry} position={[0, 0.01, 0]}>
      <meshBasicMaterial
        color="#000000"
        transparent
        opacity={0.25}
        side={THREE.DoubleSide}
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-1}
      />
    </mesh>
  );
};

interface SunLightProps {
  sunPosition: { altitude: number; azimuth: number };
}

const SunLight = ({ sunPosition }: SunLightProps) => {
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const targetRef = useRef<THREE.Object3D>(null);

  useEffect(() => {
    if (lightRef.current && targetRef.current) {
      const distance = 100;
      lightRef.current.position.set(
        Math.cos(sunPosition.altitude) * Math.sin(sunPosition.azimuth) * distance,
        Math.sin(sunPosition.altitude) * distance,
        Math.cos(sunPosition.altitude) * Math.cos(sunPosition.azimuth) * distance
      );
      targetRef.current.position.set(0, 0, 0);
      lightRef.current.target = targetRef.current;
    }
  }, [sunPosition]);

  return (
    <>
      <directionalLight
        ref={lightRef}
        intensity={Math.max(0, sunPosition.altitude > 0 ? 1.5 : 0)}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
        color="#FFF5E0"
      />
      <primitive object={new THREE.Object3D()} ref={targetRef} />
    </>
  );
};

interface SceneContentProps {
  onGroundClick: (x: number, z: number) => void;
  isPlacingMode: boolean;
}

const SceneContent = ({ onGroundClick, isPlacingMode }: SceneContentProps) => {
  const {
    buildings,
    facadeData,
    shadowPolygons,
    sunPosition,
    selectedBuildingId,
    selectBuilding,
    selectFacade,
  } = useAppStore();

  const handleGroundClick = (e: any) => {
    if (isPlacingMode) {
      e.stopPropagation();
      const point = e.point;
      onGroundClick(point.x, point.z);
    }
  };

  return (
    <>
      <ambientLight intensity={0.3} />
      <hemisphereLight args={['#87CEEB', '#2A3A5C', 0.4]} />
      <SunLight sunPosition={sunPosition} />

      <fog attach="fog" args={['#0F141E', 40, 120]} />

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
        onClick={handleGroundClick}
      >
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial
          color="#1A2236"
          roughness={1}
          metalness={0}
        />
      </mesh>

      <Grid
        args={[200, 50]}
        cellSize={2}
        cellThickness={0.5}
        cellColor="#2A3A5C"
        sectionSize={10}
        sectionThickness={1}
        sectionColor="#4FC3F7"
        fadeDistance={80}
        fadeStrength={1}
        followCamera={false}
        position={[0, 0.001, 0]}
      />

      {shadowPolygons.map((polygon) => (
        <ShadowMesh key={`shadow-${polygon.buildingId}`} polygon={polygon} />
      ))}

      {buildings.map((building) => (
        <BuildingMesh
          key={building.id}
          building={building}
          facadeData={facadeData}
          isSelected={selectedBuildingId === building.id}
          onSelect={selectBuilding}
          onSelectFacade={selectFacade}
        />
      ))}

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={10}
        maxDistance={80}
        maxPolarAngle={Math.PI / 2 - 0.1}
        target={[0, 0, 0]}
      />
    </>
  );
};

interface Map3DProps {
  onGroundClick: (x: number, z: number) => void;
}

export const Map3D = ({ onGroundClick }: Map3DProps) => {
  const { isPlacingMode } = useAppStore();

  return (
    <div className="map-3d-container">
      <Canvas
        camera={{ position: [30, 25, 30], fov: 50, near: 0.1, far: 1000 }}
        shadows
        gl={{ antialias: true, alpha: false }}
        onPointerMissed={() => {
          useAppStore.getState().selectBuilding(null);
          useAppStore.getState().selectFacade(null, null);
        }}
      >
        <color attach="background" args={['#0F141E']} />
        <SceneContent onGroundClick={onGroundClick} isPlacingMode={isPlacingMode} />
      </Canvas>
    </div>
  );
};
