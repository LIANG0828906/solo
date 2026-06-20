import { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useGeoFlowStore } from '../store';
import type { ProcessedDataPoint } from '../store';

const GLOBE_RADIUS = 200;
const ATMOSPHERE_RADIUS = 215;

const LOD_DISTANCE_THRESHOLD = 700;
const HIGH_SEGMENTS = 16;
const LOW_SEGMENTS = 8;
const HIGH_EARTH_SEGMENTS = 64;
const LOW_EARTH_SEGMENTS = 32;

interface DataBarProps {
  point: ProcessedDataPoint;
  isHovered: boolean;
  isSelected: boolean;
  isDataLOD: boolean;
  cameraDistance: number;
  onHover: (id: string | null) => void;
  onClick: (point: ProcessedDataPoint) => void;
}

function DataBar({ point, isHovered, isSelected, isDataLOD, cameraDistance, onHover, onClick }: DataBarProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [animatedHeight, setAnimatedHeight] = useState(0);
  const targetHeight = point.height;

  useEffect(() => {
    const startTime = Date.now();
    const duration = 1000;
    const startHeight = animatedHeight;

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

  const isCameraLOD = cameraDistance > LOD_DISTANCE_THRESHOLD;
  const isLOD = isDataLOD || isCameraLOD;
  const segments = isLOD ? LOW_SEGMENTS : HIGH_SEGMENTS;

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
  const barColor = point.color;

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
          color={barColor}
          emissive={isSelected ? '#FFD700' : barColor}
          emissiveIntensity={isSelected ? 0.8 : 0.2}
          metalness={0.3}
          roughness={0.4}
          transparent
          opacity={0.9}
        />
      </mesh>

      {isSelected && (
        <>
          <mesh scale={[1.28, 1.04, 1.28]}>
            <cylinderGeometry args={[6, 6, animatedHeight, segments]} />
            <meshBasicMaterial
              color="#FFD700"
              transparent
              opacity={0.1}
              side={THREE.BackSide}
            />
          </mesh>
          <mesh scale={[1.20, 1.03, 1.20]}>
            <cylinderGeometry args={[6, 6, animatedHeight, segments]} />
            <meshBasicMaterial
              color="#FFD700"
              transparent
              opacity={0.2}
              side={THREE.BackSide}
            />
          </mesh>
          <mesh scale={[1.14, 1.02, 1.14]}>
            <cylinderGeometry args={[6, 6, animatedHeight, segments]} />
            <meshBasicMaterial
              color="#FFD700"
              transparent
              opacity={0.35}
              side={THREE.BackSide}
            />
          </mesh>
          <mesh scale={[1.08, 1.01, 1.08]}>
            <cylinderGeometry args={[6, 6, animatedHeight, segments]} />
            <meshBasicMaterial
              color="#FFD700"
              transparent
              opacity={0.55}
              side={THREE.BackSide}
            />
          </mesh>
        </>
      )}

      <pointLight
        color={barColor}
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
            border: `1px solid ${barColor}`,
            pointerEvents: 'none'
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px', color: barColor }}>📍 数据点</div>
            <div>经度: {point.longitude.toFixed(4)}°</div>
            <div>纬度: {point.latitude.toFixed(4)}°</div>
            <div style={{ marginTop: '4px', color: barColor, fontWeight: 500 }}>
              强度: {point.intensity.toFixed(2)}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

interface EarthProps {
  cameraDistance: number;
  isDataLOD: boolean;
}

function Earth({ cameraDistance, isDataLOD }: EarthProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const setCameraDistance = useGeoFlowStore((state) => state.setCameraDistance);

  const isCameraLOD = cameraDistance > LOD_DISTANCE_THRESHOLD;
  const isLOD = isDataLOD || isCameraLOD;
  const segments = isLOD ? LOW_EARTH_SEGMENTS : HIGH_EARTH_SEGMENTS;

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

  useFrame(() => {
    const cameraPos = camera.position;
    const distance = Math.sqrt(
      cameraPos.x * cameraPos.x +
      cameraPos.y * cameraPos.y +
      cameraPos.z * cameraPos.z
    );
    setCameraDistance(distance);

    if (atmosphereRef.current) {
      const minDistance = 350;
      const maxDistance = 1200;
      const normalizedDistance = Math.max(0, Math.min(1, (distance - minDistance) / (maxDistance - minDistance)));
      const baseOpacity = 0.2;
      const distanceFactor = 0.1 + normalizedDistance * 0.15;
      const opacity = baseOpacity + distanceFactor;

      const material = atmosphereRef.current.material as THREE.ShaderMaterial;
      if (material.uniforms) {
        material.uniforms.uOpacity.value = Math.max(0.1, Math.min(0.4, opacity));
      }
    }
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

function PerformanceMonitor() {
  const { setPerformance, processedData } = useGeoFlowStore();
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const { gl } = useThree();

  useFrame(() => {
    frameCountRef.current++;
    const now = performance.now();
    const elapsed = now - lastTimeRef.current;

    if (elapsed >= 500) {
      const fps = (frameCountRef.current * 1000) / elapsed;
      const frameTime = elapsed / frameCountRef.current;
      const isLODActive = processedData.length > 500;
      const drawCalls = gl.info.render.calls;

      setPerformance({
        fps: Math.round(fps * 100) / 100,
        frameTime: Math.round(frameTime * 100) / 100,
        drawCalls,
        isLODActive
      });

      frameCountRef.current = 0;
      lastTimeRef.current = now;
    }
  });

  return null;
}

function DataBars() {
  const {
    processedData,
    hoveredPoint,
    selectedPoint,
    cameraDistance,
    setHoveredPoint,
    setSelectedPoint
  } = useGeoFlowStore();

  const isDataLOD = processedData.length > 500;

  const handleClick = useCallback((p: ProcessedDataPoint) => {
    setSelectedPoint(selectedPoint?.id === p.id ? null : p);
  }, [selectedPoint, setSelectedPoint]);

  return (
    <group>
      {processedData.map((point) => (
        <DataBar
          key={point.id}
          point={point}
          isHovered={hoveredPoint === point.id}
          isSelected={selectedPoint?.id === point.id}
          isDataLOD={isDataLOD}
          cameraDistance={cameraDistance}
          onHover={setHoveredPoint}
          onClick={handleClick}
        />
      ))}
    </group>
  );
}

function SceneContent() {
  const { processedData, cameraDistance } = useGeoFlowStore();
  const isDataLOD = processedData.length > 500;

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

      <Earth cameraDistance={cameraDistance} isDataLOD={isDataLOD} />
      <ParticleRing />
      <DataBars />
      <PerformanceMonitor />

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
