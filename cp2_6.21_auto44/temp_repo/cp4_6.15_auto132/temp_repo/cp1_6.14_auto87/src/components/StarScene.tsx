import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useStarStore } from '../store/useStarStore';
import { StarData, StarCluster } from '../types';
import { getNearbyBrightStars } from '../utils/stardata';

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function StarPoints() {
  const pointsRef = useRef<THREE.Points>(null);
  const { stars, selectedStar, highlightedStarId, flyToStar, isFlying, setIsFlying, selectedClusterId, clusters, clusterStarIds, isCreatingCluster, addStarToCluster, removeStarFromCluster } = useStarStore();
  const { camera } = useThree();
  const animationRef = useRef<{ startPos: THREE.Vector3; startTarget: THREE.Vector3; endPos: THREE.Vector3; endTarget: THREE.Vector3; progress: number; duration: number } | null>(null);

  const { positions, colors, sizes, starMap } = useMemo(() => {
    const positions = new Float32Array(stars.length * 3);
    const colors = new Float32Array(stars.length * 3);
    const sizes = new Float32Array(stars.length);
    const starMap = new Map<string, { index: number; star: StarData }>();

    stars.forEach((star, i) => {
      positions[i * 3] = star.x;
      positions[i * 3 + 1] = star.y;
      positions[i * 3 + 2] = star.z;

      const color = new THREE.Color(star.color);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      const baseSize = Math.max(0.3, 2.5 - star.apparentMagnitude * 0.4);
      sizes[i] = baseSize;

      starMap.set(star.id, { index: i, star });
    });

    return { positions, colors, sizes, starMap };
  }, [stars]);

  useFrame((state, delta) => {
    if (animationRef.current && isFlying) {
      animationRef.current.progress += delta / animationRef.current.duration;
      const t = Math.min(1, animationRef.current.progress);
      const easedT = easeInOutCubic(t);

      camera.position.lerpVectors(
        animationRef.current.startPos,
        animationRef.current.endPos,
        easedT
      );

      (camera as any).target?.lerpVectors?.(
        animationRef.current.startTarget,
        animationRef.current.endTarget,
        easedT
      );

      if (t >= 1) {
        animationRef.current = null;
        setIsFlying(false);
      }
    }

    if (pointsRef.current) {
      const geometry = pointsRef.current.geometry;
      const sizeArray = geometry.attributes.size?.array as Float32Array;
      if (sizeArray) {
        const time = state.clock.elapsedTime;
        for (let i = 0; i < sizeArray.length; i++) {
          const baseSize = sizes[i];
          const twinkle = 0.85 + 0.15 * Math.sin(time * 2 + i * 0.5);
          sizeArray[i] = baseSize * twinkle;
        }
        geometry.attributes.size.needsUpdate = true;
      }
    }
  });

  useEffect(() => {
    if (highlightedStarId && isFlying) {
      const starData = starMap.get(highlightedStarId);
      if (starData) {
        const star = starData.star;
        const direction = new THREE.Vector3(star.x, star.y, star.z).normalize();
        const distance = Math.min(15, Math.max(5, star.distance * 0.02));
        
        const endPos = new THREE.Vector3(
          star.x + direction.x * distance,
          star.y + direction.y * distance,
          star.z + direction.z * distance
        );
        const endTarget = new THREE.Vector3(star.x, star.y, star.z);

        animationRef.current = {
          startPos: camera.position.clone(),
          startTarget: new THREE.Vector3(0, 0, 0).copy((camera as any).target || new THREE.Vector3()),
          endPos,
          endTarget,
          progress: 0,
          duration: 2,
        };
      }
    }
  }, [highlightedStarId, isFlying, starMap, camera]);

  const handleClick = (event: any) => {
    event.stopPropagation();
    const { point } = event;
    
    let closestStar: StarData | null = null;
    let closestDist = Infinity;
    
    for (const star of stars) {
      const dist = point.distanceTo(new THREE.Vector3(star.x, star.y, star.z));
      if (dist < closestDist && dist < 5) {
        closestDist = dist;
        closestStar = star;
      }
    }
    
    if (closestStar) {
      if (isCreatingCluster) {
        if (clusterStarIds.includes(closestStar.id)) {
          removeStarFromCluster(closestStar.id);
        } else {
          addStarToCluster(closestStar.id);
        }
      } else {
        flyToStar(closestStar);
      }
    }
  };

  const selectedCluster = selectedClusterId ? clusters.find(c => c.id === selectedClusterId) : null;

  return (
    <group>
      <points ref={pointsRef} onClick={handleClick}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={positions.length / 3}
            array={positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={colors.length / 3}
            array={colors}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            count={sizes.length}
            array={sizes}
            itemSize={1}
          />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={`
            attribute float size;
            attribute vec3 color;
            varying vec3 vColor;
            void main() {
              vColor = color;
              vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
              gl_PointSize = size * (300.0 / -mvPosition.z);
              gl_Position = projectionMatrix * mvPosition;
            }
          `}
          fragmentShader={`
            varying vec3 vColor;
            void main() {
              float dist = length(gl_PointCoord - vec2(0.5));
              if (dist > 0.5) discard;
              float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
              alpha = pow(alpha, 0.5);
              gl_FragColor = vec4(vColor, alpha);
            }
          `}
          transparent
          depthWrite={false}
          vertexColors
        />
      </points>

      {highlightedStarId && starMap.has(highlightedStarId) && (
        <HighlightRing star={starMap.get(highlightedStarId)!.star} />
      )}

      {selectedStar && (
        <SelectedStarIndicator star={selectedStar} />
      )}

      {isCreatingCluster && clusterStarIds.map(id => {
        const starData = starMap.get(id);
        if (!starData) return null;
        return (
          <mesh key={`cluster-select-${id}`} position={[starData.star.x, starData.star.y, starData.star.z]}>
            <ringGeometry args={[1.5, 2, 32]} />
            <meshBasicMaterial color="#00d4ff" transparent opacity={0.8} side={THREE.DoubleSide} />
          </mesh>
        );
      })}

      {clusters.map(cluster => (
        <ClusterLines 
          key={cluster.id} 
          cluster={cluster} 
          stars={stars}
          isHighlighted={selectedClusterId === cluster.id}
        />
      ))}

      {selectedCluster && (
        <ClusterLabel cluster={selectedCluster} stars={stars} />
      )}
    </group>
  );
}

function HighlightRing({ star }: { star: StarData }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const scale = 1 + 0.2 * Math.sin(state.clock.elapsedTime * 3);
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <mesh ref={meshRef} position={[star.x, star.y, star.z]}>
      <ringGeometry args={[1.2, 1.8, 32]} />
      <meshBasicMaterial color="#00d4ff" transparent opacity={0.9} side={THREE.DoubleSide} />
    </mesh>
  );
}

function SelectedStarIndicator({ star }: { star: StarData }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.5;
    }
  });

  return (
    <group position={[star.x, star.y, star.z]}>
      <mesh ref={meshRef}>
        <torusGeometry args={[2.5, 0.08, 16, 64]} />
        <meshBasicMaterial color={star.color} transparent opacity={0.6} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.8, 0.05, 16, 64]} />
        <meshBasicMaterial color={star.color} transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

function ClusterLines({ cluster, stars, isHighlighted }: { cluster: StarCluster; stars: StarData[]; isHighlighted: boolean }) {
  const lineRef = useRef<THREE.LineSegments>(null);

  const { positions, color } = useMemo(() => {
    const clusterStars = cluster.starIds
      .map(id => stars.find(s => s.id === id))
      .filter((s): s is StarData => s !== undefined);

    const linePositions: number[] = [];
    
    if (clusterStars.length >= 2) {
      for (let i = 0; i < clusterStars.length; i++) {
        for (let j = i + 1; j < clusterStars.length; j++) {
          const a = clusterStars[i];
          const b = clusterStars[j];
          linePositions.push(a.x, a.y, a.z, b.x, b.y, b.z);
        }
      }
    }

    return {
      positions: new Float32Array(linePositions),
      color: new THREE.Color(cluster.color),
    };
  }, [cluster, stars]);

  useFrame((state) => {
    if (lineRef.current) {
      const material = lineRef.current.material as THREE.LineBasicMaterial;
      const pulse = 0.4 + 0.2 * Math.sin(state.clock.elapsedTime * 1.5);
      material.opacity = isHighlighted ? pulse + 0.3 : pulse;
    }
  });

  if (positions.length === 0) return null;

  return (
    <lineSegments ref={lineRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <lineDashedMaterial
        color={color}
        dashSize={1}
        gapSize={0.8}
        transparent
        opacity={0.5}
        linewidth={2}
      />
    </lineSegments>
  );
}

function ClusterLabel({ cluster, stars }: { cluster: StarCluster; stars: StarData[] }) {
  const center = useMemo(() => {
    const clusterStars = cluster.starIds
      .map(id => stars.find(s => s.id === id))
      .filter((s): s is StarData => s !== undefined);

    if (clusterStars.length === 0) return null;

    const centerX = clusterStars.reduce((sum, s) => sum + s.x, 0) / clusterStars.length;
    const centerY = clusterStars.reduce((sum, s) => sum + s.y, 0) / clusterStars.length;
    const centerZ = clusterStars.reduce((sum, s) => sum + s.z, 0) / clusterStars.length;

    return { x: centerX, y: centerY + 3, z: centerZ };
  }, [cluster, stars]);

  if (!center) return null;

  return (
    <Html position={[center.x, center.y, center.z]} center distanceFactor={15}>
      <div 
        className="cluster-label"
        style={{
          color: cluster.color,
          textShadow: `0 0 10px ${cluster.color}, 0 0 20px ${cluster.color}40`,
          animation: 'float 3s ease-in-out infinite',
        }}
      >
        ✦ {cluster.name}
      </div>
    </Html>
  );
}

function CameraController() {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const { setCameraPosition, setCameraTarget, isFlying } = useStarStore();

  useEffect(() => {
    if (!(camera as any).target) {
      (camera as any).target = new THREE.Vector3(0, 0, 0);
    }
  }, [camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      minDistance={5}
      maxDistance={500}
      enabled={!isFlying}
      onEnd={() => {
        setCameraPosition({
          x: camera.position.x,
          y: camera.position.y,
          z: camera.position.z,
        });
        setCameraTarget({
          x: (camera as any).target?.x || 0,
          y: (camera as any).target?.y || 0,
          z: (camera as any).target?.z || 0,
        });
      }}
    />
  );
}

function BackgroundStars() {
  return (
    <Stars
      radius={400}
      depth={80}
      count={5000}
      factor={3}
      saturation={0}
      fade
      speed={0.5}
    />
  );
}

export default function StarScene() {
  return (
    <Canvas
      camera={{ position: [0, 20, 150], fov: 60, near: 0.1, far: 1000 }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #1a0a2e 0%, #0a1628 50%, #050a15 100%)',
      }}
      gl={{ antialias: true, alpha: true }}
    >
      <CameraController />
      <BackgroundStars />
      <StarPoints />
      <ambientLight intensity={0.1} />
    </Canvas>
  );
}
