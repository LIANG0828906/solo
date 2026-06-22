import { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Grid, TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { useSceneStore } from '../store/sceneStore';
import { ExhibitMesh } from './ExhibitMesh';
import { LightingSystem } from './LightingSystem';
import { CameraController } from './CameraController';
import { TransformToolbar } from './TransformToolbar';
import { EXHIBIT_SIZE } from '../utils/exhibitPresets';

function HighlightOutline() {
  const selectedId = useSceneStore((state) => state.selectedId);
  const exhibits = useSceneStore((state) => state.exhibits);
  const outlineRef = useRef<THREE.LineSegments>(null);
  const fillRef = useRef<THREE.Mesh>(null);

  const selectedExhibit = exhibits.find((e) => e.id === selectedId);

  useFrame((state) => {
    if (selectedExhibit && outlineRef.current && fillRef.current) {
      const pulse = (Math.sin(state.clock.elapsedTime * 4) + 1) / 2;
      const color = new THREE.Color().setHSL(0.44, 1, 0.4 + pulse * 0.2);
      (outlineRef.current.material as THREE.LineBasicMaterial).color.copy(color);
      (fillRef.current.material as THREE.MeshBasicMaterial).opacity = 0.04 + pulse * 0.04;
    }
  });

  if (!selectedExhibit) return null;

  const size = EXHIBIT_SIZE[selectedExhibit.type];
  const transform = selectedExhibit.transform;

  return (
    <group
      position={[
        transform.position.x,
        transform.position.y,
        transform.position.z,
      ]}
      rotation={[
        transform.rotation.x,
        transform.rotation.y,
        transform.rotation.z,
      ]}
      scale={transform.scale}
    >
      <lineSegments ref={outlineRef}>
        <boxGeometry args={[size.width * 1.15, size.height * 1.15, size.depth * 1.15]} />
        <lineBasicMaterial color="#00ffaa" linewidth={2} transparent opacity={0.9} />
      </lineSegments>
      <mesh ref={fillRef}>
        <boxGeometry args={[size.width * 1.12, size.height * 1.12, size.depth * 1.12]} />
        <meshBasicMaterial
          color="#00ffaa"
          transparent
          opacity={0.06}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function ExhibitTransformControls({
  exhibitRefs,
}: {
  exhibitRefs: React.MutableRefObject<Map<string, THREE.Group>>;
}) {
  const selectedId = useSceneStore((state) => state.selectedId);
  const transformMode = useSceneStore((state) => state.transformMode);
  const updateTransform = useSceneStore((state) => state.updateTransform);
  const controlsRef = useRef<any>(null);
  const [targetObject, setTargetObject] = useState<THREE.Object3D | null>(null);

  useEffect(() => {
    if (selectedId && exhibitRefs.current.has(selectedId)) {
      const obj = exhibitRefs.current.get(selectedId);
      setTargetObject(obj || null);
    } else {
      setTargetObject(null);
    }
  }, [selectedId, exhibitRefs]);

  const handleObjectChange = () => {
    if (!selectedId || !targetObject) return;

    const obj = targetObject;
    const clampedPos = {
      x: Math.max(-8, Math.min(8, obj.position.x)),
      y: Math.max(0, Math.min(6, obj.position.y)),
      z: Math.max(-8, Math.min(8, obj.position.z)),
    };

    if (
      clampedPos.x !== obj.position.x ||
      clampedPos.y !== obj.position.y ||
      clampedPos.z !== obj.position.z
    ) {
      obj.position.set(clampedPos.x, clampedPos.y, clampedPos.z);
    }

    const clampedScale = Math.max(0.5, Math.min(2.0, obj.scale.x));
    if (Math.abs(obj.scale.x - obj.scale.y) > 0.001 || Math.abs(obj.scale.y - obj.scale.z) > 0.001) {
      obj.scale.set(clampedScale, clampedScale, clampedScale);
    }

    updateTransform(selectedId, {
      position: {
        x: obj.position.x,
        y: obj.position.y,
        z: obj.position.z,
      },
      rotation: {
        x: obj.rotation.x,
        y: obj.rotation.y,
        z: obj.rotation.z,
      },
      scale: clampedScale,
    });
  };

  if (!targetObject) return null;

  const modeMap: Record<string, 'translate' | 'rotate' | 'scale'> = {
    translate: 'translate',
    rotate: 'rotate',
    scale: 'scale',
  };

  return (
    <TransformControls
      ref={controlsRef}
      object={targetObject}
      mode={modeMap[transformMode]}
      onObjectChange={handleObjectChange}
      size={0.8}
      showX
      showY
      showZ
    />
  );
}

function SceneContent({
  exhibitRefs,
}: {
  exhibitRefs: React.MutableRefObject<Map<string, THREE.Group>>;
}) {
  const exhibits = useSceneStore((state) => state.exhibits);

  return (
    <>
      <CameraController />
      <LightingSystem />

      <Grid
        position={[0, -0.01, 0]}
        args={[20, 20]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#1a1a2e"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#2a2a4e"
        fadeDistance={30}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#0d0d18" />
      </mesh>

      {exhibits.map((exhibit) => (
        <ExhibitMesh
          key={exhibit.id}
          exhibit={exhibit}
          ref={(node) => {
            if (node) {
              exhibitRefs.current.set(exhibit.id, node);
            }
          }}
        />
      ))}

      <HighlightOutline />
      <ExhibitTransformControls exhibitRefs={exhibitRefs} />
    </>
  );
}

export function SceneViewer() {
  const selectExhibit = useSceneStore((state) => state.selectExhibit);
  const exhibitRefs = useRef<Map<string, THREE.Group>>(new Map());

  const handlePointerMissed = () => {
    selectExhibit(null);
  };

  return (
    <div className="scene-viewer-wrapper">
      <TransformToolbar />
      <div className="scene-viewer">
        <Canvas
          camera={{ position: [0, 3, 10], fov: 60 }}
          shadows
          gl={{ antialias: true, toneMapping: 1 }}
          onPointerMissed={handlePointerMissed}
        >
          <color attach="background" args={['#0a0a14']} />
          <fog attach="fog" args={['#0a0a14', 15, 30]} />
          <SceneContent exhibitRefs={exhibitRefs} />
        </Canvas>
      </div>
    </div>
  );
}
