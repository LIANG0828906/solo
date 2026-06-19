
import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import type { Particle, HeatmapGrid } from '../types';
import { BOUNDARY_SIZE, CELL_SIZE } from '../api';

interface SceneSetupProps {
  particles: Particle[];
  heatmapData: HeatmapGrid[];
  showHeatmap: boolean;
  heatmapOpacity: number;
}

export function SceneSetup({ particles, heatmapData, showHeatmap, heatmapOpacity }: SceneSetupProps) {
  const particlesRef = useRef<THREE.InstancedMesh>(null);
  const heatmapRef = useRef<THREE.InstancedMesh>(null);
  const hotspotRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const { scene } = useThree();

  useEffect(() => {
    scene.fog = new THREE.FogExp2(0x0A1128, 0.008);
  }, [scene]);

  useFrame((state) => {
    if (particlesRef.current) {
      const mesh = particlesRef.current;
      const count = Math.min(particles.length, mesh.count);
      
      for (let i = 0; i < count; i++) {
        const p = particles[i];
        dummy.position.set(p.x, p.y, p.z);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      
      mesh.instanceMatrix.needsUpdate = true;
    }

    if (showHeatmap && heatmapRef.current && hotspotRef.current) {
      const normalCells = heatmapData.filter(h => !h.isHotspot);
      const hotspotCells = heatmapData.filter(h => h.isHotspot);
      
      const normalMesh = heatmapRef.current;
      for (let i = 0; i < normalCells.length && i < normalMesh.count; i++) {
        const cell = normalCells[i];
        dummy.position.set(cell.worldX, cell.worldY, cell.worldZ);
        dummy.scale.setScalar(CELL_SIZE * 0.95);
        dummy.updateMatrix();
        normalMesh.setMatrixAt(i, dummy.matrix);
        
        const color = new THREE.Color(cell.color);
        normalMesh.setColorAt(i, color);
      }
      normalMesh.instanceMatrix.needsUpdate = true;
      if (normalMesh.instanceColor) normalMesh.instanceColor.needsUpdate = true;
      
      const hotspotMesh = hotspotRef.current;
      const time = state.clock.elapsedTime;
      const pulse = 0.3 + 0.5 * (0.5 + 0.5 * Math.sin(time * Math.PI * 2 * 2));
      
      for (let i = 0; i < hotspotCells.length && i < hotspotMesh.count; i++) {
        const cell = hotspotCells[i];
        dummy.position.set(cell.worldX, cell.worldY, cell.worldZ);
        dummy.scale.setScalar(CELL_SIZE * 0.95 * (1 + 0.1 * Math.sin(time * 4)));
        dummy.updateMatrix();
        hotspotMesh.setMatrixAt(i, dummy.matrix);
        
        const color = new THREE.Color(cell.color);
        hotspotMesh.setColorAt(i, color);
      }
      hotspotMesh.instanceMatrix.needsUpdate = true;
      if (hotspotMesh.instanceColor) hotspotMesh.instanceColor.needsUpdate = true;
      
      (hotspotMesh.material as THREE.MeshBasicMaterial).opacity = heatmapOpacity * pulse;
      (normalMesh.material as THREE.MeshBasicMaterial).opacity = heatmapOpacity * 0.6;
    }
  });

  const particleCount = 1000;
  const heatmapCellCount = 20 * 20 * 10;

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[25, 25, 25]} intensity={0.5} color="#88ccff" />
      <pointLight position={[-25, -25, -15]} intensity={0.3} color="#4488ff" />
      
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={30}
        maxDistance={100}
        enablePan={true}
      />
      
      <gridHelper
        args={[BOUNDARY_SIZE, 20, '#3a4a6a', '#2a3a5a']}
        position={[0, -BOUNDARY_SIZE / 2, 0]}
      />
      <gridHelper
        args={[BOUNDARY_SIZE, 20, '#3a4a6a', '#2a3a5a']}
        position={[0, BOUNDARY_SIZE / 2, 0]}
      />
      
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[BOUNDARY_SIZE, BOUNDARY_SIZE, BOUNDARY_SIZE * 0.5]} />
        <meshBasicMaterial color="#4a6a8a" wireframe transparent opacity={0.3} />
      </mesh>
      
      <instancedMesh ref={particlesRef} args={[undefined, undefined, particleCount]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshBasicMaterial
          color="#00FFFF"
          transparent
          opacity={0.53}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </instancedMesh>
      
      {showHeatmap && (
        <>
          <instancedMesh ref={heatmapRef} args={[undefined, undefined, heatmapCellCount]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial
              transparent
              opacity={heatmapOpacity * 0.6}
              depthWrite={false}
            />
          </instancedMesh>
          
          <instancedMesh ref={hotspotRef} args={[undefined, undefined, heatmapCellCount]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial
              transparent
              opacity={heatmapOpacity}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </instancedMesh>
        </>
      )}
      
      <Stars
        radius={100}
        depth={50}
        count={500}
        factor={4}
        saturation={0}
        fade
        speed={0.5}
      />
    </>
  );
}
