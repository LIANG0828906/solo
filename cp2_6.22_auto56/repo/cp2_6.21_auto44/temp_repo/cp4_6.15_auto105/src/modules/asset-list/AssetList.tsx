import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Eye, Share2, Clock, Palette, Filter, Gauge } from 'lucide-react';
import { useAssetStore } from '../asset-store/store';
import type { Asset, TimeRange } from '../asset-store/types';
import { FPSPanel } from './FPSPanel';
import { useFPSMonitor } from '../../hooks/useFPSMonitor';
import './AssetList.css';

interface PreviewGeometryProps {
  index: number;
  quality?: 'high' | 'low';
}

function PreviewGeometry({ index, quality = 'high' }: PreviewGeometryProps) {
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

  const highPolyGeometries = useMemo(() => [
    <torusKnotGeometry key="tk" args={[0.6, 0.2, 64, 16]} />,
    <octahedronGeometry key="oct" args={[0.8, 0]} />,
    <icosahedronGeometry key="ico" args={[0.7, 0]} />,
    <dodecahedronGeometry key="dod" args={[0.65, 0]} />,
    <torusGeometry key="tor" args={[0.6, 0.25, 16, 50]} />,
    <coneGeometry key="con" args={[0.6, 1.2, 32]} />,
    <sphereGeometry key="sph" args={[0.7, 32, 32]} />,
    <boxGeometry key="box" args={[1, 1, 1]} />,
  ], []);

  const lowPolyGeometries = useMemo(() => [
    <torusKnotGeometry key="tk-l" args={[0.6, 0.2, 16, 4]} />,
    <octahedronGeometry key="oct-l" args={[0.8, 2]} />,
    <icosahedronGeometry key="ico-l" args={[0.7, 1]} />,
    <dodecahedronGeometry key="dod-l" args={[0.65, 0]} />,
    <torusGeometry key="tor-l" args={[0.6, 0.25, 8, 16]} />,
    <coneGeometry key="con-l" args={[0.6, 1.2, 8]} />,
    <sphereGeometry key="sph-l" args={[0.7, 8, 8]} />,
    <boxGeometry key="box-l" args={[1, 1, 1]} />,
  ], []);

  const colors = useMemo(() => ['#3b82f6', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'], []);
  const color = colors[index % colors.length];
  const geometries = quality === 'high' ? highPolyGeometries : lowPolyGeometries;
  const geometry = geometries[index % geometries.length];

  const materialProps = quality === 'high'
    ? { metalness: 0.3, roughness: 0.4, emissiveIntensity: 0.1 }
    : { metalness: 0.1, roughness: 0.6, emissiveIntensity: 0.05 };

  return (
    <mesh ref={meshRef} scale={0}>
      {geometry}
      <meshStandardMaterial
        color={color}
        {...materialProps}
        emissive={color}
      />
    </mesh>
  );
}

interface AssetCardProps {
  asset: Asset;
  index: number;
  onClick: () => void;
  height: number;
  performanceMode: boolean;
  isInViewport: boolean;
  animationDelay?: number;
}

function CardSkeleton({ height }: { height: number }) {
  return (
    <div className="card-skeleton" style={{ height: `${height}px` }}>
      <div className="skeleton-preview" style={{ height: `${height - 120}px` }}>
        <div className="skeleton-shine" />
      </div>
      <div className="skeleton-info">
        <div className="skeleton-line skeleton-title" />
        <div className="skeleton-line skeleton-meta" />
        <div className="skeleton-tags">
          <div className="skeleton-tag" />
          <div className="skeleton-tag" />
          <div className="skeleton-tag" />
        </div>
      </div>
    </div>
  );
}

function StaticThumbnail({ index, height }: { index: number; height: number }) {
  const colors = ['#3b82f6', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
  const color = colors[index % colors.length];
  const icons = ['⬡', '◇', '○', '△', '⬢', '□', '◎', '▽'];
  const icon = icons[index % icons.length];

  return (
    <div
      className="static-thumbnail"
      style={{
        height: `${height - 120}px`,
        background: `linear-gradient(135deg, ${color}20 0%, ${color}05 100%)`,
      }}
    >
      <div
        className="thumbnail-icon"
        style={{ color }}
      >
        {icon}
      </div>
    </div>
  );
}

function AssetCard({
  asset,
  index,
  onClick,
  height,
  performanceMode,
  isInViewport,
  animationDelay = 0,
}: AssetCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender3D, setShouldRender3D] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const hasEnteredViewport = useRef(false);

  useEffect(() => {
    if (isInViewport && !hasEnteredViewport.current) {
      hasEnteredViewport.current = true;
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, animationDelay);
      return () => clearTimeout(timer);
    }
  }, [isInViewport, animationDelay]);

  useEffect(() => {
    if (isInViewport && !performanceMode) {
      const timer = setTimeout(() => {
        setShouldRender3D(true);
      }, 100 + index * 20);
      return () => clearTimeout(timer);
    } else if (!isInViewport) {
      setShouldRender3D(false);
    }
  }, [isInViewport, performanceMode, index]);

  const faceCountInK = (asset.faceCount / 1000).toFixed(1);

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/#/asset/${asset.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('分享链接已复制到剪贴板！');
    });
  };

  const previewHeight = height - 120;

  return (
    <div
      ref={cardRef}
      className={`asset-card masonry-item ${isVisible ? 'visible' : ''} ${isHovered ? 'hovered' : ''} ${performanceMode ? 'performance-mode' : ''}`}
      style={{ height: `${height}px` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className="card-preview" style={{ height: `${previewHeight}px` }}>
        {!hasEnteredViewport.current ? (
          <CardSkeleton height={height} />
        ) : performanceMode ? (
          <StaticThumbnail index={index} height={height} />
        ) : shouldRender3D ? (
          <Canvas
            camera={{ position: [0, 0, 3], fov: 50 }}
            gl={{ antialias: false, alpha: true, powerPreference: 'default' }}
            dpr={[1, 1]}
            frameloop="demand"
          >
            <ambientLight intensity={0.3} />
            <directionalLight position={[3, 3, 3]} intensity={0.8} />
            <pointLight position={[-2, 1, -2]} intensity={0.4} color="#06b6d4" />
            <PreviewGeometry index={index} quality="low" />
            <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.3} />
          </Canvas>
        ) : (
          <StaticThumbnail index={index} height={height} />
        )}

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
const VIRTUAL_BUFFER = 800;
const SCROLL_DEBOUNCE_MS = 16;

interface MasonryLayoutProps {
  assets: Asset[];
  onCardClick: (id: string) => void;
  performanceMode: boolean;
}

function MasonryLayout({ assets, onCardClick, performanceMode }: MasonryLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(4);
  const rafIdRef = useRef<number | null>(null);
  const lastScrollTimeRef = useRef(0);
  const visibleSetRef = useRef<Set<number>>(new Set());

  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });

  useEffect(() => {
    const updateColumns = () => {
      const width = containerRef.current?.clientWidth || window.innerWidth;
      if (width >= 1200) setColumns(4);
      else if (width >= 900) setColumns(3);
      else if (width >= 560) setColumns(2);
      else setColumns(1);
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
    const positions: { top: number; left: number; height: number }[] = [];
    const columnCards: { index: number; top: number; height: number }[][] = Array.from(
      { length: columns },
      () => []
    );

    assets.forEach((_, index) => {
      const shortestCol = heights.indexOf(Math.min(...heights));
      const cardHeight = cardHeights[index];
      const top = heights[shortestCol];

      positions.push({
        top,
        left: shortestCol * (CARD_WIDTH + CARD_GAP),
        height: cardHeight,
      });

      columnCards[shortestCol].push({ index, top, height: cardHeight });

      heights[shortestCol] += cardHeight + CARD_GAP;
    });

    return { positions, totalHeight: Math.max(...heights), columnCards };
  }, [assets, columns, cardHeights]);

  const containerStyle = useMemo(() => ({
    width: `${columns * CARD_WIDTH + (columns - 1) * CARD_GAP}px`,
    height: `${columnHeights.totalHeight}px`,
    margin: '0 auto',
    position: 'relative' as const,
  }), [columns, columnHeights.totalHeight]);

  const findVisibleIndicesInColumn = useCallback(
    (
      colCards: { index: number; top: number; height: number }[],
      scrollTop: number,
      viewportHeight: number,
      buffer: number
    ): number[] => {
      if (colCards.length === 0) return [];

      const visibleTop = scrollTop - buffer;
      const visibleBottom = scrollTop + viewportHeight + buffer;

      let left = 0;
      let right = colCards.length - 1;
      let startIdx = colCards.length;

      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        const card = colCards[mid];
        if (card.top + card.height > visibleTop) {
          startIdx = mid;
          right = mid - 1;
        } else {
          left = mid + 1;
        }
      }

      left = 0;
      right = colCards.length - 1;
      let endIdx = -1;

      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        const card = colCards[mid];
        if (card.top < visibleBottom) {
          endIdx = mid;
          left = mid + 1;
        } else {
          right = mid - 1;
        }
      }

      if (startIdx > endIdx) return [];

      const indices: number[] = [];
      for (let i = startIdx; i <= endIdx; i++) {
        indices.push(colCards[i].index);
      }
      return indices;
    },
    []
  );

  const calculateVisibleRange = useCallback(() => {
    if (!containerRef.current) return;

    const scrollTop = window.scrollY;
    const viewportHeight = window.innerHeight;
    const buffer = VIRTUAL_BUFFER;

    let minIndex = assets.length;
    let maxIndex = -1;

    const newVisibleSet = new Set<number>();

    for (const colCards of columnHeights.columnCards) {
      const visibleIndices = findVisibleIndicesInColumn(
        colCards,
        scrollTop,
        viewportHeight,
        buffer
      );
      if (visibleIndices.length > 0) {
        minIndex = Math.min(minIndex, visibleIndices[0]);
        maxIndex = Math.max(maxIndex, visibleIndices[visibleIndices.length - 1]);
        visibleIndices.forEach(idx => newVisibleSet.add(idx));
      }
    }

    visibleSetRef.current = newVisibleSet;

    if (maxIndex === -1) {
      setVisibleRange({ start: 0, end: 0 });
    } else {
      setVisibleRange({ start: minIndex, end: maxIndex });
    }
  }, [assets.length, columnHeights.columnCards, findVisibleIndicesInColumn]);

  const handleScroll = useCallback(() => {
    const now = performance.now();
    if (now - lastScrollTimeRef.current < SCROLL_DEBOUNCE_MS) {
      return;
    }
    lastScrollTimeRef.current = now;

    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }

    rafIdRef.current = requestAnimationFrame(() => {
      calculateVisibleRange();
    });
  }, [calculateVisibleRange]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    calculateVisibleRange();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [handleScroll, calculateVisibleRange]);

  useEffect(() => {
    calculateVisibleRange();
  }, [calculateVisibleRange, columnHeights.totalHeight]);

  const handleCardClick = (id: string) => {
    onCardClick(id);
  };

  const isIndexInViewport = (index: number): boolean => {
    return visibleSetRef.current.has(index);
  };

  return (
    <div ref={containerRef} className="masonry-container" style={containerStyle}>
      {assets.map((asset, index) => {
        const isVisible = index >= visibleRange.start && index <= visibleRange.end;

        if (!isVisible) {
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

        const inViewport = isIndexInViewport(index);

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
              performanceMode={performanceMode}
              isInViewport={inViewport}
              animationDelay={index * 30}
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
  const [performanceMode, setPerformanceMode] = useState(false);
  const [autoPerformanceMode, setAutoPerformanceMode] = useState(true);

  const fps = useFPSMonitor(true);

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
    if (autoPerformanceMode && fps.average < 30 && !performanceMode) {
      setPerformanceMode(true);
    }
  }, [fps.average, autoPerformanceMode, performanceMode]);

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

  const togglePerformanceMode = () => {
    setAutoPerformanceMode(false);
    setPerformanceMode(!performanceMode);
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
          <div className="header-actions">
            <button
              className={`performance-header-btn ${performanceMode ? 'active' : ''}`}
              onClick={togglePerformanceMode}
              title={performanceMode ? '切换到高质量模式' : '切换到性能模式'}
            >
              <Gauge size={16} />
              <span>{performanceMode ? '性能模式' : '高质量'}</span>
            </button>
            <button
              className={`filter-toggle ${showFilters || activeFilterCount > 0 ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={18} />
              {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
            </button>
          </div>
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
        <MasonryLayout
          assets={displayedAssets}
          onCardClick={handleCardClick}
          performanceMode={performanceMode}
        />
      </div>

      {displayedAssets.length === 0 && !isFiltering && (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <p className="empty-text">暂无匹配的模型</p>
          <p className="empty-hint">尝试调整筛选条件或上传新模型</p>
        </div>
      )}

      <FPSPanel
        defaultCollapsed={true}
        performanceMode={performanceMode}
        onTogglePerformanceMode={togglePerformanceMode}
      />
    </div>
  );
}
