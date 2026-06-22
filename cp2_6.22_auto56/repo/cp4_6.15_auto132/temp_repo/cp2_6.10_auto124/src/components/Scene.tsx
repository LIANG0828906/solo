import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store/useStore';
import { getStrokeData, BRUSH_CONFIG } from '../utils/data';
import type { BrushType } from '../store/useStore';

const CAMERA_CONFIG = {
  position: [0, 3, 4] as [number, number, number],
  fov: 50,
  minZoom: 0.8,
  maxZoom: 1.5,
};

function InkPool() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const geometry = meshRef.current.geometry as THREE.PlaneGeometry;
      const positions = geometry.attributes.position;
      const time = clock.getElapsedTime();

      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const z = Math.sin(x * 2 + time) * 0.02 + Math.cos(y * 2 + time) * 0.02;
        positions.setZ(i, z);
      }
      positions.needsUpdate = true;
      geometry.computeVertexNormals();
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[10, 10, 32, 32]} />
      <meshStandardMaterial
        color="#8baaa4"
        transparent
        opacity={0.6}
        side={THREE.DoubleSide}
        roughness={0.1}
        metalness={0.1}
      />
    </mesh>
  );
}

function WillowTree({ position, particleCount = 150 }: { position: [number, number, number]; particleCount?: number }) {
  const particlesRef = useRef<THREE.Points>(null);
  const [windOffset] = useState(() => Math.random() * Math.PI * 2);

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const height = Math.random() * 2.5;
      const angle = Math.random() * Math.PI * 2;
      const radius = (height / 2.5) * (0.5 + Math.random() * 0.5);

      positions[i * 3] = position[0] + Math.cos(angle) * radius;
      positions[i * 3 + 1] = position[1] + height;
      positions[i * 3 + 2] = position[2] + Math.sin(angle) * radius;

      const greenVariation = 0.7 + Math.random() * 0.3;
      colors[i * 3] = 0.25 * greenVariation;
      colors[i * 3 + 1] = 0.55 * greenVariation;
      colors[i * 3 + 2] = 0.35 * greenVariation;
    }

    return { positions, colors };
  }, [position, particleCount]);

  useFrame(({ clock }) => {
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const time = clock.getElapsedTime() + windOffset;

      for (let i = 0; i < particleCount; i++) {
        const height = positions.getY(i) - position[1];
        const windStrength = (height / 2.5) * 0.15;
        const windX = Math.sin(time * 1.5 + height * 2) * windStrength;
        const windZ = Math.cos(time * 1.2 + height * 1.5) * windStrength;

        const originalX = (positions.array as Float32Array)[i * 3];
        const originalZ = (positions.array as Float32Array)[i * 3 + 2];

        positions.setX(i, originalX + windX);
        positions.setZ(i, originalZ + windZ);
      }
      positions.needsUpdate = true;
    }
  });

  return (
    <>
      <mesh position={[position[0], position[1] + 0.5, position[2]]} castShadow>
        <cylinderGeometry args={[0.1, 0.15, 1, 8]} />
        <meshStandardMaterial color="#5d4037" roughness={0.8} />
      </mesh>
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
        <pointsMaterial size={0.08} vertexColors transparent opacity={0.9} sizeAttenuation />
      </points>
    </>
  );
}

function StoneTable() {
  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, 0.05, 0]} receiveShadow castShadow>
        <boxGeometry args={[2.5, 0.1, 1.8]} />
        <meshStandardMaterial color="#6b7280" roughness={0.9} />
      </mesh>
      <mesh position={[-1, 0.25, 0.6]} castShadow>
        <boxGeometry args={[0.2, 0.5, 0.2]} />
        <meshStandardMaterial color="#4b5563" roughness={0.9} />
      </mesh>
      <mesh position={[1, 0.25, 0.6]} castShadow>
        <boxGeometry args={[0.2, 0.5, 0.2]} />
        <meshStandardMaterial color="#4b5563" roughness={0.9} />
      </mesh>
      <mesh position={[-1, 0.25, -0.6]} castShadow>
        <boxGeometry args={[0.2, 0.5, 0.2]} />
        <meshStandardMaterial color="#4b5563" roughness={0.9} />
      </mesh>
      <mesh position={[1, 0.25, -0.6]} castShadow>
        <boxGeometry args={[0.2, 0.5, 0.2]} />
        <meshStandardMaterial color="#4b5563" roughness={0.9} />
      </mesh>
    </group>
  );
}

function RicePaper() {
  const { gridSize, currentStrokeIndex, userStrokePoints, deviationAreas, brushType, isAnimating, canWrite } = useStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);
  const strokeData = getStrokeData(currentStrokeIndex);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 512;
    canvas.height = 512;

    ctx.fillStyle = '#faf8f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 1000; i++) {
      ctx.fillStyle = `rgba(180, 170, 150, ${Math.random() * 0.1})`;
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
    }

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const halfGrid = gridSize * 2;

    ctx.strokeStyle = '#d4c9b8';
    ctx.lineWidth = 1.5;

    ctx.strokeRect(centerX - halfGrid, centerY - halfGrid, halfGrid * 2, halfGrid * 2);

    ctx.beginPath();
    ctx.moveTo(centerX - halfGrid, centerY);
    ctx.lineTo(centerX + halfGrid, centerY);
    ctx.moveTo(centerX, centerY - halfGrid);
    ctx.lineTo(centerX, centerY + halfGrid);
    ctx.stroke();

    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(centerX - halfGrid, centerY - halfGrid);
    ctx.lineTo(centerX + halfGrid, centerY + halfGrid);
    ctx.moveTo(centerX + halfGrid, centerY - halfGrid);
    ctx.lineTo(centerX - halfGrid, centerY + halfGrid);
    ctx.stroke();
    ctx.setLineDash([]);

    if (!isAnimating || canWrite) {
      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = '#1a1a1a';
      ctx.font = `${gridSize * 1.5}px 'Ma Shan Zheng', serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(strokeData.character, centerX, centerY);
      ctx.restore();
    }

    if (userStrokePoints.length > 1) {
      const brushConfig = BRUSH_CONFIG[brushType as BrushType];
      ctx.strokeStyle = brushConfig.color;
      ctx.lineWidth = brushConfig.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      const firstPoint = userStrokePoints[0];
      ctx.moveTo(
        centerX - halfGrid + firstPoint.x * halfGrid * 2,
        centerY - halfGrid + firstPoint.y * halfGrid * 2
      );

      for (let i = 1; i < userStrokePoints.length; i++) {
        const point = userStrokePoints[i];
        ctx.lineTo(
          centerX - halfGrid + point.x * halfGrid * 2,
          centerY - halfGrid + point.y * halfGrid * 2
        );
      }
      ctx.stroke();
    }

    deviationAreas.forEach((area) => {
      const x = centerX - halfGrid + area.x * halfGrid * 2;
      const y = centerY - halfGrid + area.y * halfGrid * 2;
      const radius = area.radius * halfGrid * 2;

      ctx.save();
      ctx.strokeStyle = '#cc3333';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 500) * 0.2;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(204, 51, 51, 0.2)';
      ctx.fill();
      ctx.restore();
    });

    if (textureRef.current) {
      textureRef.current.needsUpdate = true;
    }
  }, [gridSize, currentStrokeIndex, userStrokePoints, deviationAreas, brushType, strokeData.character, isAnimating, canWrite]);

  const texture = useMemo(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      textureRef.current = new THREE.CanvasTexture(canvas);
      return textureRef.current;
    }
    return null;
  }, []);

  return (
    <>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {texture && (
        <mesh position={[0, 0.11, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[1.6, 1.6]} />
          <meshStandardMaterial map={texture} transparent side={THREE.DoubleSide} />
        </mesh>
      )}
    </>
  );
}

function BrushHandle() {
  const { brushPosition, cameraZoom } = useStore();
  const meshRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useFrame(() => {
    if (meshRef.current && brushPosition) {
      const vector = new THREE.Vector3(
        (brushPosition.x / window.innerWidth) * 2 - 1,
        -(brushPosition.y / window.innerHeight) * 2 + 1,
        0.5
      );
      vector.unproject(camera);

      const dir = vector.sub(camera.position).normalize();
      const distance = (0.15 - camera.position.y) / dir.y;
      const pos = camera.position.clone().add(dir.multiplyScalar(distance));

      meshRef.current.position.set(pos.x, pos.y + 0.2, pos.z);
      meshRef.current.rotation.x = -Math.PI / 6;
      meshRef.current.rotation.z = Math.PI / 8;
    }
  });

  if (!brushPosition) return null;

  return (
    <group ref={meshRef} scale={[1 / cameraZoom, 1 / cameraZoom, 1 / cameraZoom]}>
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.015, 0.02, 0.3, 8]} />
        <meshStandardMaterial color="#8b4513" roughness={0.6} />
      </mesh>
      <mesh position={[0, -0.02, 0]} castShadow>
        <coneGeometry args={[0.03, 0.12, 8]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.018, 0.018, 0.05, 8]} />
        <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

function StrokeAnimation() {
  const { isAnimating, currentStrokeIndex } = useStore();
  const { setIsAnimating, setCanWrite } = useStore();
  const groupRef = useRef<THREE.Group>(null);
  const [progress, setProgress] = useState(0);
  const strokeData = getStrokeData(currentStrokeIndex);

  useEffect(() => {
    if (!isAnimating) return;

    setProgress(0);
    const duration = strokeData.animationConfig.duration;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(1, elapsed / duration);
      setProgress(newProgress);

      if (newProgress < 1) {
        requestAnimationFrame(animate);
      } else {
        setTimeout(() => {
          setIsAnimating(false);
          setCanWrite(true);
        }, 500);
      }
    };

    requestAnimationFrame(animate);
  }, [isAnimating, currentStrokeIndex, strokeData.animationConfig.duration, setIsAnimating, setCanWrite]);

  if (!isAnimating) return null;

  const { type, startPosition, endPosition, colorStart, colorEnd } = strokeData.animationConfig;

  const currentX = startPosition.x + (endPosition.x - startPosition.x) * progress;
  const currentY = startPosition.y + (endPosition.y - startPosition.y) * progress;
  const currentZ = startPosition.z + (endPosition.z - startPosition.z) * progress;

  const color = new THREE.Color(colorStart).lerp(new THREE.Color(colorEnd), progress);
  const scale = 0.5 + progress * 0.5;

  const renderAnimation = () => {
    switch (type) {
      case 'cloud':
        return (
          <group>
            {[...Array(5)].map((_, i) => (
              <mesh key={i} position={[i * 0.3 - 0.6, Math.sin(i + progress * 5) * 0.1, 0]}>
                <sphereGeometry args={[0.2 + Math.random() * 0.1, 8, 8]} />
                <meshStandardMaterial color={color} transparent opacity={0.6 - progress * 0.2} />
              </mesh>
            ))}
          </group>
        );
      case 'stone':
        return (
          <mesh rotation={[progress * Math.PI * 3, progress * Math.PI * 2, progress * Math.PI]}>
            <dodecahedronGeometry args={[0.15 * scale, 0]} />
            <meshStandardMaterial color={color} roughness={0.8} />
          </mesh>
        );
      case 'rhinoceros':
        return (
          <group rotation={[0, 0, Math.PI / 4]}>
            <mesh>
              <boxGeometry args={[0.3 * scale, 0.15 * scale, 0.12 * scale]} />
              <meshStandardMaterial color={color} roughness={0.7} />
            </mesh>
            <mesh position={[0.15 * scale, 0, 0.08 * scale]}>
              <coneGeometry args={[0.03 * scale, 0.15 * scale, 4]} />
              <meshStandardMaterial color="#f5f5dc" roughness={0.5} />
            </mesh>
          </group>
        );
      case 'wave':
        return (
          <group>
            {[...Array(3)].map((_, i) => (
              <mesh key={i} position={[0, i * 0.05, 0]}>
                <torusGeometry args={[0.2 * scale, 0.03 * scale, 8, 16, Math.PI]} />
                <meshStandardMaterial color={color} transparent opacity={0.7 - i * 0.2} />
              </mesh>
            ))}
          </group>
        );
      case 'vine':
        return (
          <mesh>
            <cylinderGeometry args={[0.02 * scale, 0.04 * scale, 0.5 * scale, 6]} />
            <meshStandardMaterial color={color} roughness={0.9} />
          </mesh>
        );
      case 'arrow':
        return (
          <group rotation={[0, 0, Math.PI / 4]}>
            <mesh position={[-0.1 * scale, 0, 0]}>
              <cylinderGeometry args={[0.02 * scale, 0.02 * scale, 0.3 * scale, 8]} />
              <meshStandardMaterial color={color} roughness={0.6} />
            </mesh>
            <mesh position={[0.1 * scale, 0, 0]}>
              <coneGeometry args={[0.05 * scale, 0.12 * scale, 8]} />
              <meshStandardMaterial color="#8b4513" roughness={0.5} />
            </mesh>
          </group>
        );
      case 'sword':
        return (
          <group rotation={[0, 0, -Math.PI / 3]}>
            <mesh position={[0, 0.1 * scale, 0]}>
              <boxGeometry args={[0.03 * scale, 0.4 * scale, 0.01 * scale]} />
              <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[0, -0.12 * scale, 0]}>
              <boxGeometry args={[0.12 * scale, 0.04 * scale, 0.04 * scale]} />
              <meshStandardMaterial color="#d4af37" metalness={0.7} roughness={0.3} />
            </mesh>
          </group>
        );
      default:
        return null;
    }
  };

  return (
    <group ref={groupRef} position={[currentX, currentY, currentZ]}>
      {renderAnimation()}
    </group>
  );
}

function CameraController() {
  const { cameraZoom, setCameraZoom } = useStore();
  const { camera } = useThree();

  useFrame(() => {
    const targetDistance = 5 / cameraZoom;
    const currentDistance = camera.position.length();
    if (Math.abs(currentDistance - targetDistance) > 0.01) {
      const direction = camera.position.clone().normalize();
      const newPosition = direction.multiplyScalar(targetDistance);
      camera.position.lerp(newPosition, 0.1);
    }
  });

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.05 : -0.05;
    const newZoom = Math.max(0.8, Math.min(1.5, cameraZoom + delta));
    setCameraZoom(newZoom);
  };

  useEffect(() => {
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [cameraZoom, setCameraZoom]);

  return null;
}

export default function Scene() {
  const { currentStrokeIndex, resetForNewStroke, setIsWriting, addStrokePoint, clearStrokePoints, canWrite, setBrushPosition, setCurrentScore, setCurrentSuggestion, setDeviationAreas, addScoreRecord } = useStore();
  const strokeData = getStrokeData(currentStrokeIndex);

  const handlePointerDown = (e: PointerEvent) => {
    if (!canWrite) return;
    setIsWriting(true);
    clearStrokePoints();
    setCurrentScore(null);
    setCurrentSuggestion(null);
    setDeviationAreas([]);
    setBrushPosition({ x: e.clientX, y: e.clientY });

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    addStrokePoint({
      x: (x - 0.3) / 0.4,
      y: (y - 0.3) / 0.4,
      pressure: e.pressure || 0.5,
      timestamp: Date.now(),
    });
  };

  const handlePointerMove = (e: PointerEvent) => {
    setBrushPosition({ x: e.clientX, y: e.clientY });

    const { isWriting } = useStore.getState();
    if (!isWriting || !canWrite) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const normalizedX = (x - 0.3) / 0.4;
    const normalizedY = (y - 0.3) / 0.4;

    if (normalizedX >= 0 && normalizedX <= 1 && normalizedY >= 0 && normalizedY <= 1) {
      addStrokePoint({
        x: normalizedX,
        y: normalizedY,
        pressure: e.pressure || 0.5,
        timestamp: Date.now(),
      });
    }
  };

  const handlePointerUp = async () => {
    const { isWriting, userStrokePoints } = useStore.getState();
    if (!isWriting || userStrokePoints.length < 5) {
      setIsWriting(false);
      return;
    }

    setIsWriting(false);

    try {
      const { calculateDeviation, calculateScore, calculatePathLength, generateSuggestion } = await import('../utils/brushEngine');

      const startTime = performance.now();

      const { areas, avgDeviation } = calculateDeviation(userStrokePoints, strokeData.path, 0.15);
      const userPathLength = calculatePathLength(userStrokePoints);
      const referencePathLength = calculatePathLength(strokeData.path);
      const timeTaken = userStrokePoints[userStrokePoints.length - 1].timestamp - userStrokePoints[0].timestamp;

      const score = calculateScore(avgDeviation, userPathLength, referencePathLength, timeTaken);
      const suggestion = generateSuggestion(currentStrokeIndex, areas, score, strokeData.suggestions);

      const computeTime = performance.now() - startTime;
      console.log(`笔迹比对耗时: ${computeTime.toFixed(2)}ms`);

      setDeviationAreas(areas.filter((a) => a.deviationPercent > 15));
      setCurrentScore(score);
      setCurrentSuggestion(suggestion);

      addScoreRecord({
        strokeIndex: currentStrokeIndex,
        strokeName: strokeData.name,
        score,
        suggestion,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('评分计算错误:', error);
    }
  };

  useEffect(() => {
    resetForNewStroke();
  }, [currentStrokeIndex]);

  useEffect(() => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.addEventListener('pointerdown', handlePointerDown as unknown as EventListener);
      canvas.addEventListener('pointermove', handlePointerMove as unknown as EventListener);
      canvas.addEventListener('pointerup', handlePointerUp as unknown as EventListener);
      canvas.addEventListener('pointerleave', handlePointerUp as unknown as EventListener);

      return () => {
        canvas.removeEventListener('pointerdown', handlePointerDown as unknown as EventListener);
        canvas.removeEventListener('pointermove', handlePointerMove as unknown as EventListener);
        canvas.removeEventListener('pointerup', handlePointerUp as unknown as EventListener);
        canvas.removeEventListener('pointerleave', handlePointerUp as unknown as EventListener);
      };
    }
  }, [canWrite, currentStrokeIndex, strokeData]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        camera={{
          position: CAMERA_CONFIG.position,
          fov: CAMERA_CONFIG.fov,
        }}
        shadows
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={['#f5e6d3']} />
        <fog attach="fog" args={['#f5e6d3', 8, 20]} />

        <ambientLight intensity={0.6} />
        <hemisphereLight args={['#87ceeb', '#8b7355', 0.5]} />
        <directionalLight
          position={[5, 8, 5]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-left={-5}
          shadow-camera-right={5}
          shadow-camera-top={5}
          shadow-camera-bottom={-5}
        />

        <CameraController />

        <Stars radius={100} depth={50} count={100} factor={2} saturation={0} fade speed={0.5} />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#c9b896" roughness={0.9} />
        </mesh>

        <InkPool />

        <WillowTree position={[-3, 0, -2]} particleCount={150} />
        <WillowTree position={[3, 0, -2.5]} particleCount={150} />
        <WillowTree position={[-3.5, 0, 2]} particleCount={120} />
        <WillowTree position={[3.2, 0, 1.8]} particleCount={120} />

        <StoneTable />
        <RicePaper />
        <BrushHandle />
        <StrokeAnimation />

        <OrbitControls
          enablePan={false}
          enableRotate={false}
          enableZoom={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2.5}
        />
      </Canvas>
    </div>
  );
}
