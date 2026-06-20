import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { BuildingType, Particle as ParticleType, OpeningRates } from '../types';
import { BUILDING_DIMENSIONS } from '../types';
import { useBuildingStore, selectBuildingType, selectOpeningRates } from '../controllers/BuildingController';
import { windController } from '../controllers/WindController';

interface BuildingMeshProps {
  type: BuildingType;
  openingRates: OpeningRates;
}

function BuildingMesh({ type, openingRates }: BuildingMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const edgesRef = useRef<THREE.LineSegments>(null);
  const [targetScale, setTargetScale] = useState(1);
  const [currentScale, setCurrentScale] = useState(1);

  useEffect(() => {
    setTargetScale(0);
    const timer1 = setTimeout(() => setTargetScale(1), 150);
    return () => clearTimeout(timer1);
  }, [type]);

  useFrame((_, delta) => {
    const newScale = currentScale + (targetScale - currentScale) * delta * 10;
    setCurrentScale(newScale);
    if (meshRef.current) {
      meshRef.current.scale.setScalar(newScale);
    }
    if (edgesRef.current) {
      edgesRef.current.scale.setScalar(newScale);
    }
  });

  const { geometry, edgeGeometry } = useMemo(() => {
    const dims = BUILDING_DIMENSIONS[type];
    const w = dims.width;
    const h = dims.height;
    const d = dims.depth;

    let geom: THREE.BufferGeometry;
    let edgeGeom: THREE.EdgesGeometry;

    if (type === 'cube') {
      geom = new THREE.BoxGeometry(w, h, d);
      geom.translate(0, h / 2, 0);
      edgeGeom = new THREE.EdgesGeometry(geom);
    } else if (type === 'L-shape') {
      const shapes: THREE.Shape[] = [];
      const mainShape = new THREE.Shape();
      mainShape.moveTo(-w / 2, -d / 2);
      mainShape.lineTo(w / 2, -d / 2);
      mainShape.lineTo(w / 2, 0);
      mainShape.lineTo(0, 0);
      mainShape.lineTo(0, d / 2);
      mainShape.lineTo(-w / 2, d / 2);
      mainShape.lineTo(-w / 2, -d / 2);
      shapes.push(mainShape);

      const extrudeSettings = { depth: h, bevelEnabled: false };
      geom = new THREE.ExtrudeGeometry(shapes, extrudeSettings);
      geom.rotateX(-Math.PI / 2);
      geom.translate(0, 0, 0);
      edgeGeom = new THREE.EdgesGeometry(geom);
    } else {
      const shapes: THREE.Shape[] = [];
      const mainShape = new THREE.Shape();
      mainShape.moveTo(-w / 2, -d / 2);
      mainShape.lineTo(w / 2, -d / 2);
      mainShape.lineTo(w / 2, d / 2);
      mainShape.lineTo(w / 3, d / 2);
      mainShape.lineTo(w / 3, 0);
      mainShape.lineTo(-w / 3, 0);
      mainShape.lineTo(-w / 3, d / 2);
      mainShape.lineTo(-w / 2, d / 2);
      mainShape.lineTo(-w / 2, -d / 2);
      shapes.push(mainShape);

      const extrudeSettings = { depth: h, bevelEnabled: false };
      geom = new THREE.ExtrudeGeometry(shapes, extrudeSettings);
      geom.rotateX(-Math.PI / 2);
      geom.translate(0, 0, 0);
      edgeGeom = new THREE.EdgesGeometry(geom);
    }

    return { geometry: geom, edgeGeometry: edgeGeom };
  }, [type]);

  const windowMeshes = useMemo(() => {
    const dims = BUILDING_DIMENSIONS[type];
    const w = dims.width;
    const h = dims.height;
    const d = dims.depth;

    const windows: { position: [number, number, number]; rotation: [number, number, number]; size: [number, number]; rate: number }[] = [];
    const facades: { direction: string; pos: [number, number, number]; rot: [number, number, number]; w: number; h: number }[] = [
      { direction: 'south', pos: [0, h / 2, d / 2], rot: [0, 0, 0], w: w, h: h },
      { direction: 'north', pos: [0, h / 2, -d / 2], rot: [0, Math.PI, 0], w: w, h: h },
      { direction: 'east', pos: [w / 2, h / 2, 0], rot: [0, Math.PI / 2, 0], w: d, h: h },
      { direction: 'west', pos: [-w / 2, h / 2, 0], rot: [0, -Math.PI / 2, 0], w: d, h: h }
    ];

    for (const facade of facades) {
      const rate = openingRates[facade.direction as keyof OpeningRates] / 100;
      if (rate <= 0) continue;

      const windowW = facade.w * rate * 0.8;
      const windowH = facade.h * rate * 0.8;
      windows.push({
        position: facade.pos,
        rotation: facade.rot,
        size: [windowW, windowH],
        rate
      });
    }

    return windows;
  }, [type, openingRates]);

  return (
    <group>
      <mesh ref={meshRef} geometry={geometry}>
        <meshStandardMaterial
          color="#FFFFFF"
          transparent
          opacity={0.7}
          roughness={0.3}
          metalness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>
      <lineSegments ref={edgesRef} geometry={edgeGeometry}>
        <lineBasicMaterial color="#88CCFF" linewidth={2} transparent opacity={0.8} />
      </lineSegments>

      {windowMeshes.map((win, idx) => (
        <mesh key={idx} position={win.position} rotation={win.rotation}>
          <planeGeometry args={[win.size[0], win.size[1]]} />
          <meshBasicMaterial
            color="#88CCFF"
            transparent
            opacity={0.15 + win.rate * 0.2}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

function ParticleSystem() {
  const pointsRef = useRef<THREE.Points>(null);
  const trailsRef = useRef<THREE.Group>(null);
  const [particles, setParticles] = useState<ParticleType[]>([]);

  useEffect(() => {
    const unsubscribe = windController.subscribe((state) => {
      setParticles(state.particles);
    });
    return unsubscribe;
  }, []);

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(particles.length * 3);
    const col = new Float32Array(particles.length * 3);

    particles.forEach((p, i) => {
      pos[i * 3] = p.position[0];
      pos[i * 3 + 1] = p.position[1];
      pos[i * 3 + 2] = p.position[2];

      const normalizedSpeed = Math.min(1, Math.max(0, (p.speed - 0.5) / 2.5));
      const hue = 240 - normalizedSpeed * 240;
      const lightness = 50 + normalizedSpeed * 20;
      const color = new THREE.Color().setHSL(hue / 360, 0.8, lightness / 100);

      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;
    });

    return { positions: pos, colors: col };
  }, [particles]);

  const trailGeometries = useMemo(() => {
    return particles.map((p) => {
      const trailPos = new Float32Array(p.trail.length * 3);
      const trailCol = new Float32Array(p.trail.length * 3);
      const trailAlpha = new Float32Array(p.trail.length);

      p.trail.forEach((t, i) => {
        trailPos[i * 3] = t[0];
        trailPos[i * 3 + 1] = t[1];
        trailPos[i * 3 + 2] = t[2];

        const alpha = 1 - i / p.trail.length;
        trailAlpha[i] = alpha;

        const normalizedSpeed = Math.min(1, Math.max(0, (p.speed - 0.5) / 2.5));
        const hue = 240 - normalizedSpeed * 240;
        const lightness = 50 + normalizedSpeed * 20;
        const color = new THREE.Color().setHSL(hue / 360, 0.8, lightness / 100);
        trailCol[i * 3] = color.r;
        trailCol[i * 3 + 1] = color.g;
        trailCol[i * 3 + 2] = color.b;
      });

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(trailCol, 3));
      return { geometry, alpha: trailAlpha };
    });
  }, [particles]);

  return (
    <group>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={positions.length / 3}
            array={positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={colors.length / 3}
            array={colors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.12}
          vertexColors
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>

      <group ref={trailsRef}>
        {trailGeometries.map((tg, idx) => (
          <lineSegments key={idx} geometry={tg.geometry}>
            <lineBasicMaterial
              vertexColors
              transparent
              opacity={0.6}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </lineSegments>
        ))}
      </group>
    </group>
  );
}

function WindAnimationController() {
  const buildingType = useBuildingStore(selectBuildingType);
  const openingRates = useBuildingStore(selectOpeningRates);

  useEffect(() => {
    windController.setParameters(buildingType, openingRates);
  }, [buildingType, openingRates]);

  useFrame((_, delta) => {
    windController.update(delta);
  });

  return null;
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial color="#E8E8E8" roughness={0.9} />
    </mesh>
  );
}

function GridHelper() {
  return <gridHelper args={[30, 30, '#CCCCCC', '#E0E0E0']} position={[0, 0.001, 0]} />;
}

function SceneContent() {
  const buildingType = useBuildingStore(selectBuildingType);
  const openingRates = useBuildingStore(selectOpeningRates);

  return (
    <>
      <ambientLight intensity={0.4} />
      <hemisphereLight args={['#FFFFFF', '#E0E0E0', 0.6]} />
      <directionalLight
        position={[10, 15, 10]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-5, 5, -5]} intensity={0.3} />

      <Ground />
      <GridHelper />
      <BuildingMesh type={buildingType} openingRates={openingRates} />
      <ParticleSystem />
      <WindAnimationController />

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={30}
        maxPolarAngle={Math.PI / 2 - 0.1}
      />
    </>
  );
}

export default function BuildingScene() {
  return (
    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(180deg, #F0F0F0 0%, #E0E0E0 100%)' }}>
      <Canvas
        camera={{ position: [8, 6, 8], fov: 50 }}
        shadows
        gl={{ antialias: true, alpha: true }}
      >
        <fog attach="fog" args={['#E8E8E8', 20, 50]} />
        <SceneContent />
      </Canvas>
    </div>
  );
}
