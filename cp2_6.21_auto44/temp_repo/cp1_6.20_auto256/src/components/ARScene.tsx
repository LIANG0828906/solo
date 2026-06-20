import { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Treasure } from '../types';
import { COLOR_MAP, SCORE_MAP } from '../types';
import { haversineDistance, getBearing } from '../utils/geoUtils';

interface ARSceneProps {
  treasure: Treasure | null;
  playerLat: number;
  playerLng: number;
  onTreasureCollected: (treasureId: string) => void;
  onBack: () => void;
}

function useAudio() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const playCollectSound = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  }, []);

  return { playCollectSound };
}

function Buildings() {
  const buildings = useMemo(() => {
    const result: { position: [number, number, number]; size: [number, number, number]; color: string }[] = [];
    
    for (let i = 0; i < 20; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const z = -50 + i * 10;
      const height = 5 + Math.random() * 20;
      const width = 4 + Math.random() * 6;
      const depth = 4 + Math.random() * 6;
      const x = side * (15 + Math.random() * 10);
      
      const colorValue = Math.floor(141 - Math.random() * 50);
      const color = `rgb(${colorValue + 20}, ${colorValue - 30}, ${colorValue - 50})`;
      
      result.push({
        position: [x, height / 2, z],
        size: [width, height, depth],
        color,
      });
    }
    
    return result;
  }, []);

  return (
    <>
      {buildings.map((b, i) => (
        <mesh key={i} position={b.position} castShadow>
          <boxGeometry args={b.size} />
          <meshStandardMaterial color={b.color} />
        </mesh>
      ))}
    </>
  );
}

interface TreasureModelProps {
  treasure: Treasure;
  position: [number, number, number];
  collected: boolean;
  onCollect: () => void;
}

function TreasureModel({ treasure, position, collected, onCollect }: TreasureModelProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [scale, setScale] = useState(1);
  const [isHovered, setIsHovered] = useState(false);
  
  const color = COLOR_MAP[treasure.type];

  useFrame((state, delta) => {
    if (meshRef.current && !collected) {
      meshRef.current.rotation.y += delta * 0.5;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.3;
    }
    
    if (collected) {
      setScale(prev => Math.max(0, prev - delta * 3));
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    if (!collected) {
      onCollect();
    }
  };

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    setIsHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    setIsHovered(false);
    document.body.style.cursor = 'default';
  };

  const renderGeometry = () => {
    switch (treasure.type) {
      case 'gem':
        return <octahedronGeometry args={[0.8, 0]} />;
      case 'coin':
        return <cylinderGeometry args={[0.7, 0.7, 0.15, 32]} />;
      case 'chest':
        return <boxGeometry args={[1.2, 0.9, 0.8]} />;
      default:
        return <sphereGeometry args={[0.8, 16, 16]} />;
    }
  };

  return (
    <mesh
      ref={meshRef}
      position={position}
      scale={scale}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {renderGeometry()}
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={isHovered ? 0.5 : 0.2}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  );
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[200, 200]} />
      <meshStandardMaterial color="#cfd8dc" />
    </mesh>
  );
}

interface CameraControllerProps {
  onCameraChange?: (direction: THREE.Vector3) => void;
}

function CameraController({ onCameraChange }: CameraControllerProps) {
  const { camera, gl } = useThree();
  const isDragging = useRef(false);
  const previousMouse = useRef({ x: 0, y: 0 });
  const yawRef = useRef(0);
  const pitchRef = useRef(0);
  const targetYaw = useRef(0);
  const targetPitch = useRef(0);

  useEffect(() => {
    const canvas = gl.domElement;

    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      previousMouse.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      
      const deltaX = e.clientX - previousMouse.current.x;
      const deltaY = e.clientY - previousMouse.current.y;
      
      targetYaw.current -= deltaX * 0.005;
      targetPitch.current -= deltaY * 0.005;
      
      targetPitch.current = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, targetPitch.current));
      
      previousMouse.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [gl]);

  useFrame((_, delta) => {
    yawRef.current += (targetYaw.current - yawRef.current) * delta * 10;
    pitchRef.current += (targetPitch.current - pitchRef.current) * delta * 10;
    
    const distance = 0;
    const height = 1.7;
    
    const x = Math.sin(yawRef.current) * distance;
    const z = Math.cos(yawRef.current) * distance;
    
    camera.position.set(x, height, z);
    
    const lookAt = new THREE.Vector3(
      Math.sin(yawRef.current) * 10,
      height + Math.sin(pitchRef.current) * 10,
      Math.cos(yawRef.current) * 10
    );
    
    camera.lookAt(lookAt);
    
    if (onCameraChange) {
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      onCameraChange(direction);
    }
  });

  return null;
}

interface DirectionArrowProps {
  treasure: Treasure;
  playerLat: number;
  playerLng: number;
}

function DirectionArrow({ treasure, playerLat, playerLng }: DirectionArrowProps) {
  const bearing = getBearing(playerLat, playerLng, treasure.lat, treasure.lng);
  const distance = haversineDistance(playerLat, playerLng, treasure.lat, treasure.lng);

  const arrowStyle: React.CSSProperties = {
    position: 'absolute',
    top: '20%',
    left: '50%',
    transform: `translateX(-50%) rotate(${bearing}deg)`,
    color: COLOR_MAP[treasure.type],
    fontSize: '32px',
    textShadow: `0 0 10px ${COLOR_MAP[treasure.type]}`,
    pointerEvents: 'none',
  };

  const distanceStyle: React.CSSProperties = {
    position: 'absolute',
    top: 'calc(20% + 40px)',
    left: '50%',
    transform: 'translateX(-50%)',
    color: '#ffffff',
    fontSize: '14px',
    fontFamily: "'Courier New', monospace",
    pointerEvents: 'none',
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  return (
    <>
      <div style={arrowStyle}>▲</div>
      <div style={distanceStyle}>{formatDistance(distance)}</div>
    </>
  );
}

interface SceneContentProps {
  treasure: Treasure;
  playerLat: number;
  playerLng: number;
  collected: boolean;
  onCollect: () => void;
}

function SceneContent({ treasure, playerLat, playerLng, collected, onCollect }: SceneContentProps) {
  const distance = haversineDistance(playerLat, playerLng, treasure.lat, treasure.lng);
  const bearing = getBearing(playerLat, playerLng, treasure.lat, treasure.lng);
  
  const zDistance = Math.min(30, Math.max(5, distance / 10));
  const xOffset = Math.sin((bearing * Math.PI) / 180) * zDistance * 0.3;
  const zPos = -Math.cos((bearing * Math.PI) / 180) * zDistance;
  const yPos = 2;

  const treasurePosition: [number, number, number] = [xOffset, yPos, zPos];

  return (
    <>
      <CameraController />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 20, 10]} intensity={1} castShadow />
      <pointLight position={[0, 10, 0]} intensity={0.5} color="#ffd700" />
      
      <Ground />
      <Buildings />
      
      {!collected && (
        <TreasureModel
          treasure={treasure}
          position={treasurePosition}
          collected={collected}
          onCollect={onCollect}
        />
      )}
    </>
  );
}

function ARScene({ treasure, playerLat, playerLng, onTreasureCollected, onBack }: ARSceneProps) {
  const [collected, setCollected] = useState(false);
  const { playCollectSound } = useAudio();

  const handleCollect = useCallback(() => {
    if (collected || !treasure) return;
    
    setCollected(true);
    playCollectSound();
    
    setTimeout(() => {
      onTreasureCollected(treasure.id);
    }, 500);
  }, [treasure, collected, playCollectSound, onTreasureCollected]);

  if (!treasure) {
    return (
      <div className="ar-canvas-container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <p>没有选中的宝藏</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ar-canvas-container">
      <Canvas
        shadows
        camera={{ fov: 75, near: 0.1, far: 1000 }}
        style={{ width: '100%', height: '100%' }}
      >
        <color attach="background" args={['#90caf9']} />
        <fog attach="fog" args={['#90caf9', 30, 80]} />
        <SceneContent
          treasure={treasure}
          playerLat={playerLat}
          playerLng={playerLng}
          collected={collected}
          onCollect={handleCollect}
        />
      </Canvas>
      
      {!collected && (
        <DirectionArrow
          treasure={treasure}
          playerLat={playerLat}
          playerLng={playerLng}
        />
      )}
    </div>
  );
}

export default ARScene;
