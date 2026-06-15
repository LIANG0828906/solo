import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useClockStore, SHICHEN } from '@/store/useClockStore';
import { useClockControls } from '@/controls/useClockControls';

const POT_HEIGHT = 200;
const POT_RADIUS = 80;
const WATER_MIN = 1 / 6;
const WATER_MAX = 5 / 6;
const MAX_PARTICLES = 100;

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  active: boolean;
}

interface Ripple {
  mesh: THREE.Mesh;
  life: number;
  maxLife: number;
}

export const WaterClock = () => {
  const groupRef = useRef<THREE.Group>(null);
  const waterRef = useRef<THREE.Mesh>(null);
  const arrowRef = useRef<THREE.Group>(null);
  const handleRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<Particle[]>([]);
  const ripplesRef = useRef<Ripple[]>([]);
  const particlePoolRef = useRef<THREE.Mesh[]>([]);
  const lastEmitRef = useRef<{ [key: string]: number }>({ 0: 0, 1: 0, 2: 0 });
  const rippleEmitRef = useRef(0);

  const waterLevel = useClockStore(state => state.waterLevel);
  const arrowOffset = useClockStore(state => state.arrowOffset);
  const dayRatio = useClockStore(state => state.dayRatio);
  const scaleRingRotation = useClockStore(state => state.scaleRingRotation);

  const { setHandleRef } = useClockControls();

  useEffect(() => {
    setHandleRef(handleRef.current);
  }, [setHandleRef]);

  const baguaSymbols = ['☰', '☷', '☳', '☶', '☵', '☲', '☴', '☱'];

  const rivetPositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    const rows = 4;
    const cols = 12;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const angle = (c / cols) * Math.PI * 2;
        const y = -POT_HEIGHT / 2 + 30 + r * 45;
        const radius = POT_RADIUS - 2;
        positions.push([
          Math.cos(angle) * radius,
          y,
          Math.sin(angle) * radius
        ]);
      }
    }
    return positions;
  }, []);

  const particleGeometry = useMemo(() => new THREE.SphereGeometry(1.5, 8, 8), []);
  const particleMaterial = useMemo(() => 
    new THREE.MeshBasicMaterial({ 
      color: 0x88ccff, 
      transparent: true, 
      opacity: 0.7 
    }), 
  []);

  useEffect(() => {
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const mesh = new THREE.Mesh(particleGeometry, particleMaterial);
      mesh.visible = false;
      particlePoolRef.current.push(mesh);
      particlesRef.current.push({
        mesh,
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: 2,
        active: false
      });
    }
  }, [particleGeometry, particleMaterial]);

  const getInactiveParticle = (): Particle | null => {
    for (const p of particlesRef.current) {
      if (!p.active) return p;
    }
    return null;
  };

  const createRipple = (x: number, z: number) => {
    const geometry = new THREE.RingGeometry(1, 2, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, -POT_HEIGHT / 2 - 25, z);
    
    if (groupRef.current) {
      groupRef.current.add(mesh);
    }
    
    ripplesRef.current.push({
      mesh,
      life: 0,
      maxLife: 1.5
    });
  };

  const outflowPositions = useMemo(() => [
    [-POT_RADIUS + 5, -POT_HEIGHT / 2 + 15, 0],
    [POT_RADIUS - 5, -POT_HEIGHT / 2 + 15, 0],
    [0, -POT_HEIGHT / 2 + 15, POT_RADIUS - 5]
  ], []);

  useFrame((_, delta) => {
    if (waterRef.current) {
      const waterHeight = POT_HEIGHT * (waterLevel - WATER_MIN);
      const scaleY = waterHeight / (POT_HEIGHT * (WATER_MAX - WATER_MIN)) * 0.67;
      waterRef.current.scale.y = Math.max(0.01, scaleY);
      waterRef.current.position.y = -POT_HEIGHT / 2 + waterHeight / 2 + POT_HEIGHT * WATER_MIN;
    }

    if (arrowRef.current) {
      const effectiveLevel = waterLevel + arrowOffset * 0.01;
      const arrowY = -POT_HEIGHT / 2 + POT_HEIGHT * effectiveLevel + 20;
      arrowRef.current.position.y = arrowY;
    }

    if (handleRef.current) {
      const handleY = -POT_HEIGHT / 2 + POT_HEIGHT * waterLevel + 50;
      handleRef.current.position.y = handleY;
    }

    const flowRate = 5 + (waterLevel - WATER_MIN) / (WATER_MAX - WATER_MIN) * 15;
    const emitInterval = 1000 / flowRate;
    const now = Date.now();

    if (waterLevel > WATER_MIN + 0.05) {
      outflowPositions.forEach((pos, index) => {
        if (now - lastEmitRef.current[index] > emitInterval) {
          const particle = getInactiveParticle();
          if (particle) {
            particle.mesh.position.set(pos[0], pos[1], pos[2]);
            particle.velocity.set(
              (Math.random() - 0.5) * 0.5,
              -50 - Math.random() * 20,
              (Math.random() - 0.5) * 0.5
            );
            particle.life = 0;
            particle.maxLife = 1.5 + Math.random() * 0.5;
            particle.active = true;
            particle.mesh.visible = true;
            
            if (groupRef.current && !particle.mesh.parent) {
              groupRef.current.add(particle.mesh);
            }
          }
          lastEmitRef.current[index] = now;
        }
      });
    }

    particlesRef.current.forEach(particle => {
      if (!particle.active) return;
      
      particle.life += delta;
      if (particle.life >= particle.maxLife) {
        particle.active = false;
        particle.mesh.visible = false;
        return;
      }

      particle.velocity.y -= 98 * delta;
      particle.mesh.position.addScaledVector(particle.velocity, delta);
      
      const opacity = 1 - (particle.life / particle.maxLife);
      (particle.mesh.material as THREE.MeshBasicMaterial).opacity = opacity * 0.7;
      
      const targetY = -POT_HEIGHT / 2 - 28;
      if (particle.mesh.position.y < targetY && particle.life > 0.3) {
        if (now - rippleEmitRef.current > 100) {
          createRipple(particle.mesh.position.x, particle.mesh.position.z);
          rippleEmitRef.current = now;
        }
        particle.active = false;
        particle.mesh.visible = false;
      }
    });

    ripplesRef.current = ripplesRef.current.filter(ripple => {
      ripple.life += delta;
      if (ripple.life >= ripple.maxLife) {
        if (groupRef.current) {
          groupRef.current.remove(ripple.mesh);
        }
        ripple.mesh.geometry.dispose();
        (ripple.mesh.material as THREE.Material).dispose();
        return false;
      }

      const progress = ripple.life / ripple.maxLife;
      const scale = 1 + progress * 8;
      ripple.mesh.scale.setScalar(scale);
      (ripple.mesh.material as THREE.MeshBasicMaterial).opacity = (1 - progress) * 0.5;
      
      return true;
    });
  });

  const arrowScaleLines = useMemo(() => {
    const lines: { position: [number, number, number]; height: number; width: number; isKe: boolean; label?: string }[] = [];
    const dayKe = dayRatio;
    const nightKe = 100 - dayRatio;
    const arrowHeight = 180;
    
    for (let i = 0; i <= 100; i++) {
      let yPos: number;
      if (i < dayKe) {
        yPos = (i / dayKe) * (arrowHeight * 0.6) - arrowHeight / 2;
      } else {
        const nightProgress = (i - dayKe) / nightKe;
        yPos = arrowHeight * 0.1 + nightProgress * (arrowHeight * 0.4) - arrowHeight / 2;
      }
      
      const isMajor = i % 5 === 0;
      
      lines.push({
        position: [0, yPos, 6],
        height: isMajor ? 4 : 2,
        width: isMajor ? 12 : 6,
        isKe: true,
        label: isMajor ? `${i}` : undefined
      });
    }
    
    for (let i = 0; i < 12; i++) {
      const kePerShichenDay = dayKe / 6;
      const kePerShichenNight = nightKe / 6;
      
      let kePos: number;
      if (i < 6) {
        kePos = i * kePerShichenNight;
      } else {
        kePos = nightKe + (i - 6) * kePerShichenDay;
      }
      
      let yPos: number;
      if (kePos < dayKe) {
        yPos = (kePos / dayKe) * (arrowHeight * 0.6) - arrowHeight / 2;
      } else {
        const nightProgress = (kePos - dayKe) / nightKe;
        yPos = arrowHeight * 0.1 + nightProgress * (arrowHeight * 0.4) - arrowHeight / 2;
      }
      
      lines.push({
        position: [0, yPos, 6],
        height: 8,
        width: 18,
        isKe: false,
        label: SHICHEN[i]
      });
    }
    
    return lines;
  }, [dayRatio]);

  const scaleRingMarkers = useMemo(() => {
    const markers: { angle: number; isDay: boolean }[] = [];
    
    for (let i = 0; i < 100; i++) {
      const angle = (i / 100) * Math.PI * 2 - Math.PI / 2;
      markers.push({
        angle,
        isDay: i < dayRatio
      });
    }
    
    return markers;
  }, [dayRatio]);

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <mesh position={[0, -POT_HEIGHT / 2 - 30, 0]}>
        <cylinderGeometry args={[POT_RADIUS + 30, POT_RADIUS + 35, 8, 48]} />
        <meshStandardMaterial color={0x7a6a5a} roughness={0.8} />
      </mesh>
      
      {[0, 1, 2].map((i) => {
        const angle = (i / 3) * Math.PI * 2 - Math.PI / 2;
        const x = Math.cos(angle) * (POT_RADIUS - 15);
        const z = Math.sin(angle) * (POT_RADIUS - 15);
        return (
          <group key={`leg-${i}`} position={[x, -POT_HEIGHT / 2 - 15, z]}>
            <mesh rotation={[0, angle, 0]}>
              <boxGeometry args={[12, 30, 12]} />
              <meshStandardMaterial color={0x6b4e3a} roughness={0.6} metalness={0.3} />
            </mesh>
            <mesh position={[0, -12, 0]} rotation={[0, angle, 0]}>
              <boxGeometry args={[18, 6, 18]} />
              <meshStandardMaterial color={0x5a3e2a} roughness={0.7} />
            </mesh>
          </group>
        );
      })}

      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[POT_RADIUS, POT_RADIUS + 4, POT_HEIGHT, 48, 1, true]} />
        <meshStandardMaterial 
          color={0x6b4e3a} 
          roughness={0.5} 
          metalness={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh position={[0, POT_HEIGHT / 2 + 2, 0]}>
        <cylinderGeometry args={[POT_RADIUS + 6, POT_RADIUS + 8, 8, 48]} />
        <meshStandardMaterial color={0x8b7a6a} roughness={0.4} metalness={0.5} />
      </mesh>

      {rivetPositions.map((pos, i) => (
        <mesh key={`rivet-${i}`} position={pos}>
          <sphereGeometry args={[2, 8, 8]} />
          <meshStandardMaterial color={0x4a3a2a} roughness={0.3} metalness={0.6} />
        </mesh>
      ))}

      {[-1, 1].map((side, i) => (
        <group key={`dragon-${i}`} position={[side * (POT_RADIUS + 10), POT_HEIGHT / 2 - 40, 0]}>
          <mesh rotation={[0, side > 0 ? 0 : Math.PI, 0]}>
            <cylinderGeometry args={[4, 6, 20, 12]} />
            <meshStandardMaterial color={0x6b4e3a} roughness={0.4} metalness={0.5} />
          </mesh>
          <mesh position={[side * 12, 0, 0]} rotation={[0, side > 0 ? 0 : Math.PI, 0]}>
            <sphereGeometry args={[6, 12, 12]} />
            <meshStandardMaterial color={0x5a3e2a} roughness={0.3} metalness={0.6} />
          </mesh>
          <mesh position={[side * 16, -2, 0]} rotation={[0, side > 0 ? 0 : Math.PI, 0]}>
            <cylinderGeometry args={[2, 3, 8, 8]} />
            <meshStandardMaterial color={0x4a2a1a} roughness={0.3} />
          </mesh>
        </group>
      ))}

      <mesh position={[0, POT_HEIGHT / 2 + 6, 0]}>
        <cylinderGeometry args={[POT_RADIUS + 8, POT_RADIUS + 8, 4, 48]} />
        <meshStandardMaterial color={0x8b7a6a} roughness={0.4} metalness={0.5} />
      </mesh>

      <mesh position={[0, POT_HEIGHT / 2 + 8, 0]}>
        <ringGeometry args={[20, POT_RADIUS + 6, 48]} />
        <meshStandardMaterial 
          color={0x8b7a6a} 
          roughness={0.4} 
          metalness={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>

      {baguaSymbols.map((_, i) => {
        const angle = (i / 8) * Math.PI * 2 - Math.PI / 8;
        const radius = POT_RADIUS - 15;
        return (
          <mesh 
            key={`bagua-${i}`} 
            position={[
              Math.cos(angle) * radius,
              POT_HEIGHT / 2 + 9,
              Math.sin(angle) * radius
            ]}
            rotation={[-Math.PI / 2, 0, angle + Math.PI / 2]}
          >
            <planeGeometry args={[12, 12]} />
            <meshBasicMaterial color={0x4a3a2a} transparent opacity={0.8} />
          </mesh>
        );
      })}

      <mesh ref={waterRef} position={[0, 0, 0]}>
        <cylinderGeometry args={[POT_RADIUS - 3, POT_RADIUS - 3, POT_HEIGHT * (WATER_MAX - WATER_MIN), 48]} />
        <meshStandardMaterial 
          color={0x2a5a8a} 
          transparent 
          opacity={0.7}
          roughness={0.1}
          metalness={0.3}
        />
      </mesh>

      <group ref={handleRef} position={[0, POT_HEIGHT / 2 + 50, 0]}>
        <mesh>
          <cylinderGeometry args={[2, 2, 100, 8]} />
          <meshStandardMaterial color={0xc8a86e} roughness={0.5} />
        </mesh>
        <mesh position={[0, 52, 0]}>
          <sphereGeometry args={[6, 16, 16]} />
          <meshStandardMaterial 
            color={0x66ccff} 
            roughness={0.1} 
            metalness={0.9}
            emissive={0x3366aa}
            emissiveIntensity={0.3}
          />
        </mesh>
      </group>

      <group ref={arrowRef} position={[0, 0, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[8, 180, 8]} />
          <meshStandardMaterial color={0xd4a76a} roughness={0.6} />
        </mesh>
        
        <mesh position={[0, 92, 0]}>
          <coneGeometry args={[6, 12, 4]} />
          <meshStandardMaterial color={0xc8a050} roughness={0.4} metalness={0.5} />
        </mesh>

        {arrowScaleLines.map((line, i) => (
          <group key={`arrow-line-${i}`}>
            <mesh position={line.position}>
              <boxGeometry args={[line.width, line.height, 1]} />
              <meshBasicMaterial color={line.isKe ? 0x4a2a1a : 0x8b0000} />
            </mesh>
          </group>
        ))}
      </group>

      <group rotation={[0, (scaleRingRotation * Math.PI) / 180, 0]}>
        {scaleRingMarkers.map((marker, i) => (
          <mesh 
            key={`scale-marker-${i}`}
            position={[
              Math.cos(marker.angle) * (POT_RADIUS + 12),
              0,
              Math.sin(marker.angle) * (POT_RADIUS + 12)
            ]}
            rotation={[0, marker.angle + Math.PI / 2, 0]}
          >
            <boxGeometry args={[i % 5 === 0 ? 8 : 4, i % 5 === 0 ? 4 : 2, 1]} />
            <meshBasicMaterial color={marker.isDay ? 0xffa500 : 0x4a4a8a} />
          </mesh>
        ))}
        
        <mesh position={[POT_RADIUS + 16, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[2, 1, 8, 16]} />
          <meshBasicMaterial color={0xff0000} />
        </mesh>
      </group>

      {outflowPositions.map((pos, i) => (
        <mesh key={`outlet-${i}`} position={pos as [number, number, number]}>
          <cylinderGeometry args={[3, 3, 6, 12]} />
          <meshStandardMaterial color={0x4a3a2a} />
        </mesh>
      ))}

      <mesh position={[0, -POT_HEIGHT / 2 - 28, 0]}>
        <cylinderGeometry args={[POT_RADIUS + 25, POT_RADIUS + 30, 4, 48]} />
        <meshStandardMaterial color={0x7a6a5a} roughness={0.8} />
      </mesh>
      
      <mesh position={[0, -POT_HEIGHT / 2 - 26, 0]}>
        <cylinderGeometry args={[POT_RADIUS + 20, POT_RADIUS + 20, 2, 48]} />
        <meshStandardMaterial 
          color={0x3a5a7a} 
          transparent 
          opacity={0.6}
          roughness={0.1}
        />
      </mesh>
    </group>
  );
};
