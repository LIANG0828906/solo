import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { motion } from 'framer-motion-3d';
import * as THREE from 'three';
import { FlagData } from '../types';

interface FlagProps {
  flag: FlagData;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const flagVertexShader = `
  uniform float uTime;
  uniform float uWindStrength;
  uniform float uWavePhase;
  
  varying vec2 vUv;
  varying float vWave;
  
  void main() {
    vUv = uv;
    vec3 pos = position;
    
    float wave = sin(pos.x * 3.0 + uTime * 2.0 + uWavePhase) * uWindStrength;
    wave += sin(pos.x * 5.0 + uTime * 3.5 + uWavePhase * 1.5) * uWindStrength * 0.5;
    wave *= uv.x;
    
    pos.y += wave * 0.3;
    pos.z += wave * 0.5;
    
    vWave = wave;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const flagFragmentShader = `
  uniform vec3 uColor;
  uniform float uOpacity;
  
  varying vec2 vUv;
  varying float vWave;
  
  void main() {
    vec3 color = uColor;
    
    float light = 0.7 + vWave * 0.3;
    color *= light;
    
    float silk = sin(vUv.x * 50.0) * 0.05 + sin(vUv.y * 30.0) * 0.03;
    color += silk;
    
    gl_FragColor = vec4(color, uOpacity);
  }
`;

export function Flag({ flag, isSelected, onSelect }: FlagProps) {
  const flagMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const groupRef = useRef<THREE.Group>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uWindStrength: { value: 0.4 },
      uWavePhase: { value: Math.random() * Math.PI * 2 },
      uColor: { value: new THREE.Color(flag.color) },
      uOpacity: { value: 1 },
    }),
    [flag.color]
  );

  useFrame((state) => {
    if (flagMaterialRef.current) {
      const time = state.clock.elapsedTime;
      const windStrength = 0.2 + Math.sin(time * 0.5) * 0.2 + 0.2;
      flagMaterialRef.current.uniforms.uTime.value = time;
      flagMaterialRef.current.uniforms.uWindStrength.value = windStrength;
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    onSelect(flag.id);
  };

  return (
    <motion.group
      ref={groupRef}
      position={flag.position}
      initial={{ y: flag.position[1] - 3, opacity: 0 }}
      animate={{ y: flag.position[1], opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      onClick={handleClick}
    >
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.04, 2, 8]} />
        <meshStandardMaterial color="#8b4513" roughness={0.6} />
      </mesh>

      <mesh position={[0, 1.6, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.2} />
      </mesh>

      <mesh
        position={[0.6, 1.6, 0]}
        castShadow
        onClick={handleClick}
      >
        <planeGeometry args={[1.2, 0.8, 12, 8]} />
        <shaderMaterial
          ref={flagMaterialRef}
          vertexShader={flagVertexShader}
          fragmentShader={flagFragmentShader}
          uniforms={uniforms}
          side={THREE.DoubleSide}
          transparent
        />
      </mesh>

      {isSelected && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.4, 0.5, 32]} />
          <meshBasicMaterial color="#ffd700" transparent opacity={0.8} />
        </mesh>
      )}

      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2, 0.25, 16]} />
        <meshBasicMaterial color={flag.color} transparent opacity={0.6} />
      </mesh>
    </motion.group>
  );
}
