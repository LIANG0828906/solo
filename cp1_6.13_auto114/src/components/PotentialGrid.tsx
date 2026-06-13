import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import useSimulationStore from '@/store/useSimulationStore';

const MAX_SOURCES = 100;

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform vec3 sources[${MAX_SOURCES}];
  uniform int sourceCount;
  varying vec2 vUv;

  void main() {
    float x = (vUv.x - 0.5) * 40.0;
    float z = (vUv.y - 0.5) * 40.0;
    float potential = 0.0;
    float softening = 0.01;

    for (int i = 0; i < ${MAX_SOURCES}; i++) {
      if (i >= sourceCount) break;
      float dx = sources[i].x - x;
      float dz = sources[i].y - z;
      float r = sqrt(dx * dx + dz * dz + softening * softening);
      potential += -sources[i].z / r;
    }

    float absP = abs(potential);
    float alpha = clamp(absP * 0.05, 0.0, 0.3);
    vec3 color;
    if (potential < 0.0) {
      color = vec3(0.0, 0.83, 1.0);
    } else {
      color = vec3(1.0, 0.2, 0.0);
    }

    gl_FragColor = vec4(color, alpha);
  }
`;

export default function PotentialGrid() {
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const gravitySources = useSimulationStore((s) => s.gravitySources);
  const showPotentialGrid = useSimulationStore((s) => s.showPotentialGrid);

  useEffect(() => {
    if (!materialRef.current) return;
    const mat = materialRef.current;
    const arr = mat.uniforms.sources.value as THREE.Vector3[];
    for (let i = 0; i < gravitySources.length && i < MAX_SOURCES; i++) {
      arr[i].set(gravitySources[i].position[0], gravitySources[i].position[1], gravitySources[i].mass);
    }
    for (let i = gravitySources.length; i < MAX_SOURCES; i++) {
      arr[i].set(0, 0, 0);
    }
    mat.uniforms.sourceCount.value = gravitySources.length;
    mat.uniforms.sources.needsUpdate = true;
  }, [gravitySources]);

  if (!showPotentialGrid) return null;

  const initialSources: THREE.Vector3[] = [];
  for (let i = 0; i < MAX_SOURCES; i++) {
    initialSources.push(new THREE.Vector3(0, 0, 0));
  }

  return (
    <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[40, 40, 80, 80]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          sources: { value: initialSources },
          sourceCount: { value: 0 },
        }}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
