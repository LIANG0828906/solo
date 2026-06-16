import { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useBouquetStore } from '@/modules/store/useBouquetStore';
import { FLOWERS, WRAPPING_OPTIONS, RIBBON_OPTIONS } from '@/data/flowers';
import {
  createFlowerMesh,
  createWrappingMesh,
  createRibbonMesh,
  createBaseMesh,
} from './SceneSetup';

function BouquetScene() {
  const groupRef = useRef<THREE.Group>(null);
  const selectedFlowers = useBouquetStore((s) => s.selectedFlowers);
  const wrappingStyle = useBouquetStore((s) => s.wrappingStyle);
  const ribbonColor = useBouquetStore((s) => s.ribbonColor);

  const wrappingOpt = WRAPPING_OPTIONS.find((w) => w.id === wrappingStyle)!;
  const ribbonOpt = RIBBON_OPTIONS.find((r) => r.id === ribbonColor)!;

  const flowerInstances = useMemo(() => {
    const instances: { flowerId: string; angle: number; radius: number; yOffset: number }[] = [];
    let totalStems = 0;
    selectedFlowers.forEach((sf) => { totalStems += sf.quantity; });

    let idx = 0;
    selectedFlowers.forEach((sf) => {
      const flower = FLOWERS.find((f) => f.id === sf.flowerId);
      if (!flower) return;
      for (let i = 0; i < sf.quantity; i++) {
        const t = idx / Math.max(totalStems, 1);
        const spiralAngle = t * Math.PI * 4;
        const radius = 0.05 + t * 0.25;
        const yOffset = t * 0.3;
        instances.push({ flowerId: sf.flowerId, angle: spiralAngle, radius, yOffset });
        idx++;
      }
    });
    return instances;
  }, [selectedFlowers]);

  const wrappingMesh = useMemo(
    () => createWrappingMesh(wrappingOpt.color, wrappingOpt.secondaryColor),
    [wrappingOpt.color, wrappingOpt.secondaryColor]
  );

  const ribbonMesh = useMemo(
    () => createRibbonMesh(ribbonOpt.color),
    [ribbonOpt.color]
  );

  const baseMesh = useMemo(() => createBaseMesh(), []);

  const flowerMeshes = useMemo(() => {
    return flowerInstances.map((inst) => {
      const flower = FLOWERS.find((f) => f.id === inst.flowerId)!;
      const mesh = createFlowerMesh(flower.petalColor, flower.centerColor, flower.stemColor, flower.id);
      mesh.position.set(
        Math.cos(inst.angle) * inst.radius,
        inst.yOffset + 0.3,
        Math.sin(inst.angle) * inst.radius
      );
      mesh.rotation.y = inst.angle;
      const scale = 0.7 + Math.random() * 0.3;
      mesh.scale.setScalar(scale);
      return mesh;
    });
  }, [flowerInstances]);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={baseMesh} />
      <primitive object={wrappingMesh} />
      <primitive object={ribbonMesh} />
      {flowerMeshes.map((mesh, i) => (
        <primitive key={i} object={mesh} />
      ))}
    </group>
  );
}

function CameraController() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 1.2, 2.2);
    camera.lookAt(0, 0, 0);
  }, [camera]);
  return null;
}

function ZoomTracker({ onZoomChange }: { onZoomChange: (zoom: string) => void }) {
  const controlsRef = useRef<any>(null);

  useFrame(() => {
    if (controlsRef.current) {
      const dist = controlsRef.current.getDistance();
      const zoom = (2.5 / dist).toFixed(1);
      onZoomChange(zoom);
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      minDistance={1.0}
      maxDistance={5.0}
      enablePan
      panSpeed={0.8}
      rotateSpeed={0.8}
      zoomSpeed={1.0}
      target={[0, 0, 0] as unknown as THREE.Vector3}
    />
  );
}

export default function FlowerBouquet() {
  const [zoomLevel, setZoomLevel] = useState('1.0');
  const handleZoomChange = useCallback((zoom: string) => setZoomLevel(zoom), []);

  return (
    <div className="w-full h-full relative" style={{ background: 'linear-gradient(180deg, #E8F5E9 0%, #FFF9C4 100%)' }}>
      <Canvas
        camera={{ fov: 45, near: 0.1, far: 100, position: [0, 1.2, 2.2] }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
        performance={{ min: 0.5 }}
      >
        <ambientLight intensity={0.4} color="#FFF8F0" />
        <directionalLight position={[3, 5, 2]} intensity={1.0} color="#FFF5E6" />
        <directionalLight position={[-2, 3, -1]} intensity={0.5} color="#F0F8FF" />
        <hemisphereLight args={['#FFF8F0', '#F5E6D0', 0.3]} />

        <CameraController />
        <BouquetScene />
        <ZoomTracker onZoomChange={handleZoomChange} />
      </Canvas>
      <div
        className="absolute bottom-4 left-4 px-2 py-1 rounded-md text-xs font-mono"
        style={{
          background: 'rgba(255,255,255,0.75)',
          color: '#6B8E4E',
          backdropFilter: 'blur(4px)',
        }}
      >
        {zoomLevel}x
      </div>
    </div>
  );
}
