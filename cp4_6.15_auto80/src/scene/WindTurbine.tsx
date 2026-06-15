import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame, useThree, ReactThreeFiber } from '@react-three/fiber';
import * as THREE from 'three';
import { WindTurbineData } from '@/store/windStore';

interface WindTurbineProps {
  data: WindTurbineData;
  isSelected: boolean;
  onClick: () => void;
  viewportScale: number;
}

const TOWER_HEIGHT = 120;
const BLADE_LENGTH = 70;

type LODLevel = 'high' | 'medium' | 'low';

function useCurrentSpeed(targetSpeed: number) {
  const currentSpeedRef = useRef(targetSpeed);

  useFrame((_, delta) => {
    const lerpFactor = 1 - Math.pow(0.02, delta * 60);
    currentSpeedRef.current = THREE.MathUtils.lerp(
      currentSpeedRef.current,
      targetSpeed,
      lerpFactor
    );
  });

  return currentSpeedRef;
}

function BladeGlow({ length, viewportScale, cameraDistance }: {
  length: number;
  viewportScale: number;
  cameraDistance: number;
}) {
  const glowMeshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (glowMeshRef.current) {
      const mat = glowMeshRef.current.material as THREE.ShaderMaterial;
      const distanceFactor = THREE.MathUtils.clamp(1 - (cameraDistance - 200) / 1000, 0.3, 1.0);
      mat.uniforms.uGlowIntensity.value = 0.15 * viewportScale * distanceFactor;
    }
  });

  const glowShader = useMemo(
    () => ({
      uniforms: {
        uGlowIntensity: { value: 0.15 },
        uTime: { value: 0 },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uGlowIntensity;
        uniform float uTime;
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
          vec3 glowColor = vec3(0.0, 0.83, 1.0);
          float pulse = 0.8 + 0.2 * sin(uTime * 1.5);
          vec3 finalColor = glowColor * intensity * uGlowIntensity * pulse;
          gl_FragColor = vec4(finalColor, intensity * uGlowIntensity * 1.5);
        }
      `,
    }),
    []
  );

  useFrame((state) => {
    if (glowMeshRef.current) {
      const mat = glowMeshRef.current.material as THREE.ShaderMaterial;
      mat.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh ref={glowMeshRef} position={[length / 2, 0, 0]}>
      <boxGeometry args={[length + 6, 6, 3]} />
      <shaderMaterial
        uniforms={glowShader.uniforms}
        vertexShader={glowShader.vertexShader}
        fragmentShader={glowShader.fragmentShader}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

function PowerBar({
  powerOutput,
  isSelected,
  hovered,
}: {
  powerOutput: number;
  isSelected: boolean;
  hovered: boolean;
}) {
  const powerBarRef = useRef<THREE.Mesh>(null);
  const targetScaleYRef = useRef(0);

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
          float t_rev = 1.0 - t;
          vec3 bottomColor = vec3(0.0, 0.5, 1.0);
          vec3 topColor = vec3(1.0, 0.45, 0.2);
          vec3 color = mix(bottomColor, topColor, t_rev);

          float wave = sin(uTime * 3.0 + vHeight * 0.15) * 0.08;
          float glow = 0.6 + 0.4 * sin(uTime * 2.0 + vHeight * 0.1) + wave;
          color += uHighlight * vec3(0.0, 0.6, 1.0) * 0.6;

          float alpha = 0.55 + glow * 0.25 + uHighlight * 0.2;
          gl_FragColor = vec4(color, alpha);
        }
      `,
    }),
    []
  );

  useFrame((state) => {
    if (powerBarRef.current) {
      targetScaleYRef.current = (powerOutput / 100) * 1.6;
      powerBarRef.current.scale.y = THREE.MathUtils.lerp(
        powerBarRef.current.scale.y,
        targetScaleYRef.current,
        0.12
      );
      const mat = powerBarRef.current.material as THREE.ShaderMaterial;
      if (mat.uniforms) {
        mat.uniforms.uTime.value = state.clock.elapsedTime;
        mat.uniforms.uHighlight.value = isSelected ? 1.0 : hovered ? 0.5 : 0.0;
      }
    }
  });

  return (
    <mesh ref={powerBarRef} position={[0, 50, -25]}>
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
  );
}

function HighDetailTurbine({
  data,
  isSelected,
  onClick,
  viewportScale,
  onPointerOver,
  onPointerOut,
  hovered,
  cameraDistance,
}: WindTurbineProps & {
  onPointerOver: () => void;
  onPointerOut: () => void;
  hovered: boolean;
  cameraDistance: number;
}) {
  const bladesRef = useRef<THREE.Group>(null);
  const statusLightRef = useRef<THREE.Mesh>(null);
  const bladeMaterialRef = useRef<THREE.MeshStandardMaterial>(null);

  const currentSpeedRef = useCurrentSpeed(data.targetRotationSpeed);

  useFrame((state) => {
    if (bladesRef.current && currentSpeedRef.current) {
      bladesRef.current.rotation.z += (currentSpeedRef.current * Math.PI) / 180;
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

    if (bladeMaterialRef.current) {
      const distanceFactor = THREE.MathUtils.clamp((cameraDistance - 200) / 800, 0, 1);
      bladeMaterialRef.current.metalness = THREE.MathUtils.lerp(0.7, 0.4, distanceFactor);
      bladeMaterialRef.current.roughness = THREE.MathUtils.lerp(0.3, 0.5, distanceFactor);
      bladeMaterialRef.current.envMapIntensity = THREE.MathUtils.lerp(1.2, 0.5, distanceFactor);
    }
  });

  const emissiveColor =
    data.healthStatus === 'healthy' ? new THREE.Color('#4ade80') : new THREE.Color('#f87171');

  const handleEvents = {
    onPointerOver,
    onPointerOut,
    onClick: (e: any) => {
      e.stopPropagation();
      onClick();
    },
  };

  return (
    <group>
      <mesh position={[0, TOWER_HEIGHT / 2, 0]} castShadow receiveShadow {...handleEvents}>
        <cylinderGeometry args={[3.5, 5, TOWER_HEIGHT, 12]} />
        <meshStandardMaterial
          color={hovered || isSelected ? '#c8d6e5' : '#a0aec0'}
          metalness={0.7}
          roughness={0.35}
          emissive={isSelected ? '#00d4ff' : '#000000'}
          emissiveIntensity={isSelected ? 0.15 : 0}
        />
      </mesh>

      <mesh position={[0, TOWER_HEIGHT + 8, 0]} castShadow {...handleEvents}>
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
            <mesh position={[BLADE_LENGTH / 2, 0, 0]} castShadow {...handleEvents}>
              <boxGeometry args={[BLADE_LENGTH, 3, 1.2]} />
              <meshStandardMaterial
                ref={bladeMaterialRef as any}
                color="#e2e8f0"
                metalness={0.7}
                roughness={0.3}
                envMapIntensity={1.2}
                transparent
                opacity={0.98}
              />
            </mesh>
            <BladeGlow
              length={BLADE_LENGTH}
              viewportScale={viewportScale}
              cameraDistance={cameraDistance}
            />
          </group>
        ))}
      </group>

      <PowerBar
        powerOutput={data.powerOutput}
        isSelected={isSelected}
        hovered={hovered}
      />

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
  );
}

function MediumDetailTurbine({ data }: { data: WindTurbineData }) {
  const bladesRef = useRef<THREE.Group>(null);
  const currentSpeedRef = useCurrentSpeed(data.targetRotationSpeed);

  useFrame(() => {
    if (bladesRef.current && currentSpeedRef.current) {
      bladesRef.current.rotation.z += (currentSpeedRef.current * Math.PI) / 180;
    }
  });

  const emissiveColor =
    data.healthStatus === 'healthy' ? new THREE.Color('#4ade80') : new THREE.Color('#f87171');

  return (
    <group>
      <mesh position={[0, TOWER_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[4, 5, TOWER_HEIGHT, 8]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.5} />
      </mesh>
      <mesh position={[0, TOWER_HEIGHT + 6, 0]}>
        <boxGeometry args={[10, 6, 16]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.5} />
      </mesh>
      <mesh position={[0, TOWER_HEIGHT + 16, 0]}>
        <sphereGeometry args={[3, 8, 8]} />
        <meshStandardMaterial
          color={emissiveColor}
          emissive={emissiveColor}
          emissiveIntensity={0.6}
          toneMapped={false}
        />
      </mesh>
      <group ref={bladesRef} position={[0, TOWER_HEIGHT + 6, 10]}>
        {[0, 1, 2].map((i) => (
          <mesh
            key={i}
            position={[BLADE_LENGTH / 2, 0, 0]}
            rotation={[0, 0, (i * Math.PI * 2) / 3]}
          >
            <boxGeometry args={[BLADE_LENGTH, 2.5, 1]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.5} roughness={0.6} />
          </mesh>
        ))}
      </group>
      <mesh position={[0, 50, -25]} scale={[1, (data.powerOutput / 100) * 1.6, 1]}>
        <cylinderGeometry args={[4, 4, 100, 8, 1, true]} />
        <meshBasicMaterial
          color={data.powerOutput > 60 ? '#fb923c' : '#00d4ff'}
          transparent
          opacity={0.4}
        />
      </mesh>
    </group>
  );
}

function LowDetailTurbine({ data }: { data: WindTurbineData }) {
  const emissiveColor =
    data.healthStatus === 'healthy' ? new THREE.Color('#4ade80') : new THREE.Color('#f87171');

  return (
    <group>
      <mesh position={[0, TOWER_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[5, 6, TOWER_HEIGHT, 6]} />
        <meshStandardMaterial color="#64748b" metalness={0.5} roughness={0.7} />
      </mesh>
      <mesh position={[0, TOWER_HEIGHT + 15, 0]}>
        <sphereGeometry args={[4, 6, 6]} />
        <meshStandardMaterial
          color={emissiveColor}
          emissive={emissiveColor}
          emissiveIntensity={0.4}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

const LODComponent: React.FC<{
  distances: number[];
  children: React.ReactNode;
  position: [number, number, number];
}> = ({ distances, children, position }) => {
  const lodRef = useRef<THREE.LOD>(null);
  const { camera } = useThree();

  useEffect(() => {
    if (!lodRef.current) return;
    const lod = lodRef.current;
    while (lod.children.length > 0) {
      lod.remove(lod.children[0]);
    }
    React.Children.forEach(children, (child, index) => {
      if (!React.isValidElement(child)) return;
      const distance = distances[index] || 0;
      const group = new THREE.Group();
      lod.addLevel(group, distance);
    });
  }, [children, distances]);

  useFrame(() => {
    if (lodRef.current) {
      lodRef.current.update(camera);
    }
  });

  return (
    <primitive object={new THREE.LOD()} ref={lodRef} position={position}>
      {children}
    </primitive>
  );
};

export const WindTurbine: React.FC<WindTurbineProps> = ({
  data,
  isSelected,
  onClick,
  viewportScale,
}) => {
  const [hovered, setHovered] = useState(false);
  const [cameraDistance, setCameraDistance] = useState(800);
  const { camera } = useThree();
  const lodChildrenRef = useRef<React.ReactNode[]>([]);

  useFrame(() => {
    const dist = camera.position.distanceTo(
      new THREE.Vector3(data.position.x, 60, data.position.z)
    );
    setCameraDistance(dist);
  });

  const lodLevels = [
    { distance: 0, element: (
      <HighDetailTurbine
        data={data}
        isSelected={isSelected}
        onClick={onClick}
        viewportScale={viewportScale}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        hovered={hovered}
        cameraDistance={cameraDistance}
      />
    )},
    { distance: 600, element: <MediumDetailTurbine data={data} /> },
    { distance: 1200, element: <LowDetailTurbine data={data} /> },
  ];

  lodChildrenRef.current = lodLevels.map((l) => l.element);

  return (
    <group position={[data.position.x, 0, data.position.z]}>
      <TurbineLOD
        levels={lodLevels}
        turbineData={data}
      />
    </group>
  );
};

function TurbineLOD({
  levels,
  turbineData,
}: {
  levels: { distance: number; element: React.ReactNode }[];
  turbineData: WindTurbineData;
}) {
  const { camera } = useThree();
  const [currentLevel, setCurrentLevel] = useState(0);

  useFrame(() => {
    const dist = camera.position.distanceTo(
      new THREE.Vector3(turbineData.position.x, 60, turbineData.position.z)
    );
    let newLevel = 0;
    for (let i = levels.length - 1; i >= 0; i--) {
      if (dist >= levels[i].distance) {
        newLevel = i;
        break;
      }
    }
    if (newLevel !== currentLevel) {
      setCurrentLevel(newLevel);
    }
  });

  return <>{levels[currentLevel].element}</>;
}
