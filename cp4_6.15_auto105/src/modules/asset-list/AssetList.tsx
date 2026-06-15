import { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Eye, Share2 } from 'lucide-react';
import { useAssetStore } from '../asset-store/store';
import type { Asset } from '../asset-store/types';
import './AssetList.css';

interface PreviewGeometryProps {
  index: number;
}

function PreviewGeometry({ index }: PreviewGeometryProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const scaleRef = useRef(0);
  const targetScale = 1;

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3 + index) * 0.2;

      if (scaleRef.current < targetScale) {
        scaleRef.current = Math.min(scaleRef.current + delta * 2, targetScale);
        meshRef.current.scale.setScalar(scaleRef.current);
      }
    }
  });

  const geometries = [
    <torusKnotGeometry args={[0.6, 0.2, 64, 16]} />,
    <octahedronGeometry args={[0.8, 0]} />,
    <icosahedronGeometry args={[0.7, 0]} />,
    <dodecahedronGeometry args={[0.65, 0]} />,
    <torusGeometry args={[0.6, 0.25, 16, 50]} />,
    <coneGeometry args={[0.6, 1.2, 32]} />,
    <sphereGeometry args={[0.7, 32, 32]} />,
    <boxGeometry args={[1, 1, 1]} />,
  ];

  const colors = ['#3b82f6', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
  const color = colors[index % colors.length];
  const geometry = geometries[index % geometries.length];

  return (
    <mesh ref={meshRef} scale={0}>
      {geometry}
      <meshStandardMaterial
        color={color}
        metalness={0.3}
        roughness={0.4}
        emissive={color}
        emissiveIntensity={0.1}
      />
    </mesh>
  );
}

interface AssetCardProps {
  asset: Asset;
  index: number;
  onClick: () => void;
}

function AssetCard({ asset, index, onClick }: AssetCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, index * 100);
    return () => clearTimeout(timer);
  }, [index]);

  const faceCountInK = (asset.faceCount / 1000).toFixed(1);

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/asset/${asset.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('分享链接已复制到剪贴板！');
    });
  };

  return (
    <div
      ref={cardRef}
      className={`asset-card ${isVisible ? 'visible' : ''} ${isHovered ? 'hovered' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className="card-preview">
        <Canvas
          camera={{ position: [0, 0, 3], fov: 50 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 1.5]}
        >
          <ambientLight intensity={0.3} />
          <directionalLight position={[3, 3, 3]} intensity={0.8} />
          <pointLight position={[-2, 1, -2]} intensity={0.4} color="#06b6d4" />
          <PreviewGeometry index={index} />
          <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
        </Canvas>

        <div className={`card-overlay ${isHovered ? 'show' : ''}`}>
          <button
            className="overlay-btn view-btn"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <Eye size={18} />
            <span>查看详情</span>
          </button>
          <button className="overlay-btn share-btn" onClick={handleShare}>
            <Share2 size={18} />
            <span>分享</span>
          </button>
        </div>

        <div className="light-spot" />
      </div>

      <div className="card-info">
        <h3 className="card-title">{asset.name}</h3>
        <div className="card-meta">
          <span className="meta-item">{faceCountInK}k 面</span>
          <span className="meta-dot">·</span>
          <span className="meta-item">{asset.size}</span>
          <span className="meta-dot">·</span>
          <span className="meta-item">{asset.format.toUpperCase()}</span>
        </div>
        <div className="card-tags">
          {asset.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
          {asset.tags.length > 3 && (
            <span className="tag tag-more">+{asset.tags.length - 3}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AssetList() {
  const { assets, getFilteredAssets, filterOptions, setSearch, toggleTagFilter, setSortBy } =
    useAssetStore();
  const [searchValue, setSearchValue] = useState('');

  const filteredAssets = getFilteredAssets();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    setSearch(e.target.value);
  };

  const allTags = Array.from(new Set(assets.flatMap((a) => a.tags))).sort();

  const handleCardClick = (id: string) => {
    useAssetStore.getState().setCurrentAsset(id);
    window.location.hash = `#/asset/${id}`;
  };

  return (
    <div className="asset-list-page">
      <header className="list-header">
        <div className="header-content">
          <h1 className="page-title">模型资产库</h1>
          <p className="page-subtitle">管理你的3D模型收藏</p>
        </div>

        <div className="search-bar">
          <input
            type="text"
            placeholder="搜索模型名称或标签..."
            value={searchValue}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>

        <div className="filter-bar">
          <div className="filter-tags">
            {allTags.slice(0, 10).map((tag) => (
              <button
                key={tag}
                className={`filter-tag ${filterOptions.tags.includes(tag) ? 'active' : ''}`}
                onClick={() => toggleTagFilter(tag)}
              >
                {tag}
              </button>
            ))}
          </div>

          <select
            className="sort-select"
            value={filterOptions.sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof filterOptions.sortBy)}
          >
            <option value="newest">最新上传</option>
            <option value="oldest">最早上传</option>
            <option value="name">名称排序</option>
            <option value="rating">评分排序</option>
          </select>
        </div>
      </header>

      <div className="asset-grid">
        {filteredAssets.map((asset, index) => (
          <AssetCard
            key={asset.id}
            asset={asset}
            index={index}
            onClick={() => handleCardClick(asset.id)}
          />
        ))}
      </div>

      {filteredAssets.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <p className="empty-text">暂无匹配的模型</p>
          <p className="empty-hint">尝试调整筛选条件或上传新模型</p>
        </div>
      )}
    </div>
  );
}
