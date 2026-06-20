import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from './store';
import {
  getMainCurrents,
  getSeasonalCurrents,
  getCurrentColor,
  latLonToVector3,
  type OceanCurrent,
  type Season,
} from './oceanCurrents';
import {
  getTemperatureGrid,
  type TemperatureGrid,
  type RgbColor,
} from './temperatureGrid';

const EARTH_RADIUS = 2;
const PATH_RADIUS = EARTH_RADIUS + 0.02;
const PARTICLE_RADIUS = EARTH_RADIUS + 0.035;
const GRID_RADIUS = EARTH_RADIUS + 0.01;
const TRANSITION_DURATION = 2;
const PARTICLES_PER_CURRENT = 80;

type CurrentWithPoints = OceanCurrent & {
  vectors: THREE.Vector3[];
};

function lerpColor(a: RgbColor, b: RgbColor, t: number): RgbColor {
  const p = Math.max(0, Math.min(1, t));
  return {
    r: a.r + (b.r - a.r) * p,
    g: a.g + (b.g - a.g) * p,
    b: a.b + (b.b - a.b) * p,
  };
}

function rgbToHex(color: RgbColor): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  return `rgb(${r}, ${g}, ${b})`;
}

interface StarParticlesProps {
  count?: number;
}

function StarParticles({ count = 600 }: StarParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const starData = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const baseAlphas = new Float32Array(count);
    const phases = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = 50 + Math.random() * 80;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      sizes[i] = 0.05 + Math.random() * 0.1;
      baseAlphas[i] = 0.3 + Math.random() * 0.5;
      phases[i] = Math.random() * Math.PI * 2;
    }
    return { positions, sizes, baseAlphas, phases };
  }, [count]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const material = pointsRef.current.material as THREE.PointsMaterial;
    const time = state.clock.elapsedTime;
    const avgAlpha = starData.baseAlphas.reduce((a, b) => a + b, 0) / count;
    const avgPulse = Math.sin(time * 0.8) * 0.15 + 0.85;
    material.opacity = Math.max(0.2, Math.min(0.9, avgAlpha * avgPulse));
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={starData.positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        color="#ffffff"
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

interface OceanPathLineProps {
  current: CurrentWithPoints;
  baseOpacity: number;
  isHighlighted: boolean;
}

function OceanPathLine({
  current,
  baseOpacity,
  isHighlighted,
}: OceanPathLineProps) {
  const { camera } = useThree();
  const lineRef = useRef<THREE.Line>(null);
  const baseOpacityRef = useRef(baseOpacity);
  const isHighlightedRef = useRef(isHighlighted);

  useEffect(() => {
    baseOpacityRef.current = baseOpacity;
  }, [baseOpacity]);

  useEffect(() => {
    isHighlightedRef.current = isHighlighted;
  }, [isHighlighted]);

  const lineObject = useMemo(() => {
    const positions = new Float32Array(current.vectors.length * 3);
    const colors = new Float32Array(current.vectors.length * 3);
    for (let i = 0; i < current.vectors.length; i++) {
      const v = current.vectors[i];
      positions[i * 3] = v.x;
      positions[i * 3 + 1] = v.y;
      positions[i * 3 + 2] = v.z;
      const progress = i / (current.vectors.length - 1);
      const c = getCurrentColor(current.type, progress);
      colors[i * 3] = c.r / 255;
      colors[i * 3 + 1] = c.g / 255;
      colors[i * 3 + 2] = c.b / 255;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });
    return new THREE.Line(geo, mat);
  }, [current]);

  useEffect(() => {
    const mat = lineObject.material as THREE.LineBasicMaterial;
    mat.opacity = baseOpacity * (isHighlighted ? 1 : 0.9);
  }, [lineObject, baseOpacity, isHighlighted]);

  useFrame(() => {
    if (!lineRef.current) return;
    const mat = lineRef.current.material as THREE.LineBasicMaterial;
    const distance = camera.position.length();
    const base = Math.max(0.2, 0.35 * (distance / 6));
    const width = isHighlightedRef.current ? base * 2 : base;
    mat.linewidth = width;
    mat.opacity = baseOpacityRef.current * (isHighlightedRef.current ? 1 : 0.9);
  });

  return <primitive ref={lineRef} object={lineObject} />;
}

interface OceanParticlesProps {
  current: CurrentWithPoints;
  baseOpacity: number;
  particleSpeed: number;
}

function OceanParticles({
  current,
  baseOpacity,
  particleSpeed,
}: OceanParticlesProps) {
  const localTime = useRef(0);
  const pointsRef = useRef<THREE.Points>(null);
  const particleSpeedRef = useRef(particleSpeed);
  const baseOpacityRef = useRef(baseOpacity);
  const numParticles = PARTICLES_PER_CURRENT;

  useEffect(() => {
    particleSpeedRef.current = particleSpeed;
  }, [particleSpeed]);

  useEffect(() => {
    baseOpacityRef.current = baseOpacity;
  }, [baseOpacity]);

  const { baseProgresses } = useMemo(() => {
    const baseProgresses = new Float32Array(numParticles);
    for (let i = 0; i < numParticles; i++) {
      baseProgresses[i] = i / numParticles;
    }
    return { baseProgresses };
  }, [numParticles]);

  useEffect(() => {
    if (!pointsRef.current) return;
    const geo = pointsRef.current.geometry;
    if (!geo.getAttribute('position')) {
      geo.setAttribute(
        'position',
        new THREE.BufferAttribute(new Float32Array(numParticles * 3), 3)
      );
    }
    if (!geo.getAttribute('color')) {
      geo.setAttribute(
        'color',
        new THREE.BufferAttribute(new Float32Array(numParticles * 3), 3)
      );
    }
  }, [numParticles]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    localTime.current += delta;
    const geo = pointsRef.current.geometry;
    const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
    const colorAttr = geo.getAttribute('color') as THREE.BufferAttribute;
    const speedFactor = particleSpeedRef.current * 0.12;
    const mat = pointsRef.current.material as THREE.PointsMaterial;
    mat.opacity = baseOpacityRef.current * 1.0;

    for (let i = 0; i < numParticles; i++) {
      let progress =
        (baseProgresses[i] + localTime.current * speedFactor) % 1;
      if (progress < 0) progress += 1;

      const exactIndex = progress * (current.vectors.length - 1);
      const idx = Math.floor(exactIndex);
      const t = exactIndex - idx;
      const nextIdx = Math.min(idx + 1, current.vectors.length - 1);

      const v1 = current.vectors[idx];
      const v2 = current.vectors[nextIdx];
      const x = v1.x + (v2.x - v1.x) * t;
      const y = v1.y + (v2.y - v1.y) * t;
      const z = v1.z + (v2.z - v1.z) * t;

      posAttr.setXYZ(i, x, y, z);

      const c = getCurrentColor(current.type, progress);
      colorAttr.setXYZ(i, c.r / 255, c.g / 255, c.b / 255);
    }
    posAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry />
      <pointsMaterial
        size={0.055}
        vertexColors
        transparent
        opacity={baseOpacity * 1.0}
        sizeAttenuation
        blending={THREE.NormalBlending}
        depthWrite={false}
      />
    </points>
  );
}

interface TemperatureGridMeshProps {
  prevGrid: TemperatureGrid;
  nextGrid: TemperatureGrid;
  transitionProgress: number;
}

function TemperatureGridMesh({
  prevGrid,
  nextGrid,
  transitionProgress,
}: TemperatureGridMeshProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const prevGridRef = useRef(prevGrid);
  const nextGridRef = useRef(nextGrid);
  const progressRef = useRef(transitionProgress);
  const tempColor = useMemo(() => new THREE.Color(), []);

  useEffect(() => {
    prevGridRef.current = prevGrid;
  }, [prevGrid]);

  useEffect(() => {
    nextGridRef.current = nextGrid;
  }, [nextGrid]);

  useEffect(() => {
    progressRef.current = transitionProgress;
  }, [transitionProgress]);

  const gridData = useMemo(() => {
    const count = prevGrid.data.length;
    const dummy = new THREE.Object3D();
    const positions: Array<{ lon: number; lat: number; index: number }> = [];

    for (let i = 0; i < count; i++) {
      const { lon, lat } = prevGrid.data[i];
      const pos = latLonToVector3(lat, lon, GRID_RADIUS);
      const v = new THREE.Vector3(pos[0], pos[1], pos[2]);
      dummy.position.copy(v);
      dummy.lookAt(new THREE.Vector3(0, 0, 0));
      dummy.rotateX(Math.PI / 2);
      const scale = 0.12;
      dummy.scale.set(scale, scale, 1);
      dummy.updateMatrix();
      meshRef.current?.setMatrixAt(i, dummy.matrix);
      positions.push({ lon, lat, index: i });
    }
    if (meshRef.current) {
      meshRef.current.instanceMatrix.needsUpdate = true;
    }

    return { count, positions };
  }, [prevGrid]);

  useFrame(() => {
    if (!meshRef.current) return;
    const p = Math.max(0, Math.min(1, progressRef.current));
    const prev = prevGridRef.current.data;
    const next = nextGridRef.current.data;
    const count = prev.length;

    for (let i = 0; i < count; i++) {
      const prevColor = prev[i].color;
      const nextColor = next[i].color;
      const r = prevColor.r + (nextColor.r - prevColor.r) * p;
      const g = prevColor.g + (nextColor.g - prevColor.g) * p;
      const b = prevColor.b + (nextColor.b - prevColor.b) * p;
      tempColor.setRGB(r, g, b);
      meshRef.current.setColorAt(i, tempColor);
    }
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  const displayData = useMemo(() => {
    const p = Math.max(0, Math.min(1, transitionProgress));
    return prevGrid.data.map((prev, i) => {
      const next = nextGrid.data[i];
      const temp = prev.temperature + (next.temperature - prev.temperature) * p;
      const color = lerpColor(prev.color, next.color, p);
      return { lon: prev.lon, lat: prev.lat, temp, color, index: i };
    });
  }, [prevGrid, nextGrid, transitionProgress]);

  return (
    <group>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, gridData.count]}
        frustumCulled={false}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          transparent
          opacity={0.55}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </instancedMesh>
      {displayData
        .filter((d) => d.index % 6 === 0 || (d.lat % 36 === 0 && d.index % 3 === 0))
        .map((d) => {
          const pos = latLonToVector3(d.lat, d.lon, GRID_RADIUS + 0.06);
          return (
            <Html
              key={`temp-label-${d.index}`}
              position={pos}
              style={{
                color: rgbToHex(d.color),
                fontSize: '7px',
                fontFamily: 'JetBrains Mono, monospace',
                fontWeight: 700,
                textShadow: '0 0 3px rgba(0,0,0,0.8)',
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
                opacity: 0.85,
              }}
              center
              distanceFactor={10}
            >
              {d.temp.toFixed(1)}°C
            </Html>
          );
        })}
    </group>
  );
}

export default function Earth() {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const earthRef = useRef<THREE.Mesh>(null);
  const globalTime = useRef(0);
  const cameraDistance = useRef(6);

  const season = useAppStore((s) => s.season);
  const previousSeason = useAppStore((s) => s.previousSeason);
  const visibleCurrents = useAppStore((s) => s.visibleCurrents);
  const particleSpeed = useAppStore((s) => s.particleSpeed);
  const highlightedCurrent = useAppStore((s) => s.highlightedCurrent);
  const isTransitioning = useAppStore((s) => s.isTransitioning);
  const transitionProgress = useAppStore((s) => s.transitionProgress);
  const updateTransitionProgress = useAppStore((s) => s.updateTransitionProgress);
  const endTransition = useAppStore((s) => s.endTransition);
  const getSeasonalOpacity = useAppStore((s) => s.getSeasonalOpacity);

  const mainCurrents = useMemo(() => getMainCurrents(), []);
  const seasonalPrev = useMemo(
    () => getSeasonalCurrents(previousSeason),
    [previousSeason]
  );
  const seasonalNext = useMemo(() => getSeasonalCurrents(season), [season]);

  const prevTempGrid = useMemo(
    () => getTemperatureGrid(previousSeason),
    [previousSeason]
  );
  const nextTempGrid = useMemo(
    () => getTemperatureGrid(season),
    [season]
  );

  const earthTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#1a3a5c');
    gradient.addColorStop(0.3, '#1e4d6b');
    gradient.addColorStop(0.5, '#1b5e7a');
    gradient.addColorStop(0.7, '#1e4d6b');
    gradient.addColorStop(1, '#1a3a5c');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 512);

    const continents: Array<[number, number, number, number, string]> = [
      [180, 180, 150, 90, '#2d5016'],
      [520, 170, 140, 100, '#2d5016'],
      [400, 250, 90, 150, '#3d6b1e'],
      [600, 330, 80, 110, '#2d5016'],
      [150, 350, 130, 90, '#2d5016'],
      [780, 240, 100, 80, '#3d6b1e'],
      [830, 380, 110, 60, '#8b7355'],
      [500, 100, 50, 40, '#e8e8e8'],
      [50, 120, 40, 50, '#e8e8e8'],
      [880, 130, 40, 45, '#e8e8e8'],
    ];
    continents.forEach(([x, y, w, h, color]) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    for (let i = 0; i < 500; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.02 + Math.random() * 0.04})`;
      const cx = Math.random() * 1024;
      const cy = Math.random() * 512;
      const cr = 3 + Math.random() * 12;
      ctx.beginPath();
      ctx.ellipse(cx, cy, cr, cr * 0.6, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }, []);

  const allCurrentsWithVectors: CurrentWithPoints[] = useMemo(() => {
    const all = [
      ...mainCurrents,
      ...seasonalNext.filter(
        (s) => !mainCurrents.find((m) => m.id === s.id)
      ),
    ];
    return all.map((c) => ({
      ...c,
      vectors: c.points.map(
        ([lon, lat]) =>
          new THREE.Vector3(...latLonToVector3(lat, lon, PATH_RADIUS))
      ),
    }));
  }, [mainCurrents, seasonalNext]);

  useFrame((_, delta) => {
    globalTime.current += delta;
    if (controlsRef.current?.object) {
      cameraDistance.current = controlsRef.current.object.position.length();
    }
    if (isTransitioning) {
      const newProgress = transitionProgress + delta / TRANSITION_DURATION;
      if (newProgress >= 1) {
        endTransition();
      } else {
        updateTransitionProgress(newProgress);
      }
    }
    if (earthRef.current && !isTransitioning) {
      earthRef.current.rotation.y += delta * 0.02;
    }
  });

  return (
    <>
      <ambientLight intensity={0.3} color="#93c5fd" />
      <directionalLight
        position={[8, 5, 6]}
        intensity={1.2}
        color="#fff5e6"
        castShadow
      />
      <hemisphereLight
        args={['#4488ff', '#001133', 0.2]}
      />

      <StarParticles count={800} />
      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={0.5} />

      <mesh ref={earthRef}>
        <sphereGeometry args={[EARTH_RADIUS, 64, 48]} />
        <meshStandardMaterial
          map={earthTexture}
          roughness={0.85}
          metalness={0.05}
        />
      </mesh>

      <mesh>
        <sphereGeometry args={[EARTH_RADIUS * 1.005, 64, 48]} />
        <meshBasicMaterial
          color="#3b82f6"
          transparent
          opacity={0.06}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      <TemperatureGridMesh
        prevGrid={prevTempGrid}
        nextGrid={nextTempGrid}
        transitionProgress={isTransitioning ? transitionProgress : (season === previousSeason ? 0 : 1)}
      />

      {allCurrentsWithVectors.map((current) => {
        const isVisible = visibleCurrents.includes(current.id);
        if (!isVisible) return null;

        let opacity = 1;
        if (current.isSeasonal) {
          opacity = getSeasonalOpacity(current.id, isTransitioning ? transitionProgress : (
            current.seasons.includes(season as Season) ? 1 : 0
          ));
        }
        if (opacity <= 0.01) return null;

        const isHighlighted = highlightedCurrent === current.id;

        return (
          <group key={current.id}>
            <OceanPathLine
              current={current}
              baseOpacity={opacity}
              isHighlighted={isHighlighted}
            />
            <OceanParticles
              current={current}
              baseOpacity={opacity}
              particleSpeed={particleSpeed}
            />
          </group>
        );
      })}

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enablePan={false}
        minDistance={EARTH_RADIUS * 0.5 + 1}
        maxDistance={EARTH_RADIUS * 5 + 2}
        minPolarAngle={Math.PI / 2 - Math.PI / 3}
        maxPolarAngle={Math.PI / 2 + Math.PI / 3}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.6}
        zoomSpeed={0.7}
      />
    </>
  );
}
