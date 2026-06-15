import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Line } from '@react-three/drei';
import * as THREE from 'three';

import { useStarStore } from './store';
import {
  constellations,
  generateBackgroundStars,
  sphericalToCartesian,
  magnitudeColors,
  magnitudeSizes,
  DOME_RADIUS,
  Constellation,
  Star
} from './starsData';

interface StarPointProps {
  star: Star;
  constellationId: string;
  isBackground?: boolean;
}

function StarPoint({ star, constellationId, isBackground = false }: StarPointProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { hoveredStarId, highlightedConstellationId, setHoveredStarId, setHoveredConstellationId } = useStarStore();
  
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);
  const cycleDuration = useMemo(() => 2 + Math.random(), []);
  
  const isHovered = hoveredStarId === star.id;
  const isHighlighted = highlightedConstellationId === constellationId;
  const baseSize = magnitudeSizes[star.magnitude as keyof typeof magnitudeSizes];
  const baseColor = magnitudeColors[star.magnitude as keyof typeof magnitudeColors];
  
  const displaySize = isHovered ? baseSize * 1.5 : isHighlighted ? baseSize * 1.2 : baseSize;
  const displayColor = isHighlighted ? '#ff8c00' : baseColor;
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    const breathOpacity = 0.6 + 0.3 * Math.sin((time / cycleDuration) * Math.PI * 2 + phase);
    
    const material = meshRef.current.material as THREE.MeshBasicMaterial;
    material.opacity = isHovered 
      ? 0.7 + 0.3 * Math.sin(time * Math.PI * 2 / 0.6)
      : breathOpacity;
    
    meshRef.current.scale.setScalar(displaySize / baseSize);
  });

  const [x, y, z] = sphericalToCartesian(star.theta, star.phi, DOME_RADIUS - 0.1);
  
  const gradientTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.3, displayColor);
    gradient.addColorStop(0.6, displayColor + '99');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, [displayColor]);

  return (
    <mesh
      ref={meshRef}
      position={[x, y, z]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHoveredStarId(star.id);
        if (!isBackground) setHoveredConstellationId(constellationId);
      }}
      onPointerOut={() => {
        setHoveredStarId(null);
        if (!isBackground) setHoveredConstellationId(null);
      }}
    >
      <planeGeometry args={[baseSize * 2, baseSize * 2]} />
      <meshBasicMaterial
        map={gradientTexture}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
      {isHovered && star.name && (
        <Html
          position={[0, baseSize * 1.5, 0]}
          center
          distanceFactor={8}
          style={{ pointerEvents: 'none' }}
        >
          <div style={{
            color: '#ffffff',
            fontSize: '12px',
            fontFamily: 'SimSun, serif',
            textShadow: '0 0 4px rgba(0,0,0,0.8)',
            whiteSpace: 'nowrap',
            background: 'rgba(0,0,0,0.3)',
            padding: '2px 6px',
            borderRadius: '3px'
          }}>
            {star.name}
          </div>
        </Html>
      )}
    </mesh>
  );
}

interface ConstellationLinesProps {
  constellation: Constellation;
}

function ConstellationLines({ constellation }: ConstellationLinesProps) {
  const { hoveredConstellationId, highlightedConstellationId, selectedConstellation, setSelectedConstellation, setHoveredConstellationId } = useStarStore();
  
  const isHovered = hoveredConstellationId === constellation.id;
  const isHighlighted = highlightedConstellationId === constellation.id;
  const isSelected = selectedConstellation?.id === constellation.id;
  
  const lineColor = isHighlighted ? '#ff8c00' : isHovered ? '#ffd700' : 'rgba(255,255,255,0.4)';
  const lineWidth = isHighlighted ? 0.04 : 0.02;
  
  const lines = constellation.connections.map((conn) => {
    const star1 = constellation.stars[conn[0]];
    const star2 = constellation.stars[conn[1]];
    const p1 = sphericalToCartesian(star1.theta, star1.phi, DOME_RADIUS - 0.15);
    const p2 = sphericalToCartesian(star2.theta, star2.phi, DOME_RADIUS - 0.15);
    return [new THREE.Vector3(...p1), new THREE.Vector3(...p2)];
  });

  const centroid = useMemo(() => {
    const points = constellation.stars.map(s => 
      sphericalToCartesian(s.theta, s.phi, DOME_RADIUS - 0.1)
    );
    const avg = points.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1], acc[2] + p[2]], [0, 0, 0]);
    return [avg[0] / points.length, avg[1] / points.length, avg[2] / points.length] as [number, number, number];
  }, [constellation]);

  return (
    <group>
      {lines.map((points, idx) => (
        <Line
          key={idx}
          points={points}
          color={lineColor}
          lineWidth={lineWidth}
          transparent
          opacity={isHighlighted || isHovered ? 1 : 0.4}
        />
      ))}
      <mesh
        position={centroid}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedConstellation(constellation);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredConstellationId(constellation.id);
        }}
        onPointerOut={() => setHoveredConstellationId(null)}
      >
        <sphereGeometry args={[0.5, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      {(isHovered || isSelected) && (
        <Html
          position={[centroid[0], centroid[1] + 0.8, centroid[2]]}
          center
          distanceFactor={8}
          style={{ pointerEvents: 'none' }}
        >
          <div style={{
            color: isHighlighted ? '#ff8c00' : '#ffd700',
            fontSize: '18px',
            fontFamily: 'SimSun, serif',
            fontWeight: 'bold',
            textShadow: '0 0 8px rgba(0,0,0,0.9)',
            background: 'rgba(0,0,0,0.4)',
            padding: '4px 12px',
            borderRadius: '4px',
            border: `1px solid ${isHighlighted ? '#ff8c00' : '#ffd700'}40`
          }}>
            {constellation.name}
          </div>
        </Html>
      )}
    </group>
  );
}

function Dome() {
  return (
    <mesh>
      <sphereGeometry args={[DOME_RADIUS, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshStandardMaterial
        color="#e0e0e0"
        side={THREE.BackSide}
        transparent
        opacity={0.15}
        roughness={0.9}
        metalness={0.1}
      />
    </mesh>
  );
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
      <circleGeometry args={[DOME_RADIUS, 64]} />
      <meshStandardMaterial color="#4a4a4a" roughness={0.8} />
    </mesh>
  );
}

function BackgroundStars() {
  const stars = useMemo(() => generateBackgroundStars(130), []);
  return (
    <group>
      {stars.map((star) => (
        <StarPoint key={star.id} star={star} constellationId="background" isBackground />
      ))}
    </group>
  );
}

function ConstellationStars() {
  return (
    <group>
      {constellations.map((c) => (
        <group key={c.id}>
          {c.stars.map((s) => (
            <StarPoint key={s.id} star={s} constellationId={c.id} />
          ))}
          <ConstellationLines constellation={c} />
        </group>
      ))}
    </group>
  );
}

interface ScrollChartProps {
  onFoldClick: (constellation: Constellation) => void;
}

function ScrollChart({ onFoldClick }: ScrollChartProps) {
  const { isChartUnfolded, highlightedConstellationId, hoveredConstellationId, setHoveredConstellationId } = useStarStore();
  const groupRef = useRef<THREE.Group>(null);
  const starsRef = useRef<THREE.Group>(null);
  const scrollRef = useRef<THREE.Group>(null);
  const chartMeshRef = useRef<THREE.Mesh>(null);
  const bottomRollRef = useRef<THREE.Mesh>(null);
  const unfoldProgress = useRef(0);
  const unfoldStartTime = useRef(0);
  
  const CHART_WIDTH = 12;
  const CHART_HEIGHT = 5.33;
  const CHART_Y = DOME_RADIUS * 0.5;
  const CHART_Z = -DOME_RADIUS + 0.2;
  
  useEffect(() => {
    if (isChartUnfolded) {
      unfoldStartTime.current = performance.now();
    } else {
      unfoldProgress.current = 0;
    }
  }, [isChartUnfolded]);

  const canvasChart = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 400;
    const ctx = canvas.getContext('2d')!;
    
    ctx.fillStyle = '#d4a574';
    ctx.fillRect(0, 0, 800, 400);
    
    ctx.globalAlpha = 0.3;
    for (let i = 0; i < 500; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#c4956a' : '#e5b584';
      ctx.fillRect(Math.random() * 800, Math.random() * 400, 2, 2);
    }
    ctx.globalAlpha = 1;
    
    ctx.save();
    ctx.translate(400, 200);
    ctx.rotate(-Math.PI / 6);
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#888888';
    ctx.font = 'bold 36px SimSun, serif';
    ctx.textAlign = 'center';
    ctx.fillText('敦煌莫高窟第61窟', 0, 0);
    ctx.restore();
    
    const allStars = constellations.flatMap(c => c.stars.map(s => ({ ...s, constellationId: c.id })));
    allStars.forEach(star => {
      const x = (star.theta / 360) * 700 + 50;
      const y = ((90 - star.phi) / 90) * 320 + 40;
      const size = magnitudeSizes[star.magnitude as keyof typeof magnitudeSizes] * 12;
      
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2);
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.5, '#000000');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, size * 2, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(x, y, size * 0.6, 0, Math.PI * 2);
      ctx.fill();
    });
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    if (isChartUnfolded && unfoldProgress.current < 1) {
      const elapsed = (performance.now() - unfoldStartTime.current) / 1000;
      unfoldProgress.current = Math.min(1, elapsed / 1.2);
      const eased = 1 - Math.pow(1 - unfoldProgress.current, 3);
      
      if (scrollRef.current) {
        scrollRef.current.scale.y = eased;
      }
      if (bottomRollRef.current) {
        bottomRollRef.current.position.y = -CHART_HEIGHT + (1 - eased) * CHART_HEIGHT;
      }
    }
    
    if (!starsRef.current) return;
    
    starsRef.current.children.forEach((child, idx) => {
      const mesh = child as THREE.Mesh;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      const delay = idx * 0.05;
      const baseOpacity = isChartUnfolded ? Math.max(0, Math.min(0.6, (unfoldProgress.current * 1.2 - 0.5 - delay) / 0.5)) : 0;
      const breathOpacity = baseOpacity * (0.8 + 0.2 * Math.sin(time * 2 + idx * 0.5));
      mat.opacity = breathOpacity;
    });
  });

  const chartStars = useMemo(() => {
    return constellations.flatMap(c => c.stars.map(s => ({ ...s, constellationId: c.id, constellation: c })));
  }, []);

  if (!isChartUnfolded) return null;
  
  return (
    <group ref={groupRef}>
      <group position={[0, CHART_Y, CHART_Z]}>
        <group ref={scrollRef}>
          <mesh position={[0, -CHART_HEIGHT / 2, 0]} ref={chartMeshRef}>
            <planeGeometry args={[CHART_WIDTH, CHART_HEIGHT]} />
            <meshBasicMaterial
              map={canvasChart}
              transparent
              opacity={0.85}
              side={THREE.DoubleSide}
            />
          </mesh>

          <mesh position={[0, 0.1, 0.01]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.15, 0.15, CHART_WIDTH + 0.4, 16]} />
            <meshStandardMaterial color="#8b4513" metalness={0.6} roughness={0.4} />
          </mesh>

          <mesh position={[0, -CHART_HEIGHT, 0.01]} rotation={[0, 0, Math.PI / 2]} ref={bottomRollRef}>
            <cylinderGeometry args={[0.12, 0.12, CHART_WIDTH + 0.4, 16]} />
            <meshStandardMaterial color="#654321" metalness={0.6} roughness={0.4} />
          </mesh>
        </group>

        <group ref={starsRef}>
          {chartStars.map((star) => {
            const x = ((star.theta / 360) - 0.5) * CHART_WIDTH;
            const y = CHART_HEIGHT / 2 - ((90 - star.phi) / 90) * CHART_HEIGHT;
            const isHighlighted = highlightedConstellationId === star.constellationId;
            const isHovered = hoveredConstellationId === star.constellationId;
            
            return (
              <mesh
                key={`chart-${star.id}`}
                position={[x, y - CHART_HEIGHT / 2, 0.05]}
                onClick={(e) => {
                  e.stopPropagation();
                  onFoldClick(star.constellation);
                }}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  setHoveredConstellationId(star.constellationId);
                }}
                onPointerOut={() => setHoveredConstellationId(null)}
              >
                <circleGeometry args={[0.08, 16]} />
                <meshBasicMaterial
                  color={isHighlighted ? '#ff8c00' : isHovered ? '#ffd700' : '#000000'}
                  transparent
                  opacity={0}
                />
              </mesh>
            );
          })}
        </group>
      </group>
    </group>
  );
}

function CameraController() {
  const { viewMode, highlightedConstellationId, isSearching, setIsSearching } = useStarStore();
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const targetPosition = useRef(new THREE.Vector3(0, DOME_RADIUS * 0.5, DOME_RADIUS * 0.8));
  const targetLookAt = useRef(new THREE.Vector3(0, DOME_RADIUS * 0.3, 0));
  const isAnimating = useRef(false);

  useEffect(() => {
    if (viewMode === 'chart') {
      targetPosition.current.set(0, DOME_RADIUS * 0.5, DOME_RADIUS * 0.3);
      targetLookAt.current.set(0, DOME_RADIUS * 0.5, -DOME_RADIUS + 0.5);
      isAnimating.current = true;
      setTimeout(() => { isAnimating.current = false; }, 1500);
    } else {
      targetPosition.current.set(0, DOME_RADIUS * 0.5, DOME_RADIUS * 0.8);
      targetLookAt.current.set(0, DOME_RADIUS * 0.3, 0);
      isAnimating.current = true;
      setTimeout(() => { isAnimating.current = false; }, 1500);
    }
  }, [viewMode]);

  useEffect(() => {
    if (highlightedConstellationId && isSearching) {
      const c = constellations.find(c => c.id === highlightedConstellationId);
      if (c) {
        const [x, y, z] = sphericalToCartesian(c.centralStar.theta, c.centralStar.phi, DOME_RADIUS);
        const direction = new THREE.Vector3(x, y, z).normalize();
        const camDistance = DOME_RADIUS * 0.6;
        targetPosition.current.set(
          x - direction.x * camDistance,
          y - direction.y * camDistance + 1,
          z - direction.z * camDistance
        );
        targetLookAt.current.set(x, y, z);
        isAnimating.current = true;
        setTimeout(() => { 
          isAnimating.current = false;
          setIsSearching(false);
        }, 1500);
      }
    }
  }, [highlightedConstellationId, isSearching, setIsSearching]);

  useFrame((_state, delta) => {
    if (isAnimating.current) {
      camera.position.lerp(targetPosition.current, delta * 2);
      
      if (controlsRef.current) {
        controlsRef.current.target.lerp(targetLookAt.current, delta * 2);
        controlsRef.current.update();
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      minDistance={3}
      maxDistance={DOME_RADIUS * 1.2}
      maxPolarAngle={viewMode === 'chart' ? Math.PI / 2 + 0.2 : Math.PI / 2}
      minPolarAngle={Math.PI / 6}
      minAzimuthAngle={viewMode === 'chart' ? -Math.PI / 6 : undefined}
      maxAzimuthAngle={viewMode === 'chart' ? Math.PI / 6 : undefined}
      enableDamping
      dampingFactor={0.05}
    />
  );
}

interface SceneProps {
  onFoldClick: (constellation: Constellation) => void;
}

function Scene({ onFoldClick }: SceneProps) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[0, DOME_RADIUS, 0]} intensity={0.5} color="#ffd700" />
      <Dome />
      <Ground />
      <BackgroundStars />
      <ConstellationStars />
      <ScrollChart onFoldClick={onFoldClick} />
      <CameraController />
    </>
  );
}

interface StarChart3DProps {
  onFoldClick: (constellation: Constellation) => void;
}

export default function StarChart3D({ onFoldClick }: StarChart3DProps) {
  return (
    <Canvas
      camera={{ position: [0, DOME_RADIUS * 0.5, DOME_RADIUS * 0.8], fov: 60 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ background: 'transparent' }}
    >
      <Scene onFoldClick={onFoldClick} />
    </Canvas>
  );
}
