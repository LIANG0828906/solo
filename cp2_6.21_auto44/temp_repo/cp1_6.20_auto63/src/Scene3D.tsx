import React, { useRef, useMemo, useCallback, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Room } from './types';

interface Scene3DProps {
  rooms: Room[];
  filterRange: [number, number];
  hoveredRoomId: string | null;
  selectedRoomIds: Set<string>;
  onHoverRoom: (id: string | null) => void;
  onClickRoom: (id: string) => void;
  currentHour: number;
}

function temperatureToColor(temp: number, min: number = 0, max: number = 50): THREE.Color {
  const t = Math.max(0, Math.min(1, (temp - min) / (max - min)));
  const color = new THREE.Color();
  if (t < 0.25) {
    color.setRGB(0, t * 4 * 0.6, 1);
  } else if (t < 0.5) {
    color.setRGB(0, 0.6 + (t - 0.25) * 4 * 0.4, 1 - (t - 0.25) * 4);
  } else if (t < 0.75) {
    color.setRGB((t - 0.5) * 4, 1, 0);
  } else {
    color.setRGB(1, 1 - (t - 0.75) * 4, 0);
  }
  return color;
}

const EDGE_COLOR = new THREE.Color(0.9, 0.95, 1.0);

interface RoomMeshProps {
  room: Room;
  isInFilter: boolean;
  isHovered: boolean;
  currentHour: number;
  onHover: (id: string | null) => void;
  onClick: (id: string) => void;
}

const RoomMesh: React.FC<RoomMeshProps> = React.memo(({ room, isInFilter, isHovered, currentHour, onHover, onClick }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const edgesRef = useRef<THREE.LineSegments>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  const currentTemp = room.temperatures[Math.floor(currentHour)] ?? room.temperature;
  const baseColor = useMemo(() => temperatureToColor(currentTemp), [currentTemp]);

  const geometry = useMemo(() => {
    return new THREE.BoxGeometry(room.width, room.height, room.depth);
  }, [room.width, room.height, room.depth]);

  const edgesGeometry = useMemo(() => {
    return new THREE.EdgesGeometry(geometry);
  }, [geometry]);

  useFrame(() => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.MeshPhysicalMaterial;

    const targetOpacity = isInFilter ? 0.82 : 0.15;
    const targetEmissive = isHovered ? 0.35 : 0;
    const targetColor = isInFilter ? baseColor : new THREE.Color(0.4, 0.4, 0.45);

    mat.color.lerp(targetColor, 0.15);
    mat.opacity += (targetOpacity - mat.opacity) * 0.15;
    mat.emissiveIntensity += (targetEmissive - mat.emissiveIntensity) * 0.2;
    mat.emissive.copy(baseColor);

    if (edgesRef.current) {
      const edgeMat = edgesRef.current.material as THREE.LineBasicMaterial;
      const edgeTargetOpacity = isInFilter ? (isHovered ? 1.0 : 0.6) : 0.1;
      edgeMat.opacity += (edgeTargetOpacity - edgeMat.opacity) * 0.15;
    }

    if (glowRef.current) {
      const glowMat = glowRef.current.material as THREE.MeshBasicMaterial;
      const glowTarget = isHovered && isInFilter ? 0.25 : 0;
      glowMat.opacity += (glowTarget - glowMat.opacity) * 0.2;
      glowMat.color.copy(baseColor);
    }
  });

  const handlePointerOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onHover(room.id);
  }, [room.id, onHover]);

  const handlePointerOut = useCallback(() => {
    onHover(null);
  }, [onHover]);

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (isInFilter) onClick(room.id);
  }, [room.id, isInFilter, onClick]);

  return (
    <group position={[room.x + room.width / 2, room.y + room.height / 2, room.z + room.depth / 2]}>
      <mesh
        ref={meshRef}
        geometry={geometry}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <meshPhysicalMaterial
          color={baseColor}
          transparent
          opacity={0.82}
          roughness={0.3}
          metalness={0.1}
          emissive={baseColor}
          emissiveIntensity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <lineSegments ref={edgesRef} geometry={edgesGeometry}>
        <lineBasicMaterial color={EDGE_COLOR} transparent opacity={0.6} linewidth={1} />
      </lineSegments>
      <mesh ref={glowRef} scale={[1.04, 1.04, 1.04]}>
        <boxGeometry args={[room.width, room.height, room.depth]} />
        <meshBasicMaterial color={baseColor} transparent opacity={0} side={THREE.BackSide} />
      </mesh>
    </group>
  );
});

RoomMesh.displayName = 'RoomMesh';

const FloorGrid: React.FC = () => {
  const gridRef = useRef<THREE.GridHelper>(null);
  return (
    <gridHelper
      ref={gridRef}
      args={[60, 60, 0x1a2040, 0x111828]}
      position={[8, -0.01, 5]}
    />
  );
};

const SceneContent: React.FC<Omit<Scene3DProps, 'hoveredRoomId'>> = ({ rooms, filterRange, selectedRoomIds, onHoverRoom, onClickRoom, currentHour }) => {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[15, 25, 10]} intensity={0.8} color="#ffffff" />
      <directionalLight position={[-10, 15, -5]} intensity={0.3} color="#00d4ff" />
      <pointLight position={[8, 12, 5]} intensity={0.5} color="#ff6040" distance={40} />

      <FloorGrid />

      {rooms.map((room) => {
        const temp = room.temperatures[Math.floor(currentHour)] ?? room.temperature;
        const isInFilter = temp >= filterRange[0] && temp <= filterRange[1];
        const isHovered = selectedRoomIds.has(room.id);
        return (
          <RoomMesh
            key={room.id}
            room={room}
            isInFilter={isInFilter}
            isHovered={isHovered}
            currentHour={currentHour}
            onHover={onHoverRoom}
            onClick={onClickRoom}
          />
        );
      })}

      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={5}
        maxDistance={80}
        maxPolarAngle={Math.PI / 2.05}
        target={[8, 4, 5]}
      />
    </>
  );
};

const HoverTooltip: React.FC<{ room: Room | null; currentHour: number; position: { x: number; y: number } }> = ({ room, currentHour, position }) => {
  if (!room) return null;

  const temp = room.temperatures[Math.floor(currentHour)] ?? room.temperature;

  return (
    <div
      style={{
        position: 'absolute',
        right: 16,
        top: 16,
        background: 'rgba(10, 14, 23, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(0, 212, 255, 0.25)',
        borderRadius: 12,
        padding: '16px 20px',
        minWidth: 200,
        animation: 'fadeSlideIn 0.25s ease-out',
        pointerEvents: 'none',
        boxShadow: '0 4px 24px rgba(0, 212, 255, 0.12)',
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 600, color: '#00d4ff', marginBottom: 10, letterSpacing: 0.5 }}>
        {room.name}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: '#b0bcd0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>温度</span>
          <span style={{ color: temperatureToHex(temp), fontWeight: 600 }}>{temp.toFixed(1)}°C</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>面积</span>
          <span style={{ color: '#e0e6f0' }}>{room.area} m²</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>楼层</span>
          <span style={{ color: '#e0e6f0' }}>{room.floor}F</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>位置</span>
          <span style={{ color: '#e0e6f0' }}>({room.x}, {room.z})</span>
        </div>
      </div>
    </div>
  );
};

function temperatureToHex(temp: number): string {
  const t = Math.max(0, Math.min(1, temp / 50));
  if (t < 0.25) return '#0066ff';
  if (t < 0.5) return '#00cc88';
  if (t < 0.75) return '#ffcc00';
  return '#ff3300';
}

const Scene3D: React.FC<Scene3DProps> = (props) => {
  const { rooms, hoveredRoomId, currentHour } = props;
  const hoveredRoom = useMemo(() => rooms.find(r => r.id === hoveredRoomId) ?? null, [rooms, hoveredRoomId]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <Canvas
        camera={{ position: [25, 20, 25], fov: 50 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
        onPointerMissed={() => props.onHoverRoom(null)}
      >
        <color attach="background" args={['#0a0e17']} />
        <fog attach="fog" args={['#0a0e17', 50, 90]} />
        <SceneContent {...props} />
      </Canvas>
      <HoverTooltip room={hoveredRoom} currentHour={currentHour} position={{ x: 0, y: 0 }} />
    </div>
  );
};

export default Scene3D;
