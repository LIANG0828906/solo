import { useState, useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { ArrowLeft, Star, Calendar, FileType, Layers, Maximize2, Plus } from 'lucide-react';
import { useAssetStore } from '../asset-store/store';
import type { MaterialMode } from '../asset-store/types';
import { format } from 'date-fns';
import './AssetDetail.css';

interface MaterialState {
  wireframe: boolean;
  transparent: boolean;
  opacity: number;
  metalness: number;
  roughness: number;
  transmission: number;
  color: THREE.Color;
  emissive: THREE.Color;
  emissiveIntensity: number;
}

interface DetailModelProps {
  materialMode: MaterialMode;
  modelUrl?: string;
  onLoad?: () => void;
}

function getTargetMaterialState(mode: MaterialMode): MaterialState {
  switch (mode) {
    case 'wireframe':
      return {
        wireframe: true,
        transparent: true,
        opacity: 0.9,
        metalness: 0,
        roughness: 1,
        transmission: 0,
        color: new THREE.Color('#3b82f6'),
        emissive: new THREE.Color('#000000'),
        emissiveIntensity: 0,
      };
    case 'transparent':
      return {
        wireframe: false,
        transparent: true,
        opacity: 0.35,
        metalness: 0.1,
        roughness: 0.2,
        transmission: 0.6,
        color: new THREE.Color('#60a5fa'),
        emissive: new THREE.Color('#000000'),
        emissiveIntensity: 0,
      };
    case 'standard':
    default:
      return {
        wireframe: false,
        transparent: false,
        opacity: 1,
        metalness: 0.4,
        roughness: 0.3,
        transmission: 0,
        color: new THREE.Color('#3b82f6'),
        emissive: new THREE.Color('#1e3a5f'),
        emissiveIntensity: 0.3,
      };
  }
}

function lerpMaterialState(
  current: MaterialState,
  target: MaterialState,
  t: number
): MaterialState {
  const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

  return {
    wireframe: t > 0.5 ? target.wireframe : current.wireframe,
    transparent: t > 0.3 ? target.transparent : current.transparent,
    opacity: current.opacity + (target.opacity - current.opacity) * easeT,
    metalness: current.metalness + (target.metalness - current.metalness) * easeT,
    roughness: current.roughness + (target.roughness - current.roughness) * easeT,
    transmission: current.transmission + (target.transmission - current.transmission) * easeT,
    color: current.color.clone().lerp(target.color, easeT),
    emissive: current.emissive.clone().lerp(target.emissive, easeT),
    emissiveIntensity: current.emissiveIntensity + (target.emissiveIntensity - current.emissiveIntensity) * easeT,
  };
}

function DetailModel({ materialMode, modelUrl, onLoad }: DetailModelProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshPhysicalMaterial | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const currentState = useRef<MaterialState>(getTargetMaterialState('standard'));
  const targetState = useRef<MaterialState>(getTargetMaterialState(materialMode));
  const transitionProgress = useRef(1);
  const previousMode = useRef<MaterialMode>('standard');

  const geometry = useMemo(() => {
    return <torusKnotGeometry args={[1.2, 0.4, 128, 32]} />;
  }, []);

  useEffect(() => {
    if (materialMode !== previousMode.current) {
      previousMode.current = materialMode;
      currentState.current = getTargetMaterialState(previousMode.current);
      targetState.current = getTargetMaterialState(materialMode);
      transitionProgress.current = 0;
    }
  }, [materialMode]);

  useEffect(() => {
    if (materialRef.current) {
      const state = getTargetMaterialState(materialMode);
      materialRef.current.wireframe = state.wireframe;
      materialRef.current.transparent = state.transparent;
      materialRef.current.opacity = state.opacity;
      materialRef.current.metalness = state.metalness;
      materialRef.current.roughness = state.roughness;
      materialRef.current.transmission = state.transmission;
      materialRef.current.color.copy(state.color);
      materialRef.current.emissive.copy(state.emissive);
      materialRef.current.emissiveIntensity = state.emissiveIntensity;
    }
  }, []);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.1;
    }

    if (materialRef.current && transitionProgress.current < 1) {
      transitionProgress.current = Math.min(transitionProgress.current + delta, 1);
      const t = transitionProgress.current;

      const lerped = lerpMaterialState(
        currentState.current,
        targetState.current,
        t
      );

      materialRef.current.wireframe = lerped.wireframe;
      materialRef.current.transparent = lerped.transparent;
      materialRef.current.opacity = lerped.opacity;
      materialRef.current.metalness = lerped.metalness;
      materialRef.current.roughness = lerped.roughness;
      materialRef.current.transmission = lerped.transmission;
      materialRef.current.color.copy(lerped.color);
      materialRef.current.emissive.copy(lerped.emissive);
      materialRef.current.emissiveIntensity = lerped.emissiveIntensity;
      materialRef.current.needsUpdate = true;
    }

    if (!isLoaded) {
      setIsLoaded(true);
      onLoad?.();
    }
  });

  return (
    <mesh ref={meshRef} castShadow receiveShadow>
      {geometry}
      <meshPhysicalMaterial
        ref={materialRef}
        color="#3b82f6"
        metalness={0.4}
        roughness={0.3}
        emissive="#1e3a5f"
        emissiveIntensity={0.3}
      />
    </mesh>
  );
}

interface DetailViewerProps {
  materialMode: MaterialMode;
  modelUrl?: string;
  onLoad?: () => void;
}

function DetailViewer({ materialMode, modelUrl, onLoad }: DetailViewerProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 45 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      dpr={[1, 2]}
    >
      <color attach="background" args={['#1a1a2e']} />
      <fog attach="fog" args={['#1a1a2e', 8, 20]} />

      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} castShadow shadow-mapSize={[2048, 2048]} />
      <pointLight position={[-5, 3, -5]} intensity={0.6} color="#06b6d4" />
      <pointLight position={[5, -2, 5]} intensity={0.4} color="#3b82f6" />
      <pointLight position={[0, 5, 0]} intensity={0.3} color="#ec4899" />

      <DetailModel materialMode={materialMode} modelUrl={modelUrl} onLoad={onLoad} />

      <ContactShadows
        position={[0, -2, 0]}
        opacity={0.4}
        scale={10}
        blur={2}
        far={4}
      />

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={2}
        maxDistance={15}
        enableDamping
        dampingFactor={0.05}
      />
    </Canvas>
  );
}

export default function AssetDetail() {
  const { getCurrentAsset, addTag, setCurrentAsset } = useAssetStore();
  const [materialMode, setMaterialMode] = useState<MaterialMode>('standard');
  const [newTag, setNewTag] = useState('');
  const [animatingTags, setAnimatingTags] = useState<string[]>([]);
  const [loadingTime, setLoadingTime] = useState<number | null>(null);
  const loadStartTime = useRef(Date.now());
  const asset = getCurrentAsset();

  useEffect(() => {
    loadStartTime.current = Date.now();
  }, [asset?.id]);

  const goBack = () => {
    setCurrentAsset(null);
    window.location.hash = '#/';
  };

  const handleAddTag = () => {
    if (!newTag.trim() || !asset) return;
    if (asset.tags.includes(newTag.trim())) {
      setNewTag('');
      return;
    }

    const tagToAdd = newTag.trim();
    addTag(asset.id, tagToAdd);
    setAnimatingTags([...animatingTags, tagToAdd]);
    setNewTag('');

    setTimeout(() => {
      setAnimatingTags((prev) => prev.filter((t) => t !== tagToAdd));
    }, 600);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTag();
    }
  };

  const handleModeChange = (mode: MaterialMode) => {
    setMaterialMode(mode);
  };

  const handleLoad = () => {
    const time = Date.now() - loadStartTime.current;
    setLoadingTime(time);
  };

  if (!asset) {
    return (
      <div className="detail-page">
        <div className="detail-not-found">
          <p>未找到模型</p>
          <button onClick={goBack} className="back-button">
            <ArrowLeft size={18} />
            返回列表
          </button>
        </div>
      </div>
    );
  }

  const faceCountInK = (asset.faceCount / 1000).toFixed(1);

  return (
    <div className="detail-page">
      <button onClick={goBack} className="back-button">
        <ArrowLeft size={18} />
        返回列表
      </button>

      <div className="detail-container">
        <div className="detail-viewer">
          <DetailViewer materialMode={materialMode} modelUrl={asset.modelUrl} onLoad={handleLoad} />
          <div className="viewer-badge">
            <Maximize2 size={14} />
            可拖拽旋转 · 滚轮缩放
          </div>
          {loadingTime !== null && (
            <div className="loading-time-badge">
              加载耗时: {loadingTime}ms
            </div>
          )}
        </div>

        <div className="detail-panel">
          <div className="panel-section">
            <h1 className="asset-name">{asset.name}</h1>
            {asset.description && (
              <p className="asset-description">{asset.description}</p>
            )}
          </div>

          <div className="panel-section">
            <h3 className="section-title">模型信息</h3>
            <div className="info-grid">
              <div className="info-item">
                <FileType size={16} className="info-icon" />
                <div>
                  <span className="info-label">格式</span>
                  <span className="info-value">{asset.format.toUpperCase()}</span>
                </div>
              </div>
              <div className="info-item">
                <Layers size={16} className="info-icon" />
                <div>
                  <span className="info-label">面数</span>
                  <span className="info-value">{faceCountInK}k</span>
                </div>
              </div>
              <div className="info-item">
                <Star size={16} className="info-icon" />
                <div>
                  <span className="info-label">评分</span>
                  <span className="info-value">{asset.rating}</span>
                </div>
              </div>
              <div className="info-item">
                <Calendar size={16} className="info-icon" />
                <div>
                  <span className="info-label">上传时间</span>
                  <span className="info-value">
                    {format(new Date(asset.createdAt), 'yyyy-MM-dd')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="panel-section">
            <h3 className="section-title">材质模式</h3>
            <div className="mode-tabs">
              <button
                className={`mode-tab ${materialMode === 'standard' ? 'active' : ''}`}
                onClick={() => handleModeChange('standard')}
              >
                标准
              </button>
              <button
                className={`mode-tab ${materialMode === 'wireframe' ? 'active' : ''}`}
                onClick={() => handleModeChange('wireframe')}
              >
                线框
              </button>
              <button
                className={`mode-tab ${materialMode === 'transparent' ? 'active' : ''}`}
                onClick={() => handleModeChange('transparent')}
              >
                半透明
              </button>
            </div>
            <p className="mode-hint">切换时材质将在1秒内平滑过渡</p>
          </div>

          <div className="panel-section">
            <h3 className="section-title">标签管理</h3>
            <div className="tag-list">
              {asset.tags.map((tag, index) => (
                <span
                  key={tag}
                  className={`detail-tag ${animatingTags.includes(tag) ? 'tag-enter' : ''}`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {tag}
                </span>
              ))}
              {asset.tags.length === 0 && (
                <span className="no-tags">暂无标签</span>
              )}
            </div>
            <div className="tag-input-wrapper">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="输入标签后按回车添加"
                className="tag-input"
              />
              <button
                onClick={handleAddTag}
                className="add-tag-btn"
                disabled={!newTag.trim()}
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          <div className="panel-actions">
            <button className="action-btn primary">
              <Maximize2 size={18} />
              全屏预览
            </button>
            <button className="action-btn secondary">
              分享模型
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
