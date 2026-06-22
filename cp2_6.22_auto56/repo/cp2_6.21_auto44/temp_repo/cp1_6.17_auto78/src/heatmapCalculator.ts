import * as THREE from 'three';
import { GRID_SIZE } from './dataProcessor';

export enum DisplayMode {
  HEATMAP = 'heatmap',
  ROAD = 'road',
  HYBRID = 'hybrid'
}

const vertexShader = `
  attribute float aDensity;
  varying float vDensity;
  varying vec2 vUv;
  varying vec3 vNormal;
  uniform float uGain;
  uniform float uTime;
  uniform float uMaxHeight;

  void main() {
    vDensity = aDensity;
    vUv = uv;
    vNormal = normal;

    float h = aDensity * uGain * uMaxHeight;
    vec3 pos = position;
    pos.y += h;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = `
  varying float vDensity;
  varying vec2 vUv;
  varying vec3 vNormal;
  uniform float uGain;
  uniform float uTime;
  uniform int uDisplayMode;
  uniform float uSelected;
  uniform vec3 uSelectColor;
  uniform float uPulsePhase;

  vec3 heatmapColor(float t) {
    t = clamp(t, 0.0, 1.0);
    vec3 c0 = vec3(0.0, 0.0, 1.0);
    vec3 c1 = vec3(0.0, 1.0, 0.0);
    vec3 c2 = vec3(1.0, 1.0, 0.0);
    vec3 c3 = vec3(1.0, 0.0, 0.0);

    float t0 = smoothstep(0.0, 0.333, t);
    float t1 = smoothstep(0.333, 0.666, t);
    float t2 = smoothstep(0.666, 1.0, t);

    vec3 col = mix(c0, c1, t0);
    col = mix(col, c2, t1);
    col = mix(col, c3, t2);
    return col;
  }

  void main() {
    float d = clamp(vDensity * uGain, 0.0, 1.0);
    float alpha = 0.1 + d * 0.7;

    vec3 heatColor = heatmapColor(d);
    vec3 roadColor = vec3(0.102, 0.102, 0.227);

    vec3 finalColor;
    float finalAlpha;

    int mode = uDisplayMode;
    if (mode == 0) {
      finalColor = heatColor;
      finalAlpha = alpha;
    } else if (mode == 1) {
      finalColor = roadColor;
      finalAlpha = mix(0.2, 0.85, step(0.05, vDensity));
    } else {
      float roadMask = step(0.05, vDensity);
      finalColor = mix(roadColor, heatColor, 0.7 * roadMask);
      finalAlpha = mix(0.15, 0.9, roadMask * (0.4 + d * 0.6));
    }

    if (uSelected > 0.5) {
      float pulse = 0.6 + 0.4 * sin(uPulsePhase);
      finalColor = mix(finalColor, uSelectColor, pulse * 0.7);
      finalAlpha = max(finalAlpha, 0.95);
      float glow = 0.5 + 0.5 * sin(uPulsePhase);
      finalColor += uSelectColor * glow * 0.5;
    }

    vec3 lightDir = normalize(vec3(0.5, 0.8, 0.5));
    float diff = max(dot(normalize(vNormal), lightDir), 0.0);
    finalColor = finalColor * (0.55 + 0.45 * diff);

    gl_FragColor = vec4(finalColor, finalAlpha);
  }
`;

const roadVertexShader = `
  varying vec3 vColor;
  uniform float uOpacity;
  uniform float uAppear;

  void main() {
    vColor = vec3(1.0, 1.0, 1.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const roadFragmentShader = `
  varying vec3 vColor;
  uniform float uOpacity;
  uniform float uAppear;

  void main() {
    float a = 0.2 + uOpacity * 0.4;
    a = mix(0.0, a, uAppear);
    gl_FragColor = vec4(vColor, a);
  }
`;

export interface HeatmapMeshResult {
  mesh: THREE.InstancedMesh;
  material: THREE.ShaderMaterial;
  updateDensities: (densities: Float32Array) => void;
  setGain: (gain: number) => void;
  setDisplayMode: (mode: DisplayMode) => void;
  setSelectedCell: (x: number | null, z: number | null) => void;
  getCellFromInstance: (instanceId: number) => { x: number; z: number };
  getDensityAt: (x: number, z: number) => number;
}

export function createHeatmapMesh(
  initialDensities: Float32Array,
  gridSize: number = GRID_SIZE,
  cellSize: number = 1.0
): HeatmapMeshResult {
  const instanceCount = gridSize * gridSize;
  const halfSize = (gridSize * cellSize) / 2;

  const geo = new THREE.PlaneGeometry(cellSize * 0.95, cellSize * 0.95, 1, 1);
  geo.rotateX(-Math.PI / 2);

  const densityAttr = new Float32Array(instanceCount);
  for (let i = 0; i < instanceCount; i++) {
    densityAttr[i] = initialDensities[i];
  }
  geo.setAttribute('aDensity', new THREE.InstancedBufferAttribute(densityAttr, 1));

  const mat = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    uniforms: {
      uGain: { value: 1.0 },
      uTime: { value: 0 },
      uMaxHeight: { value: 2.0 },
      uDisplayMode: { value: 0 },
      uSelected: { value: -1.0 },
      uSelectColor: { value: new THREE.Color(1, 1, 1) },
      uPulsePhase: { value: 0 }
    }
  });

  const mesh = new THREE.InstancedMesh(geo, mat, instanceCount);
  const dummy = new THREE.Object3D();

  for (let z = 0; z < gridSize; z++) {
    for (let x = 0; x < gridSize; x++) {
      const idx = z * gridSize + x;
      dummy.position.set(
        x * cellSize - halfSize + cellSize / 2,
        0.01,
        z * cellSize - halfSize + cellSize / 2
      );
      dummy.updateMatrix();
      mesh.setMatrixAt(idx, dummy.matrix);
    }
  }
  mesh.instanceMatrix.needsUpdate = true;

  let currentDensities = new Float32Array(densityAttr);
  let selectedX: number | null = null;
  let selectedZ: number | null = null;

  return {
    mesh,
    material: mat,
    updateDensities(densities: Float32Array) {
      const attr = mesh.geometry.getAttribute('aDensity') as THREE.InstancedBufferAttribute;
      const arr = attr.array as Float32Array;
      for (let i = 0; i < densities.length; i++) arr[i] = densities[i];
      attr.needsUpdate = true;
      currentDensities = new Float32Array(densities);
    },
    setGain(gain: number) {
      mat.uniforms.uGain.value = gain;
    },
    setDisplayMode(mode: DisplayMode) {
      const v = mode === DisplayMode.HEATMAP ? 0 : mode === DisplayMode.ROAD ? 1 : 2;
      mat.uniforms.uDisplayMode.value = v;
    },
    setSelectedCell(x: number | null, z: number | null) {
      selectedX = x;
      selectedZ = z;
      if (x === null || z === null) {
        mat.uniforms.uSelected.value = -1.0;
      } else {
        mat.uniforms.uSelected.value = z * gridSize + x;
      }
    },
    getCellFromInstance(instanceId: number) {
      return {
        x: instanceId % gridSize,
        z: Math.floor(instanceId / gridSize)
      };
    },
    getDensityAt(x: number, z: number) {
      return currentDensities[z * gridSize + x] || 0;
    }
  };
}

export function createRoadSkeletonLines(
  skeletons: Array<{ startX: number; startZ: number; endX: number; endZ: number }>,
  gridSize: number = GRID_SIZE,
  cellSize: number = 1.0
): { group: THREE.Group; material: THREE.ShaderMaterial; setAppear: (t: number) => void } {
  const group = new THREE.Group();
  const halfSize = (gridSize * cellSize) / 2;

  const mat = new THREE.ShaderMaterial({
    vertexShader: roadVertexShader,
    fragmentShader: roadFragmentShader,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uOpacity: { value: 0.6 },
      uAppear: { value: 0.0 }
    }
  });

  for (const s of skeletons) {
    const points = [
      new THREE.Vector3(s.startX * cellSize - halfSize + cellSize / 2, 0.02, s.startZ * cellSize - halfSize + cellSize / 2),
      new THREE.Vector3(s.endX * cellSize - halfSize + cellSize / 2, 0.02, s.endZ * cellSize - halfSize + cellSize / 2)
    ];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geo, mat);
    group.add(line);
  }

  return {
    group,
    material: mat,
    setAppear(t: number) {
      mat.uniforms.uAppear.value = t;
    }
  };
}

export function createBaseGrid(gridSize: number = GRID_SIZE, cellSize: number = 1.0): THREE.Mesh {
  const size = gridSize * cellSize;
  const geo = new THREE.PlaneGeometry(size, size, gridSize, gridSize);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x1a1a3a,
    transparent: true,
    opacity: 0.9,
    roughness: 0.8,
    metalness: 0.1
  });
  return new THREE.Mesh(geo, mat);
}
