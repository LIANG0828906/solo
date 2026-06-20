import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { WaveData, Hypocenter } from '@/types';
import type { WaveSimulator } from '@/simulation/WaveSimulator';

interface WaveFrontProps {
  waveData: WaveData;
  hypocenter: Hypocenter;
  magnitude: number;
  waveSimulator: WaveSimulator | null;
  currentTime: number;
}

const MAX_RADIUS = 15;

export const WaveFront: React.FC<WaveFrontProps> = ({
  waveData,
  hypocenter,
  magnitude,
  waveSimulator,
  currentTime,
}) => {
  const pWaveRef = useRef<THREE.Mesh>(null);
  const sWaveRef = useRef<THREE.Mesh>(null);
  const pWaveOuterRef = useRef<THREE.Mesh>(null);
  const sWaveOuterRef = useRef<THREE.Mesh>(null);

  const reflectedSphereRefs = useRef<(THREE.Mesh | null)[]>([]);
  const refractedLineObjects = useRef<THREE.Line[]>([]);

  const refractedLineGroupRef = useRef<THREE.Group>(null);

  const magnitudeScale = 1 + (magnitude - 5) * 0.1;

  const fadeOpacity = (radius: number, max: number): number => {
    if (radius <= 0) return 0;
    const ratio = radius / max;
    if (ratio < 0.1) return ratio * 10;
    if (ratio > 0.8) return (1 - ratio) * 5;
    return 0.7;
  };

  useFrame(() => {
    const pScale = Math.min(waveData.pWaveRadius, MAX_RADIUS) * magnitudeScale;
    const sScale = Math.min(waveData.sWaveRadius, MAX_RADIUS) * magnitudeScale;

    const pOpacity = fadeOpacity(waveData.pWaveRadius, MAX_RADIUS);
    const sOpacity = fadeOpacity(waveData.sWaveRadius, MAX_RADIUS);

    if (pWaveRef.current) {
      pWaveRef.current.scale.setScalar(pScale);
      const material = pWaveRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = pOpacity * 0.6;
    }

    if (pWaveOuterRef.current) {
      pWaveOuterRef.current.scale.setScalar(pScale * 1.05);
      const material = pWaveOuterRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = pOpacity * 0.3;
    }

    if (sWaveRef.current) {
      sWaveRef.current.scale.setScalar(sScale);
      const material = sWaveRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = sOpacity * 0.6;
    }

    if (sWaveOuterRef.current) {
      sWaveOuterRef.current.scale.setScalar(sScale * 1.05);
      const material = sWaveOuterRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = sOpacity * 0.3;
    }

    if (waveSimulator) {
      const reflectedWaves = waveSimulator.getReflectedWaveData(currentTime);
      for (let i = 0; i < reflectedSphereRefs.current.length; i++) {
        const mesh = reflectedSphereRefs.current[i];
        if (!mesh) continue;
        if (i < reflectedWaves.length) {
          const rw = reflectedWaves[i];
          mesh.visible = true;
          mesh.position.set(rw.origin[0], rw.origin[1], rw.origin[2]);
          const radius = Math.min(rw.radius, MAX_RADIUS);
          mesh.scale.setScalar(radius * magnitudeScale);
          const mat = mesh.material as THREE.MeshBasicMaterial;
          const opacity = fadeOpacity(rw.radius, MAX_RADIUS);
          mat.opacity = opacity * 0.4;
          mat.color.set(rw.isPWave ? '#42a5f5' : '#66bb6a');
        } else {
          mesh.visible = false;
        }
      }

      const refractedWaves = waveSimulator.getRefractedWaveData(currentTime);
      for (let i = 0; i < refractedLineObjects.current.length; i++) {
        const line = refractedLineObjects.current[i];
        if (!line) continue;
        if (i < refractedWaves.length) {
          const rw = refractedWaves[i];
          line.visible = true;
          const points = [
            new THREE.Vector3(rw.origin[0], rw.origin[1], rw.origin[2]),
            new THREE.Vector3(
              rw.origin[0] + rw.direction[0] * rw.length,
              rw.origin[1] + rw.direction[1] * rw.length,
              rw.origin[2] + rw.direction[2] * rw.length
            ),
          ];
          const geo = line.geometry as THREE.BufferGeometry;
          geo.setFromPoints(points);
          const mat = line.material as THREE.LineBasicMaterial;
          mat.color.set(rw.isPWave ? '#4fc3f7' : '#81c784');
          mat.opacity = 0.8;
        } else {
          line.visible = false;
        }
      }
    }
  });

  const reflectionMarkers = useMemo(() => {
    return waveData.reflections.slice(0, 8).map((reflection, index) => (
      <mesh key={`reflection-${index}`} position={reflection.position}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
      </mesh>
    ));
  }, [waveData.reflections]);

  const refractionMarkers = useMemo(() => {
    return waveData.refractions.slice(0, 8).map((refraction, index) => {
      const dirLen = 0.8;
      return (
        <group key={`refraction-${index}`} position={refraction.position}>
          <mesh>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshBasicMaterial color="#ffeb3b" transparent opacity={0.9} />
          </mesh>
          <mesh
            position={[
              refraction.direction[0] * dirLen * 0.5,
              refraction.direction[1] * dirLen * 0.5,
              refraction.direction[2] * dirLen * 0.5,
            ]}
            rotation={[
              Math.atan2(refraction.direction[0], refraction.direction[1]),
              0,
              Math.atan2(refraction.direction[2], refraction.direction[1]),
            ]}
          >
            <coneGeometry args={[0.06, dirLen, 6]} />
            <meshBasicMaterial color="#ffeb3b" transparent opacity={0.7} />
          </mesh>
        </group>
      );
    });
  }, [waveData.refractions]);

  const reflectedSpheres = useMemo(() => {
    const elements = [];
    for (let i = 0; i < 8; i++) {
      elements.push(
        <mesh
          key={`refl-sphere-${i}`}
          ref={(el) => { reflectedSphereRefs.current[i] = el; }}
          visible={false}
        >
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial
            color="#42a5f5"
            transparent
            opacity={0.3}
            side={2}
            depthWrite={false}
          />
        </mesh>
      );
    }
    return elements;
  }, []);

  const refractedLines = useMemo(() => {
    const objs: THREE.Line[] = [];
    for (let i = 0; i < 8; i++) {
      const geo = new THREE.BufferGeometry();
      const mat = new THREE.LineBasicMaterial({
        color: '#4fc3f7',
        transparent: true,
        opacity: 0.8,
      });
      const line = new THREE.Line(geo, mat);
      line.visible = false;
      objs.push(line);
    }
    refractedLineObjects.current = objs;
    return (
      <group ref={refractedLineGroupRef}>
        {objs.map((obj, i) => (
          <primitive key={`refr-line-${i}`} object={obj} />
        ))}
      </group>
    );
  }, []);

  return (
    <group position={[hypocenter.x, hypocenter.y, hypocenter.z]}>
      <mesh ref={pWaveOuterRef} scale={0}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshBasicMaterial
          color="#42a5f5"
          transparent
          opacity={0}
          side={2}
          depthWrite={false}
        />
      </mesh>

      <mesh ref={pWaveRef} scale={0}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshBasicMaterial
          color="#4fc3f7"
          transparent
          opacity={0}
          side={2}
          depthWrite={false}
        />
      </mesh>

      <mesh ref={sWaveOuterRef} scale={0}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshBasicMaterial
          color="#66bb6a"
          transparent
          opacity={0}
          side={2}
          depthWrite={false}
        />
      </mesh>

      <mesh ref={sWaveRef} scale={0}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshBasicMaterial
          color="#81c784"
          transparent
          opacity={0}
          side={2}
          depthWrite={false}
        />
      </mesh>

      {reflectionMarkers}
      {refractionMarkers}
      {reflectedSpheres}
      {refractedLines}
    </group>
  );
};
