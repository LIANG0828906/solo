import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function GalaxyBackground() {
  const groupRef = useRef<THREE.Group>(null);
  const armsRef = useRef<THREE.Points[]>([]);

  const { geometries, materials } = useMemo(() => {
    const armCount = 4;
    const starsPerArm = 2000;
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.PointsMaterial[] = [];

    for (let arm = 0; arm < armCount; arm++) {
      const positions = new Float32Array(starsPerArm * 3);
      const colors = new Float32Array(starsPerArm * 3);
      const sizes = new Float32Array(starsPerArm);

      const armAngle = (arm / armCount) * Math.PI * 2;

      for (let i = 0; i < starsPerArm; i++) {
        const t = i / starsPerArm;
        const radius = t * 120;
        const spiralAngle = t * Math.PI * 3 + armAngle;
        const spread = (1 - t) * 15 + 2;

        const x = Math.cos(spiralAngle) * radius + (Math.random() - 0.5) * spread;
        const y = (Math.random() - 0.5) * 3;
        const z = Math.sin(spiralAngle) * radius + (Math.random() - 0.5) * spread;

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        const brightness = 0.1 + Math.random() * 0.2;
        colors[i * 3] = 0.6 + Math.random() * 0.2;
        colors[i * 3 + 1] = 0.5 + Math.random() * 0.2;
        colors[i * 3 + 2] = 0.8 + Math.random() * 0.2;

        sizes[i] = 0.2 + Math.random() * 0.3;
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

      geometries.push(geometry);

      const material = new THREE.PointsMaterial({
        size: 0.5,
        vertexColors: true,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      materials.push(material);
    }

    return { geometries, materials };
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.01;
    }

    armsRef.current.forEach((points, index) => {
      if (points && points.geometry) {
        const sizeAttr = points.geometry.attributes.size as THREE.BufferAttribute;
        for (let i = 0; i < sizeAttr.count; i++) {
          const originalSize = sizeAttr.array[i];
          const twinkle = 0.9 + Math.sin(state.clock.elapsedTime * 2 + i * 0.1 + index) * 0.1;
          sizeAttr.array[i] = originalSize * twinkle;
        }
        sizeAttr.needsUpdate = true;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {geometries.map((geometry, index) => (
        <points
          key={index}
          geometry={geometry}
          material={materials[index]}
          frustumCulled={false}
          ref={(el) => {
            if (el) armsRef.current[index] = el;
          }}
        />
      ))}
    </group>
  );
}
