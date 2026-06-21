import { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import {
  Dataset,
  Marker,
  ProfileData,
  TEMPERATURE_COLOR_MAP,
  PRESSURE_COLOR_MAP,
  WIND_COLOR_MAP,
  ColorMap,
} from '../types';
import { interpolateValueAtPoint, extractProfileData } from '../utils/dataLoader';

type InteractionMode = 'marker' | 'profile' | 'orbit';

interface SceneProps {
  dataset: Dataset | null;
  loading: boolean;
  eventEmitter: any;
  onAddMarker: (marker: Marker) => void;
  onProfileUpdate: (profile: ProfileData | null) => void;
}

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 0, g: 0, b: 0 };
};

const getColorFromValue = (value: number, min: number, max: number, colorMap: ColorMap): THREE.Color => {
  const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const stops = colorMap.stops;
  for (let i = 0; i < stops.length - 1; i++) {
    if (normalized >= stops[i].position && normalized <= stops[i + 1].position) {
      const t =
        (normalized - stops[i].position) / (stops[i + 1].position - stops[i].position);
      const c1 = hexToRgb(stops[i].color);
      const c2 = hexToRgb(stops[i + 1].color);
      return new THREE.Color(
        c1.r + (c2.r - c1.r) * t,
        c1.g + (c2.g - c1.g) * t,
        c1.b + (c2.b - c1.b) * t
      );
    }
  }
  const last = hexToRgb(stops[stops.length - 1].color);
  return new THREE.Color(last.r, last.g, last.b);
};

const getColorMapForType = (type: string): ColorMap => {
  switch (type) {
    case 'temperature':
      return TEMPERATURE_COLOR_MAP;
    case 'pressure':
      return PRESSURE_COLOR_MAP;
    case 'wind':
      return WIND_COLOR_MAP;
    default:
      return TEMPERATURE_COLOR_MAP;
  }
};

interface ParticleCloudProps {
  dataset: Dataset;
  fadeIn: number;
}

const ParticleCloud = ({ dataset, fadeIn }: ParticleCloudProps) => {
  const pointsRef = useRef<THREE.Points>(null);
  const { scene } = useThree();

  useEffect(() => {
    if (!pointsRef.current) return;
    const geometry = pointsRef.current.geometry as THREE.BufferGeometry;
    const positions = new Float32Array(dataset.points.length * 3);
    const colors = new Float32Array(dataset.points.length * 3);
    const colorMap = getColorMapForType(dataset.type);
    const [minVal, maxVal] = dataset.valueRange;

    for (let i = 0; i < dataset.points.length; i++) {
      const p = dataset.points[i];
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
      const color = getColorFromValue(p.value, minVal, maxVal, colorMap);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
    geometry.computeBoundingBox();
  }, [dataset]);

  useFrame(() => {
    if (pointsRef.current && pointsRef.current.material instanceof THREE.PointsMaterial) {
      pointsRef.current.material.opacity = Math.min(1, fadeIn);
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry />
      <pointsMaterial
        size={0.6}
        vertexColors
        transparent
        opacity={0}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

interface GroundPlaneProps {
  onClickGround: (point: THREE.Vector3) => void;
  onPointerDown: (point: THREE.Vector3, event: any) => void;
  onPointerUp: (point: THREE.Vector3, event: any) => void;
  onPointerMove: (point: THREE.Vector3, event: any) => void;
  interactionMode: InteractionMode;
}

const GroundPlane = ({
  onClickGround,
  onPointerDown,
  onPointerUp,
  onPointerMove,
  interactionMode,
}: GroundPlaneProps) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const getWorldPoint = (event: any): THREE.Vector3 | null => {
    return event.point ? event.point.clone() : null;
  };

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.1, 0]}
      onPointerDown={(e) => {
        e.stopPropagation();
        if (interactionMode !== 'orbit') {
          const p = getWorldPoint(e);
          if (p) onPointerDown(p, e);
        }
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
        if (interactionMode !== 'orbit') {
          const p = getWorldPoint(e);
          if (p) onPointerUp(p, e);
        }
      }}
      onPointerMove={(e) => {
        if (interactionMode !== 'orbit') {
          const p = getWorldPoint(e);
          if (p) onPointerMove(p, e);
        }
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (interactionMode === 'marker') {
          const p = getWorldPoint(e);
          if (p) onClickGround(p);
        }
      }}
    >
      <planeGeometry args={[400, 200, 1, 1]} />
      <meshStandardMaterial
        color="#1a2744"
        transparent
        opacity={0.5}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

interface GridLinesProps {
  dataset: Dataset | null;
}

const GridLines = ({ dataset }: GridLinesProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const [bounds, setBounds] = useState({ minX: -200, maxX: 200, minZ: -100, maxZ: 100 });

  useEffect(() => {
    if (dataset && dataset.points.length > 0) {
      let minX = Infinity,
        maxX = -Infinity,
        minZ = Infinity,
        maxZ = -Infinity;
      for (const p of dataset.points) {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minZ = Math.min(minZ, p.z);
        maxZ = Math.max(maxZ, p.z);
      }
      setBounds({ minX, maxX, minZ, maxZ });
    }
  }, [dataset]);

  const lines: JSX.Element[] = [];
  const xStep = 30;
  const zStep = 30;

  for (let x = Math.floor(bounds.minX / xStep) * xStep; x <= bounds.maxX; x += xStep) {
    lines.push(
      <line key={`x-${x}`}>
        <bufferGeometry
          attach="geometry"
          attributes={{
            position: new THREE.Float32BufferAttribute(
              [x, 0, bounds.minZ, x, 0, bounds.maxZ],
              3
            ),
          }}
        />
        <lineBasicMaterial color="#2D4263" transparent opacity={0.3} />
      </line>
    );
  }

  for (let z = Math.floor(bounds.minZ / zStep) * zStep; z <= bounds.maxZ; z += zStep) {
    lines.push(
      <line key={`z-${z}`}>
        <bufferGeometry
          attach="geometry"
          attributes={{
            position: new THREE.Float32BufferAttribute(
              [bounds.minX, 0, z, bounds.maxX, 0, z],
              3
            ),
          }}
        />
        <lineBasicMaterial color="#2D4263" transparent opacity={0.3} />
      </line>
    );
  }

  return <group ref={groupRef}>{lines}</group>;
};

interface MarkersProps {
  markers: Marker[];
  onMarkerClick: (markerId: string) => void;
  eventEmitter: any;
}

const Markers = ({ markers, onMarkerClick, eventEmitter }: MarkersProps) => {
  const [markersState, setMarkersState] = useState<Marker[]>(markers);
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setMarkersState(markers);
    if (markers.length > 0) {
      const newest = markers[markers.length - 1];
      setAnimatingIds((prev) => new Set(prev).add(newest.id));
      setTimeout(() => {
        setAnimatingIds((prev) => {
          const next = new Set(prev);
          next.delete(newest.id);
          return next;
        });
      }, 300);
    }
  }, [markers]);

  useEffect(() => {
    const unsubRemove = eventEmitter.on('removeMarker', (id: string) => {
      setMarkersState((prev) => prev.filter((m) => m.id !== id));
    });
    const unsubClear = eventEmitter.on('clearMarkers', () => {
      setMarkersState([]);
    });
    return () => {
      unsubRemove();
      unsubClear();
    };
  }, [eventEmitter]);

  return (
    <group>
      {markersState.map((marker) => (
        <group key={marker.id} position={marker.position}>
          <mesh
            onClick={(e) => {
              e.stopPropagation();
              onMarkerClick(marker.id);
            }}
            scale={animatingIds.has(marker.id) ? 1.5 : 1}
          >
            <sphereGeometry args={[0.6, 16, 16]} />
            <meshBasicMaterial color="#FFFFFF" />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[1.0, 16, 16]} />
            <meshBasicMaterial color="#FFFFFF" transparent opacity={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

interface ProfileSliceProps {
  profile: ProfileData | null;
  onClear: () => void;
  eventEmitter: any;
}

const ProfileSlice = ({ profile, onClear, eventEmitter }: ProfileSliceProps) => {
  const [localProfile, setLocalProfile] = useState<ProfileData | null>(profile);
  const [animProgress, setAnimProgress] = useState(0);
  const planeMeshRef = useRef<THREE.Mesh>(null);
  const lineRef = useRef<THREE.Line>(null);

  useEffect(() => {
    setLocalProfile(profile);
    if (profile) {
      setAnimProgress(0);
    }
  }, [profile]);

  useEffect(() => {
    const unsub = eventEmitter.on('clearProfile', () => {
      setLocalProfile(null);
      setAnimProgress(0);
    });
    return unsub;
  }, [eventEmitter]);

  useFrame((_, delta) => {
    if (localProfile && animProgress < 1) {
      setAnimProgress((p) => Math.min(1, p + delta * 2.5));
    }
  });

  if (!localProfile) return null;

  const { startPoint, endPoint } = localProfile;
  const mid: [number, number, number] = [
    (startPoint[0] + endPoint[0]) / 2,
    6,
    (startPoint[2] + endPoint[2]) / 2,
  ];
  const dx = endPoint[0] - startPoint[0];
  const dz = endPoint[2] - startPoint[2];
  const length = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(dz, dx);

  const planeWidth = length * animProgress;
  const planeHeight = 15;

  const lineStart: [number, number, number] = [
    startPoint[0] + dx * 0.5 * (1 - animProgress),
    0.05,
    startPoint[2] + dz * 0.5 * (1 - animProgress),
  ];
  const lineEnd: [number, number, number] = [
    endPoint[0] - dx * 0.5 * (1 - animProgress),
    0.05,
    endPoint[2] - dz * 0.5 * (1 - animProgress),
  ];

  return (
    <group>
      <group position={mid} rotation={[0, -angle, 0]}>
        <mesh ref={planeMeshRef}>
          <planeGeometry args={[planeWidth, planeHeight, 1, 1]} />
          <meshBasicMaterial
            color="#10B981"
            transparent
            opacity={0.3 * animProgress}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[planeWidth, planeHeight, 1, 1]} />
          <meshBasicMaterial
            color="#10B981"
            transparent
            opacity={0.1 * animProgress}
            wireframe
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
      <line ref={lineRef}>
        <bufferGeometry
          attach="geometry"
          attributes={{
            position: new THREE.Float32BufferAttribute(
              [...lineStart, ...lineEnd],
              3
            ),
          }}
        />
        <lineDashedMaterial
          color="#F59E0B"
          linewidth={2}
          dashSize={4}
          gapSize={2}
          transparent
          opacity={animProgress}
        />
      </line>
    </group>
  );
};

interface SceneContentProps extends SceneProps {
  interactionMode: InteractionMode;
  setInteractionMode: (mode: InteractionMode) => void;
}

const SceneContent = (props: SceneContentProps) => {
  const { dataset, loading, eventEmitter, onAddMarker, onProfileUpdate, interactionMode, setInteractionMode } = props;
  const [fadeIn, setFadeIn] = useState(0);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<THREE.Vector3 | null>(null);
  const dragCurrentRef = useRef<THREE.Vector3 | null>(null);
  const dragTimeRef = useRef<number>(0);
  const [previewLine, setPreviewLine] = useState<{ start: [number, number, number]; end: [number, number, number] } | null>(null);
  const controlsRef = useRef<any>(null);

  useFrame((_, delta) => {
    if (dataset && fadeIn < 1) {
      setFadeIn((f) => Math.min(1, f + delta * 2));
    }
  });

  useEffect(() => {
    if (dataset) {
      setFadeIn(0);
      setMarkers([]);
      setProfile(null);
    }
  }, [dataset?.id]);

  useEffect(() => {
    const unsubClear = eventEmitter.on('clearMarkers', () => {
      setMarkers([]);
    });
    const unsubClearProfile = eventEmitter.on('clearProfile', () => {
      setProfile(null);
    });
    return () => {
      unsubClear();
      unsubClearProfile();
    };
  }, [eventEmitter]);

  const handleClickGround = useCallback(
    (point: THREE.Vector3) => {
      if (!dataset || interactionMode !== 'marker') return;
      const pos: [number, number, number] = [point.x, 0, point.z];
      const value = interpolateValueAtPoint(dataset.points, pos, 10) ?? 0;
      const marker: Marker = {
        id: `marker-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        position: [point.x, 0.3, point.z],
        value,
        altitude: Math.round(point.y * 10) / 10,
        coordinates: {
          lon: Math.round(point.x * 10) / 10,
          lat: Math.round(point.z * 10) / 10,
        },
      };
      setMarkers((prev) => [...prev, marker]);
      onAddMarker(marker);
    },
    [dataset, interactionMode, onAddMarker]
  );

  const handlePointerDown = useCallback(
    (point: THREE.Vector3, event: any) => {
      if (interactionMode === 'profile') {
        setIsDragging(true);
        dragStartRef.current = point.clone();
        dragCurrentRef.current = point.clone();
        dragTimeRef.current = Date.now();
        if (controlsRef.current) {
          controlsRef.current.enabled = false;
        }
      }
    },
    [interactionMode]
  );

  const handlePointerMove = useCallback(
    (point: THREE.Vector3, event: any) => {
      if (isDragging && dragStartRef.current && interactionMode === 'profile') {
        dragCurrentRef.current = point.clone();
        setPreviewLine({
          start: [dragStartRef.current.x, 0.05, dragStartRef.current.z],
          end: [point.x, 0.05, point.z],
        });
      }
    },
    [isDragging, interactionMode]
  );

  const handlePointerUp = useCallback(
    (point: THREE.Vector3, event: any) => {
      if (controlsRef.current) {
        controlsRef.current.enabled = true;
      }
      if (!isDragging || !dragStartRef.current || !dataset) {
        setIsDragging(false);
        setPreviewLine(null);
        return;
      }
      const dist = dragStartRef.current.distanceTo(point);
      const dragDuration = Date.now() - dragTimeRef.current;
      if (dist > 5 && dragDuration > 100 && interactionMode === 'profile') {
        const start: [number, number, number] = [
          dragStartRef.current.x,
          0,
          dragStartRef.current.z,
        ];
        const end: [number, number, number] = [point.x, 0, point.z];
        const samples = extractProfileData(dataset.points, start, end, 80);
        const newProfile: ProfileData = {
          id: `profile-${Date.now()}`,
          startPoint: start,
          endPoint: end,
          samples,
        };
        setProfile(newProfile);
        onProfileUpdate(newProfile);
      }
      setIsDragging(false);
      setPreviewLine(null);
      dragStartRef.current = null;
      dragCurrentRef.current = null;
    },
    [isDragging, dataset, interactionMode, onProfileUpdate]
  );

  const handleMarkerClick = useCallback(
    (markerId: string) => {
      setMarkers((prev) => prev.filter((m) => m.id !== markerId));
      eventEmitter.emit('removeMarker', markerId);
      const removeEvent = new CustomEvent('marker-removed', { detail: { markerId } });
      window.dispatchEvent(removeEvent);
    },
    [eventEmitter]
  );

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        minDistance={20}
        maxDistance={400}
        makeDefault
      />
      <ambientLight intensity={0.4} />
      <pointLight position={[100, 100, 100]} intensity={0.6} />
      <Stars radius={500} depth={50} count={3000} factor={4} saturation={0} fade speed={0.5} />
      <fog attach="fog" args={['#0A0A1A', 150, 500]} />
      <GridLines dataset={dataset} />
      {dataset && <ParticleCloud dataset={dataset} fadeIn={fadeIn} />}
      <GroundPlane
        onClickGround={handleClickGround}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
        interactionMode={interactionMode}
      />
      <Markers markers={markers} onMarkerClick={handleMarkerClick} eventEmitter={eventEmitter} />
      <ProfileSlice profile={profile} onClear={() => {
        setProfile(null);
        onProfileUpdate(null);
      }} eventEmitter={eventEmitter} />
      {previewLine && (
        <line>
          <bufferGeometry
            attach="geometry"
            attributes={{
              position: new THREE.Float32BufferAttribute(
                [...previewLine.start, ...previewLine.end],
                3
              ),
            }}
          />
          <lineDashedMaterial
            color="#F59E0B"
            linewidth={2}
            dashSize={4}
            gapSize={2}
            transparent
            opacity={0.8}
          />
        </line>
      )}
    </>
  );
};

const Scene3D = forwardRef((props: SceneProps, ref) => {
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('marker');

  useImperativeHandle(ref, () => ({
    addMarker: () => setInteractionMode('marker'),
    removeMarker: () => {},
    drawProfile: () => setInteractionMode('profile'),
    clearAll: () => {},
  }));

  useEffect(() => {
    const handleSetMode = (e: CustomEvent) => {
      const mode = e.detail?.mode as InteractionMode;
      if (mode) setInteractionMode(mode);
    };
    window.addEventListener('set-interaction-mode', handleSetMode as any);
    return () => window.removeEventListener('set-interaction-mode', handleSetMode as any);
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 5,
          display: 'flex',
          gap: 8,
          background: 'rgba(15, 23, 42, 0.85)',
          padding: 6,
          borderRadius: 10,
          backdropFilter: 'blur(8px)',
        }}
      >
        {(['orbit', 'marker', 'profile'] as InteractionMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => {
              setInteractionMode(mode);
              window.dispatchEvent(
                new CustomEvent('set-interaction-mode', { detail: { mode } })
              );
            }}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
              transition: 'all 0.2s ease',
              background: interactionMode === mode ? '#3B82F6' : '#1E293B',
              color: '#E2E8F0',
            }}
            onMouseEnter={(e) => {
              if (interactionMode !== mode)
                (e.target as HTMLButtonElement).style.background = '#334155';
            }}
            onMouseLeave={(e) => {
              if (interactionMode !== mode)
                (e.target as HTMLButtonElement).style.background = '#1E293B';
            }}
          >
            {mode === 'orbit' ? '🎥 浏览' : mode === 'marker' ? '📍 标记' : '📏 剖面'}
          </button>
        ))}
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          zIndex: 5,
          background: 'rgba(15, 23, 42, 0.85)',
          padding: '10px 14px',
          borderRadius: 8,
          fontSize: 12,
          color: '#94A3B8',
          backdropFilter: 'blur(8px)',
          maxWidth: 280,
        }}
      >
        {interactionMode === 'orbit' && '拖拽旋转视角 · 滚轮缩放 · 右键平移'}
        {interactionMode === 'marker' && '点击地面添加标记点 · 点击标记点删除'}
        {interactionMode === 'profile' && '按住鼠标拖拽绘制剖面线段 · 分析数值变化'}
      </div>

      <Canvas
        camera={{ position: [80, 80, 120], fov: 50, near: 0.1, far: 2000 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
        onCreated={({ gl, scene }) => {
          gl.setClearColor('#0F172A', 1);
          scene.background = new THREE.Color('#0F172A');
        }}
      >
        <SceneContent
          {...props}
          interactionMode={interactionMode}
          setInteractionMode={setInteractionMode}
        />
      </Canvas>
    </div>
  );
});

Scene3D.displayName = 'Scene3D';

export default Scene3D;
