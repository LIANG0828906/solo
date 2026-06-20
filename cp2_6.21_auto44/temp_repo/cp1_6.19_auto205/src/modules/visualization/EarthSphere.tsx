import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '@/store/useAppStore';
import { HeatPoint } from '@/types';
import { calculateAlphaForYear } from '@/utils/temperatureCalculator';

const latLngToVector3 = (lat: number, lng: number, radius: number): THREE.Vector3 => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  
  return new THREE.Vector3(x, y, z);
};

interface HeatPointsProps {
  points: HeatPoint[];
  selectedSourceId: string | null;
  currentYear: number;
  isResetting: boolean;
}

const HeatPoints = ({ points, selectedSourceId, currentYear, isResetting }: HeatPointsProps) => {
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = new THREE.Color();

  const filteredPoints = useMemo(() => {
    if (!selectedSourceId) return points;
    return points.filter(p => p.sourceId === selectedSourceId);
  }, [points, selectedSourceId]);

  const alpha = calculateAlphaForYear(currentYear);

  useEffect(() => {
    if (!instancedMeshRef.current) return;
    
    filteredPoints.forEach((point, i) => {
      const position = latLngToVector3(point.lat, point.lng, 2.02);
      dummy.position.copy(position);
      dummy.lookAt(0, 0, 0);
      const scale = 0.03 + point.baseIntensity * 0.03;
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      instancedMeshRef.current!.setMatrixAt(i, dummy.matrix);
      
      const intensity = point.baseIntensity * (isResetting ? 0 : alpha);
      const source = useAppStore.getState().emissionSources.find(s => s.id === point.sourceId);
      if (source) {
        const baseColor = source.gasType === 'CO2' ? '#E67E22' : source.gasType === 'CH4' ? '#3498DB' : '#27AE60';
        color.set(baseColor);
        color.multiplyScalar(0.5 + intensity * 0.5);
      }
      instancedMeshRef.current!.setColorAt(i, color);
    });
    
    instancedMeshRef.current.instanceMatrix.needsUpdate = true;
    if (instancedMeshRef.current.instanceColor) {
      instancedMeshRef.current.instanceColor.needsUpdate = true;
    }
  }, [filteredPoints, alpha, isResetting, dummy]);

  useFrame(({ clock }) => {
    if (!instancedMeshRef.current) return;
    
    const time = clock.getElapsedTime();
    filteredPoints.forEach((point, i) => {
      const pulseScale = 1 + Math.sin(time * 2 + i * 0.5) * 0.15;
      const baseScale = 0.03 + point.baseIntensity * 0.03;
      const scale = baseScale * pulseScale;
      
      const matrix = instancedMeshRef.current!.instanceMatrix.array as Float32Array;
      const offset = i * 16;
      matrix[offset] = scale;
      matrix[offset + 5] = scale;
      matrix[offset + 10] = scale;
    });
    instancedMeshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={instancedMeshRef}
      args={[undefined, undefined, filteredPoints.length]}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, 16, 16]} />
      <meshBasicMaterial 
        transparent 
        opacity={isResetting ? 0 : alpha} 
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  );
};

const Earth = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[2, 64, 64]} />
      <meshStandardMaterial
        color="#1B4F72"
        roughness={0.8}
        metalness={0.1}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
};

const Atmosphere = () => {
  return (
    <mesh scale={1.1}>
      <sphereGeometry args={[2, 64, 64]} />
      <meshBasicMaterial
        color="#3498DB"
        transparent
        opacity={0.1}
        side={THREE.BackSide}
      />
    </mesh>
  );
};

const EarthScene = () => {
  const { selectedSourceId, currentYear, heatPoints, isResetting } = useAppStore();

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 3, 5]} intensity={1} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      <Earth />
      <Atmosphere />
      <HeatPoints
        points={heatPoints}
        selectedSourceId={selectedSourceId}
        currentYear={currentYear}
        isResetting={isResetting}
      />
      
      <OrbitControls
        enablePan={false}
        minDistance={3}
        maxDistance={8}
        enableDamping
        dampingFactor={0.05}
      />
    </>
  );
};

const EarthSphere = () => {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <EarthScene />
      </Canvas>
      
      <div style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        color: '#A8D0E6',
        fontSize: '12px',
        backgroundColor: 'rgba(15, 27, 51, 0.8)',
        padding: '8px 12px',
        borderRadius: '6px',
        border: '1px solid #2C3E50',
      }}>
        <div style={{ marginBottom: '4px' }}>🖱️ 拖动旋转地球</div>
        <div>🔍 滚轮缩放</div>
      </div>
    </div>
  );
};

export default EarthSphere;
