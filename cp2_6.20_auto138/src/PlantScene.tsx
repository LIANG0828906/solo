import { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Effects } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { usePlantStore } from './store';
import { PLANTS, GROWTH_STAGES } from './PlantData';
import { createStemGeometry, createLeaves, createFlower, getAnimationSpeed } from './PlantModel';

interface PlantProps {
  plantId: string;
  transitionKey: number;
  onTransitionComplete?: () => void;
}

function Plant({ plantId, transitionKey, onTransitionComplete }: PlantProps) {
  const groupRef = useRef<THREE.Group>(null);
  const leavesRef = useRef<THREE.Group>(null);
  const flowerRef = useRef<THREE.Group>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const glowRingRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);

  const [opacity, setOpacity] = useState(0);
  const [haloOpacity, setHaloOpacity] = useState(0);
  const [ringOpacity, setRingOpacity] = useState(0);
  const [particlesOpacity, setParticlesOpacity] = useState(0);
  const [baseScale, setBaseScale] = useState(0.5);
  const [ringScale, setRingScale] = useState(0.3);

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

  const maxHeight = useMemo(() => species.stemHeight * 1.5, [species]);

  const particleGeometry = useMemo(() => {
    const count = 80;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const color = new THREE.Color(species.colorPalette.leaves);

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const radius = Math.random() * 1.5;
      const height = Math.random() * maxHeight;

      positions[i * 3] = Math.cos(theta) * radius;
      positions[i * 3 + 1] = height;
      positions[i * 3 + 2] = Math.sin(theta) * radius;

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = 0.03 + Math.random() * 0.05;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    return geometry;
  }, [species, maxHeight]);

  useEffect(() => {
    setOpacity(0);
    setBaseScale(0.5);
    setHaloOpacity(0);
    setRingOpacity(0);
    setRingScale(0.3);
    setParticlesOpacity(0);

    const tl = gsap.timeline({
      onComplete: () => {
        onTransitionComplete?.();
      },
    });

    tl.to({ val: 0 }, {
      val: 1,
      duration: 0.3,
      ease: 'power2.out',
      onUpdate: function () {
        const v = this.targets()[0].val;
        setHaloOpacity(v * 0.8);
        setRingOpacity(v * 0.6);
        setRingScale(0.3 + v * 0.7);
      },
    })
      .to({ val: 0 }, {
        val: 1,
        duration: 0.5,
        ease: 'power3.out',
        onUpdate: function () {
          const v = this.targets()[0].val;
          setOpacity(v);
          setBaseScale(0.5 + v * 0.5);
          setParticlesOpacity(v * 0.6);
        },
      }, '>-0.2')
      .to({ val: 1 }, {
        val: 0,
        duration: 0.4,
        ease: 'power2.in',
        delay: 0.1,
        onUpdate: function () {
          const v = this.targets()[0].val;
          setHaloOpacity(v * 0.4);
          setRingOpacity(v * 0.3);
        },
      }, '>-0.1');

    return () => {
      tl.kill();
    };
  }, [transitionKey, onTransitionComplete]);

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
        leaf.rotation.x += pulse * 0.015;
      });
    }

    if (flowerRef.current && flowerData) {
      const flowerScale = 1 + pulse * 0.05;
      flowerRef.current.scale.setScalar(flowerScale);

      flowerRef.current.children.forEach((petal, i) => {
        if (i < flowerData.petals.length) {
          const originalRot = flowerData.petals[i].rotation.x;
          petal.rotation.x = originalRot + pulse * 0.08;
        }
      });
    }

    if (haloRef.current) {
      const haloPulse = 1 + Math.sin(time * 0.8) * 0.1;
      haloRef.current.scale.setScalar(haloPulse);
    }

    if (glowRingRef.current) {
      glowRingRef.current.rotation.y += 0.01 * speed;
      const ringPulse = 1 + Math.sin(time * 0.6) * 0.05;
      glowRingRef.current.scale.set(ringScale * ringPulse, ringScale * ringPulse * 0.5, ringScale * ringPulse);
    }

    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < 80; i++) {
        const i3 = i * 3;
        positions[i3 + 1] += 0.01 * speed;
        positions[i3] += Math.sin(time * 0.5 + i * 0.2) * 0.002;
        positions[i3 + 2] += Math.cos(time * 0.5 + i * 0.2) * 0.002;

        if (positions[i3 + 1] > maxHeight) {
          positions[i3 + 1] = -0.5;
          const theta = Math.random() * Math.PI * 2;
          const radius = Math.random() * 1.5;
          positions[i3] = Math.cos(theta) * radius;
          positions[i3 + 2] = Math.sin(theta) * radius;
        }
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  const stemMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      roughness: 0.85,
      metalness: 0.05,
      transparent: true,
      opacity: opacity,
    });
  }, [opacity]);

  const leafMaterial = useMemo(() => {
    const color = leavesData.length > 0 ? leavesData[0].color : species.colorPalette.leaves;
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      side: THREE.DoubleSide,
      roughness: 0.8,
      metalness: 0.1,
      transparent: true,
      opacity: opacity,
    });
  }, [leavesData, species, opacity]);

  useEffect(() => {
    if (leavesData.length > 0 && leafMaterial) {
      leafMaterial.color.set(leavesData[0].color);
    }
  }, [leavesData, leafMaterial]);

  const petalMaterial = useMemo(() => {
    if (!flowerData) return null;
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(flowerData.petals[0]?.color || species.colorPalette.flower),
      side: THREE.DoubleSide,
      roughness: 0.6,
      metalness: 0.2,
      transparent: true,
      opacity: opacity,
      emissive: new THREE.Color(flowerData.petals[0]?.color || species.colorPalette.flower),
      emissiveIntensity: 0.15,
    });
  }, [flowerData, species, opacity]);

  const centerMaterial = useMemo(() => {
    if (!flowerData) return null;
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(flowerData.center.color),
      roughness: 0.5,
      metalness: 0.3,
      transparent: true,
      opacity: opacity,
      emissive: new THREE.Color(flowerData.center.color),
      emissiveIntensity: 0.1,
    });
  }, [flowerData, opacity]);

  const haloMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color(species.colorPalette.leaves),
      transparent: true,
      opacity: haloOpacity * 0.3,
      side: THREE.BackSide,
    });
  }, [species, haloOpacity]);

  const ringMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color(species.colorPalette.flower || species.colorPalette.leaves),
      transparent: true,
      opacity: ringOpacity * 0.5,
      side: THREE.DoubleSide,
    });
  }, [species, ringOpacity]);

  const particlesMaterial = useMemo(() => {
    return new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: particlesOpacity,
      sizeAttenuation: true,
    });
  }, [particlesOpacity]);

  const stemPositionY = species.stemHeight * growthStage / 2;

  return (
    <group ref={groupRef} scale={baseScale}>
      <mesh ref={haloRef}>
        <sphereGeometry args={[maxHeight * 0.8, 32, 32]} />
        <primitive object={haloMaterial} attach="material" />
      </mesh>

      <mesh ref={glowRingRef} position={[0, maxHeight * 0.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.2, 0.02, 16, 100]} />
        <primitive object={ringMaterial} attach="material" />
      </mesh>

      <points ref={particlesRef} geometry={particleGeometry}>
        <primitive object={particlesMaterial} attach="material" />
      </points>

      <mesh
        geometry={stemData.geometry}
        material={stemMaterial}
        position={[0, stemPositionY, 0]}
        castShadow
        receiveShadow
      />

      <group ref={leavesRef}>
        {leavesData.map((leaf, index) => (
          <mesh
            key={`leaf-${index}-${plantId}`}
            geometry={leaf.geometry}
            material={leafMaterial}
            position={leaf.position}
            rotation={leaf.rotation}
            scale={leaf.scale}
            castShadow
          />
        ))}
      </group>

      {flowerData && (
        <group ref={flowerRef}>
          {flowerData.petals.map((petal, index) => (
            <mesh
              key={`petal-${index}-${plantId}`}
              geometry={petal.geometry}
              material={petalMaterial!}
              position={petal.position}
              rotation={petal.rotation}
              scale={petal.scale}
              castShadow
            />
          ))}
          <mesh
            geometry={flowerData.center.geometry}
            material={centerMaterial!}
            position={flowerData.center.position}
            scale={flowerData.center.scale}
            castShadow
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

  const particlesCount = 120;

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(particlesCount * 3);
    const col = new Float32Array(particlesCount * 3);
    const color = new THREE.Color(species.colorPalette.leaves);

    for (let i = 0; i < particlesCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 2.5;
      pos[i * 3 + 1] = Math.random() * species.stemHeight;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2.5;

      const colorVariation = 0.7 + Math.random() * 0.3;
      col[i * 3] = color.r * colorVariation;
      col[i * 3 + 1] = color.g * colorVariation;
      col[i * 3 + 2] = color.b * colorVariation;
    }

    return [pos, col];
  }, [species]);

  useFrame((state) => {
    if (!particlesRef.current || !isSimulating) return;

    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
    const time = state.clock.elapsedTime;

    for (let i = 0; i < particlesCount; i++) {
      const i3 = i * 3;
      positions[i3 + 1] += 0.025 + Math.sin(time + i * 0.5) * 0.008;
      positions[i3] += Math.sin(time * 0.6 + i * 0.15) * 0.004;
      positions[i3 + 2] += Math.cos(time * 0.6 + i * 0.15) * 0.004;

      if (positions[i3 + 1] > species.stemHeight * growthStage + 1.5) {
        positions[i3 + 1] = -0.5;
        positions[i3] = (Math.random() - 0.5) * 2.5;
        positions[i3 + 2] = (Math.random() - 0.5) * 2.5;
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
        size={0.06}
        vertexColors
        transparent
        opacity={isSimulating ? 0.9 : 0}
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

  const handleDoubleClick = useCallback(() => {
    if (camera && controlsRef.current) {
      gsap.to(camera.position, {
        x: 3,
        y: 2,
        z: 5,
        duration: 0.8,
        ease: 'power2.out',
      });
      gsap.to(controlsRef.current.target, {
        x: 0,
        y: 1.2,
        z: 0,
        duration: 0.8,
        ease: 'power2.out',
      });
    }
    resetGrowth();
  }, [camera, resetGrowth]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
      />
      <directionalLight position={[-5, 6, -5]} intensity={0.4} color="#a8d5ba" />
      <pointLight position={[0, 4, 0]} intensity={0.4} color="#7fff7f" distance={10} />
      <pointLight position={[2, 2, 2]} intensity={0.2} color="#ffffff" distance={8} />

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
        target={[0, 1.2, 0]}
        enableDamping
        dampingFactor={0.05}
      />
    </>
  );
}

export default function PlantScene() {
  return (
    <Canvas
      camera={{ position: [3, 2, 5], fov: 45 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ background: 'transparent' }}
      dpr={[1, 2]}
      shadows
    >
      <SceneContent />
    </Canvas>
  );
}
