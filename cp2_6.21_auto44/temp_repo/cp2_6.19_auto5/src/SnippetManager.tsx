import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { Search, Download, ArrowUpDown, Clock, ArrowDownAZ, X } from 'lucide-react';
import { useStore, getAllTags } from './store';
import type { Snippet, SortOrder } from './types';
import SnippetCard from './SnippetCard';

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function getCategoryDescendantIds(categories: { id: string; parentId: string | null }[], categoryId: string): string[] {
  const ids = [categoryId];
  const children = categories.filter(c => c.parentId === categoryId);
  for (const child of children) {
    ids.push(...getCategoryDescendantIds(categories, child.id));
  }
  return ids;
}

const CARD_HEIGHT = 220;
const GAP = 16;

export default function SnippetManager() {
  const snippets = useStore(s => s.snippets);
  const searchQuery = useStore(s => s.searchQuery);
  const setSearchQuery = useStore(s => s.setSearchQuery);
  const clearSearchQuery = useStore(s => s.clearSearchQuery);
  const selectedCategoryId = useStore(s => s.selectedCategoryId);
  const selectedTags = useStore(s => s.selectedTags);
  const toggleTag = useStore(s => s.toggleTag);
  const sortOrder = useStore(s => s.sortOrder);
  const setSortOrder = useStore(s => s.setSortOrder);
  const deleteSnippet = useStore(s => s.deleteSnippet);
  const openEditPanel = useStore(s => s.openEditPanel);
  const reorderSnippets = useStore(s => s.reorderSnippets);
  const isExporting = useStore(s => s.isExporting);
  const exportProgress = useStore(s => s.exportProgress);
  const startExport = useStore(s => s.startExport);
  const isMobileView = useStore(s => s.isMobileView);
  const categories = useStore(s => s.categories);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const debouncedSearch = useDebounce(searchQuery, 200);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, [setSearchQuery]);

  const handleClearSearch = useCallback(() => {
    clearSearchQuery();
    searchInputRef.current?.focus();
  }, [clearSearchQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
      if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        e.preventDefault();
        clearSearchQuery();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [clearSearchQuery]);

  const filteredSnippets = useMemo(() => {
    let filtered = [...snippets];

    if (selectedCategoryId) {
      const descendantIds = getCategoryDescendantIds(categories, selectedCategoryId);
      filtered = filtered.filter(s => descendantIds.includes(s.categoryId ?? ''));
    }

    if (selectedTags.length > 0) {
      filtered = filtered.filter(s =>
        selectedTags.some(tag => s.tags.includes(tag))
      );
    }

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      filtered = filtered.filter(s =>
        s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q)
      );
    }

    switch (sortOrder) {
      case 'createdAt':
        filtered.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case 'updatedAt':
        filtered.sort((a, b) => b.updatedAt - a.updatedAt);
        break;
      case 'alphabetical':
        filtered.sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'));
        break;
    }

    return filtered;
  }, [snippets, selectedCategoryId, selectedTags, debouncedSearch, sortOrder, categories]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    snippets.forEach(s => s.tags.forEach(t => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [snippets]);

  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const columnCount = useMemo(() => {
    if (isMobileView) {
      return window.innerWidth <= 480 ? 1 : 2;
    }
    const w = containerSize.width;
    if (w < 600) return 2;
    return 4;
  }, [containerSize.width, isMobileView]);

  const columnWidth = useMemo(() => {
    return (containerSize.width - GAP * (columnCount - 1)) / columnCount;
  }, [containerSize.width, columnCount]);

  const rowCount = Math.ceil(filteredSnippets.length / columnCount);

  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (id !== dragOverId) {
      setDragOverId(id);
    }
  }, [dragOverId]);

  const handleDrop = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (dragId && dragId !== targetId) {
      const startIdx = filteredSnippets.findIndex(s => s.id === dragId);
      const endIdx = filteredSnippets.findIndex(s => s.id === targetId);
      if (startIdx !== -1 && endIdx !== -1) {
        reorderSnippets(startIdx, endIdx);
      }
    }
    setDragId(null);
    setDragOverId(null);
  }, [dragId, filteredSnippets, reorderSnippets]);

  const handleDragEnd = useCallback(() => {
    setDragId(null);
    setDragOverId(null);
  }, []);

  const handleDelete = useCallback((id: string) => {
    deleteSnippet(id);
  }, [deleteSnippet]);

  const handleEdit = useCallback((snippet: Snippet) => {
    openEditPanel(snippet);
  }, [openEditPanel]);

  const sortOptions: { key: SortOrder; label: string; icon: React.ReactNode }[] = [
    { key: 'createdAt', label: '创建时间', icon: <Clock size={12} /> },
    { key: 'updatedAt', label: '更新时间', icon: <ArrowUpDown size={12} /> },
    { key: 'alphabetical', label: '字母序', icon: <ArrowDownAZ size={12} /> },
  ];

  const gridData = useMemo(() => ({
    items: filteredSnippets,
    columnCount,
    dragId,
    dragOverId,
    highlightQuery: debouncedSearch,
  }), [filteredSnippets, columnCount, dragId, dragOverId, debouncedSearch]);

  const Cell = useCallback(({ columnIndex, rowIndex, style, data }: {
    columnIndex: number;
    rowIndex: number;
    style: React.CSSProperties;
    data: typeof gridData;
  }) => {
    const { items, columnCount: cols, dragId: did, dragOverId: doid, highlightQuery: hq } = data;
    const idx = rowIndex * cols + columnIndex;
    if (idx >= items.length) return <div style={style} />;
    const snippet = items[idx];
    return (
      <div style={{
        ...style,
        left: Number(style.left) + columnIndex * GAP,
        top: Number(style.top) + GAP,
        width: Number(style.width) - GAP,
        height: Number(style.height) - GAP,
      }}>
        <SnippetCard
          snippet={snippet}
          highlightQuery={hq}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
          isDragOver={doid === snippet.id}
          isDragging={did === snippet.id}
        />
      </div>
    );
  }, [handleEdit, handleDelete, handleDragStart, handleDragOver, handleDrop, handleDragEnd]);

  return (
    <div className="main-area">
      <div className="top-bar">
        {isMobileView && (
          <button
            className="hamburger-btn"
            onClick={() => useStore.getState().setSidebarCollapsed(false)}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 4.5h12M3 9h12M3 13.5h12" />
            </svg>
          </button>
        )}

        <div className="search-box">
          <span className="search-icon"><Search size={15} /></span>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="搜索标题或正文..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
          {searchQuery && (
            <button
              className="search-clear-btn"
              onClick={handleClearSearch}
              title="清除搜索"
            >
              <X size={14} />
            </button>
          )}
          <span className="search-shortcut" title="Ctrl+K 快速搜索">Ctrl+K</span>
        </div>

        <div className="tag-filters">
          {allTags.slice(0, 8).map(tag => (
            <span
              key={tag}
              className={`tag-chip ${selectedTags.includes(tag) ? 'active' : ''}`}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </span>
          ))}
          {allTags.length > 8 && (
            <span className="tag-chip" style={{ opacity: 0.5, cursor: 'default' }}>
              +{allTags.length - 8}
            </span>
          )}
        </div>

        <div className="sort-controls">
          {sortOptions.map(opt => (
            <button
              key={opt.key}
              className={`sort-btn ${sortOrder === opt.key ? 'active' : ''}`}
              onClick={() => setSortOrder(opt.key)}
            >
              {opt.icon} {opt.label}
            </button>
          ))}
        </div>

        <button
          className="btn btn-secondary"
          onClick={startExport}
          style={{ flexShrink: 0 }}
        >
          <Download size={14} /> 导出
        </button>
      </div>

      <div className="content-area" ref={containerRef}>
        {filteredSnippets.length === 0 ? (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
              <path d="M12 18v-6" />
              <path d="M9 15h6" />
            </svg>
            <p>暂无片段，点击右下角按钮创建</p>
          </div>
        ) : (
          <Grid
            columnCount={columnCount}
            columnWidth={columnWidth + GAP}
            height={containerSize.height}
            rowCount={rowCount}
            rowHeight={CARD_HEIGHT + GAP}
            width={containerSize.width}
            overscanRowCount={3}
            itemData={gridData}
          >
            {Cell}
          </Grid>
        )}
      </div>

      {isExporting && (
        <div className="export-progress-overlay">
          <div className="export-progress-panel">
            <div className="export-progress-title">正在导出...</div>
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
            <div className="progress-text">{Math.round(exportProgress)}%</div>
          </div>
        </div>
      )}
    </div>
  );
}
