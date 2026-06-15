import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface CargoInfo {
  type: 'persian-silk' | 'tea' | 'porcelain';
  color: string;
  name: string;
  description: string;
}

export interface CamelData {
  id: number;
  cargo: CargoInfo;
  initialOffset: number;
}

interface CaravanProps {
  count?: number;
  onCamelDoubleClick: (cargo: CargoInfo) => void;
  onCamelHover: (cargo: CargoInfo | null) => void;
}

const camelGeometries = {
  body: new THREE.CylinderGeometry(0.4, 0.5, 1.2, 8),
  hump: new THREE.SphereGeometry(0.35, 8, 8),
  head: new THREE.SphereGeometry(0.25, 8, 8),
  neck: new THREE.CylinderGeometry(0.15, 0.2, 0.6, 6),
  leg: new THREE.CylinderGeometry(0.1, 0.12, 0.8, 6),
  tail: new THREE.CylinderGeometry(0.05, 0.03, 0.4, 4),
};

const cargoGeometries = {
  silk: new THREE.BoxGeometry(0.5, 0.35, 0.4),
  tea: new THREE.BoxGeometry(0.45, 0.4, 0.45),
  porcelain: new THREE.BoxGeometry(0.4, 0.35, 0.4),
};

const cargoList: CargoInfo[] = [
  { type: 'persian-silk', color: '#c41e3a', name: '波斯锦', description: '来自波斯的精美丝绸，色彩艳丽，质地柔软，是丝绸之路上最珍贵的商品之一。' },
  { type: 'tea', color: '#2e7d32', name: '茶叶', description: '产自中原的优质茶叶，经发酵制成，深受西域各民族喜爱。' },
  { type: 'porcelain', color: '#1565c0', name: '瓷器', description: '景德镇出产的精美瓷器，洁白如玉，是中华文化的瑰宝。' },
  { type: 'persian-silk', color: '#c41e3a', name: '波斯锦', description: '来自波斯的精美丝绸，色彩艳丽，质地柔软，是丝绸之路上最珍贵的商品之一。' },
  { type: 'tea', color: '#2e7d32', name: '茶叶', description: '产自中原的优质茶叶，经发酵制成，深受西域各民族喜爱。' },
  { type: 'porcelain', color: '#1565c0', name: '瓷器', description: '景德镇出产的精美瓷器，洁白如玉，是中华文化的瑰宝。' },
  { type: 'persian-silk', color: '#c41e3a', name: '波斯锦', description: '来自波斯的精美丝绸，色彩艳丽，质地柔软，是丝绸之路上最珍贵的商品之一。' },
];

const camelMaterials = {
  body: new THREE.MeshStandardMaterial({ color: '#a67c52', roughness: 0.8 }),
  fur: new THREE.MeshStandardMaterial({ color: '#8b6914', roughness: 0.9 }),
};

function createCargoMaterial(color: string): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.1 });
}

export function Caravan({ count = 6, onCamelDoubleClick, onCamelHover }: CaravanProps) {
  const groupRef = useRef<THREE.Group>(null);
  const camelRefs = useRef<(THREE.Group | null)[]>([]);

  const camels: CamelData[] = useMemo(() => {
    return Array.from({ length: Math.min(count, 7) }, (_, i) => ({
      id: i,
      cargo: cargoList[i % cargoList.length],
      initialOffset: i * -3.5,
    }));
  }, [count]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const time = state.clock.elapsedTime;
    const walkSpeed = 0.8;

    camelRefs.current.forEach((camel, index) => {
      if (!camel) return;

      const data = camels[index];
      const phase = time * 2 + data.initialOffset * 0.3;

      let x = data.initialOffset + time * walkSpeed;
      const boundary = 50;
      if (x > boundary) {
        x = -boundary + (x - boundary);
      }

      const bobY = Math.sin(phase) * 0.08;
      const walkTilt = Math.sin(phase * 2) * 0.03;

      camel.position.set(x, bobY + 1.2, Math.sin(x * 0.1) * 2);
      camel.rotation.y = walkTilt * 0.3;

      const body = camel.children[0] as THREE.Mesh;
      if (body) {
        body.rotation.z = Math.sin(phase * 2) * 0.02;
      }

      const hump = camel.children[1] as THREE.Mesh;
      if (hump) {
        hump.position.y = 0.9 + Math.sin(phase * 2) * 0.05;
      }

      const head = camel.children[3] as THREE.Mesh;
      if (head) {
        head.rotation.x = Math.sin(phase * 1.5) * 0.1 - 0.2;
      }

      const cargo = camel.children[7] as THREE.Mesh;
      if (cargo) {
        cargo.rotation.z = Math.sin(phase * 2) * 0.08;
        cargo.rotation.x = Math.cos(phase * 1.5) * 0.05;
        cargo.position.y = 1.4 + Math.sin(phase * 2) * 0.03;
      }

      for (let i = 0; i < 4; i++) {
        const leg = camel.children[4 + i] as THREE.Mesh;
        if (leg) {
          const legPhase = phase + (i % 2 === 0 ? 0 : Math.PI);
          leg.rotation.x = Math.sin(legPhase * 2) * 0.4;
        }
      }
    });
  });

  return (
    <group ref={groupRef}>
      {camels.map((camelData, index) => {
        const cargoMaterial = createCargoMaterial(camelData.cargo.color);
        const cargoGeo =
          camelData.cargo.type === 'persian-silk'
            ? cargoGeometries.silk
            : camelData.cargo.type === 'tea'
            ? cargoGeometries.tea
            : cargoGeometries.porcelain;

        return (
          <group
            key={camelData.id}
            ref={(el) => {
              camelRefs.current[index] = el;
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              onCamelDoubleClick(camelData.cargo);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              onCamelHover(camelData.cargo);
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              onCamelHover(null);
              document.body.style.cursor = 'auto';
            }}
          >
            <mesh geometry={camelGeometries.body} material={camelMaterials.body} position={[0, 0.6, 0]} castShadow />
            <mesh geometry={camelGeometries.hump} material={camelMaterials.fur} position={[0, 0.9, 0]} castShadow />
            <mesh geometry={camelGeometries.neck} material={camelMaterials.body} position={[0.5, 1, 0]} rotation={[0, 0, 0.6]} castShadow />
            <mesh geometry={camelGeometries.head} material={camelMaterials.fur} position={[0.75, 1.25, 0]} castShadow />
            <mesh geometry={camelGeometries.leg} material={camelMaterials.body} position={[-0.25, 0.1, 0.25]} castShadow />
            <mesh geometry={camelGeometries.leg} material={camelMaterials.body} position={[0.25, 0.1, 0.25]} castShadow />
            <mesh geometry={camelGeometries.leg} material={camelMaterials.body} position={[-0.25, 0.1, -0.25]} castShadow />
            <mesh geometry={camelGeometries.leg} material={camelMaterials.body} position={[0.25, 0.1, -0.25]} castShadow />
            <mesh geometry={cargoGeo} material={cargoMaterial} position={[0, 1.4, 0]} castShadow />
            <mesh geometry={camelGeometries.tail} material={camelMaterials.fur} position={[-0.5, 0.5, 0]} rotation={[0, 0, -0.3]} castShadow />
          </group>
        );
      })}
    </group>
  );
}
