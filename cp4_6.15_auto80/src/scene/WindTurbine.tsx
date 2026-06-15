import React, { useRef, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { WindTurbineData } from '@/store/windStore';

interface WindTurbineProps {
  data: WindTurbineData;
  isSelected: boolean;
  onClick: () => void;
  viewportScale: number;
}

export const WindTurbine: React.FC<WindTurbineProps> = ({
  data,
  isSelected,
  onClick,
  viewportScale,
}) => {
  const bladesRef = useRef<THREE.Group>(null);
  const statusLightRef = useRef<THREE.Mesh>(null);
  const powerBarRef = useRef<THREE.Mesh>(null);
  const highDetailGroupRef = useRef<THREE.Group>(null);
  const lowDetailGroupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const { camera } = useThree();

  const TOWER_HEIGHT = 120;
  const BLADE_LENGTH = 70;

  const barHeight = useMemo(() => {
    return (data.powerOutput / 100) * 80;
  }, [data.powerOutput]);

  useFrame((state) => {
    if (bladesRef.current) {
      const lerpedSpeed =
        data.rotationSpeed + (data.targetRotationSpeed - data.rotationSpeed) * 0.08;
      bladesRef.current.rotation.z += (lerpedSpeed * Math.PI) / 180;
    }

    if (statusLightRef.current) {
      const material = statusLightRef.current.material as THREE.MeshStandardMaterial;
      if (data.healthStatus === 'faulty') {
        const pulse = (Math.sin(state.clock.elapsedTime * 4) + 1) / 2;
        material.emissiveIntensity = 0.3 + pulse * 1.5;
      } else {
        material.emissiveIntensity = 0.8 + Math.sin(state.clock.elapsedTime * 1.5) * 0.2;
      }
    }

    if (powerBarRef.current) {
      const targetScaleY = barHeight / 50;
      powerBarRef.current.scale.y += (targetScaleY - powerBarRef.current.scale.y) * 0.1;
      const mat = powerBarRef.current.material as THREE.ShaderMaterial;
      if (mat.uniforms) {
        mat.uniforms.uTime.value = state.clock.elapsedTime;
        mat.uniforms.uHighlight.value = isSelected ? 1.0 : hovered ? 0.5 : 0.0;
      }
    }

    const distance = camera.position.distanceTo(
      new THREE.Vector3(data.position.x, 60, data.position.z)
    );
    const useLowDetail = distance > 800;
    if (highDetailGroupRef.current) {
      highDetailGroupRef.current.visible = !useLowDetail;
    }
    if (lowDetailGroupRef.current) {
      lowDetailGroupRef.current.visible = useLowDetail;
    }
  });

  const powerBarShader = useMemo(
    () => ({
      uniforms: {
        uTime: { value: 0 },
        uHighlight: { value: 0.0 },
      },
      vertexShader: `
        varying vec3 vPosition;
        varying float vHeight;
        void main() {
          vPosition = position;
          vHeight = position.y;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uHighlight;
        varying vec3 vPosition;
        varying float vHeight;

        void main() {
          float t = clamp((vHeight + 50.0) / 100.0, 0.0, 1.0);
          vec3 bottomColor = vec3(0.0, 0.5, 1.0);
          vec3 topColor = vec3(1.0, 0.45, 0.2);
          vec3 color = mix(bottomColor, topColor, t);

          float glow = 0.6 + 0.4 * sin(uTime * 2.0 + vHeight * 0.1);
          color += uHighlight * vec3(0.0, 0.6, 1.0) * 0.6;

          float alpha = 0.55 + glow * 0.25 + uHighlight * 0.2;
          gl_FragColor = vec4(color, alpha);
        }
      `,
    }),
    []
  );

  const emissiveColor =
    data.healthStatus === 'healthy' ? new THREE.Color('#4ade80') : new THREE.Color('#f87171');

  const handlePointerEvents = {
    onPointerOver: () => setHovered(true),
    onPointerOut: () => setHovered(false),
    onClick: (e: any) => {
      e.stopPropagation();
      onClick();
    },
  };

  return (
    <group position={[data.position.x, 0, data.position.z]}>
      <group ref={highDetailGroupRef}>
        <mesh
          position={[0, TOWER_HEIGHT / 2, 0]}
          castShadow
          receiveShadow
          {...handlePointerEvents}
        >
          <cylinderGeometry args={[3.5, 5, TOWER_HEIGHT, 12]} />
          <meshStandardMaterial
            color={hovered || isSelected ? '#c8d6e5' : '#a0aec0'}
            metalness={0.7}
            roughness={0.35}
            emissive={isSelected ? '#00d4ff' : '#000000'}
            emissiveIntensity={isSelected ? 0.15 : 0}
          />
        </mesh>

        <mesh position={[0, TOWER_HEIGHT + 8, 0]} castShadow {...handlePointerEvents}>
          <boxGeometry args={[12, 8, 20]} />
          <meshStandardMaterial
            color="#b8c5d6"
            metalness={0.8}
            roughness={0.3}
            emissive={isSelected ? '#00d4ff' : '#000000'}
            emissiveIntensity={isSelected ? 0.2 : 0}
          />
        </mesh>

        <mesh ref={statusLightRef} position={[0, TOWER_HEIGHT + 18, 0]}>
          <sphereGeometry args={[2.5, 16, 16]} />
          <meshStandardMaterial
            color={emissiveColor}
            emissive={emissiveColor}
            emissiveIntensity={0.8}
            toneMapped={false}
          />
        </mesh>

        <group ref={bladesRef} position={[0, TOWER_HEIGHT + 8, 12]}>
          {[0, 1, 2].map((i) => (
            <group key={i} rotation={[0, 0, (i * Math.PI * 2) / 3]}>
              <mesh
                position={[BLADE_LENGTH / 2, 0, 0]}
                castShadow
                {...handlePointerEvents}
              >
                <boxGeometry args={[BLADE_LENGTH, 3, 1.2]} />
                <meshStandardMaterial
                  color="#e2e8f0"
                  metalness={0.5}
                  roughness={0.4}
                  transparent
                  opacity={0.95}
                />
              </mesh>
              <mesh position={[BLADE_LENGTH / 2, 0, 0]}>
                <boxGeometry args={[BLADE_LENGTH + 2, 4.5, 2]} />
                <meshBasicMaterial
                  color="#00d4ff"
                  transparent
                  opacity={0.12 * viewportScale}
                  side={THREE.DoubleSide}
                />
              </mesh>
            </group>
          ))}
        </group>

        <mesh ref={powerBarRef} position={[0, 0, -25]}>
          <cylinderGeometry args={[4, 4, 100, 16, 1, true]} />
          <shaderMaterial
            uniforms={powerBarShader.uniforms}
            vertexShader={powerBarShader.vertexShader}
            fragmentShader={powerBarShader.fragmentShader}
            transparent
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {isSelected && (
          <mesh position={[35, 30, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <torusGeometry args={[15, 2.5, 16, 48, Math.PI * 2 * (data.powerOutput / 100)]} />
            <meshStandardMaterial
              color="#00d4ff"
              emissive="#00d4ff"
              emissiveIntensity={1.2}
              transparent
              opacity={0.9}
              toneMapped={false}
            />
          </mesh>
        )}
      </group>

      <group ref={lowDetailGroupRef} visible={false}>
        <mesh position={[0, TOWER_HEIGHT / 2, 0]}>
          <cylinderGeometry args={[4, 5, TOWER_HEIGHT, 6]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.5} />
        </mesh>
        <mesh position={[0, TOWER_HEIGHT + 5, 0]}>
          <boxGeometry args={[10, 6, 16]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.5} />
        </mesh>
        <mesh position={[0, TOWER_HEIGHT + 15, 0]}>
          <sphereGeometry args={[3, 8, 8]} />
          <meshStandardMaterial
            color={emissiveColor}
            emissive={emissiveColor}
            emissiveIntensity={0.6}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
};
