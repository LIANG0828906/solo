// ============================================================
// 3D装备渲染组件 EquipmentViewer.tsx
// 职责:
//   1. 使用@react-three/fiber渲染3D装备模型 (根据currentEquipment.modelType生成剑/盾/杖)
//   2. 支持OrbitControls用户拖拽旋转 + 自动360度缓慢旋转
//   3. 接收lastResult变化触发粒子特效 (合成成功:材料颜色粒子向外扩散)
//   4. 根据属性变化动态调整材质 (攻击力增加时边缘发光)
// 数据流:
//   CraftingPanel执行合成 -> Zustand store.lastResult更新
//   -> EquipmentViewer通过useCrafting订阅lastResult
//   -> effect检测到变化 -> 触发粒子动画播放 + 材质发光调整
//   属性变化通过preview也会持续更新材质参数
// ============================================================

import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Float } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useCrafting } from '../hooks/useCrafting';

// ==========================================================================
// 粒子系统 - 合成成功后播放扩散特效
// 接收 colors 数组 (材料对应颜色)，从中心向外扩散粒子
// ==========================================================================
interface ParticleSystemProps {
  trigger: number;         // 计数器，每次+1则触发一次爆炸
  colors: string[];        // 粒子颜色数组
  particleCount?: number;
}

function ParticleBurst({ trigger, colors, particleCount = 80 }: ParticleSystemProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // 每个粒子的状态: 位置、速度、生命周期
  const state = useMemo(() => {
    const velocities = new Float32Array(particleCount * 3);
    const lifetimes = new Float32Array(particleCount);
    const colorIdx = new Int32Array(particleCount);
    return { velocities, lifetimes, colorIdx };
  }, [particleCount]);

  // 每次trigger变化 -> 重置粒子为初始爆炸态
  useEffect(() => {
    if (trigger === 0) return;
    const palette = colors.length > 0 ? colors : ['#e94560', '#f59e0b', '#ffffff'];
    for (let i = 0; i < particleCount; i++) {
      // 球面均匀分布速度方向
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = 0.05 + Math.random() * 0.1;
      state.velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
      state.velocities[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
      state.velocities[i * 3 + 2] = Math.cos(phi) * speed;
      state.lifetimes[i] = 1.0;           // 剩余生命: 1.0 -> 0
      state.colorIdx[i] = i % palette.length;
    }
  }, [trigger, colors, state, particleCount]);

  // 每帧更新粒子位置 + 生命周期衰减
  useFrame(() => {
    if (!meshRef.current) return;
    const mesh = meshRef.current;
    const palette = colors.length > 0 ? colors : ['#e94560'];
    for (let i = 0; i < particleCount; i++) {
      if (state.lifetimes[i] <= 0) {
        dummy.scale.set(0, 0, 0);
      } else {
        state.lifetimes[i] -= 0.012;       // 约83帧消散
        const life = Math.max(0, state.lifetimes[i]);
        const ix = i * 3;
        // 更新位置：速度*生命周期(让早期快后期慢) + 位置用dummy更新
        dummy.position.x += state.velocities[ix] * life * 2 + state.velocities[ix] * 0.5;
        dummy.position.y += state.velocities[ix + 1] * life * 2 + state.velocities[ix + 1] * 0.5;
        dummy.position.z += state.velocities[ix + 2] * life * 2 + state.velocities[ix + 2] * 0.5;
        // 尺寸随生命缩小
        const s = 0.08 * life;
        dummy.scale.set(s, s, s);
        const color = new THREE.Color(palette[state.colorIdx[i]]);
        mesh.setColorAt(i, color);
      }
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, particleCount]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial transparent opacity={0.9} blending={THREE.AdditiveBlending} />
    </instancedMesh>
  );
}

// ==========================================================================
// 装备模型 - 根据modelType构建不同几何体 (纯程序化建模，无需外部模型文件)
// 接收emissive参数实现属性提升时边缘发光
// ==========================================================================
interface EquipmentModelProps {
  modelType: 'sword' | 'shield' | 'staff';
  emissiveIntensity: number;   // 发光强度 - 受属性增益影响
  emissiveColor: string;       // 发光颜色
  baseColor: string;
}

function EquipmentModel({ modelType, emissiveIntensity, emissiveColor, baseColor }: EquipmentModelProps) {
  const groupRef = useRef<THREE.Group>(null);

  // 自动缓慢旋转 - 绕Y轴360度旋转
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.4; // ~0.5rpm
    }
  });

  const emissiveColorObj = useMemo(() => new THREE.Color(emissiveColor), [emissiveColor]);
  const baseColorObj = useMemo(() => new THREE.Color(baseColor), [baseColor]);

  if (modelType === 'sword') {
    return (
      <group ref={groupRef} castShadow>
        {/* 剑身 */}
        <mesh position={[0, 1.5, 0]} castShadow>
          <boxGeometry args={[0.15, 2.6, 0.04]} />
          <meshStandardMaterial
            color={baseColorObj}
            metalness={0.95}
            roughness={0.15}
            emissive={emissiveColorObj}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
        {/* 剑尖 */}
        <mesh position={[0, 2.9, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
          <coneGeometry args={[0.12, 0.4, 4]} />
          <meshStandardMaterial color={baseColorObj} metalness={0.95} roughness={0.15} emissive={emissiveColorObj} emissiveIntensity={emissiveIntensity} />
        </mesh>
        {/* 护手 */}
        <mesh position={[0, 0.15, 0]} castShadow>
          <boxGeometry args={[1.1, 0.12, 0.12]} />
          <meshStandardMaterial color="#8b5a2b" metalness={0.6} roughness={0.4} emissive={emissiveColorObj} emissiveIntensity={emissiveIntensity * 0.5} />
        </mesh>
        {/* 剑柄 */}
        <mesh position={[0, -0.6, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.11, 1.2, 12]} />
          <meshStandardMaterial color="#3d2817" metalness={0.2} roughness={0.7} />
        </mesh>
        {/* 剑首 */}
        <mesh position={[0, -1.25, 0]} castShadow>
          <sphereGeometry args={[0.16, 16, 16]} />
          <meshStandardMaterial color="#e94560" metalness={0.8} roughness={0.2} emissive="#e94560" emissiveIntensity={0.3 + emissiveIntensity * 0.5} />
        </mesh>
      </group>
    );
  }

  if (modelType === 'shield') {
    return (
      <group ref={groupRef} castShadow>
        {/* 盾体 - 扁平椭球 */}
        <mesh castShadow>
          <sphereGeometry args={[1.4, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2.2]} />
          <meshStandardMaterial
            color={baseColorObj}
            metalness={0.7}
            roughness={0.35}
            emissive={emissiveColorObj}
            emissiveIntensity={emissiveIntensity}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* 中央饰钉 */}
        <mesh position={[0, 0, 0.05]} castShadow>
          <cylinderGeometry args={[0.22, 0.28, 0.18, 16]} />
          <meshStandardMaterial color="#e94560" metalness={0.9} roughness={0.15} emissive="#e94560" emissiveIntensity={0.4 + emissiveIntensity * 0.6} />
        </mesh>
        {/* 边框装饰 */}
        <mesh position={[0, 0, -0.02]}>
          <torusGeometry args={[1.2, 0.06, 12, 48]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.9} roughness={0.2} emissive="#f59e0b" emissiveIntensity={0.2 + emissiveIntensity * 0.4} />
        </mesh>
        {/* 背面把手 */}
        <mesh position={[0, -0.1, -0.4]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.28, 0.04, 8, 24]} />
          <meshStandardMaterial color="#3d2817" metalness={0.3} roughness={0.7} />
        </mesh>
      </group>
    );
  }

  // staff - 法杖
  return (
    <group ref={groupRef} castShadow>
      {/* 杖身 */}
      <mesh position={[0, -0.5, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 3.2, 12]} />
        <meshStandardMaterial color="#4a2c17" metalness={0.3} roughness={0.7} />
      </mesh>
      {/* 杖身金线缠绕 */}
      <mesh position={[0, -0.5, 0]}>
        <torusGeometry args={[0.1, 0.015, 8, 48, Math.PI * 1.5]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.9} roughness={0.15} emissive="#f59e0b" emissiveIntensity={0.25 + emissiveIntensity * 0.3} />
      </mesh>
      {/* 杖顶爪托 */}
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={i}
          position={[
            Math.cos((i * Math.PI) / 2) * 0.15,
            1.2,
            Math.sin((i * Math.PI) / 2) * 0.15,
          ]}
          rotation={[Math.PI / 6, (i * Math.PI) / 2, 0]}
          castShadow
        >
          <boxGeometry args={[0.05, 0.4, 0.05]} />
          <meshStandardMaterial color="#3d2817" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
      {/* 杖顶宝石 - 高发光 */}
      <Float speed={2} rotationIntensity={1} floatIntensity={1.2}>
        <mesh position={[0, 1.35, 0]} castShadow>
          <octahedronGeometry args={[0.28, 0]} />
          <meshStandardMaterial
            color={emissiveColorObj}
            metalness={0.4}
            roughness={0.1}
            emissive={emissiveColorObj}
            emissiveIntensity={0.8 + emissiveIntensity}
            transparent
            opacity={0.92}
          />
        </mesh>
      </Float>
      {/* 尾尖 */}
      <mesh position={[0, -2.15, 0]} castShadow>
        <coneGeometry args={[0.08, 0.3, 8]} />
        <meshStandardMaterial color="#a855f7" metalness={0.8} roughness={0.2} emissive="#a855f7" emissiveIntensity={0.2 + emissiveIntensity * 0.5} />
      </mesh>
    </group>
  );
}

// ==========================================================================
// 场景主逻辑 - 订阅lastResult变化触发粒子，计算材质发光强度
// ==========================================================================
function SceneContent() {
  const { currentEquipment, lastResult, preview } = useCrafting();

  // 粒子触发计数器 - 每次lastResult变化+1 => 爆炸
  const [burstTrigger, setBurstTrigger] = useState(0);
  const [burstColors, setBurstColors] = useState<string[]>([]);

  useEffect(() => {
    if (!lastResult) return;
    if (lastResult.success) {
      setBurstColors(lastResult.materialColors.length > 0 ? lastResult.materialColors : ['#e94560']);
      setBurstTrigger((n) => n + 1);
    }
  }, [lastResult]);

  // 计算材质发光强度 - 基于预览或最终结果的攻击力增益
  // 攻击力/魔力增益越高，发光越强
  const emissiveParams = useMemo(() => {
    const diff = lastResult?.success ? lastResult.attributeDiff : preview?.attributeDiff;
    const atkGain = diff?.attack ?? 0;
    const magGain = diff?.magic ?? 0;
    const intensity = Math.min(1.2, (atkGain + magGain) * 0.03);
    // 攻击高发红光，魔力高发紫光
    let color = '#e94560';
    if (magGain > atkGain) color = '#a855f7';
    if (magGain > 0 && atkGain > 0) color = '#f59e0b';
    return { intensity, color };
  }, [lastResult, preview]);

  // 根据装备类型选不同基础色
  const modelType: 'sword' | 'shield' | 'staff' = currentEquipment?.modelType ?? 'sword';
  const baseColor = modelType === 'sword' ? '#cfd8dc' : modelType === 'shield' ? '#78909c' : '#6d4c41';

  // 成功/失败闪烁 - 使用后处理bloom + 主光颜色实现
  const [flashColor, setFlashColor] = useState<THREE.Color | null>(null);
  useEffect(() => {
    if (!lastResult) return;
    const color = lastResult.success ? new THREE.Color('#22c55e') : new THREE.Color('#ef4444');
    setFlashColor(color);
    const t = setTimeout(() => setFlashColor(null), 700);
    return () => clearTimeout(t);
  }, [lastResult]);

  return (
    <>
      {/* 环境与星空背景 */}
      <color attach="background" args={[flashColor ?? '#0a0a1f']} />
      <Stars radius={80} depth={60} count={1500} factor={3} saturation={0} fade speed={0.5} />
      <ambientLight intensity={0.35} />
      {/* 主光 - 模拟前上方方向光 */}
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      {/* 轮廓光 - 品牌色 */}
      <pointLight position={[-4, 3, -4]} color="#e94560" intensity={0.6} distance={20} />
      <pointLight position={[4, -3, -4]} color="#0f3460" intensity={0.5} distance={20} />
      {/* 合成结果闪烁光源 */}
      {flashColor && (
        <pointLight position={[0, 0, 2]} color={flashColor} intensity={3} distance={10} />
      )}

      {/* 装备模型 - 自动旋转 + 发光参数 */}
      <EquipmentModel
        modelType={modelType}
        emissiveIntensity={emissiveParams.intensity}
        emissiveColor={emissiveParams.color}
        baseColor={baseColor}
      />

      {/* 合成成功粒子爆发 */}
      <ParticleBurst trigger={burstTrigger} colors={burstColors} particleCount={100} />

      {/* 地面反射圆盘底座 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
        <cylinderGeometry args={[2.5, 2.5, 0.08, 64]} />
        <meshStandardMaterial
          color="#0f3460"
          metalness={0.8}
          roughness={0.25}
          emissive="#16213e"
          emissiveIntensity={0.2}
        />
      </mesh>
      {/* 底座装饰环 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.95, 0]}>
        <torusGeometry args={[2.3, 0.02, 12, 96]} />
        <meshBasicMaterial color="#e94560" transparent opacity={0.6} />
      </mesh>

      {/* Bloom发光后处理 */}
      <EffectComposer multisampling={0} disableNormalPass>
        <Bloom
          intensity={0.8 + emissiveParams.intensity * 0.5}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>

      {/* 相机控制 - 用户可拖拽旋转/滚轮缩放 */}
      <OrbitControls
        enablePan={false}
        minDistance={3.5}
        maxDistance={12}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 1.8}
        autoRotate={false}
        makeDefault
      />
    </>
  );
}

// ==========================================================================
// 外层导出组件 - 包装R3F Canvas + 结果消息浮层
// ==========================================================================
export function EquipmentViewer() {
  const { lastResult, currentEquipment } = useCrafting();

  return (
    <div className="equipment-viewer">
      <div className="viewer-header">
        <h2 className="viewer-title">
          <span className="title-icon">👁️</span>
          3D装备预览
        </h2>
        {currentEquipment && (
          <span className="viewer-equipment-name">{currentEquipment.name}</span>
        )}
      </div>

      <div className="viewer-canvas">
        <Canvas
          shadows
          camera={{ position: [0, 1.5, 6], fov: 45 }}
          gl={{ antialias: true, alpha: false }}
          dpr={[1, 2]}
        >
          <SceneContent />
        </Canvas>

        {/* 合成结果浮层提示 */}
        {lastResult && (
          <div className={`result-toast ${lastResult.success ? 'toast--success' : 'toast--fail'}`}>
            <div className="toast-icon">{lastResult.success ? '🎉' : '💥'}</div>
            <div className="toast-content">
              <div className="toast-title">{lastResult.success ? '合成成功！' : '合成失败'}</div>
              <div className="toast-message">{lastResult.message}</div>
            </div>
          </div>
        )}

        {/* 底部操作提示 */}
        <div className="viewer-hints">
          <span>🖱️ 拖拽旋转</span>
          <span>🔍 滚轮缩放</span>
        </div>
      </div>
    </div>
  );
}
