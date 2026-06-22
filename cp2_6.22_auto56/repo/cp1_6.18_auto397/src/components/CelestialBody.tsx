import { useRef, useMemo, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { CelestialBody as CelestialBodyType } from '../store/SimulationStore';
import { calculateVelocityMagnitude } from '../engine/PhysicsEngine';

interface CelestialBodyProps {
  body: CelestialBodyType;
  isSelected: boolean;
  highQuality: boolean;
  onSelect: (id: string) => void;
  onDragStart: (id: string, event: ThreeEvent<PointerEvent>) => void;
  onDragEnd: () => void;
}

export function CelestialBody({
  body,
  isSelected,
  highQuality,
  onSelect,
  onDragStart,
  onDragEnd,
}: CelestialBodyProps) {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const starGlowRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const segments = highQuality ? 32 : 16;
  const outlineWidth = highQuality ? 2 : 1.6;
  const labelFontSize = highQuality ? 12 : 9.6;

  const color = useMemo(() => new THREE.Color(body.color), [body.color]);
  const glowColor = useMemo(() => {
    const c = new THREE.Color(body.color);
    return c.multiplyScalar(1.5);
  }, [body.color]);

  const velocityArrow = useMemo(() => {
    const speed = calculateVelocityMagnitude(body.velocity);
    const arrowLength = Math.min(speed * 15, 80);
    const direction = new THREE.Vector3(body.velocity.x, body.velocity.y, 0);
    if (direction.length() > 0) {
      direction.normalize();
    } else {
      direction.set(1, 0, 0);
    }
    return { direction, length: arrowLength };
  }, [body.velocity]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.position.set(body.position.x, body.position.y, 0);
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 2;
    }
  });

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    onSelect(body.id);
    onDragStart(body.id, event);
  };

  const handlePointerUp = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    onDragEnd();
  };

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    setHovered(false);
    document.body.style.cursor = 'default';
  };

  const arrowGeometry = useMemo(() => {
    const length = velocityArrow.length;
    if (length < 5) return null;

    const shape = new THREE.Shape();
    shape.moveTo(0, -2);
    shape.lineTo(length - 8, -2);
    shape.lineTo(length - 8, -5);
    shape.lineTo(length, 0);
    shape.lineTo(length - 8, 5);
    shape.lineTo(length - 8, 2);
    shape.lineTo(0, 2);
    shape.lineTo(0, -2);

    const geometry = new THREE.ShapeGeometry(shape);
    geometry.rotateZ(Math.atan2(velocityArrow.direction.y, velocityArrow.direction.x));
    return geometry;
  }, [velocityArrow]);

  return (
    <group ref={groupRef}>
      <mesh
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <circleGeometry args={[body.radius, segments]} />
        <meshBasicMaterial color={color} />
      </mesh>

      <mesh ref={glowRef}>
        <ringGeometry args={[body.radius, body.radius + outlineWidth, segments]} />
        <meshBasicMaterial
          color={body.type === 'star' ? glowColor : color}
          transparent
          opacity={hovered || isSelected ? 0.8 : 0.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      {body.type === 'star' && (
        <mesh ref={starGlowRef}>
          <circleGeometry args={[body.radius * 1.3, segments]} />
          <meshBasicMaterial
            color={glowColor}
            transparent
            opacity={0.2}
          />
        </mesh>
      )}

      {isSelected && (
        <mesh ref={ringRef}>
          <ringGeometry args={[body.radius + 6, body.radius + 10, segments, 1, 0, Math.PI * 1.5]} />
          <meshBasicMaterial
            color="#00FFAA"
            transparent
            opacity={0.9}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {arrowGeometry && velocityArrow.length > 5 && (
        <mesh geometry={arrowGeometry} position={[0, 0, 1]}>
          <meshBasicMaterial color="#00FFAA" transparent opacity={0.8} />
        </mesh>
      )}

      <Html
        position={[0, body.radius + 12, 2]}
        center
        zIndexRange={[100, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <div
          style={{
            fontSize: `${labelFontSize}px`,
            color: '#FFFFFF',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            padding: '2px 6px',
            borderRadius: '4px',
            whiteSpace: 'nowrap',
            fontFamily: 'system-ui, sans-serif',
            fontWeight: 500,
            textShadow: '0 1px 2px rgba(0,0,0,0.8)',
          }}
        >
          {body.name}
        </div>
      </Html>
    </group>
  );
}
