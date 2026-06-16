import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { useRef, useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';
import { FloorPlan, PlacedItem, MaterialItem } from '../shared/types';
import { MATERIALS } from '../shared/data';

interface ThreePreviewProps {
  floorPlan: FloorPlan;
  placedItems: PlacedItem[];
  materials: MaterialItem[];
}

function AutoRotateCamera() {
  const [autoRotate, setAutoRotate] = useState(true);
  const controlsRef = useRef<any>(null);

  useFrame((_, delta) => {
    if (autoRotate && controlsRef.current) {
      controlsRef.current.autoRotateSpeed = 0.8;
    }
  });

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        autoRotate={autoRotate}
        enablePan={true}
        enableZoom={true}
        minDistance={2}
        maxDistance={20}
        maxPolarAngle={Math.PI / 2.2}
        onStart={() => setAutoRotate(false)}
      />
      <mesh position={[0, 0.01, 0]}>
        <sphereGeometry args={[0.01]} />
      </mesh>
    </>
  );
}

function Floor({ width, depth }: { width: number; depth: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[width / 2, 0, depth / 2]} receiveShadow>
      <planeGeometry args={[width, depth]} />
      <meshStandardMaterial 
        color="#F5E6D3" 
        roughness={0.85}
        metalness={0.05}
      />
      <mesh
        position={[0, 0.001, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial
          color="#EFE0CC"
          transparent
          opacity={0.4}
        />
      </mesh>
    </mesh>
  );
}

function Walls({ width, depth }: { width: number; depth: number }) {
  const wallHeight = 3;
  const wallThickness = 0.2;

  return (
    <group>
      <mesh position={[width / 2, wallHeight / 2, -wallThickness / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, wallHeight, wallThickness]} />
        <meshStandardMaterial color="#FAF0E6" roughness={0.9} />
      </mesh>
      
      <mesh position={[-wallThickness / 2, wallHeight / 2, depth / 2]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[depth, wallHeight, wallThickness]} />
        <meshStandardMaterial color="#F5E6D3" roughness={0.9} />
      </mesh>
      
      <mesh position={[width + wallThickness / 2, wallHeight / 2, depth / 2]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[depth, wallHeight, wallThickness]} />
        <meshStandardMaterial color="#F5E6D3" roughness={0.9} />
      </mesh>
      
      <mesh position={[width / 2, wallHeight / 2, depth + wallThickness / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, wallHeight, wallThickness]} />
        <meshStandardMaterial color="#FAF0E6" roughness={0.9} />
      </mesh>
    </group>
  );
}

function Sofa3D({ x, z, rotation, scale, color }: { x: number; z: number; rotation: number; scale: number; color: string }) {
  return (
    <group position={[x * 0.01, 0, z * 0.01]} rotation={[0, -rotation * Math.PI / 180, 0]} scale={scale}>
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 0.5, 0.8]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[-0.9, 0.5, 0]} castShadow>
        <boxGeometry args={[0.3, 0.6, 0.8]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[0.9, 0.5, 0]} castShadow>
        <boxGeometry args={[0.3, 0.6, 0.8]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.6, -0.25]} castShadow>
        <boxGeometry args={[1.3, 0.4, 0.2]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[-0.3, 0.58, 0.1]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 0.2, 16]} />
        <meshStandardMaterial color="#F5E6D3" roughness={0.9} />
      </mesh>
      <mesh position={[0.3, 0.58, 0.1]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 0.2, 16]} />
        <meshStandardMaterial color="#F5E6D3" roughness={0.9} />
      </mesh>
    </group>
  );
}

function Table3D({ x, z, rotation, scale, color, isDining = false }: { x: number; z: number; rotation: number; scale: number; color: string; isDining?: boolean }) {
  const tableHeight = isDining ? 0.75 : 0.45;
  const size = isDining ? 1.4 : 1.2;
  return (
    <group position={[x * 0.01, 0, z * 0.01]} rotation={[0, -rotation * Math.PI / 180, 0]} scale={scale}>
      <mesh position={[0, tableHeight, 0]} castShadow receiveShadow>
        <boxGeometry args={[size, 0.05, size * 0.6]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} />
      </mesh>
      {[[-size/2 + 0.08, -size*0.25], [size/2 - 0.08, -size*0.25], [-size/2 + 0.08, size*0.25], [size/2 - 0.08, size*0.25]].map(([legX, legZ], i) => (
        <mesh key={i} position={[legX, tableHeight / 2, legZ]} castShadow>
          <boxGeometry args={[0.05, tableHeight, 0.05]} />
          <meshStandardMaterial color="#5D4037" roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function Lamp3D({ x, z, rotation, scale, color, isCeiling = false }: { x: number; z: number; rotation: number; scale: number; color: string; isCeiling?: boolean }) {
  if (isCeiling) {
    return (
      <group position={[x * 0.01, 3, z * 0.01]} rotation={[0, -rotation * Math.PI / 180, 0]} scale={scale}>
        <mesh position={[0, -0.05, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.5, 8]} />
          <meshStandardMaterial color="#888" />
        </mesh>
        <mesh position={[0, -0.35, 0]}>
          <cylinderGeometry args={[0.15, 0.3, 0.2, 16]} />
          <meshStandardMaterial 
            color={color} 
            emissive={color} 
            emissiveIntensity={0.8}
            transparent
            opacity={0.9}
          />
        </mesh>
        <pointLight position={[0, -0.4, 0]} intensity={1.5} distance={4} color="#FFF3E0" />
      </group>
    );
  }
  
  return (
    <group position={[x * 0.01, 0, z * 0.01]} rotation={[0, -rotation * Math.PI / 180, 0]} scale={scale}>
      <mesh position={[0, 0.8, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 1.5, 8]} />
        <meshStandardMaterial color="#5D4037" metalness={0.5} />
      </mesh>
      <mesh position={[0, 1.55, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={0.6}
          transparent
          opacity={0.9}
        />
      </mesh>
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <cylinderGeometry args={[0.15, 0.18, 0.1, 16]} />
        <meshStandardMaterial color="#4E342E" />
      </mesh>
      <pointLight position={[0, 1.4, 0]} intensity={1} distance={3} color="#FFF3E0" />
    </group>
  );
}

function Carpet3D({ x, z, rotation, scale, color }: { x: number; z: number; rotation: number; scale: number; color: string }) {
  return (
    <group position={[x * 0.01, 0.005, z * 0.01]} rotation={[0, -rotation * Math.PI / 180, 0]} scale={scale}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <boxGeometry args={[2.4, 1.6, 0.02]} />
        <meshStandardMaterial color={color} roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <boxGeometry args={[2.2, 1.4, 0.005]} />
        <meshStandardMaterial color="#FFF8F0" roughness={0.95} />
      </mesh>
    </group>
  );
}

function Decoration3D({ x, z, rotation, scale, color }: { x: number; z: number; rotation: number; scale: number; color: string }) {
  return (
    <group position={[x * 0.01, 1.5, 0.05]} rotation={[0, -rotation * Math.PI / 180, 0]} scale={scale}>
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.8, 1, 0.03]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0, 0.02]}>
        <boxGeometry args={[0.7, 0.9, 0.01]} />
        <meshStandardMaterial color="#E8A87C" />
      </mesh>
      <mesh position={[-0.1, 0.15, 0.03]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.2} />
      </mesh>
    </group>
  );
}

function Bed3D({ x, z, rotation, scale, color }: { x: number; z: number; rotation: number; scale: number; color: string }) {
  return (
    <group position={[x * 0.01, 0, z * 0.01]} rotation={[0, -rotation * Math.PI / 180, 0]} scale={scale}>
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 0.3, 2]} />
        <meshStandardMaterial color="#5D4037" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.38, 0]} castShadow>
        <boxGeometry args={[1.7, 0.15, 1.9]} />
        <meshStandardMaterial color="#FAFAFA" roughness={0.9} />
      </mesh>
      <mesh position={[-0.4, 0.5, -0.7]} castShadow>
        <boxGeometry args={[0.6, 0.12, 0.4]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      <mesh position={[0.4, 0.5, -0.7]} castShadow>
        <boxGeometry args={[0.6, 0.12, 0.4]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.7, -0.95]} castShadow>
        <boxGeometry args={[1.8, 0.6, 0.1]} />
        <meshStandardMaterial color="#8B5E3C" roughness={0.7} />
      </mesh>
    </group>
  );
}

function Chair3D({ x, z, rotation, scale, color }: { x: number; z: number; rotation: number; scale: number; color: string }) {
  return (
    <group position={[x * 0.01, 0, z * 0.01]} rotation={[0, -rotation * Math.PI / 180, 0]} scale={scale}>
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.45, 0.05, 0.45]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.65, -0.2]} castShadow>
        <boxGeometry args={[0.45, 0.45, 0.05]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {[[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]].map(([legX, legZ], i) => (
        <mesh key={i} position={[legX, 0.225, legZ]} castShadow>
          <boxGeometry args={[0.04, 0.45, 0.04]} />
          <meshStandardMaterial color="#4E342E" />
        </mesh>
      ))}
    </group>
  );
}

function Storage3D({ x, z, rotation, scale, color, isTall = false }: { x: number; z: number; rotation: number; scale: number; color: string; isTall?: boolean }) {
  const height = isTall ? 2 : 0.5;
  return (
    <group position={[x * 0.01, height / 2, z * 0.01]} rotation={[0, -rotation * Math.PI / 180, 0]} scale={scale}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.8, height, 0.5]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0, 0.26]}>
        <boxGeometry args={[1.75, height - 0.05, 0.02]} />
        <meshStandardMaterial color="#F5E6D3" roughness={0.8} />
      </mesh>
      {!isTall && (
        <>
          <mesh position={[-0.4, 0, 0.28]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshStandardMaterial color="#FFD700" metalness={0.8} />
          </mesh>
          <mesh position={[0.4, 0, 0.28]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshStandardMaterial color="#FFD700" metalness={0.8} />
          </mesh>
        </>
      )}
    </group>
  );
}

function FurnitureMesh({ item, material }: { item: PlacedItem; material: MaterialItem }) {
  const props = {
    x: item.x,
    z: item.y,
    rotation: item.rotation,
    scale: item.scale,
    color: item.color
  };

  switch (material.category) {
    case 'sofa':
      return <Sofa3D {...props} />;
    case 'table':
      return <Table3D {...props} isDining={material.id.includes('dining')} />;
    case 'lamp':
      return <Lamp3D {...props} isCeiling={material.id.includes('ceiling')} />;
    case 'carpet':
      return <Carpet3D {...props} />;
    case 'decoration':
      return <Decoration3D {...props} />;
    case 'bed':
      return <Bed3D {...props} />;
    case 'chair':
      return <Chair3D {...props} />;
    case 'storage':
      return <Storage3D {...props} isTall={material.id.includes('wardrobe') || material.id.includes('bookshelf')} />;
    default:
      return (
        <mesh position={[item.x * 0.01, 0.5, item.y * 0.01]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={item.color} />
        </mesh>
      );
  }
}

export default function ThreePreview({ floorPlan, placedItems }: ThreePreviewProps) {
  const { width, height } = floorPlan.layout;
  const roomW = width * 0.01;
  const roomD = height * 0.01;

  const validItems = useMemo(() => {
    return placedItems.filter(item => {
      const mat = MATERIALS.find(m => m.id === item.materialId);
      return !!mat;
    });
  }, [placedItems]);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      minHeight: '100%',
      background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)'
    }}>
      <Canvas
        shadows
        camera={{ 
          position: [roomW * 1.2, roomW * 0.9, roomD * 1.4], 
          fov: 50 
        }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#FFF8F0']} />
        <fog attach="fog" args={['#FFF8F0', roomW * 2, roomW * 4]} />

        <ambientLight intensity={0.5} color="#FFF3E0" />
        <directionalLight
          position={[roomW, roomW * 1.5, roomD]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-left={-roomW}
          shadow-camera-right={roomW * 2}
          shadow-camera-top={roomD * 2}
          shadow-camera-bottom={-roomD}
          color="#FFF8E7"
        />
        <directionalLight
          position={[-roomW * 0.5, roomW, roomD * 0.5]}
          intensity={0.3}
          color="#E3F2FD"
        />

        <AutoRotateCamera />
        
        <Floor width={roomW} depth={roomD} />
        <Walls width={roomW} depth={roomD} />

        {validItems.map(item => {
          const material = MATERIALS.find(m => m.id === item.materialId)!;
          return (
            <FurnitureMesh 
              key={item.id} 
              item={item} 
              material={material} 
            />
          );
        })}

        <ContactShadows
          position={[roomW / 2, 0.01, roomD / 2]}
          opacity={0.4}
          scale={Math.max(roomW, roomD) * 2}
          blur={2.5}
          far={4}
        />
      </Canvas>

      <div style={{
        position: 'absolute',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(255,255,255,0.9)',
        padding: '10px 20px',
        borderRadius: 20,
        fontSize: 12,
        color: '#5D4037',
        boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        🖱️ 拖拽旋转视角 · 滚轮缩放 · 相机正在自动旋转中...
      </div>
    </div>
  );
}
