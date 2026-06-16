import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import {
  snellLaw,
  totalReflection,
  degToRad,
  radToDeg,
  MEDIA,
  DISPERSION_WAVELENGTHS,
} from '@/utils/physics';

interface SceneProps {
  preset: { id: string; medium1: string; medium2: string; label: string };
  incidentAngle: number;
  onAngleChange: (angle: number) => void;
  dispersionMode: boolean;
}

const BOUNDS = {
  left: -6,
  right: 6,
  top: 4,
  bottom: -4,
  interfaceY: 0,
};

function Scene({ preset, incidentAngle, onAngleChange, dispersionMode }: SceneProps) {
  const medium1 = MEDIA[preset.medium1];
  const medium2 = MEDIA[preset.medium2];

  const lightSourceRef = useRef<THREE.Group>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { camera, gl } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const interfacePlane = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));

  const incidentAngleRad = degToRad(incidentAngle);

  const physics = useMemo(() => {
    const result = snellLaw(incidentAngleRad, medium1.refractiveIndex, medium2.refractiveIndex);
    const criticalAngle = totalReflection(medium1.refractiveIndex, medium2.refractiveIndex);
    return { ...result, criticalAngle };
  }, [incidentAngleRad, medium1.refractiveIndex, medium2.refractiveIndex]);

  const lightSourcePos = useMemo(() => {
    const distance = 3;
    const x = -distance * Math.sin(incidentAngleRad);
    const y = BOUNDS.interfaceY + distance * Math.cos(incidentAngleRad);
    return [x, y, 0] as [number, number, number];
  }, [incidentAngleRad]);

  const incidentPoint = useMemo(() => {
    const dirX = Math.sin(incidentAngleRad);
    const dirY = -Math.cos(incidentAngleRad);
    const [sx, sy] = lightSourcePos;
    const t = (BOUNDS.interfaceY - sy) / dirY;
    return [sx + dirX * t, BOUNDS.interfaceY, 0] as [number, number, number];
  }, [incidentAngleRad, lightSourcePos]);

  const reflectedEnd = useMemo(() => {
    const [ix, iy] = incidentPoint;
    const reflectAngle = physics.reflectionAngle;
    const dirX = Math.sin(reflectAngle);
    const dirY = Math.cos(reflectAngle);
    const distance = 5;
    return [ix + dirX * distance, iy + dirY * distance, 0] as [number, number, number];
  }, [incidentPoint, physics.reflectionAngle]);

  const refractedEnd = useMemo(() => {
    if (physics.isTotalReflection || physics.refractionAngle === null) return null;
    const [ix, iy] = incidentPoint;
    const refractAngle = physics.refractionAngle;
    const dirX = Math.sin(refractAngle);
    const dirY = -Math.cos(refractAngle);
    const distance = 5;
    return [ix + dirX * distance, iy + dirY * distance, 0] as [number, number, number];
  }, [incidentPoint, physics]);

  const dispersionRays = useMemo(() => {
    if (!dispersionMode || physics.isTotalReflection || physics.refractionAngle === null) return [];
    return DISPERSION_WAVELENGTHS.map((wl, i) => {
      const [ix, iy] = incidentPoint;
      const refractAngle = physics.refractionAngle! + wl.offset;
      const dirX = Math.sin(refractAngle);
      const dirY = -Math.cos(refractAngle);
      const distance = 5;
      const endX = ix + dirX * distance;
      const endY = iy + dirY * distance;
      const offset = (i - 3) * 0.08;
      return {
        color: wl.color,
        start: [ix + offset, iy, 0] as [number, number, number],
        end: [endX + offset, endY, 0] as [number, number, number],
      };
    });
  }, [dispersionMode, physics, incidentPoint]);

  useEffect(() => {
    const canvas = gl.domElement;

    const getIntersection = (clientX: number, clientY: number): THREE.Vector3 | null => {
      const rect = canvas.getBoundingClientRect();
      mouse.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.current.setFromCamera(mouse.current, camera);
      const intersection = new THREE.Vector3();
      raycaster.current.ray.intersectPlane(interfacePlane.current, intersection);
      return intersection;
    };

    const onPointerDown = (e: PointerEvent) => {
      const intersection = getIntersection(e.clientX, e.clientY);
      if (!intersection) return;
      const [sx, sy] = lightSourcePos;
      const dist = Math.sqrt((intersection.x - sx) ** 2 + (intersection.y - sy) ** 2);
      if (dist < 0.4) {
        setIsDragging(true);
        canvas.setPointerCapture(e.pointerId);
        canvas.style.cursor = 'crosshair';
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const intersection = getIntersection(e.clientX, e.clientY);
      if (!intersection) return;
      const dx = intersection.x;
      const dy = intersection.y - BOUNDS.interfaceY;
      if (dy <= 0.1) return;
      let angle = Math.atan2(dx, dy);
      const maxAngle = Math.PI / 2 - 0.05;
      angle = Math.max(-maxAngle, Math.min(maxAngle, angle));
      onAngleChange(radToDeg(angle));
    };

    const onPointerUp = (e: PointerEvent) => {
      if (isDragging) {
        setIsDragging(false);
        canvas.releasePointerCapture(e.pointerId);
        canvas.style.cursor = 'default';
      }
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
    };
  }, [isDragging, lightSourcePos, camera, gl, onAngleChange]);

  useFrame(() => {
    if (lightSourceRef.current) {
      const targetPos = new THREE.Vector3(...lightSourcePos);
      lightSourceRef.current.position.lerp(targetPos, 0.2);
    }
  });

  const medium1Color = preset.medium1 === 'air' ? '#4A90D9' : medium1.color;
  const medium2Color = preset.medium2 === 'water' ? '#2C3E50' : medium2.color;

  return (
    <>
      <mesh position={[0, (BOUNDS.top + BOUNDS.interfaceY) / 2, -1]}>
        <planeGeometry args={[14, BOUNDS.top - BOUNDS.interfaceY]} />
        <meshBasicMaterial color={medium1Color} transparent opacity={0.25} />
      </mesh>

      <mesh position={[0, (BOUNDS.bottom + BOUNDS.interfaceY) / 2, -1]}>
        <planeGeometry args={[14, BOUNDS.interfaceY - BOUNDS.bottom]} />
        <meshBasicMaterial color={medium2Color} transparent opacity={0.35} />
      </mesh>

      {preset.medium2 === 'water' && (
        <group position={[3.5, -1.5, 0]}>
          <mesh>
            <sphereGeometry args={[0.5, 32, 32]} />
            <meshBasicMaterial color="#63B3ED" transparent opacity={0.4} />
          </mesh>
          <Html position={[0, 0.8, 0]} center style={{ pointerEvents: 'none' }}>
            <div style={{ color: '#E0E0E0', fontSize: 12, fontFamily: 'Courier New' }}>💧</div>
          </Html>
        </group>
      )}
      {preset.medium2 === 'glass' && (
        <group position={[3.5, -1.5, 0]}>
          <mesh>
            <boxGeometry args={[0.9, 0.9, 0.9]} />
            <meshBasicMaterial color="#A0AEC0" transparent opacity={0.4} />
          </mesh>
          <Html position={[0, 0.8, 0]} center style={{ pointerEvents: 'none' }}>
            <div style={{ color: '#E0E0E0', fontSize: 12, fontFamily: 'Courier New' }}>🪟</div>
          </Html>
        </group>
      )}
      {preset.medium2 === 'diamond' && (
        <group position={[3.5, -1.5, 0]}>
          <mesh>
            <octahedronGeometry args={[0.5, 0]} />
            <meshBasicMaterial color="#E2E8F0" transparent opacity={0.5} />
          </mesh>
          <Html position={[0, 0.8, 0]} center style={{ pointerEvents: 'none' }}>
            <div style={{ color: '#E0E0E0', fontSize: 12, fontFamily: 'Courier New' }}>💎</div>
          </Html>
        </group>
      )}

      <Line
        points={[
          [BOUNDS.left, BOUNDS.interfaceY, -0.5],
          [BOUNDS.right, BOUNDS.interfaceY, -0.5],
        ]}
        color="#ffffff"
        lineWidth={2}
        transparent
        opacity={0.9}
      />

      <Line
        points={[
          [0, BOUNDS.interfaceY + 1.5, -0.4],
          [0, BOUNDS.interfaceY - 1.5, -0.4],
        ]}
        color="#ffffff"
        lineWidth={1}
        dashed
        dashSize={0.1}
        gapSize={0.08}
        transparent
        opacity={0.4}
      />

      <Line
        points={[lightSourcePos, incidentPoint]}
        color="#ffffff"
        lineWidth={2}
        transparent
        opacity={1}
      />

      <Line
        points={[incidentPoint, reflectedEnd]}
        color="#3B82F6"
        lineWidth={2}
        dashed
        dashSize={0.15}
        gapSize={0.08}
        transparent
        opacity={0.9}
      />

      {!physics.isTotalReflection && refractedEnd && !dispersionMode && (
        <Line
          points={[incidentPoint, refractedEnd]}
          color="#EF4444"
          lineWidth={2}
          transparent
          opacity={1}
        />
      )}

      {dispersionRays.map((ray, i) => (
        <Line
          key={i}
          points={[ray.start, ray.end]}
          color={ray.color}
          lineWidth={1.5}
          transparent
          opacity={0.95}
        />
      ))}

      {physics.isTotalReflection && (
        <Html position={[incidentPoint[0], incidentPoint[1] + 0.5, 0]} center>
          <div
            style={{
              color: '#FFD700',
              fontFamily: 'Courier New',
              fontSize: 18,
              fontWeight: 'bold',
              textShadow: '0 0 10px rgba(255, 215, 0, 0.8)',
              animation: 'pulse 0.8s ease-in-out infinite',
              whiteSpace: 'nowrap',
            }}
          >
            ⚠ 全反射
          </div>
        </Html>
      )}

      <group ref={lightSourceRef}>
        <mesh>
          <circleGeometry args={[0.15, 32]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, 0, -0.01]}>
          <circleGeometry args={[0.28, 32]} />
          <meshBasicMaterial color="#FEF3C7" transparent opacity={0.4} />
        </mesh>
        <mesh position={[0, 0, -0.02]}>
          <circleGeometry args={[0.4, 32]} />
          <meshBasicMaterial color="#FDE68A" transparent opacity={0.2} />
        </mesh>
      </group>

      <Html
        position={[(lightSourcePos[0] + incidentPoint[0]) / 2, (lightSourcePos[1] + incidentPoint[1]) / 2 + 0.3, 0]}
        center
        style={{ pointerEvents: 'none' }}
      >
        <div
          style={{
            color: '#E0E0E0',
            fontFamily: 'Courier New',
            fontSize: 14,
            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
            whiteSpace: 'nowrap',
          }}
        >
          θ₁={incidentAngle.toFixed(1)}°
        </div>
      </Html>

      <Html
        position={[(incidentPoint[0] + reflectedEnd[0]) / 2, (incidentPoint[1] + reflectedEnd[1]) / 2 + 0.3, 0]}
        center
        style={{ pointerEvents: 'none' }}
      >
        <div
          style={{
            color: '#60A5FA',
            fontFamily: 'Courier New',
            fontSize: 14,
            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
            whiteSpace: 'nowrap',
          }}
        >
          θᵣ={radToDeg(physics.reflectionAngle).toFixed(1)}°
        </div>
      </Html>

      {!physics.isTotalReflection && physics.refractionAngle !== null && !dispersionMode && (
        <Html
          position={
            [
              (incidentPoint[0] + refractedEnd![0]) / 2,
              (incidentPoint[1] + refractedEnd![1]) / 2 - 0.3,
              0,
            ]
          }
          center
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              color: '#F87171',
              fontFamily: 'Courier New',
              fontSize: 14,
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              whiteSpace: 'nowrap',
            }}
          >
            θ₂={radToDeg(physics.refractionAngle).toFixed(1)}°
          </div>
        </Html>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
      `}</style>
    </>
  );
}

export default Scene;
