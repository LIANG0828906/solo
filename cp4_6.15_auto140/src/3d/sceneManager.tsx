import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Html, Sparkles, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { terrainEngine, STRATA_DEFINITIONS, ArtifactLocation } from '../geo/terrainEngine';
import { ARTIFACT_DEFINITIONS, artifactManager } from '../artifact/artifactManager';

interface SceneManagerProps {
  onArtifactClick: (locationId: string, artifactId: string) => void;
  onMine: (x: number, z: number) => void;
  highlightLocations: string[];
}

function ArtifactModel({ 
  location, 
  onClick,
  restored 
}: { 
  location: ArtifactLocation; 
  onClick: () => void;
  restored: boolean;
}) {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const def = ARTIFACT_DEFINITIONS[location.artifactId];
  const spawnY = useRef(-3);

  useFrame((state) => {
    if (meshRef.current) {
      if (spawnY.current < 0.3) {
        spawnY.current += 0.04;
        meshRef.current.position.y = spawnY.current + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      } else {
        meshRef.current.position.y = 0.3 + Math.sin(state.clock.elapsedTime * 1.5 + location.x) * 0.15;
      }
      meshRef.current.rotation.y += 0.01;
    }
  });

  if (!def) return null;

  const renderShape = () => {
    const color = restored ? def.color : '#808080';
    const emissive = restored ? def.accentColor : '#404040';
    
    switch (def.shape) {
      case 'pot':
        return (
          <group>
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.3, 0.15, 0.6, 8]} />
              <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.2} roughness={0.7} />
            </mesh>
            <mesh position={[0, 0.3, 0]}>
              <torusGeometry args={[0.3, 0.04, 8, 16]} />
              <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.2} />
            </mesh>
          </group>
        );
      case 'arrow':
        return (
          <group>
            <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <coneGeometry args={[0.15, 0.5, 4]} />
              <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.3} metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[0.3, 0, 0]}>
              <boxGeometry args={[0.4, 0.05, 0.05]} />
              <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.3} metalness={0.7} roughness={0.3} />
            </mesh>
          </group>
        );
      case 'disc':
        return (
          <group>
            <mesh position={[0, 0, 0]} rotation={[Math.PI / 3, 0, 0]}>
              <torusGeometry args={[0.35, 0.08, 8, 24]} />
              <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.25} roughness={0.4} />
            </mesh>
          </group>
        );
      case 'trilobite':
        return (
          <group>
            <mesh position={[0, 0, 0]} rotation={[-Math.PI / 4, 0, 0]}>
              <ellipseGeometry args={[0.35, 0.2, 8]} />
              <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.2} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, 0.05, 0.05]} rotation={[-Math.PI / 4, 0, 0]}>
              <boxGeometry args={[0.05, 0.4, 0.02]} />
              <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.2} />
            </mesh>
          </group>
        );
      case 'ding':
        return (
          <group>
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.3, 0.25, 0.4, 6]} />
              <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.25} metalness={0.6} roughness={0.4} />
            </mesh>
            <mesh position={[0.3, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[0.1, 0.03, 6, 12, Math.PI]} />
              <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.25} metalness={0.6} roughness={0.4} />
            </mesh>
            <mesh position={[-0.3, 0.1, 0]} rotation={[0, 0, -Math.PI / 2]}>
              <torusGeometry args={[0.1, 0.03, 6, 12, Math.PI]} />
              <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.25} metalness={0.6} roughness={0.4} />
            </mesh>
          </group>
        );
      case 'axe':
        return (
          <group>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.5, 0.25, 0.08]} />
              <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.2} roughness={0.8} />
            </mesh>
          </group>
        );
      case 'shell':
        return (
          <group>
            <mesh position={[0, 0, 0]} rotation={[-Math.PI / 5, 0, 0]}>
              <sphereGeometry args={[0.3, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.2} roughness={0.5} />
            </mesh>
          </group>
        );
      case 'pendant':
        return (
          <group>
            <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 6]}>
              <torusKnotGeometry args={[0.2, 0.05, 40, 8]} />
              <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.25} roughness={0.3} />
            </mesh>
          </group>
        );
      default:
        return (
          <mesh>
            <boxGeometry args={[0.3, 0.3, 0.3]} />
            <meshStandardMaterial color={color} />
          </mesh>
        );
    }
  };

  return (
    <group
      ref={meshRef}
      position={[location.x, -3, location.z]}
      onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onClick(); }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {renderShape()}
      
      <pointLight 
        position={[0, 0.5, 0]} 
        color={restored ? def.accentColor : '#ffffaa'} 
        intensity={hovered ? 2 : 0.8} 
        distance={3} 
      />
      
      {restored && (
        <Sparkles count={15} scale={0.8} size={2} speed={0.5} color={def.accentColor} />
      )}
      
      {hovered && (
        <Html center distanceFactor={10} position={[0, 0.8, 0]}>
          <div style={{
            background: 'rgba(30, 18, 8, 0.92)',
            border: '1px solid #c9a86a',
            borderRadius: '6px',
            padding: '8px 12px',
            minWidth: '180px',
            color: '#f5e6c8',
            fontFamily: 'Georgia, serif',
            pointerEvents: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5), inset 0 0 20px rgba(201, 168, 106, 0.1)'
          }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e8c88a', marginBottom: '4px' }}>
              {def.name}
            </div>
            <div style={{ fontSize: '11px', color: '#b89b6e', marginBottom: '4px' }}>
              {def.era}
            </div>
            <div style={{ fontSize: '11px', color: '#d4c4a0', lineHeight: 1.4 }}>
              {def.description}
            </div>
            <div style={{ fontSize: '10px', color: '#8fbc8f', marginTop: '6px' }}>
              点击收入收藏架
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

function HighlightMarker({ location }: { location: ArtifactLocation }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 2;
      const s = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.2;
      meshRef.current.scale.set(s, s, s);
    }
  });

  const def = ARTIFACT_DEFINITIONS[location.artifactId];

  return (
    <group position={[location.x, 1.5, location.z]}>
      <mesh ref={meshRef}>
        <ringGeometry args={[0.4, 0.5, 16]} />
        <meshBasicMaterial color={def?.accentColor || '#ffd700'} side={THREE.DoubleSide} transparent opacity={0.8} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 1, 6]} />
        <meshBasicMaterial color={def?.accentColor || '#ffd700'} transparent opacity={0.6} />
      </mesh>
      <pointLight color={def?.accentColor || '#ffd700'} intensity={1.5} distance={4} />
    </group>
  );
}

function TerrainMesh({ onMine, updateTrigger }: { onMine: (x: number, z: number) => void; updateTrigger: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometry = useRef<THREE.PlaneGeometry | null>(null);
  const { size, resolution } = terrainEngine;
  const [isMining, setIsMining] = useState(false);

  const updateTerrain = useCallback(() => {
    if (!geometry.current) return;
    const positions = geometry.current.attributes.position;
    const colors = new Float32Array(positions.count * 3);
    const vertices = terrainEngine.getVertices();

    for (let i = 0; i <= resolution; i++) {
      for (let j = 0; j <= resolution; j++) {
        const idx = i * (resolution + 1) + j;
        const v = vertices[i][j];
        positions.setY(idx, v.currentHeight);
        
        const stratum = terrainEngine.getStratumAt(i, j, v.currentHeight);
        const color = new THREE.Color(STRATA_DEFINITIONS[stratum].baseColor);
        
        const noise = (Math.sin(v.x * 5) + Math.cos(v.z * 5)) * 0.05;
        color.r = Math.max(0, Math.min(1, color.r + noise));
        color.g = Math.max(0, Math.min(1, color.g + noise));
        color.b = Math.max(0, Math.min(1, color.b + noise));
        
        colors[idx * 3] = color.r;
        colors[idx * 3 + 1] = color.g;
        colors[idx * 3 + 2] = color.b;
      }
    }
    positions.needsUpdate = true;
    geometry.current.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.current.computeVertexNormals();
  }, [resolution]);

  useEffect(() => {
    updateTerrain();
  }, [updateTerrain, updateTerrain]);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const point = e.point;
    onMine(point.x, point.z);
  };

  const planeGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(size, size, resolution, resolution);
    geo.rotateX(-Math.PI / 2);
    geometry.current = geo;
    updateTerrain();
    return geo;
  }, [size, resolution, updateTerrain]);

  return (
    <mesh
      ref={meshRef}
      geometry={planeGeometry}
      receiveShadow
      onClick={handleClick}
      onPointerDown={() => setIsMining(true)}
      onPointerUp={() => setIsMining(false)}
      onPointerLeave={() => setIsMining(false)}
    >
      <meshStandardMaterial 
        vertexColors 
        side={THREE.DoubleSide}
        roughness={0.9}
        metalness={0.05}
      />
    </mesh>
  );
}

function GrassDecorations() {
  const { size } = terrainEngine;
  const count = 150;
  
  const positions = useMemo(() => {
    const pos: number[] = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * size * 0.95;
      const z = (Math.random() - 0.5) * size * 0.95;
      const gi = Math.floor((z + size / 2) / size * terrainEngine.getResolution());
      const gj = Math.floor((x + size / 2) / size * terrainEngine.getResolution());
      const y = terrainEngine.getVertices()[gi]?.[gj]?.originalHeight || 1;
      pos.push(x, y, z);
    }
    return pos;
  }, [size]);

  return (
    <instancedMesh args={[undefined, undefined, count]} position={[0, 0.15, 0]}>
      <coneGeometry args={[0.03, 0.25, 4]} />
      <meshStandardMaterial color="#4a6a2a" />
      {positions.map((_, i) => {
        if (i % 3 !== 0) return null;
        const idx = i / 3;
        const m = new THREE.Matrix4();
        m.setPosition(positions[i], positions[i + 1] + 0.12, positions[i + 2]);
        return <instancedMesh key={idx} matrixAutoUpdate={false} />;
      })}
    </instancedMesh>
  );
}

function CameraController() {
  const { camera } = useThree();
  
  useEffect(() => {
    camera.position.set(25, 20, 25);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return null;
}

export function SceneManager({ onArtifactClick, onMine, highlightLocations }: SceneManagerProps) {
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [discoveredArtifacts, setDiscoveredArtifacts] = useState<ArtifactLocation[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const discovered = terrainEngine.getDiscoveredArtifacts();
      setDiscoveredArtifacts(discovered);
      setUpdateTrigger(t => t + 1);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const handleMine = useCallback((x: number, z: number) => {
    terrainEngine.mineAt(x, z, 2.5, 1.2);
    onMine(x, z);
    setUpdateTrigger(t => t + 1);
  }, [onMine]);

  const handleArtifactClick = useCallback((locationId: string, artifactId: string) => {
    const pieces = artifactManager.getPiecesByArtifact(artifactId);
    const uncollected = pieces.find(p => !p.collected);
    if (uncollected) {
      artifactManager.collectPiece(uncollected.id);
    }
    onArtifactClick(locationId, artifactId);
  }, [onArtifactClick]);

  return (
    <Canvas
      shadows
      camera={{ fov: 50, near: 0.1, far: 200 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      dpr={[1, 2]}
    >
      <color attach="background" args={['#2a1a0d']} />
      <fog attach="fog" args={['#2a1a0d', 50, 90]} />

      <CameraController />

      <ambientLight intensity={0.4} color="#d4b896" />
      <directionalLight
        position={[30, 40, 20]}
        intensity={1.2}
        color="#f5e6c8"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <hemisphereLight args={['#87ceeb', '#3d2817', 0.3]} />

      <Stars radius={100} depth={50} count={500} factor={4} saturation={0} fade speed={0.5} />

      <TerrainMesh onMine={handleMine} updateTrigger={updateTrigger} />
      
      <GrassDecorations />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -15, 0]}>
        <circleGeometry args={[60, 32]} />
        <meshStandardMaterial color="#1a0f08" />
      </mesh>

      {discoveredArtifacts.map(loc => (
        <ArtifactModel
          key={loc.id}
          location={loc}
          restored={loc.restored}
          onClick={() => handleArtifactClick(loc.id, loc.artifactId)}
        />
      ))}

      {highlightLocations.map(locId => {
        const loc = terrainEngine.getArtifactLocations().find(l => l.id === locId);
        return loc ? <HighlightMarker key={locId} location={loc} /> : null;
      })}

      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={10}
        maxDistance={60}
        maxPolarAngle={Math.PI / 2.2}
        minPolarAngle={Math.PI / 6}
        enablePan={true}
      />
    </Canvas>
  );
}
