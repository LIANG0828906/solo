import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useGeoFlowStore } from '../store';
import type { ProcessedDataPoint } from '../store';

const GLOBE_RADIUS = 200;
const ATMOSPHERE_RADIUS = 215;

interface DataBarProps {
  point: ProcessedDataPoint;
  isHovered: boolean;
  isSelected: boolean;
  isLOD: boolean;
  onHover: (id: string | null) => void;
  onClick: (point: ProcessedDataPoint) => void;
}

function DataBar({ point, isHovered, isSelected, isLOD, onHover, onClick }: DataBarProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [animatedHeight, setAnimatedHeight] = useState(0);
  const targetHeight = point.height;

  useEffect(() => {
    const startTime = Date.now();
    const duration = 1000;
    const startHeight = 0;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const easeT = 1 - Math.pow(1 - t, 3);
      const currentHeight = startHeight + (targetHeight - startHeight) * easeT;
      setAnimatedHeight(currentHeight);

      if (t < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }, [targetHeight]);

  const position = useMemo(() => {
    const [x, y, z] = point.position;
    const length = Math.sqrt(x * x + y * y + z * z);
    const nx = x / length;
    const ny = y / length;
    const nz = z / length;
    const halfHeight = animatedHeight / 2;
    return [
      x + nx * halfHeight,
      y + ny * halfHeight,
      z + nz * halfHeight
    ] as [number, number, number];
  }, [point.position, animatedHeight]);

  const rotation = useMemo(() => {
    const [x, y, z] = point.position;
    const length = Math.sqrt(x * x + y * y + z * z);
    const nx = x / length;
    const ny = y / length;
    const nz = z / length;

    const quaternion = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const direction = new THREE.Vector3(nx, ny, nz);
    quaternion.setFromUnitVectors(up, direction);

    const euler = new THREE.Euler().setFromQuaternion(quaternion);
    return [euler.x, euler.y, euler.z] as [number, number, number];
  }, [point.position]);

  const scale = isHovered && !isSelected ? 1.2 : 1;
  const segments = isLOD ? 8 : 16;

  return (
    <group position={position} rotation={rotation}>
      <mesh
        ref={meshRef}
        scale={[scale, 1, scale]}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(point.id);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          onHover(null);
          document.body.style.cursor = 'auto';
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick(point);
        }}
      >
        <cylinderGeometry args={[6, 6, animatedHeight, segments]} />
        <meshStandardMaterial
          color={point.color}
          emissive={isSelected ? '#FFD700' : point.color}
          emissiveIntensity={isSelected ? 0.8 : 0.2}
          metalness={0.3}
          roughness={0.4}
          transparent
          opacity={0.9}
        />
      </mesh>

      {isSelected && (
        <mesh scale={[1.15, 1.02, 1.15]}>
          <cylinderGeometry args={[6, 6, animatedHeight, segments]} />
          <meshBasicMaterial
            color="#FFD700"
            transparent
            opacity={0.15}
            side={THREE.BackSide}
          />
        </mesh>
      )}

      <pointLight
        color={point.color}
        intensity={0.5}
        distance={50}
        position={[0, -animatedHeight / 2, 0]}
      />

      {isHovered && (
        <Html
          position={[0, animatedHeight / 2 + 10, 0]}
          center
          distanceFactor={10}
          style={{ pointerEvents: 'none' }}
        >
          <div style={{
            backgroundColor: '#222244',
            color: '#ffffff',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '14px',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
            border: `1px solid ${point.color}`,
            pointerEvents: 'none'
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px', color: point.color }}>📍 数据点</div>
            <div>经度: {point.longitude.toFixed(4)}°</div>
            <div>纬度: {point.latitude.toFixed(4)}°</div>
            <div style={{ marginTop: '4px', color: point.color, fontWeight: 500 }}>
              强度: {point.intensity.toFixed(2)}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

interface EarthProps {
  isLOD: boolean;
}

function Earth({ isLOD }: EarthProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  const segments = isLOD ? 32 : 64;

  const earthTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1a3a5c');
    gradient.addColorStop(0.3, '#1e4d6b');
    gradient.addColorStop(0.5, '#2a5a78');
    gradient.addColorStop(0.7, '#1e4d6b');
    gradient.addColorStop(1, '#1a3a5c');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const continents = [
      { x: 180, y: 140, r: 100, color: '#2d7a4e' },
      { x: 220, y: 220, r: 70, color: '#2d7a4e' },
      { x: 480, y: 160, r: 90, color: '#3a8f5c' },
      { x: 520, y: 280, r: 80, color: '#3a8f5c' },
      { x: 680, y: 130, r: 60, color: '#4a9f6c' },
      { x: 700, y: 240, r: 110, color: '#4a9f6c' },
      { x: 780, y: 380, r: 40, color: '#5aaf7c' },
      { x: 120, y: 400, r: 50, color: '#5aaf7c' },
      { x: 300, y: 380, r: 70, color: '#5aaf7c' },
      { x: 900, y: 200, r: 50, color: '#6b5c3a' },
      { x: 420, y: 80, r: 30, color: '#aabbcc' },
      { x: 512, y: 460, r: 80, color: '#aabbcc' }
    ];

    continents.forEach(({ x, y, r, color }) => {
      for (let i = 0; i < 8; i++) {
        const offsetX = (Math.random() - 0.5) * r * 0.4;
        const offsetY = (Math.random() - 0.5) * r * 0.4;
        const radius = r * (0.5 + Math.random() * 0.5);
        ctx.beginPath();
        ctx.arc(x + offsetX, y + offsetY, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }
    });

    for (let i = 0; i < 50; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const r = 5 + Math.random() * 20;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fill();
    }

    for (let i = 0; i < 100; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      ctx.beginPath();
      ctx.arc(x, y, 1 + Math.random() * 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(100, 180, 255, 0.3)';
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }, []);

  useFrame(({ clock }) => {
    if (atmosphereRef.current) {
      const pulse = 0.15 + Math.sin(clock.getElapsedTime() * 1.5) * 0.05;
      const material = atmosphereRef.current.material as THREE.ShaderMaterial;
      if (material.uniforms) {
        material.uniforms.uOpacity.value = pulse;
      }
    }

    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
  });

  const atmosphereMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uOpacity: { value: 0.2 },
        uColor: { value: new THREE.Color('#00BFFF') }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPositionNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPositionNormal = normalize((modelViewMatrix * vec4(position, 1.0)).xyz);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uOpacity;
        uniform vec3 uColor;
        varying vec3 vNormal;
        varying vec3 vPositionNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vPositionNormal), 2.0);
          gl_FragColor = vec4(uColor, intensity * uOpacity);
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    });
  }, []);

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[GLOBE_RADIUS, segments, segments]} />
        <meshStandardMaterial
          map={earthTexture}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      <mesh ref={atmosphereRef} scale={[1.08, 1.08, 1.08]}>
        <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
        <primitive object={atmosphereMaterial} attach="material" />
      </mesh>
    </group>
  );
}

function ParticleRing() {
  const particlesRef = useRef<THREE.Points>(null);
  const particleCount = 500;

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);
    const color = new THREE.Color('#00E5FF');

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = ATMOSPHERE_RADIUS + 30 + Math.random() * 50;
      const tilt = (Math.random() - 0.5) * 0.3;
      const yOffset = Math.sin(angle * 3) * 10 + (Math.random() - 0.5) * 20;

      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = yOffset + Math.sin(tilt) * radius * 0.3;
      pos[i * 3 + 2] = Math.sin(angle) * radius;

      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;
    }

    return [pos, col];
  }, []);

  useFrame(({ clock }) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = clock.getElapsedTime() * 0.02;
      particlesRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.01) * 0.2;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={2}
        vertexColors
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

function DataBars() {
  const {
    processedData,
    hoveredPoint,
    selectedPoint,
    setHoveredPoint,
    setSelectedPoint
  } = useGeoFlowStore();

  const isLOD = processedData.length > 500;

  return (
    <group>
      {processedData.map((point) => (
        <DataBar
          key={point.id}
          point={point}
          isHovered={hoveredPoint === point.id}
          isSelected={selectedPoint?.id === point.id}
          isLOD={isLOD}
          onHover={setHoveredPoint}
          onClick={(p) => setSelectedPoint(selectedPoint?.id === p.id ? null : p)}
        />
      ))}
    </group>
  );
}

function SceneContent() {
  const { processedData } = useGeoFlowStore();
  const isLOD = processedData.length > 500;

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[500, 300, 500]}
        intensity={1.2}
        color="#ffffff"
      />
      <directionalLight
        position={[-300, -200, -400]}
        intensity={0.3}
        color="#58A6FF"
      />
      <pointLight
        position={[0, 0, 0]}
        intensity={0.5}
        color="#6C63FF"
        distance={500}
      />

      <Stars
        radius={1500}
        depth={100}
        count={8000}
        factor={4}
        saturation={0}
        fade
        speed={0.5}
      />

      <Earth isLOD={isLOD} />
      <ParticleRing />
      <DataBars />

      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.05}
        minDistance={350}
        maxDistance={1200}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
        autoRotate
        autoRotateSpeed={0.1}
      />
    </>
  );
}

function Globe() {
  return (
    <Canvas
      camera={{
        position: [0, 0, 600],
        fov: 45,
        near: 1,
        far: 5000
      }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      }}
      style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(180deg, #0B0014 0%, #1A0A2E 100%)'
      }}
      dpr={[1, 2]}
      frameloop="always"
    >
      <SceneContent />
    </Canvas>
  );
}

export default Globe;
