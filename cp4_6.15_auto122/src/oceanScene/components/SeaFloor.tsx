import { useMemo, useRef } from 'react';
import * as THREE from 'three';

function generateTerrainGeometry(): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(80, 80, 60, 60);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const h =
      Math.sin(x * 0.3) * 1.5 +
      Math.cos(y * 0.25) * 1.2 +
      Math.sin((x + y) * 0.15) * 2.0 +
      (Math.random() - 0.5) * 0.8;
    pos.setZ(i, h);
  }
  geo.computeVertexNormals();
  return geo;
}

function Coral({ position, color }: { position: [number, number, number]; color: string }) {
  const height = 0.8 + Math.random() * 1.5;
  const topRadius = 0.1 + Math.random() * 0.2;
  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[topRadius, 0.3, height, 5]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
      <mesh position={[0, height + topRadius, 0]}>
        <sphereGeometry args={[topRadius + 0.1, 6, 4]} />
        <meshStandardMaterial color={color} flatShading emissive={color} emissiveIntensity={0.15} />
      </mesh>
    </group>
  );
}

function Rock({ position, scale }: { position: [number, number, number]; scale: number }) {
  return (
    <mesh position={position} scale={[scale, scale * 0.6, scale]}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#3a3a3a" flatShading roughness={0.9} />
    </mesh>
  );
}

export default function SeaFloor() {
  const terrain = useMemo(() => generateTerrainGeometry(), []);
  const corals = useMemo(() => {
    const items: { position: [number, number, number]; color: string }[] = [];
    const colors = ['#ff6b6b', '#ffa07a', '#ff8c42', '#e056a0', '#c44dff'];
    for (let i = 0; i < 25; i++) {
      const x = (Math.random() - 0.5) * 50;
      const z = (Math.random() - 0.5) * 50;
      items.push({
        position: [x, -50 + Math.sin(x * 0.3) * 1.5 + Math.cos(z * 0.25) * 1.2, z],
        color: colors[i % colors.length],
      });
    }
    return items;
  }, []);

  const rocks = useMemo(() => {
    const items: { position: [number, number, number]; scale: number }[] = [];
    for (let i = 0; i < 15; i++) {
      const x = (Math.random() - 0.5) * 60;
      const z = (Math.random() - 0.5) * 60;
      items.push({
        position: [x, -49.5 + Math.sin(x * 0.3) * 1.5, z],
        scale: 0.5 + Math.random() * 1.5,
      });
    }
    return items;
  }, []);

  return (
    <group>
      <mesh
        geometry={terrain}
        position={[0, -50, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <meshStandardMaterial
          color="#2a1f0e"
          flatShading
          roughness={1}
          metalness={0}
        />
      </mesh>
      {corals.map((c, i) => (
        <Coral key={`coral-${i}`} position={c.position} color={c.color} />
      ))}
      {rocks.map((r, i) => (
        <Rock key={`rock-${i}`} position={r.position} scale={r.scale} />
      ))}
    </group>
  );
}
