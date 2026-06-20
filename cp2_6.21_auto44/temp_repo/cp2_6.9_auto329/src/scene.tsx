import { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Text } from '@react-three/drei';
import * as THREE from 'three';
import { Vector3 } from 'three';
import { useStore } from './store';
import { HERBS } from './data/herbs';
import {
  calculateFragmentCount,
  calculatePowderParticles,
  updateFragmentColor,
  detectPoundingSpeed,
  calculateScaleAngle,
  checkDosageComplete,
  checkDropCollision,
  generateHerbParticles,
  generatePowderParticles,
  hexToRgb,
} from './tools';
import { Herb } from './types';

const DRAWER_SIZE = [0.3, 0.15, 0.2] as const;
const DRAWER_GAP = 0.02;
const CABINET_DEPTH = 0.3;
const BRASS_PLATE_POS = new Vector3(0, 0.8, 0);
const MORTAR_POS = new Vector3(0.5, 0.9, 0);
const SCALE_POS = new Vector3(-0.5, 0.85, 0);

interface DrawerProps {
  herb: Herb;
  index: number;
  row: number;
  col: number;
}

function Drawer({ herb, row, col }: DrawerProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [isPulled, setIsPulled] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPos, setDragPos] = useState<Vector3 | null>(null);
  const { state, dispatch, getPrescriptionItem } = useStore();
  const { camera } = useThree();

  const baseX = -1.5 + col * (DRAWER_SIZE[0] + DRAWER_GAP);
  const baseY = 1.8 - row * (DRAWER_SIZE[1] + DRAWER_GAP);
  const baseZ = -1.2;

  const prescriptionItem = getPrescriptionItem(herb.id);
  const isSelected = state.selectedHerb?.id === herb.id;
  const isCompleted = prescriptionItem?.status === 'completed';

  const handlePointerDown = useCallback((e: THREE.Event) => {
    e.stopPropagation();
    if (isCompleted || state.currentPhase !== 'selecting') return;

    setIsPulled(true);
    dispatch({ type: 'SELECT_HERB', payload: herb });
    dispatch({ type: 'START_DRAGGING', payload: 'drawer', herbId: herb.id });
    setIsDragging(true);
  }, [dispatch, herb, isCompleted, state.currentPhase]);

  const handlePointerMove = useCallback((e: THREE.Event) => {
    if (!isDragging) return;
    e.stopPropagation();

    const rect = (e.target as HTMLElement).getBoundingClientRect?.();
    if (!rect) {
      const x = (e.point.x);
      const y = Math.max(e.point.y, 0.5);
      setDragPos(new Vector3(x, y, 0));
      return;
    }

    const ndcX = ((e.clientX as number - rect.left) / rect.width) * 2 - 1;
    const ndcY = -((e.clientY as number - rect.top) / rect.height) * 2 + 1;
    const ndc = new Vector3(ndcX, ndcY, 0.5);
    ndc.unproject(camera);
    const dir = ndc.sub(camera.position).normalize();
    const distance = (0.5 - camera.position.z) / dir.z;
    const pos = camera.position.clone().add(dir.multiplyScalar(distance));
    setDragPos(new Vector3(pos.x, Math.max(pos.y, 0.5), 0));
  }, [isDragging, camera]);

  const handlePointerUp = useCallback((e: THREE.Event) => {
    if (!isDragging) return;
    e.stopPropagation();

    const droppedPos = dragPos || new Vector3(0, 0.8, 0);
    const onPlate = checkDropCollision(droppedPos, BRASS_PLATE_POS, 0.35);

    if (onPlate) {
      dispatch({ type: 'SET_PHASE', payload: 'pounding' });
      dispatch({
        type: 'UPDATE_PRESCRIPTION_ITEM',
        payload: { id: prescriptionItem!.id, updates: { status: 'pounding' } },
      });
    } else {
      setIsPulled(false);
      dispatch({ type: 'DESELECT_HERB' });
    }

    setIsDragging(false);
    setDragPos(null);
    dispatch({ type: 'STOP_DRAGGING' });
  }, [isDragging, dragPos, dispatch, prescriptionItem]);

  useEffect(() => {
    if (!isDragging) return;
    const handleWindowUp = () => {
      setIsDragging(false);
      setDragPos(null);
      dispatch({ type: 'STOP_DRAGGING' });
      if (!isSelected) setIsPulled(false);
    };
    window.addEventListener('pointerup', handleWindowUp);
    return () => window.removeEventListener('pointerup', handleWindowUp);
  }, [isDragging, dispatch, isSelected]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    let targetZ = baseZ;
    let targetX = baseX;
    let targetY = baseY;

    if (isDragging && dragPos) {
      targetX = dragPos.x;
      targetY = dragPos.y;
      targetZ = 0;
    } else if (isPulled || isSelected) {
      targetZ = baseZ + 0.1;
    }

    meshRef.current.position.x += (targetX - meshRef.current.position.x) * delta * 10;
    meshRef.current.position.y += (targetY - meshRef.current.position.y) * delta * 10;
    meshRef.current.position.z += (targetZ - meshRef.current.position.z) * delta * 8;
  });

  const materialProps = useMemo(() => {
    if (isCompleted) {
      return { color: '#808080', transparent: true, opacity: 0.4 };
    }
    if (isDragging) {
      return { color: '#d2b48c', transparent: true, opacity: 0.7 };
    }
    if (isSelected) {
      return { color: '#d2b48c' };
    }
    return { color: '#a0a0a0', transparent: true, opacity: 0.6 };
  }, [isCompleted, isDragging, isSelected]);

  return (
    <group>
      <mesh
        ref={meshRef}
        position={[baseX, baseY, baseZ]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        castShadow
      >
        <boxGeometry args={DRAWER_SIZE} />
        <meshStandardMaterial {...materialProps} />
      </mesh>

      {(isSelected || isPulled) && !isDragging && (
        <Html
          position={[baseX, baseY, baseZ + 0.15]}
          center
          style={{
            color: '#2c1810',
            fontSize: '12px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            fontFamily: "'Noto Serif SC', serif",
            pointerEvents: 'none',
            textShadow: '0 1px 2px rgba(255,255,255,0.8)',
          }}
        >
          {herb.name}
        </Html>
      )}

      {isSelected && !isDragging && (
        <mesh position={[baseX, baseY, baseZ]}>
          <boxGeometry args={[DRAWER_SIZE[0] + 0.02, DRAWER_SIZE[1] + 0.02, DRAWER_SIZE[2] + 0.02]} />
          <meshBasicMaterial color="#b8860b" wireframe />
        </mesh>
      )}
    </group>
  );
}

function MedicineCabinet() {
  const drawers = useMemo(() => {
    return HERBS.map((herb, idx) => (
      <Drawer
        key={herb.id}
        herb={herb}
        index={idx}
        row={herb.drawerPosition[1]}
        col={herb.drawerPosition[0]}
      />
    ));
  }, []);

  return (
    <group>
      <mesh position={[-0.3, 1.2, -1.35]} receiveShadow>
        <boxGeometry args={[2.5, 2.5, CABINET_DEPTH]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      {drawers}
    </group>
  );
}

function BrassPlate() {
  const { state, dispatch, getPrescriptionItem } = useStore();
  const [particles, setParticles] = useState<{ positions: Float32Array; colors: Float32Array; time: number } | null>(null);
  const [herbOnPlate, setHerbOnPlate] = useState<Herb | null>(null);

  useEffect(() => {
    if (state.selectedHerb && state.currentPhase === 'pounding' && !herbOnPlate) {
      setHerbOnPlate(state.selectedHerb);
      const { positions, colors } = generateHerbParticles(
        30,
        state.selectedHerb.color,
        BRASS_PLATE_POS,
        0.15
      );
      setParticles({ positions, colors, time: Date.now() });
      setTimeout(() => setParticles(null), 600);
    }
    if (state.currentPhase === 'selecting') {
      setHerbOnPlate(null);
    }
  }, [state.selectedHerb, state.currentPhase, herbOnPlate]);

  const isDraggingHerb = state.isDragging && state.draggedObject === 'herb';

  const handlePointerDown = useCallback((e: THREE.Event) => {
    e.stopPropagation();
    if (!herbOnPlate || state.currentPhase !== 'pounding' || state.poundingCount < 3) return;

    dispatch({ type: 'START_DRAGGING', payload: 'herb', herbId: herbOnPlate.id });
  }, [dispatch, herbOnPlate, state.currentPhase, state.poundingCount]);

  useFrame((_, delta) => {
    if (particles) {
      const elapsed = (Date.now() - particles.time) / 600;
      const positions = particles.positions;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += delta * 0.1 * (1 - elapsed);
      }
    }
  });

  return (
    <group>
      <mesh position={BRASS_PLATE_POS} receiveShadow castShadow>
        <cylinderGeometry args={[0.25, 0.25, 0.05, 32]} />
        <meshStandardMaterial color="#e0c090" metalness={0.3} roughness={0.5} />
      </mesh>

      <mesh position={[BRASS_PLATE_POS.x, BRASS_PLATE_POS.y + 0.026, BRASS_PLATE_POS.z]}>
        <torusGeometry args={[0.24, 0.015, 8, 32]} />
        <meshStandardMaterial color="#c0a070" metalness={0.4} roughness={0.4} />
      </mesh>

      {herbOnPlate && !isDraggingHerb && (
        <HerbFragments
          herb={herbOnPlate}
          poundingCount={state.poundingCount}
          position={BRASS_PLATE_POS}
        />
      )}

      {particles && (
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={particles.positions.length / 3}
              array={particles.positions}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-color"
              count={particles.colors.length / 3}
              array={particles.colors}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.02}
            vertexColors
            transparent
            opacity={0.9}
            sizeAttenuation
          />
        </points>
      )}

      <mesh
        position={[BRASS_PLATE_POS.x, BRASS_PLATE_POS.y + 0.05, BRASS_PLATE_POS.z]}
        onPointerDown={handlePointerDown}
      >
        <cylinderGeometry args={[0.24, 0.24, 0.08, 32]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
}

interface HerbFragmentsProps {
  herb: Herb;
  poundingCount: number;
  position: Vector3;
}

function HerbFragments({ herb, poundingCount, position }: HerbFragmentsProps) {
  const groupRef = useRef<THREE.Group>(null);
  const fragmentCount = calculateFragmentCount(poundingCount);
  const currentColor = updateFragmentColor(poundingCount, herb.color);
  const [powderParticles, setPowderParticles] = useState<{
    positions: Float32Array;
    velocities: Float32Array;
    life: number[];
  } | null>(null);

  useEffect(() => {
    if (poundingCount > 0) {
      const count = calculatePowderParticles(poundingCount, 0.2);
      const { positions, velocities } = generatePowderParticles(count, position);
      setPowderParticles({
        positions,
        velocities,
        life: new Array(count).fill(1),
      });
    }
  }, [poundingCount, position]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.1;
    }

    if (powderParticles) {
      const positions = powderParticles.positions;
      const velocities = powderParticles.velocities;
      const life = powderParticles.life;

      for (let i = 0; i < positions.length / 3; i++) {
        if (life[i] > 0) {
          positions[i * 3] += velocities[i * 3] * delta * 60;
          positions[i * 3 + 1] += velocities[i * 3 + 1] * delta * 60;
          positions[i * 3 + 2] += velocities[i * 3 + 2] * delta * 60;
          velocities[i * 3 + 1] -= 0.001 * delta * 60;
          life[i] -= delta * 0.5;
        }
      }
    }
  });

  const fragments = useMemo(() => {
    const items = [];
    const rgb = hexToRgb(currentColor);
    const scale = Math.max(0.08 - poundingCount * 0.003, 0.02);

    for (let i = 0; i < fragmentCount; i++) {
      const angle = (i / fragmentCount) * Math.PI * 2;
      const radius = 0.05 + Math.random() * 0.1;
      const x = position.x + Math.cos(angle) * radius;
      const y = position.y + 0.08 + Math.random() * 0.05;
      const z = position.z + Math.sin(angle) * radius;

      items.push(
        <mesh key={i} position={[x, y, z]} castShadow>
          <dodecahedronGeometry args={[scale, 0]} />
          <meshStandardMaterial
            color={new THREE.Color(rgb.r, rgb.g, rgb.b)}
            roughness={0.8}
          />
        </mesh>
      );
    }
    return items;
  }, [fragmentCount, currentColor, position, poundingCount]);

  return (
    <group ref={groupRef}>
      {fragments}
      {powderParticles && (
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={powderParticles.positions.length / 3}
              array={powderParticles.positions}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.015}
            color="#ffffff"
            transparent
            opacity={0.6}
            sizeAttenuation
          />
        </points>
      )}
    </group>
  );
}

function MortarAndPestle() {
  const { state, dispatch } = useStore();
  const pestleRef = useRef<THREE.Group>(null);
  const [isPounding, setIsPounding] = useState(false);
  const [pestlePos, setPestlePos] = useState({ y: 1.2 });
  const [startY, setStartY] = useState(0);
  const [poundStartTime, setPoundStartTime] = useState(0);
  const [hasPoundedDown, setHasPoundedDown] = useState(false);

  const handlePointerDown = useCallback((e: THREE.Event) => {
    e.stopPropagation();
    if (state.currentPhase !== 'pounding') return;
    setIsPounding(true);
    setStartY(e.point.y);
    setPoundStartTime(Date.now());
    setHasPoundedDown(false);
  }, [state.currentPhase]);

  const handlePointerMove = useCallback((e: THREE.Event) => {
    if (!isPounding) return;
    e.stopPropagation();

    const deltaY = e.point.y - startY;
    const newY = Math.max(0.95, Math.min(1.3, 1.15 - deltaY * 0.5));
    setPestlePos({ y: newY });

    if (newY < 1.0 && !hasPoundedDown) {
      setHasPoundedDown(true);
    }
  }, [isPounding, startY, hasPoundedDown]);

  const handlePointerUp = useCallback((e: THREE.Event) => {
    if (!isPounding) return;
    e.stopPropagation();
    setIsPounding(false);

    if (hasPoundedDown) {
      const duration = (Date.now() - poundStartTime) / 1000;
      const speed = detectPoundingSpeed(duration);
      console.log('Pounding speed:', speed);
      dispatch({ type: 'INCREMENT_POUNDING' });
    }

    setPestlePos({ y: 1.2 });
    setHasPoundedDown(false);
  }, [isPounding, hasPoundedDown, poundStartTime, dispatch]);

  useEffect(() => {
    if (!isPounding) return;
    const handleWindowUp = () => {
      setIsPounding(false);
      setPestlePos({ y: 1.2 });
      if (hasPoundedDown) {
        const duration = (Date.now() - poundStartTime) / 1000;
        detectPoundingSpeed(duration);
        dispatch({ type: 'INCREMENT_POUNDING' });
      }
      setHasPoundedDown(false);
    };
    window.addEventListener('pointerup', handleWindowUp);
    return () => window.removeEventListener('pointerup', handleWindowUp);
  }, [isPounding, hasPoundedDown, poundStartTime, dispatch]);

  useFrame((_, delta) => {
    if (pestleRef.current) {
      const targetY = isPounding ? pestlePos.y : 1.2;
      pestleRef.current.position.y += (targetY - pestleRef.current.position.y) * delta * 20;
    }
  });

  return (
    <group position={MORTAR_POS}>
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.12, 0.1, 0.15, 16]} />
        <meshStandardMaterial color="#6b5b4a" roughness={0.9} />
      </mesh>

      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.05, 16]} />
        <meshStandardMaterial color="#4a3f35" roughness={0.95} />
      </mesh>

      <group ref={pestleRef} position={[0, 1.2, 0]}>
        <mesh position={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.3, 8]} />
          <meshStandardMaterial color="#8B4513" roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.2, 0]} castShadow>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshStandardMaterial color="#6b5b4a" roughness={0.85} />
        </mesh>
      </group>

      <mesh
        position={[0, 0.3, 0]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <cylinderGeometry args={[0.15, 0.15, 0.6, 16]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {state.currentPhase === 'pounding' && state.poundingCount === 0 && (
        <Html position={[0, 0.5, 0.15]} center style={{ pointerEvents: 'none' }}>
          <div style={{
            color: '#2c1810',
            fontSize: '11px',
            background: 'rgba(255,248,220,0.9)',
            padding: '4px 8px',
            borderRadius: '4px',
            fontFamily: "'Noto Serif SC', serif",
            whiteSpace: 'nowrap',
          }}>
            按住鼠标垂直拖动捣药
          </div>
        </Html>
      )}
    </group>
  );
}

interface ScaleProps {}

function Scale(_: ScaleProps) {
  const { state, dispatch, getPrescriptionItem } = useStore();
  const groupRef = useRef<THREE.Group>(null);
  const [herbOnScale, setHerbOnScale] = useState<Herb | null>(null);
  const [flashGreen, setFlashGreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPos, setDragPos] = useState<Vector3 | null>(null);
  const { camera } = useThree();

  const prescriptionItem = state.selectedHerb
    ? getPrescriptionItem(state.selectedHerb.id)
    : null;
  const requiredDosage = prescriptionItem?.requiredDosage ?? 0;
  const angle = calculateScaleAngle(state.scaleWeight - requiredDosage, 5);
  const isDosageCorrect = checkDosageComplete(state.scaleWeight, requiredDosage);

  useEffect(() => {
    if (state.isDragging && state.draggedObject === 'herb' && state.draggedHerbId) {
      const herb = HERBS.find(h => h.id === state.draggedHerbId);
      if (herb) {
        setIsDragging(true);
      }
    } else {
      setIsDragging(false);
    }
  }, [state.isDragging, state.draggedObject, state.draggedHerbId]);

  useEffect(() => {
    if (isDosageCorrect && state.currentPhase === 'weighing' && state.scaleWeight > 0) {
      setFlashGreen(true);
      dispatch({ type: 'SHOW_TOAST', payload: '剂量达标' });
      const interval = setInterval(() => setFlashGreen(prev => !prev), 100);
      setTimeout(() => {
        clearInterval(interval);
        setFlashGreen(false);
        dispatch({ type: 'HIDE_TOAST' });
      }, 300);
    }
  }, [isDosageCorrect, state.currentPhase, state.scaleWeight, dispatch]);

  const handlePointerMove = useCallback((e: THREE.Event) => {
    if (!isDragging) return;
    e.stopPropagation();

    const ndcX = ((e.clientX as number) / window.innerWidth) * 2 - 1;
    const ndcY = -((e.clientY as number) / window.innerHeight) * 2 + 1;
    const ndc = new Vector3(ndcX, ndcY, 0.5);
    ndc.unproject(camera);
    const dir = ndc.sub(camera.position).normalize();
    const distance = (0.5 - camera.position.z) / dir.z;
    const pos = camera.position.clone().add(dir.multiplyScalar(distance));
    setDragPos(new Vector3(pos.x, Math.max(pos.y, 0.5), 0));
  }, [isDragging, camera]);

  const handlePointerUp = useCallback((e: THREE.Event) => {
    if (!isDragging || !dragPos || !state.draggedHerbId) return;
    e.stopPropagation();

    const onScale = checkDropCollision(dragPos, SCALE_POS, 0.2);
    const herb = HERBS.find(h => h.id === state.draggedHerbId);

    if (onScale && herb) {
      setHerbOnScale(herb);
      dispatch({ type: 'SET_PHASE', payload: 'weighing' });
      dispatch({
        type: 'UPDATE_PRESCRIPTION_ITEM',
        payload: { id: prescriptionItem!.id, updates: { status: 'weighing' } },
      });

      if (state.scaleWeight === 0) {
        dispatch({ type: 'SET_SCALE_WEIGHT', payload: requiredDosage * 0.3 });
      }
    }

    setIsDragging(false);
    setDragPos(null);
    dispatch({ type: 'STOP_DRAGGING' });
  }, [isDragging, dragPos, state.draggedHerbId, dispatch, prescriptionItem, requiredDosage, state.scaleWeight]);

  useEffect(() => {
    const handleWindowMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const ndcX = (e.clientX / window.innerWidth) * 2 - 1;
      const ndcY = -(e.clientY / window.innerHeight) * 2 + 1;
      const ndc = new Vector3(ndcX, ndcY, 0.5);
      ndc.unproject(camera);
      const dir = ndc.sub(camera.position).normalize();
      const distance = (0.5 - camera.position.z) / dir.z;
      const pos = camera.position.clone().add(dir.multiplyScalar(distance));
      setDragPos(new Vector3(pos.x, Math.max(pos.y, 0.5), 0));
    };

    const handleWindowUp = () => {
      if (isDragging && dragPos && state.draggedHerbId) {
        const onScale = checkDropCollision(dragPos, SCALE_POS, 0.2);
        const herb = HERBS.find(h => h.id === state.draggedHerbId);
        if (onScale && herb && prescriptionItem) {
          setHerbOnScale(herb);
          dispatch({ type: 'SET_PHASE', payload: 'weighing' });
          dispatch({
            type: 'UPDATE_PRESCRIPTION_ITEM',
            payload: { id: prescriptionItem.id, updates: { status: 'weighing' } },
          });
          if (state.scaleWeight === 0) {
            dispatch({ type: 'SET_SCALE_WEIGHT', payload: requiredDosage * 0.3 });
          }
        }
      }
      setIsDragging(false);
      setDragPos(null);
      dispatch({ type: 'STOP_DRAGGING' });
    };

    if (isDragging) {
      window.addEventListener('pointermove', handleWindowMove);
      window.addEventListener('pointerup', handleWindowUp);
    }
    return () => {
      window.removeEventListener('pointermove', handleWindowMove);
      window.removeEventListener('pointerup', handleWindowUp);
    };
  }, [isDragging, dragPos, state.draggedHerbId, dispatch, prescriptionItem, requiredDosage, state.scaleWeight, camera]);

  const handleScaleClick = useCallback((e: THREE.Event) => {
    e.stopPropagation();
    if (state.currentPhase !== 'weighing') return;

    const delta = e.button === 2 ? -0.1 : 0.1;
    const newWeight = Math.max(0, Math.min(5, state.scaleWeight + delta));
    dispatch({ type: 'SET_SCALE_WEIGHT', payload: newWeight });
  }, [dispatch, state.currentPhase, state.scaleWeight]);

  const handleConfirm = useCallback((e: THREE.Event) => {
    e.stopPropagation();
    if (!isDosageCorrect || !prescriptionItem) return;
    dispatch({ type: 'COMPLETE_PRESCRIPTION_ITEM', payload: prescriptionItem.id });
    setHerbOnScale(null);
    dispatch({ type: 'SET_SCALE_WEIGHT', payload: 0 });
  }, [dispatch, isDosageCorrect, prescriptionItem]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      const targetAngle = isDragging ? 0 : angle;
      groupRef.current.rotation.z += (targetAngle - groupRef.current.rotation.z) * delta * 8;
    }
  });

  return (
    <group>
      <group ref={groupRef} position={SCALE_POS}>
        <mesh position={[0, 0.05, 0]} castShadow>
          <cylinderGeometry args={[0.01, 0.01, 0.4, 8]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#c4956a" roughness={0.6} />
        </mesh>

        <group position={[-0.2, 0, 0]}>
          <mesh position={[0, -0.03, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.01, 16]} />
            <meshStandardMaterial
              color={flashGreen ? '#00ff00' : '#b8860b'}
              metalness={0.6}
              roughness={0.3}
              emissive={flashGreen ? '#00ff00' : '#000000'}
              emissiveIntensity={flashGreen ? 0.5 : 0}
            />
          </mesh>

          {herbOnScale && state.currentPhase === 'weighing' && (
            <HerbFragments
              herb={herbOnScale}
              poundingCount={state.poundingCount}
              position={new Vector3(SCALE_POS.x - 0.2, SCALE_POS.y + 0.02, SCALE_POS.z)}
            />
          )}
        </group>

        <mesh position={[0.15, -0.02, 0]} castShadow>
          <boxGeometry args={[0.04, 0.04, 0.04]} />
          <meshStandardMaterial color="#2c2c2c" roughness={0.5} metalness={0.8} />
        </mesh>
      </group>

      {isDragging && dragPos && state.selectedHerb && (
        <group position={dragPos}>
          <HerbFragments
            herb={state.selectedHerb}
            poundingCount={state.poundingCount}
            position={new Vector3(0, 0, 0)}
          />
        </group>
      )}

      <mesh
        position={[SCALE_POS.x - 0.2, SCALE_POS.y, SCALE_POS.z]}
        onPointerDown={handleScaleClick}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onContextMenu={(e) => { e.preventDefault(); handleScaleClick(e); }}
      >
        <cylinderGeometry args={[0.08, 0.08, 0.1, 16]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {isDosageCorrect && state.currentPhase === 'weighing' && (
        <mesh position={[SCALE_POS.x - 0.2, SCALE_POS.y + 0.15, SCALE_POS.z]} onClick={handleConfirm}>
          <cylinderGeometry args={[0.06, 0.06, 0.02, 16]} />
          <meshStandardMaterial
            color="#228B22"
            emissive="#00ff00"
            emissiveIntensity={0.3}
          />
          <Html position={[0, 0, 0.02]} center>
            <div style={{
              color: 'white',
              fontSize: '10px',
              fontWeight: 600,
              fontFamily: "'Noto Serif SC', serif",
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}>
              确认
            </div>
          </Html>
        </mesh>
      )}

      {state.currentPhase === 'weighing' && (
        <Html position={[SCALE_POS.x, SCALE_POS.y - 0.15, SCALE_POS.z]} center style={{ pointerEvents: 'none' }}>
          <div style={{
            color: '#2c1810',
            fontSize: '11px',
            background: 'rgba(255,248,220,0.9)',
            padding: '4px 8px',
            borderRadius: '4px',
            fontFamily: "'Noto Serif SC', serif",
            whiteSpace: 'nowrap',
          }}>
            左键加量 | 右键减量 | 目标: {requiredDosage}钱
          </div>
        </Html>
      )}
    </group>
  );
}

function Counter() {
  const { state } = useStore();

  if (state.currentPhase !== 'pounding') return null;

  return (
    <Html position={[MORTAR_POS.x + 0.2, MORTAR_POS.y + 0.5, MORTAR_POS.z]} center>
      <div style={{
        color: '#2c1810',
        fontSize: '14px',
        fontWeight: 600,
        fontFamily: "'Noto Serif SC', serif",
        background: 'rgba(255,248,220,0.9)',
        padding: '6px 12px',
        borderRadius: '6px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}>
        捣药次数: {state.poundingCount}
      </div>
    </Html>
  );
}

function PillAnimation() {
  const { state } = useStore();
  const groupRef = useRef<THREE.Group>(null);
  const [particles, setParticles] = useState<Float32Array | null>(null);
  const [phase, setPhase] = useState<'forming' | 'rotating' | 'done'>('forming');

  useEffect(() => {
    if (state.pillAnimationActive) {
      setPhase('forming');
      const positions = new Float32Array(100 * 3);
      for (let i = 0; i < 100; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 0.3 + Math.random() * 0.2;
        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = Math.random() * 0.3;
        positions[i * 3 + 2] = Math.sin(angle) * radius;
      }
      setParticles(positions);

      setTimeout(() => setPhase('rotating'), 800);
      setTimeout(() => setPhase('done'), 1800);
    }
  }, [state.pillAnimationActive]);

  useFrame((_, delta) => {
    if (!groupRef.current || !state.pillAnimationActive) return;

    if (phase === 'rotating') {
      groupRef.current.rotation.y += delta * 2;
    }

    if (particles && phase === 'forming') {
      for (let i = 0; i < particles.length; i += 3) {
        particles[i] *= (1 - delta * 2);
        particles[i + 1] = particles[i + 1] * (1 - delta * 2) + 1.2 * delta * 2;
        particles[i + 2] *= (1 - delta * 2);
      }
    }
  });

  if (!state.pillAnimationActive || phase === 'done') return null;

  return (
    <group ref={groupRef} position={[0, 1.2, 0]}>
      <mesh>
        <sphereGeometry args={[phase === 'forming' ? 0.02 : 0.08, 16, 16]} />
        <meshStandardMaterial
          color="#FFD700"
          emissive="#FFA500"
          emissiveIntensity={0.5}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {particles && (
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={particles.length / 3}
              array={particles}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.03}
            color="#FFD700"
            transparent
            opacity={0.8}
            sizeAttenuation
          />
        </points>
      )}
    </group>
  );
}

function ShopEnvironment() {
  return (
    <group>
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#a0b0a0" roughness={0.9} />
      </mesh>

      <mesh position={[0, 1.5, -1.8]} receiveShadow>
        <boxGeometry args={[6, 3, 0.1]} />
        <meshStandardMaterial color="#f5e6c8" roughness={0.95} />
      </mesh>

      <mesh position={[0, 0.7, 0]} receiveShadow castShadow>
        <boxGeometry args={[3, 0.15, 1]} />
        <meshStandardMaterial color="#8B4513" roughness={0.7} />
      </mesh>

      <mesh position={[-1.4, 0.35, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.2, 0.85, 1]} />
        <meshStandardMaterial color="#654321" roughness={0.7} />
      </mesh>
      <mesh position={[1.4, 0.35, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.2, 0.85, 1]} />
        <meshStandardMaterial color="#654321" roughness={0.7} />
      </mesh>

      <ambientLight intensity={0.4} />
      <directionalLight
        position={[2, 4, 3]}
        intensity={1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={10}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-1}
      />
      <pointLight position={[0, 2, 0]} intensity={0.5} color="#fff5e6" />
    </group>
  );
}

function SceneContent() {
  return (
    <>
      <ShopEnvironment />
      <MedicineCabinet />
      <BrassPlate />
      <MortarAndPestle />
      <Scale />
      <Counter />
      <PillAnimation />
      <OrbitControls
        enablePan={false}
        minDistance={2}
        maxDistance={5}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.2}
        target={[0, 1, 0]}
      />
    </>
  );
}

export default function Scene() {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 1.5, 3.5], fov: 50 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: 'linear-gradient(to bottom, #f5e6c8, #d2b48c)' }}
    >
      <fog attach="fog" args={['#d2b48c', 5, 10]} />
      <SceneContent />
    </Canvas>
  );
}
