import { useRef, useMemo, forwardRef, useImperativeHandle } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface EarthProps {
  children?: React.ReactNode;
}

export interface EarthRef {
  focusOnLocation: (lat: number, lng: number) => void;
  latLngToVector3: (lat: number, lng: number, radius?: number) => THREE.Vector3;
}

const EARTH_RADIUS = 5;

export const latLngToVector3 = (lat: number, lng: number, radius: number = EARTH_RADIUS): THREE.Vector3 => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return new THREE.Vector3(x, y, z);
};

const generateEarthTexture = (): THREE.CanvasTexture => {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  const oceanGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  oceanGradient.addColorStop(0, '#0c1e3a');
  oceanGradient.addColorStop(0.5, '#1a406b');
  oceanGradient.addColorStop(1, '#0c1e3a');
  ctx.fillStyle = oceanGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const continents = [
    { x: 120, y: 180, rx: 100, ry: 70, color: '#2d6b1e', rot: 0 },
    { x: 180, y: 400, rx: 60, ry: 90, color: '#2d6b1e', rot: 0.1 },
    { x: 500, y: 200, rx: 120, ry: 80, color: '#3a7d28', rot: -0.05 },
    { x: 560, y: 480, rx: 90, ry: 120, color: '#4a8f35', rot: 0.1 },
    { x: 900, y: 220, rx: 180, ry: 90, color: '#3a7d28', rot: 0 },
    { x: 980, y: 450, rx: 130, ry: 140, color: '#4a8f35', rot: -0.05 },
    { x: 1400, y: 230, rx: 200, ry: 100, color: '#3a7d28', rot: 0.05 },
    { x: 1520, y: 480, rx: 70, ry: 60, color: '#4a8f35', rot: 0 },
    { x: 1750, y: 280, rx: 120, ry: 90, color: '#5aa042', rot: -0.1 },
    { x: 350, y: 720, rx: 100, ry: 60, color: '#2d6b1e', rot: 0.15 },
    { x: 1200, y: 700, rx: 150, ry: 80, color: '#2d6b1e', rot: -0.1 },
    { x: 1750, y: 720, rx: 100, ry: 70, color: '#3a7d28', rot: 0.05 },
    { x: 100, y: 700, rx: 60, ry: 40, color: '#2d6b1e', rot: 0 },
  ];

  continents.forEach((cont) => {
    ctx.fillStyle = cont.color;
    ctx.beginPath();
    ctx.ellipse(cont.x, cont.y, cont.rx, cont.ry, cont.rot, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = adjustColor(cont.color, 25);
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * Math.min(cont.rx, cont.ry) * 0.7;
      const px = cont.x + Math.cos(angle) * dist;
      const py = cont.y + Math.sin(angle) * dist;
      const pr = 8 + Math.random() * 20;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  const deserts = [
    { x: 900, y: 320, rx: 80, ry: 40 },
    { x: 1450, y: 350, rx: 100, ry: 50 },
    { x: 250, y: 300, rx: 50, ry: 25 },
  ];

  deserts.forEach((d) => {
    ctx.fillStyle = '#d4a843';
    ctx.beginPath();
    ctx.ellipse(d.x, d.y, d.rx, d.ry, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 20;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
  }
  ctx.putImageData(imageData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

const adjustColor = (color: string, amount: number): string => {
  const hex = color.replace('#', '');
  const r = Math.min(255, Math.max(0, parseInt(hex.substr(0, 2), 16) + amount));
  const g = Math.min(255, Math.max(0, parseInt(hex.substr(2, 2), 16) + amount));
  const b = Math.min(255, Math.max(0, parseInt(hex.substr(4, 2), 16) + amount));
  return `rgb(${r}, ${g}, ${b})`;
};

const Earth = forwardRef<EarthRef, EarthProps>(({ children }, ref) => {
  const earthRef = useRef<THREE.Group>(null);
  const autoRotation = useRef(0);
  const targetRotation = useRef({ x: 0, y: 0 });
  const isFocusing = useRef(false);
  const earthTexture = useMemo(() => generateEarthTexture(), []);

  const focusOnLocation = (lat: number, lng: number) => {
    const targetLon = -lng * (Math.PI / 180);
    const targetLat = lat * (Math.PI / 180);
    targetRotation.current = { x: targetLat, y: targetLon };
    isFocusing.current = true;
  };

  useImperativeHandle(ref, () => ({
    focusOnLocation,
    latLngToVector3,
  }));

  useFrame((_, delta) => {
    if (earthRef.current) {
      if (isFocusing.current) {
        earthRef.current.rotation.y += (targetRotation.current.y - earthRef.current.rotation.y) * 0.05;
        earthRef.current.rotation.x += (targetRotation.current.x - earthRef.current.rotation.x) * 0.05;
        
        const diffY = Math.abs(targetRotation.current.y - earthRef.current.rotation.y);
        const diffX = Math.abs(targetRotation.current.x - earthRef.current.rotation.x);
        if (diffY < 0.01 && diffX < 0.01) {
          isFocusing.current = false;
          autoRotation.current = earthRef.current.rotation.y;
        }
      } else {
        autoRotation.current += delta * 0.08;
        earthRef.current.rotation.y = autoRotation.current;
      }
    }
  });

  const gridLines = useMemo(() => {
    const lines: JSX.Element[] = [];

    for (let lat = -80; lat <= 80; lat += 20) {
      const points: THREE.Vector3[] = [];
      for (let i = 0; i <= 64; i++) {
        const lng = (i / 64) * 360 - 180;
        points.push(latLngToVector3(lat, lng, EARTH_RADIUS + 0.02));
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      lines.push(
        <lineSegments key={`lat-${lat}`}>
          <bufferGeometry attach="geometry" {...geometry} />
          <lineBasicMaterial color="#5a9fd4" transparent opacity={0.3} />
        </lineSegments>
      );
    }

    for (let lng = -180; lng < 180; lng += 30) {
      const points: THREE.Vector3[] = [];
      for (let i = 0; i <= 32; i++) {
        const lat = (i / 32) * 180 - 90;
        points.push(latLngToVector3(lat, lng, EARTH_RADIUS + 0.02));
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      lines.push(
        <lineSegments key={`lng-${lng}`}>
          <bufferGeometry attach="geometry" {...geometry} />
          <lineBasicMaterial color="#5a9fd4" transparent opacity={0.3} />
        </lineSegments>
      );
    }

    return lines;
  }, []);

  return (
    <group ref={earthRef}>
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
        <meshStandardMaterial
          color="#3a7bd5"
          emissive="#1a3a6b"
          emissiveIntensity={0.3}
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>

      {gridLines}

      <mesh>
        <sphereGeometry args={[EARTH_RADIUS + 0.15, 64, 64]} />
        <meshBasicMaterial
          color="#4da3ff"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </mesh>

      <mesh>
        <sphereGeometry args={[EARTH_RADIUS + 0.4, 64, 64]} />
        <meshBasicMaterial
          color="#6bb3ff"
          transparent
          opacity={0.04}
          side={THREE.BackSide}
        />
      </mesh>

      <group>{children}</group>
    </group>
  );
});

Earth.displayName = 'Earth';

export default Earth;
export { EARTH_RADIUS };
