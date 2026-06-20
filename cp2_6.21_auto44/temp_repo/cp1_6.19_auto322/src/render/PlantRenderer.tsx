import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { PlantInstance } from '../core/types';
import { lerpColor } from '../core/envParams';

interface PlantRendererProps {
  plant: PlantInstance;
  selected: boolean;
  breeding: boolean;
  onClick: () => void;
}

function lerpVec(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

const SPRING = 8;

export function PlantRenderer({
  plant,
  selected,
  breeding,
  onClick,
}: PlantRendererProps) {
  const groupRef = useRef<THREE.Group>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const pointLightRef = useRef<THREE.PointLight>(null);
  const animState = useRef<Map<string, { pos: THREE.Vector3; scale: THREE.Vector3 }>>(
    new Map()
  );

  const { state, tagColor, tagLabel } = plant;
  const { stems, leaves, flowers, fruits, phenotype, haloPulse, currentHeight } = state;

  const haloColor = breeding ? '#FFD54F' : selected ? '#64B5F6' : '#000000';

  const stemColor = useMemo(() => {
    const base = phenotype.stemWrinkling > 0.5
      ? lerpColor('#6D4C41', '#4E342E', phenotype.stemWrinkling)
      : '#6D4C41';
    return base;
  }, [phenotype.stemWrinkling]);

  useFrame((_, deltaRaw) => {
    const delta = Math.min(0.05, deltaRaw);
    const t = 1 - Math.exp(-SPRING * delta);

    if (groupRef.current) {
      groupRef.current.traverse((obj) => {
        if (obj.userData.targetPosition) {
          obj.position.lerp(obj.userData.targetPosition, t);
        }
        if (obj.userData.targetScale) {
          if (!obj.userData.currentScale) {
            obj.userData.currentScale = new THREE.Vector3().copy(obj.scale);
          }
          obj.userData.currentScale.lerp(obj.userData.targetScale, t);
          obj.scale.copy(obj.userData.currentScale);
        }
      });
    }

    if (haloRef.current) {
      const haloMat = haloRef.current.material as THREE.MeshBasicMaterial;
      const target =
        selected || breeding ? 0.35 + (haloPulse > 0 ? 0.2 : 0) : 0;
      haloMat.opacity = lerpVec(haloMat.opacity, target, t);
      const s = 1.5 + (haloPulse > 0 ? haloPulse : 0);
      haloRef.current.scale.lerp(new THREE.Vector3(s, 1, s), t);
    }

    if (pointLightRef.current) {
      const targetIntensity = haloPulse > 0 ? 4 * haloPulse * 2 : 0;
      pointLightRef.current.intensity = lerpVec(
        pointLightRef.current.intensity,
        targetIntensity,
        t
      );
    }
  });

  const leafOpacity = 1 - phenotype.leafTranslucency * 0.5;

  return (
    <group
      ref={groupRef}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <mesh
        ref={haloRef}
        position={[0, 0.02, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.9, 1.2, 48]} />
        <meshBasicMaterial
          color={haloColor}
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      <pointLight
        ref={pointLightRef}
        position={[0, Math.max(0.5, currentHeight), 0]}
        color="#FFEB3B"
        intensity={0}
        distance={6}
        decay={2}
      />

      {stems.map((stem, idx) => (
        <mesh
          key={`stem-${idx}`}
          position={[0, stem.yOffset + stem.length / 2, 0]}
          userData={{
            targetPosition: new THREE.Vector3(0, stem.yOffset + stem.length / 2, 0),
            targetScale: new THREE.Vector3(1, 1, 1),
          }}
        >
          <cylinderGeometry
            args={[stem.radius * 0.7, stem.radius, stem.length, 6]}
          />
          <meshStandardMaterial color={stemColor} roughness={0.7 + phenotype.stemWrinkling * 0.2} />
        </mesh>
      ))}

      {leaves.map((leaf) => {
        const color = phenotype.leafColorTint;
        const curl = phenotype.leafCurlAmount;
        return (
          <mesh
            key={leaf.id}
            position={leaf.position}
            rotation={[
              leaf.rotation[0] - curl * 0.6,
              leaf.rotation[1],
              leaf.rotation[2] + (Math.random() - 0.5) * phenotype.stemWrinkling * 0.2,
            ]}
            scale={leaf.scale}
            userData={{
              targetPosition: new THREE.Vector3(...leaf.position),
              targetScale: new THREE.Vector3(...leaf.scale),
            }}
          >
            <planeGeometry args={[1.2, 0.8, 2, 2]} />
            <meshStandardMaterial
              color={color}
              side={THREE.DoubleSide}
              transparent
              opacity={leafOpacity}
              roughness={0.6}
            />
            {phenotype.leafBurnEdge || phenotype.leafEdgeColor !== 'transparent' ? (
              <mesh
                position={[0, 0, 0.001]}
                rotation={[0, 0, 0]}
                scale={[1.02, 1.02, 1]}
              >
                <ringGeometry args={[0.42, 0.6, 24]} />
                <meshBasicMaterial
                  color={phenotype.leafBurnEdge ? '#BF360C' : phenotype.leafEdgeColor}
                  transparent
                  opacity={0.7}
                  side={THREE.DoubleSide}
                  depthWrite={false}
                />
              </mesh>
            ) : null}
          </mesh>
        );
      })}

      {flowers.map((flower) => (
        <group
          key={flower.id}
          position={flower.position}
          userData={{
            targetPosition: new THREE.Vector3(...flower.position),
            targetScale: new THREE.Vector3(1, 1, 1),
          }}
        >
          {[0, 1, 2, 3, 4].map((p) => {
            const angle = (p / 5) * Math.PI * 2;
            const r = flower.scale * 0.8;
            return (
              <mesh
                key={p}
                position={[
                  Math.cos(angle) * r * 0.6,
                  Math.sin(angle) * r * 0.3,
                  Math.sin(angle) * r * 0.6,
                ]}
                rotation={[Math.PI / 2, angle, 0]}
                scale={[r, 1, r * 0.7]}
              >
                <sphereGeometry args={[0.3, 8, 6]} />
                <meshStandardMaterial
                  color={flower.color}
                  transparent
                  opacity={0.9 * flower.bloom}
                  emissive={flower.color}
                  emissiveIntensity={0.08 * flower.bloom}
                />
              </mesh>
            );
          })}
          <mesh>
            <sphereGeometry args={[flower.scale * 0.25, 10, 8]} />
            <meshStandardMaterial color="#FFD54F" emissive="#FFA000" emissiveIntensity={0.2} />
          </mesh>
        </group>
      ))}

      {fruits.map((fruit) => (
        <mesh
          key={fruit.id}
          position={fruit.position}
          scale={[fruit.scale, fruit.scale, fruit.scale]}
          userData={{
            targetPosition: new THREE.Vector3(...fruit.position),
            targetScale: new THREE.Vector3(fruit.scale, fruit.scale, fruit.scale),
          }}
        >
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color={fruit.color}
            roughness={0.4 - (1 - phenotype.leafTranslucency) * 0.1}
            metalness={0.1}
          />
        </mesh>
      ))}

      <group position={[0, currentHeight + 0.4, 0]}>
        <mesh>
          <cylinderGeometry args={[0.04, 0.04, 0.6, 6]} />
          <meshBasicMaterial color={tagColor} />
        </mesh>
        <mesh position={[0, 0.35, 0]}>
          <sphereGeometry args={[0.14, 12, 10]} />
          <meshBasicMaterial color={tagColor} />
        </mesh>
        <mesh position={[0, 0.35, 0.141]}>
          <planeGeometry args={[0.2, 0.16]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.95} />
        </mesh>
      </group>
    </group>
  );
}
