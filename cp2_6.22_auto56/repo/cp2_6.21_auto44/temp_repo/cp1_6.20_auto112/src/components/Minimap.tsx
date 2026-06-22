import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useDNAContext } from '../context/DNAContext';

const MiniDNA: React.FC = () => {
  const { cameraTarget, params } = useDNAContext();

  const totalPairs = Math.round(params.turns * 10);
  const totalH = totalPairs * params.basePairSpacing;

  const positions1 = useMemo(() => {
    const pts: number[] = [];
    for (let i = 0; i <= totalPairs; i++) {
      const a = i * ((2 * Math.PI) / 10);
      const y = (i / totalPairs - 0.5) * totalH * 0.85;
      pts.push(Math.cos(a) * 0.9, y, Math.sin(a) * 0.9);
    }
    return new Float32Array(pts);
  }, [totalPairs, totalH]);

  const positions2 = useMemo(() => {
    const pts: number[] = [];
    for (let i = 0; i <= totalPairs; i++) {
      const a = i * ((2 * Math.PI) / 10) + Math.PI;
      const y = (i / totalPairs - 0.5) * totalH * 0.85;
      pts.push(Math.cos(a) * 0.9, y, Math.sin(a) * 0.9);
    }
    return new Float32Array(pts);
  }, [totalPairs, totalH]);

  return (
    <group>
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={totalPairs + 1} array={positions1} itemSize={3} />
        </bufferGeometry>
        <lineBasicMaterial color="#3b82f6" transparent opacity={0.8} />
      </line>
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={totalPairs + 1} array={positions2} itemSize={3} />
        </bufferGeometry>
        <lineBasicMaterial color="#ef4444" transparent opacity={0.8} />
      </line>

      <mesh position={[cameraTarget[0] * 0.85, cameraTarget[1] * 0.85, cameraTarget[2] * 0.85]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial color="#60a5fa" transparent opacity={0.85} />
      </mesh>
      <mesh position={[cameraTarget[0] * 0.85, cameraTarget[1] * 0.85, cameraTarget[2] * 0.85]}>
        <sphereGeometry args={[0.28, 16, 16]} />
        <meshBasicMaterial color="#60a5fa" transparent opacity={0.25} depthWrite={false} />
      </mesh>
    </group>
  );
};

const Minimap: React.FC = () => {
  return (
    <div className="minimap">
      <div className="minimap-label">视角方位</div>
      <Canvas
        gl={{ antialias: true, alpha: true }}
        dpr={1}
        style={{ width: '100%', height: '100%' }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 3.5]} fov={55} />
        <ambientLight intensity={0.6} />
        <MiniDNA />
      </Canvas>
    </div>
  );
};

export default Minimap;
