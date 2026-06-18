import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '@/store/useStore';

export function Platform() {
  const outerRingRef = useRef<THREE.Mesh>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);
  const isUserInteracting = useStore((state) => state.isUserInteracting);

  const outerRadius = 10;
  const innerRadius = 7;

  const outerGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    hole.absarc(0, 0, outerRadius - 0.1, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    return new THREE.ShapeGeometry(shape);
  }, [outerRadius]);

  const innerGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, innerRadius, 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    hole.absarc(0, 0, innerRadius - 0.08, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    return new THREE.ShapeGeometry(shape);
  }, [innerRadius]);

  const lineMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: 0xD4AF37,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    });
  }, []);

  useFrame((_, delta) => {
    if (!isUserInteracting) {
      if (outerRingRef.current) {
        outerRingRef.current.rotation.z += delta * 0.15;
      }
      if (innerRingRef.current) {
        innerRingRef.current.rotation.z -= delta * 0.12;
      }
    }
  });

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -4.2, 0]}>
      <mesh ref={outerRingRef} geometry={outerGeometry} material={lineMaterial} />
      <mesh ref={innerRingRef} geometry={innerGeometry} material={lineMaterial} />

      <mesh
        geometry={new THREE.RingGeometry(innerRadius * 0.6, innerRadius * 0.62, 64)}
        material={new THREE.MeshBasicMaterial({
          color: 0xD4AF37,
          transparent: true,
          opacity: 0.25,
          side: THREE.DoubleSide,
        })}
      />

      <mesh receiveShadow>
        <circleGeometry args={[innerRadius * 0.55, 64]} />
        <meshStandardMaterial
          color="#1A1614"
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>
    </group>
  );
}
