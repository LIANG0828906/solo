import { useState, useEffect, useCallback, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { StarSystem } from './StarSystem';
import { UIControlPanel } from './UIControlPanel';
import { InfoPanel } from './InfoPanel';
import { CelestialBodyData } from './CelestialBody';
import { v4 as uuidv4 } from 'uuid';

const INITIAL_BODIES: CelestialBodyData[] = [
  {
    id: uuidv4(),
    name: '太阳',
    type: 'star',
    mass: 100,
    position: { x: 0, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    color: '#ffdd44'
  },
  {
    id: uuidv4(),
    name: '行星1',
    type: 'planet',
    mass: 5,
    position: { x: 50, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 3.0 },
    color: '#6c63ff'
  },
  {
    id: uuidv4(),
    name: '行星2',
    type: 'planet',
    mass: 3,
    position: { x: -80, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: -2.2 },
    color: '#ff6b9d'
  }
];

function CameraController({ viewType, onViewChange }: { viewType: string; onViewChange: (v: string) => void }) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const isAnimatingRef = useRef(false);
  const animationStartRef = useRef(0);
  const startPosRef = useRef(new THREE.Vector3());
  const startTargetRef = useRef(new THREE.Vector3());
  const endPosRef = useRef(new THREE.Vector3());
  const endTargetRef = useRef(new THREE.Vector3());
  const controlPointRef = useRef(new THREE.Vector3());
  const lastViewRef = useRef('');

  useEffect(() => {
    if (!controlsRef.current || viewType === lastViewRef.current || viewType === 'free') return;
    
    const controls = controlsRef.current;
    const distance = camera.position.distanceTo(controls.target);
    
    startPosRef.current.copy(camera.position);
    startTargetRef.current.copy(controls.target);
    
    const center = controls.target.clone();
    
    switch (viewType) {
      case 'top':
        endPosRef.current.set(center.x, center.y + distance, center.z);
        break;
      case 'side':
        endPosRef.current.set(center.x + distance, center.y, center.z);
        break;
      case 'front':
        endPosRef.current.set(center.x, center.y, center.z + distance);
        break;
    }
    endTargetRef.current.copy(center);
    
    const midPoint = new THREE.Vector3().addVectors(startPosRef.current, endPosRef.current).multiplyScalar(0.5);
    const dir = new THREE.Vector3().subVectors(endPosRef.current, startTargetRef.current).normalize();
    const offset = dir.multiplyScalar(startPosRef.current.distanceTo(endPosRef.current) * 0.3);
    controlPointRef.current.copy(midPoint).add(offset);
    
    isAnimatingRef.current = true;
    animationStartRef.current = performance.now();
    lastViewRef.current = viewType;
  }, [viewType, camera]);

  useFrame((state, delta) => {
    if (!isAnimatingRef.current || !controlsRef.current) return;
    
    const now = performance.now();
    const elapsed = now - animationStartRef.current;
    const duration = 800;
    let t = Math.min(elapsed / duration, 1);
    
    t = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    
    const mt = 1 - t;
    const newPos = new THREE.Vector3(
      mt * mt * startPosRef.current.x + 2 * mt * t * controlPointRef.current.x + t * t * endPosRef.current.x,
      mt * mt * startPosRef.current.y + 2 * mt * t * controlPointRef.current.y + t * t * endPosRef.current.y,
      mt * mt * startPosRef.current.z + 2 * mt * t * controlPointRef.current.z + t * t * endPosRef.current.z
    );
    
    const newTarget = new THREE.Vector3().lerpVectors(startTargetRef.current, endTargetRef.current, t);
    
    camera.position.copy(newPos);
    controlsRef.current.target.copy(newTarget);
    
    if (t >= 1) {
      isAnimatingRef.current = false;
      onViewChange('free');
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.05}
      minDistance={10}
      maxDistance={500}
      zoomSpeed={0.8}
      rotateSpeed={0.5}
      onStart={() => {
        if (lastViewRef.current !== 'free') {
          onViewChange('free');
          lastViewRef.current = 'free';
        }
      }}
    />
  );
}

export function App() {
  const [bodies, setBodies] = useState<CelestialBodyData[]>(INITIAL_BODIES);
  const [selectedBodyId, setSelectedBodyId] = useState<string | null>(null);
  const [viewType, setViewType] = useState<string>('free');
  const [isMobile, setIsMobile] = useState(false);
  const bodiesRef = useRef<CelestialBodyData[]>(INITIAL_BODIES);

  useEffect(() => {
    bodiesRef.current = bodies;
  }, [bodies]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleAddBody = useCallback((bodyData: Omit<CelestialBodyData, 'id'>) => {
    const newBody: CelestialBodyData = {
      ...bodyData,
      id: uuidv4()
    };
    setBodies(prev => [...prev, newBody]);
  }, []);

  const handleDeleteBody = useCallback((id: string) => {
    setBodies(prev => prev.filter(b => b.id !== id));
    if (selectedBodyId === id) {
      setSelectedBodyId(null);
    }
  }, [selectedBodyId]);

  const handleUpdateBody = useCallback((id: string, updates: Partial<CelestialBodyData>) => {
    setBodies(prev => prev.map(b => 
      b.id === id ? { ...b, ...updates } : b
    ));
  }, []);

  const handleSelectBody = useCallback((id: string | null) => {
    setSelectedBodyId(id);
  }, []);

  const handleSwitchView = useCallback((view: 'top' | 'side' | 'front') => {
    setViewType(view);
  }, []);

  const selectedBody = bodies.find(b => b.id === selectedBodyId) || null;
  const starBody = bodies.find(b => b.type === 'star') || null;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0a0a2e' }}>
      <Canvas
        camera={{ position: [0, 80, 120], fov: 60 }}
        style={{ background: '#0a0a2e' }}
        gl={{ antialias: true }}
        onPointerMissed={() => setSelectedBodyId(null)}
      >
        <color attach="background" args={['#0a0a2e']} />
        <fog attach="fog" args={['#0a0a2e', 150, 400]} />
        <CameraController viewType={viewType} onViewChange={setViewType} />
        <StarSystem
          bodies={bodies}
          selectedBodyId={selectedBodyId}
          onSelectBody={handleSelectBody}
        />
      </Canvas>

      <UIControlPanel
        bodies={bodies}
        selectedBodyId={selectedBodyId}
        onAddBody={handleAddBody}
        onSelectBody={handleSelectBody}
        onDeleteBody={handleDeleteBody}
        onUpdateBody={handleUpdateBody}
        onSwitchView={handleSwitchView}
        isMobile={isMobile}
      />

      <InfoPanel
        body={selectedBody}
        starBody={starBody}
        isMobile={isMobile}
        onClose={() => setSelectedBodyId(null)}
      />

      <div className="fps-counter">
        <span>✨ 星体轨道模拟器</span>
      </div>

      <style>{`
        .fps-counter {
          position: fixed;
          top: 16px;
          left: 50%;
          transform: translateX(-50%);
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
          z-index: 50;
          pointer-events: none;
          font-weight: 500;
          background: rgba(20, 20, 60, 0.5);
          padding: 8px 20px;
          border-radius: 20px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(108, 99, 255, 0.2);
        }

        @media (max-width: 768px) {
          .fps-counter {
            top: 10px;
            font-size: 12px;
            padding: 6px 16px;
          }
        }
      `}</style>
    </div>
  );
}
