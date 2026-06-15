import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '../utils/store';
import { calculateMagneticField, vectorToLatLon, generateFieldLines, latLonToVector } from '../utils/geomagnetic';

const EARTH_RADIUS = 1;
const SCALE_FACTOR = EARTH_RADIUS / 6371.2;

function generateEarthTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#1a3a5c');
  gradient.addColorStop(0.3, '#2d5a7b');
  gradient.addColorStop(0.5, '#3d7a9b');
  gradient.addColorStop(0.7, '#2d5a7b');
  gradient.addColorStop(1, '#1a3a5c');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 500; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const radius = Math.random() * 80 + 20;
    const landGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    landGradient.addColorStop(0, 'rgba(80, 140, 100, 0.6)');
    landGradient.addColorStop(0.5, 'rgba(60, 120, 80, 0.3)');
    landGradient.addColorStop(1, 'rgba(40, 100, 60, 0)');
    ctx.fillStyle = landGradient;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  for (let i = 0; i < 100; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height * 0.3;
    const radius = Math.random() * 60 + 30;
    const desertGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    desertGradient.addColorStop(0, 'rgba(180, 160, 100, 0.5)');
    desertGradient.addColorStop(1, 'rgba(150, 130, 80, 0)');
    ctx.fillStyle = desertGradient;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  for (let i = 0; i < 50; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height * 0.15 + canvas.height * 0.85;
    const radius = Math.random() * 100 + 50;
    const iceGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    iceGradient.addColorStop(0, 'rgba(240, 248, 255, 0.7)');
    iceGradient.addColorStop(1, 'rgba(200, 220, 240, 0)');
    ctx.fillStyle = iceGradient;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  const polarGradient1 = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.1);
  polarGradient1.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
  polarGradient1.addColorStop(1, 'rgba(200, 220, 240, 0)');
  ctx.fillStyle = polarGradient1;
  ctx.fillRect(0, 0, canvas.width, canvas.height * 0.1);

  const polarGradient2 = ctx.createLinearGradient(0, canvas.height * 0.9, 0, canvas.height);
  polarGradient2.addColorStop(0, 'rgba(200, 220, 240, 0)');
  polarGradient2.addColorStop(1, 'rgba(255, 255, 255, 0.8)');
  ctx.fillStyle = polarGradient2;
  ctx.fillRect(0, canvas.height * 0.9, canvas.width, canvas.height * 0.1);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

function generateCloudTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = 'rgba(0, 0, 0, 0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 800; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const radius = Math.random() * 120 + 30;
    const cloudGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    const opacity = Math.random() * 0.4 + 0.1;
    cloudGradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
    cloudGradient.addColorStop(0.6, `rgba(255, 255, 255, ${opacity * 0.5})`);
    cloudGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = cloudGradient;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

function FieldLines({ show, reversalActive }: { show: boolean; reversalActive: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points[]>([]);

  const fieldLines = useMemo(() => {
    return generateFieldLines(36, 180, reversalActive ? -1 : 1);
  }, [reversalActive]);

  useEffect(() => {
    if (!groupRef.current) return;
    
    particlesRef.current.forEach((p) => {
      groupRef.current?.remove(p);
      p.geometry.dispose();
      (p.material as THREE.Material).dispose();
    });
    particlesRef.current = [];

    if (!show) return;

    fieldLines.forEach((line) => {
      const particleCount = Math.floor(line.points.length * 0.3);
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      const offsets = new Float32Array(particleCount);

      for (let i = 0; i < particleCount; i++) {
        offsets[i] = Math.random();
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute('offset', new THREE.BufferAttribute(offsets, 1));

      const material = new THREE.PointsMaterial({
        size: 0.015,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      });

      const points = new THREE.Points(geometry, material);
      points.userData = { lineData: line, particleCount };
      groupRef.current?.add(points);
      particlesRef.current.push(points);
    });
  }, [fieldLines, show]);

  useFrame((state) => {
    if (!show) return;
    const time = state.clock.elapsedTime;

    particlesRef.current.forEach((points) => {
      const { lineData, particleCount } = points.userData;
      const positions = points.geometry.attributes.position.array as Float32Array;
      const colors = points.geometry.attributes.color.array as Float32Array;
      const offsets = points.geometry.attributes.offset.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        const t = ((offsets[i] + time * 0.15) % 1.0);
        const index = t * (lineData.points.length - 1);
        const idx = Math.floor(index);
        const frac = index - idx;

        if (idx < lineData.points.length - 1) {
          const p1 = lineData.points[idx];
          const p2 = lineData.points[idx + 1];

          positions[i * 3] = (p1.x + (p2.x - p1.x) * frac) * SCALE_FACTOR;
          positions[i * 3 + 1] = (p1.y + (p2.y - p1.y) * frac) * SCALE_FACTOR;
          positions[i * 3 + 2] = (p1.z + (p2.z - p1.z) * frac) * SCALE_FACTOR;

          const intensity = p1.intensity + (p2.intensity - p1.intensity) * frac;
          const normIntensity = Math.min(Math.max((intensity - 20000) / 60000, 0), 1);
          
          const r = normIntensity;
          const g = normIntensity * 0.3;
          const b = 1 - normIntensity * 0.7;
          
          colors[i * 3] = r;
          colors[i * 3 + 1] = g;
          colors[i * 3 + 2] = b;
        }
      }

      points.geometry.attributes.position.needsUpdate = true;
      points.geometry.attributes.color.needsUpdate = true;
    });
  });

  return <group ref={groupRef} />;
}

function HeatmapLayer({ show, intensityScale }: { show: boolean; intensityScale: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const lon = (x / canvas.width) * 360 - 180;
        const lat = 90 - (y / canvas.height) * 180;

        const field = calculateMagneticField(lat, lon, 0);
        const normIntensity = Math.min(Math.max((field.intensity - 20000) / 60000, 0), 1);
        const scaledIntensity = Math.min(normIntensity * intensityScale, 1);

        const idx = (y * canvas.width + x) * 4;
        data[idx] = Math.floor(scaledIntensity * 255);
        data[idx + 1] = Math.floor(scaledIntensity * 80);
        data[idx + 2] = Math.floor((1 - scaledIntensity * 0.5) * 150);
        data[idx + 3] = Math.floor(scaledIntensity * 150);
      }
    }

    ctx.putImageData(imageData, 0, 0);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }, [intensityScale]);

  if (!show) return null;

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[EARTH_RADIUS * 1.005, 64, 64]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

function ArrowGrid({ show, intensityScale, reversalActive }: { show: boolean; intensityScale: number; reversalActive: boolean }) {
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const arrowCount = useMemo(() => {
    const latSteps = 12;
    const lonSteps = 24;
    return latSteps * lonSteps;
  }, []);

  const arrowData = useMemo(() => {
    const data: { position: THREE.Vector3; direction: THREE.Vector3; intensity: number }[] = [];
    const latSteps = 12;
    const lonSteps = 24;

    for (let i = 0; i < latSteps; i++) {
      const lat = -80 + (i / (latSteps - 1)) * 160;
      for (let j = 0; j < lonSteps; j++) {
        const lon = (j / lonSteps) * 360 - 180;
        const pos = latLonToVector(lat, lon, 6371.2 * 1.02);
        const field = calculateMagneticField(lat, lon, 0, reversalActive ? -1 : 1);
        
        data.push({
          position: new THREE.Vector3(pos.x, pos.y, pos.z),
          direction: new THREE.Vector3(field.direction.x, field.direction.y, field.direction.z),
          intensity: field.intensity,
        });
      }
    }
    return data;
  }, [reversalActive]);

  useEffect(() => {
    if (!instancedMeshRef.current || !show) return;

    arrowData.forEach((data, i) => {
      const scaledPos = data.position.clone().multiplyScalar(SCALE_FACTOR);
      dummy.position.copy(scaledPos);
      
      const up = new THREE.Vector3(0, 1, 0);
      const dir = data.direction.clone().normalize();
      dummy.quaternion.setFromUnitVectors(up, dir);
      
      const scale = 0.02 + (data.intensity / 60000) * 0.03 * intensityScale;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      instancedMeshRef.current!.setMatrixAt(i, dummy.matrix);
      
      const normIntensity = Math.min(Math.max((data.intensity - 20000) / 60000, 0), 1);
      const color = new THREE.Color();
      color.setRGB(normIntensity, normIntensity * 0.3, 1 - normIntensity * 0.7);
      instancedMeshRef.current!.setColorAt(i, color);
    });

    instancedMeshRef.current.instanceMatrix.needsUpdate = true;
    if (instancedMeshRef.current.instanceColor) {
      instancedMeshRef.current.instanceColor.needsUpdate = true;
    }
  }, [arrowData, show, intensityScale, dummy]);

  if (!show) return null;

  return (
    <instancedMesh ref={instancedMeshRef} args={[undefined, undefined, arrowCount]}>
      <coneGeometry args={[1, 2, 6]} />
      <meshBasicMaterial vertexColors toneMapped={false} />
    </instancedMesh>
  );
}

function RippleEffect({ point }: { point: { x: number; y: number; z: number } | null }) {
  const ringRef = useRef<THREE.Mesh>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (point) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [point]);

  useFrame((state) => {
    if (!ringRef.current || !visible || !point) return;
    
    const elapsed = state.clock.elapsedTime % 1.5;
    const scale = 0.05 + elapsed * 0.3;
    const opacity = Math.max(0, 1 - elapsed / 1.5);
    
    ringRef.current.scale.setScalar(scale);
    (ringRef.current.material as THREE.Material).opacity = opacity;
  });

  if (!visible || !point) return null;

  const pos = new THREE.Vector3(point.x, point.y, point.z);
  const normal = pos.clone().normalize();
  const up = new THREE.Vector3(0, 1, 0);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normal);

  return (
    <mesh ref={ringRef} position={pos} quaternion={quaternion}>
      <ringGeometry args={[0.98, 1.02, 64]} />
      <meshBasicMaterial color="#00ffff" transparent opacity={0.8} side={THREE.DoubleSide} />
    </mesh>
  );
}

export default function EarthScene() {
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const { selectedPoint, setSelectedPoint, showHeatmap, showArrowGrid, showFieldLines, intensityScale, reversalActive } = useAppStore();
  
  const earthTexture = useMemo(() => generateEarthTexture(), []);
  const cloudTexture = useMemo(() => generateCloudTexture(), []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (earthRef.current) {
      earthRef.current.rotation.y = time * 0.05;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y = time * 0.07;
    }
  });

  const handleEarthClick = (event: any) => {
    event.stopPropagation();
    const point = event.point;
    const latLon = vectorToLatLon(point.x, point.y, point.z);
    const field = calculateMagneticField(latLon.lat, latLon.lon, 0, reversalActive ? -1 : 1);
    
    setSelectedPoint({
      lat: latLon.lat,
      lon: latLon.lon,
      intensity: field.intensity * intensityScale,
      inclination: field.inclination,
      x: point.x,
      y: point.y,
      z: point.z,
    });
  };

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 3, 5]} intensity={1.2} />
      <pointLight position={[-5, -3, -5]} intensity={0.3} color="#4488ff" />

      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      <mesh ref={earthRef} onClick={handleEarthClick}>
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
        <meshStandardMaterial
          map={earthTexture}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      <mesh ref={cloudsRef}>
        <sphereGeometry args={[EARTH_RADIUS * 1.01, 64, 64]} />
        <meshStandardMaterial
          map={cloudTexture}
          transparent
          opacity={0.4}
          depthWrite={false}
        />
      </mesh>

      <mesh>
        <sphereGeometry args={[EARTH_RADIUS * 1.05, 64, 64]} />
        <meshBasicMaterial
          color="#4488ff"
          transparent
          opacity={0.05}
          side={THREE.BackSide}
        />
      </mesh>

      <FieldLines show={showFieldLines} reversalActive={reversalActive} />
      <HeatmapLayer show={showHeatmap} intensityScale={intensityScale} />
      <ArrowGrid show={showArrowGrid} intensityScale={intensityScale} reversalActive={reversalActive} />
      <RippleEffect point={selectedPoint} />

      <OrbitControls
        enablePan={false}
        minDistance={1.5}
        maxDistance={5}
        enableDamping
        dampingFactor={0.05}
      />
    </>
  );
}
