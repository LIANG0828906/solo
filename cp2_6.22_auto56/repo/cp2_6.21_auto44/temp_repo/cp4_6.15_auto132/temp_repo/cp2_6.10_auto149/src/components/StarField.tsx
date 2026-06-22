import { useRef, useMemo, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import {
  bigDipperStars,
  bigDipperStory,
  twentyEightMansions,
  elementColors,
  Constellation,
} from '../utils/starData';

interface StarFieldProps {
  monthIndex: number;
  onHover: (name: string | null, story: string | null) => void;
}

const STAR_COUNT = 2000;
const SKY_RADIUS = 50;

const StarField: React.FC<StarFieldProps> = ({ monthIndex, onHover }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const bigDipperLineRef = useRef<THREE.LineSegments>(null);
  const constellationLinesRef = useRef<THREE.Group>(null);
  const currentRotation = useRef(0);
  const targetRotation = useRef(0);
  const [hoveredConstellation, setHoveredConstellation] = useState<string | null>(null);

  const { positions, colors, sizes } = useMemo(() => {
    const positions = new Float32Array(STAR_COUNT * 3);
    const colors = new Float32Array(STAR_COUNT * 3);
    const sizes = new Float32Array(STAR_COUNT);

    for (let i = 0; i < STAR_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = SKY_RADIUS * (0.95 + Math.random() * 0.1);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const brightness = 0.3 + Math.random() * 0.7;
      const colorVariation = 0.8 + Math.random() * 0.2;
      colors[i * 3] = brightness * colorVariation;
      colors[i * 3 + 1] = brightness * colorVariation;
      colors[i * 3 + 2] = brightness * (0.9 + Math.random() * 0.1);

      sizes[i] = 0.3 + Math.random() * 0.7;
    }

    return { positions, colors, sizes };
  }, []);

  const pointsGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    return geometry;
  }, [positions, colors, sizes]);

  const bigDipperGeometry = useMemo(() => {
    const positions = new Float32Array(bigDipperStars.length * 3);
    bigDipperStars.forEach((star: { x: number; y: number; z: number }, i: number) => {
      positions[i * 3] = star.x;
      positions[i * 3 + 1] = star.y;
      positions[i * 3 + 2] = star.z;
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, []);

  const constellationLineGeometries = useMemo(() => {
    return twentyEightMansions.map((constellation: Constellation) => {
      const positions = new Float32Array(constellation.stars.length * 3);
      constellation.stars.forEach((star: { x: number; y: number; z: number }, i: number) => {
        positions[i * 3] = star.x;
        positions[i * 3 + 1] = star.y;
        positions[i * 3 + 2] = star.z;
      });
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      return { geometry, constellation };
    });
  }, []);

  const constellationHitboxes = useMemo(() => {
    return twentyEightMansions.map((constellation: Constellation) => {
      const positions = constellation.stars.map(
        (s: { x: number; y: number; z: number }) => new THREE.Vector3(s.x, s.y, s.z)
      );
      const center = new THREE.Vector3();
      positions.forEach((p: THREE.Vector3) => center.add(p));
      center.divideScalar(positions.length);
      const radius = Math.max(
        ...positions.map((p: THREE.Vector3) => p.distanceTo(center))
      ) * 1.5;
      return { center, radius, constellation };
    });
  }, []);

  useFrame((_, delta) => {
    targetRotation.current = (monthIndex / 12) * Math.PI * 2;

    const rotationDiff = targetRotation.current - currentRotation.current;
    currentRotation.current += rotationDiff * Math.min(delta * 2, 1);

    if (pointsRef.current) {
      pointsRef.current.rotation.y = currentRotation.current;
    }
    if (bigDipperLineRef.current) {
      bigDipperLineRef.current.rotation.y = currentRotation.current;
    }
    if (constellationLinesRef.current) {
      constellationLinesRef.current.rotation.y = currentRotation.current;
    }
  });

  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    const { point } = event;
    const worldPoint = point.clone();

    const inverseRotation = new THREE.Matrix4().makeRotationY(-currentRotation.current);
    const localPoint = worldPoint.applyMatrix4(inverseRotation);

    let found: Constellation | null = null;
    let minDist = Infinity;

    for (const hitbox of constellationHitboxes) {
      const dist = localPoint.distanceTo(hitbox.center);
      if (dist < hitbox.radius && dist < minDist) {
        minDist = dist;
        found = hitbox.constellation;
      }
    }

    const bigDipperCenter = new THREE.Vector3();
    bigDipperStars.forEach((s: { x: number; y: number; z: number }) => bigDipperCenter.add(new THREE.Vector3(s.x, s.y, s.z)));
    bigDipperCenter.divideScalar(bigDipperStars.length);
    const bigDipperRadius = Math.max(
      ...bigDipperStars.map((s: { x: number; y: number; z: number }) => new THREE.Vector3(s.x, s.y, s.z).distanceTo(bigDipperCenter))
    ) * 1.5;

    if (localPoint.distanceTo(bigDipperCenter) < bigDipperRadius) {
      if (hoveredConstellation !== 'bigDipper') {
        setHoveredConstellation('bigDipper');
        onHover('北斗七星', bigDipperStory);
      }
      return;
    }

    if (found) {
      if (hoveredConstellation !== found.name) {
        setHoveredConstellation(found.name);
        onHover(found.chineseName, found.story);
      }
    } else if (hoveredConstellation !== null) {
      setHoveredConstellation(null);
      onHover(null, null);
    }
  };

  const handlePointerLeave = () => {
    if (hoveredConstellation !== null) {
      setHoveredConstellation(null);
      onHover(null, null);
    }
  };

  return (
    <group>
      <points
        ref={pointsRef}
        geometry={pointsGeometry}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <pointsMaterial
          size={0.15}
          vertexColors
          transparent
          opacity={0.9}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      <lineSegments ref={bigDipperLineRef} geometry={bigDipperGeometry}>
        <lineBasicMaterial
          color="#ffd700"
          transparent
          opacity={0.9}
        />
      </lineSegments>

      <group ref={constellationLinesRef}>
        {constellationLineGeometries.map(({ geometry, constellation }, index: number) => (
          <lineSegments
            key={constellation.name}
            geometry={geometry}
          >
            <lineBasicMaterial
              color={elementColors[constellation.element]}
              transparent
              opacity={hoveredConstellation === constellation.name ? 1 : 0.6}
            />
          </lineSegments>
        ))}
      </group>
    </group>
  );
};

export default StarField;
