import React, { useRef, useMemo, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Grid } from '@react-three/drei';
import * as THREE from 'three';
import {
  GrowthParams,
  PlantMorphology,
  GrowthStage,
  LeafData,
  BranchData,
  FlowerData,
  getFlowerTopPosition
} from '../utils/plantGrowth';

interface PlantSceneProps {
  params: GrowthParams;
  morphology: PlantMorphology;
  isResetting: boolean;
  particleTrigger: { stage: GrowthStage; key: number } | null;
  onHoverInfo: (info: string | null) => void;
}

interface StemProps {
  height: number;
  radius: number;
  bend: number;
  colorStart: string;
  colorEnd: string;
}

const bentStemCurve = (height: number, bend: number): THREE.CatmullRomCurve3 => {
  const h = Math.max(height, 0.001);
  const points: THREE.Vector3[] = [];
  const segments = 16;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const y = t * h;
    const bendFactor = t * t;
    const x = Math.sin(bend) * y * bendFactor;
    const z = (Math.cos(bend) - 1) * y * bendFactor;
    points.push(new THREE.Vector3(x, y, z));
  }
  return new THREE.CatmullRomCurve3(points);
};

const Stem: React.FC<StemProps> = ({ height, radius, bend, colorStart, colorEnd }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(() => {
    if (height < 0.001) return new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0.001, 0)
    ]), 4, radius, 8, false);
    const curve = bentStemCurve(height, bend);
    return new THREE.TubeGeometry(curve, Math.max(8, Math.floor(height * 20)), radius, 10, false);
  }, [height, radius, bend]);

  const uniforms = useMemo(() => ({
    colorStart: { value: new THREE.Color(colorStart) },
    colorEnd: { value: new THREE.Color(colorEnd) }
  }), []);

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.colorStart.value.lerp(new THREE.Color(colorStart), 0.15);
      materialRef.current.uniforms.colorEnd.value.lerp(new THREE.Color(colorEnd), 0.15);
    }
  }, [colorStart, colorEnd, uniforms]);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.geometry.dispose();
      const curve = bentStemCurve(height, bend);
      meshRef.current.geometry = new THREE.TubeGeometry(
        curve,
        Math.max(8, Math.floor(height * 20)),
        radius,
        10,
        false
      );
    }
  });

  if (height < 0.001) return null;

  return (
    <mesh ref={meshRef} geometry={geometry} castShadow receiveShadow>
      <shaderMaterial
        ref={materialRef}
        vertexShader={`
          varying float vHeight;
          void main() {
            vHeight = position.y;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 colorStart;
          uniform vec3 colorEnd;
          varying float vHeight;
          void main() {
            float t = clamp(vHeight / 2.5, 0.0, 1.0);
            vec3 color = mix(colorStart, colorEnd, t);
            gl_FragColor = vec4(color, 1.0);
          }
        `}
        uniforms={uniforms}
      />
    </mesh>
  );
};

interface BranchMeshProps {
  branch: BranchData;
  bend: number;
  stemRadius: number;
  colorStart: string;
  colorEnd: string;
}

const BranchMesh: React.FC<BranchMeshProps> = ({ branch, bend, stemRadius, colorEnd }) => {
  const startX = Math.sin(bend) * branch.height * (branch.height / Math.max(branch.height, 0.01));
  const startY = branch.height;
  const startZ = (Math.cos(bend) - 1) * branch.height * (branch.height / Math.max(branch.height, 0.01));

  const dirX = Math.sin(branch.direction) * Math.sin(branch.angle);
  const dirY = Math.cos(branch.angle);
  const dirZ = Math.cos(branch.direction) * Math.sin(branch.angle);

  const endX = startX + dirX * branch.length;
  const endY = startY + dirY * branch.length;
  const endZ = startZ + dirZ * branch.length;

  const curve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(startX, startY, startZ),
      new THREE.Vector3(
        startX + dirX * branch.length * 0.5,
        startY + dirY * branch.length * 0.5 - 0.01,
        startZ + dirZ * branch.length * 0.5
      ),
      new THREE.Vector3(endX, endY, endZ)
    ]);
  }, [startX, startY, startZ, endX, endY, endZ, dirX, dirY, dirZ, branch.length]);

  const r = stemRadius * 0.7;

  return (
    <mesh castShadow>
      <tubeGeometry args={[curve, 5, r, 6, false]} />
      <meshStandardMaterial color={colorEnd} roughness={0.6} />
    </mesh>
  );
};

interface LeafMeshProps {
  leaf: LeafData;
}

const LeafMesh: React.FC<LeafMeshProps> = ({ leaf }) => {
  const groupRef = useRef<THREE.Group>(null);

  const { geometry, baseColor } = useMemo(() => {
    const shape = new THREE.Shape();
    const w = 0.08;
    const l = 0.15;
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(w * 1.2, l * 0.3, 0, l);
    shape.quadraticCurveTo(-w * 1.2, l * 0.3, 0, 0);

    const geo = new THREE.ShapeGeometry(shape);
    geo.center();

    const color = new THREE.Color(leaf.colorStart).lerp(new THREE.Color(leaf.colorEnd), 0.5);
    return { geometry: geo, baseColor: color };
  }, [leaf.colorStart, leaf.colorEnd]);

  const curlScale = 1 - leaf.curling * 0.4;

  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.elapsedTime;
      const sway = Math.sin(t * 1.5 + leaf.position[0] * 10) * 0.02;
      groupRef.current.rotation.z = leaf.rotation[2] + sway;
    }
  });

  return (
    <group
      ref={groupRef}
      position={leaf.position}
      rotation={[leaf.rotation[0], leaf.rotation[1], leaf.rotation[2]]}
      scale={[leaf.scale * curlScale, leaf.scale, leaf.scale]}
    >
      <mesh geometry={geometry} castShadow>
        <meshStandardMaterial
          color={baseColor}
          side={THREE.DoubleSide}
          roughness={0.5}
          transparent
          opacity={0.95}
        />
      </mesh>
    </group>
  );
};

interface FlowerMeshProps {
  flower: FlowerData;
  position: [number, number, number];
}

const FlowerMesh: React.FC<FlowerMeshProps> = ({ flower, position }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  const petals = useMemo(() => {
    const arr = [];
    for (let i = 0; i < flower.petalCount; i++) {
      arr.push((Math.PI * 2 * i) / flower.petalCount);
    }
    return arr;
  }, [flower.petalCount]);

  return (
    <group ref={groupRef} position={position} scale={flower.opacity}>
      {petals.map((angle, i) => (
        <group key={i} rotation={[0, angle, 0]}>
          <mesh position={[0, flower.petalSize * 0.5, 0]}>
            <circleGeometry args={[flower.petalSize * 0.5, 16]} />
            <meshStandardMaterial
              color={flower.petalColor}
              side={THREE.DoubleSide}
              transparent
              opacity={0.85}
              roughness={0.3}
              emissive={flower.petalColor}
              emissiveIntensity={0.1}
            />
          </mesh>
        </group>
      ))}
      <mesh position={[0, flower.petalSize * 0.1, 0]}>
        <sphereGeometry args={[flower.petalSize * 0.3, 12, 12]} />
        <meshStandardMaterial
          color={flower.centerColor}
          emissive={flower.centerColor}
          emissiveIntensity={0.3}
          roughness={0.4}
        />
      </mesh>
    </group>
  );
};

interface ParticleBurstProps {
  triggerKey: number;
  position: [number, number, number];
}

const MAX_PARTICLES = 50;

const ParticleBurst: React.FC<ParticleBurstProps> = ({ triggerKey, position }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const lifetimeRef = useRef(0);
  const velocitiesRef = useRef<Float32Array>(new Float32Array(MAX_PARTICLES * 3));
  const [visible, setVisible] = useState(false);

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(MAX_PARTICLES * 3);
    const col = new Float32Array(MAX_PARTICLES * 3);
    const cStart = new THREE.Color('#FFD700');
    const cEnd = new THREE.Color('#FF69B4');
    for (let i = 0; i < MAX_PARTICLES; i++) {
      pos[i * 3] = position[0];
      pos[i * 3 + 1] = position[1];
      pos[i * 3 + 2] = position[2];
      const t = i / MAX_PARTICLES;
      const color = cStart.clone().lerp(cEnd, t);
      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;
    }
    return { positions: pos, colors: col };
  }, [triggerKey, position]);

  useEffect(() => {
    lifetimeRef.current = 0;
    setVisible(true);
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = 0.3 + Math.random() * 0.5;
      velocitiesRef.current[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
      velocitiesRef.current[i * 3 + 1] = Math.cos(phi) * speed + 0.2;
      velocitiesRef.current[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * speed;
    }
    if (pointsRef.current) {
      const geo = pointsRef.current.geometry;
      const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < MAX_PARTICLES; i++) {
        posAttr.setXYZ(i, position[0], position[1], position[2]);
      }
      posAttr.needsUpdate = true;
    }
    const timer = setTimeout(() => setVisible(false), 1600);
    return () => clearTimeout(timer);
  }, [triggerKey, position]);

  useFrame((_, delta) => {
    if (!visible || !pointsRef.current) return;
    lifetimeRef.current += delta;
    const lifeT = Math.min(1, lifetimeRef.current / 1.5);
    const geo = pointsRef.current.geometry;
    const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const x = posAttr.getX(i) + velocitiesRef.current[i * 3] * delta;
      const y = posAttr.getY(i) + velocitiesRef.current[i * 3 + 1] * delta - 0.5 * delta * delta;
      const z = posAttr.getZ(i) + velocitiesRef.current[i * 3 + 2] * delta;
      posAttr.setXYZ(i, x, y, z);
    }
    posAttr.needsUpdate = true;
    const mat = pointsRef.current.material as THREE.PointsMaterial;
    mat.opacity = 1 - lifeT;
    mat.size = 0.04 * (1 - lifeT * 0.5);
  });

  if (!visible) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={MAX_PARTICLES}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={MAX_PARTICLES}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        vertexColors
        transparent
        opacity={1}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

interface SceneContentProps {
  params: GrowthParams;
  morphology: PlantMorphology;
  isResetting: boolean;
  particleTrigger: { stage: GrowthStage; key: number } | null;
  onHoverInfo: (info: string | null) => void;
}

const SceneContent: React.FC<SceneContentProps> = ({
  params,
  morphology,
  isResetting,
  particleTrigger,
  onHoverInfo
}) => {
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);
  const { camera } = useThree();

  useEffect(() => {
    if (hoveredPart) {
      const info = `高度: ${morphology.height.toFixed(2)}单位 | 叶片数: ${morphology.leaves.length}`;
      onHoverInfo(info);
    } else {
      onHoverInfo(null);
    }
  }, [hoveredPart, morphology.height, morphology.leaves.length, onHoverInfo]);

  const lightIntensity = params.light / 100;
  const directionalIntensity = 0.2 + lightIntensity * 0.8;

  const displayHeight = isResetting ? morphology.height : Math.max(0.001, morphology.height);
  const flowerPosition = getFlowerTopPosition(displayHeight, morphology.stemBend);

  const statusY = Math.max(0.5, displayHeight + 0.3);

  const potTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2000; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const darkness = Math.random() * 0.3;
      ctx.fillStyle = `rgba(60, 25, 0, ${darkness})`;
      ctx.fillRect(x, y, 1.5, 1.5);
    }
    for (let i = 0; i < 8; i++) {
      const y = 30 + i * 28;
      ctx.strokeStyle = 'rgba(100, 50, 20, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y + Math.random() * 6);
      ctx.lineTo(256, y + Math.random() * 6);
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }, []);

  return (
    <>
      <color attach="background" args={['#87CEEB']} />
      <fog attach="fog" args={['#E0F7FA', 5, 15]} />

      <ambientLight intensity={0.5 + lightIntensity * 0.2} />
      <directionalLight
        position={[3, 5, 2]}
        intensity={directionalIntensity}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={10}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
      />
      <directionalLight position={[-2, 3, -2]} intensity={0.15} color="#E0F7FA" />

      <Grid
        args={[12, 12]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#94A3B8"
        sectionSize={2}
        sectionThickness={1}
        sectionColor="#64748B"
        fadeDistance={8}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid
        position={[0, -0.2, 0]}
      />

      <group position={[0, -0.2, 0]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.8, 0.7, 0.4, 32]} />
          <meshStandardMaterial
            map={potTexture}
            color="#8B4513"
            roughness={0.9}
          />
        </mesh>
        <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.76, 0.76, 0.04, 32]} />
          <meshStandardMaterial color="#6B3A10" roughness={1} />
        </mesh>
        <mesh position={[0, 0.27, 0]} scale={[1, 0.15, 1]} castShadow>
          <sphereGeometry args={[0.68, 24, 16]} />
          <meshStandardMaterial color="#3E2723" roughness={1} />
        </mesh>
      </group>

      <group
        position={[0, 0.12, 0]}
        onPointerOver={() => setHoveredPart('plant')}
        onPointerOut={() => setHoveredPart(null)}
      >
        <Stem
          height={displayHeight}
          radius={morphology.stemRadius}
          bend={morphology.stemBend}
          colorStart={morphology.stemColorStart}
          colorEnd={morphology.stemColorEnd}
        />

        {morphology.branches.map(branch => (
          <BranchMesh
            key={branch.id}
            branch={branch}
            bend={morphology.stemBend}
            stemRadius={morphology.stemRadius}
            colorStart={morphology.stemColorStart}
            colorEnd={morphology.stemColorEnd}
          />
        ))}

        {morphology.leaves.map(leaf => (
          <LeafMesh key={leaf.id} leaf={leaf} />
        ))}

        {morphology.flower && (
          <FlowerMesh
            flower={morphology.flower}
            position={flowerPosition}
          />
        )}

        {morphology.statusMessage && (
          <Html
            position={[0, statusY, 0]}
            center
            distanceFactor={8}
            style={{ pointerEvents: 'none' }}
          >
            <div style={{
              padding: '4px 10px',
              backgroundColor: 'rgba(26, 26, 46, 0.8)',
              color: '#FFFFFF',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255,255,255,0.1)',
              animation: 'fadeInStatus 0.4s ease-out'
            }}>
              {morphology.statusMessage}
            </div>
          </Html>
        )}
      </group>

      {particleTrigger && (
        <ParticleBurst
          key={particleTrigger.key}
          triggerKey={particleTrigger.key}
          position={particleTrigger.stage === 'germination' ? [0, 0.3, 0] : flowerPosition}
        />
      )}

      <OrbitControls
        enablePan={false}
        minDistance={0.5}
        maxDistance={5}
        minPolarAngle={Math.PI * 0.1}
        maxPolarAngle={Math.PI * 0.48}
        mouseButtons={{
          LEFT: null as unknown as THREE.MOUSE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.ROTATE
        }}
        target={[0, 0.8, 0]}
        camera={camera}
        enableDamping
        dampingFactor={0.05}
      />

      <primitive object={new THREE.AmbientLight(0xffffff, 0)} />
    </>
  );
};

const PlantScene: React.FC<PlantSceneProps> = (props) => {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 1.5, 3], fov: 50, near: 0.1, far: 50 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      dpr={[1, 2]}
      style={{ width: '100%', height: '100%', cursor: 'grab' }}
    >
      <Suspense fallback={null}>
        <SceneContent {...props} />
      </Suspense>
    </Canvas>
  );
};

export default PlantScene;
