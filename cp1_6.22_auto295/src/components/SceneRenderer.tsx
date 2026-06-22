import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Sky } from '@react-three/drei';
import * as THREE from 'three';
import type { Building, PublicFacility, TreeData } from '../types';
import { FACILITY_COLORS, FACILITY_LABELS } from '../types';
import { getScheme } from '../modules/SchemeManager';
import { generateVegetation } from '../modules/VegetationGenerator';

const DEFAULT_CAMERA_POS: [number, number, number] = [25, 25, 25];
const DEFAULT_TARGET: [number, number, number] = [0, 0, 0];
const ANIMATION_DURATION = 1000;

interface AnimatedBuildingProps {
  target: Building;
  opacity: number;
}

const AnimatedBuilding: React.FC<AnimatedBuildingProps> = ({ target, opacity }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const edgesRef = useRef<THREE.LineSegments>(null);
  const startState = useRef({
    position: new THREE.Vector3(...target.position),
    scale: new THREE.Vector3(...target.size),
    color: new THREE.Color(target.color),
  });
  const targetState = useRef({
    position: new THREE.Vector3(...target.position),
    scale: new THREE.Vector3(...target.size),
    color: new THREE.Color(target.color),
  });
  const animStart = useRef(0);
  const isAnimating = useRef(false);

  useEffect(() => {
    startState.current.position.copy(meshRef.current?.position || new THREE.Vector3(...target.position));
    startState.current.scale.copy(meshRef.current?.scale || new THREE.Vector3(...target.size));
    startState.current.color.copy(targetState.current.color);

    targetState.current.position.set(...target.position);
    targetState.current.scale.set(...target.size);
    targetState.current.color.set(target.color);

    animStart.current = performance.now();
    isAnimating.current = true;
  }, [target]);

  useFrame(() => {
    if (!meshRef.current) return;
    const now = performance.now();
    const elapsed = now - animStart.current;
    let t = Math.min(elapsed / ANIMATION_DURATION, 1);
    t = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

    if (isAnimating.current || t < 1) {
      meshRef.current.position.lerpVectors(startState.current.position, targetState.current.position, t);
      meshRef.current.scale.lerpVectors(startState.current.scale, targetState.current.scale, t);
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      mat.color.lerpColors(startState.current.color, targetState.current.color, t);
      mat.opacity = opacity;
      if (t >= 1) isAnimating.current = false;
    } else {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = opacity;
    }
  });

  return (
    <group>
      <mesh ref={meshRef} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={target.color}
          transparent
          opacity={opacity}
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>
      <lineSegments ref={edgesRef}>
        <edgesGeometry args={[new THREE.BoxGeometry(1, 1, 1)]} />
        <lineBasicMaterial color="#CCCCCC" transparent opacity={0.5 * opacity} />
      </lineSegments>
    </group>
  );
};

interface FacilityMarkerProps {
  facility: PublicFacility;
}

const FacilityMarker: React.FC<FacilityMarkerProps> = ({ facility }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const [showPopup, setShowPopup] = useState(false);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pulse = 1 + Math.sin(t * Math.PI) * 0.15;
    if (haloRef.current) {
      haloRef.current.scale.setScalar(pulse);
      const mat = haloRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.3 + Math.sin(t * Math.PI) * 0.2;
    }
    if (meshRef.current) {
      meshRef.current.position.y = facility.position[1] + Math.sin(t * 2) * 0.05;
    }
  });

  const color = FACILITY_COLORS[facility.type];

  return (
    <group position={[facility.position[0], 0, facility.position[2]]}>
      <mesh
        ref={meshRef}
        position={[0, facility.position[1], 0]}
        onClick={(e) => {
          e.stopPropagation();
          setShowPopup(!showPopup);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default';
        }}
      >
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
        />
      </mesh>
      <mesh ref={haloRef} position={[0, facility.position[1], 0]}>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
      {showPopup && (
        <group position={[0, facility.position[1] + 1, 0]}>
          <mesh>
            <planeGeometry args={[2.5, 1]} />
            <meshBasicMaterial color="rgba(0,0,0,0.8)" transparent />
          </mesh>
        </group>
      )}
    </group>
  );
};

interface FacilityPopupProps {
  facility: PublicFacility;
}

const FacilityPopup: React.FC<FacilityPopupProps> = ({ facility }) => {
  const { camera, size } = useThree();
  const [screenPos, setScreenPos] = useState({ x: 0, y: 0 });

  useFrame(() => {
    const vec = new THREE.Vector3(...facility.position);
    vec.project(camera);
    setScreenPos({
      x: (vec.x * 0.5 + 0.5) * size.width,
      y: (-vec.y * 0.5 + 0.5) * size.height,
    });
  });

  const color = FACILITY_COLORS[facility.type];

  return (
    <div
      style={{
        position: 'absolute',
        left: screenPos.x + 20,
        top: screenPos.y - 30,
        background: 'rgba(0, 0, 0, 0.85)',
        color: '#FFFFFF',
        padding: '8px 12px',
        borderRadius: 6,
        fontSize: 12,
        fontFamily: 'system-ui, sans-serif',
        pointerEvents: 'none',
        zIndex: 20,
        borderLeft: `3px solid ${color}`,
        whiteSpace: 'nowrap',
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{facility.name}</div>
      <div style={{ color: '#AAAAAA' }}>类型: {FACILITY_LABELS[facility.type]}</div>
      <div style={{ color: '#AAAAAA' }}>占地面积: {facility.area} m²</div>
    </div>
  );
};

interface TreeInstanceProps {
  trees: TreeData[];
}

const TreeInstances: React.FC<TreeInstanceProps> = ({ trees }) => {
  const crownRef = useRef<THREE.InstancedMesh>(null);
  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const { camera } = useThree();

  useFrame(() => {
    if (!crownRef.current || !trunkRef.current) return;
    trees.forEach((tree, i) => {
      dummy.position.set(
        tree.position[0],
        tree.height + tree.position[1],
        tree.position[2]
      );
      dummy.scale.setScalar(tree.crownRadius * 2);
      const camDir = new THREE.Vector3();
      camera.getWorldDirection(camDir);
      dummy.lookAt(
        dummy.position.x + camDir.x,
        dummy.position.y,
        dummy.position.z + camDir.z
      );
      dummy.updateMatrix();
      crownRef.current!.setMatrixAt(i, dummy.matrix);

      dummy.position.set(tree.position[0], tree.height * 0.35, tree.position[2]);
      dummy.scale.set(tree.crownRadius * 0.3, tree.height * 0.7, tree.crownRadius * 0.3);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      trunkRef.current!.setMatrixAt(i, dummy.matrix);
    });
    crownRef.current.instanceMatrix.needsUpdate = true;
    trunkRef.current.instanceMatrix.needsUpdate = true;
  });

  const crownColor1 = new THREE.Color('#228B22');
  const crownColor2 = new THREE.Color('#32CD32');

  return (
    <group>
      <instancedMesh
        ref={crownRef}
        args={[undefined, undefined, trees.length]}
        castShadow
      >
        <coneGeometry args={[0.5, 1, 6]} />
        <meshStandardMaterial
          color={crownColor1}
          vertexColors={false}
          roughness={0.9}
        />
        <instancedBufferAttribute
          attach="geometry-attributes-color"
          args={[
            new Float32Array(
              trees.flatMap((_, i) => {
                const t = (i % 10) / 10;
                const c = crownColor1.clone().lerp(crownColor2, t);
                return [c.r, c.g, c.b, c.r, c.g, c.b, c.r, c.g, c.b, c.r, c.g, c.b, c.r, c.g, c.b, c.r, c.g, c.b, c.r, c.g, c.b];
              })
            ),
            3,
          ]}
        />
      </instancedMesh>
      <instancedMesh
        ref={trunkRef}
        args={[undefined, undefined, trees.length]}
        castShadow
      >
        <cylinderGeometry args={[0.5, 0.5, 1, 6]} />
        <meshStandardMaterial color="#8B4513" roughness={1} />
      </instancedMesh>
    </group>
  );
};

interface GroundProps {
  onDoubleClick: () => void;
}

const Ground: React.FC<GroundProps> = ({ onDoubleClick }) => {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      receiveShadow
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick();
      }}
    >
      <planeGeometry args={[60, 60, 60, 60]} />
      <meshStandardMaterial color="#4A4A5A" transparent opacity={0.6} roughness={1} />
      <gridHelper args={[60, 60, '#6A6A7A', '#5A5A6A']} />
    </mesh>
  );
};

interface SceneContentProps {
  schemeIndex: number;
  opacity: number;
  onSelectFacility: (facility: PublicFacility | null) => void;
  selectedFacility: PublicFacility | null;
  controlsRef: React.RefObject<any>;
}

const SceneContent: React.FC<SceneContentProps> = ({
  schemeIndex,
  opacity,
  onSelectFacility,
  selectedFacility,
  controlsRef,
}) => {
  const scheme = useMemo(() => getScheme(schemeIndex), [schemeIndex]);
  const trees = useMemo(() => generateVegetation(scheme), [scheme]);

  const keys = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = true;
    };
    const up = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const speed = 0.5;
    const forward = new THREE.Vector3();
    controls.object.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    const offset = new THREE.Vector3();
    if (keys.current['w']) offset.add(forward);
    if (keys.current['s']) offset.sub(forward);
    if (keys.current['d']) offset.add(right);
    if (keys.current['a']) offset.sub(right);
    offset.multiplyScalar(speed);

    if (offset.length() > 0) {
      controls.object.position.add(offset);
      controls.target.add(offset);
      controls.update();
    }
  });

  return (
    <>
      <Sky sunPosition={[100, 20, 100]} turbidity={8} rayleigh={6} mieCoefficient={0.005} mieDirectionalG={0.8} />

      <ambientLight intensity={0.5} />
      <directionalLight
        position={[20, 30, 10]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.001}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />

      <Ground onDoubleClick={() => {}} />

      {scheme.buildings.map((building) => (
        <AnimatedBuilding key={building.id} target={building} opacity={opacity} />
      ))}

      {trees.length > 0 && <TreeInstances trees={trees} />}

      {scheme.facilities.map((facility) => (
        <group
          key={facility.id}
          onClick={(e) => {
            e.stopPropagation();
            onSelectFacility(selectedFacility?.id === facility.id ? null : facility);
          }}
        >
          <FacilityMarker facility={facility} />
        </group>
      ))}

      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        zoomSpeed={0.5}
        minDistance={5}
        maxDistance={80}
        maxPolarAngle={Math.PI / 2.1}
        makeDefault
      />
    </>
  );
};

interface SceneRendererProps {
  schemeIndex: number;
  opacity: number;
  onResetView: () => void;
  resetTrigger: number;
}

const SceneRenderer: React.FC<SceneRendererProps> = ({
  schemeIndex,
  opacity,
  onResetView,
  resetTrigger,
}) => {
  const controlsRef = useRef<any>(null);
  const [selectedFacility, setSelectedFacility] = useState<PublicFacility | null>(null);

  const handleResetView = useCallback(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.object.position.set(...DEFAULT_CAMERA_POS);
    controls.target.set(...DEFAULT_TARGET);
    controls.update();
  }, []);

  useEffect(() => {
    if (resetTrigger > 0) {
      handleResetView();
    }
  }, [resetTrigger, handleResetView]);

  useEffect(() => {
    (window as any).__reset3DView = handleResetView;
    return () => {
      delete (window as any).__reset3DView;
    };
  }, [handleResetView]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        shadows
        camera={{ position: DEFAULT_CAMERA_POS, fov: 50, near: 0.1, far: 1000 }}
        onCreated={({ gl }) => {
          gl.setClearColor('#87CEEB');
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.2;
        }}
        gl={{ antialias: true }}
        style={{
          background: 'linear-gradient(180deg, #87CEEB 0%, #FFFFFF 100%)',
        }}
      >
        <SceneContent
          schemeIndex={schemeIndex}
          opacity={opacity}
          onSelectFacility={setSelectedFacility}
          selectedFacility={selectedFacility}
          controlsRef={controlsRef}
        />
      </Canvas>
      {selectedFacility && <FacilityPopup facility={selectedFacility} />}
    </div>
  );
};

export default SceneRenderer;
