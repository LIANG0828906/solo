import { useRef, useCallback } from 'react';
import { Canvas, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, SMAA } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useSceneStore } from '@/store/sceneStore';
import type { Vec3 } from '@/types';
import CellMembrane from '@/components/cell/CellMembrane';
import Nucleus from '@/components/cell/Nucleus';
import Mitochondria from '@/components/cell/Mitochondria';
import EndoplasmicReticulum from '@/components/cell/EndoplasmicReticulum';
import AxisIndicator from '@/components/cell/AxisIndicator';
import Marker from '@/components/transport/Marker';
import PathCurve from '@/components/transport/PathCurve';
import Vesicle from '@/components/transport/Vesicle';

function SceneClickHandler() {
  const { camera, raycaster, pointer } = useThree();
  const membraneRef = useRef<THREE.Mesh>(null);
  const pendingStartPoint = useSceneStore((s) => s.pendingStartPoint);
  const setPendingStartPoint = useSceneStore((s) => s.setPendingStartPoint);
  const addPath = useSceneStore((s) => s.addPath);

  const handleClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation();

      raycaster.setFromCamera(pointer, camera);

      if (!pendingStartPoint) {
        const sphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 4.8);
        const intersectPoint = new THREE.Vector3();
        const hasIntersect = raycaster.ray.intersectSphere(sphere, intersectPoint);

        if (hasIntersect) {
          const point: Vec3 = [
            parseFloat(intersectPoint.x.toFixed(3)),
            parseFloat(intersectPoint.y.toFixed(3)),
            parseFloat(intersectPoint.z.toFixed(3)),
          ];
          setPendingStartPoint(point);
        }
      } else {
        const nucleusSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1.8);
        const intersectPoint = new THREE.Vector3();
        const hasIntersect = raycaster.ray.intersectSphere(nucleusSphere, intersectPoint);

        let endPoint: Vec3;
        if (hasIntersect) {
          endPoint = [
            parseFloat(intersectPoint.x.toFixed(3)),
            parseFloat(intersectPoint.y.toFixed(3)),
            parseFloat(intersectPoint.z.toFixed(3)),
          ];
        } else {
          const direction = new THREE.Vector3();
          raycaster.ray.direction.normalize();
          const center = new THREE.Vector3(0, 0, 0);
          const toCenter = new THREE.Vector3().subVectors(center, raycaster.ray.origin);
          const t = toCenter.dot(direction);
          const closest = raycaster.ray.origin.clone().add(direction.multiplyScalar(t));
          const finalPoint = closest.clampLength(0.5, 1.5);
          endPoint = [
            parseFloat(finalPoint.x.toFixed(3)),
            parseFloat(finalPoint.y.toFixed(3)),
            parseFloat(finalPoint.z.toFixed(3)),
          ];
        }
        addPath(pendingStartPoint, endPoint);
      }
    },
    [pointer, camera, raycaster, pendingStartPoint, setPendingStartPoint, addPath]
  );

  return (
    <mesh ref={membraneRef} onClick={handleClick}>
      <sphereGeometry args={[5, 32, 32]} />
      <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} />
    </mesh>
  );
}

function SceneContent() {
  const organelles = useSceneStore((s) => s.organelles);
  const paths = useSceneStore((s) => s.paths);
  const pendingStartPoint = useSceneStore((s) => s.pendingStartPoint);
  const params = useSceneStore((s) => s.params);
  const isPlaying = useSceneStore((s) => s.isPlaying);
  const progress = useSceneStore((s) => s.progress);
  const activePathId = useSceneStore((s) => s.activePathId);

  const vis = params.visibility;

  const renderOrganelle = (organelle: typeof organelles[0]) => {
    const pos = organelle.position;
    const showType =
      (organelle.type === 'nucleus' && vis.nucleus) ||
      (organelle.type === 'mitochondria' && vis.mitochondria) ||
      (organelle.type === 'er' && vis.er);
    if (!showType && !vis.axisIndicator) return null;
    return (
      <group key={organelle.id}>
        {showType && organelle.type === 'nucleus' && (
          <Nucleus position={pos} scale={organelle.scale} color={organelle.color} />
        )}
        {showType && organelle.type === 'mitochondria' && (
          <Mitochondria position={pos} scale={organelle.scale} color={organelle.color} />
        )}
        {showType && organelle.type === 'er' && (
          <EndoplasmicReticulum position={pos} scale={organelle.scale} color={organelle.color} />
        )}
        {vis.axisIndicator && (
          <AxisIndicator position={pos} scale={0.8} showLabels={false} />
        )}
      </group>
    );
  };

  return (
    <>
      <ambientLight intensity={params.ambientLightIntensity} />
      <directionalLight position={[8, 8, 5]} intensity={1.2} color="#ffffff" />
      <directionalLight position={[-5, -3, -2]} intensity={0.5} color="#7c9dff" />
      <directionalLight position={[0, 0, -8]} intensity={0.4} color="#c084fc" />

      <Stars radius={50} depth={30} count={800} factor={2} fade speed={0.3} />

      <SceneClickHandler />

      {vis.membrane && <CellMembrane opacity={params.membraneOpacity} />}

      {organelles.map(renderOrganelle)}

      {pendingStartPoint && <Marker position={pendingStartPoint} type="start" />}

      {paths.map((path) => (
        <group key={path.id}>
          <Marker position={path.startPoint} type="start" />
          <Marker position={path.endPoint} type="end" />
          <PathCurve
            start={path.startPoint}
            end={path.endPoint}
            controlPoints={path.controlPoints}
          />
        </group>
      ))}

      {activePathId &&
        paths
          .filter((p) => p.id === activePathId)
          .map((path) => (
            <Vesicle
              key={path.id}
              pathData={path}
              progress={progress}
              isPlaying={isPlaying}
              trailLength={params.trailLength}
            />
          ))}

      <EffectComposer multisampling={0}>
        <Bloom
          intensity={0.4}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
        <SMAA />
      </EffectComposer>
    </>
  );
}

export default function Scene() {
  return (
    <Canvas
      camera={{ position: [0, 4, 14], fov: 55, near: 0.1, far: 200 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      <color attach="background" args={[0]} />
      <fog attach="fog" args={['#0a0a2a', 20, 50]} />
      <SceneContent />
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={8}
        maxDistance={30}
        enablePan
      />
    </Canvas>
  );
}
