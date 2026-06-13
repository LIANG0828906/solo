import { useMemo } from 'react';
import * as THREE from 'three';
import useSimulationStore from '@/store/useSimulationStore';

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform vec3 sources[20];
  uniform int sourceCount;
  varying vec2 vUv;

  void main() {
    float x = (vUv.x - 0.5) * 40.0;
    float z = (vUv.y - 0.5) * 40.0;
    float potential = 0.0;

    for (int i = 0; i < 20; i++) {
      if (i >= sourceCount) break;
      float dx = sources[i].x - x;
      float dz = sources[i].z - z;
      float r = sqrt(dx * dx + dz * dz);
      r = max(r, 0.3);
      potential += -sources[i].z / r;
    }

    float absP = abs(potential);
    float alpha = clamp(absP * 0.05, 0.0, 0.3);
    vec3 color = mix(vec3(0.0, 0.83, 1.0), vec3(1.0, 0.2, 0.0), step(0.0, -potential) * 0.0 + step(potential, 0.0) * 0.5);
    if (potential < 0.0) {
      color = vec3(0.0, 0.83, 1.0);
    } else {
      color = vec3(1.0, 0.2, 0.0);
    }

    gl_FragColor = vec4(color, alpha);
  }
`;

export default function PotentialGrid() {
  const gravitySources = useSimulationStore((s) => s.gravitySources);
  const showPotentialGrid = useSimulationStore((s) => s.showPotentialGrid);

  const uniforms = useMemo(() => {
    const sourceData: THREE.Vector3[] = [];
    for (const src of gravitySources) {
      sourceData.push(new THREE.Vector3(src.position[0], 0, src.mass));
    }
    while (sourceData.length < 20) {
      sourceData.push(new THREE.Vector3(0, 0, 0));
    }
    return {
      sources: { value: sourceData },
      sourceCount: { value: gravitySources.length },
    };
  }, [gravitySources]);

  if (!showPotentialGrid) return null;

  return (
    <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[40, 40, 80, 80]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
