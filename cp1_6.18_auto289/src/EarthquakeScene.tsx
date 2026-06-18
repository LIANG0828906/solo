import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Html, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { useEarthquakeStore } from './earthquakeStore';
import {
  EarthquakeData,
  magnitudeToSize,
  depthToColor,
  lonLatToVector3,
} from './utils';

interface EarthquakePointProps {
  data: EarthquakeData;
  isVisible: boolean;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: (id: number) => void;
  onHover: (id: number | null) => void;
}

function EarthquakePoint({
  data,
  isVisible,
  isSelected,
  isHovered,
  onSelect,
  onHover,
}: EarthquakePointProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const opacityRef = useRef(0);
  const targetOpacity = isVisible ? 1 : 0;
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const position = useMemo(
    () => lonLatToVector3(data.longitude, data.latitude, data.depth, 2),
    [data.longitude, data.latitude, data.depth]
  );
  const baseSize = useMemo(() => magnitudeToSize(data.magnitude), [data.magnitude]);
  const baseColor = useMemo(() => depthToColor(data.depth), [data.depth]);

  const displayColor = useMemo(
    () => (isHovered ? [1, 1, 1] as [number, number, number] : baseColor),
    [isHovered, baseColor]
  );

  const coreScale = isSelected ? baseSize * 2 : isHovered ? baseSize * 1.3 : baseSize;
  const haloBaseScale = 1.15;
  const colorHex = useMemo(() => {
    const c = new THREE.Color(displayColor[0], displayColor[1], displayColor[2]);
    return `#${c.getHexString()}`;
  }, [displayColor]);

  useFrame((_, delta) => {
    const diff = targetOpacity - opacityRef.current;
    opacityRef.current += diff * Math.min(delta * 4, 1);

    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = opacityRef.current;
      mat.color.set(colorHex);
      meshRef.current.scale.setScalar(coreScale);
    }

    if (haloRef.current) {
      const mat = haloRef.current.material as THREE.MeshBasicMaterial;
      if (isSelected) {
        const pulse = haloBaseScale * (0.8 + 1.0 * (0.5 + 0.5 * Math.sin(performance.now() * 0.004 * Math.PI)));
        haloRef.current.scale.setScalar(pulse);
        mat.opacity = opacityRef.current * 0.3;
      } else {
        haloRef.current.scale.setScalar(haloBaseScale);
        mat.opacity = opacityRef.current * 0.15;
      }
      mat.color.set(colorHex);
    }
  });

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onHover(data.id);
    setShowTooltip(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerOut = () => {
    onHover(null);
    setShowTooltip(false);
    document.body.style.cursor = 'auto';
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect(data.id);
  };

  const threeColor = useMemo(() => new THREE.Color(colorHex), [colorHex]);

  return (
    <group position={position}>
      <mesh
        ref={haloRef}
        scale={haloBaseScale}
      >
        <sphereGeometry args={[baseSize, 12, 12]} />
        <meshBasicMaterial
          transparent
          opacity={0.15}
          depthWrite={false}
          depthTest={true}
          color={threeColor}
          toneMapped={false}
        />
      </mesh>
      <mesh
        ref={meshRef}
        onPointerOver={handlePointerOver}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <sphereGeometry args={[baseSize, 20, 20]} />
        <meshBasicMaterial
          transparent
          opacity={0}
          color={threeColor}
          toneMapped={false}
        />
      </mesh>
      {showTooltip && (
        <Html
          position={[0, 0, 0]}
          style={{
            pointerEvents: 'none',
            transform: `translate(${tooltipPos.x + 15}px, ${tooltipPos.y + 15}px)`,
          }}
          zIndexRange={[100, 0]}
        >
          <div
            style={{
              background: '#1A1A2E',
              color: '#E0E0E0',
              padding: '8px 12px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              fontSize: '13px',
              whiteSpace: 'nowrap',
              fontFamily: 'monospace',
            }}
          >
            <div>震级: {data.magnitude.toFixed(1)}</div>
            <div>深度: {data.depth.toFixed(0)} km</div>
          </div>
        </Html>
      )}
    </group>
  );
}

function Earth() {
  return (
    <Sphere args={[1.95, 64, 64]}>
      <meshBasicMaterial
        color="#1a2332"
        transparent
        opacity={0.6}
        wireframe={false}
      />
    </Sphere>
  );
}

function GridLines() {
  const lines = useMemo(() => {
    const meridians: THREE.Line[] = [];
    for (let lon = -180; lon < 180; lon += 30) {
      const points: THREE.Vector3[] = [];
      for (let lat = -90; lat <= 90; lat += 5) {
        const pos = lonLatToVector3(lon, lat, 0, 1.98);
        points.push(new THREE.Vector3(pos[0], pos[1], pos[2]));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      meridians.push(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: '#2a3a4a', transparent: true, opacity: 0.4 })));
    }
    const parallels: THREE.Line[] = [];
    for (let lat = -60; lat <= 60; lat += 30) {
      const points: THREE.Vector3[] = [];
      for (let lon = -180; lon <= 180; lon += 5) {
        const pos = lonLatToVector3(lon, lat, 0, 1.98);
        points.push(new THREE.Vector3(pos[0], pos[1], pos[2]));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      parallels.push(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: '#2a3a4a', transparent: true, opacity: 0.4 })));
    }
    return [...meridians, ...parallels];
  }, []);

  return (
    <group>
      {lines.map((line, i) => (
        <primitive key={i} object={line} />
      ))}
    </group>
  );
}

function Scene() {
  const {
    earthquakes,
    startTime,
    endTime,
    selectedId,
    hoveredId,
    setSelected,
    setHovered,
  } = useEarthquakeStore();

  const visibleIds = useMemo(() => {
    const set = new Set<number>();
    earthquakes.forEach((eq) => {
      if (eq.timestamp >= startTime && eq.timestamp <= endTime) {
        set.add(eq.id);
      }
    });
    return set;
  }, [earthquakes, startTime, endTime]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <Earth />
      <GridLines />
      {earthquakes.map((eq) => (
        <EarthquakePoint
          key={eq.id}
          data={eq}
          isVisible={visibleIds.has(eq.id)}
          isSelected={selectedId === eq.id}
          isHovered={hoveredId === eq.id}
          onSelect={setSelected}
          onHover={setHovered}
        />
      ))}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={3}
        maxDistance={15}
      />
    </>
  );
}

export default function EarthquakeScene() {
  return (
    <Canvas
      camera={{ position: [0, 2, 9], fov: 45 }}
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 2]}
      style={{ background: '#0D1117' }}
      onPointerMissed={() => {
        const { setSelected, setHovered } = useEarthquakeStore.getState();
        setSelected(null);
        setHovered(null);
      }}
    >
      <Scene />
    </Canvas>
  );
}
