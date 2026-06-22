import { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  CityClimateData,
  getCityPosition,
  getCityMonthlyData,
  getTemperatureInfo,
  MIN_TEMPERATURE,
  MAX_TEMPERATURE
} from '../services/climateDataService';

interface EarthSceneProps {
  cities: CityClimateData[];
  selectedMonth: number;
  selectedCityIds: string[];
  compareMode: boolean;
  onCityClick: (cityId: string) => void;
}

function StarField() {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 2000;

  const [positions, opacities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const opa = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = 50 + Math.random() * 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      opa[i] = 0.3 + Math.random() * 0.7;
    }
    return [pos, opa];
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.01;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.15} color="#ffffff" transparent opacity={0.8} sizeAttenuation />
    </points>
  );
}

function Atmosphere() {
  return (
    <mesh>
      <sphereGeometry args={[2.15, 64, 64]} />
      <shaderMaterial
        transparent
        side={THREE.BackSide}
        uniforms={{
          glowColor: { value: new THREE.Color(0x0088ff) }
        }}
        vertexShader={`
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          varying vec3 vNormal;
          uniform vec3 glowColor;
          void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)));
          gl_FragColor = vec4(glowColor, 1.0) * intensity;
          }
        `}
      />
    </mesh>
  );
}

interface CityBarProps {
  city: CityClimateData;
  monthIndex: number;
  selected: boolean;
  onClick: () => void;
}

function CityBar({ city, monthIndex, selected, onClick }: CityBarProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const labelRef = useRef<THREE.Sprite>(null);
  const targetScale = useRef(new THREE.Vector3(1, 0.3, 1));
  const currentScale = useRef(new THREE.Vector3(1, 0.3, 1));

  const position = useMemo(() => {
    const [x, y, z] = getCityPosition(city, 2.02);
    return [x, y, z];
  }, [city]);

  const monthlyData = useMemo(() => {
    return getCityMonthlyData(city, monthIndex);
  }, [city, monthIndex]);

  const { color, scale } = useMemo(() => {
    return getTemperatureInfo(monthlyData.temperature);
  }, [monthlyData]);

  useEffect(() => {
    targetScale.current.set(1, scale, 1);
  }, [scale]);

  useFrame((state) => {
    if (meshRef.current && glowRef.current) {
      currentScale.current.lerp(targetScale.current, 0.05);
      meshRef.current.scale.copy(currentScale.current);
      glowRef.current.scale.copy(currentScale.current);
      if (selected) {
        const pulse = 1 + Math.sin(state.clock.elapsedTime * Math.PI) * 0.15;
        glowRef.current.scale.multiplyScalar(pulse);
      }
    }
  });

  const handleClick = useCallback((e: any) => {
    e.stopPropagation();
    onClick();
  }, [onClick]);

  const labelTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.font = 'bold 28px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 8;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(city.nameCN, 128, 32);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, [city.nameCN]);

  return (
    <group position={position as [number, number, number]}>
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'default'; }}
      >
        <cylinderGeometry args={[0.03, 0.03, 0.3, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={selected ? 1.5 : 0.5}
          transparent
          opacity={selected ? 1 : 0.8}
        />
      </mesh>
      <mesh ref={glowRef} position={[0, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.3, 16]} />
        <meshBasicMaterial color={color} transparent opacity={selected ? 0.4 : 0.15} />
      </mesh>
      <sprite ref={labelRef} position={[0, 0.25, 0]} scale={[0.6, 0.15, 1]}>
        <spriteMaterial map={labelTexture} transparent />
      </sprite>
    </group>
  );
}

interface ParticleLineProps {
  city1: CityClimateData;
  city2: CityClimateData;
}

function ParticleLine({ city1, city2 }: ParticleLineProps) {
  const lineRef = useRef<THREE.Points>(null);
  const particleCount = 50;

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);
    const [x1, y1, z1] = getCityPosition(city1, 2.02);
    const [x2, y2, z2] = getCityPosition(city2, 2.02);
    const colorStart = new THREE.Color('#00E5FF');
    const colorEnd = new THREE.Color('#FF007F');
    for (let i = 0; i < particleCount; i++) {
      const t = i / (particleCount - 1);
      const midHeight = 0.5 + Math.sin(t * Math.PI) * 0.3;
      pos[i * 3] = x1 + (x2 - x1) * t;
      pos[i * 3 + 1] = y1 + (y2 - y1) * t + midHeight;
      pos[i * 3 + 2] = z1 + (z2 - z1) * t;
      const c = colorStart.clone().lerp(colorEnd, t);
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return [pos, col];
  }, [city1, city2]);

  useFrame((state) => {
    if (lineRef.current) {
      const material = lineRef.current.material as THREE.PointsMaterial;
      material.size = 0.05 + Math.sin(state.clock.elapsedTime * 2) * 0.02;
    }
  });

  return (
    <points ref={lineRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particleCount} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={particleCount} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.05} vertexColors transparent opacity={0.9} sizeAttenuation />
    </points>
  );
}

function Earth({ children }: { children?: React.ReactNode }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const isDragging = useRef(false);
  const previousMouse = useRef({ x: 0, y: 0 });
  const rotationVelocity = useRef({ x: 0, y: 0 });

  const earthTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 1024, 512);
    gradient.addColorStop(0, '#0a3d62');
    gradient.addColorStop(0.3, '#1e6091');
    gradient.addColorStop(0.5, '#2c8cbe');
    gradient.addColorStop(0.7, '#1e6091');
    gradient.addColorStop(1, '#0a3d62');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 512);
    ctx.fillStyle = '#2d6a4f';
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 512;
      const r = 20 + Math.random() * 80;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#40916c';
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 512;
      const r = 10 + Math.random() * 40;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }, []);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      previousMouse.current = { x: e.clientX, y: e.clientY };
    };
    const handleMouseUp = () => {
      isDragging.current = false;
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !groupRef.current) return;
      const deltaX = e.clientX - previousMouse.current.x;
      const deltaY = e.clientY - previousMouse.current.y;
      rotationVelocity.current.y = deltaX * 0.005;
      rotationVelocity.current.x = deltaY * 0.005;
      previousMouse.current = { x: e.clientX, y: e.clientY };
    };
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoom = e.deltaY * 0.001;
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      const currentPos = camera.position.length();
      const newLength = Math.max(4, Math.min(12, currentPos + zoom * currentPos));
      camera.position.normalize().multiplyScalar(newLength);
    };
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [camera]);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += rotationVelocity.current.y;
      groupRef.current.rotation.x += rotationVelocity.current.x;
      rotationVelocity.current.y *= 0.95;
      rotationVelocity.current.x *= 0.95;
      if (!isDragging.current && Math.abs(rotationVelocity.current.y) < 0.0001) {
        groupRef.current.rotation.y += 0.0008;
      }
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial map={earthTexture} />
      </mesh>
      <Atmosphere />
      {children}
    </group>
  );
}

export default function EarthScene({
  cities,
  selectedMonth,
  selectedCityIds,
  compareMode,
  onCityClick,
}: EarthSceneProps) {
  const compareCities = useMemo(() => {
    return selectedCityIds
      .map(id => cities.find(c => c.id === id))
      .filter(Boolean) as CityClimateData[];
  }, [selectedCityIds, cities]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 3, 5]} intensity={1} />
      <pointLight position={[-5, -3, -5]} intensity={0.3} />
      <StarField />
      <Earth>
        {cities.map(city => (
          <CityBar
        key={city.id}
        city={city}
        monthIndex={selectedMonth}
        selected={selectedCityIds.includes(city.id)}
        onClick={() => onCityClick(city.id)}
      />
        ))}
        {compareMode && compareCities.length === 2 && (
          <ParticleLine city1={compareCities[0]} city2={compareCities[1]} />
        )}
      </Earth>
    </>
  );
}
