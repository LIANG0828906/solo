import React, { useCallback, useRef, useEffect } from 'react';
import { Canvas, useThree, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store';
import { MechanismType, TriggerType } from '../types';
import { GridFloor } from '../components/GridFloor';
import { MechanismObject } from '../components/Mechanisms';
import { ConnectionCurves } from '../components/ConnectionCurves';
import { PlayerController } from '../components/PlayerController';
import { RunSimulator } from './RunSimulator';
import { playConnectSound } from '../audio';

function PlacementPlane() {
  const meshRef = useRef<THREE.Mesh>(null);
  const placingType = useStore((s) => s.placingType);
  const addProp = useStore((s) => s.addProp);
  const selectProp = useStore((s) => s.selectProp);
  const connectingFromId = useStore((s) => s.connectingFromId);
  const cancelConnecting = useStore((s) => s.cancelConnecting);
  const mode = useStore((s) => s.mode);
  const [hover, setHover] = React.useState<[number, number, number] | null>(null);

  const handlePointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (mode !== 'editor') return;
      e.stopPropagation();
      const point = e.point.clone();

      if (connectingFromId) {
        cancelConnecting();
        return;
      }

      if (!placingType) {
        selectProp(null);
        return;
      }

      const snapped: [number, number, number] = [
        Math.round(point.x),
        0,
        Math.round(point.z),
      ];
      addProp(placingType, snapped);
    },
    [placingType, addProp, selectProp, connectingFromId, cancelConnecting, mode]
  );

  const handlePointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (mode !== 'editor' || !placingType) {
        setHover(null);
        return;
      }
      const p = e.point;
      setHover([Math.round(p.x), 0, Math.round(p.z)]);
    },
    [mode, placingType]
  );

  return (
    <group>
      <mesh
        ref={meshRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.005, 0]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHover(null)}
      >
        <planeGeometry args={[40, 40]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.001}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {mode === 'editor' && placingType && hover && (
        <mesh position={hover} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial color="#3a6ea5" transparent opacity={0.35} />
        </mesh>
      )}
    </group>
  );
}

function ConnectingPreviewLine() {
  const connectingFromId = useStore((s) => s.connectingFromId);
  const props = useStore((s) => s.props);
  const { camera, gl } = useThree();
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const [endPoint, setEndPoint] = React.useState<THREE.Vector3 | null>(null);

  useEffect(() => {
    if (!connectingFromId) return;

    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersectPoint = new THREE.Vector3();

    const onMove = (e: PointerEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      raycasterRef.current.ray.intersectPlane(groundPlane, intersectPoint);
      if (intersectPoint) {
        setEndPoint(intersectPoint.clone());
      }
    };
    gl.domElement.addEventListener('pointermove', onMove);
    return () => gl.domElement.removeEventListener('pointermove', onMove);
  }, [connectingFromId, camera, gl]);

  if (!connectingFromId || !endPoint) return null;
  const source = props.find((p) => p.id === connectingFromId);
  if (!source) return null;

  const s = new THREE.Vector3(source.position[0], source.position[1] + 0.5, source.position[2]);
  const mid = new THREE.Vector3().addVectors(s, endPoint).multiplyScalar(0.5);
  mid.y += 2;
  const curve = new THREE.QuadraticBezierCurve3(s, mid, endPoint);
  const points = curve.getPoints(30);
  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  return (
    <group>
      <line geometry={geometry}>
        <lineBasicMaterial color="#ffcc44" transparent opacity={0.8} />
      </line>
    </group>
  );
}

function SceneContent() {
  const mode = useStore((s) => s.mode);
  const props = useStore((s) => s.props);
  const selectedPropId = useStore((s) => s.selectedPropId);
  const connectingFromId = useStore((s) => s.connectingFromId);
  const finishConnecting = useStore((s) => s.finishConnecting);
  const selectProp = useStore((s) => s.selectProp);
  const placingType = useStore((s) => s.placingType);
  const startConnecting = useStore((s) => s.startConnecting);

  const handleMechanismClick = useCallback(
    (propId: string, e?: ThreeEvent<MouseEvent>) => {
      if (mode !== 'editor') return;
      if (e) e.stopPropagation();

      if (connectingFromId) {
        if (connectingFromId !== propId) {
          finishConnecting(propId, TriggerType.Continuous);
          playConnectSound();
        }
        return;
      }

      if (placingType) return;
      selectProp(propId);
    },
    [mode, connectingFromId, finishConnecting, selectProp, placingType]
  );

  const handleMechanismDoubleClick = useCallback(
    (propId: string, e?: ThreeEvent<MouseEvent>) => {
      if (mode !== 'editor') return;
      if (e) e.stopPropagation();
      startConnecting(propId);
    },
    [mode, startConnecting]
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
      <pointLight position={[5, 6, 5]} intensity={0.2} color="#cc88aa" />

      {mode === 'editor' && (
        <OrbitControls
          makeDefault
          maxPolarAngle={Math.PI / 2.1}
          minDistance={3}
          maxDistance={30}
          enablePan={true}
          enableDamping={true}
          dampingFactor={0.08}
          mouseButtons={{
            LEFT: undefined,
            MIDDLE: undefined as any,
            RIGHT: undefined,
          }}
        />
      )}

      <GridFloor />
      <PlacementPlane />

      {props.map((prop) => (
        <MechanismObject
          key={prop.id}
          prop={prop}
          onClick={(e) => handleMechanismClick(prop.id, e)}
          isSelected={selectedPropId === prop.id}
          isConnectingFrom={connectingFromId === prop.id}
          onDoubleClick={(e) => handleMechanismDoubleClick(prop.id, e)}
        />
      ))}

      <ConnectionCurves />
      {mode === 'editor' && <ConnectingPreviewLine />}

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
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.setClearColor('#0a0a20');
      }}
      frameloop="always"
      dpr={[1, 2]}
    >
      <SceneContent />
    </Canvas>
  );
}
