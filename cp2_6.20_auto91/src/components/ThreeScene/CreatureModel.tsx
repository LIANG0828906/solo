import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { EvolutionStage, CreatureType } from '../../types';
import { EGG_CONFIGS } from '../../utils/constants';

interface CreatureModelProps {
  creatureType: CreatureType;
  stage: EvolutionStage;
  evolutionAnimation: {
    rotation: number;
    scale: number;
  };
}

const CreatureModel = ({ creatureType, stage, evolutionAnimation }: CreatureModelProps) => {
  const creatureRef = useRef<THREE.Group>(null);
  const config = EGG_CONFIGS[creatureType] || EGG_CONFIGS.phoenix;

  const getScale = () => {
    switch (stage) {
      case 'baby':
        return 0.5;
      case 'adult':
        return 0.8;
      case 'evolved':
        return 1.0;
      default:
        return 0.5;
    }
  };

  const primaryColor = new THREE.Color(config.color);
  const secondaryColor = new THREE.Color(config.glowColor);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();

    if (creatureRef.current) {
      const breathe = Math.sin(time * 2) * 0.03;
      creatureRef.current.position.y = breathe;
      creatureRef.current.rotation.y = evolutionAnimation.rotation + Math.sin(time * 0.3) * 0.1;

      const baseScale = getScale() * evolutionAnimation.scale;
      creatureRef.current.scale.setScalar(baseScale + breathe * 0.3);
    }
  });

  const renderPhoenix = () => (
    <group>
      <mesh position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshStandardMaterial color={primaryColor} metalness={0.3} roughness={0.4} emissive={secondaryColor} emissiveIntensity={0.2} />
      </mesh>

      <mesh position={[0, 0.65, 0]}>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshStandardMaterial color={primaryColor} metalness={0.3} roughness={0.4} emissive={secondaryColor} emissiveIntensity={0.3} />
      </mesh>

      <mesh position={[0, 0.75, 0.22]}>
        <coneGeometry args={[0.08, 0.15, 8]} />
        <meshStandardMaterial color={secondaryColor} emissive={secondaryColor} emissiveIntensity={0.5} />
      </mesh>

      <group position={[0, 0.7, 0]}>
        <mesh position={[-0.1, 0.05, 0.2]}>
          <sphereGeometry args={[0.04, 16, 16]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} />
        </mesh>
        <mesh position={[0.1, 0.05, 0.2]}>
          <sphereGeometry args={[0.04, 16, 16]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} />
        </mesh>
      </group>

      <group position={[0, 0.3, 0]}>
        <mesh rotation={[0, 0, 0.3]} position={[-0.5, 0, 0]}>
          <boxGeometry args={[0.6, 0.05, 0.3]} />
          <meshStandardMaterial color={primaryColor} metalness={0.2} roughness={0.5} emissive={secondaryColor} emissiveIntensity={0.2} side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[0, 0, -0.3]} position={[0.5, 0, 0]}>
          <boxGeometry args={[0.6, 0.05, 0.3]} />
          <meshStandardMaterial color={primaryColor} metalness={0.2} roughness={0.5} emissive={secondaryColor} emissiveIntensity={0.2} side={THREE.DoubleSide} />
        </mesh>
      </group>

      <mesh position={[0, 0, -0.4]} rotation={[0.2, 0, 0]}>
        <coneGeometry args={[0.1, 0.5, 8]} />
        <meshStandardMaterial color={secondaryColor} emissive={secondaryColor} emissiveIntensity={0.4} />
      </mesh>
    </group>
  );

  const renderDragon = () => (
    <group>
      <mesh position={[0, 0.4, 0]}>
        <capsuleGeometry args={[0.25, 0.5, 8, 16]} />
        <meshStandardMaterial color={primaryColor} metalness={0.4} roughness={0.3} emissive={secondaryColor} emissiveIntensity={0.15} />
      </mesh>

      <mesh position={[0, 0.85, 0.15]}>
        <sphereGeometry args={[0.22, 32, 32]} />
        <meshStandardMaterial color={primaryColor} metalness={0.4} roughness={0.3} emissive={secondaryColor} emissiveIntensity={0.2} />
      </mesh>

      <group position={[0, 0.95, 0.3]}>
        <mesh position={[-0.08, 0.15, 0]} rotation={[0, 0, 0.2]}>
          <coneGeometry args={[0.05, 0.2, 8]} />
          <meshStandardMaterial color={secondaryColor} emissive={secondaryColor} emissiveIntensity={0.3} />
        </mesh>
        <mesh position={[0.08, 0.15, 0]} rotation={[0, 0, -0.2]}>
          <coneGeometry args={[0.05, 0.2, 8]} />
          <meshStandardMaterial color={secondaryColor} emissive={secondaryColor} emissiveIntensity={0.3} />
        </mesh>
      </group>

      <group position={[0, 0.85, 0.15]}>
        <mesh position={[-0.08, 0, 0.18]}>
          <sphereGeometry args={[0.035, 16, 16]} />
          <meshStandardMaterial color="#ffffff" emissive="#87ceeb" emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[0.08, 0, 0.18]}>
          <sphereGeometry args={[0.035, 16, 16]} />
          <meshStandardMaterial color="#ffffff" emissive="#87ceeb" emissiveIntensity={0.5} />
        </mesh>
      </group>

      <group position={[0, 0.5, 0]}>
        <mesh rotation={[0, 0, 0.5]} position={[-0.5, 0.1, -0.1]}>
          <boxGeometry args={[0.7, 0.03, 0.5]} />
          <meshStandardMaterial color={primaryColor} metalness={0.3} roughness={0.4} side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[0, 0, -0.5]} position={[0.5, 0.1, -0.1]}>
          <boxGeometry args={[0.7, 0.03, 0.5]} />
          <meshStandardMaterial color={primaryColor} metalness={0.3} roughness={0.4} side={THREE.DoubleSide} />
        </mesh>
      </group>

      <mesh position={[0, 0.15, -0.5]} rotation={[0.3, 0, 0]}>
        <coneGeometry args={[0.08, 0.6, 8]} />
        <meshStandardMaterial color={secondaryColor} emissive={secondaryColor} emissiveIntensity={0.3} />
      </mesh>
    </group>
  );

  const renderWolf = () => (
    <group>
      <mesh position={[0, 0.25, 0]}>
        <capsuleGeometry args={[0.18, 0.4, 8, 16]} />
        <meshStandardMaterial color={primaryColor} metalness={0.2} roughness={0.6} emissive={secondaryColor} emissiveIntensity={0.15} />
      </mesh>

      <mesh position={[0, 0.5, 0.3]}>
        <sphereGeometry args={[0.2, 32, 32]} />
        <meshStandardMaterial color={primaryColor} metalness={0.2} roughness={0.6} emissive={secondaryColor} emissiveIntensity={0.2} />
      </mesh>

      <group position={[0, 0.6, 0.3]}>
        <mesh position={[-0.12, 0.15, 0.05]} rotation={[0, 0, 0.3]}>
          <coneGeometry args={[0.06, 0.18, 8]} />
          <meshStandardMaterial color={secondaryColor} emissive={secondaryColor} emissiveIntensity={0.3} />
        </mesh>
        <mesh position={[0.12, 0.15, 0.05]} rotation={[0, 0, -0.3]}>
          <coneGeometry args={[0.06, 0.18, 8]} />
          <meshStandardMaterial color={secondaryColor} emissive={secondaryColor} emissiveIntensity={0.3} />
        </mesh>
      </group>

      <group position={[0, 0.5, 0.3]}>
        <mesh position={[-0.07, 0, 0.18]}>
          <sphereGeometry args={[0.035, 16, 16]} />
          <meshStandardMaterial color="#ffff00" emissive="#ffff00" emissiveIntensity={0.8} />
        </mesh>
        <mesh position={[0.07, 0, 0.18]}>
          <sphereGeometry args={[0.035, 16, 16]} />
          <meshStandardMaterial color="#ffff00" emissive="#ffff00" emissiveIntensity={0.8} />
        </mesh>
      </group>

      <group position={[0, 0.05, 0]}>
        {[[-0.15, -0.2], [0.15, -0.2], [-0.15, 0.2], [0.15, 0.2]].map(([x, z], i) => (
          <mesh key={i} position={[x, -0.15, z]}>
            <cylinderGeometry args={[0.04, 0.05, 0.3, 8]} />
            <meshStandardMaterial color={primaryColor} />
          </mesh>
        ))}
      </group>

      <mesh position={[0, 0.25, -0.45]} rotation={[0, 0, 0.2]}>
        <cylinderGeometry args={[0.03, 0.06, 0.4, 8]} />
        <meshStandardMaterial color={secondaryColor} emissive={secondaryColor} emissiveIntensity={0.3} />
      </mesh>
    </group>
  );

  const renderTortoise = () => (
    <group>
      <mesh position={[0, 0.15, 0]}>
        <sphereGeometry args={[0.4, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={primaryColor} metalness={0.1} roughness={0.8} />
      </mesh>

      <mesh position={[0, 0.1, 0]}>
        <torusGeometry args={[0.38, 0.08, 8, 32]} />
        <meshStandardMaterial color={secondaryColor} metalness={0.1} roughness={0.7} />
      </mesh>

      <mesh position={[0, 0.05, 0.4]}>
        <sphereGeometry args={[0.15, 32, 32]} />
        <meshStandardMaterial color={primaryColor} metalness={0.1} roughness={0.8} />
      </mesh>

      <group position={[0, 0.05, 0.4]}>
        <mesh position={[-0.05, 0.03, 0.12]}>
          <sphereGeometry args={[0.025, 16, 16]} />
          <meshStandardMaterial color="#ffffff" emissive="#32cd32" emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[0.05, 0.03, 0.12]}>
          <sphereGeometry args={[0.025, 16, 16]} />
          <meshStandardMaterial color="#ffffff" emissive="#32cd32" emissiveIntensity={0.5} />
        </mesh>
      </group>

      <group position={[0, 0, 0]}>
        {[[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25]].map(([x, z], i) => (
          <mesh key={i} position={[x, -0.08, z]}>
            <cylinderGeometry args={[0.06, 0.08, 0.16, 8]} />
            <meshStandardMaterial color={primaryColor} />
          </mesh>
        ))}
      </group>

      <mesh position={[0, 0.05, -0.38]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color={secondaryColor} />
      </mesh>
    </group>
  );

  const renderCreature = () => {
    switch (creatureType) {
      case 'phoenix':
        return renderPhoenix();
      case 'dragon':
        return renderDragon();
      case 'wolf':
        return renderWolf();
      case 'tortoise':
        return renderTortoise();
      default:
        return renderPhoenix();
    }
  };

  return (
    <group ref={creatureRef}>
      {renderCreature()}
      <pointLight
        position={[0, 0.5, 0]}
        color={secondaryColor}
        intensity={0.5}
        distance={3}
      />
    </group>
  );
};

export default CreatureModel;
