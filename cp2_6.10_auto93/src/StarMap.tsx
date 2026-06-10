import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { starsData, getStarById } from './data/stars';
import { constellationsData, getConstellationById } from './data/constellations';
import { useStarMapStore } from './store';
import { StarData } from './types';

interface StarSpriteProps {
  star: StarData;
  isHighlighted: boolean;
  isSelected: boolean;
  isHovered: boolean;
  isDimmed: boolean;
  onClick: (e: any) => void;
  onPointerOver: (e: any) => void;
  onPointerOut: () => void;
}

const StarSprite: React.FC<StarSpriteProps> = ({
  star,
  isHighlighted,
  isSelected,
  isHovered,
  isDimmed,
  onClick,
  onPointerOver,
  onPointerOut
}) => {
  const spriteRef = useRef<THREE.Sprite>(null);
  const materialRef = useRef<THREE.SpriteMaterial>(null);

  const canvas = useMemo(() => {
    const c = document.createElement('canvas');
    const size = star.size * 4;
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d')!;
    
    const gradient = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size / 2
    );
    
    const baseColor = isHighlighted ? '#ffd700' : star.color;
    const glowColor = isHighlighted ? 'rgba(255, 215, 0, 0.5)' : 'rgba(153, 153, 170, 0.3)';
    
    gradient.addColorStop(0, baseColor);
    gradient.addColorStop(0.3, baseColor);
    gradient.addColorStop(0.7, glowColor);
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();
    
    return c;
  }, [star.size, star.color, isHighlighted]);

  const texture = useMemo(() => {
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, [canvas]);

  useFrame((state) => {
    if (materialRef.current) {
      if (isHighlighted) {
        const t = (state.clock.elapsedTime * (1 / 1.2)) % 1;
        const pulse = 0.5 + 0.5 * Math.sin(t * Math.PI * 2);
        const color = new THREE.Color().lerpColors(
          new THREE.Color('#ffd700'),
          new THREE.Color('#ffaa00'),
          pulse
        );
        materialRef.current.color = color;
        materialRef.current.opacity = 0.7 + pulse * 0.3;
      } else {
        const baseOpacity = isDimmed ? 0.25 : 0.9;
        materialRef.current.opacity = isSelected ? 1 : isHovered ? 1 : baseOpacity;
      }
    }
  });

  const scale = useMemo(() => {
    const baseScale = star.size * 0.015;
    return isHovered || isSelected ? baseScale * 1.5 : baseScale;
  }, [star.size, isHovered, isSelected]);

  return (
    <sprite
      ref={spriteRef}
      position={[star.x * 2, star.y * 2, 0.01]}
      scale={[scale, scale, scale]}
      onClick={onClick}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    >
      <spriteMaterial
        ref={materialRef}
        map={texture}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </sprite>
  );
};

interface ConstellationLinesProps {
  constellationId: string;
  isHighlighted: boolean;
  starMap: Map<string, StarData>;
}

const ConstellationLines: React.FC<ConstellationLinesProps> = ({
  constellationId,
  isHighlighted,
  starMap
}) => {
  const lineRef = useRef<THREE.LineSegments>(null);
  const constellation = getConstellationById(constellationId);

  const { positions, colors } = useMemo(() => {
    if (!constellation) return { positions: new Float32Array(), colors: new Float32Array() };
    
    const pos: number[] = [];
    const col: number[] = [];
    
    constellation.connections.forEach(([startIdx, endIdx]) => {
      const startStar = starMap.get(constellation.stars[startIdx]);
      const endStar = starMap.get(constellation.stars[endIdx]);
      
      if (startStar && endStar) {
        pos.push(startStar.x * 2, startStar.y * 2, 0.005);
        pos.push(endStar.x * 2, endStar.y * 2, 0.005);
        
        const color = new THREE.Color(isHighlighted ? '#ffd700' : '#cc0000');
        col.push(color.r, color.g, color.b);
        col.push(color.r, color.g, color.b);
      }
    });
    
    return {
      positions: new Float32Array(pos),
      colors: new Float32Array(col)
    };
  }, [constellation, starMap, isHighlighted]);

  useFrame((state) => {
    if (lineRef.current && isHighlighted) {
      const material = lineRef.current.material as THREE.LineBasicMaterial;
      const t = (state.clock.elapsedTime * (1 / 1.2)) % 1;
      const pulse = 0.5 + 0.5 * Math.sin(t * Math.PI * 2);
      const color = new THREE.Color().lerpColors(
        new THREE.Color('#ffd700'),
        new THREE.Color('#ffaa00'),
        pulse
      );
      material.color = color;
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
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial
        vertexColors
        transparent
        opacity={isHighlighted ? 1 : 0.6}
        linewidth={isHighlighted ? 2 : 1.5}
      />
    </lineSegments>
  );
};

interface CustomConnectionsProps {
  connections: [number, number][];
  starTable: { starId: string; order: number }[];
  starMap: Map<string, StarData>;
}

const CustomConnections: React.FC<CustomConnectionsProps> = ({
  connections,
  starTable,
  starMap
}) => {
  const { positions } = useMemo(() => {
    const pos: number[] = [];
    
    for (let i = 0; i < starTable.length - 1; i++) {
      const startStar = starMap.get(starTable[i].starId);
      const endStar = starMap.get(starTable[i + 1].starId);
      
      if (startStar && endStar) {
        pos.push(startStar.x * 2, startStar.y * 2, 0.008);
        pos.push(endStar.x * 2, endStar.y * 2, 0.008);
      }
    }
    
    return { positions: new Float32Array(pos) };
  }, [starTable, starMap]);

  if (positions.length === 0 || starTable.length < 2) return null;

  return (
    <lineSegments>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial
        color="#4169e1"
        transparent
        opacity={0.9}
        linewidth={2}
      />
    </lineSegments>
  );
};

const ScrollPaper: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0, -0.01]} rotation={[0, 0, 0]}>
        <planeGeometry args={[6.2, 3.4]} />
        <meshStandardMaterial
          color="#d4c294"
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>
      
      <mesh position={[0, 0, 0.001]}>
        <planeGeometry args={[6, 3.2]} />
        <meshStandardMaterial
          color="#e8d5b0"
          roughness={0.85}
          metalness={0.05}
        />
      </mesh>
      
      <mesh position={[-3.15, 0, 0.02]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 3.4, 16]} />
        <meshStandardMaterial
          color="#5a3e2b"
          roughness={0.7}
          metalness={0.2}
        />
      </mesh>
      
      <mesh position={[3.15, 0, 0.02]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 3.4, 16]} />
        <meshStandardMaterial
          color="#5a3e2b"
          roughness={0.7}
          metalness={0.2}
        />
      </mesh>
    </group>
  );
};

interface SceneContentProps {
  starMap: Map<string, StarData>;
}

const SceneContent: React.FC<SceneContentProps> = ({ starMap }) => {
  const { selectedConstellation, hoveredStar, starTable, customConnections, 
          setHoveredStar, addStarToTable, removeStarFromTable } = useStarMapStore();
  
  const selectedStarIds = useMemo(() => 
    new Set(starTable.map(item => item.starId)), 
    [starTable]
  );

  const handleStarClick = (star: StarData) => (e: any) => {
    e.stopPropagation();
    if (e.event.shiftKey) {
      if (selectedStarIds.has(star.id)) {
        removeStarFromTable(star.id);
      } else {
        addStarToTable(star.id);
      }
    }
  };

  const handlePointerOver = (star: StarData) => (e: any) => {
    e.stopPropagation();
    document.body.style.cursor = 'pointer';
    setHoveredStar(star.id);
  };

  const handlePointerOut = () => {
    document.body.style.cursor = 'default';
    setHoveredStar(null);
  };

  const isStarHighlighted = (star: StarData) => {
    if (!selectedConstellation) return false;
    const constellation = getConstellationById(selectedConstellation);
    return constellation?.stars.includes(star.id) || false;
  };

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={0.8} color="#fff8e7" />
      <pointLight position={[-10, -5, 5]} intensity={0.3} color="#ffd700" />
      
      <ScrollPaper />
      
      {constellationsData.map(constellation => (
        <ConstellationLines
          key={constellation.id}
          constellationId={constellation.id}
          isHighlighted={selectedConstellation === constellation.id}
          starMap={starMap}
        />
      ))}
      
      <CustomConnections
        connections={customConnections}
        starTable={starTable}
        starMap={starMap}
      />
      
      {starsData.map(star => {
        const isHighlighted = isStarHighlighted(star);
        const isDimmed = selectedConstellation !== null && !isHighlighted;
        
        return (
          <group key={star.id}>
            <StarSprite
              star={star}
              isHighlighted={isHighlighted}
              isSelected={selectedStarIds.has(star.id)}
              isHovered={hoveredStar === star.id}
              isDimmed={isDimmed}
              onClick={handleStarClick(star)}
              onPointerOver={handlePointerOver(star)}
              onPointerOut={handlePointerOut}
            />
          </group>
        );
      })}
      
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={3}
        maxDistance={18}
        minPolarAngle={Math.PI / 2 - Math.PI / 6}
        maxPolarAngle={Math.PI / 2 + Math.PI / 6}
        enableDamping={true}
        dampingFactor={0.05}
      />
    </>
  );
};

const HoveredStarLabel: React.FC = () => {
  const { hoveredStar } = useStarMapStore();
  const star = hoveredStar ? getStarById(hoveredStar) : null;

  if (!star) return null;

  return (
    <Html
      position={[star.x * 2, star.y * 2 + 0.15, 0.02]}
      center
      zIndexRange={[100, 0]}
      style={{ pointerEvents: 'none' }}
    >
      <div
        style={{
          background: 'rgba(245, 230, 200, 0.95)',
          padding: '8px 12px',
          borderRadius: '2px',
          border: '1px solid #c9a66b',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          minWidth: '120px',
          textAlign: 'center',
          fontFamily: '"KaiTi", "STKaiti", serif',
          fontSize: '14px',
          color: '#3a2818',
          transition: 'all 0.3s ease-in-out'
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '16px' }}>
          {star.ancientName}
        </div>
        <div style={{ fontSize: '12px', color: '#6b5344' }}>
          {star.modernName}
        </div>
        <div style={{ fontSize: '11px', color: '#8b7355', marginTop: '2px' }}>
          {`${'★'.repeat(star.magnitude)}${'☆'.repeat(4 - star.magnitude)}`}
        </div>
      </div>
    </Html>
  );
};

const StarMap: React.FC = () => {
  const starMap = useMemo(() => {
    const map = new Map<string, StarData>();
    starsData.forEach(star => map.set(star.id, star));
    return map;
  }, []);

  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 50 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
    >
      <SceneContent starMap={starMap} />
      <HoveredStarLabel />
    </Canvas>
  );
};

export default StarMap;
