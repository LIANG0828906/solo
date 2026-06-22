import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { KEYBOARD_LAYOUT, KEYBOARD_ROWS, KEYBOARD_COLS } from '../data/keyboardLayout';
import { ColorScheme, MATERIAL_MAP, KeyMaterial } from '../types';

interface Keyboard3DPreviewProps {
  colorScheme: ColorScheme;
  animationTrigger: number;
  selectedKeyId: string | null;
}

const U = 0.4;
const GAP = 0.025;
const KEY_HEIGHT = 0.22;
const BASE_HEIGHT = 0.35;
const ROW_DELAY = 0.08;
const ANIM_DURATION = 0.8;

const BOARD_WIDTH = KEYBOARD_COLS * U + (KEYBOARD_COLS - 1) * GAP + 0.4;
const BOARD_HEIGHT = KEYBOARD_ROWS * U + (KEYBOARD_ROWS - 1) * GAP + 0.4;

interface KeyAnimState {
  startColor: THREE.Color;
  targetColor: THREE.Color;
  currentColor: THREE.Color;
  startTime: number;
  delay: number;
  running: boolean;
}

const KeyCap: React.FC<{
  x: number;
  y: number;
  z: number;
  width: number;
  color: string;
  material: KeyMaterial;
  isSelected: boolean;
  animState: React.MutableRefObject<KeyAnimState>;
}> = React.memo(({ x, y, z, width, color, material, isSelected, animState }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const matConfig = MATERIAL_MAP[material];

  const keyGeometry = useMemo(() => {
    const shape = new THREE.BoxGeometry(width * U - 0.01, KEY_HEIGHT, U - 0.01);
    return shape;
  }, [width]);

  const keyMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: matConfig.roughness,
      metalness: matConfig.metalness,
    });
  }, [matConfig.roughness, matConfig.metalness]);

  useEffect(() => {
    keyMaterial.roughness = matConfig.roughness;
    keyMaterial.metalness = matConfig.metalness;
  }, [matConfig.roughness, matConfig.metalness, keyMaterial]);

  useEffect(() => {
    const target = new THREE.Color(color);
    const start = keyMaterial.color.clone();
    animState.current = {
      startColor: start,
      targetColor: target,
      currentColor: start.clone(),
      startTime: performance.now(),
      delay: animState.current.delay,
      running: true,
    };
  }, [color, animState, keyMaterial]);

  useFrame(() => {
    const state = animState.current;
    if (!state.running) return;
    const now = performance.now();
    const elapsed = (now - state.startTime) / 1000 - state.delay;
    if (elapsed <= 0) return;
    const t = Math.min(1, elapsed / ANIM_DURATION);
    const eased = 1 - Math.pow(1 - t, 3);
    state.currentColor.copy(state.startColor).lerp(state.targetColor, eased);
    keyMaterial.color.copy(state.currentColor);
    if (t >= 1) {
      state.running = false;
    }
  });

  useEffect(() => {
    if (!meshRef.current) return;
    meshRef.current.scale.y = isSelected ? 1.15 : 1;
  }, [isSelected]);

  return (
    <mesh ref={meshRef} position={[x, y + KEY_HEIGHT / 2 + 0.02, z]} castShadow receiveShadow>
      <primitive object={keyGeometry} attach="geometry" />
      <primitive object={keyMaterial} attach="material" />
      {isSelected && (
        <mesh position={[0, 0.001, 0]}>
          <ringGeometry args={[Math.min(width * U * 0.5, U * 0.5) + 0.01, Math.min(width * U * 0.5, U * 0.5) + 0.035, 32]} />
          <meshBasicMaterial color="#4A88FF" transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
      )}
    </mesh>
  );
});

KeyCap.displayName = 'KeyCap';

const KeyboardScene: React.FC<{
  colorScheme: ColorScheme;
  animationTrigger: number;
  selectedKeyId: string | null;
}> = ({ colorScheme, animationTrigger, selectedKeyId }) => {
  const animRefs = useRef<Map<string, React.MutableRefObject<KeyAnimState>>>(new Map());

  const baseGeometry = useMemo(() => new THREE.BoxGeometry(BOARD_WIDTH, BASE_HEIGHT, BOARD_HEIGHT), []);
  const baseMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#E8E8E8', roughness: 0.9, metalness: 0.02 }),
    []
  );

  const rowMaxCols = useMemo(() => {
    const maxes: number[] = [];
    KEYBOARD_LAYOUT.forEach((k) => {
      if (!maxes[k.row]) maxes[k.row] = 0;
      maxes[k.row] = Math.max(maxes[k.row], k.col + k.width);
    });
    return maxes;
  }, []);

  useEffect(() => {
    animRefs.current.forEach((ref, keyId) => {
      const key = KEYBOARD_LAYOUT.find((k) => k.id === keyId);
      if (key && ref.current) {
        ref.current.delay = key.row * ROW_DELAY;
        ref.current.startTime = performance.now();
        ref.current.running = true;
      }
    });
  }, [animationTrigger]);

  return (
    <group rotation={[-0.22, 0, 0]}>
      <mesh position={[0, -BASE_HEIGHT / 2 + 0.05, 0]} receiveShadow castShadow>
        <primitive object={baseGeometry} attach="geometry" />
        <primitive object={baseMaterial} attach="material" />
      </mesh>

      {KEYBOARD_LAYOUT.map((key) => {
        if (!animRefs.current.has(key.id)) {
          animRefs.current.set(key.id, {
            current: {
              startColor: new THREE.Color('#FFFFFF'),
              targetColor: new THREE.Color('#FFFFFF'),
              currentColor: new THREE.Color('#FFFFFF'),
              startTime: performance.now(),
              delay: key.row * ROW_DELAY,
              running: false,
            },
          });
        }
        const ref = animRefs.current.get(key.id)!;
        const kc = colorScheme.keys[key.id];
        const totalRowWidth = (rowMaxCols[key.row] ?? 0) * U + ((rowMaxCols[key.row] ?? 0) - 1) * GAP;
        const offsetX = -BOARD_WIDTH / 2 + 0.2 + (BOARD_WIDTH - 0.4 - totalRowWidth) / 2;
        const x = offsetX + key.col * (U + GAP) + (key.width * U - U) / 2;
        const z = -BOARD_HEIGHT / 2 + 0.2 + key.row * (U + GAP);
        return (
          <KeyCap
            key={key.id}
            x={x}
            y={0}
            z={z}
            width={key.width}
            color={kc?.color ?? '#FFFFFF'}
            material={kc?.material ?? 'matte'}
            isSelected={selectedKeyId === key.id}
            animState={ref}
          />
        );
      })}
    </group>
  );
};

export const Keyboard3DPreview: React.FC<Keyboard3DPreviewProps> = ({
  colorScheme,
  animationTrigger,
  selectedKeyId,
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <div className="preview-wrapper">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 6.5, 8.5], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={['#1a1f2e']} />
        <fog attach="fog" args={['#1a1f2e', 12, 25]} />

        <ambientLight intensity={0.55} />
        <hemisphereLight args={['#c5d8ff', '#2a2030', 0.35]} />
        <directionalLight
          position={[5, 8, 5]}
          intensity={0.9}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-near={1}
          shadow-camera-far={30}
          shadow-camera-left={-8}
          shadow-camera-right={8}
          shadow-camera-top={8}
          shadow-camera-bottom={-8}
        />
        <directionalLight position={[-4, 4, -3]} intensity={0.25} color="#8fb4ff" />

        <KeyboardScene colorScheme={colorScheme} animationTrigger={animationTrigger} selectedKeyId={selectedKeyId} />

        <Environment preset="city" />

        <OrbitControls
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={isMobile ? 0.8 : 1}
          zoomSpeed={isMobile ? 0.6 : 0.9}
          minDistance={5}
          maxDistance={18}
          minPolarAngle={0.2}
          maxPolarAngle={Math.PI / 2 - 0.05}
          enablePan={false}
          touches={isMobile ? { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN } : undefined}
        />
      </Canvas>
    </div>
  );
};

export default Keyboard3DPreview;
