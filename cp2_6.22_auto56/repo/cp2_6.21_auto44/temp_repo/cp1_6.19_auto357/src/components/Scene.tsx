import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import useSceneStore, { Pedestrian, LightPost } from '../stores/sceneStore';

interface Building {
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
}

const Buildings: React.FC = () => {
  const buildings = useMemo<Building[]>(() => {
    const result: Building[] = [];
    const gridSize = 4;
    const spacing = 20;
    const roadWidth = 8;
    const offset = -((gridSize - 1) * spacing) / 2;
    
    for (let i = 0; i < gridSize - 1; i++) {
      for (let j = 0; j < gridSize - 1; j++) {
        const blockCenterX = offset + i * spacing + spacing / 2;
        const blockCenterZ = offset + j * spacing + spacing / 2;
        const buildingCount = 2 + Math.floor(Math.random() * 2);
        
        for (let k = 0; k < buildingCount; k++) {
          const bx = blockCenterX + (Math.random() - 0.5) * (spacing - roadWidth - 4);
          const bz = blockCenterZ + (Math.random() - 0.5) * (spacing - roadWidth - 4);
          const bw = 2 + Math.random() * 3;
          const bd = 2 + Math.random() * 3;
          const bh = 3 + Math.random() * 3;
          
          result.push({ x: bx, z: bz, width: bw, depth: bd, height: bh });
        }
      }
    }
    return result;
  }, []);
  
  return (
    <>
      {buildings.map((b, i) => (
        <mesh key={i} position={[b.x, b.height / 2, b.z]} castShadow receiveShadow>
          <boxGeometry args={[b.width, b.height, b.depth]} />
          <meshStandardMaterial color="#e0e0e0" roughness={0.8} metalness={0.1} />
        </mesh>
      ))}
    </>
  );
};

const LightPole: React.FC<{ post: LightPost; color: string; intensity: number; radius: number; castShadow?: boolean }> = ({ post, color, intensity, radius, castShadow = false }) => {
  const lightRef = useRef<THREE.SpotLight>(null);
  
  useFrame((state) => {
    if (lightRef.current) {
      lightRef.current.intensity = intensity * 2;
    }
  });
  
  return (
    <group position={[post.x, 0, post.z]}>
      <mesh position={[0, post.height / 2, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, post.height, 16]} />
        <meshStandardMaterial color="#555555" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, post.height + 0.3, 0]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={intensity * 0.5}
          transparent
          opacity={0.9}
        />
      </mesh>
      <spotLight
        ref={lightRef}
        position={[0, post.height, 0]}
        angle={0.6}
        penumbra={0.5}
        distance={radius * 10}
        color={color}
        intensity={intensity * 2}
        castShadow={castShadow}
        shadow-mapSize-width={256}
        shadow-mapSize-height={256}
        target-position={[0, 0.1, 0]}
      />
    </group>
  );
};

const PedestrianMesh: React.FC<{ pedestrian: Pedestrian }> = ({ pedestrian }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.set(pedestrian.x, 0.5, pedestrian.z);
    }
  });
  
  return (
    <mesh ref={meshRef} position={[pedestrian.x, 0.5, pedestrian.z]}>
      <boxGeometry args={[0.4, 1, 0.4]} />
      <meshStandardMaterial color="#4FC3F7" emissive="#4FC3F7" emissiveIntensity={0.3} />
    </mesh>
  );
};

const Ground: React.FC = () => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[200, 200]} />
      <meshStandardMaterial color="#2a2a3e" roughness={0.9} metalness={0.1} />
    </mesh>
  );
};

const Roads: React.FC = () => {
  const roads = useMemo(() => {
    const gridSize = 4;
    const spacing = 20;
    const roadWidth = 8;
    const offset = -((gridSize - 1) * spacing) / 2;
    const totalLength = (gridSize - 1) * spacing + roadWidth;
    
    const horizontalRoads = [];
    const verticalRoads = [];
    
    for (let i = 0; i < gridSize; i++) {
      horizontalRoads.push({
        x: offset + (gridSize - 1) * spacing / 2,
        z: offset + i * spacing,
        width: totalLength,
        depth: roadWidth,
      });
      verticalRoads.push({
        x: offset + i * spacing,
        z: offset + (gridSize - 1) * spacing / 2,
        width: roadWidth,
        depth: totalLength,
      });
    }
    
    return { horizontal: horizontalRoads, vertical: verticalRoads };
  }, []);
  
  return (
    <>
      {roads.horizontal.map((road, i) => (
        <mesh key={`h-${i}`} position={[road.x, 0.01, road.z]} receiveShadow>
          <boxGeometry args={[road.width, 0.02, road.depth]} />
          <meshStandardMaterial color="#3a3a4e" roughness={0.95} />
        </mesh>
      ))}
      {roads.vertical.map((road, i) => (
        <mesh key={`v-${i}`} position={[road.x, 0.01, road.z]} receiveShadow>
          <boxGeometry args={[road.width, 0.02, road.depth]} />
          <meshStandardMaterial color="#3a3a4e" roughness={0.95} />
        </mesh>
      ))}
    </>
  );
};

const AttractorPoint: React.FC = () => {
  const attractorPoint = useSceneStore((state) => state.attractorPoint);
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current && attractorPoint) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.2;
      meshRef.current.scale.set(scale, scale, scale);
    }
  });
  
  if (!attractorPoint) return null;
  
  return (
    <mesh ref={meshRef} position={[attractorPoint.x, 2, attractorPoint.z]}>
      <sphereGeometry args={[1.5, 24, 24]} />
      <meshStandardMaterial 
        color="#FF6B6B" 
        emissive="#FF6B6B" 
        emissiveIntensity={1.5}
        transparent
        opacity={0.8}
      />
    </mesh>
  );
};

const SceneContent: React.FC = () => {
  const { 
    lightPosts, 
    lightColor, 
    lightIntensity, 
    spotRadius, 
    pedestrians,
    attractorPoint,
    setAttractorPoint,
  } = useSceneStore();
  
  const { camera, gl } = useThree();
  const planeRef = useRef<THREE.Mesh>(null);
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const groundPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  
  const handleCanvasClick = (event: any) => {
    const rect = gl.domElement.getBoundingClientRect();
    mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycaster.current.setFromCamera(mouse.current, camera);
    
    const intersectPoint = new THREE.Vector3();
    raycaster.current.ray.intersectPlane(groundPlane.current, intersectPoint);
    
    if (intersectPoint) {
      if (attractorPoint && 
          Math.abs(intersectPoint.x - attractorPoint.x) < 2 && 
          Math.abs(intersectPoint.z - attractorPoint.z) < 2) {
        setAttractorPoint(null);
      } else {
        setAttractorPoint({ x: intersectPoint.x, z: intersectPoint.z });
      }
    }
  };
  
  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener('click', handleCanvasClick);
    return () => {
      canvas.removeEventListener('click', handleCanvasClick);
    };
  }, [gl, attractorPoint, setAttractorPoint]);
  
  return (
    <>
      <ambientLight intensity={0.15} color="#4a4a6a" />
      <directionalLight 
        position={[50, 100, 50]} 
        intensity={0.1} 
        color="#6a6a8a"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
      />
      
      <Stars radius={300} depth={60} count={3000} factor={7} saturation={0} fade speed={0.5} />
      
      <Ground />
      <Roads />
      <Buildings />
      
      {lightPosts.map((post, index) => {
        const gridSize = 4;
        const row = Math.floor(index / gridSize);
        const col = index % gridSize;
        const isCorner = (row === 0 || row === gridSize - 1) && (col === 0 || col === gridSize - 1);
        return (
          <LightPole 
            key={post.id} 
            post={post} 
            color={lightColor} 
            intensity={lightIntensity}
            radius={spotRadius}
            castShadow={isCorner}
          />
        );
      })}
      
      {pedestrians.map((ped) => (
        <PedestrianMesh key={ped.id} pedestrian={ped} />
      ))}
      
      <AttractorPoint />
      
      <OrbitControls 
        enableDamping 
        dampingFactor={0.05}
        minDistance={20}
        maxDistance={150}
        maxPolarAngle={Math.PI / 2.2}
        minPolarAngle={0.2}
      />
    </>
  );
};

const FPSMonitor: React.FC = () => {
  const [fps, setFps] = useState(60);
  const framesRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  
  useFrame(() => {
    framesRef.current++;
    const now = performance.now();
    if (now - lastTimeRef.current >= 1000) {
      setFps(framesRef.current);
      framesRef.current = 0;
      lastTimeRef.current = now;
      console.log(`FPS: ${fps}`);
    }
  });
  
  return null;
};

const Scene: React.FC = () => {
  return (
    <Canvas
      shadows
      camera={{ position: [60, 50, 60], fov: 50 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: '#1a1a2e' }}
    >
      <fog attach="fog" args={['#1a1a2e', 100, 200]} />
      <SceneContent />
      <FPSMonitor />
    </Canvas>
  );
};

export default Scene;
