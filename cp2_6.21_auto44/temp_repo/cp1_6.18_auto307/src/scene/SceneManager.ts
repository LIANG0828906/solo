import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { JellyfishAI } from './JellyfishAI';
import { useSceneStore } from '../store/sceneStore';

export const SCENE_BACKGROUND = '#020B1A';
export const FLOOR_COLOR = '#0A1F2E';
export const VOLCANO_COLOR = '#1A3A4A';

interface VolcanoData {
  position: [number, number, number];
  radius: number;
  rotation: [number, number, number];
  bumpScale: number;
}

export class SceneManager {
  private jellyfish: JellyfishAI[] = [];
  private lightTrailPoints: THREE.Vector3[] = [];
  private volcanoData: VolcanoData[] = [];
  private currentGlowColor: string;

  constructor() {
    this.currentGlowColor = useSceneStore.getState().glowColor;
    this.generateVolcanoes();
  }

  generateVolcanoes(): VolcanoData[] {
    const count = 8 + Math.floor(Math.random() * 5);
    this.volcanoData = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 5 + Math.random() * 15;
      this.volcanoData.push({
        position: [
          Math.cos(angle) * radius,
          -8 + 0.01,
          Math.sin(angle) * radius,
        ],
        radius: 1 + Math.random(),
        rotation: [-Math.PI / 2, Math.random() * Math.PI, 0],
        bumpScale: 0.1 + Math.random() * 0.3,
      });
    }
    return this.volcanoData;
  }

  getVolcanoData(): VolcanoData[] {
    return this.volcanoData;
  }

  setJellyfishCount(count: number, color?: string): JellyfishAI[] {
    const targetColor = color || this.currentGlowColor;
    this.currentGlowColor = targetColor;

    while (this.jellyfish.length < count) {
      const jelly = new JellyfishAI(undefined, targetColor);
      this.jellyfish.push(jelly);
    }
    while (this.jellyfish.length > count) {
      this.jellyfish.pop();
    }
    return this.jellyfish;
  }

  updateJellyfishColor(color: string): void {
    this.currentGlowColor = color;
    for (const jelly of this.jellyfish) {
      jelly.setTargetColor(color);
    }
  }

  updateAll(deltaTime: number): void {
    for (const jelly of this.jellyfish) {
      jelly.update(deltaTime, this.jellyfish, this.lightTrailPoints);
    }
  }

  getJellyfish(): JellyfishAI[] {
    return this.jellyfish;
  }

  setLightTrailPoints(points: THREE.Vector3[]): void {
    this.lightTrailPoints = points;
  }

  getLightTrailPoints(): THREE.Vector3[] {
    return this.lightTrailPoints;
  }
}

export const createBumpTexture = (scale: number): THREE.DataTexture => {
  const size = 64;
  const data = new Uint8Array(size * size);
  for (let i = 0; i < size * size; i++) {
    const x = i % size;
    const y = Math.floor(i / size);
    const cx = size / 2;
    const cy = size / 2;
    const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
    const maxDist = size / 2;
    if (dist < maxDist) {
      const normalized = 1 - dist / maxDist;
      const noise = (Math.sin(x * 0.5) * Math.cos(y * 0.5) + 1) * 0.3;
      data[i] = Math.floor((normalized * normalized * 0.7 + noise * 0.3) * 255);
    } else {
      data[i] = 0;
    }
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RedFormat);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
};

interface VolcanoProps {
  data: VolcanoData;
}

export const Volcano: React.FC<VolcanoProps> = ({ data }) => {
  const bumpTexture = useMemo(() => createBumpTexture(data.bumpScale), [data.bumpScale]);

  return (
    <mesh position={data.position} rotation={data.rotation}>
      <circleGeometry args={[data.radius, 32]} />
      <meshStandardMaterial
        color={VOLCANO_COLOR}
        bumpMap={bumpTexture}
        bumpScale={data.bumpScale}
        roughness={0.9}
        metalness={0.1}
      />
    </mesh>
  );
};

export const OceanFloor: React.FC = () => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -8, 0]} receiveShadow>
      <planeGeometry args={[100, 100, 50, 50]} />
      <meshStandardMaterial color={FLOOR_COLOR} roughness={1} metalness={0} />
    </mesh>
  );
};

export const SceneLights: React.FC = () => {
  return (
    <>
      <directionalLight
        color="#FFFFFF"
        position={[5, 10, 5]}
        intensity={1}
        castShadow
      />
      <pointLight color="#00E5FF" position={[0, 5, 0]} intensity={0.8} distance={30} />
      <ambientLight intensity={0.15} />
    </>
  );
};

interface JellyfishMeshProps {
  jellyfish: JellyfishAI;
}

export const JellyfishMesh: React.FC<JellyfishMeshProps> = ({ jellyfish }) => {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const tentacleRefs = useRef<(THREE.Line | null)[]>([]);

  const tentacleGeometries = useMemo(() => {
    return Array.from({ length: 10 }, () => new THREE.BufferGeometry());
  }, []);

  useFrame((_, delta) => {
    const position = jellyfish.getPosition();
    const color = jellyfish.getColor();

    if (groupRef.current) {
      groupRef.current.position.copy(position);
    }

    if (materialRef.current) {
      materialRef.current.color.copy(color);
      materialRef.current.emissive.copy(color);
    }

    const tentacleCurves = jellyfish.getTentacleCurves();
    tentacleCurves.forEach((curve, i) => {
      const points = curve.getPoints(40);
      const positions = new Float32Array(points.length * 3);
      points.forEach((p, idx) => {
        positions[idx * 3] = p.x - position.x;
        positions[idx * 3 + 1] = p.y - position.y;
        positions[idx * 3 + 2] = p.z - position.z;
      });
      if (tentacleRefs.current[i]) {
        const geo = tentacleRefs.current[i]!.geometry;
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.attributes.position.needsUpdate = true;
        geo.computeBoundingSphere();
      }
    });
  });

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          ref={materialRef}
          color="#00BCD4"
          emissive="#00BCD4"
          emissiveIntensity={0.6}
          transparent
          opacity={0.7}
          roughness={0.2}
          metalness={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
      {tentacleGeometries.map((geo, i) => (
        <line
          key={i}
          ref={(el) => {
            tentacleRefs.current[i] = el;
          }}
          geometry={geo}
        >
          <lineBasicMaterial color="#00BCD4" transparent opacity={0.5} />
        </line>
      ))}
    </group>
  );
};

interface SceneContentProps {
  sceneManager: SceneManager;
}

export const SceneContent: React.FC<SceneContentProps> = ({ sceneManager }) => {
  const { density, glowColor, refreshKey } = useSceneStore((state) => ({
    density: state.density,
    glowColor: state.glowColor,
    refreshKey: state.refreshKey,
  }));

  const [jellyfishList, setJellyfishList] = useState<JellyfishAI[]>([]);
  const volcanoData = useMemo(() => sceneManager.getVolcanoData(), [sceneManager, refreshKey]);

  useEffect(() => {
    if (refreshKey > 0) {
      sceneManager.generateVolcanoes();
    }
  }, [refreshKey, sceneManager]);

  useEffect(() => {
    const list = sceneManager.setJellyfishCount(density, glowColor);
    setJellyfishList([...list]);
  }, [density, refreshKey, sceneManager, glowColor]);

  useEffect(() => {
    sceneManager.updateJellyfishColor(glowColor);
  }, [glowColor, sceneManager]);

  useFrame((_, delta) => {
    sceneManager.updateAll(delta);
  });

  return (
    <>
      <SceneLights />
      <OceanFloor />
      {volcanoData.map((v, i) => (
        <Volcano key={`volcano-${refreshKey}-${i}`} data={v} />
      ))}
      {jellyfishList.map((jelly, i) => (
        <JellyfishMesh key={`jelly-${refreshKey}-${i}`} jellyfish={jelly} />
      ))}
    </>
  );
};

export const CameraSetup: React.FC = () => {
  const { camera } = useThree();

  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.position.set(0, 5, 15);
      camera.lookAt(0, 0, 0);
      camera.fov = 60;
      camera.updateProjectionMatrix();
    }
  }, [camera]);

  return null;
};

export const useSceneManager = (): SceneManager => {
  const sceneManagerRef = useRef<SceneManager | null>(null);
  if (!sceneManagerRef.current) {
    sceneManagerRef.current = new SceneManager();
  }
  return sceneManagerRef.current;
};
