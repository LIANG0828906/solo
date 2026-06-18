import React, { useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { VenueTemplate } from '@/types';
import { getWallsForVenue, VENUE_CONFIGS } from '@/utils/venueConfigs';

interface ThumbnailSceneProps {
  template: VenueTemplate;
  layoutIndex: number;
  isSelected: boolean;
}

const ThumbnailScene: React.FC<ThumbnailSceneProps> = ({ template, layoutIndex, isSelected }) => {
  const walls = useMemo(() => getWallsForVenue(template, layoutIndex), [template, layoutIndex]);
  const config = VENUE_CONFIGS[template];
  const groupRef = useRef<THREE.Group>(null);
  const tRef = useRef(0);

  useFrame((_, delta) => {
    if (groupRef.current && isSelected) {
      tRef.current += delta * 0.4;
      groupRef.current.rotation.y = Math.sin(tRef.current) * 0.25;
    } else if (groupRef.current) {
      tRef.current += delta * 0.25;
      groupRef.current.rotation.y = Math.sin(tRef.current) * 0.12;
    }
  });

  return (
    <>
      <ambientLight intensity={config.ambientIntensity * 1.2} />
      <directionalLight
        position={[4, 8, 6]}
        intensity={config.directionalIntensity * 1.2}
        color={template === 'industrial_warehouse' ? '#FCD34D' : template === 'outdoor_park' ? '#FEF3C7' : '#FFFFFF'}
      />

      <group ref={groupRef} position={[0, -0.8, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[12, 12]} />
          <meshStandardMaterial color={config.floorColor} roughness={0.9} />
        </mesh>

        {walls.map((wall, idx) => {
          const scale = 0.55;
          const [wx, wy, wz] = wall.position;
          const [rx, ry, rz] = wall.rotation;
          return (
            <group key={`w-${idx}`} position={[wx * scale, wy * scale, wz * scale]} rotation={[rx, ry, rz]}>
              <mesh>
                <planeGeometry args={[wall.width * scale, wall.height * scale]} />
                <meshStandardMaterial
                  color={config.wallColor}
                  side={THREE.DoubleSide}
                  roughness={0.8}
                  emissive={isSelected ? '#4ade80' : '#000000'}
                  emissiveIntensity={isSelected ? 0.08 : 0}
                />
              </mesh>
              <mesh position={[0, 0, 0.002]}>
                <planeGeometry args={[wall.width * scale, wall.height * scale]} />
                <meshBasicMaterial color={'#A3E635'} transparent opacity={isSelected ? 0.12 : 0} />
              </mesh>
              <lineSegments>
                <edgesGeometry args={[new THREE.PlaneGeometry(wall.width * scale, wall.height * scale)]} />
                <lineBasicMaterial color={isSelected ? '#A3E635' : '#475569'} transparent opacity={isSelected ? 0.9 : 0.5} />
              </lineSegments>
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
  width?: number;
  height?: number;
}

export const VenuePreviewThumbnail: React.FC<VenuePreviewThumbnailProps> = ({
  template,
  layoutIndex = 0,
  isSelected = false,
  width = 200,
  height = 150,
}) => {
  const config = VENUE_CONFIGS[template];
  const camPos = useMemo(() => {
    if (template === 'white_gallery') return [4.5, 3.5, 6.5];
    if (template === 'industrial_warehouse') return [5.5, 4, 7.5];
    return [5, 3.8, 7];
  }, [template]);

  return (
    <div
      style={{
        width,
        height,
        background: config.bgColor,
        borderRadius: 10,
        overflow: 'hidden',
        border: isSelected ? `2px solid #A3E635` : '1px solid #475569',
        boxShadow: isSelected
          ? '0 4px 20px rgba(163, 230, 53, 0.25), inset 0 0 20px rgba(163, 230, 53, 0.05)'
          : '0 2px 10px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.25s ease',
        position: 'relative',
      }}
    >
      <Canvas
        camera={{ position: camPos as [number, number, number], fov: 42, near: 0.1, far: 100 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: false }}
        style={{ background: 'transparent' }}
      >
        <color attach="background" args={[config.bgColor]} />
        <ThumbnailScene template={template} layoutIndex={layoutIndex} isSelected={isSelected} />
      </Canvas>
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
        }}
      >
        {template === 'white_gallery' ? 'GALLERY' : template === 'industrial_warehouse' ? 'WAREHOUSE' : 'PARK'}
      </div>
    </div>
  );
};
