import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useAcousticStore } from './store/useAcousticStore';
import {
  Vector3,
  SoundSource,
  Listener,
  Obstacle,
  SoundWave,
  ReflectionLine,
  DiffractionArc,
  MATERIAL_PROPS,
} from './types/acoustic';
import {
  vec3,
  vec3Add,
  vec3Sub,
  vec3Scale,
  vec3Distance,
  fromTHREEVector3,
  toTHREEVector3,
  easeOutQuad,
  lerp,
} from './utils/mathUtils';

interface SceneProps {
  width?: number | string;
  height?: number | string;
}

const Room: React.FC = () => {
  const roomSize = useAcousticStore((state) => state.roomSize);
  const halfSize = vec3Scale(roomSize, 0.5);

  const wallMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#2A2A3E',
        roughness: 0.9,
        metalness: 0.1,
        side: THREE.BackSide,
      }),
    []
  );

  const floorMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#1E1E30',
        roughness: 0.95,
        metalness: 0.05,
      }),
    []
  );

  const edgeMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: '#4A4A6E',
        transparent: true,
        opacity: 0.6,
      }),
    []
  );

  const edgeGeometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const hs = halfSize;
    const v = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(roomSize.x, 0, 0),
      new THREE.Vector3(roomSize.x, 0, roomSize.z),
      new THREE.Vector3(0, 0, roomSize.z),
      new THREE.Vector3(0, roomSize.y, 0),
      new THREE.Vector3(roomSize.x, roomSize.y, 0),
      new THREE.Vector3(roomSize.x, roomSize.y, roomSize.z),
      new THREE.Vector3(0, roomSize.y, roomSize.z),
    ];
    const edges = [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [4, 5], [5, 6], [6, 7], [7, 4],
      [0, 4], [1, 5], [2, 6], [3, 7],
    ];
    for (const [a, b] of edges) {
      points.push(v[a], v[b]);
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [roomSize, halfSize]);

  return (
    <group position={[0, 0, 0]}>
      <mesh position={[halfSize.x, halfSize.y, halfSize.z]}>
        <boxGeometry args={[roomSize.x, roomSize.y, roomSize.z]} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>

      <mesh position={[halfSize.x, 0.01, halfSize.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[roomSize.x, roomSize.z]} />
        <primitive object={floorMaterial} attach="material" />
      </mesh>

      <lineSegments geometry={edgeGeometry} material={edgeMaterial} />

      <gridHelper
        args={[Math.max(roomSize.x, roomSize.z), Math.max(roomSize.x, roomSize.z), '#3A3A5E', '#2A2A4E']}
        position={[halfSize.x, 0.02, halfSize.z]}
      />
    </group>
  );
};

interface SoundSourceItemProps {
  source: SoundSource;
  isSelected: boolean;
  onSelect: () => void;
  onDrag: (pos: Vector3) => void;
  onRemove: () => void;
}

const SoundSourceItem: React.FC<SoundSourceItemProps> = ({
  source,
  isSelected,
  onSelect,
  onDrag,
  onRemove,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragPlane = useRef<THREE.Plane>(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const dragOffset = useRef<THREE.Vector3>(new THREE.Vector3());

  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.elapsedTime;
      const scale = 1 + 0.15 * Math.sin((time * Math.PI * 2) / 0.6);
      meshRef.current.scale.setScalar(scale);
      if (glowRef.current) {
        const glowScale = 1.5 + 0.3 * Math.sin((time * Math.PI * 2) / 0.6);
        glowRef.current.scale.setScalar(glowScale);
        const mat = glowRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.3 + 0.2 * Math.sin((time * Math.PI * 2) / 0.6);
      }
    }
  });

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    if (e.button === 2) {
      onRemove();
      return;
    }
    onSelect();
    setIsDragging(true);
    e.target.setPointerCapture(e.pointerId);

    const intersectPoint = e.point.clone();
    dragPlane.current.setFromNormalAndCoplanarPoint(
      new THREE.Vector3(0, 1, 0),
      intersectPoint
    );
    dragOffset.current.copy(intersectPoint).sub(
      new THREE.Vector3(source.position.x, source.position.y, source.position.z)
    );
  };

  const handlePointerMove = (e: any) => {
    if (!isDragging) return;
    e.stopPropagation();

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(e.pointer, e.camera);
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(dragPlane.current, intersection);

    if (intersection) {
      const newPos = intersection.sub(dragOffset.current);
      onDrag(fromTHREEVector3(newPos));
    }
  };

  const handlePointerUp = (e: any) => {
    setIsDragging(false);
    e.target.releasePointerCapture(e.pointerId);
  };

  return (
    <group position={[source.position.x, source.position.y, source.position.z]}>
      <mesh
        ref={meshRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <sphereGeometry args={[source.radius, 32, 32]} />
        <meshStandardMaterial
          color={isSelected ? '#FFEB3B' : '#FFD700'}
          emissive={isSelected ? '#FFEB3B' : '#FFA500'}
          emissiveIntensity={isSelected ? 0.8 : 0.4}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>

      <mesh ref={glowRef}>
        <sphereGeometry args={[source.radius, 32, 32]} />
        <meshBasicMaterial
          color="#FFD700"
          transparent
          opacity={0.3}
          side={ THREE.BackSide }
        />
      </mesh>

      {isSelected && (
        <mesh>
          <ringGeometry args={[source.radius * 1.8, source.radius * 2.2, 32]} />
          <meshBasicMaterial
            color="#FFEB3B"
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
};

interface ListenerItemProps {
  listener: Listener;
  isSelected: boolean;
  onSelect: () => void;
  onDrag: (pos: Vector3) => void;
  onRemove: () => void;
}

const ListenerItem: React.FC<ListenerItemProps> = ({
  listener,
  isSelected,
  onSelect,
  onDrag,
  onRemove,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragPlane = useRef<THREE.Plane>(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const dragOffset = useRef<THREE.Vector3>(new THREE.Vector3());
  const [displayDb, setDisplayDb] = useState(listener.displayDbValue);

  useEffect(() => {
    const start = displayDb;
    const end = listener.displayDbValue;
    const duration = 150;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutQuad(progress);
      setDisplayDb(lerp(start, end, eased));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [listener.displayDbValue]);

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    if (e.button === 2) {
      onRemove();
      return;
    }
    onSelect();
    setIsDragging(true);
    e.target.setPointerCapture(e.pointerId);

    const intersectPoint = e.point.clone();
    dragPlane.current.setFromNormalAndCoplanarPoint(
      new THREE.Vector3(0, 1, 0),
      intersectPoint
    );
    dragOffset.current.copy(intersectPoint).sub(
      new THREE.Vector3(listener.position.x, listener.position.y, listener.position.z)
    );
  };

  const handlePointerMove = (e: any) => {
    if (!isDragging) return;
    e.stopPropagation();

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(e.pointer, e.camera);
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(dragPlane.current, intersection);

    if (intersection) {
      const newPos = intersection.sub(dragOffset.current);
      onDrag(fromTHREEVector3(newPos));
    }
  };

  const handlePointerUp = (e: any) => {
    setIsDragging(false);
    e.target.releasePointerCapture(e.pointerId);
  };

  const getDbColor = (db: number) => {
    if (db > 90) return '#FF4444';
    if (db > 75) return '#FF8800';
    if (db > 60) return '#FFCC00';
    if (db > 45) return '#88CC00';
    return '#44AA44';
  };

  return (
    <group
      ref={groupRef}
      position={[listener.position.x, listener.position.y, listener.position.z]}
    >
      <group
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <mesh position={[0, 0.25, 0]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial
            color={isSelected ? '#66B3FF' : '#4A9EFF'}
            emissive={isSelected ? '#4A9EFF' : '#2A5E9E'}
            emissiveIntensity={isSelected ? 0.5 : 0.2}
            roughness={0.4}
          />
        </mesh>

        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.1, 0.15, 0.25, 8]} />
          <meshStandardMaterial
            color={isSelected ? '#66B3FF' : '#4A9EFF'}
            emissive={isSelected ? '#4A9EFF' : '#2A5E9E'}
            emissiveIntensity={isSelected ? 0.3 : 0.1}
            roughness={0.5}
          />
        </mesh>

        {isSelected && (
          <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.2, 0.25, 32]} />
            <meshBasicMaterial
              color="#4A9EFF"
              transparent
              opacity={0.6}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
      </group>

      <Html position={[0, 0.6, 0]} center distanceFactor={8}>
        <div
          style={{
            fontFamily: "'Fira Code', monospace",
            fontSize: '14px',
            fontWeight: 600,
            color: getDbColor(displayDb),
            background: 'rgba(0, 0, 0, 0.7)',
            padding: '4px 10px',
            borderRadius: '6px',
            whiteSpace: 'nowrap',
            textShadow: '0 0 10px currentColor',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {displayDb.toFixed(1)} dB
        </div>
      </Html>
    </group>
  );
};

interface ObstacleItemProps {
  obstacle: Obstacle;
  isSelected: boolean;
  cameraPosition: Vector3;
  onSelect: () => void;
  onDrag: (pos: Vector3) => void;
  onRemove: () => void;
}

const ObstacleItem: React.FC<ObstacleItemProps> = ({
  obstacle,
  isSelected,
  cameraPosition,
  onSelect,
  onDrag,
  onRemove,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragPlane = useRef<THREE.Plane>(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const dragOffset = useRef<THREE.Vector3>(new THREE.Vector3());
  const [cutawayOpacity, setCutawayOpacity] = useState(0);

  const matProps = MATERIAL_PROPS[obstacle.material];

  useEffect(() => {
    const obstacleCenter = new THREE.Vector3(
      obstacle.position.x,
      obstacle.position.y,
      obstacle.position.z
    );
    const camPos = new THREE.Vector3(
      cameraPosition.x,
      cameraPosition.y,
      cameraPosition.z
    );
    const distance = obstacleCenter.distanceTo(camPos);
    const triggerDistance = Math.max(obstacle.size.x, obstacle.size.y, obstacle.size.z) * 1.5;

    const targetOpacity = distance < triggerDistance ? 0.3 : 0;
    const duration = 250;
    const startOpacity = cutawayOpacity;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutQuad(progress);
      setCutawayOpacity(lerp(startOpacity, targetOpacity, eased));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [cameraPosition, obstacle.position, obstacle.size]);

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    if (e.button === 2) {
      onRemove();
      return;
    }
    onSelect();
    setIsDragging(true);
    e.target.setPointerCapture(e.pointerId);

    const intersectPoint = e.point.clone();
    dragPlane.current.setFromNormalAndCoplanarPoint(
      new THREE.Vector3(0, 1, 0),
      intersectPoint
    );
    dragOffset.current.copy(intersectPoint).sub(
      new THREE.Vector3(obstacle.position.x, obstacle.position.y, obstacle.position.z)
    );
  };

  const handlePointerMove = (e: any) => {
    if (!isDragging) return;
    e.stopPropagation();

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(e.pointer, e.camera);
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(dragPlane.current, intersection);

    if (intersection) {
      const newPos = intersection.sub(dragOffset.current);
      onDrag(fromTHREEVector3(newPos));
    }
  };

  const handlePointerUp = (e: any) => {
    setIsDragging(false);
    e.target.releasePointerCapture(e.pointerId);
  };

  const effectiveOpacity = cutawayOpacity > 0 ? 0.3 : matProps.opacity;

  return (
    <group position={[obstacle.position.x, obstacle.position.y, obstacle.position.z]}>
      <mesh
        ref={meshRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <boxGeometry args={[obstacle.size.x, obstacle.size.y, obstacle.size.z]} />
        <meshStandardMaterial
          color={matProps.color}
          transparent={matProps.transparent || cutawayOpacity > 0}
          opacity={effectiveOpacity}
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>

      {cutawayOpacity > 0 && (
        <lineSegments>
          <edgesGeometry
            args={[new THREE.BoxGeometry(obstacle.size.x, obstacle.size.y, obstacle.size.z)]}
          />
          <lineBasicMaterial color="#FFFFFF" transparent opacity={0.6} />
        </lineSegments>
      )}

      {isSelected && (
        <mesh>
          <boxGeometry
            args={[
              obstacle.size.x + 0.04,
              obstacle.size.y + 0.04,
              obstacle.size.z + 0.04,
            ]}
          />
          <meshBasicMaterial
            color="#FFFFFF"
            transparent
            opacity={0.2}
            side={THREE.BackSide}
          />
        </mesh>
      )}
    </group>
  );
};

interface SoundWavesProps {
  waves: SoundWave[];
  sources: SoundSource[];
  engine: any;
}

const SoundWaves: React.FC<SoundWavesProps> = ({ waves, sources, engine }) => {
  const waveData = useMemo(() => {
    return waves.map((wave) => {
      const source = sources.find((s) => s.id === wave.sourceId);
      if (!source) return null;
      const radius = engine.getWaveRadius(wave);
      const opacity = engine.getWaveOpacity(wave);
      return { wave, source, radius, opacity };
    }).filter(Boolean) as Array<{
      wave: SoundWave;
      source: SoundSource;
      radius: number;
      opacity: number;
    }>;
  }, [waves, sources, engine]);

  return (
    <group>
      {waveData.map(({ wave, source, radius, opacity }) => (
        <mesh
          key={wave.id}
          position={[source.position.x, source.position.y, source.position.z]}
        >
          <sphereGeometry args={[radius, 48, 48]} />
          <meshBasicMaterial
            color="#00FF88"
            transparent
            opacity={opacity * 0.4}
            side={THREE.DoubleSide}
            wireframe={radius > 2}
            wireframeLinewidth={2}
          />
        </mesh>
      ))}
    </group>
  );
};

interface ReflectionLinesProps {
  reflections: ReflectionLine[];
  engine: any;
}

const ReflectionLines: React.FC<ReflectionLinesProps> = ({ reflections, engine }) => {
  return (
    <group>
      {reflections.map((reflection) => {
        const opacity = engine.getReflectionOpacity(reflection);
        const points = [
          new THREE.Vector3(reflection.start.x, reflection.start.y, reflection.start.z),
          new THREE.Vector3(reflection.end.x, reflection.end.y, reflection.end.z),
        ];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        return (
          <lineSegments
            key={reflection.id}
            geometry={geometry}
          >
            <lineDashedMaterial
              color="#FFFFFF"
              transparent
              opacity={opacity * 0.8}
              dashSize={0.15}
              gapSize={0.1}
            />
          </lineSegments>
        );
      })}
    </group>
  );
};

interface DiffractionArcsProps {
  diffractions: DiffractionArc[];
  engine: any;
}

const DiffractionArcs: React.FC<DiffractionArcsProps> = ({ diffractions, engine }) => {
  const createArcGeometry = (diffraction: DiffractionArc): THREE.BufferGeometry => {
    const points: THREE.Vector3[] = [];
    const segments = 32;

    const normal = new THREE.Vector3(
      diffraction.normal.x,
      diffraction.normal.y,
      diffraction.normal.z
    ).normalize();

    const up = new THREE.Vector3(0, 1, 0);
    if (Math.abs(normal.dot(up)) > 0.9) {
      up.set(1, 0, 0);
    }

    const tangent = new THREE.Vector3().crossVectors(normal, up).normalize();
    const bitangent = new THREE.Vector3().crossVectors(normal, tangent).normalize();

    for (let i = 0; i <= segments; i++) {
      const angle = diffraction.startAngle +
        (i / segments) * (diffraction.endAngle - diffraction.startAngle);
      const x = Math.cos(angle) * diffraction.radius;
      const y = Math.sin(angle) * diffraction.radius;

      const point = new THREE.Vector3(
        diffraction.center.x + tangent.x * x + bitangent.x * y,
        diffraction.center.y + tangent.y * x + bitangent.y * y,
        diffraction.center.z + tangent.z * x + bitangent.z * y
      );
      points.push(point);
    }

    return new THREE.BufferGeometry().setFromPoints(points);
  };

  return (
    <group>
      {diffractions.map((diffraction) => {
        const opacity = engine.getDiffractionOpacity(diffraction);
        const geometry = createArcGeometry(diffraction);

        return (
          <lineSegments
            key={diffraction.id}
            geometry={geometry}
          >
            <lineDashedMaterial
              color="#87CEEB"
              transparent
              opacity={opacity * 0.7}
              dashSize={0.1}
              gapSize={0.08}
            />
          </lineSegments>
        );
      })}
    </group>
  );
};

interface AddModePreviewProps {
  addMode: 'source' | 'listener' | 'obstacle' | null;
}

const AddModePreview: React.FC<AddModePreviewProps> = ({ addMode }) => {
  const { camera, gl } = useThree();
  const [previewPos, setPreviewPos] = useState<Vector3 | null>(null);
  const addSoundSource = useAcousticStore((state) => state.addSoundSource);
  const addListener = useAcousticStore((state) => state.addListener);
  const addObstacle = useAcousticStore((state) => state.addObstacle);
  const roomSize = useAcousticStore((state) => state.roomSize);

  useEffect(() => {
    if (!addMode) {
      setPreviewPos(null);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersection = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, intersection);

      if (intersection) {
        setPreviewPos(fromTHREEVector3(intersection));
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (!previewPos) return;
      if (addMode === 'source') {
        addSoundSource(previewPos);
      } else if (addMode === 'listener') {
        addListener(previewPos);
      } else if (addMode === 'obstacle') {
        addObstacle(previewPos);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        useAcousticStore.getState().setAddMode(null);
      }
    };

    gl.domElement.addEventListener('mousemove', handleMouseMove);
    gl.domElement.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      gl.domElement.removeEventListener('mousemove', handleMouseMove);
      gl.domElement.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [addMode, previewPos, camera, gl, addSoundSource, addListener, addObstacle]);

  if (!addMode || !previewPos) return null;

  const clampedPos = vec3(
    Math.max(0.2, Math.min(roomSize.x - 0.2, previewPos.x)),
    Math.max(0.2, Math.min(roomSize.y - 0.2, previewPos.y)),
    Math.max(0.2, Math.min(roomSize.z - 0.2, previewPos.z))
  );

  const colors: Record<string, string> = {
    source: '#FFD700',
    listener: '#4A9EFF',
    obstacle: '#808080',
  };

  return (
    <group position={[clampedPos.x, clampedPos.y, clampedPos.z]}>
      <mesh>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial
          color={colors[addMode]}
          transparent
          opacity={0.5}
        />
      </mesh>
      <mesh>
        <ringGeometry args={[0.18, 0.22, 32]} />
        <meshBasicMaterial
          color={colors[addMode]}
          transparent
          opacity={0.7}
        />
      </mesh>
    </group>
  );
};

interface SceneContentProps {}

const SceneContent: React.FC<SceneContentProps> = () => {
  const {
    soundSources,
    listeners,
    obstacles,
    soundWaves,
    reflectionLines,
    diffractionArcs,
    selectedObjectId,
    selectedObjectType,
    addMode,
    cameraPosition,
    engine,
    setSelectedObject,
    moveSoundSource,
    removeSoundSource,
    moveListener,
    removeListener,
    updateObstacle,
    removeObstacle,
    setCameraPosition,
    update,
  } = useAcousticStore();

  const { camera } = useThree();

  useFrame((_, deltaTime) => {
    update(Math.min(deltaTime, 0.05));

    const newCamPos = fromTHREEVector3(camera.position);
    if (
      Math.abs(newCamPos.x - cameraPosition.x) > 0.1 ||
      Math.abs(newCamPos.y - cameraPosition.y) > 0.1 ||
      Math.abs(newCamPos.z - cameraPosition.z) > 0.1
    ) {
      setCameraPosition(newCamPos);
    }
  });

  const handleBackgroundClick = (e: any) => {
    if (e.target === e.currentTarget) {
      setSelectedObject(null, null);
    }
  };

  const handleContextMenu = (e: any) => {
    e.preventDefault();
  };

  return (
    <group onClick={handleBackgroundClick} onContextMenu={handleContextMenu}>
      <Room />

      {soundSources.map((source) => (
        <SoundSourceItem
          key={source.id}
          source={source}
          isSelected={selectedObjectId === source.id && selectedObjectType === 'source'}
          onSelect={() => setSelectedObject(source.id, 'source')}
          onDrag={(pos) => moveSoundSource(source.id, pos)}
          onRemove={() => removeSoundSource(source.id)}
        />
      ))}

      {listeners.map((listener) => (
        <ListenerItem
          key={listener.id}
          listener={listener}
          isSelected={selectedObjectId === listener.id && selectedObjectType === 'listener'}
          onSelect={() => setSelectedObject(listener.id, 'listener')}
          onDrag={(pos) => moveListener(listener.id, pos)}
          onRemove={() => removeListener(listener.id)}
        />
      ))}

      {obstacles.map((obstacle) => (
        <ObstacleItem
          key={obstacle.id}
          obstacle={obstacle}
          isSelected={selectedObjectId === obstacle.id && selectedObjectType === 'obstacle'}
          cameraPosition={cameraPosition}
          onSelect={() => setSelectedObject(obstacle.id, 'obstacle')}
          onDrag={(pos) =>
            updateObstacle(obstacle.id, { position: pos })
          }
          onRemove={() => removeObstacle(obstacle.id)}
        />
      ))}

      <SoundWaves waves={soundWaves} sources={soundSources} engine={engine} />
      <ReflectionLines reflections={reflectionLines} engine={engine} />
      <DiffractionArcs diffractions={diffractionArcs} engine={engine} />

      <AddModePreview addMode={addMode} />
    </group>
  );
};

export const RoomScene: React.FC<SceneProps> = ({ width = '100%', height = '100%' }) => {
  const roomSize = useAcousticStore((state) => state.roomSize);
  const halfSize = vec3Scale(roomSize, 0.5);

  return (
    <div style={{ width, height, position: 'relative' }}>
      <Canvas
        shadows
        camera={{
          position: [halfSize.x + 6, halfSize.y + 4, halfSize.z + 8],
          fov: 50,
          near: 0.1,
          far: 100,
        }}
        style={{ background: '#1A1A2E' }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => {
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        }}
      >
        <color attach="background" args={['#1A1A2E']} />
        <fog attach="fog" args={['#1A1A2E', 15, 40]} />

        <ambientLight intensity={0.4} />
        <directionalLight
          position={[halfSize.x + 5, roomSize.y + 5, halfSize.z + 5]}
          intensity={0.8}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[halfSize.x, roomSize.y - 0.5, halfSize.z]} intensity={0.3} />

        <SceneContent />

        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          rotateSpeed={0.12}
          panSpeed={0.15}
          minDistance={0.3}
          maxDistance={10 * Math.max(roomSize.x, roomSize.z)}
          mouseButtons={{
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN,
          }}
          touches={{
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_PAN,
          }}
          target={[halfSize.x, halfSize.y, halfSize.z]}
        />
      </Canvas>
    </div>
  );
};

export default RoomScene;
