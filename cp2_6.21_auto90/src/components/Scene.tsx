import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { BRONZE_DING_PARTS } from '@/utils/modelData';
import { PartMesh } from './PartMesh';
import { useExplosionStore } from '@/store/explosionStore';

/**
 * 3D 场景根组件
 *
 * 职责：
 *   - 配置 Canvas 渲染参数（阴影、相机、色调映射）
 *   - 配置场景光照（环境光 + 方向光 + 点光源补光）
 *   - 从 zustand store 订阅拆解/选中/自动旋转状态
 *   - 遍历 BRONZE_DING_PARTS 渲染 PartMesh
 *   - 配置 OrbitControls（阻尼、缩放范围、自动旋转）
 *
 * 数据流向：
 *   useExplosionStore { partOffsets, selectedParts, autoRotate }
 *     → SceneContent
 *       → map(BRONZE_DING_PARTS)
 *         → PartMesh(props: { part, offset, isSelected })
 *
 * 不包含几何体构建逻辑，该职责由 geometryFactory.ts 独立模块承担。
 */

function SceneContent() {
  const partOffsets = useExplosionStore((s) => s.partOffsets);
  const selectedParts = useExplosionStore((s) => s.selectedParts);
  const autoRotate = useExplosionStore((s) => s.autoRotate);
  const controlsRef = useRef<any>(null);

  useFrame(() => {
    if (controlsRef.current && autoRotate) {
      controlsRef.current.update();
    }
  });

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[-4, 3, -4]} intensity={0.4} color="#ffeedd" />
      <pointLight position={[4, -2, 3]} intensity={0.3} color="#ddccff" />

      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.2, 0]}>
        <planeGeometry args={[20, 20]} />
        <shadowMaterial opacity={0.3} />
      </mesh>

      {BRONZE_DING_PARTS.map((part) => (
        <PartMesh
          key={part.id}
          part={part}
          offset={partOffsets[part.id] ?? 0}
          isSelected={selectedParts.includes(part.id)}
        />
      ))}

      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.08}
        minDistance={1}
        maxDistance={5}
        autoRotate={autoRotate}
        autoRotateSpeed={0.8}
        enablePan
        panSpeed={0.8}
        rotateSpeed={0.6}
        zoomSpeed={0.8}
      />
    </>
  );
}

export function Scene() {
  return (
    <Canvas
      shadows
      camera={{ position: [4, 3, 5], fov: 45 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: '#1a1a2e' }}
      onCreated={({ gl }) => {
        gl.setClearColor('#1a1a2e');
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.0;
      }}
    >
      <SceneContent />
    </Canvas>
  );
}
