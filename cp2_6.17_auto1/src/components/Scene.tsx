import React, { useRef, useMemo, useState, useCallback } from 'react';
import { useFrame, useThree, ThreeEvent } from '@react-three/fiber';
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

function cubicBezier(t: number, p1: number, p2: number, p3: number, p4: number): number {
  const cx = 3 * p1;
  const bx = 3 * (p3 - p1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * p2;
  const by = 3 * (p4 - p2) - cy;
  const ay = 1 - cy - by;
  const sampleX = (tt: number) => ((ax * tt + bx) * tt + cx) * tt;
  const sampleY = (tt: number) => ((ay * tt + by) * tt + cy) * tt;
  let lo = 0;
  let hi = 1;
  while (hi - lo > 0.0001) {
    const mid = (lo + hi) / 2;
    if (sampleX(mid) < t) lo = mid;
    else hi = mid;
  }
  return sampleY((lo + hi) / 2);
}

const EASE_OUT_ELASTIC = (t: number) => cubicBezier(t, 0.68, -0.55, 0.27, 1.55);

function Scene({ preset, incidentAngle, onAngleChange, dispersionMode }: SceneProps) {
  const medium1 = MEDIA[preset.medium1];
  const medium2 = MEDIA[preset.medium2];

  const lightSourceRef = useRef<THREE.Group>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { camera, gl } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const interfacePlane = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));

  const animatedAngleRef = useRef(incidentAngle);
  const targetAngleRef = useRef(incidentAngle);
  const animProgressRef = useRef(1);
  const animStartAngleRef = useRef(incidentAngle);

  const mediumTransitionRef = useRef({ progress: 1, fromMedium: preset.medium2, toMedium: preset.medium2 });

  const prevMediumRef = useRef(preset.medium2);
  if (prevMediumRef.current !== preset.medium2) {
    mediumTransitionRef.current = {
      progress: 0,
      fromMedium: prevMediumRef.current,
      toMedium: preset.medium2,
    };
    prevMediumRef.current = preset.medium2;
  }

  const prevAngleRef = useRef(incidentAngle);
  if (prevAngleRef.current !== incidentAngle) {
    animStartAngleRef.current = animatedAngleRef.current;
    targetAngleRef.current = incidentAngle;
    animProgressRef.current = 0;
    prevAngleRef.current = incidentAngle;
  }

  useFrame((_, delta) => {
    if (animProgressRef.current < 1) {
      animProgressRef.current = Math.min(1, animProgressRef.current + delta * 4);
      const eased = EASE_OUT_ELASTIC(animProgressRef.current);
      animatedAngleRef.current =
        animStartAngleRef.current + (targetAngleRef.current - animStartAngleRef.current) * eased;
    }
    if (mediumTransitionRef.current.progress < 1) {
      mediumTransitionRef.current.progress = Math.min(1, mediumTransitionRef.current.progress + delta * 2.5);
    }

    if (lightSourceRef.current && !isDragging) {
      const currentAngleRad = degToRad(animatedAngleRef.current);
      const distance = 3;
      const x = -distance * Math.sin(currentAngleRad);
      const y = BOUNDS.interfaceY + distance * Math.cos(currentAngleRad);
      const targetPos = new THREE.Vector3(x, y, 0);
      lightSourceRef.current.position.lerp(targetPos, Math.min(1, delta * 15));
    }
  });

  const currentDisplayAngle = animatedAngleRef.current;
  const incidentAngleRad = degToRad(currentDisplayAngle);

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
      const baseRefract = physics.refractionAngle!;
      const wlFactor = (wl.wavelength - 550) / 100;
      const refractAngle = baseRefract + wlFactor * 0.025;
      const dirX = Math.sin(refractAngle);
      const dirY = -Math.cos(refractAngle);
      const distance = 5;
      const spacing = 0.03;
      const offset = (i - 3) * spacing;
      return {
        color: wl.color,
        start: [ix + offset * Math.sin(incidentAngleRad), iy - offset * Math.cos(incidentAngleRad), 0.01] as [number, number, number],
        end: [ix + dirX * distance + offset * Math.sin(refractAngle), iy + dirY * distance - offset * Math.cos(refractAngle), 0.01] as [number, number, number],
      };
    });
  }, [dispersionMode, physics, incidentPoint, incidentAngleRad]);

  const getIntersection = useCallback(
    (clientX: number, clientY: number): THREE.Vector3 | null => {
      const canvas = gl.domElement;
      const rect = canvas.getBoundingClientRect();
      mouse.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.current.setFromCamera(mouse.current, camera);
      const intersection = new THREE.Vector3();
      const result = raycaster.current.ray.intersectPlane(interfacePlane.current, intersection);
      return result || null;
    },
    [camera, gl]
  );

  const onPointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      setIsDragging(true);
      const canvas = gl.domElement;
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = 'crosshair';
    },
    [gl]
  );

  const onPointerMoveCanvas = useCallback(
    (e: PointerEvent) => {
      if (!isDragging) return;
      const intersection = getIntersection(e.clientX, e.clientY);
      if (!intersection) return;
      const dx = intersection.x;
      const dy = intersection.y - BOUNDS.interfaceY;
      if (dy <= 0.2) return;
      let angle = Math.atan2(dx, dy);
      const maxAngle = Math.PI / 2 - 0.08;
      angle = Math.max(-maxAngle, Math.min(maxAngle, angle));
      const degree = radToDeg(angle);
      animatedAngleRef.current = degree;
      targetAngleRef.current = degree;
      animProgressRef.current = 1;
      onAngleChange(degree);
      if (lightSourceRef.current) {
        const distance = 3;
        const x = -distance * Math.sin(angle);
        const y = BOUNDS.interfaceY + distance * Math.cos(angle);
        lightSourceRef.current.position.set(x, y, 0);
      }
    },
    [isDragging, getIntersection, onAngleChange, gl]
  );

  const onPointerUpCanvas = useCallback(
    (e: PointerEvent) => {
      if (isDragging) {
        setIsDragging(false);
        const canvas = gl.domElement;
        try {
          canvas.releasePointerCapture(e.pointerId);
        } catch (_) {}
        canvas.style.cursor = 'default';
      }
    },
    [isDragging, gl]
  );

  React.useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener('pointermove', onPointerMoveCanvas);
    canvas.addEventListener('pointerup', onPointerUpCanvas);
    canvas.addEventListener('pointercancel', onPointerUpCanvas);
    return () => {
      canvas.removeEventListener('pointermove', onPointerMoveCanvas);
      canvas.removeEventListener('pointerup', onPointerUpCanvas);
      canvas.removeEventListener('pointercancel', onPointerUpCanvas);
    };
  }, [onPointerMoveCanvas, onPointerUpCanvas, gl]);

  const medium1Color = preset.medium1 === 'air' ? '#4A90D9' : medium1.color;
  const medium2Color = preset.medium2 === 'water' ? '#2C3E50' : medium2.color;

  const { progress: mtProgress, fromMedium, toMedium } = mediumTransitionRef.current;
  const iconOpacityIn = mtProgress;
  const iconOpacityOut = 1 - mtProgress;

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

      {mtProgress < 1 && fromMedium === 'water' && (
        <group position={[3.5, -1.5, 0]}>
          <mesh>
            <sphereGeometry args={[0.5, 32, 32]} />
            <meshBasicMaterial color="#63B3ED" transparent opacity={0.4 * iconOpacityOut} />
          </mesh>
          <Html position={[0, 0.8, 0]} center style={{ pointerEvents: 'none' }}>
            <div style={{ opacity: iconOpacityOut, transition: 'opacity 0.3s', fontSize: 24 }}>💧</div>
          </Html>
        </group>
      )}
      {mtProgress < 1 && fromMedium === 'glass' && (
        <group position={[3.5, -1.5, 0]}>
          <mesh>
            <boxGeometry args={[0.9, 0.9, 0.9]} />
            <meshBasicMaterial color="#A0AEC0" transparent opacity={0.4 * iconOpacityOut} />
          </mesh>
          <Html position={[0, 0.8, 0]} center style={{ pointerEvents: 'none' }}>
            <div style={{ opacity: iconOpacityOut, transition: 'opacity 0.3s', fontSize: 24 }}>🪟</div>
          </Html>
        </group>
      )}

      {toMedium === 'water' && (
        <group position={[3.5, -1.5, 0]}>
          <mesh>
            <sphereGeometry args={[0.5, 32, 32]} />
            <meshBasicMaterial color="#63B3ED" transparent opacity={0.4 * iconOpacityIn} />
          </mesh>
          <Html position={[0, 0.8, 0]} center style={{ pointerEvents: 'none' }}>
            <div style={{ opacity: iconOpacityIn, transition: 'opacity 0.3s', fontSize: 24 }}>💧</div>
          </Html>
        </group>
      )}
      {toMedium === 'glass' && (
        <group position={[3.5, -1.5, 0]}>
          <mesh>
            <boxGeometry args={[0.9, 0.9, 0.9]} />
            <meshBasicMaterial color="#A0AEC0" transparent opacity={0.4 * iconOpacityIn} />
          </mesh>
          <Html position={[0, 0.8, 0]} center style={{ pointerEvents: 'none' }}>
            <div style={{ opacity: iconOpacityIn, transition: 'opacity 0.3s', fontSize: 24 }}>🪟</div>
          </Html>
        </group>
      )}
      {toMedium === 'diamond' && (
        <group position={[3.5, -1.5, 0]}>
          <mesh>
            <octahedronGeometry args={[0.5, 0]} />
            <meshBasicMaterial color="#E2E8F0" transparent opacity={0.5 * iconOpacityIn} />
          </mesh>
          <Html position={[0, 0.8, 0]} center style={{ pointerEvents: 'none' }}>
            <div style={{ opacity: iconOpacityIn, transition: 'opacity 0.3s', fontSize: 24 }}>💎</div>
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
        opacity={0.95}
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
        color={dispersionMode ? '#FFFFFF' : '#ffffff'}
        lineWidth={dispersionMode ? 3 : 2}
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
          lineWidth={2.5}
          transparent
          opacity={1}
        />
      )}

      {dispersionRays.map((ray, i) => (
        <Line
          key={i}
          points={[ray.start, ray.end]}
          color={ray.color}
          lineWidth={1.8}
          transparent
          opacity={0.98}
        />
      ))}

      {physics.isTotalReflection && (
        <Html position={[incidentPoint[0], incidentPoint[1] + 0.6, 0]} center zIndexRange={[100, 0]}>
          <div
            style={{
              color: '#FFD700',
              fontFamily: 'Courier New',
              fontSize: 20,
              fontWeight: 'bold',
              textShadow: '0 0 8px rgba(255, 215, 0, 0.9), 0 0 16px rgba(255, 100, 0, 0.6)',
              animation: 'flash 0.5s ease-in-out infinite',
              whiteSpace: 'nowrap',
              padding: '6px 14px',
              background: 'rgba(0,0,0,0.4)',
              borderRadius: 8,
              border: '1px solid rgba(255, 215, 0, 0.5)',
            }}
          >
            ⚠ 全反射 ⚠
          </div>
        </Html>
      )}

      <group
        ref={lightSourceRef}
        onPointerDown={onPointerDown}
        style={{ cursor: isDragging ? 'crosshair' : 'grab' }}
      >
        <mesh>
          <circleGeometry args={[0.15, 48]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, 0, -0.01]}>
          <circleGeometry args={[0.3, 48]} />
          <meshBasicMaterial color="#FEF3C7" transparent opacity={0.5} />
        </mesh>
        <mesh position={[0, 0, -0.02]}>
          <circleGeometry args={[0.45, 48]} />
          <meshBasicMaterial color="#FDE68A" transparent opacity={0.25} />
        </mesh>
        <mesh position={[0, 0, -0.03]}>
          <circleGeometry args={[0.6, 48]} />
          <meshBasicMaterial color="#F59E0B" transparent opacity={0.1} />
        </mesh>
      </group>

      <Html
        position={[(lightSourcePos[0] + incidentPoint[0]) / 2, (lightSourcePos[1] + incidentPoint[1]) / 2 + 0.35, 0]}
        center
        style={{ pointerEvents: 'none' }}
      >
        <div
          style={{
            color: '#E0E0E0',
            fontFamily: 'Courier New',
            fontSize: 14,
            textShadow: '1px 1px 3px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.5)',
            whiteSpace: 'nowrap',
          }}
        >
          θ₁={currentDisplayAngle.toFixed(1)}°
        </div>
      </Html>

      <Html
        position={[(incidentPoint[0] + reflectedEnd[0]) / 2, (incidentPoint[1] + reflectedEnd[1]) / 2 + 0.35, 0]}
        center
        style={{ pointerEvents: 'none' }}
      >
        <div
          style={{
            color: '#60A5FA',
            fontFamily: 'Courier New',
            fontSize: 14,
            textShadow: '1px 1px 3px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.5)',
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
              (incidentPoint[1] + refractedEnd![1]) / 2 - 0.4,
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
              textShadow: '1px 1px 3px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.5)',
              whiteSpace: 'nowrap',
            }}
          >
            θ₂={radToDeg(physics.refractionAngle).toFixed(1)}°
          </div>
        </Html>
      )}

      {dispersionMode && !physics.isTotalReflection && physics.refractionAngle !== null && (
        <Html
          position={
            [
              incidentPoint[0],
              incidentPoint[1] - 1.5,
              0,
            ]
          }
          center
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              color: '#C084FC',
              fontFamily: 'Courier New',
              fontSize: 13,
              textShadow: '1px 1px 3px rgba(0,0,0,0.9)',
              whiteSpace: 'nowrap',
            }}
          >
            🌈 色散中...
          </div>
        </Html>
      )}


    </>
  );
}

export default Scene;
