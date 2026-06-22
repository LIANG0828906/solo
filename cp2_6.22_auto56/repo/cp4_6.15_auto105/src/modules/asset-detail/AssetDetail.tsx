import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { ArrowLeft, Star, Calendar, FileType, Layers, Maximize2, Plus, Activity, X } from 'lucide-react';
import { useAssetStore } from '../asset-store/store';
import type { MaterialMode } from '../asset-store/types';
import { format } from 'date-fns';
import './AssetDetail.css';

type LODLevel = 'high' | 'medium' | 'low';
type LoadingQuality = 'high' | 'medium' | 'low' | 'placeholder';

interface PerformanceStats {
  fps: number;
  loadTime: number | null;
  faceCount: number;
  lodLevel: LODLevel;
  status: 'loading' | 'loaded' | 'degraded';
}

interface SimplifyInfo {
  originalFaces: number;
  simplifiedFaces: number;
  reductionPercent: number;
  showHint: boolean;
}

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
  onStatsUpdate?: (stats: PerformanceStats) => void;
  onSimplify?: (info: SimplifyInfo) => void;
  loadingQuality: LoadingQuality;
  onQualityChange?: (quality: LoadingQuality) => void;
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

function calculateFaceCount(geometry: THREE.BufferGeometry): number {
  const position = geometry.getAttribute('position');
  if (!position) return 0;
  return position.count / 3;
}

function simplifyGeometry(geometry: THREE.BufferGeometry, targetRatio: number): THREE.BufferGeometry {
  const positionAttr = geometry.getAttribute('position');
  const originalCount = positionAttr.count;
  const targetCount = Math.floor(originalCount * targetRatio);
  
  if (targetCount >= originalCount || targetCount < 3) {
    return geometry.clone();
  }

  const newGeometry = new THREE.BufferGeometry();
  const newPositions = new Float32Array(targetCount * 3);
  
  const step = originalCount / targetCount;
  for (let i = 0; i < targetCount; i++) {
    const srcIndex = Math.floor(i * step);
    newPositions[i * 3] = positionAttr.getX(srcIndex);
    newPositions[i * 3 + 1] = positionAttr.getY(srcIndex);
    newPositions[i * 3 + 2] = positionAttr.getZ(srcIndex);
  }
  
  newGeometry.setAttribute('position', new THREE.BufferAttribute(newPositions, 3));
  newGeometry.computeVertexNormals();
  
  return newGeometry;
}

function DetailModel({ materialMode, modelUrl, onLoad, onStatsUpdate, onSimplify, loadingQuality, onQualityChange }: DetailModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const physicalMaterialRef = useRef<THREE.MeshPhysicalMaterial | null>(null);
  const wireframeMaterialRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const { camera } = useThree();
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [lodLevel, setLodLevel] = useState<LODLevel>('high');
  const [faceCount, setFaceCount] = useState(0);
  
  const loadStartTime = useRef(performance.now());
  const hasTimedOut = useRef(false);
  const hasReportedSimplify = useRef(false);
  
  const currentState = useRef<MaterialState>(getTargetMaterialState(materialMode));
  const targetState = useRef<MaterialState>(getTargetMaterialState(materialMode));
  const transitionProgress = useRef(1);
  const previousMode = useRef<MaterialMode>(materialMode);
  
  const frameCount = useRef(0);
  const lastFpsUpdate = useRef(performance.now());
  const currentFps = useRef(60);

  const highDetailGeometry = useMemo(() => {
    const geo = new THREE.TorusKnotGeometry(1.2, 0.4, 128, 32);
    return geo;
  }, []);

  const mediumDetailGeometry = useMemo(() => {
    const geo = new THREE.TorusKnotGeometry(1.2, 0.4, 64, 16);
    return geo;
  }, []);

  const lowDetailGeometry = useMemo(() => {
    const geo = new THREE.TorusKnotGeometry(1.2, 0.4, 32, 8);
    return geo;
  }, []);

  const placeholderGeometry = useMemo(() => {
    return new THREE.BoxGeometry(1.5, 1.5, 1.5);
  }, []);

  const getCurrentGeometry = useCallback(() => {
    if (loadingQuality === 'placeholder') return placeholderGeometry;
    switch (lodLevel) {
      case 'high': return highDetailGeometry;
      case 'medium': return mediumDetailGeometry;
      case 'low': return lowDetailGeometry;
      default: return highDetailGeometry;
    }
  }, [loadingQuality, lodLevel, highDetailGeometry, mediumDetailGeometry, lowDetailGeometry, placeholderGeometry]);

  useEffect(() => {
    if (materialMode !== previousMode.current) {
      previousMode.current = materialMode;
      currentState.current = getTargetMaterialState(previousMode.current);
      targetState.current = getTargetMaterialState(materialMode);
      transitionProgress.current = 0;
    }
  }, [materialMode]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!isLoaded) {
        hasTimedOut.current = true;
        onQualityChange?.('low');
      }
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [isLoaded, onQualityChange]);

  useEffect(() => {
    const geo = getCurrentGeometry();
    const faces = calculateFaceCount(geo);
    setFaceCount(faces);

    if (isLoaded && !hasReportedSimplify.current && faces > 50000) {
      hasReportedSimplify.current = true;
      const simplifiedGeo = simplifyGeometry(geo, 0.5);
      const simplifiedFaces = calculateFaceCount(simplifiedGeo);
      const reductionPercent = Math.round((1 - simplifiedFaces / faces) * 100);
      
      onSimplify?.({
        originalFaces: faces,
        simplifiedFaces: simplifiedFaces,
        reductionPercent,
        showHint: true,
      });
      
      simplifiedGeo.dispose();
    }
  }, [getCurrentGeometry, isLoaded, onSimplify]);

  useEffect(() => {
    const state = getTargetMaterialState(materialMode);
    if (physicalMaterialRef.current) {
      physicalMaterialRef.current.transparent = state.transparent || state.wireframe;
      physicalMaterialRef.current.opacity = state.wireframe ? 0 : state.opacity;
      physicalMaterialRef.current.metalness = state.metalness;
      physicalMaterialRef.current.roughness = state.roughness;
      physicalMaterialRef.current.transmission = state.transmission;
      physicalMaterialRef.current.color.copy(state.color);
      physicalMaterialRef.current.emissive.copy(state.emissive);
      physicalMaterialRef.current.emissiveIntensity = state.emissiveIntensity;
      physicalMaterialRef.current.needsUpdate = true;
    }
    if (wireframeMaterialRef.current) {
      wireframeMaterialRef.current.opacity = state.wireframe ? state.opacity : 0;
      wireframeMaterialRef.current.color.copy(state.color);
      wireframeMaterialRef.current.needsUpdate = true;
    }
  }, []);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.1;
    }

    if (meshRef.current) {
      const distance = camera.position.distanceTo(meshRef.current.position);
      
      let newLodLevel: LODLevel;
      if (distance < 5) {
        newLodLevel = 'high';
      } else if (distance < 10) {
        newLodLevel = 'medium';
      } else {
        newLodLevel = 'low';
      }
      
      if (newLodLevel !== lodLevel && loadingQuality !== 'placeholder') {
        setLodLevel(newLodLevel);
      }
    }

    if (transitionProgress.current < 1) {
      transitionProgress.current = Math.min(transitionProgress.current + delta, 1);
      const t = transitionProgress.current;
      const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      const current = currentState.current;
      const target = targetState.current;

      const currentIsWireframe = current.wireframe;
      const targetIsWireframe = target.wireframe;

      const metalness = current.metalness + (target.metalness - current.metalness) * easeT;
      const roughness = current.roughness + (target.roughness - current.roughness) * easeT;
      const transmission = current.transmission + (target.transmission - current.transmission) * easeT;
      const emissiveIntensity = current.emissiveIntensity + (target.emissiveIntensity - current.emissiveIntensity) * easeT;
      const color = current.color.clone().lerp(target.color, easeT);
      const emissive = current.emissive.clone().lerp(target.emissive, easeT);

      const targetPhysicalOpacity = targetIsWireframe ? 0 : target.opacity;
      const currentPhysicalOpacity = currentIsWireframe ? 0 : current.opacity;
      const physicalOpacity = currentPhysicalOpacity + (targetPhysicalOpacity - currentPhysicalOpacity) * easeT;

      const targetWireframeOpacity = targetIsWireframe ? target.opacity : 0;
      const currentWireframeOpacity = currentIsWireframe ? current.opacity : 0;
      const wireframeOpacity = currentWireframeOpacity + (targetWireframeOpacity - currentWireframeOpacity) * easeT;

      const needsTransparent = physicalOpacity < 1 || wireframeOpacity > 0;

      if (physicalMaterialRef.current) {
        physicalMaterialRef.current.transparent = needsTransparent;
        physicalMaterialRef.current.opacity = physicalOpacity;
        physicalMaterialRef.current.metalness = metalness;
        physicalMaterialRef.current.roughness = roughness;
        physicalMaterialRef.current.transmission = transmission;
        physicalMaterialRef.current.color.copy(color);
        physicalMaterialRef.current.emissive.copy(emissive);
        physicalMaterialRef.current.emissiveIntensity = emissiveIntensity;
        physicalMaterialRef.current.needsUpdate = true;
      }

      if (wireframeMaterialRef.current) {
        wireframeMaterialRef.current.opacity = wireframeOpacity;
        wireframeMaterialRef.current.color.copy(color);
        wireframeMaterialRef.current.needsUpdate = true;
      }
    }

    frameCount.current++;
    const now = performance.now();
    if (now - lastFpsUpdate.current >= 500) {
      const elapsed = (now - lastFpsUpdate.current) / 1000;
      currentFps.current = Math.round(frameCount.current / elapsed);
      frameCount.current = 0;
      lastFpsUpdate.current = now;

      const loadTime = isLoaded ? now - loadStartTime.current : null;
      const status: PerformanceStats['status'] = hasTimedOut.current ? 'degraded' : isLoaded ? 'loaded' : 'loading';
      
      onStatsUpdate?.({
        fps: currentFps.current,
        loadTime,
        faceCount,
        lodLevel,
        status,
      });
    }

    if (!isLoaded) {
      setIsLoaded(true);
      onLoad?.();
      if (hasTimedOut.current) {
        onQualityChange?.('medium');
      }
    }
  });

  const currentGeometry = getCurrentGeometry();
  const castShadow = loadingQuality !== 'low' && loadingQuality !== 'placeholder';
  const receiveShadow = loadingQuality !== 'low' && loadingQuality !== 'placeholder';

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef} geometry={currentGeometry} castShadow={castShadow} receiveShadow={receiveShadow}>
        <meshPhysicalMaterial
          ref={physicalMaterialRef}
          color="#3b82f6"
          metalness={loadingQuality === 'low' || loadingQuality === 'placeholder' ? 0.2 : 0.4}
          roughness={loadingQuality === 'low' || loadingQuality === 'placeholder' ? 0.5 : 0.3}
          emissive="#1e3a5f"
          emissiveIntensity={loadingQuality === 'low' || loadingQuality === 'placeholder' ? 0.1 : 0.3}
        />
      </mesh>
      <mesh geometry={currentGeometry}>
        <meshBasicMaterial
          ref={wireframeMaterialRef}
          color="#3b82f6"
          wireframe
          transparent
          opacity={0}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </mesh>
    </group>
  );
}

interface DetailViewerProps {
  materialMode: MaterialMode;
  modelUrl?: string;
  onLoad?: () => void;
  onStatsUpdate?: (stats: PerformanceStats) => void;
  onSimplify?: (info: SimplifyInfo) => void;
  loadingQuality: LoadingQuality;
  onQualityChange?: (quality: LoadingQuality) => void;
}

function DetailViewer({ materialMode, modelUrl, onLoad, onStatsUpdate, onSimplify, loadingQuality, onQualityChange }: DetailViewerProps) {
  const shadowMapSize = loadingQuality === 'low' || loadingQuality === 'placeholder' ? [512, 512] : [2048, 2048];
  const shadowsEnabled = loadingQuality !== 'low' && loadingQuality !== 'placeholder';

  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 45 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      dpr={loadingQuality === 'low' || loadingQuality === 'placeholder' ? [1, 1] : [1, 2]}
    >
      <color attach="background" args={['#1a1a2e']} />
      <fog attach="fog" args={['#1a1a2e', 8, 20]} />

      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[5, 5, 5]} 
        intensity={1.2} 
        castShadow={shadowsEnabled} 
        shadow-mapSize={shadowMapSize} 
      />
      <pointLight position={[-5, 3, -5]} intensity={0.6} color="#06b6d4" />
      <pointLight position={[5, -2, 5]} intensity={0.4} color="#3b82f6" />
      <pointLight position={[0, 5, 0]} intensity={0.3} color="#ec4899" />

      <DetailModel 
        materialMode={materialMode} 
        modelUrl={modelUrl} 
        onLoad={onLoad}
        onStatsUpdate={onStatsUpdate}
        onSimplify={onSimplify}
        loadingQuality={loadingQuality}
        onQualityChange={onQualityChange}
      />

      <ContactShadows
        position={[0, -2, 0]}
        opacity={shadowsEnabled ? 0.4 : 0.1}
        scale={10}
        blur={shadowsEnabled ? 2 : 0}
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
  const [showPerformanceHUD, setShowPerformanceHUD] = useState(false);
  const [loadingQuality, setLoadingQuality] = useState<LoadingQuality>('high');
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats>({
    fps: 0,
    loadTime: null,
    faceCount: 0,
    lodLevel: 'high',
    status: 'loading',
  });
  const [simplifyInfo, setSimplifyInfo] = useState<SimplifyInfo | null>(null);
  const [showSimplifyHint, setShowSimplifyHint] = useState(false);
  const loadStartTime = useRef(Date.now());
  const asset = getCurrentAsset();

  useEffect(() => {
    loadStartTime.current = Date.now();
    setLoadingQuality('high');
    setSimplifyInfo(null);
    setShowSimplifyHint(false);
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

  const handleStatsUpdate = useCallback((stats: PerformanceStats) => {
    setPerformanceStats(stats);
  }, []);

  const handleSimplify = useCallback((info: SimplifyInfo) => {
    setSimplifyInfo(info);
    setShowSimplifyHint(true);
    setTimeout(() => setShowSimplifyHint(false), 5000);
  }, []);

  const handleQualityChange = useCallback((quality: LoadingQuality) => {
    setLoadingQuality(quality);
  }, []);

  const getStatusText = () => {
    switch (performanceStats.status) {
      case 'loading': return '加载中';
      case 'loaded': return '已加载';
      case 'degraded': return '降级模式';
      default: return '未知';
    }
  };

  const getLODText = () => {
    switch (performanceStats.lodLevel) {
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return '未知';
    }
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
  const showDegradedHint = loadingQuality === 'low' || loadingQuality === 'placeholder';

  return (
    <div className="detail-page">
      <button onClick={goBack} className="back-button">
        <ArrowLeft size={18} />
        返回列表
      </button>

      <div className="detail-container">
        <div className="detail-viewer">
          <DetailViewer 
            materialMode={materialMode} 
            modelUrl={asset.modelUrl} 
            onLoad={handleLoad}
            onStatsUpdate={handleStatsUpdate}
            onSimplify={handleSimplify}
            loadingQuality={loadingQuality}
            onQualityChange={handleQualityChange}
          />
          <div className="viewer-badge">
            <Maximize2 size={14} />
            可拖拽旋转 · 滚轮缩放
          </div>
          
          <button 
            className="performance-toggle-btn"
            onClick={() => setShowPerformanceHUD(!showPerformanceHUD)}
            title="切换性能监控"
          >
            <Activity size={16} />
          </button>

          {showPerformanceHUD && (
            <div className="performance-hud">
              <button 
                className="hud-close-btn"
                onClick={() => setShowPerformanceHUD(false)}
              >
                <X size={14} />
              </button>
              <div className="hud-title">性能监控</div>
              <div className="hud-row">
                <span className="hud-label">FPS</span>
                <span className="hud-value">{performanceStats.fps}</span>
              </div>
              <div className="hud-row">
                <span className="hud-label">加载时间</span>
                <span className="hud-value">
                  {performanceStats.loadTime !== null 
                    ? `${Math.round(performanceStats.loadTime)}ms` 
                    : '--'}
                </span>
              </div>
              <div className="hud-row">
                <span className="hud-label">面数</span>
                <span className="hud-value">{(performanceStats.faceCount / 1000).toFixed(1)}k</span>
              </div>
              <div className="hud-row">
                <span className="hud-label">LOD层级</span>
                <span className="hud-value">{getLODText()}</span>
              </div>
              <div className="hud-row">
                <span className="hud-label">状态</span>
                <span className={`hud-value hud-status-${performanceStats.status}`}>
                  {getStatusText()}
                </span>
              </div>
            </div>
          )}

          {showDegradedHint && (
            <div className="degraded-hint">
              加载较慢，已启用低质量模式
            </div>
          )}

          {showSimplifyHint && simplifyInfo && (
            <div className="simplify-hint">
              模型已优化，面数减少 {simplifyInfo.reductionPercent}%
            </div>
          )}

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
