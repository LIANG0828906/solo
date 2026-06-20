import { useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useMoleculeStore } from '../store';
import { Atom3D } from './Atom3D';
import { Bond3D } from './Bond3D';

function CameraController() {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const cameraResetKey = useMoleculeStore((s) => s.cameraResetKey);

  useEffect(() => {
    const initialCam = camera as THREE.PerspectiveCamera;
    initialCam.position.set(0, 0, 5);
    initialCam.fov = 50;
    initialCam.lookAt(0, 0, 0);
    initialCam.updateProjectionMatrix();
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [cameraResetKey, camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.8}
      zoomSpeed={0.8}
      panSpeed={0.8}
      minDistance={2}
      maxDistance={20}
      makeDefault
    />
  );
}

function SceneContent() {
  const atoms = useMoleculeStore((s) => s.atoms);
  const bonds = useMoleculeStore((s) => s.bonds);

  return (
    <>
      <ambientLight intensity={0.45} color="#FFFFFF" />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.1}
        color="#FFFFFF"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-5, -3, -5]} intensity={0.35} color="#88AADD" />
      <pointLight position={[0, 3, 0]} intensity={0.4} color="#00D2FF" />

      {bonds.map((bond) => (
        <Bond3D key={bond.id} bond={bond} />
      ))}

      {atoms.map((atom, index) => (
        <Atom3D key={atom.id} atom={atom} index={index} />
      ))}

      <Grid
        position={[0, -2.5, 0]}
        args={[30, 30]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#E0E0E0"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#6EC6FF"
        fadeDistance={25}
        fadeStrength={1.5}
        followCamera={false}
        infiniteGrid
      />

      <Stars
        radius={50}
        depth={30}
        count={1500}
        factor={3}
        saturation={0}
        fade
        speed={0.3}
      />

      <EffectComposer>
        <Bloom
          intensity={0.4}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

export function Molecule() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 50 }}
      shadows
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
        background: 'linear-gradient(180deg, #0B0C10 0%, #1F2833 100%)',
      }}
      onPointerMissed={() => {
        useMoleculeStore.getState().setSelectedAtom(null);
      }}
    >
      <fog attach="fog" args={['#0B0C10', 8, 25]} />
      <CameraController />
      <SceneContent />
    </Canvas>
  );
}
