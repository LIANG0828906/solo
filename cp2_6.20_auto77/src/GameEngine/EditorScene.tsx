import React, { useCallback, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store';
import { MechanismType, TriggerType } from '../types';
import { GridFloor } from '../components/GridFloor';
import { MechanismObject } from '../components/Mechanisms';
import { ConnectionCurves } from '../components/ConnectionCurves';
import { PlayerController } from '../components/PlayerController';
import { RunSimulator } from './RunSimulator';

function GroundPlane() {
  const placingType = useStore((s) => s.placingType);
  const addProp = useStore((s) => s.addProp);
  const selectProp = useStore((s) => s.selectProp);
  const connectingFromId = useStore((s) => s.connectingFromId);
  const cancelConnecting = useStore((s) => s.cancelConnecting);
  const mode = useStore((s) => s.mode);

  const handleClick = useCallback(
    (e: any) => {
      if (mode !== 'editor') return;
      e.stopPropagation();

      if (connectingFromId) {
        cancelConnecting();
        return;
      }

      if (!placingType) {
        selectProp(null);
        return;
      }

      const point = e.point as THREE.Vector3;
      const snapped: [number, number, number] = [
        Math.round(point.x),
        0,
        Math.round(point.z),
      ];
      addProp(placingType, snapped);
    },
    [placingType, addProp, selectProp, connectingFromId, cancelConnecting, mode]
  );

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} onClick={handleClick}>
      <planeGeometry args={[40, 40]} />
      <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} />
    </mesh>
  );
}

function SceneContent() {
  const mode = useStore((s) => s.mode);
  const props = useStore((s) => s.props);
  const selectedPropId = useStore((s) => s.selectedPropId);
  const connectingFromId = useStore((s) => s.connectingFromId);
  const startConnecting = useStore((s) => s.startConnecting);
  const finishConnecting = useStore((s) => s.finishConnecting);
  const selectProp = useStore((s) => s.selectProp);
  const placingType = useStore((s) => s.placingType);

  const handleMechanismClick = useCallback(
    (propId: string) => {
      if (mode !== 'editor') return;

      if (connectingFromId) {
        if (connectingFromId !== propId) {
          finishConnecting(propId, TriggerType.Continuous);
        }
        return;
      }

      if (placingType) return;

      selectProp(propId);
    },
    [mode, connectingFromId, finishConnecting, selectProp, placingType]
  );

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 15, 10]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[-5, 8, -5]} intensity={0.3} color="#6688cc" />

      {mode === 'editor' && (
        <OrbitControls
          makeDefault
          maxPolarAngle={Math.PI / 2.1}
          minDistance={3}
          maxDistance={30}
        />
      )}

      <GridFloor />
      <GroundPlane />

      {props.map((prop) => (
        <MechanismObject
          key={prop.id}
          prop={prop}
          onClick={() => handleMechanismClick(prop.id)}
          isSelected={selectedPropId === prop.id}
          isConnectingFrom={connectingFromId === prop.id}
        />
      ))}

      <ConnectionCurves />

      {mode === 'run' && <PlayerController />}
      {mode === 'run' && <RunSimulator />}

      <fog attach="fog" args={['#0a0a20', 15, 35]} />
    </>
  );
}

export function EditorScene() {
  return (
    <Canvas
      camera={{ position: [10, 10, 10], fov: 50 }}
      shadows
      style={{ width: '100%', height: '100%' }}
      gl={{ antialias: true, alpha: false }}
      onCreated={({ gl }) => {
        gl.setClearColor('#0a0a20');
      }}
    >
      <SceneContent />
    </Canvas>
  );
}
