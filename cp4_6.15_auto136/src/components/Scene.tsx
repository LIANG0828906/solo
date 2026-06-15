import { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import {
  Canvas,
  useFrame,
  useThree,
  ThreeEvent,
} from '@react-three/fiber';
import {
  OrbitControls,
  Html,
  useCursor,
  useTexture,
  useGLTF,
} from '@react-three/drei';
import * as THREE from 'three';
import {
  LightConfig,
  colorTemperatureToRGB,
  getAmbientParams,
  getWindowBgColor,
} from '@/utils/lightUtils';

interface SceneProps {
  lightConfig: LightConfig;
  mode: 'day' | 'night';
  transitionProgress: number;
  onLightPositionChange: (
    lightKey: keyof LightConfig,
    position: [number, number, number]
  ) => void;
}

interface DraggableLightProps {
  lightKey: keyof LightConfig;
  position: [number, number, number];
  color: string;
  enabled: boolean;
  intensity: number;
  onDrag: (pos: [number, number, number]) => void;
}

function DraggableLight({
  lightKey,
  position,
  color,
  enabled,
  intensity,
  onDrag,
}: DraggableLightProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const { camera, gl, raycaster, mouse } = useThree();
  const planeRef = useRef<THREE.Plane>(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const pointRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const opacity = enabled ? 0.85 : 0.2;
  const scale = enabled ? 1 : 0.7;

  useCursor(hovered);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (!enabled) return;
    e.stopPropagation();
    setIsDragging(true);
    gl.domElement.style.cursor = 'grabbing';
    planeRef.current.setFromNormalAndCoplanarPoint(
      camera.getWorldDirection(new THREE.Vector3()).negate(),
      new THREE.Vector3(...position)
    );
  };

  useFrame(() => {
    if (!isDragging) return;

    raycaster.setFromCamera(mouse, camera);
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(planeRef.current, intersection);

    if (intersection) {
      const clamped = [
        Math.max(-3, Math.min(3, intersection.x)),
        Math.max(0.5, Math.min(4, intersection.y)),
        Math.max(-3, Math.min(3, intersection.z)),
      ] as [number, number, number];
      pointRef.current.set(clamped[0], clamped[1], clamped[2]);
      onDrag(clamped);
    }
  });

  useEffect(() => {
    const handlePointerUp = () => {
      setIsDragging(false);
      gl.domElement.style.cursor = hovered ? 'grab' : 'default';
    };
    window.addEventListener('pointerup', handlePointerUp);
    return () => window.removeEventListener('pointerup', handlePointerUp);
  }, [gl, hovered]);

  const labelPosition = useMemo(() => {
    const [x, y, z] = position;
    return [x, y + 0.35, z] as [number, number, number];
  }, [position]);

  const lightNameMap: Record<keyof LightConfig, string> = {
    main: '主光',
    back: '背光',
    fill: '补光',
  };

  return (
    <group position={position} visible={enabled || isDragging || hovered}>
      <mesh
        ref={meshRef}
        scale={[scale, scale, scale]}
        onPointerDown={handlePointerDown}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.14, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={enabled ? intensity * 2.5 : 0.1}
          transparent
          opacity={opacity}
        />
      </mesh>
      {enabled && (
        <pointLight
          color={color}
          intensity={0.15}
          distance={1.8}
          position={[0, 0, 0]}
        />
      )}
      {(isDragging || hovered) && (
        <Html
          position={labelPosition}
          center
          distanceFactor={6}
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.88)',
              color: '#e0e0e0',
              fontSize: '11px',
              padding: '6px 10px',
              borderRadius: '6px',
              fontFamily: '"SF Mono", "Cascadia Code", "Consolas", monospace',
              whiteSpace: 'nowrap',
              border: '1px solid rgba(99, 102, 241, 0.5)',
              backdropFilter: 'blur(6px)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)',
              fontWeight: 500,
            }}
          >
            <div style={{ color: '#8b5cf6', marginBottom: '3px', fontSize: '10px', letterSpacing: '0.5px' }}>
              {lightNameMap[lightKey].toUpperCase()}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <span style={{ color: '#f87171' }}>X:{position[0].toFixed(2)}</span>
              <span style={{ color: '#4ade80' }}>Y:{position[1].toFixed(2)}</span>
              <span style={{ color: '#60a5fa' }}>Z:{position[2].toFixed(2)}</span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

function GLTFRoom() {
  const modelPath = '/models/room.glb';

  try {
    const { scene } = useGLTF(modelPath);
    useEffect(() => {
      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        }
      });
      scene.scale.set(1, 1, 1);
      scene.position.set(0, 0, 0);
    }, [scene]);
    return <primitive object={scene} />;
  } catch (e) {
    return <RoomGeometry />;
  }
}

function RoomScene({
  lightConfig,
  transitionProgress,
  onLightPositionChange,
}: {
  lightConfig: LightConfig;
  transitionProgress: number;
  onLightPositionChange: (
    lightKey: keyof LightConfig,
    position: [number, number, number]
  ) => void;
}) {
  const { scene, gl } = useThree();

  useEffect(() => {
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
  }, [gl]);

  useFrame(() => {
    const bgColor = getWindowBgColor(transitionProgress);
    scene.background = new THREE.Color(bgColor[0], bgColor[1], bgColor[2]);
  });

  const ambientParams = getAmbientParams('day', transitionProgress);

  const lightEntries = useMemo(
    () => Object.entries(lightConfig) as [keyof LightConfig, typeof lightConfig.main][],
    [lightConfig]
  );

  return (
    <>
      <ambientLight
        color={new THREE.Color(
          ambientParams.color[0],
          ambientParams.color[1],
          ambientParams.color[2]
        )}
        intensity={ambientParams.intensity}
      />

      {lightEntries.map(([key, light]) => {
        const color = colorTemperatureToRGB(light.colorTemperature);
        const hexColor = `#${new THREE.Color(color[0], color[1], color[2]).getHexString()}`;

        return (
          <group key={key}>
            {light.enabled && key === 'main' && (
              <directionalLight
                position={light.position}
                intensity={light.intensity * 3}
                color={hexColor}
                castShadow
                shadow-mapSize-width={1024}
                shadow-mapSize-height={1024}
                shadow-camera-near={0.5}
                shadow-camera-far={20}
                shadow-camera-left={-5}
                shadow-camera-right={5}
                shadow-camera-top={5}
                shadow-camera-bottom={-5}
                shadow-bias={-0.0001}
                shadow-normalBias={0.02}
              />
            )}

            {light.enabled && key === 'back' && (
              <spotLight
                position={light.position}
                intensity={light.intensity * 5}
                color={hexColor}
                angle={0.6}
                penumbra={0.5}
                castShadow
                shadow-mapSize-width={1024}
                shadow-mapSize-height={1024}
                shadow-bias={-0.0001}
                shadow-normalBias={0.02}
              />
            )}

            {light.enabled && key === 'fill' && (
              <pointLight
                position={light.position}
                intensity={light.intensity * 3}
                color={hexColor}
                distance={8}
                decay={2}
                castShadow
                shadow-mapSize-width={1024}
                shadow-mapSize-height={1024}
                shadow-bias={-0.0001}
                shadow-normalBias={0.02}
              />
            )}

            <DraggableLight
              lightKey={key}
              position={light.position}
              color={hexColor}
              enabled={light.enabled}
              intensity={light.intensity}
              onDrag={(pos) => onLightPositionChange(key, pos)}
            />
          </group>
        );
      })}

      <Suspense fallback={<RoomGeometry />}>
        <GLTFRoom />
      </Suspense>
    </>
  );
}

function RoomGeometry() {
  const roomSize = { width: 8, height: 5, depth: 8 };

  const floorTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#3d2f1f';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#4a3928' : '#3d2f1f';
      ctx.fillRect(0, i * 32, 256, 30);
    }
    ctx.strokeStyle = '#2a1f14';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 8; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * 32);
      ctx.lineTo(256, i * 32);
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    return tex;
  }, []);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[roomSize.width, roomSize.depth]} />
        <meshStandardMaterial map={floorTexture} roughness={0.8} />
      </mesh>

      <mesh position={[0, roomSize.height / 2, -roomSize.depth / 2]} receiveShadow>
        <planeGeometry args={[roomSize.width, roomSize.height]} />
        <meshStandardMaterial color="#c9b896" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>

      <mesh
        position={[-roomSize.width / 2, roomSize.height / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[roomSize.depth, roomSize.height]} />
        <meshStandardMaterial color="#d4c4a8" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>

      <mesh
        position={[roomSize.width / 2, roomSize.height / 2, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[roomSize.depth, roomSize.height]} />
        <meshStandardMaterial color="#d4c4a8" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>

      <mesh position={[0, roomSize.height, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[roomSize.width, roomSize.depth]} />
        <meshStandardMaterial color="#f0e6d2" side={THREE.DoubleSide} />
      </mesh>

      <group position={[0, 2.5, -3.9]}>
        <mesh castShadow>
          <boxGeometry args={[2, 3, 0.2]} />
          <meshStandardMaterial color="#2a2a3a" side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[-0.5, 0, 0.1]}>
          <planeGeometry args={[0.8, 1.2]} />
          <meshStandardMaterial
            color="#87ceeb"
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh position={[0.5, 0, 0.1]}>
          <planeGeometry args={[0.8, 1.2]} />
          <meshStandardMaterial
            color="#87ceeb"
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh position={[0, 0.5, 0.1]}>
          <planeGeometry args={[1.8, 0.1]} />
          <meshStandardMaterial color="#1a1a2a" side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.5, 0.1]}>
          <planeGeometry args={[1.8, 0.1]} />
          <meshStandardMaterial color="#1a1a2a" side={THREE.DoubleSide} />
        </mesh>
      </group>

      <group position={[-2.5, 0.4, -2]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.5, 0.8, 0.8]} />
          <meshStandardMaterial color="#8b7355" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.6, 0.1, 0.9]} />
          <meshStandardMaterial color="#6b5344" roughness={0.6} />
        </mesh>
      </group>

      <group position={[-2.5, 1.3, -2.1]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.1, 0.08, 0.4, 16]} />
          <meshStandardMaterial color="#d4a574" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.25, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.12, 0.1, 16]} />
          <meshStandardMaterial color="#c9302c" emissive="#c9302c" emissiveIntensity={0.2} />
        </mesh>
      </group>

      <group position={[2, 0, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1, 0.05, 1]} />
          <meshStandardMaterial color="#3a5a7a" roughness={0.5} />
        </mesh>
        <mesh position={[-0.45, -0.25, -0.45]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.5, 8]} />
          <meshStandardMaterial color="#2a3a4a" />
        </mesh>
        <mesh position={[0.45, -0.25, -0.45]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.5, 8]} />
          <meshStandardMaterial color="#2a3a4a" />
        </mesh>
        <mesh position={[-0.45, -0.25, 0.45]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.5, 8]} />
          <meshStandardMaterial color="#2a3a4a" />
        </mesh>
        <mesh position={[0.45, -0.25, 0.45]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.5, 8]} />
          <meshStandardMaterial color="#2a3a4a" />
        </mesh>
      </group>

      <group position={[2, 0.3, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.06, 0.08, 0.5, 16]} />
          <meshStandardMaterial color="#f5f5f5" roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.3, 0]} castShadow>
          <coneGeometry args={[0.2, 0.3, 16]} />
          <meshStandardMaterial
            color="#fff8e1"
            emissive="#fff8e1"
            emissiveIntensity={0.3}
            transparent
            opacity={0.8}
          />
        </mesh>
      </group>

      <group position={[0, 0, 2]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2, 0.8, 0.9]} />
          <meshStandardMaterial color="#4a3a5a" roughness={0.6} />
        </mesh>
        <mesh position={[-0.5, 0.3, 0]} castShadow>
          <boxGeometry args={[0.6, 0.4, 0.8]} />
          <meshStandardMaterial color="#e8e8e8" roughness={0.4} />
        </mesh>
        <mesh position={[0.5, 0.3, 0]} castShadow>
          <boxGeometry args={[0.3, 0.25, 0.3]} />
          <meshStandardMaterial color="#d4a574" roughness={0.5} />
        </mesh>
      </group>

      <group position={[-1.5, 0, 2]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.3, 0.25, 0.4, 20]} />
          <meshStandardMaterial color="#6b8e6b" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.35, 0]} castShadow>
          <sphereGeometry args={[0.4, 16, 16]} />
          <meshStandardMaterial color="#4a7a4a" roughness={0.9} />
        </mesh>
        <mesh position={[0.1, 0.45, 0.1]} castShadow>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial color="#5a8a5a" roughness={0.9} />
        </mesh>
        <mesh position={[-0.15, 0.5, -0.1]} castShadow>
          <sphereGeometry args={[0.28, 16, 16]} />
          <meshStandardMaterial color="#4a7a4a" roughness={0.9} />
        </mesh>
      </group>

      <group position={[3, 0.4, -2]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.8, 0.04, 1.2]} />
          <meshStandardMaterial color="#5a4a3a" roughness={0.7} />
        </mesh>
        <mesh position={[-0.35, -0.2, -0.55]} castShadow>
          <boxGeometry args={[0.06, 0.4, 0.06]} />
          <meshStandardMaterial color="#4a3a2a" />
        </mesh>
        <mesh position={[0.35, -0.2, -0.55]} castShadow>
          <boxGeometry args={[0.06, 0.4, 0.06]} />
          <meshStandardMaterial color="#4a3a2a" />
        </mesh>
        <mesh position={[-0.35, -0.2, 0.55]} castShadow>
          <boxGeometry args={[0.06, 0.4, 0.06]} />
          <meshStandardMaterial color="#4a3a2a" />
        </mesh>
        <mesh position={[0.35, -0.2, 0.55]} castShadow>
          <boxGeometry args={[0.06, 0.4, 0.06]} />
          <meshStandardMaterial color="#4a3a2a" />
        </mesh>
      </group>

      <group position={[1.5, 2.5, -3]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.2, 0.2, 0.08, 24]} />
          <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, -0.5, 0]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 1, 8]} />
          <meshStandardMaterial color="#d4a574" />
        </mesh>
        <mesh position={[0, -1, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.02, 16]} />
          <meshStandardMaterial color="#d4a574" />
        </mesh>
        <pointLight
          color="#fff4d6"
          intensity={0.3}
          distance={3}
          position={[0, -0.5, 0]}
        />
      </group>

      <group position={[3, 2.5, 2.5]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.25, 0.25, 0.08, 24]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0, -0.6, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 1.2, 8]} />
          <meshStandardMaterial color="#808080" />
        </mesh>
        <mesh position={[0, -1.2, 0]} castShadow>
          <boxGeometry args={[0.2, 0.04, 0.2]} />
          <meshStandardMaterial color="#a0a0a0" metalness={0.8} roughness={0.2} />
        </mesh>
        <pointLight
          color="#e8f0ff"
          intensity={0.25}
          distance={2.5}
          position={[0, -0.6, 0]}
        />
      </group>
    </group>
  );
}

useGLTF.preload('/models/room.glb');

export default function Scene({
  lightConfig,
  mode,
  transitionProgress,
  onLightPositionChange,
}: SceneProps) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 2.5, 5.5], fov: 50 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      dpr={[1, 2]}
      style={{ width: '100%', height: '100%' }}
    >
      <Suspense fallback={null}>
        <RoomScene
          lightConfig={lightConfig}
          transitionProgress={transitionProgress}
          onLightPositionChange={onLightPositionChange}
        />
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={3}
          maxDistance={12}
          maxPolarAngle={Math.PI / 2 - 0.05}
          target={[0, 1, 0]}
        />
      </Suspense>
    </Canvas>
  );
}
