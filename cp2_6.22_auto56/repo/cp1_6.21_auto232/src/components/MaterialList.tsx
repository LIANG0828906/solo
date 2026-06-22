import React, { useState, useRef, useEffect } from 'react';
import { useMaterials } from '../context/MaterialContext';
import type { Material } from '../types';

interface MaterialListProps {
  onSelectMaterial: (id: string) => void;
}

export default function MaterialList({ onSelectMaterial }: MaterialListProps) {
  const { categories, materials, selectedCategory, setSelectedCategory, loading } = useMaterials();
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['yarn', 'wood', 'clay', 'fabric', 'beads']);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<Material[]>([]);
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (searchDebounce) clearTimeout(searchDebounce);

    if (value.trim()) {
      setShowSearchResults(true);
      const timer = setTimeout(async () => {
        try {
          const res = await fetch(`/api/materials?search=${encodeURIComponent(value)}`);
          const data = await res.json();
          setSearchResults(data);
        } catch (err) {
          console.error('搜索失败:', err);
        }
      }, 300);
      setSearchDebounce(timer);
    } else {
      setShowSearchResults(false);
      setSearchResults([]);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getCategoryName = (catId: string) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.name : catId;
  };

  const handleResultClick = (id: string) => {
    setShowSearchResults(false);
    setSearchQuery('');
    onSelectMaterial(id);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>材料库存</h1>
        <div ref={searchRef} style={styles.searchContainer}>
          <input
            type="text"
            placeholder="搜索材料名称或标签..."
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => searchQuery && setShowSearchResults(true)}
            style={styles.searchInput}
          />
          <svg style={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          {showSearchResults && (
            <div style={styles.searchResults}>
              {searchResults.length === 0 ? (
                <div style={styles.searchEmpty}>未找到相关材料</div>
              ) : (
                searchResults.slice(0, 10).map(material => (
                  <div
                    key={material.id}
                    style={styles.searchResultItem}
                    onClick={() => handleResultClick(material.id)}
                  >
                    <img src={material.image} alt="" style={styles.searchResultImg} />
                    <div style={styles.searchResultInfo}>
                      <div style={styles.searchResultName}>{material.name}</div>
                      <div style={styles.searchResultBreadcrumb}>
                        <span style={styles.breadcrumbDot} />
                        {getCategoryName(material.category)}
                      </div>
                    </div>
                    <svg style={styles.searchArrow} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m9 18 6-6-6-6"></path>
                    </svg>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.sidebar}>
          <div
            style={{
              ...styles.categoryItem,
              ...(selectedCategory === 'all' ? styles.categoryItemActive : {}),
            }}
            onClick={() => setSelectedCategory('all')}
          >
            <span style={styles.categoryIcon}>📦</span>
            <span style={styles.categoryName}>全部材料</span>
            <span style={styles.categoryCount}>{materials.length}</span>
          </div>
          
          {categories.map(category => (
            <div key={category.id}>
              <div
                style={{
                  ...styles.categoryItem,
                  ...(selectedCategory === category.id ? styles.categoryItemActive : {}),
                }}
                onClick={() => {
                  toggleCategory(category.id);
                  setSelectedCategory(category.id);
                }}
              >
                <svg
                  style={{
                    ...styles.arrowIcon,
                    transform: expandedCategories.includes(category.id) ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                >
                  <path d="m9 18 6-6-6-6"></path>
                </svg>
                <span style={styles.categoryIcon}>{category.icon}</span>
                <span style={styles.categoryName}>{category.name}</span>
                <span style={styles.categoryCount}>
                  {materials.filter(m => m.category === category.id).length}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div style={styles.mainContent}>
          {loading ? (
            <div style={styles.loading}>加载中...</div>
          ) : (
            <div
              style={{
                ...styles.grid,
                opacity: loading ? 0.5 : 1,
                transition: 'opacity 0.3s ease',
              }}
            >
              {materials.map(material => (
                <MaterialCard
                  key={material.id}
                  material={material}
                  onClick={() => onSelectMaterial(material.id)}
                />
              ))}
            </div>
          )}
          {!loading && materials.length === 0 && (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📭</div>
              <div style={styles.emptyText}>暂无材料</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MaterialCard({ material, onClick }: { material: Material; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        ...styles.card,
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered
          ? '0 12px 24px #D1D5DB, 0 4px 8px rgba(0,0,0,0.08)'
          : '0 2px 8px rgba(0,0,0,0.06)',
        transition: 'transform 0.25s ease-out, box-shadow 0.25s ease-out',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      <img src={material.image} alt={material.name} style={styles.cardImage} />
      <div style={styles.cardContent}>
        <h3 style={styles.cardTitle}>{material.name}</h3>
        <div style={styles.cardMeta}>
          <span style={styles.quantityBadge}>
            {material.quantity} {material.unit}
          </span>
          <span style={styles.locationText}>📍 {material.location}</span>
        </div>
        <div style={styles.tagsContainer}>
          {material.tags.slice(0, 3).map((tag, idx) => (
            <span key={idx} style={styles.tag}>{tag}</span>
          ))}
        </div>
        <div style={styles.lastUsed}>
          上次使用: {material.lastUsed}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#F8FAFC',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 32px',
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E2E8F0',
  },
  title: {
    fontSize: '24px',
    fontWeight: 600,
    color: '#1E293B',
    margin: 0,
  },
  searchContainer: {
    position: 'relative',
    width: '320px',
  },
  searchInput: {
    width: '100%',
    padding: '10px 16px 10px 40px',
    backgroundColor: '#334155',
    color: '#FFFFFF',
    border: '2px solid #334155',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s ease',
    boxSizing: 'border-box',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#94A3B8',
  },
  searchResults: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: '8px',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    maxHeight: '400px',
    overflowY: 'auto',
    zIndex: 1000,
  },
  searchEmpty: {
    padding: '24px',
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: '14px',
  },
  searchResultItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    cursor: 'pointer',
    borderBottom: '1px solid #F1F5F9',
    transition: 'background-color 0.15s ease',
  },
  searchResultImg: {
    width: '48px',
    height: '36px',
    borderRadius: '6px',
    objectFit: 'cover',
    marginRight: '12px',
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#1E293B',
    marginBottom: '2px',
  },
  searchResultBreadcrumb: {
    fontSize: '12px',
    color: '#64748B',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  breadcrumbDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#F59E0B',
    display: 'inline-block',
  },
  searchArrow: {
    color: '#94A3B8',
  },
  content: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
    padding: '24px',
    gap: '24px',
  },
  sidebar: {
    width: '280px',
    backgroundColor: '#1E293B',
    borderRadius: '12px',
    padding: '16px 8px',
    overflowY: 'auto',
    flexShrink: 0,
  },
  categoryItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    cursor: 'pointer',
    borderRadius: '8px',
    color: '#CBD5E1',
    fontSize: '14px',
    marginBottom: '4px',
    transition: 'background-color 0.2s ease, color 0.2s ease',
  },
  categoryItemActive: {
    backgroundColor: '#334155',
    color: '#FFFFFF',
  },
  arrowIcon: {
    marginRight: '8px',
    color: '#64748B',
  },
  categoryIcon: {
    marginRight: '10px',
    fontSize: '18px',
  },
  categoryName: {
    flex: 1,
  },
  categoryCount: {
    backgroundColor: '#334155',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '12px',
    color: '#94A3B8',
  },
  mainContent: {
    flex: 1,
    overflowY: 'auto',
  },
  grid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '20px',
  },
  card: {
    width: '220px',
    minHeight: '160px',
    backgroundColor: '#F8FAFC',
    borderRadius: '16px',
    padding: '16px',
    cursor: 'pointer',
    boxSizing: 'border-box',
  },
  cardImage: {
    width: '100%',
    height: '120px',
    borderRadius: '12px',
    objectFit: 'cover',
    marginBottom: '12px',
  },
  cardContent: {},
  cardTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1E293B',
    margin: '0 0 8px 0',
    lineHeight: 1.4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  cardMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  quantityBadge: {
    backgroundColor: '#F59E0B',
    color: '#FFFFFF',
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 500,
  },
  locationText: {
    fontSize: '12px',
    color: '#64748B',
  },
  tagsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginBottom: '8px',
  },
  tag: {
    backgroundColor: '#E2E8F0',
    color: '#1E293B',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
  },
  lastUsed: {
    fontSize: '11px',
    color: '#94A3B8',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#64748B',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  emptyText: {
    fontSize: '16px',
    color: '#64748B',
  },
};
