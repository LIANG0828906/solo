import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface LightBeamProps {
  active: boolean;
}

const LightBeam = ({ active }: LightBeamProps) => {
  const beamRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [visible, setVisible] = useState(false);
  const [opacity, setOpacity] = useState(0);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (active) {
      setVisible(true);
      startTimeRef.current = performance.now();
    } else {
      setVisible(false);
      setOpacity(0);
    }
  }, [active]);

  useFrame(() => {
    if (!active || !beamRef.current || !glowRef.current) return;

    const elapsed = (performance.now() - startTimeRef.current) / 1000;
    const totalDuration = 2;

    let newOpacity = 0;
    if (elapsed < 0.3) {
      newOpacity = (elapsed / 0.3) * 0.6;
    } else if (elapsed < totalDuration - 0.3) {
      newOpacity = 0.6 + Math.sin(elapsed * 5) * 0.1;
    } else if (elapsed < totalDuration) {
      newOpacity = 0.6 * (1 - (elapsed - (totalDuration - 0.3)) / 0.3);
    } else {
      setVisible(false);
      return;
    }

    setOpacity(newOpacity);

    const beamMaterial = beamRef.current.material as THREE.MeshBasicMaterial;
    beamMaterial.opacity = newOpacity;

    const glowMaterial = glowRef.current.material as THREE.MeshBasicMaterial;
    glowMaterial.opacity = newOpacity * 0.3;

    if (beamRef.current) {
      const scale = 1 + Math.sin(elapsed * 8) * 0.1;
      beamRef.current.scale.x = scale;
      beamRef.current.scale.z = scale;
    }
  });

  if (!visible) return null;

  return (
    <group position={[0, -0.5, 0]}>
      <mesh ref={beamRef} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.5, 8, 32, 1, true]} />
        <meshBasicMaterial
          color="#ffd700"
          transparent
          opacity={opacity}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.8, 8, 32, 1, true]} />
        <meshBasicMaterial
          color="#ffd700"
          transparent
          opacity={opacity * 0.3}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.6, 64]} />
        <meshBasicMaterial
          color="#ffd700"
          transparent
          opacity={opacity}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <pointLight
        position={[0, 2, 0]}
        color="#ffd700"
        intensity={opacity * 3}
        distance={10}
      />
    </group>
  );
};

export default LightBeam;
