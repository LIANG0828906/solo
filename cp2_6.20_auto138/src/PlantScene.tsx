import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { usePlantStore } from './store';
import { PLANTS, GROWTH_STAGES } from './PlantData';
import { createStemGeometry, createLeaves, createFlower, getAnimationSpeed } from './PlantModel';

interface PlantProps {
  plantId: string;
  transitionKey: number;
}

function Plant({ plantId, transitionKey }: PlantProps) {
  const groupRef = useRef<THREE.Group>(null);
  const leavesRef = useRef<THREE.Group>(null);
  const flowerRef = useRef<THREE.Group>(null);
  const [opacity, setOpacity] = useState(0);

  const light = usePlantStore((state) => state.light);
  const water = usePlantStore((state) => state.water);
  const temperature = usePlantStore((state) => state.temperature);
  const growthStage = usePlantStore((state) => state.growthStage);
  const isSimulating = usePlantStore((state) => state.isSimulating);
  const setGrowthStage = usePlantStore((state) => state.setGrowthStage);
  const setIsSimulating = usePlantStore((state) => state.setIsSimulating);
  const setShowStageLabel = usePlantStore((state) => state.setShowStageLabel);
  const setCurrentStageName = usePlantStore((state) => state.setCurrentStageName);

  const species = useMemo(() => {
    return PLANTS.find((p) => p.id === plantId) || PLANTS[0];
  }, [plantId]);

  const env = useMemo(() => ({
    light,
    water,
    temperature,
    growthStage,
  }), [light, water, temperature, growthStage]);

  const stemData = useMemo(() => createStemGeometry(species, env), [species, env]);
  const leavesData = useMemo(() => createLeaves(species, env), [species, env]);
  const flowerData = useMemo(() => createFlower(species, env), [species, env]);

  useEffect(() => {
    setOpacity(0);
    gsap.to({ val: 0 }, {
      val: 1,
      duration: 0.8,
      ease: 'power2.out',
      onUpdate: function () {
        setOpacity(this.targets()[0].val);
      },
    });
  }, [transitionKey]);

  useEffect(() => {
    if (isSimulating) {
      const startTime = Date.now();
      const duration = 5000;
      let animationId: number;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const eased = 1 - Math.pow(1 - progress, 3);
        setGrowthStage(eased);

        if (progress < 0.2) {
          setCurrentStageName(GROWTH_STAGES.seedling.label);
        } else if (progress < 0.6) {
          setCurrentStageName(GROWTH_STAGES.growing.label);
        } else {
          setCurrentStageName(GROWTH_STAGES.mature.label);
        }

        if (progress < 1) {
          animationId = requestAnimationFrame(animate);
        } else {
          setIsSimulating(false);
          setShowStageLabel(true);
        }
      };

      animationId = requestAnimationFrame(animate);

      return () => cancelAnimationFrame(animationId);
    }
  }, [isSimulating, setGrowthStage, setIsSimulating, setShowStageLabel, setCurrentStageName]);

  useFrame((state) => {
    const speed = getAnimationSpeed(temperature);
    const time = state.clock.elapsedTime * speed;
    const pulse = Math.sin(time * Math.PI) * 0.5 + 0.5;

    if (leavesRef.current) {
      leavesRef.current.children.forEach((leaf, i) => {
        const offset = i * 0.3;
        const sway = Math.sin(time * 0.5 + offset) * 0.08;
        leaf.rotation.z = sway;
        leaf.rotation.x += pulse * 0.02;
      });
    }

    if (flowerRef.current && flowerData) {
      const flowerScale = 1 + pulse * 0.05;
      flowerRef.current.scale.setScalar(flowerScale);

      flowerRef.current.children.forEach((petal, i) => {
        if (i < flowerData.petals.length) {
          const originalRot = flowerData.petals[i].rotation.x;
          petal.rotation.x = originalRot + pulse * 0.1;
        }
      });
    }
  });

  const leafMaterial = useMemo(() => {
    const color = leavesData.length > 0 ? leavesData[0].color : '#4a9f4a';
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      side: THREE.DoubleSide,
      roughness: 0.8,
      metalness: 0.1,
      transparent: true,
      opacity: opacity,
    });
  }, [leavesData, opacity]);

  const stemMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      roughness: 0.9,
      metalness: 0.05,
      transparent: true,
      opacity: opacity,
    });
  }, [opacity]);

  const petalMaterial = useMemo(() => {
    if (!flowerData) return null;
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(flowerData.petals[0]?.color || '#ffd700'),
      side: THREE.DoubleSide,
      roughness: 0.7,
      metalness: 0.2,
      transparent: true,
      opacity: opacity,
      emissive: new THREE.Color(flowerData.petals[0]?.color || '#ffd700'),
      emissiveIntensity: 0.2,
    });
  }, [flowerData, opacity]);

  const centerMaterial = useMemo(() => {
    if (!flowerData) return null;
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(flowerData.center.color),
      roughness: 0.6,
      metalness: 0.3,
      transparent: true,
      opacity: opacity,
    });
  }, [flowerData, opacity]);

  useEffect(() => {
    if (leavesData.length > 0 && leafMaterial) {
      leafMaterial.color.set(leavesData[0].color);
    }
  }, [leavesData, leafMaterial]);

  return (
    <group ref={groupRef}>
      <mesh geometry={stemData.geometry} material={stemMaterial} position={[0, species.stemHeight * growthStage / 2, 0]} />

      <group ref={leavesRef}>
        {leavesData.map((leaf, index) => (
          <mesh
            key={index}
            geometry={leaf.geometry}
            material={leafMaterial}
            position={leaf.position}
            rotation={leaf.rotation}
            scale={leaf.scale}
          />
        ))}
      </group>

      {flowerData && (
        <group ref={flowerRef}>
          {flowerData.petals.map((petal, index) => (
            <mesh
              key={`petal-${index}`}
              geometry={petal.geometry}
              material={petalMaterial!}
              position={petal.position}
              rotation={petal.rotation}
              scale={petal.scale}
            />
          ))}
          <mesh
            geometry={flowerData.center.geometry}
            material={centerMaterial!}
            position={flowerData.center.position}
            scale={flowerData.center.scale}
          />
        </group>
      )}
    </group>
  );
}

function GrowthParticles() {
  const particlesRef = useRef<THREE.Points>(null);
  const isSimulating = usePlantStore((state) => state.isSimulating);
  const growthStage = usePlantStore((state) => state.growthStage);
  const selectedPlantId = usePlantStore((state) => state.selectedPlantId);
  const species = PLANTS.find((p) => p.id === selectedPlantId) || PLANTS[0];

  const particlesCount = 100;

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(particlesCount * 3);
    const col = new Float32Array(particlesCount * 3);
    const color = new THREE.Color(species.colorPalette.leaves);

    for (let i = 0; i < particlesCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 2;
      pos[i * 3 + 1] = Math.random() * species.stemHeight;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2;

      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;
    }

    return [pos, col];
  }, [species]);

  useFrame((state) => {
    if (!particlesRef.current || !isSimulating) return;

    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
    const time = state.clock.elapsedTime;

    for (let i = 0; i < particlesCount; i++) {
      const i3 = i * 3;
      positions[i3 + 1] += 0.02 + Math.sin(time + i) * 0.005;
      positions[i3] += Math.sin(time * 0.5 + i * 0.1) * 0.003;
      positions[i3 + 2] += Math.cos(time * 0.5 + i * 0.1) * 0.003;

      if (positions[i3 + 1] > species.stemHeight * growthStage + 1) {
        positions[i3 + 1] = -0.5;
        positions[i3] = (Math.random() - 0.5) * 2;
        positions[i3 + 2] = (Math.random() - 0.5) * 2;
      }
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  if (!isSimulating && growthStage >= 1) return null;

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particlesCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particlesCount}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={isSimulating ? 0.8 : 0}
        sizeAttenuation
      />
    </points>
  );
}

function SceneContent() {
  const selectedPlantId = usePlantStore((state) => state.selectedPlantId);
  const plantTransitionKey = usePlantStore((state) => state.plantTransitionKey);
  const resetGrowth = usePlantStore((state) => state.resetGrowth);
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  const handleDoubleClick = () => {
    if (camera) {
      gsap.to(camera.position, {
        x: 0,
        y: 2,
        z: 6,
        duration: 0.8,
        ease: 'power2.out',
      });
      gsap.to(controlsRef.current?.target || { x: 0, y: 0, z: 0 }, {
        x: 0,
        y: 1,
        z: 0,
        duration: 0.8,
        ease: 'power2.out',
      });
    }
    resetGrowth();
  };

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-5, 6, -5]} intensity={0.4} color="#a8d5ba" />
      <pointLight position={[0, 3, 0]} intensity={0.3} color="#7fff7f" />

      <Grid
        position={[0, -0.01, 0]}
        args={[20, 20]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#3d7a5a"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#5a9a7a"
        fadeDistance={25}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid
      />

      <group onDoubleClick={handleDoubleClick}>
        <Plant plantId={selectedPlantId} transitionKey={plantTransitionKey} />
        <GrowthParticles />
      </group>

      <OrbitControls
        ref={controlsRef}
        makeDefault
        minDistance={3}
        maxDistance={15}
        enablePan={false}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2 - 0.1}
      />
    </>
  );
}

export default function PlantScene() {
  return (
    <Canvas
      camera={{ position: [3, 2, 5], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
      dpr={[1, 2]}
      shadows
    >
      <SceneContent />
    </Canvas>
  );
}
