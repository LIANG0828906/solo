import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Eye, Share2, Clock, Palette, Filter } from 'lucide-react';
import { useAssetStore } from '../asset-store/store';
import type { Asset, TimeRange } from '../asset-store/types';
import { TAG_STYLES } from '../asset-store/types';
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

  const geometries = useMemo(() => [
    <torusKnotGeometry args={[0.6, 0.2, 64, 16]} />,
    <octahedronGeometry args={[0.8, 0]} />,
    <icosahedronGeometry args={[0.7, 0]} />,
    <dodecahedronGeometry args={[0.65, 0]} />,
    <torusGeometry args={[0.6, 0.25, 16, 50]} />,
    <coneGeometry args={[0.6, 1.2, 32]} />,
    <sphereGeometry args={[0.7, 32, 32]} />,
    <boxGeometry args={[1, 1, 1]} />,
  ], []);

  const colors = useMemo(() => ['#3b82f6', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'], []);
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
  height: number;
}

function AssetCard({ asset, index, onClick, height }: AssetCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, index * 80);
    return () => clearTimeout(timer);
  }, [index]);

  const faceCountInK = (asset.faceCount / 1000).toFixed(1);

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/#/asset/${asset.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('分享链接已复制到剪贴板！');
    });
  };

  return (
    <div
      ref={cardRef}
      className={`asset-card masonry-item ${isVisible ? 'visible' : ''} ${isHovered ? 'hovered' : ''}`}
      style={{ height: `${height}px` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className="card-preview" style={{ height: `${height - 120}px` }}>
        <Canvas
          camera={{ position: [0, 0, 3], fov: 50 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          dpr={[1, 1.5]}
        >
          <ambientLight intensity={0.3} />
          <directionalLight position={[3, 3, 3]} intensity={0.8} />
          <pointLight position={[-2, 1, -2]} intensity={0.4} color="#06b6d4" />
          <PreviewGeometry index={index} />
          <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
        </Canvas>

        <div className={`card-overlay ${isHovered ? 'show' : ''}`}>
          <div className="overlay-buttons">
            <button
              className="overlay-btn view-btn pulse-glow"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              <Eye size={18} />
              <span>查看详情</span>
            </button>
            <button className="overlay-btn share-btn pulse-glow" onClick={handleShare}>
              <Share2 size={18} />
              <span>分享</span>
            </button>
          </div>
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

const CARD_WIDTH = 280;
const CARD_GAP = 24;
const MIN_CARD_HEIGHT = 340;
const MAX_CARD_HEIGHT = 420;

interface MasonryLayoutProps {
  assets: Asset[];
  onCardClick: (id: string) => void;
}

function MasonryLayout({ assets, onCardClick }: MasonryLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(4);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const updateColumns = () => {
      const width = containerRef.current?.clientWidth || window.innerWidth;
      if (width >= 1200) setColumns(4);
      else if (width >= 900) setColumns(3);
      else if (width >= 560) setColumns(2);
      else setColumns(1);
      setContainerWidth(width);
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  const cardHeights = useMemo(() => {
    return assets.map(() =>
      Math.floor(Math.random() * (MAX_CARD_HEIGHT - MIN_CARD_HEIGHT)) + MIN_CARD_HEIGHT
    );
  }, [assets]);

  const columnHeights = useMemo(() => {
    const heights = new Array(columns).fill(0);
    const positions: { top: number; left: number }[] = [];

    assets.forEach((_, index) => {
      const shortestCol = heights.indexOf(Math.min(...heights));
      const cardHeight = cardHeights[index];

      positions.push({
        top: heights[shortestCol],
        left: shortestCol * (CARD_WIDTH + CARD_GAP),
      });

      heights[shortestCol] += cardHeight + CARD_GAP;
    });

    return { positions, totalHeight: Math.max(...heights) };
  }, [assets, columns, cardHeights]);

  const containerStyle = useMemo(() => ({
    width: `${columns * CARD_WIDTH + (columns - 1) * CARD_GAP}px`,
    height: `${columnHeights.totalHeight}px`,
    margin: '0 auto',
    position: 'relative' as const,
  }), [columns, columnHeights.totalHeight]);

  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const scrollTop = window.scrollY;
    const viewportHeight = window.innerHeight;
    const buffer = 400;

    const start = Math.max(0, Math.floor((scrollTop - buffer) / MIN_CARD_HEIGHT) * columns);
    const end = Math.min(
      assets.length,
      Math.ceil((scrollTop + viewportHeight + buffer) / MIN_CARD_HEIGHT) * columns + columns
    );

    setVisibleRange({ start, end });
  }, [assets.length, columns]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handleCardClick = (id: string) => {
    useAssetStore.getState().setCurrentAsset(id);
    window.location.hash = `#/asset/${id}`;
  };

  return (
    <div ref={containerRef} className="masonry-container" style={containerStyle}>
      {assets.map((asset, index) => {
        if (index < visibleRange.start || index > visibleRange.end) {
          return (
            <div
              key={asset.id}
              className="masonry-placeholder"
              style={{
                position: 'absolute',
                top: `${columnHeights.positions[index]?.top || 0}px`,
                left: `${columnHeights.positions[index]?.left || 0}px`,
                width: `${CARD_WIDTH}px`,
                height: `${cardHeights[index]}px`,
              }}
            />
          );
        }

        return (
          <div
            key={asset.id}
            style={{
              position: 'absolute',
              top: `${columnHeights.positions[index]?.top || 0}px`,
              left: `${columnHeights.positions[index]?.left || 0}px`,
              width: `${CARD_WIDTH}px`,
            }}
          >
            <AssetCard
              asset={asset}
              index={index}
              onClick={() => handleCardClick(asset.id)}
              height={cardHeights[index]}
            />
          </div>
        );
      })}
    </div>
  );
}

export default function AssetList() {
  const {
    assets,
    getFilteredAssets,
    filterOptions,
    setSearch,
    toggleTagFilter,
    toggleStyleFilter,
    setTimeRange,
    setSortBy,
    getAllStyles,
    clearFilters,
  } = useAssetStore();

  const [searchValue, setSearchValue] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [displayedAssets, setDisplayedAssets] = useState<Asset[]>([]);

  const filteredAssets = getFilteredAssets();
  const allTags = useMemo(() => Array.from(new Set(assets.flatMap((a) => a.tags))).sort(), [assets]);
  const allStyles = getAllStyles();

  const timeRanges: { value: TimeRange | null; label: string }[] = [
    { value: null, label: '全部时间' },
    { value: 'day', label: '今天' },
    { value: 'week', label: '本周' },
    { value: 'month', label: '本月' },
    { value: 'year', label: '今年' },
  ];

  useEffect(() => {
    setIsFiltering(true);
    const timer = setTimeout(() => {
      setDisplayedAssets(filteredAssets);
      setTimeout(() => setIsFiltering(false), 300);
    }, 150);
    return () => clearTimeout(timer);
  }, [filteredAssets]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    setSearch(e.target.value);
  };

  const handleCardClick = (id: string) => {
    useAssetStore.getState().setCurrentAsset(id);
    window.location.hash = `#/asset/${id}`;
  };

  const activeFilterCount =
    filterOptions.tags.length +
    filterOptions.styles.length +
    (filterOptions.timeRange ? 1 : 0) +
    (filterOptions.search ? 1 : 0);

  return (
    <div className="asset-list-page">
      <header className="list-header">
        <div className="header-content">
          <div>
            <h1 className="page-title">模型资产库</h1>
            <p className="page-subtitle">管理你的3D模型收藏 · 共 {assets.length} 个模型</p>
          </div>
          <button
            className={`filter-toggle ${showFilters || activeFilterCount > 0 ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} />
            {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
          </button>
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

        <div className={`filter-bar ${showFilters ? 'expanded' : ''}`}>
          <div className="filter-section">
            <div className="filter-label">
              <Palette size={14} />
              <span>风格筛选</span>
            </div>
            <div className="filter-tags">
              {allStyles.map((style) => (
                <button
                  key={style}
                  className={`filter-tag ${filterOptions.styles.includes(style) ? 'active' : ''}`}
                  onClick={() => toggleStyleFilter(style)}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <div className="filter-label">
              <Clock size={14} />
              <span>时间筛选</span>
            </div>
            <div className="filter-tags">
              {timeRanges.map((range) => (
                <button
                  key={range.label}
                  className={`filter-tag ${filterOptions.timeRange === range.value ? 'active' : ''}`}
                  onClick={() => setTimeRange(range.value)}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <div className="filter-label">标签筛选</div>
            <div className="filter-tags">
              {allTags.slice(0, 15).map((tag) => (
                <button
                  key={tag}
                  className={`filter-tag ${filterOptions.tags.includes(tag) ? 'active' : ''}`}
                  onClick={() => toggleTagFilter(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-actions">
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

            {activeFilterCount > 0 && (
              <button className="clear-filters-btn" onClick={clearFilters}>
                清除筛选
              </button>
            )}
          </div>
        </div>
      </header>

      <div className={`asset-grid-wrapper ${isFiltering ? 'fading' : ''}`}>
        <MasonryLayout assets={displayedAssets} onCardClick={handleCardClick} />
      </div>

      {displayedAssets.length === 0 && !isFiltering && (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <p className="empty-text">暂无匹配的模型</p>
          <p className="empty-hint">尝试调整筛选条件或上传新模型</p>
        </div>
      )}
    </div>
  );
}
