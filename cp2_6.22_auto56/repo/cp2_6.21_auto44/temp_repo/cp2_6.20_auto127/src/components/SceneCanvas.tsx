import { useRef, useEffect, useState } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, TransformControls as DreiTransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { useSceneStore } from '../store/sceneStore';
import GeometryItem from './GeometryItem';
import type { GeometryItemData } from '../types';

function Lights() {
  const { lighting } = useSceneStore();
  return (
    <>
      <ambientLight intensity={lighting.ambientIntensity} />
      <pointLight
        position={[lighting.pointLightPosition.x, lighting.pointLightPosition.y, lighting.pointLightPosition.z]}
        intensity={lighting.pointLightIntensity}
        castShadow
      />
    </>
  );
}

function SceneGrid() {
  return (
    <>
      <Grid
        position={[0, -0.01, 0]}
        args={[20, 20]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#3a3a5e"
        sectionSize={2}
        sectionThickness={1}
        sectionColor="#5a5a8e"
        fadeDistance={30}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid
      />
    </>
  );
}

function SceneBackground() {
  return <color attach="background" args={['#1a1a2e']} />;
}

interface GeometryWrapperProps {
  data: GeometryItemData;
  isSelected: boolean;
  useLod: boolean;
}

function GeometryWrapper({ data, isSelected, useLod }: GeometryWrapperProps) {
  const [dist, setDist] = useState(0);
  const { camera } = useThree();
  const ref = useRef<THREE.Group>(null);

  useFrame(() => {
    if (ref.current && useLod) {
      const d = ref.current.position.distanceTo(camera.position);
      setDist(d);
    }
  });

  const showFull = isSelected || !useLod || dist < 15;
  const showSimple = useLod && !isSelected && dist >= 15 && dist < 25;
  const showMinimal = useLod && !isSelected && dist >= 25;

  return (
    <group ref={ref}>
      {showFull && <GeometryItem data={data} isSelected={isSelected} />}
      {showSimple && (
        <group>
          <mesh>
            <boxGeometry args={[data.scale.x * 0.8, data.scale.y * 0.8, data.scale.z * 0.8]} />
            <meshStandardMaterial
              color={data.material.color}
              roughness={data.material.roughness}
              metalness={data.material.metalness}
            />
          </mesh>
        </group>
      )}
      {showMinimal && (
        <mesh>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshBasicMaterial color={data.material.color} transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  );
}

function TransformManager() {
  const { selectedId, geometries, transformMode, updateGeometry } = useSceneStore();
  const selected = geometries.find((g) => g.id === selectedId);
  const transformRef = useRef<any>(null);
  const orbitRef = useRef<any>(null);
  const objectRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (transformRef.current && objectRef.current) {
      transformRef.current.attach(objectRef.current);
    }
  }, [selectedId]);

  useEffect(() => {
    if (!transformRef.current) return;

    const controls = transformRef.current;

    const onDraggingChange = () => {
      if (orbitRef.current) {
        orbitRef.current.enabled = !controls.dragging;
      }
    };

    const onObjectChange = () => {
      if (!selected || !controls.object) return;

      if (transformMode === 'translate') {
        updateGeometry(selected.id, {
          position: {
            x: controls.object.position.x,
            y: controls.object.position.y,
            z: controls.object.position.z
          }
        });
      } else if (transformMode === 'rotate') {
        updateGeometry(selected.id, {
          rotation: {
            x: THREE.MathUtils.radToDeg(controls.object.rotation.x),
            y: THREE.MathUtils.radToDeg(controls.object.rotation.y),
            z: THREE.MathUtils.radToDeg(controls.object.rotation.z)
          }
        });
      } else if (transformMode === 'scale') {
        updateGeometry(selected.id, {
          scale: {
            x: Math.max(0.1, controls.object.scale.x),
            y: Math.max(0.1, controls.object.scale.y),
            z: Math.max(0.1, controls.object.scale.z)
          }
        });
      }
    };

    controls.addEventListener('dragging-changed', onDraggingChange);
    controls.addEventListener('objectChange', onObjectChange);

    return () => {
      controls.removeEventListener('dragging-changed', onDraggingChange);
      controls.removeEventListener('objectChange', onObjectChange);
    };
  }, [selected, transformMode, updateGeometry]);

  if (!selected) {
    return <OrbitControls ref={orbitRef} makeDefault />;
  }

  return (
    <>
      <group
        ref={objectRef}
        position={[selected.position.x, selected.position.y, selected.position.z]}
        rotation={[
          THREE.MathUtils.degToRad(selected.rotation.x),
          THREE.MathUtils.degToRad(selected.rotation.y),
          THREE.MathUtils.degToRad(selected.rotation.z)
        ]}
        scale={[selected.scale.x, selected.scale.y, selected.scale.z]}
      />
      <DreiTransformControls
        ref={transformRef}
        mode={transformMode}
      />
      <OrbitControls ref={orbitRef} makeDefault />
    </>
  );
}

function Geometries() {
  const { geometries, selectedId } = useSceneStore();
  const useLod = geometries.length > 30;

  return (
    <>
      {geometries.map((geo) => (
        <GeometryWrapper
          key={geo.id}
          data={geo}
          isSelected={geo.id === selectedId}
          useLod={useLod}
        />
      ))}
    </>
  );
}

function EmptyClickHandler() {
  const { selectGeometry } = useSceneStore();

  return (
    <mesh
      position={[0, 0, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      onClick={(e) => {
        e.stopPropagation();
        selectGeometry(null);
      }}
    >
      <planeGeometry args={[100, 100]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
}

function SceneCanvas() {
  return (
    <Canvas
      shadows
      camera={{ position: [5, 5, 5], fov: 50 }}
      gl={{ antialias: true, alpha: false }}
      onCreated={({ gl }) => {
        gl.setClearColor('#1a1a2e');
      }}
    >
      <SceneBackground />
      <Lights />
      <SceneGrid />
      <Geometries />
      <EmptyClickHandler />
      <TransformManager />
    </Canvas>
  );
}

export default SceneCanvas;
