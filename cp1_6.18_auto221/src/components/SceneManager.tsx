import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useSceneStore, SceneObject, GeometryType, TransformType, COLORS } from '@/stores/sceneStore';

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const getGlowColor = (transformType: TransformType | null): string => {
  switch (transformType) {
    case 'move': return '#4FC3F7';
    case 'scale': return '#6BCB77';
    case 'rotate': return '#FFD93D';
    default: return '#FFFFFF';
  }
};

interface ParticleTrailProps {
  color: string;
  objectId: string;
  isSpawning: boolean;
  spawnProgress: number;
  spawnDirection: { x: number; y: number; z: number };
  targetPosition: { x: number; y: number; z: number };
  particleCount: number;
}

const ParticleTrail: React.FC<ParticleTrailProps> = ({
  color,
  isSpawning,
  spawnProgress,
  spawnDirection,
  targetPosition,
  particleCount,
}) => {
  const particlesRef = useRef<THREE.Points>(null);
  const particleDataRef = useRef<{
    positions: Float32Array;
    velocities: Float32Array;
    lifetimes: Float32Array;
    maxLifetimes: Float32Array;
  } | null>(null);

  const geometry = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const lifetimes = new Float32Array(particleCount);
    const maxLifetimes = new Float32Array(particleCount);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    const colorObj = new THREE.Color(color);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = spawnDirection.x;
      positions[i * 3 + 1] = spawnDirection.y;
      positions[i * 3 + 2] = spawnDirection.z;

      velocities[i * 3] = (Math.random() - 0.5) * 0.05;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.05;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.05;

      lifetimes[i] = -i * (0.02);
      maxLifetimes[i] = 0.6 + Math.random() * 0.4;

      colors[i * 3] = colorObj.r;
      colors[i * 3 + 1] = colorObj.g;
      colors[i * 3 + 2] = colorObj.b;

      sizes[i] = 0.02;
    }

    particleDataRef.current = { positions, velocities, lifetimes, maxLifetimes };

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    return geo;
  }, [color, particleCount, spawnDirection]);

  const material = useMemo(() => {
    return new THREE.PointsMaterial({
      size: 0.02,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
  }, []);

  useFrame(() => {
    if (!particlesRef.current || !particleDataRef.current) return;

    const { positions, velocities, lifetimes, maxLifetimes } = particleDataRef.current;
    const positionAttr = geometry.getAttribute('position') as THREE.BufferAttribute;

    const t = isSpawning ? spawnProgress : 1;
    const objX = THREE.MathUtils.lerp(spawnDirection.x, targetPosition.x, easeOutCubic(Math.min(1, t)));
    const objY = THREE.MathUtils.lerp(spawnDirection.y, targetPosition.y, easeOutCubic(Math.min(1, t)));
    const objZ = THREE.MathUtils.lerp(spawnDirection.z, targetPosition.z, easeOutCubic(Math.min(1, t)));

    for (let i = 0; i < particleCount; i++) {
      lifetimes[i] += 0.016;
      const lifeRatio = Math.max(0, Math.min(1, lifetimes[i] / maxLifetimes[i]));

      if (isSpawning || lifetimes[i] >= 0) {
        const emitDelay = i * 0.02;
        if (t * 2 >= emitDelay) {
          positions[i * 3] = objX + (Math.random() - 0.5) * 0.1;
          positions[i * 3 + 1] = objY + (Math.random() - 0.5) * 0.1;
          positions[i * 3 + 2] = objZ + (Math.random() - 0.5) * 0.1;
          lifetimes[i] = 0;
        }
      } else {
        positions[i * 3] += velocities[i * 3];
        positions[i * 3 + 1] += velocities[i * 3 + 1] - 0.002;
        positions[i * 3 + 2] += velocities[i * 3 + 2];
      }
    }

    positionAttr.needsUpdate = true;
    material.opacity = isSpawning ? 0.8 * (1 - spawnProgress * 0.5) : 0;
  });

  if (!isSpawning) return null;

  return <points ref={particlesRef} geometry={geometry} material={material} />;
};

interface GeometryMeshProps {
  object: SceneObject;
  particleCount: number;
}

const GeometryMesh: React.FC<GeometryMeshProps> = ({ object, particleCount }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowMeshRef = useRef<THREE.Mesh>(null);
  const selectObject = useSceneStore((state) => state.selectObject);
  const selectedObjectId = useSceneStore((state) => state.selectedObjectId);
  const updateObject = useSceneStore((state) => state.updateObject);

  const isSelected = selectedObjectId === object.id;

  const geometry = useMemo(() => {
    switch (object.type) {
      case 'cube':
        return new THREE.BoxGeometry(1, 1, 1);
      case 'sphere':
        return new THREE.SphereGeometry(0.6, 32, 32);
      case 'cone':
        return new THREE.ConeGeometry(0.5, 1, 32);
      case 'torus':
        return new THREE.TorusGeometry(0.4, 0.15, 16, 48);
      case 'cylinder':
        return new THREE.CylinderGeometry(0.4, 0.4, 1, 32);
      default:
        return new THREE.BoxGeometry(1, 1, 1);
    }
  }, [object.type]);

  const glowGeometry = useMemo(() => {
    switch (object.type) {
      case 'cube':
        return new THREE.BoxGeometry(1.05, 1.05, 1.05);
      case 'sphere':
        return new THREE.SphereGeometry(0.65, 32, 32);
      case 'cone':
        return new THREE.ConeGeometry(0.55, 1.1, 32);
      case 'torus':
        return new THREE.TorusGeometry(0.45, 0.2, 16, 48);
      case 'cylinder':
        return new THREE.CylinderGeometry(0.45, 0.45, 1.05, 32);
      default:
        return new THREE.BoxGeometry(1.05, 1.05, 1.05);
    }
  }, [object.type]);

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: object.color,
      metalness: 0.3,
      roughness: 0.5,
      emissive: isSelected ? new THREE.Color(object.color).multiplyScalar(0.2) : new THREE.Color(0x000000),
    });
  }, [object.color, isSelected]);

  const glowMaterial = useMemo(() => {
    const glowColor = getGlowColor(object.activeTransform);
    return new THREE.MeshBasicMaterial({
      color: glowColor,
      transparent: true,
      opacity: object.activeTransform ? 0.4 * object.transformIntensity : 0,
      side: THREE.BackSide,
    });
  }, [object.activeTransform, object.transformIntensity]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    let newSpawnProgress = object.spawnProgress;
    if (object.isSpawning) {
      newSpawnProgress = Math.min(1, object.spawnProgress + delta / 2);
    }

    const t = easeOutCubic(Math.min(1, newSpawnProgress));

    if (object.isSpawning) {
      meshRef.current.position.x = THREE.MathUtils.lerp(object.spawnDirection.x, object.targetPosition.x, t);
      meshRef.current.position.y = THREE.MathUtils.lerp(object.spawnDirection.y, object.targetPosition.y, t);
      meshRef.current.position.z = THREE.MathUtils.lerp(object.spawnDirection.z, object.targetPosition.z, t);
    } else {
      meshRef.current.position.x = THREE.MathUtils.damp(meshRef.current.position.x, object.targetPosition.x, 4, delta);
      meshRef.current.position.y = THREE.MathUtils.damp(meshRef.current.position.y, object.targetPosition.y, 4, delta);
      meshRef.current.position.z = THREE.MathUtils.damp(meshRef.current.position.z, object.targetPosition.z, 4, delta);
    }

    const targetScale = object.targetScale * (object.isSpawning ? t : 1);
    meshRef.current.scale.x = THREE.MathUtils.damp(meshRef.current.scale.x, targetScale, 6, delta);
    meshRef.current.scale.y = THREE.MathUtils.damp(meshRef.current.scale.y, targetScale, 6, delta);
    meshRef.current.scale.z = THREE.MathUtils.damp(meshRef.current.scale.z, targetScale, 6, delta);

    if (object.rotationSpeed.x !== 0) {
      meshRef.current.rotation.x += object.rotationSpeed.x * delta;
    }
    if (object.rotationSpeed.y !== 0) {
      meshRef.current.rotation.y += object.rotationSpeed.y * delta;
    }
    if (object.rotationSpeed.z !== 0) {
      meshRef.current.rotation.z += object.rotationSpeed.z * delta;
    }

    if (glowMeshRef.current) {
      glowMeshRef.current.position.copy(meshRef.current.position);
      glowMeshRef.current.scale.copy(meshRef.current.scale).multiplyScalar(1.08);
      glowMeshRef.current.rotation.copy(meshRef.current.rotation);

      const glowColor = getGlowColor(object.activeTransform);
      (glowMeshRef.current.material as THREE.MeshBasicMaterial).color.set(glowColor);
      const targetOpacity = object.activeTransform ? 0.4 * object.transformIntensity : 0;
      (glowMeshRef.current.material as THREE.MeshBasicMaterial).opacity = THREE.MathUtils.damp(
        (glowMeshRef.current.material as THREE.MeshBasicMaterial).opacity,
        targetOpacity,
        4,
        delta
      );
    }

    const shouldUpdateSpawn = object.isSpawning && newSpawnProgress !== object.spawnProgress;
    const newTransformIntensity = object.transformIntensity > 0
      ? Math.max(0, object.transformIntensity - delta * 0.5)
      : 0;
    const shouldUpdateTransform = Math.abs(newTransformIntensity - object.transformIntensity) > 0.001;

    if (shouldUpdateSpawn || shouldUpdateTransform) {
      const updates: Partial<SceneObject> = {};
      if (shouldUpdateSpawn) {
        updates.spawnProgress = newSpawnProgress;
        if (newSpawnProgress >= 1) {
          updates.isSpawning = false;
          updates.position = { ...object.targetPosition };
        }
      }
      if (shouldUpdateTransform) {
        updates.transformIntensity = newTransformIntensity;
        if (newTransformIntensity <= 0 && object.activeTransform) {
          updates.activeTransform = null;
        }
      }
      updateObject(object.id, updates);
    }
  });

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    selectObject(object.id);
    useSceneStore.getState().setFocusTarget({
      x: object.targetPosition.x,
      y: object.targetPosition.y,
      z: object.targetPosition.z,
    });
  };

  return (
    <group>
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        onClick={handleClick}
        castShadow
        receiveShadow
      />
      {object.activeTransform && (
        <mesh ref={glowMeshRef} geometry={glowGeometry} material={glowMaterial} />
      )}
      <ParticleTrail
        color={object.color}
        objectId={object.id}
        isSpawning={object.isSpawning}
        spawnProgress={object.spawnProgress}
        spawnDirection={object.spawnDirection}
        targetPosition={object.targetPosition}
        particleCount={particleCount}
      />
    </group>
  );
};

const GroundGrid: React.FC = () => {
  const ringsRef = useRef<THREE.Group>(null);
  const linesRef = useRef<THREE.Group>(null);

  const ringsGeometry = useMemo(() => {
    const group = new THREE.Group();
    for (let i = 1; i <= 30; i++) {
      const radius = (i / 30) * 12;
      const segments = Math.max(32, Math.floor(radius * 8));
      const points: THREE.Vector3[] = [];
      for (let j = 0; j <= segments; j++) {
        const angle = (j / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(angle) * radius, 0.01, Math.sin(angle) * radius));
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.15,
      });
      const line = new THREE.Line(geometry, material);
      group.add(line);
    }
    return group;
  }, []);

  const radialLinesGeometry = useMemo(() => {
    const group = new THREE.Group();
    const lines = 24;
    for (let i = 0; i < lines; i++) {
      const angle = (i / lines) * Math.PI * 2;
      const points = [
        new THREE.Vector3(0, 0.01, 0),
        new THREE.Vector3(Math.cos(angle) * 12, 0.01, Math.sin(angle) * 12),
      ];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.1,
      });
      const line = new THREE.Line(geometry, material);
      group.add(line);
    }
    return group;
  }, []);

  return (
    <group>
      <primitive object={ringsGeometry} ref={ringsRef} />
      <primitive object={radialLinesGeometry} ref={linesRef} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <circleGeometry args={[12, 64]} />
        <meshBasicMaterial color={0x0A0E27} transparent opacity={0.6} />
      </mesh>
    </group>
  );
};

interface CameraControllerProps {
  focusTarget: { x: number; y: number; z: number } | null;
}

const CameraController: React.FC<CameraControllerProps> = ({ focusTarget }) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const targetCameraPos = useRef(new THREE.Vector3(8, 8, 8));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    const distance = 11;
    const angle = Math.PI / 4;
    const elevation = Math.PI / 180 * 25;
    targetCameraPos.current.set(
      Math.cos(elevation) * Math.sin(angle) * distance,
      Math.sin(elevation) * distance + 3,
      Math.cos(elevation) * Math.cos(angle) * distance
    );
    targetLookAt.current.set(0, 0.5, 0);
  }, []);

  useEffect(() => {
    if (focusTarget) {
      const offset = new THREE.Vector3(4, 4, 4);
      targetCameraPos.current.set(
        focusTarget.x + offset.x,
        focusTarget.y + offset.y,
        focusTarget.z + offset.z
      );
      targetLookAt.current.set(focusTarget.x, focusTarget.y, focusTarget.z);
    }
  }, [focusTarget]);

  useFrame((state, delta) => {
    camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCameraPos.current.x, 2, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCameraPos.current.y, 2, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCameraPos.current.z, 2, delta);

    if (controlsRef.current) {
      controlsRef.current.target.x = THREE.MathUtils.damp(controlsRef.current.target.x, targetLookAt.current.x, 2, delta);
      controlsRef.current.target.y = THREE.MathUtils.damp(controlsRef.current.target.y, targetLookAt.current.y, 2, delta);
      controlsRef.current.target.z = THREE.MathUtils.damp(controlsRef.current.target.z, targetLookAt.current.z, 2, delta);
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      minDistance={3}
      maxDistance={30}
      maxPolarAngle={Math.PI / 2 - 0.05}
      target={[0, 0.5, 0]}
    />
  );
};

interface ReplayExecutorProps {
  replay: { isPlaying: boolean; speed: 1 | 2; currentTime: number; totalDuration: number };
  commandHistory: Array<{
    id: string;
    timestamp: number;
    type: 'create' | 'transform';
    objectId?: string;
    geometryType?: GeometryType;
    color?: string;
    transformType?: TransformType;
    transformData?: any;
  }>;
}

const ReplayExecutor: React.FC<ReplayExecutorProps> = ({ replay, commandHistory }) => {
  const executedRef = useRef<Set<string>>(new Set());
  const lastTimeRef = useRef(0);
  const objects = useSceneStore((state) => state.objects);
  const addObject = useSceneStore((state) => state.addObject);
  const updateObject = useSceneStore((state) => state.updateObject);
  const setReplay = useSceneStore((state) => state.setReplay);

  useEffect(() => {
    if (!replay.isPlaying) {
      lastTimeRef.current = 0;
      return;
    }

    const startTime = performance.now();
    let animationId: number;

    const tick = () => {
      const elapsed = (performance.now() - startTime) * replay.speed;
      const newTime = replay.currentTime + elapsed;

      commandHistory.forEach((cmd) => {
        if (!executedRef.current.has(cmd.id) && cmd.timestamp <= newTime) {
          executedRef.current.add(cmd.id);

          if (cmd.type === 'create' && cmd.geometryType && cmd.color) {
            addObject({
              type: cmd.geometryType,
              color: cmd.color as any,
              position: { x: 0, y: 0.5, z: 0 },
              targetPosition: { x: 0, y: 0.5, z: 0 },
              scale: 1,
              targetScale: 1,
              rotation: { x: 0, y: 0, z: 0 },
              rotationSpeed: { x: 0, y: 0, z: 0 },
              id: cmd.objectId,
            });
          } else if (cmd.type === 'transform' && cmd.objectId) {
            const currentObj = objects.find((o) => o.id === cmd.objectId);
            if (currentObj && cmd.transformType && cmd.transformData) {
              if (cmd.transformType === 'move' && cmd.transformData.offset) {
                updateObject(cmd.objectId, {
                  targetPosition: {
                    x: currentObj.targetPosition.x + cmd.transformData.offset.x,
                    y: Math.max(0.5, currentObj.targetPosition.y + cmd.transformData.offset.y),
                    z: currentObj.targetPosition.z + cmd.transformData.offset.z,
                  },
                  activeTransform: 'move',
                  transformIntensity: 1,
                });
              } else if (cmd.transformType === 'scale' && cmd.transformData.scale) {
                updateObject(cmd.objectId, {
                  targetScale: Math.max(0.2, Math.min(5, currentObj.targetScale * cmd.transformData.scale)),
                  activeTransform: 'scale',
                  transformIntensity: 1,
                });
              } else if (cmd.transformType === 'rotate' && cmd.transformData.rotationAxis && cmd.transformData.rotationSpeed) {
                const axis = cmd.transformData.rotationAxis;
                const currentSpeed = { ...currentObj.rotationSpeed };
                currentSpeed[axis] = currentSpeed[axis] === 0 ? cmd.transformData.rotationSpeed : 0;
                updateObject(cmd.objectId, {
                  rotationSpeed: currentSpeed,
                  activeTransform: 'rotate',
                  transformIntensity: 1,
                });
              }
            }
          }
        }
      });

      if (newTime >= replay.totalDuration && replay.totalDuration > 0) {
        setReplay({ isPlaying: false, currentTime: replay.totalDuration });
      } else {
        setReplay({ currentTime: newTime });
        animationId = requestAnimationFrame(tick);
      }
    };

    animationId = requestAnimationFrame(tick);

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [replay.isPlaying]);

  useEffect(() => {
    if (!replay.isPlaying) {
      executedRef.current.clear();
    }
  }, [replay.isPlaying]);

  return null;
};

const SceneContent: React.FC = () => {
  const objects = useSceneStore((state) => state.objects);
  const focusTarget = useSceneStore((state) => state.focusTarget);
  const replay = useSceneStore((state) => state.replay);
  const commandHistory = useSceneStore((state) => state.commandHistory);

  const particleCount = objects.length > 30 ? 15 : 30;

  return (
    <>
      <PerspectiveCamera makeDefault position={[8, 8, 8]} fov={50} />
      <CameraController focusTarget={focusTarget} />

      <color attach="background" args={['#0A0E27']} />
      <fog attach="fog" args={['#0A0E27', 20, 45]} />

      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 15, 10]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <pointLight position={[-10, 10, -10]} intensity={0.5} color="#4FC3F7" />
      <pointLight position={[10, 5, -10]} intensity={0.3} color="#A66CFF" />

      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />

      <GroundGrid />

      {objects.map((obj) => (
        <GeometryMesh key={obj.id} object={obj} particleCount={particleCount} />
      ))}

      <ReplayExecutor replay={replay} commandHistory={commandHistory} />
    </>
  );
};

export const SceneManager: React.FC = () => {
  const [dpr, setDpr] = useState([1, 2]);
  const objects = useSceneStore((state) => state.objects);

  useEffect(() => {
    if (objects.length > 30) {
      setDpr([0.75, 1.5]);
    } else {
      setDpr([1, 2]);
    }
  }, [objects.length]);

  return (
    <Canvas
      shadows
      dpr={dpr as any}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
      }}
    >
      <SceneContent />
    </Canvas>
  );
};
