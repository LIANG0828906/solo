import { useRef, useEffect, useMemo, useState, cloneElement, Children } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useSpring, animated, useTransition } from '@react-spring/three';
import { useMoleculeStore } from '@/store';
import moleculesData from '@/data/molecules.json';
import { renderAtoms, Molecule } from '@/utils/renderAtoms.tsx';
import * as THREE from 'three';

const AUTO_ROTATE_SPEED_RAD_PER_SEC = 0.005;

interface MoleculeGroupProps {
  moleculeId: string;
}

function MoleculeGroup({ moleculeId }: MoleculeGroupProps) {
  const { showLabels, cameraDistance } = useMoleculeStore();

  const currentMolecule = useMemo(() => {
    return moleculesData.molecules.find(
      (mol: Molecule) => mol.id === moleculeId
    );
  }, [moleculeId]);

  if (!currentMolecule) {
    return null;
  }

  const { atoms, bonds, labels } = renderAtoms(
    currentMolecule,
    showLabels,
    cameraDistance
  );

  return (
    <group>
      {bonds}
      {atoms}
      {labels}
    </group>
  );
}

interface OpacityGroupProps {
  opacity: number;
  children: React.ReactNode;
}

function OpacityGroup({ opacity, children }: OpacityGroupProps) {
  const ref = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!ref.current) return;
    ref.current.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.material) {
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
        materials.forEach((mat) => {
          mat.transparent = true;
          mat.opacity = opacity;
          mat.needsUpdate = true;
        });
      }
    });
  });

  return <group ref={ref}>{children}</group>;
}

function CameraController() {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const lastRotationYRef = useRef<number | null>(null);
  const lastRotationXRef = useRef<number | null>(null);
  const lastDistanceRef = useRef<number | null>(null);
  const isUpdatingFromStoreRef = useRef(false);
  const {
    cameraDistance,
    rotationY,
    rotationX,
    autoRotate,
    setRotationY,
    setRotationX,
    setCameraDistance,
  } = useMoleculeStore();

  const updateCameraPosition = () => {
    isUpdatingFromStoreRef.current = true;
    const theta = (rotationY * Math.PI) / 180;
    const phi = ((rotationX + 90) * Math.PI) / 180;
    const x = cameraDistance * Math.sin(phi) * Math.sin(theta);
    const y = cameraDistance * Math.cos(phi);
    const z = cameraDistance * Math.sin(phi) * Math.cos(theta);
    camera.position.set(x, y, z);
    camera.lookAt(0, 0, 0);
    setTimeout(() => {
      isUpdatingFromStoreRef.current = false;
    }, 50);
  };

  useEffect(() => {
    updateCameraPosition();
  }, [cameraDistance, rotationY, rotationX]);

  useFrame((_, delta) => {
    if (autoRotate && controlsRef.current) {
      const radius = Math.sqrt(
        camera.position.x ** 2 + camera.position.y ** 2 + camera.position.z ** 2
      );
      const currentTheta = Math.atan2(camera.position.x, camera.position.z);
      const newTheta = currentTheta + AUTO_ROTATE_SPEED_RAD_PER_SEC * delta;
      const phi = Math.acos(camera.position.y / radius);
      camera.position.x = radius * Math.sin(phi) * Math.sin(newTheta);
      camera.position.z = radius * Math.sin(phi) * Math.cos(newTheta);
      camera.lookAt(0, 0, 0);
    }

    if (controlsRef.current && !isUpdatingFromStoreRef.current && !autoRotate) {
      const spherical = new THREE.Spherical();
      spherical.setFromVector3(camera.position);
      const newRotationY = ((spherical.theta * 180) / Math.PI + 360) % 360;
      const newRotationX = (spherical.phi * 180) / Math.PI - 90;
      const newDistance = spherical.radius;

      if (
        lastRotationYRef.current === null ||
        Math.abs(newRotationY - lastRotationYRef.current) > 0.3
      ) {
        lastRotationYRef.current = newRotationY;
        setRotationY(newRotationY);
      }
      if (
        lastRotationXRef.current === null ||
        Math.abs(newRotationX - lastRotationXRef.current) > 0.3
      ) {
        lastRotationXRef.current = newRotationX;
        setRotationX(newRotationX);
      }
      if (
        lastDistanceRef.current === null ||
        Math.abs(newDistance - lastDistanceRef.current) > 0.05
      ) {
        lastDistanceRef.current = newDistance;
        setCameraDistance(newDistance);
      }
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault fov={50} position={[0, 0, cameraDistance]} />
      <OrbitControls
        ref={controlsRef}
        enableRotate
        enablePan
        enableZoom
        autoRotate={false}
        minDistance={5}
        maxDistance={20}
        target={[0, 0, 0]}
        enableDamping
        dampingFactor={0.05}
      />
    </>
  );
}

function SceneContent() {
  const { currentMoleculeId } = useMoleculeStore();

  const transitions = useTransition(currentMoleculeId, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
    config: { duration: 600 },
    keys: (item: string) => item,
  });

  return (
    <>
      <color attach="background" args={['#1a1a2e']} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <directionalLight position={[-5, -5, -5]} intensity={0.3} />

      <CameraController />

      {transitions((style, item) => (
        <OpacityGroup opacity={style.opacity.get()}>
          <animated.group>
            <MoleculeGroup moleculeId={item} />
          </animated.group>
        </OpacityGroup>
      ))}
    </>
  );
}

export default function MoleculeViewer() {
  return (
    <Canvas style={{ width: '100%', height: '100%', display: 'block' }}>
      <SceneContent />
    </Canvas>
  );
}
