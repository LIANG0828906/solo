import { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { ArrowLeft, Star, Calendar, FileType, Layers, Maximize2, Plus } from 'lucide-react';
import { useAssetStore } from '../asset-store/store';
import type { MaterialMode } from '../asset-store/types';
import { format } from 'date-fns';
import './AssetDetail.css';

interface DetailModelProps {
  materialMode: MaterialMode;
}

function DetailModel({ materialMode }: DetailModelProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
    }
  });

  const getMaterial = () => {
    switch (materialMode) {
      case 'wireframe':
        return (
          <meshBasicMaterial
            color="#3b82f6"
            wireframe
            transparent
            opacity={0.9}
          />
        );
      case 'transparent':
        return (
          <meshPhysicalMaterial
            color="#60a5fa"
            transparent
            opacity={0.35}
            metalness={0.1}
            roughness={0.2}
            transmission={0.6}
            thickness={0.5}
          />
        );
      case 'standard':
      default:
        return (
          <meshStandardMaterial
            color="#3b82f6"
            metalness={0.4}
            roughness={0.3}
            emissive="#1e3a5f"
            emissiveIntensity={0.3}
          />
        );
    }
  };

  return (
    <mesh ref={meshRef}>
      <torusKnotGeometry args={[1.2, 0.4, 128, 32]} />
      {getMaterial()}
    </mesh>
  );
}

interface DetailViewerProps {
  materialMode: MaterialMode;
  onLoad?: () => void;
}

function DetailViewer({ materialMode }: DetailViewerProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 45 }}
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 2]}
    >
      <color attach="background" args={['#1a1a2e']} />
      <fog attach="fog" args={['#1a1a2e', 8, 20]} />

      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} castShadow />
      <pointLight position={[-5, 3, -5]} intensity={0.6} color="#06b6d4" />
      <pointLight position={[5, -2, 5]} intensity={0.4} color="#3b82f6" />
      <pointLight position={[0, 5, 0]} intensity={0.3} color="#ec4899" />

      <DetailModel materialMode={materialMode} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <shadowMaterial transparent opacity={0.3} />
      </mesh>

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
  const asset = getCurrentAsset();

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

    addTag(asset.id, newTag.trim());
    setAnimatingTags([...animatingTags, newTag.trim()]);
    setNewTag('');

    setTimeout(() => {
      setAnimatingTags((prev) => prev.filter((t) => t !== newTag.trim()));
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
          <DetailViewer materialMode={materialMode} />
          <div className="viewer-badge">
            <Maximize2 size={14} />
            可拖拽旋转 · 滚轮缩放
          </div>
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
