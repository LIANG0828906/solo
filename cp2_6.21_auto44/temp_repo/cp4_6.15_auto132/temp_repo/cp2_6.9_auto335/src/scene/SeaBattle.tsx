import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { ShipData, FormationType } from '../App';

interface SeaBattleProps {
  ships: ShipData[];
  selectedShipId: number | null;
  onShipSelect: (id: number | null) => void;
  onShipPositionUpdate: (id: number, position: [number, number, number]) => void;
  isPaused: boolean;
  isFiring: boolean;
  currentFormation: FormationType;
}

interface Projectile {
  id: number;
  shipId: number;
  startPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  progress: number;
  duration: number;
  side: 'left' | 'right';
  cannonIndex: number;
}

interface Splash {
  id: number;
  position: THREE.Vector3;
  startTime: number;
}

interface SmokeParticle {
  id: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  startTime: number;
  life: number;
}

const SeaBattle: React.FC<SeaBattleProps> = ({
  ships,
  selectedShipId,
  onShipSelect,
  onShipPositionUpdate,
  isPaused,
  isFiring,
  currentFormation
}) => {
  const seaRef = useRef<THREE.Mesh>(null);
  const shipRefs = useRef<Map<number, THREE.Group>>(new Map());
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [splashes, setSplashes] = useState<Splash[]>([]);
  const [smokeParticles, setSmokeParticles] = useState<SmokeParticle[]>([]);
  const [waveOffset, setWaveOffset] = useState(0);
  const projectileIdRef = useRef(0);
  const splashIdRef = useRef(0);
  const smokeIdRef = useRef(0);
  const shipPositionsRef = useRef<Map<number, [number, number, number]>>(new Map());
  const moveStartTimesRef = useRef<Map<number, number>>(new Map());
  const dragStateRef = useRef<{ id: number; offset: THREE.Vector3 } | null>(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const planeRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));

  const WAVE_LENGTH = 8;
  const WAVE_AMPLITUDE = 0.2;
  const WIND_SPEED = 3;
  const ANIMATION_DURATION = 0.5;

  const seaGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(200, 200, 100, 100);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, []);

  const seaMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#0a2a4a',
    roughness: 0.8,
    metalness: 0.1,
    transparent: true,
    opacity: 0.95
  }), []);

  useEffect(() => {
    if (isFiring) {
      const newProjectiles: Projectile[] = [];
      ships.forEach(ship => {
        for (let side of ['left', 'right'] as const) {
          for (let i = 0; i < 3; i++) {
            const shipPos = shipPositionsRef.current.get(ship.id) || ship.position;
            const startX = shipPos[0] + (side === 'left' ? -1.2 : 1.2);
            const startY = 0.8;
            const startZ = shipPos[2] + (i - 1) * 0.8;
            
            const targetX = shipPos[0] + (side === 'left' ? -1 : 1) * (15 + Math.random() * 20);
            const targetZ = shipPos[2] + (Math.random() - 0.5) * 15;
            
            newProjectiles.push({
              id: projectileIdRef.current++,
              shipId: ship.id,
              startPos: new THREE.Vector3(startX, startY, startZ),
              targetPos: new THREE.Vector3(targetX, 0, targetZ),
              progress: 0,
              duration: 1.5 + Math.random() * 0.5,
              side,
              cannonIndex: i
            });
          }
        }
      });
      setProjectiles(prev => [...prev, ...newProjectiles]);
    }
  }, [isFiring, ships]);

  const getWaveHeight = useCallback((x: number, z: number, offset: number) => {
    return Math.sin((x + z) / WAVE_LENGTH + offset) * WAVE_AMPLITUDE
         + Math.sin((x - z) / (WAVE_LENGTH * 1.5) + offset * 0.8) * WAVE_AMPLITUDE * 0.5;
  }, []);

  useFrame((state, delta) => {
    if (isPaused) return;

    const time = state.clock.elapsedTime;
    const newOffset = waveOffset + delta * WIND_SPEED * 0.5;
    setWaveOffset(newOffset);

    if (seaRef.current) {
      const positions = seaRef.current.geometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const z = positions.getZ(i);
        const y = getWaveHeight(x, z, newOffset);
        positions.setY(i, y);
      }
      positions.needsUpdate = true;
      seaRef.current.geometry.computeVertexNormals();
    }

    ships.forEach(ship => {
      const currentPos = shipPositionsRef.current.get(ship.id) || [...ship.position] as [number, number, number];
      const targetPos = ship.targetPosition;
      
      const dist = Math.sqrt(
        Math.pow(currentPos[0] - targetPos[0], 2) +
        Math.pow(currentPos[2] - targetPos[2], 2)
      );

      if (dist > 0.1) {
        if (!moveStartTimesRef.current.has(ship.id)) {
          moveStartTimesRef.current.set(ship.id, time);
        }
        
        const startTime = moveStartTimesRef.current.get(ship.id)!;
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
        const eased = 1 - Math.pow(1 - progress, 3);

        const newX = currentPos[0] + (targetPos[0] - currentPos[0]) * eased * 0.1;
        const newZ = currentPos[2] + (targetPos[2] - currentPos[2]) * eased * 0.1;
        const newY = getWaveHeight(newX, newZ, newOffset);

        shipPositionsRef.current.set(ship.id, [newX, newY, newZ]);

        if (progress >= 1 && dist < 0.5) {
          moveStartTimesRef.current.delete(ship.id);
        }
      } else {
        const newY = getWaveHeight(currentPos[0], currentPos[2], newOffset);
        shipPositionsRef.current.set(ship.id, [currentPos[0], newY, currentPos[2]]);
      }

      const group = shipRefs.current.get(ship.id);
      if (group) {
        const pos = shipPositionsRef.current.get(ship.id)!;
        group.position.set(pos[0], pos[1], pos[2]);
        
        const waveRotX = Math.cos((pos[0] + pos[2]) / WAVE_LENGTH + newOffset) * 0.05;
        const waveRotZ = Math.sin((pos[0] - pos[2]) / WAVE_LENGTH + newOffset) * 0.03;
        group.rotation.x = waveRotX;
        group.rotation.z = waveRotZ;
      }
    });

    setProjectiles(prev => {
      const updated: Projectile[] = [];
      prev.forEach(proj => {
        const newProgress = proj.progress + delta / proj.duration;
        if (newProgress < 1) {
          updated.push({ ...proj, progress: newProgress });
          
          if (Math.random() < 0.3) {
            const t = newProgress;
            const x = proj.startPos.x + (proj.targetPos.x - proj.startPos.x) * t;
            const y = proj.startPos.y + (proj.targetPos.y - proj.startPos.y) * t - 9.8 * t * t * 0.5 + 12 * t * (1 - t);
            const z = proj.startPos.z + (proj.targetPos.z - proj.startPos.z) * t;
            
            setSmokeParticles(prev => [...prev, {
              id: smokeIdRef.current++,
              position: new THREE.Vector3(x, y, z),
              velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.5,
                Math.random() * 1,
                (Math.random() - 0.5) * 0.5
              ),
              startTime: time,
              life: 0.8
            }]);
          }
        } else {
          setSplashes(prev => [...prev, {
            id: splashIdRef.current++,
            position: proj.targetPos.clone(),
            startTime: time
          }]);
          
          for (let i = 0; i < 8; i++) {
            setSmokeParticles(prev => [...prev, {
              id: smokeIdRef.current++,
              position: proj.targetPos.clone(),
              velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 3,
                Math.random() * 5 + 2,
                (Math.random() - 0.5) * 3
              ),
              startTime: time,
              life: 1
            }]);
          }
        }
      });
      return updated;
    });

    setSmokeParticles(prev => prev.filter(p => time - p.startTime < p.life));
    setSplashes(prev => prev.filter(s => time - s.startTime < 1));
  });

  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>, shipId: number) => {
    e.stopPropagation();
    onShipSelect(shipId);
    
    const group = shipRefs.current.get(shipId);
    if (group) {
      const point = e.point;
      dragStateRef.current = {
        id: shipId,
        offset: new THREE.Vector3(
          point.x - group.position.x,
          0,
          point.z - group.position.z
        )
      };
      (e.target as any).setPointerCapture?.(e.pointerId);
    }
  }, [onShipSelect]);

  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!dragStateRef.current || isPaused) return;
    
    const { id, offset } = dragStateRef.current;
    const ndc = new THREE.Vector2(
      (e.clientX / window.innerWidth) * 2 - 1,
      -(e.clientY / window.innerHeight) * 2 + 1
    );
    
    raycasterRef.current.setFromCamera(ndc, e.camera);
    const intersection = new THREE.Vector3();
    raycasterRef.current.ray.intersectPlane(planeRef.current, intersection);
    
    if (intersection) {
      const newPos: [number, number, number] = [
        intersection.x - offset.x,
        0,
        intersection.z - offset.z
      ];
      shipPositionsRef.current.set(id, newPos);
      onShipPositionUpdate(id, newPos);
    }
  }, [isPaused, onShipPositionUpdate]);

  const handlePointerUp = useCallback(() => {
    dragStateRef.current = null;
  }, []);

  const renderShip = (ship: ShipData) => {
    const pos = shipPositionsRef.current.get(ship.id) || ship.position;
    const isSelected = selectedShipId === ship.id;
    const healthPercent = ship.health / ship.maxHealth;
    const healthColor = healthPercent > 0.6 ? '#2ecc71' : healthPercent > 0.3 ? '#f39c12' : '#e74c3c';

    return (
      <group
        key={ship.id}
        ref={(el) => { if (el) shipRefs.current.set(ship.id, el); }}
        position={pos}
        onPointerDown={(e) => handlePointerDown(e, ship.id)}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[3, 1, 1.2]} />
          <meshStandardMaterial color="#8b5a2b" roughness={0.8} />
        </mesh>
        
        <mesh position={[0, 0.7, -1]} castShadow>
          <boxGeometry args={[2.8, 0.4, 0.4]} />
          <meshStandardMaterial color="#6b4423" />
        </mesh>
        
        <mesh position={[0, 0.7, 1]} castShadow>
          <boxGeometry args={[2.8, 0.4, 0.4]} />
          <meshStandardMaterial color="#6b4423" />
        </mesh>
        
        {[-0.8, 0, 0.8].map((z, i) => (
          <React.Fragment key={i}>
            <mesh position={[-1.5, 0.6, z]}>
              <cylinderGeometry args={[0.08, 0.08, 0.5, 8]} />
              <meshStandardMaterial color="#333333" />
            </mesh>
            <mesh position={[1.5, 0.6, z]} rotation={[0, Math.PI, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 0.5, 8]} />
              <meshStandardMaterial color="#333333" />
            </mesh>
          </React.Fragment>
        ))}
        
        <mesh position={[0, 1.2, 0]} castShadow>
          <boxGeometry args={[0.3, 1.5, 0.3]} />
          <meshStandardMaterial color="#5d4037" />
        </mesh>
        
        <mesh position={[0, 2, 0.1]} rotation={[0, 0, 0]}>
          <planeGeometry args={[1.5, 1.2]} />
          <meshStandardMaterial color="#f5deb3" side={THREE.DoubleSide} roughness={0.9} />
        </mesh>
        
        {isSelected && (
          <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[2.2, 2.5, 32]} />
            <meshBasicMaterial 
              color="#ffd700" 
              transparent 
              opacity={0.6 + Math.sin(Date.now() / 200) * 0.4}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
        
        <group position={[0, 3, 0]}>
          <mesh>
            <planeGeometry args={[1.2, 0.15]} />
            <meshBasicMaterial color="#333333" transparent opacity={0.8} />
          </mesh>
          <mesh position={[-(1 - healthPercent) * 0.6, 0, 0.01]}>
            <planeGeometry args={[1.2 * healthPercent, 0.1]} />
            <meshBasicMaterial color={healthColor} />
          </mesh>
          <mesh position={[0, 0.25, 0]}>
            <planeGeometry args={[0.8, 0.25]} />
            <meshBasicMaterial color="#000000" transparent opacity={0.7} />
          </mesh>
        </group>
      </group>
    );
  };

  const renderProjectile = (proj: Projectile) => {
    const t = proj.progress;
    const x = proj.startPos.x + (proj.targetPos.x - proj.startPos.x) * t;
    const y = proj.startPos.y + (proj.targetPos.y - proj.startPos.y) * t - 9.8 * t * t * 0.5 + 12 * t * (1 - t);
    const z = proj.startPos.z + (proj.targetPos.z - proj.startPos.z) * t;

    return (
      <mesh key={proj.id} position={[x, y, z]}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshStandardMaterial color="#444444" metalness={0.8} roughness={0.3} />
      </mesh>
    );
  };

  const renderSplash = (splash: Splash, time: number) => {
    const elapsed = time - splash.startTime;
    const progress = Math.min(elapsed / 1, 1);
    const height = 2 + progress * 2;
    const opacity = 1 - progress;

    return (
      <group key={splash.id} position={[splash.position.x, 0, splash.position.z]}>
        {[...Array(8)].map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          const radius = progress * 2;
          return (
            <mesh
              key={i}
              position={[
                Math.cos(angle) * radius,
                height * Math.sin(progress * Math.PI),
                Math.sin(angle) * radius
              ]}
            >
              <sphereGeometry args={[0.15 * (1 - progress * 0.5), 6, 6]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={opacity * 0.8} />
            </mesh>
          );
        })}
      </group>
    );
  };

  const renderSmoke = (smoke: SmokeParticle, time: number) => {
    const elapsed = time - smoke.startTime;
    const progress = elapsed / smoke.life;
    const pos = smoke.position.clone().add(
      smoke.velocity.clone().multiplyScalar(elapsed)
    );
    const opacity = 1 - progress;
    const scale = 0.2 + progress * 0.5;

    return (
      <mesh key={smoke.id} position={[pos.x, pos.y, pos.z]} scale={scale}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshBasicMaterial color="#888888" transparent opacity={opacity * 0.4} />
      </mesh>
    );
  };

  const renderMoveTrail = (ship: ShipData) => {
    const currentPos = shipPositionsRef.current.get(ship.id) || ship.position;
    const targetPos = ship.targetPosition;
    
    const dist = Math.sqrt(
      Math.pow(currentPos[0] - targetPos[0], 2) +
      Math.pow(currentPos[2] - targetPos[2], 2)
    );
    
    if (dist < 0.5) return null;

    const points: THREE.Vector3[] = [];
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      points.push(new THREE.Vector3(
        currentPos[0] + (targetPos[0] - currentPos[0]) * t,
        0.1,
        currentPos[2] + (targetPos[2] - currentPos[2]) * t
      ));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    
    return (
      <line key={`trail-${ship.id}`}>
        <bufferGeometry attach="geometry" {...geometry} />
        <lineBasicMaterial 
          attach="material" 
          color="#ffffff" 
          transparent 
          opacity={0.4}
          linewidth={1}
        />
      </line>
    );
  };

  const time = Date.now() / 1000;

  return (
    <group>
      <mesh 
        ref={seaRef} 
        geometry={seaGeometry} 
        material={seaMaterial} 
        receiveShadow 
        rotation={[0, 0, 0]}
      />
      
      <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <mesh>
          <ringGeometry args={[30, 30.5, 128]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.1} />
        </mesh>
      </group>
      
      {ships.map(ship => renderMoveTrail(ship))}
      
      {ships.map(ship => renderShip(ship))}
      
      {projectiles.map(proj => renderProjectile(proj))}
      
      {splashes.map(splash => renderSplash(splash, time))}
      
      {smokeParticles.map(smoke => renderSmoke(smoke, time))}
    </group>
  );
};

export default SeaBattle;
