import React, { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Html, Grid, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from './stores/appStore';
import { moleculeMap } from './data/molecules';
import { MoleculeModel } from './model/MoleculeModel';
import { InteractionController } from './controls/InteractionController';
import UIOverlay from './ui/UIOverlay';
import type { AtomInfo, Measurement } from './types';

const interactionController = new InteractionController();

const glowVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const glowFragmentShader = `
  uniform float uTime;
  uniform vec3 uColor;
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
    float pulse = 0.6 + 0.4 * sin(uTime * 6.2831853 / 0.8);
    gl_FragColor = vec4(uColor, intensity * pulse * 0.8);
  }
`;

function AtomGlow({ position, baseRadius }: { position: [number, number, number]; baseRadius: number }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;
    }
  });

  return (
    <mesh position={position}>
      <sphereGeometry args={[baseRadius * 1.5, 32, 32]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={glowVertexShader}
        fragmentShader={glowFragmentShader}
        uniforms={{
          uTime: { value: 0 },
          uColor: { value: new THREE.Color('#ffdd44') },
        }}
        transparent
        blending={THREE.AdditiveBlending}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}

function MeasurementLines({ measurements }: { measurements: Measurement[] }) {
  return (
    <group>
      {measurements.map((m, i) => {
        const mid: [number, number, number] = [
          (m.atom1.position[0] + m.atom2.position[0]) / 2,
          (m.atom1.position[1] + m.atom2.position[1]) / 2 + 0.3,
          (m.atom1.position[2] + m.atom2.position[2]) / 2,
        ];
        return (
          <group key={i}>
            <Line
              points={[m.atom1.position, m.atom2.position]}
              color="#ffdd44"
              dashed
              dashSize={0.1}
              gapSize={0.1}
              lineWidth={1.5}
            />
            <Html
              position={mid}
              center
              style={{
                color: '#ffffff',
                fontSize: '14px',
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                background: 'rgba(15, 20, 35, 0.85)',
                padding: '3px 10px',
                borderRadius: '6px',
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {m.distance.toFixed(2)} Å
            </Html>
          </group>
        );
      })}
    </group>
  );
}

function MoleculeScene() {
  const {
    currentMolecule,
    selectedAtom,
    displayMode,
    measurements,
    isMeasuring,
    measureFirstAtom,
    setSelectedAtom,
    addMeasurement,
    setMeasureFirstAtom,
  } = useAppStore();

  const groupRef = useRef<THREE.Group>(null);
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();
  const [opacity, setOpacity] = useState(1);
  const [scale, setScale] = useState(1);
  const prevMoleculeRef = useRef(currentMolecule);
  const animRef = useRef<number | null>(null);

  const moleculeData = moleculeMap[currentMolecule];
  const model = useMemo(
    () => new MoleculeModel(moleculeData, displayMode),
    [moleculeData, displayMode]
  );

  const animateTransition = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    setScale(0.6);
    setOpacity(0);

    const start = performance.now();
    const duration = 500;
    const animate = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      setOpacity(t);
      setScale(0.6 + 0.4 * eased);
      if (t < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };
    animRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (prevMoleculeRef.current !== currentMolecule) {
      prevMoleculeRef.current = currentMolecule;
      animateTransition();
    }
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [currentMolecule, animateTransition]);

  useEffect(() => {
    if (!groupRef.current) return;
    groupRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const mat = child.material as THREE.MeshStandardMaterial;
        mat.transparent = true;
        mat.opacity = opacity;
        mat.needsUpdate = true;
      }
    });
  }, [opacity, model]);

  const fitCameraToMolecule = useCallback(() => {
    if (!groupRef.current) return;
    const box = new THREE.Box3().setFromObject(groupRef.current);
    const sphere = new THREE.Sphere();
    box.getBoundingSphere(sphere);

    const fov = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180);
    const dist = Math.max(sphere.radius / Math.sin(fov / 2) * 1.8, 3);

    const startPos = camera.position.clone();
    const endPos = new THREE.Vector3(0, 0, dist);

    const start = performance.now();
    const duration = 1000;

    const animate = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

      camera.position.lerpVectors(startPos, endPos, eased);
      camera.lookAt(0, 0, 0);

      if (controlsRef.current) {
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }

      if (t < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [camera]);

  useEffect(() => {
    const timer = setTimeout(fitCameraToMolecule, 100);
    return () => clearTimeout(timer);
  }, [currentMolecule, fitCameraToMolecule]);

  useEffect(() => {
    const handleReset = () => fitCameraToMolecule();
    window.addEventListener('reset-camera', handleReset);
    return () => window.removeEventListener('reset-camera', handleReset);
  }, [fitCameraToMolecule]);

  const handleAtomClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      const mesh = e.object as THREE.Mesh;
      const atomInfo = mesh.userData.atomInfo as AtomInfo | undefined;
      if (!atomInfo) return;

      if (isMeasuring) {
        if (!measureFirstAtom) {
          setMeasureFirstAtom(atomInfo);
        } else {
          const distance = InteractionController.calculateDistance(measureFirstAtom, atomInfo);
          addMeasurement({ atom1: measureFirstAtom, atom2: atomInfo, distance });
          setMeasureFirstAtom(null);
        }
      } else {
        setSelectedAtom(atomInfo);
      }
    },
    [isMeasuring, measureFirstAtom, addMeasurement, setMeasureFirstAtom, setSelectedAtom]
  );

  const handleMissedClick = useCallback(() => {
    if (!isMeasuring) {
      setSelectedAtom(null);
    }
  }, [isMeasuring, setSelectedAtom]);

  const atomMeshes = model.getAtomMeshes();
  const isSelected = (atom: AtomInfo) =>
    selectedAtom?.symbol === atom.symbol &&
    selectedAtom?.position[0] === atom.position[0] &&
    selectedAtom?.position[1] === atom.position[1] &&
    selectedAtom?.position[2] === atom.position[2];

  const isMeasureFirst = (atom: AtomInfo) =>
    measureFirstAtom?.symbol === atom.symbol &&
    measureFirstAtom?.position[0] === atom.position[0] &&
    measureFirstAtom?.position[1] === atom.position[1] &&
    measureFirstAtom?.position[2] === atom.position[2];

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[5, 5, 5]} intensity={0.9} />
      <directionalLight position={[-4, -2, 3]} intensity={0.35} />
      <directionalLight position={[0, 4, -2]} intensity={0.25} />

      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.8}
        zoomSpeed={1.1}
        panSpeed={0.7}
      />

      <Grid
        args={[30, 30]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#3a4560"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#5a6888"
        fadeDistance={25}
        fadeStrength={1}
        infiniteGrid
        position={[0, -2.5, 0]}
      />

      <group ref={groupRef} onClick={handleMissedClick} scale={[scale, scale, scale]}>
        {atomMeshes.map((mesh, i) => {
          const atom = moleculeData.atoms[i];
          if (!atom) return null;
          const selected = isSelected(atom);
          const isMFirst = isMeasureFirst(atom);
          const isSpaceFilling = displayMode === 'space-filling';
          const radius = isSpaceFilling ? atom.radius * 2 : 0.3;
          const atomScale = selected ? 1.2 : isMFirst ? 1.1 : 1;

          return (
            <mesh
              key={`${currentMolecule}-${i}`}
              position={mesh.position.clone()}
              scale={[atomScale, atomScale, atomScale]}
              onClick={handleAtomClick}
            >
              <sphereGeometry args={[radius, 32, 32]} />
              <meshStandardMaterial
                color={atom.color}
                roughness={0.25}
                metalness={0.15}
                transparent
                opacity={opacity}
              />
            </mesh>
          );
        })}

        {displayMode === 'ball-stick' &&
          moleculeData.bonds.map((bond, i) => {
            const a1 = moleculeData.atoms[bond.atom1];
            const a2 = moleculeData.atoms[bond.atom2];
            const start = new THREE.Vector3(...a1.position);
            const end = new THREE.Vector3(...a2.position);
            const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
            const direction = new THREE.Vector3().subVectors(end, start);
            const length = direction.length();

            const offsets = bond.order === 2 ? [-0.1, 0.1] : bond.order === 3 ? [-0.15, 0, 0.15] : [0];

            return offsets.map((offset, oi) => {
              const pos = mid.clone();
              if (bond.order > 1 && offset !== 0) {
                const perp = new THREE.Vector3();
                perp.crossVectors(direction, new THREE.Vector3(0, 1, 0)).normalize();
                if (perp.length() < 0.01) {
                  perp.crossVectors(direction, new THREE.Vector3(1, 0, 0)).normalize();
                }
                pos.add(perp.multiplyScalar(offset));
              }

              const quaternion = new THREE.Quaternion();
              const up = new THREE.Vector3(0, 1, 0);
              quaternion.setFromUnitVectors(up, direction.clone().normalize());

              return (
                <mesh key={`bond-${i}-${oi}`} position={pos} quaternion={quaternion}>
                  <cylinderGeometry args={[0.08, 0.08, length, 8]} />
                  <meshStandardMaterial
                    color="#cfd4dc"
                    roughness={0.45}
                    metalness={0.1}
                    transparent
                    opacity={opacity}
                  />
                </mesh>
              );
            });
          })}
      </group>

      {selectedAtom && (
        <AtomGlow
          position={selectedAtom.position}
          baseRadius={displayMode === 'space-filling' ? selectedAtom.radius * 2 : 0.3}
        />
      )}

      {measureFirstAtom && (
        <AtomGlow
          position={measureFirstAtom.position}
          baseRadius={displayMode === 'space-filling' ? measureFirstAtom.radius * 2 : 0.3}
        />
      )}

      <MeasurementLines measurements={measurements} />
    </>
  );
}

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color('#0d1222'));
        }}
      >
        <MoleculeScene />
      </Canvas>
      <UIOverlay />
    </div>
  );
}
