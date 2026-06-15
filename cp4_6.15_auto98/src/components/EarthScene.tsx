import { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '../utils/store';
import { calculateMagneticField, vectorToLatLon, generateFieldLines } from '../utils/geomagnetic';

const EARTH_RADIUS = 1;
const SCALE_FACTOR = EARTH_RADIUS / 6371.2;

const EARTH_TEXTURE_URL = 'https://cdn.jsdelivr.net/npm/three-globe@2.24.13/example/img/earth-blue-marble.jpg';
const CLOUDS_TEXTURE_URL = 'https://cdn.jsdelivr.net/npm/three-globe@2.24.13/example/img/earth-clouds.png';
const BUMP_TEXTURE_URL = 'https://cdn.jsdelivr.net/npm/three-globe@2.24.13/example/img/earth-topology.png';

interface FieldLinePoint {
  x: number;
  y: number;
  z: number;
  intensity: number;
}

interface FieldLineData {
  points: FieldLinePoint[];
  intensity: number;
  totalLength: number;
  cumulativeDistances: number[];
}

function generateProceduralEarthTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 4096;
  canvas.height = 2048;
  const ctx = canvas.getContext('2d')!;

  const oceanGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  oceanGradient.addColorStop(0, '#0a2463');
  oceanGradient.addColorStop(0.25, '#1e3f66');
  oceanGradient.addColorStop(0.5, '#2563eb');
  oceanGradient.addColorStop(0.75, '#1e3f66');
  oceanGradient.addColorStop(1, '#0a2463');
  ctx.fillStyle = oceanGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const continents = [
    { x: 0.2, y: 0.3, r: 0.15, color: '#2d5a27' },
    { x: 0.25, y: 0.28, r: 0.08, color: '#3d6b37' },
    { x: 0.35, y: 0.35, r: 0.1, color: '#2d5a27' },
    { x: 0.45, y: 0.28, r: 0.05, color: '#4a7c43' },
    { x: 0.55, y: 0.3, r: 0.12, color: '#8b7355' },
    { x: 0.6, y: 0.25, r: 0.06, color: '#6b5a45' },
    { x: 0.7, y: 0.35, r: 0.14, color: '#2d5a27' },
    { x: 0.75, y: 0.28, r: 0.08, color: '#3d6b37' },
    { x: 0.85, y: 0.7, r: 0.06, color: '#5a4a35' },
    { x: 0.15, y: 0.72, r: 0.08, color: '#6b5a45' },
    { x: 0.5, y: 0.85, r: 0.12, color: '#e8e8e8' },
    { x: 0.5, y: 0.08, r: 0.15, color: '#f0f8ff' },
  ];

  continents.forEach((cont) => {
    const cx = cont.x * canvas.width;
    const cy = cont.y * canvas.height;
    const cr = cont.r * Math.min(canvas.width, canvas.height);
    
    for (let i = 0; i < 150; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * cr * 0.9;
      const x = cx + Math.cos(angle) * dist;
      const y = cy + Math.sin(angle) * dist;
      const r = 20 + Math.random() * 60;
      
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, cont.color);
      grad.addColorStop(0.6, cont.color + '99');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  });

  const deserts = [
    { x: 0.52, y: 0.32, r: 0.05 },
    { x: 0.58, y: 0.3, r: 0.04 },
    { x: 0.22, y: 0.38, r: 0.03 },
  ];
  
  deserts.forEach((d) => {
    const cx = d.x * canvas.width;
    const cy = d.y * canvas.height;
    const cr = d.r * Math.min(canvas.width, canvas.height);
    
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr);
    grad.addColorStop(0, '#d4a574');
    grad.addColorStop(0.5, '#c4956a');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(cx - cr, cy - cr, cr * 2, cr * 2);
  });

  const mountainRanges = [
    { x: 0.3, y: 0.25, w: 0.15, h: 0.03 },
    { x: 0.6, y: 0.28, w: 0.12, h: 0.025 },
    { x: 0.72, y: 0.32, w: 0.08, h: 0.02 },
  ];
  
  mountainRanges.forEach((m) => {
    const cx = m.w * canvas.width;
    const cy = m.h * canvas.height;
    const grad = ctx.createLinearGradient(m.x * canvas.width, 0, (m.x + m.w) * canvas.width, 0);
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(0.5, '#5a5a5a44');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(m.x * canvas.width, (m.y - m.h/2) * canvas.height, cx, cy);
  });

  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const r = 1 + Math.random() * 3;
    
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(30, 100, 180, ${Math.random() * 0.1})`;
    ctx.fill();
  }

  const iceGrad1 = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.08);
  iceGrad1.addColorStop(0, '#ffffff');
  iceGrad1.addColorStop(0.5, '#e8f4fc');
  iceGrad1.addColorStop(1, 'transparent');
  ctx.fillStyle = iceGrad1;
  ctx.fillRect(0, 0, canvas.width, canvas.height * 0.08);

  const iceGrad2 = ctx.createLinearGradient(0, canvas.height * 0.92, 0, canvas.height);
  iceGrad2.addColorStop(0, 'transparent');
  iceGrad2.addColorStop(0.5, '#e8f4fc');
  iceGrad2.addColorStop(1, '#ffffff');
  ctx.fillStyle = iceGrad2;
  ctx.fillRect(0, canvas.height * 0.92, canvas.width, canvas.height * 0.08);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16;
  texture.needsUpdate = true;
  
  console.log('[Earth] Generated high-resolution procedural earth texture');
  return texture;
}

function generateProceduralCloudsTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = 'rgba(0, 0, 0, 0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let layer = 0; layer < 5; layer++) {
    const layerOpacity = 0.15 + layer * 0.05;
    const cellSize = 150 - layer * 20;
    
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const r = cellSize * (0.5 + Math.random());
      
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, `rgba(255, 255, 255, ${layerOpacity})`);
      grad.addColorStop(0.4, `rgba(255, 255, 255, ${layerOpacity * 0.6})`);
      grad.addColorStop(0.7, `rgba(255, 255, 255, ${layerOpacity * 0.3})`);
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.6, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  for (let i = 0; i < 80; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const r = 40 + Math.random() * 80;
    
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.2)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16;
  texture.needsUpdate = true;
  
  console.log('[Earth] Generated procedural clouds texture');
  return texture;
}

function Earth() {
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  
  const [earthTexture, setEarthTexture] = useState<THREE.Texture | null>(null);
  const [cloudsTexture, setCloudsTexture] = useState<THREE.Texture | null>(null);
  const [bumpTexture, setBumpTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    const proceduralEarth = generateProceduralEarthTexture();
    const proceduralClouds = generateProceduralCloudsTexture();
    setEarthTexture(proceduralEarth);
    setCloudsTexture(proceduralClouds);
    
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';
    
    let loaded = 0;
    const total = 3;
    
    const checkAllLoaded = () => {
      loaded++;
      console.log(`[Earth] Remote texture loaded: ${loaded}/${total}`);
    };

    loader.load(
      EARTH_TEXTURE_URL,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 16;
        setEarthTexture(tex);
        console.log('[Earth] Using high-res satellite texture');
        checkAllLoaded();
      },
      undefined,
      (err) => {
        console.error('[Earth] Failed to load remote earth texture, using procedural:', err);
        checkAllLoaded();
      }
    );

    loader.load(
      CLOUDS_TEXTURE_URL,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 16;
        setCloudsTexture(tex);
        console.log('[Earth] Using high-res clouds texture');
        checkAllLoaded();
      },
      undefined,
      (err) => {
        console.error('[Earth] Failed to load remote clouds texture, using procedural:', err);
        checkAllLoaded();
      }
    );

    loader.load(
      BUMP_TEXTURE_URL,
      (tex) => {
        tex.anisotropy = 16;
        setBumpTexture(tex);
        checkAllLoaded();
      },
      undefined,
      (err) => {
        console.error('[Earth] Failed to load bump texture:', err);
        checkAllLoaded();
      }
    );
  }, []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (earthRef.current) {
      earthRef.current.rotation.y = time * 0.05;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y = time * 0.07;
    }
  });

  return (
    <group>
      <mesh ref={earthRef}>
        <sphereGeometry args={[EARTH_RADIUS, 128, 128]} />
        <meshStandardMaterial
          map={earthTexture}
          bumpMap={bumpTexture}
          bumpScale={0.02}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {cloudsTexture && (
        <mesh ref={cloudsRef}>
          <sphereGeometry args={[EARTH_RADIUS * 1.01, 128, 128]} />
          <meshStandardMaterial
            map={cloudsTexture}
            transparent
            opacity={0.4}
            depthWrite={false}
          />
        </mesh>
      )}

      <mesh>
        <sphereGeometry args={[EARTH_RADIUS * 1.05, 64, 64]} />
        <meshBasicMaterial
          color="#4488ff"
          transparent
          opacity={0.05}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

function FieldLines({ show, reversalActive }: { show: boolean; reversalActive: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points[]>([]);
  const particleProgressRef = useRef<{ progress: number; speedFactor: number }[]>([]);

  const fieldLines = useMemo((): FieldLineData[] => {
    const lines = generateFieldLines(36, 180, reversalActive ? -1 : 1);
    return lines.map((line) => {
      const cumulativeDistances: number[] = [0];
      let totalLength = 0;
      for (let i = 1; i < line.points.length; i++) {
        const dx = line.points[i].x - line.points[i - 1].x;
        const dy = line.points[i].y - line.points[i - 1].y;
        const dz = line.points[i].z - line.points[i - 1].z;
        totalLength += Math.sqrt(dx * dx + dy * dy + dz * dz);
        cumulativeDistances.push(totalLength);
      }
      return {
        ...line,
        totalLength,
        cumulativeDistances,
      };
    });
  }, [reversalActive]);

  useEffect(() => {
    if (!groupRef.current) return;
    
    particlesRef.current.forEach((p) => {
      groupRef.current?.remove(p);
      p.geometry.dispose();
      (p.material as THREE.Material).dispose();
    });
    particlesRef.current = [];
    particleProgressRef.current = [];

    if (!show) return;

    console.log(`[FieldLines] Creating ${fieldLines.length} field lines with flowing particles`);

    fieldLines.forEach((line, lineIndex) => {
      const particleCount = Math.floor(line.points.length * 0.4);
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);

      const progresses: { progress: number; speedFactor: number }[] = [];
      for (let i = 0; i < particleCount; i++) {
        progresses.push({
          progress: Math.random(),
          speedFactor: 0.5 + Math.random() * 0.5,
        });
      }
      particleProgressRef.current.push(...progresses);

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const material = new THREE.PointsMaterial({
        size: 0.02,
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      });

      const points = new THREE.Points(geometry, material);
      points.userData = { lineData: line, particleCount, startIndex: lineIndex * particleCount };
      groupRef.current?.add(points);
      particlesRef.current.push(points);
    });

    console.log(`[FieldLines] Total particles: ${particleProgressRef.current.length}`);
  }, [fieldLines, show]);

  const getPointOnLine = useCallback((line: FieldLineData, progress: number): { position: THREE.Vector3; intensity: number } => {
    const targetDistance = progress * line.totalLength;
    
    let low = 0;
    let high = line.cumulativeDistances.length - 1;
    
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (line.cumulativeDistances[mid] < targetDistance) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }
    
    const idx = Math.max(0, low - 1);
    const nextIdx = Math.min(idx + 1, line.points.length - 1);
    
    if (idx === nextIdx || idx >= line.cumulativeDistances.length - 1) {
      const p = line.points[Math.min(idx, line.points.length - 1)];
      return {
        position: new THREE.Vector3(p.x, p.y, p.z).multiplyScalar(SCALE_FACTOR),
        intensity: p.intensity,
      };
    }
    
    const segStart = line.cumulativeDistances[idx];
    const segEnd = line.cumulativeDistances[nextIdx];
    const segLength = segEnd - segStart;
    const frac = segLength > 0 ? (targetDistance - segStart) / segLength : 0;
    
    const p1 = line.points[idx];
    const p2 = line.points[nextIdx];
    
    return {
      position: new THREE.Vector3(
        p1.x + (p2.x - p1.x) * frac,
        p1.y + (p2.y - p1.y) * frac,
        p1.z + (p2.z - p1.z) * frac
      ).multiplyScalar(SCALE_FACTOR),
      intensity: p1.intensity + (p2.intensity - p1.intensity) * frac,
    };
  }, []);

  useFrame((_state, delta) => {
    if (!show || particlesRef.current.length === 0) return;
    
    const baseSpeed = 0.08;
    
    let particleIdx = 0;
    
    for (const points of particlesRef.current) {
      const { lineData, particleCount } = points.userData;
      const positions = points.geometry.attributes.position.array as Float32Array;
      const colors = points.geometry.attributes.color.array as Float32Array;
      
      for (let i = 0; i < particleCount; i++) {
        const particle = particleProgressRef.current[particleIdx];
        if (!particle) {
          particleIdx++;
          continue;
        }
        
        const currentPoint = getPointOnLine(lineData, particle.progress);
        
        const intensityFactor = Math.min(Math.max((currentPoint.intensity - 20000) / 60000, 0.2), 1.5);
        const speed = baseSpeed * intensityFactor * particle.speedFactor;
        
        particle.progress = (particle.progress + delta * speed) % 1.0;
        
        positions[i * 3] = currentPoint.position.x;
        positions[i * 3 + 1] = currentPoint.position.y;
        positions[i * 3 + 2] = currentPoint.position.z;
        
        const normIntensity = Math.min(Math.max((currentPoint.intensity - 20000) / 60000, 0), 1);
        const r = normIntensity;
        const g = normIntensity * 0.3;
        const b = 1 - normIntensity * 0.7;
        
        colors[i * 3] = r;
        colors[i * 3 + 1] = g;
        colors[i * 3 + 2] = b;
        
        particleIdx++;
      }
      
      points.geometry.attributes.position.needsUpdate = true;
      points.geometry.attributes.color.needsUpdate = true;
    }
  });

  return <group ref={groupRef} visible={show} />;
}

function HeatmapLayer({ show, intensityScale, reversalActive }: { show: boolean; intensityScale: number; reversalActive: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);
  const updateTimerRef = useRef<number>(0);

  const generateHeatmapTexture = useCallback((): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    
    console.log('[Heatmap] Generating heatmap texture, scale:', intensityScale, 'reversal:', reversalActive);
    
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;
    
    let minIntensity = Infinity;
    let maxIntensity = -Infinity;
    const intensities: number[][] = [];
    
    for (let y = 0; y < canvas.height; y++) {
      intensities[y] = [];
      for (let x = 0; x < canvas.width; x++) {
        const lon = (x / canvas.width) * 360 - 180;
        const lat = 90 - (y / canvas.height) * 180;
        const field = calculateMagneticField(lat, lon, 0, reversalActive ? -1 : 1);
        const intensity = Number.isFinite(field.intensity) ? field.intensity : 30000;
        intensities[y][x] = intensity;
        minIntensity = Math.min(minIntensity, intensity);
        maxIntensity = Math.max(maxIntensity, intensity);
      }
    }
    
    if (!Number.isFinite(minIntensity) || !Number.isFinite(maxIntensity) || minIntensity >= maxIntensity) {
      minIntensity = 20000;
      maxIntensity = 80000;
    }
    
    console.log(`[Heatmap] Intensity range: ${minIntensity.toFixed(0)} - ${maxIntensity.toFixed(0)} nT`);
    
    const range = maxIntensity - minIntensity;
    
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const intensity = intensities[y][x];
        const normalized = Math.min(Math.max(((intensity - minIntensity) / range) * intensityScale, 0), 1);
        
        const r = Math.floor(normalized * 255);
        const g = Math.floor(normalized * 100);
        const b = Math.floor((1 - normalized) * 200);
        
        const idx = (y * canvas.width + x) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = Math.floor(normalized * 180 + 30);
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, [intensityScale, reversalActive]);

  useEffect(() => {
    if (show) {
      textureRef.current = generateHeatmapTexture();
    } else {
      if (textureRef.current) {
        textureRef.current.dispose();
        textureRef.current = null;
      }
    }
    return () => {
      if (textureRef.current) {
        textureRef.current.dispose();
      }
    };
  }, [show, generateHeatmapTexture]);

  useFrame((_, delta) => {
    if (!show || !meshRef.current) return;
    
    updateTimerRef.current += delta;
    if (updateTimerRef.current >= 1 / 30) {
      updateTimerRef.current = 0;
      textureRef.current = generateHeatmapTexture();
      if (meshRef.current) {
        (meshRef.current.material as THREE.MeshBasicMaterial).map = textureRef.current;
        (meshRef.current.material as THREE.Material).needsUpdate = true;
      }
    }
  });

  if (!show || !textureRef.current) return null;

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[EARTH_RADIUS * 1.002, 64, 64]} />
      <meshBasicMaterial
        map={textureRef.current}
        transparent
        opacity={0.5}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

function ArrowGrid({ show, intensityScale, reversalActive }: { show: boolean; intensityScale: number; reversalActive: boolean }) {
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const latSteps = 12;
  const lonSteps = 24;
  const arrowCount = latSteps * lonSteps;

  const arrowData = useMemo(() => {
    const data: { position: THREE.Vector3; direction: THREE.Vector3; intensity: number; lat: number; lon: number }[] = [];
    
    console.log(`[ArrowGrid] Calculating ${arrowCount} arrow directions...`);
    
    for (let i = 0; i < latSteps; i++) {
      const lat = -80 + (i / (latSteps - 1)) * 160;
      for (let j = 0; j < lonSteps; j++) {
        const lon = (j / lonSteps) * 360 - 180;
        const latRad = (lat * Math.PI) / 180;
        const lonRad = (lon * Math.PI) / 180;
        const pos = new THREE.Vector3(
          Math.cos(latRad) * Math.cos(lonRad),
          Math.sin(latRad),
          Math.cos(latRad) * Math.sin(lonRad)
        ).multiplyScalar(EARTH_RADIUS * 1.02);
        
        const field = calculateMagneticField(lat, lon, 0, reversalActive ? -1 : 1);
        
        data.push({
          position: pos,
          direction: new THREE.Vector3(field.direction.x, field.direction.y, field.direction.z).normalize(),
          intensity: field.intensity,
          lat,
          lon,
        });
      }
    }
    
    const avgIntensity = data.reduce((sum, d) => sum + d.intensity, 0) / data.length;
    console.log(`[ArrowGrid] Average intensity: ${avgIntensity.toFixed(0)} nT`);
    
    return data;
  }, [reversalActive, arrowCount]);

  useEffect(() => {
    if (!instancedMeshRef.current) return;
    
    console.log(`[ArrowGrid] Updating arrow transforms, show=${show}`);
    
    arrowData.forEach((data, i) => {
      dummy.position.copy(data.position);
      
      const arrowDir = data.direction.clone();
      const up = new THREE.Vector3(0, 1, 0);
      
      const quaternion = new THREE.Quaternion();
      if (arrowDir.dot(up) > 0.99) {
        quaternion.identity();
      } else if (arrowDir.dot(up) < -0.99) {
        quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI);
      } else {
        const axis = new THREE.Vector3().crossVectors(up, arrowDir).normalize();
        const angle = Math.acos(up.dot(arrowDir));
        quaternion.setFromAxisAngle(axis, angle);
      }
      
      dummy.quaternion.copy(quaternion);
      
      const normIntensity = Math.min(Math.max((data.intensity - 20000) / 60000, 0), 1);
      const scale = 0.015 + normIntensity * 0.04 * intensityScale;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      
      instancedMeshRef.current!.setMatrixAt(i, dummy.matrix);
      
      const r = normIntensity;
      const g = normIntensity * 0.3;
      const b = 1 - normIntensity * 0.7;
      const color = new THREE.Color(r, g, b);
      instancedMeshRef.current!.setColorAt(i, color);
    });
    
    instancedMeshRef.current.instanceMatrix.needsUpdate = true;
    if (instancedMeshRef.current.instanceColor) {
      instancedMeshRef.current.instanceColor.needsUpdate = true;
    }
    
    if (arrowData.length > 0) {
      const sample = arrowData[0];
      const normIntensity = Math.min(Math.max((sample.intensity - 20000) / 60000, 0), 1);
      const r = normIntensity;
      const g = normIntensity * 0.3;
      const b = 1 - normIntensity * 0.7;
      console.log(`[ArrowGrid] Sample arrow at (${sample.lat.toFixed(1)}, ${sample.lon.toFixed(1)}):`);
      console.log(`  Direction: (${sample.direction.x.toFixed(3)}, ${sample.direction.y.toFixed(3)}, ${sample.direction.z.toFixed(3)})`);
      console.log(`  Intensity: ${sample.intensity.toFixed(0)} nT, Normalized: ${normIntensity.toFixed(3)}`);
      console.log(`  Color: rgb(${Math.floor(r*255)}, ${Math.floor(g*255)}, ${Math.floor(b*255)})`);
    }
  }, [arrowData, intensityScale, dummy]);

  return (
    <instancedMesh ref={instancedMeshRef} args={[undefined, undefined, arrowCount]} visible={show}>
      <coneGeometry args={[1, 2, 6]} />
      <meshBasicMaterial vertexColors toneMapped={false} />
    </instancedMesh>
  );
}

function RippleEffect({ point }: { point: { x: number; y: number; z: number } | null }) {
  const ringGroupRef = useRef<THREE.Group>(null);
  const rippleDataRef = useRef<{ startTime: number; position: THREE.Vector3; normal: THREE.Vector3 } | null>(null);
  const rippleKeyRef = useRef(0);

  useEffect(() => {
    if (point) {
      rippleKeyRef.current++;
      const pos = new THREE.Vector3(point.x, point.y, point.z);
      const normal = pos.clone().normalize();
      rippleDataRef.current = {
        startTime: performance.now(),
        position: pos,
        normal,
      };
      console.log(`[RippleEffect] Creating ripple at point:`, point);
    }
  }, [point]);

  useFrame(() => {
    if (!ringGroupRef.current || !rippleDataRef.current) return;
    
    const { startTime, position, normal } = rippleDataRef.current;
    const elapsed = (performance.now() - startTime) / 1000;
    
    if (elapsed > 1.5) {
      rippleDataRef.current = null;
      while (ringGroupRef.current.children.length > 0) {
        const child = ringGroupRef.current.children[0] as THREE.Mesh;
        child.geometry?.dispose();
        (child.material as THREE.Material)?.dispose();
        ringGroupRef.current.remove(child);
      }
      return;
    }
    
    if (ringGroupRef.current.children.length === 0) {
      for (let i = 0; i < 3; i++) {
        const delay = i * 0.2;
        const geometry = new THREE.RingGeometry(0.95, 1.05, 64);
        const material = new THREE.MeshBasicMaterial({
          color: new THREE.Color().setHSL(0.55, 1, 0.6),
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
        });
        
        const ring = new THREE.Mesh(geometry, material);
        ring.position.copy(position);
        
        const up = new THREE.Vector3(0, 1, 0);
        const quaternion = new THREE.Quaternion();
        if (normal.dot(up) < 0.99) {
          const axis = new THREE.Vector3().crossVectors(up, normal).normalize();
          const angle = Math.acos(up.dot(normal));
          quaternion.setFromAxisAngle(axis, angle);
        }
        ring.quaternion.copy(quaternion);
        
        ring.userData = { delay };
        ringGroupRef.current.add(ring);
      }
    }
    
    ringGroupRef.current.children.forEach((child) => {
      const ring = child as THREE.Mesh;
      const delay = ring.userData.delay || 0;
      const ringElapsed = Math.max(0, elapsed - delay);
      
      if (ringElapsed < 1.2) {
        const progress = ringElapsed / 1.2;
        const scale = 0.1 + progress * 0.8;
        const opacity = Math.max(0, 0.8 - progress * 0.8);
        
        ring.scale.setScalar(scale);
        (ring.material as THREE.MeshBasicMaterial).opacity = opacity;
        (ring.material as THREE.Material).needsUpdate = true;
      } else {
        (ring.material as THREE.MeshBasicMaterial).opacity = 0;
      }
    });
  });

  return (
    <group ref={ringGroupRef} key={rippleKeyRef.current} />
  );
}

export default function EarthScene() {
  const { selectedPoint, setSelectedPoint, showHeatmap, showArrowGrid, showFieldLines, intensityScale, reversalActive } = useAppStore();
  
  const handleEarthClick = (event: any) => {
    event.stopPropagation();
    const point = event.point;
    const latLon = vectorToLatLon(point.x, point.y, point.z);
    const field = calculateMagneticField(latLon.lat, latLon.lon, 0, reversalActive ? -1 : 1);
    
    const scaledIntensity = field.intensity * intensityScale;
    
    console.log('========================================');
    console.log('[EarthClick] Point clicked:');
    console.log(`  World position: (${point.x.toFixed(3)}, ${point.y.toFixed(3)}, ${point.z.toFixed(3)})`);
    console.log(`  Latitude: ${latLon.lat.toFixed(2)}°`);
    console.log(`  Longitude: ${latLon.lon.toFixed(2)}°`);
    console.log(`  Magnetic Field Intensity: ${field.intensity.toFixed(2)} nT (scaled: ${scaledIntensity.toFixed(2)} nT)`);
    console.log(`  Inclination: ${field.inclination.toFixed(2)}°`);
    console.log(`  Declination: ${field.declination.toFixed(2)}°`);
    console.log(`  Direction vector: (${field.direction.x.toFixed(4)}, ${field.direction.y.toFixed(4)}, ${field.direction.z.toFixed(4)})`);
    console.log('========================================');
    
    setSelectedPoint({
      lat: latLon.lat,
      lon: latLon.lon,
      intensity: scaledIntensity,
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

      <Stars radius={100} depth={50} count={8000} factor={4} saturation={0} fade speed={1} />

      <group onClick={handleEarthClick}>
        <mesh>
          <sphereGeometry args={[EARTH_RADIUS * 1.001, 64, 64]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
        <Earth />
      </group>

      <FieldLines show={showFieldLines} reversalActive={reversalActive} />
      <HeatmapLayer show={showHeatmap} intensityScale={intensityScale} reversalActive={reversalActive} />
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
