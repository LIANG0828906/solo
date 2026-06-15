import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Html, Sparkles, Stars, LOD, Detail, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { terrainEngine, STRATA_DEFINITIONS, ArtifactLocation } from '../geo/terrainEngine';
import { ARTIFACT_DEFINITIONS, artifactManager, ArtifactDefinition } from '../artifact/artifactManager';
import { sceneManager } from '../3d/sceneManager';

interface TerrainCanvasProps {
  onArtifactCollected: (locationId: string, artifactId: string, pieceId: string) => void;
  onMined: (x: number, z: number) => void;
  highlightLocationIds: string[];
  cursorMode: 'shovel' | 'grab' | 'default';
  setCursorMode: (m: 'shovel' | 'grab' | 'default') => void;
}

const lerpColor = (a: string, b: string, t: number) => {
  const ca = new THREE.Color(a);
  const cb = new THREE.Color(b);
  return ca.lerp(cb, t);
};

function TerrainMesh({ onMine }: { onMine: (x: number, z: number) => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const geoRef = useRef<THREE.PlaneGeometry | null>(null);
  const { size, resolution } = terrainEngine;
  const [revision, setRevision] = useState(0);
  const isSwiper = useRef(false);
  const lastPoint = useRef<{ x: number; z: number } | null>(null);

  useEffect(() => {
    return sceneManager.addTerrainUpdateListener(() => setRevision(r => r + 1));
  }, []);

  const update = useCallback(() => {
    if (!geoRef.current) return;
    const pos = geoRef.current.attributes.position;
    const verts = terrainEngine.getVertices();
    const colors = new Float32Array(pos.count * 3);

    for (let i = 0; i <= resolution; i++) {
      for (let j = 0; j <= resolution; j++) {
        const idx = i * (resolution + 1) + j;
        const v = verts[i][j];
        pos.setY(idx, v.currentHeight);
        const col = new THREE.Color(terrainEngine.getStratumColorAtGrid(i, j));
        colors[idx * 3] = col.r;
        colors[idx * 3 + 1] = col.g;
        colors[idx * 3 + 2] = col.b;
      }
    }
    pos.needsUpdate = true;
    geoRef.current.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geoRef.current.computeVertexNormals();
  }, [resolution]);

  useEffect(() => { update(); }, [revision, update]);

  const planeGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(size, size, resolution, resolution);
    geo.rotateX(-Math.PI / 2);
    geoRef.current = geo;
    update();
    return geo;
  }, [size, resolution, update]);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.button !== 0) return;
    isSwiper.current = true;
    lastPoint.current = { x: e.point.x, z: e.point.z };
    terrainEngine.mineAt(e.point.x, e.point.z, 2.5, 1.2);
    onMine(e.point.x, e.point.z);
    setRevision(r => r + 1);
  };
  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!isSwiper.current || !lastPoint.current) return;
    const dx = e.point.x - lastPoint.current.x;
    const dz = e.point.z - lastPoint.current.z;
    if (dx * dx + dz * dz > 0.8) {
      terrainEngine.mineSwipe(lastPoint.current.x, lastPoint.current.z, e.point.x, e.point.z, 2.2, 0.9);
      lastPoint.current = { x: e.point.x, z: e.point.z };
      setRevision(r => r + 1);
    }
  };
  const stopSwipe = () => { isSwiper.current = false; lastPoint.current = null; };

  return (
    <mesh
      ref={meshRef}
      geometry={planeGeo}
      receiveShadow
      onPointerDown={handlePointerDown}
      onPointerUp={stopSwipe}
      onPointerMove={handlePointerMove}
      onPointerLeave={stopSwipe}
    >
      <meshStandardMaterial
        vertexColors
        side={THREE.DoubleSide}
        roughness={0.92}
        metalness={0.04}
        flatShading={false}
      />
    </mesh>
  );
}

function GrassAndDecor() {
  const { size } = terrainEngine;
  const N = 180;
  const data = useMemo(() => {
    const arr: { x: number; y: number; z: number; h: number; s: number }[] = [];
    for (let k = 0; k < N; k++) {
      const x = (Math.sin(k * 23.7) * 0.5 + 0.5 - 0.5) * size * 0.92;
      const z = (Math.cos(k * 31.1) * 0.5 + 0.5 - 0.5) * size * 0.92;
      const g = terrainEngine.worldToGrid(x, z);
      const v = terrainEngine.getVertex(g.i, g.j);
      const h = v?.originalHeight ?? 1;
      const depthBelow = (v?.originalHeight ?? 1) - (v?.currentHeight ?? h);
      if (depthBelow > 0.05) continue;
      arr.push({ x, y: h + 0.02, z, h: 0.2 + (k % 7) * 0.04, s: 0.9 + (k % 5) * 0.1 });
    }
    return arr;
  }, [size]);

  return (
    <group>
      {data.map((d, i) => (
        <group key={i} position={[d.x, d.y + d.h / 2, d.z]} scale={[d.s, d.s, d.s]}>
          <mesh position={[0, 0, 0]}>
            <coneGeometry args={[0.03, d.h, 4]} />
            <meshStandardMaterial color={i % 3 === 0 ? '#5a7a33' : i % 3 === 1 ? '#4a6a2a' : '#6b8b3a'} />
          </mesh>
        </group>
      ))}
      {data.slice(0, 40).map((d, i) => (
        <group key={`f${i}`} position={[d.x + 0.3, d.y, d.z - 0.2]}>
          <mesh>
            <sphereGeometry args={[0.06, 6, 6]} />
            <meshStandardMaterial color={i % 4 === 0 ? '#ffb6c1' : i % 4 === 1 ? '#fffacd' : i % 4 === 2 ? '#e6e6fa' : '#ffdab9'} emissive={i % 4 === 1 ? '#665500' : '#000000'} emissiveIntensity={0.2} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function ArtifactMesh({
  loc, restored, onClick
}: {
  loc: ArtifactLocation; restored: boolean;
  onClick: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [hover, setHover] = useState(false);
  const def = ARTIFACT_DEFINITIONS[loc.artifactId];
  const bobPhase = useMemo(() => Math.random() * Math.PI * 2, []);
  const claimAnim = useRef<{ t: number; from: number; to: number } | null>(null);

  useFrame((st, dt) => {
    if (groupRef.current) {
      const spawnOffset = sceneManager.getArtifactSpawnOffset(loc.id);
      const bob = Math.sin(st.clock.elapsedTime * 1.6 + bobPhase) * 0.15;
      groupRef.current.position.y = spawnOffset + bob;
      groupRef.current.rotation.y += dt * 0.6;
      if (hover) groupRef.current.scale.setScalar(1.08 + Math.sin(st.clock.elapsedTime * 6) * 0.02);
      else groupRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.15);
    }
    if (claimAnim.current) {
      claimAnim.current.t += dt * 2.5;
      if (claimAnim.current.t >= 1) claimAnim.current = null;
    }
  });

  if (!def) return null;

  const prog = restored ? artifactManager.getRestoreProgress(loc.artifactId) : 0;
  const color = restored
    ? lerpColor(def.baseColor, def.restoredColor, Math.min(1, prog)).getStyle()
    : def.baseColor;
  const emissive = restored
    ? lerpColor('#202020', def.glowColor, Math.min(1, prog))
    : new THREE.Color(hover ? def.accentColor : '#303030');

  const render = () => {
    switch (def.shape) {
      case 'pot':
        return (
          <group>
            <mesh><cylinderGeometry args={[0.32, 0.17, 0.6, 12]} />
              <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.35} roughness={0.7} metalness={0.05} />
            </mesh>
            <mesh position={[0, 0.32, 0]}><torusGeometry args={[0.32, 0.05, 8, 18]} />
              <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.35} roughness={0.6} />
            </mesh>
          </group>
        );
      case 'arrow':
        return (
          <group rotation={[0, 0, Math.PI / 2]}>
            <mesh position={[0, 0, 0]}><coneGeometry args={[0.16, 0.55, 5]} />
              <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.4} metalness={0.75} roughness={0.28} />
            </mesh>
            <mesh position={[0.35, 0, 0]}><boxGeometry args={[0.45, 0.06, 0.06]} />
              <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.4} metalness={0.75} roughness={0.3} />
            </mesh>
          </group>
        );
      case 'disc':
        return (
          <group rotation={[Math.PI / 3, 0, 0]}>
            <mesh><torusGeometry args={[0.38, 0.09, 10, 28]} />
              <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.4} roughness={0.45} metalness={0.2} />
            </mesh>
          </group>
        );
      case 'trilobite':
        return (
          <group rotation={[-Math.PI / 4, 0, 0]}>
            <mesh><sphereGeometry args={[0.38, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.3} side={THREE.DoubleSide} roughness={0.6} />
            </mesh>
            <mesh position={[0, 0.06, 0.05]}><boxGeometry args={[0.05, 0.45, 0.03]} />
              <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.3} />
            </mesh>
          </group>
        );
      case 'ding':
        return (
          <group>
            <mesh><cylinderGeometry args={[0.32, 0.27, 0.42, 7]} />
              <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.4} metalness={0.65} roughness={0.45} />
            </mesh>
            <mesh position={[0.32, 0.12, 0]} rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[0.11, 0.035, 6, 14, Math.PI]} />
              <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.4} metalness={0.65} roughness={0.45} />
            </mesh>
            <mesh position={[-0.32, 0.12, 0]} rotation={[0, 0, -Math.PI / 2]}><torusGeometry args={[0.11, 0.035, 6, 14, Math.PI]} />
              <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.4} metalness={0.65} roughness={0.45} />
            </mesh>
          </group>
        );
      case 'axe':
        return (
          <group>
            <mesh><boxGeometry args={[0.55, 0.28, 0.1]} />
              <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.3} roughness={0.85} />
            </mesh>
          </group>
        );
      case 'shell':
        return (
          <group rotation={[-Math.PI / 5, 0, 0]}>
            <mesh><sphereGeometry args={[0.33, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.35} roughness={0.55} side={THREE.DoubleSide} />
            </mesh>
          </group>
        );
      case 'pendant':
        return (
          <group rotation={[0, 0, Math.PI / 6]}>
            <mesh><torusKnotGeometry args={[0.22, 0.055, 50, 10]} />
              <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.45} roughness={0.35} metalness={0.3} />
            </mesh>
          </group>
        );
      default:
        return <mesh><boxGeometry args={[0.3, 0.3, 0.3]} />
          <meshStandardMaterial color={color} /></mesh>;
    }
  };

  return (
    <group
      ref={groupRef}
      position={[loc.x, -3, loc.z]}
      onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onClick(); }}
      onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHover(false); document.body.style.cursor = 'default'; }}
    >
      {render()}
      <pointLight position={[0, 0.6, 0]} color={restored ? def.glowColor : '#fffacd'}
        intensity={hover ? 2.2 : 1.1} distance={3.6} />
      {restored && <Sparkles count={18} scale={[1, 1.2, 1]} size={3} speed={0.6} color={def.glowColor} />}

      {hover && (
        <Html center distanceFactor={11} position={[0, 0.95, 0]} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(40,24,10,0.94), rgba(25,15,6,0.96))',
            border: '1px solid #c9a86a',
            borderRadius: '7px',
            padding: '9px 13px',
            minWidth: '200px',
            maxWidth: '260px',
            color: '#f5e6c8',
            fontFamily: 'Georgia, "Times New Roman", serif',
            boxShadow: '0 5px 16px rgba(0,0,0,0.55), inset 0 0 26px rgba(201,168,106,0.09)',
            backdropFilter: 'blur(3px)'
          }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#e8c88a', marginBottom: '4px', letterSpacing: '0.3px' }}>
              {def.name}
              <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 400, color:
                def.rarity === 'legendary' ? '#ffce5c' : def.rarity === 'rare' ? '#9bc9ff' : '#c8c8c8' }}>
                [{def.rarity === 'legendary' ? '传说' : def.rarity === 'rare' ? '稀有' : '普通'}]
              </span>
            </div>
            <div style={{ fontSize: '11.5px', color: '#b89b6e', marginBottom: '5px' }}>{def.era}</div>
            <div style={{ fontSize: '11.5px', color: '#d4c4a0', lineHeight: 1.45 }}>{def.description}</div>
            <div style={{ fontSize: '10.5px', color: '#8fbc8f', marginTop: '7px', fontStyle: 'italic' }}>
              ✦ 点击可拾取一片碎片到收藏架
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

function RestoredMarker({ loc }: { loc: ArtifactLocation }) {
  const ringRef = useRef<THREE.Mesh>(null);
  const colRef = useRef<THREE.Mesh>(null);
  const def = ARTIFACT_DEFINITIONS[loc.artifactId];
  useFrame((st) => {
    if (ringRef.current) {
      ringRef.current.rotation.y = st.clock.elapsedTime * 1.8;
      const s = 1 + Math.sin(st.clock.elapsedTime * 2.6) * 0.22;
      ringRef.current.scale.set(s, s, s);
    }
    if (colRef.current) {
      colRef.current.scale.y = 1 + Math.sin(st.clock.elapsedTime * 3.2) * 0.2;
    }
  });
  return (
    <group position={[loc.x, 1.6, loc.z]}>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.45, 0.58, 18]} />
        <meshBasicMaterial color={def?.accentColor || '#ffd700'} side={THREE.DoubleSide} transparent opacity={0.78} />
      </mesh>
      <mesh ref={colRef} position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 1.1, 6]} />
        <meshBasicMaterial color={def?.accentColor || '#ffd700'} transparent opacity={0.55} />
      </mesh>
      <pointLight color={def?.accentColor || '#ffd700'} intensity={1.7} distance={4.5} />
    </group>
  );
}

function ParticleBursts() {
  const [bursts, setBursts] = useState<{ id: number; x: number; y: number; z: number; color: string; t0: number }[]>([]);
  useEffect(() => {
    return sceneManager.addTerrainUpdateListener(() => {
      const items = sceneManager.consumeParticleQueue();
      if (items.length === 0) return;
      const t0 = performance.now();
      setBursts(prev => [...prev, ...items.map((q, idx) => ({
        id: t0 + idx + Math.random(), x: q.x, y: q.y, z: q.z, color: q.color, t0
      }))]);
    });
  }, []);
  useEffect(() => {
    const id = setInterval(() => {
      const now = performance.now();
      setBursts(prev => prev.filter(b => now - b.t0 < 3500));
    }, 800);
    return () => clearInterval(id);
  }, []);
  return (
    <>
      {bursts.map(b => (
        <Sparkles key={b.id} position={[b.x, b.y, b.z]}
          count={22} scale={[1.6, 2.2, 1.6]} size={4} speed={1.3} color={b.color} />
      ))}
    </>
  );
}

function CameraRig() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(26, 22, 26);
    camera.lookAt(0, 0, 0);
  }, [camera]);
  useFrame(() => sceneManager.tick(1 / 60));
  return null;
}

export function TerrainCanvas({
  onArtifactCollected, onMined, highlightLocationIds, cursorMode
}: TerrainCanvasProps) {
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    return sceneManager.addTerrainUpdateListener(() => setRevision(r => r + 1));
  }, []);

  const discovered = terrainEngine.getDiscoveredArtifacts();

  const handleArtifactClick = useCallback((loc: ArtifactLocation) => {
    const def = ARTIFACT_DEFINITIONS[loc.artifactId];
    if (!def) return;
    const pieces = artifactManager.getPiecesByArtifact(loc.artifactId);
    const uncollected = pieces.find(p => !p.collected);
    if (!uncollected) return;
    const claimed = terrainEngine.claimArtifactPiece(loc.id, uncollected.pieceIndex);
    if (!claimed) {
      const another = pieces.filter(p => !(loc.pieceClaimed && loc.pieceClaimed[p.pieceIndex])).find(p => !p.collected);
      if (another) {
        terrainEngine.claimArtifactPiece(loc.id, another.pieceIndex);
        artifactManager.collectPiece(another.id);
        onArtifactCollected(loc.id, loc.artifactId, another.id);
      }
      return;
    }
    artifactManager.collectPiece(uncollected.id);
    onArtifactCollected(loc.id, loc.artifactId, uncollected.id);
  }, [onArtifactCollected]);

  const highlightedSet = new Set(highlightLocationIds);

  return (
    <Canvas
      shadows
      camera={{ fov: 50, near: 0.1, far: 200 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      dpr={[1, 2]}
      style={{ cursor: cursorMode === 'shovel' ? 'crosshair' : cursorMode === 'grab' ? 'grab' : 'default' }}
    >
      <color attach="background" args={[0x2a1a0d]} />
      <fog attach="fog" args={[0x2a1a0d, 50, 95]} />

      <CameraRig />

      <ambientLight intensity={0.42} color={0xd4b896} />
      <directionalLight
        position={[30, 42, 22]} intensity={1.25} color={0xf5e6c8}
        castShadow shadow-mapSize={[1024, 1024]}
      />
      <hemisphereLight args={[0x87ceeb, 0x3d2817, 0.32]} />

      <Stars radius={110} depth={60} count={600} factor={4} fade speed={0.5} />

      <TerrainMesh key={`tm-${revision}`} onMine={onMined} />

      <GrassAndDecor />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -16, 0]}>
        <circleGeometry args={[65, 40]} />
        <meshStandardMaterial color={0x1a0f08} />
      </mesh>

      {discovered.map(loc => (
        <ArtifactMesh
          key={loc.id}
          loc={loc}
          restored={loc.restored}
          onClick={() => handleArtifactClick(loc)}
        />
      ))}

      {highlightedSet.size > 0 && terrainEngine.getArtifactLocations().map(loc =>
        highlightedSet.has(loc.id) ? <RestoredMarker key={`m-${loc.id}`} loc={loc} /> : null
      )}

      <ParticleBursts />

      <OrbitControls
        enableDamping dampingFactor={0.09}
        minDistance={9} maxDistance={65}
        maxPolarAngle={Math.PI / 2.25} minPolarAngle={Math.PI / 6.5}
        enablePan={true} panSpeed={0.9} rotateSpeed={0.85} zoomSpeed={0.95}
        mouseButtons={{
          LEFT: undefined,
          MIDDLE: THREE.MOUSE.PAN,
          RIGHT: THREE.MOUSE.ROTATE
        }}
      />
    </Canvas>
  );
}
