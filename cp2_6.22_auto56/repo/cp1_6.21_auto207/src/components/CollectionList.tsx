import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Inbox } from 'lucide-react';
import { useCollection } from '../contexts/CollectionContext';
import SearchFilter from './SearchFilter';
import SnippetCard from './SnippetCard';

const VIRTUAL_THRESHOLD = 20;
const CARD_HEIGHT = 320;
const GAP = 20;
const ROW_HEIGHT = CARD_HEIGHT + GAP;

const CollectionList: React.FC = () => {
  const { filteredSnippets, loading } = useCollection();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const updateHeight = () => setContainerHeight(el.clientHeight || 600);
    updateHeight();
    const ro = new ResizeObserver(updateHeight);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop((e.target as HTMLDivElement).scrollTop);
  };

  const useVirtual = filteredSnippets.length > VIRTUAL_THRESHOLD;

  const { startIndex, endIndex, topPad, bottomPad, gridColumns } = useMemo(() => {
    if (!useVirtual) {
      return { startIndex: 0, endIndex: filteredSnippets.length, topPad: 0, bottomPad: 0, gridColumns: getColumns() };
    }
    const cols = getColumns();
    const visibleRows = Math.max(4, Math.ceil(containerHeight / ROW_HEIGHT) + 2);
    const buffer = 2;
    const totalRows = Math.ceil(filteredSnippets.length / cols);
    const currentRow = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT));
    const start = Math.max(0, currentRow - buffer) * cols;
    const end = Math.min(filteredSnippets.length, (currentRow + visibleRows + buffer) * cols);
    const topPadding = (currentRow - buffer) * cols > 0 ? Math.max(0, Math.floor(start / cols)) * ROW_HEIGHT : 0;
    const bottomPadding = totalRows * ROW_HEIGHT - (Math.ceil(end / cols) * ROW_HEIGHT) + GAP;
    return { startIndex: start, endIndex: end, topPad: topPadding, bottomPad: Math.max(0, bottomPadding), gridColumns: cols };
  }, [filteredSnippets.length, scrollTop, containerHeight, useVirtual]);

  function getColumns(): number {
    if (typeof window === 'undefined') return 3;
    const w = window.innerWidth;
    if (w < 768) return 1;
    if (w < 1024) return 2;
    if (w < 1440) return 3;
    return 4;
  }

  const [columns, setColumns] = useState<number>(3);
  useEffect(() => {
    const updateCols = () => setColumns(getColumns());
    updateCols();
    window.addEventListener('resize', updateCols);
    return () => window.removeEventListener('resize', updateCols);
  }, []);

  const cols = useVirtual ? gridColumns : columns;

  const displaySnippets = useVirtual
    ? filteredSnippets.slice(startIndex, endIndex)
    : filteredSnippets;

  return (
    <div className="prevent-selection" style={{ width: '100%' }}>
      <SearchFilter />

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          maxHeight: '70vh',
          minHeight: 400,
          overflowY: 'auto',
          padding: '8px 4px 16px',
          marginTop: 16,
        }}
      >
        {loading && filteredSnippets.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 80, color: '#9CA3AF' }}>
            加载中...
          </div>
        ) : filteredSnippets.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 20px',
              color: '#9CA3AF',
              gap: 12,
            }}
          >
            <Inbox size={48} style={{ opacity: 0.4 }} />
            <div style={{ fontSize: 15, fontWeight: 500, color: '#6B7280' }}>
              暂无收藏片段
            </div>
            <div style={{ fontSize: 13 }}>
              在上方内容区域拖拽鼠标选择区域来创建第一个片段
            </div>
          </div>
        ) : (
          <>
            {useVirtual && topPad > 0 && <div style={{ height: topPad }} />}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${cols}, minmax(280px, 1fr))`,
                gap: `${GAP}px`,
                alignItems: 'stretch',
              }}
            >
              {displaySnippets.map((snippet, i) => (
                <SnippetCard
                  key={snippet.id}
                  snippet={snippet}
                  index={useVirtual ? startIndex + i : i}
                />
              ))}
            </div>
            {useVirtual && bottomPad > 0 && <div style={{ height: bottomPad }} />}
          </>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .prevent-selection > div:first-child {
            grid-template-columns: 1fr !important;
          }
        }
        @keyframes cardIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .card-hover:hover {
          transform: translateY(-3px) !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important;
        }
      `}</style>
    </div>
  );
};

export default CollectionList;
