import { useMemo } from 'react';

interface TreeData {
  position: [number, number, number];
  scale: number;
  foliageColor: string;
  trunkColor: string;
}

const FOLIAGE_COLORS = ['#228B22', '#2E8B57', '#3CB371', '#32CD32', '#006400'];

function generateTrees(): TreeData[] {
  const trees: TreeData[] = [];
  const count = 25;

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 9 + Math.random() * 6;
    const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 3;
    const z = Math.sin(angle) * radius + (Math.random() - 0.5) * 3;
    const scale = 0.2 + Math.random() * 0.6;
    const foliageColor = FOLIAGE_COLORS[Math.floor(Math.random() * FOLIAGE_COLORS.length)];

    trees.push({
      position: [x, 0, z],
      scale,
      foliageColor,
      trunkColor: '#8B4513'
    });
  }

  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const radius = 6;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const scale = 0.3 + Math.random() * 0.4;

    trees.push({
      position: [x, 0, z],
      scale,
      foliageColor: FOLIAGE_COLORS[i % FOLIAGE_COLORS.length],
      trunkColor: '#8B4513'
    });
  }

  return trees;
}

export function Trees() {
  const trees = useMemo(() => generateTrees(), []);

  return (
    <group>
      {trees.map((tree, idx) => (
        <group key={idx} position={tree.position} scale={tree.scale}>
          <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.2, 0.3, 1.2, 6]} />
            <meshStandardMaterial color={tree.trunkColor} flatShading roughness={0.9} />
          </mesh>
          <mesh position={[0, 1.6, 0]} castShadow receiveShadow>
            <sphereGeometry args={[0.9, 8, 6]} />
            <meshStandardMaterial
              color={tree.foliageColor}
              flatShading
              roughness={0.85}
            />
          </mesh>
          <mesh position={[0.3, 1.4, 0.2]} castShadow>
            <sphereGeometry args={[0.6, 8, 6]} />
            <meshStandardMaterial
              color={tree.foliageColor}
              flatShading
              roughness={0.85}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
