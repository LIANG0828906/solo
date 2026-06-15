import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { LightThread as LightThreadType } from '../types';
import { useLoomStore } from '../store/useLoomStore';
import { useAudio } from '../hooks/useAudio';
import { hexToRgb } from '../utils/colorUtils';

interface LightThreadProps {
  thread: LightThreadType;
  startPosition: [number, number, number];
  endPosition: [number, number, number];
}

export function LightThread({ thread, startPosition, endPosition }: LightThreadProps) {
  const lineRef = useRef<THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>>(null);
  const glowRef = useRef<THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>>(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const { playSoundByLength } = useAudio();

  const threadWidth = useLoomStore((state) => state.threadWidth);
  const pulseSpeed = useLoomStore((state) => state.pulseSpeed);
  const highlightedThreadId = useLoomStore((state) => state.highlightedThreadId);
  const addLog = useLoomStore((state) => state.addLog);

  const isHighlighted = highlightedThreadId === thread.id;

  const { geometry, glowGeometry } = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const start = new THREE.Vector3(...startPosition);
    const end = new THREE.Vector3(...endPosition);
    const mid = start.clone().add(end).multiplyScalar(0.5);

    const direction = end.clone().sub(start).normalize();
    const perpendicular = new THREE.Vector3(
      -direction.y,
      direction.x,
      0
    ).normalize();

    const control = mid.clone().add(perpendicular.multiplyScalar(0.5));

    const curve = new THREE.QuadraticBezierCurve3(start, control, end);
    const curvePoints = curve.getPoints(50);
    points.push(...curvePoints);

    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const glowGeo = new THREE.BufferGeometry().setFromPoints(points);

    const colors: number[] = [];
    const startColor = hexToRgb(thread.startColor);
    const endColor = hexToRgb(thread.endColor);

    for (let i = 0; i < points.length; i++) {
      const t = i / (points.length - 1);
      colors.push(
        startColor[0] + (endColor[0] - startColor[0]) * t,
        startColor[1] + (endColor[1] - startColor[1]) * t,
        startColor[2] + (endColor[2] - startColor[2]) * t
      );
    }

    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    glowGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    return { geometry: geo, glowGeometry: glowGeo };
  }, [startPosition, endPosition, thread.startColor, thread.endColor]);

  useEffect(() => {
    return () => {
      geometry.dispose();
      glowGeometry.dispose();
    };
  }, [geometry, glowGeometry]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const pulse = 0.6 + 0.4 * Math.sin(time * pulseSpeed);

    if (lineRef.current) {
      const material = lineRef.current.material as THREE.LineBasicMaterial;
      material.opacity = isFlashing ? 1 : pulse * (isHighlighted ? 1 : 0.8);
      material.linewidth = threadWidth * (isFlashing ? 2 : 1);
    }

    if (glowRef.current) {
      const material = glowRef.current.material as THREE.LineBasicMaterial;
      material.opacity = (isFlashing ? 0.8 : 0.3) * pulse;
    }
  });

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    setIsFlashing(true);
    playSoundByLength(thread.length, thread.startColor);

    const points = useLoomStore.getState().points;
    const startIndex = points.findIndex((p) => p.id === thread.startPointId);
    const endIndex = points.findIndex((p) => p.id === thread.endPointId);

    addLog({
      type: 'play_sound',
      message: `点击光线${startIndex + 1}-${endIndex + 1}，播放音效`,
      threadId: thread.id,
    });

    setTimeout(() => setIsFlashing(false), 300);
  };

  const LineComponent = THREE.Line as unknown as React.FC<{
    ref?: React.Ref<THREE.Line>;
    geometry: THREE.BufferGeometry;
    onClick?: (e: { stopPropagation: () => void }) => void;
    children: React.ReactNode;
  }>;

  return (
    <group>
      <LineComponent
        ref={glowRef}
        geometry={glowGeometry}
        onClick={handleClick}
      >
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={0.3}
          linewidth={threadWidth * 3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </LineComponent>
      <LineComponent
        ref={lineRef}
        geometry={geometry}
        onClick={handleClick}
      >
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={0.8}
          linewidth={threadWidth}
          blending={THREE.AdditiveBlending}
        />
      </LineComponent>
    </group>
  );
}
