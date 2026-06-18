import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AiFillStar, AiOutlineStar, AiOutlinePlus, AiOutlineSearch, AiOutlineClose } from 'react-icons/ai';
import { usePalette } from './PaletteContext';
import { getDominantColor, getContrastColor } from './types';
import type { Palette } from './types';

interface PaletteManagerProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  isMobile: boolean;
}

const MiniPalettePreview: React.FC<{ palette: Palette }> = ({ palette }) => {
  const colors = palette.colors.slice(0, 5);
  return (
    <div className="mini-palette-preview">
      {colors.map((c, idx) => (
        <div
          key={c.id || idx}
          className="mini-color"
          style={{ backgroundColor: c.hex, flex: 1 }}
        />
      ))}
      {Array.from({ length: Math.max(0, 5 - colors.length) }).map((_, i) => (
        <div key={`empty-${i}`} className="mini-color mini-empty" style={{ flex: 1 }} />
      ))}
    </div>
  );
};

const StarRow: React.FC<{
  rating: number;
  onRate?: (n: number) => void;
  interactive?: boolean;
  size?: number;
}> = ({ rating, onRate, interactive = false, size = 14 }) => {
  return (
    <div className="star-row">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < rating;
        const Comp = interactive ? motion.div : 'div';
        return (
          <Comp
            key={i}
            className="star"
            onClick={(e?: React.MouseEvent) => {
              if (interactive && onRate) {
                e?.stopPropagation();
                onRate(filled && rating === i + 1 ? 0 : i + 1);
              }
            }}
            whileTap={interactive ? { scale: 1.5 } : undefined}
            animate={
              interactive
                ? {
                    scale: filled ? [1, 1.3, 1] : 1,
                    transition: { duration: 0.2 },
                  }
                : undefined
            }
          >
            {filled ? (
              <AiFillStar size={size} color="#F5B301" />
            ) : (
              <AiOutlineStar size={size} color="#C8BEB4" />
            )}
          </Comp>
        );
      })}
    </div>
  );
};

export const PaletteManager: React.FC<PaletteManagerProps> = ({
  collapsed,
  onToggleCollapse,
  isMobile,
}) => {
  const {
    palettes,
    selectedId,
    selectPalette,
    createPalette,
    removePalette,
    setRating,
    filterTags,
    setFilterTags,
    minRating,
    setMinRating,
    search,
    setSearch,
    allTags,
    loading,
  } = usePalette();

  const [, setTagInput] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return palettes.filter((p) => {
      if (p.rating < minRating) return false;
      if (filterTags.length > 0 && !filterTags.every((t) => p.tags.includes(t))) return false;
      if (q && !p.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [palettes, search, minRating, filterTags]);

  const SidebarContent = (
    <>
      <div className="sidebar-header">
        <div className="brand">
          <div className="brand-logo">🎨</div>
          {!collapsed && <div className="brand-title">色板管理器</div>}
        </div>
        <button className="collapse-btn" onClick={onToggleCollapse} title={collapsed ? '展开' : '收起'}>
          {collapsed ? '»' : '«'}
        </button>
      </div>

      {!collapsed && (
        <>
          <div className="filters">
            <div className="search-input-wrap">
              <AiOutlineSearch className="search-icon" size={14} />
              <input
                className="search-input"
                placeholder="搜索色板..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  className="clear-btn"
                  onClick={() => setSearch('')}
                  aria-label="清除"
                >
                  <AiOutlineClose size={12} />
                </button>
              )}
            </div>

            <div className="rating-filter">
              <span className="filter-label">最低评分</span>
              <StarRow
                rating={minRating}
                interactive
                onRate={setMinRating}
                size={16}
              />
            </div>

            <div className="tags-filter">
              <span className="filter-label">标签筛选</span>
              <div className="tag-list">
                {allTags.map((tag) => {
                  const active = filterTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      className={`tag ${active ? 'tag-active' : ''}`}
                      onClick={() =>
                        setFilterTags((prev) =>
                          prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                        )
                      }
                    >
                      {tag}
                    </button>
                  );
                })}
                {filterTags.length > 0 && (
                  <button
                    className="tag tag-clear"
                    onClick={() => setFilterTags([])}
                  >
                    清除
                  </button>
                )}
              </div>
            </div>
          </div>

          <button className="create-btn" onClick={() => createPalette()}>
            <AiOutlinePlus size={18} />
            <span>新建色板</span>
          </button>
        </>
      )}

      <div className="palette-list-scroll">
        <div className="palette-list">
          {loading ? (
            <div className="empty-state">加载中...</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">没有匹配的色板</div>
          ) : (
            <AnimatePresence initial={false}>
              {filtered.map((pal, idx) => (
                <motion.div
                  key={pal.id}
                  layout
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25, delay: collapsed ? 0 : idx * 0.05 }}
                  className={`palette-card ${selectedId === pal.id ? 'active' : ''}`}
                  onClick={() => selectPalette(pal.id)}
                  title={collapsed ? pal.name : undefined}
                >
                  <div className="palette-card-top">
                    <div className="palette-name">
                      {collapsed ? (
                        <div
                          className="palette-dot"
                          style={{ backgroundColor: getDominantColor(pal.colors) }}
                        />
                      ) : (
                        <span>{pal.name}</span>
                      )}
                    </div>
                    {!collapsed && (
                      <button
                        className="delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`确定删除色板「${pal.name}」？`)) {
                            removePalette(pal.id);
                          }
                        }}
                        title="删除"
                      >
                        <AiOutlineClose size={14} />
                      </button>
                    )}
                  </div>
                  {!collapsed && (
                    <>
                      <MiniPalettePreview palette={pal} />
                      <div className="palette-meta">
                        <StarRow rating={pal.rating} interactive onRate={(n) => setRating(pal.id, n)} />
                        <span className="palette-count">{pal.colors.length}/10</span>
                      </div>
                      {pal.tags.length > 0 && (
                        <div className="palette-tags-inline">
                          {pal.tags.slice(0, 3).map((t) => (
                            <span key={t} className="tag-inline">#{t}</span>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <div className="mobile-topbar">
        <div className="mobile-tabs">
          <button className="mobile-tab active">🎨 色板列表</button>
        </div>
        {SidebarContent}
      </div>
    );
  }

  return (
    <motion.aside
      className="sidebar"
      animate={{ width: collapsed ? 80 : 300 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {SidebarContent}
    </motion.aside>
  );
};

export default PaletteManager;
