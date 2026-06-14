import React, { useEffect, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useDocStore } from '@/store/docStore';
import { useDebounce } from '@/hooks/useDebounce';

/**
 * 文档渲染模块
 * 数据流向：
 *   从 store 读取 currentDoc、pageState、paragraphsPerPage
 *   渲染后触发 scroll 事件 -> 调用 store.updatePosition()
 *   翻页时调用 store.setCurrentPage()，带 slide-left/slide-right 动画
 */
const DocumentRenderer: React.FC = () => {
  const {
    currentDoc,
    pageState,
    paragraphsPerPage,
    setCurrentPage,
    updatePosition,
    receiveRemotePosition,
    currentUserId,
  } = useDocStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const pageContainerRef = useRef<HTMLDivElement>(null);

  const totalPages = useMemo(
    () => Math.ceil(currentDoc.paragraphs.length / paragraphsPerPage),
    [currentDoc.paragraphs.length, paragraphsPerPage]
  );

  const currentParagraphs = useMemo(() => {
    const start = (pageState.page - 1) * paragraphsPerPage;
    const end = start + paragraphsPerPage;
    return currentDoc.paragraphs.slice(start, end).map((text, idx) => ({
      index: start + idx,
      text,
    }));
  }, [currentDoc.paragraphs, pageState.page, paragraphsPerPage]);

  const debouncedBroadcast = useDebounce(
    (percent: number, paragraphIndex: number) => {
      receiveRemotePosition(currentUserId, percent, paragraphIndex);
    },
    50
  );

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const percent = scrollHeight - clientHeight > 0
      ? scrollTop / (scrollHeight - clientHeight)
      : 0;
    const absoluteIndex = (pageState.page - 1) * paragraphsPerPage +
      Math.floor((percent * (paragraphsPerPage - 1)));
    const finalIndex = Math.min(
      absoluteIndex,
      currentDoc.paragraphs.length - 1
    );
    updatePosition(percent, finalIndex);
    debouncedBroadcast(percent, finalIndex);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.scrollTop = 0;
    }
  }, [pageState.page]);

  const handlePageChange = (targetPage: number) => {
    if (targetPage < 1 || targetPage > totalPages || targetPage === pageState.page) return;
    const direction = targetPage > pageState.page ? 'left' : 'right';
    setCurrentPage(targetPage, direction);
  };

  const animationClass =
    pageState.direction === 'left'
      ? 'anim-slide-left'
      : pageState.direction === 'right'
      ? 'anim-slide-right'
      : '';

  const renderPageNumbers = () => {
    const pages: (number | string)[] = [];
    const current = pageState.page;
    const delta = 2;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= current - delta && i <= current + delta)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }

    return pages.map((p, idx) =>
      typeof p === 'number' ? (
        <button
          key={p}
          className={`page-number-btn ${p === current ? 'active' : ''}`}
          onClick={() => handlePageChange(p)}
        >
          {p}
        </button>
      ) : (
        <span
          key={`dots-${idx}`}
          style={{ padding: '0 4px', color: '#94a3b8', userSelect: 'none' }}
        >
          ...
        </span>
      )
    );
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '24px',
        overflow: 'hidden',
        minWidth: 0,
      }}
    >
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingRight: 16,
          position: 'relative',
        }}
      >
        <div
          ref={pageContainerRef}
          key={pageState.page}
          className={`document-card ${animationClass}`}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 12,
              color: '#94a3b8',
              paddingBottom: 16,
              borderBottom: '1px solid #f1f5f9',
              marginBottom: 24,
            }}
          >
            <span>{currentDoc.title}</span>
            <span>
              第 {pageState.page} / {totalPages} 页
            </span>
          </div>

          <div>
            {currentParagraphs.map((p) => (
              <p
                key={p.index}
                data-paragraph-index={p.index}
                className="document-paragraph"
              >
                {p.text}
              </p>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 12,
              color: '#94a3b8',
              paddingTop: 16,
              borderTop: '1px solid #f1f5f9',
              marginTop: 24,
            }}
          >
            <span>© 协作文档平台</span>
            <span>
              第 {pageState.page} / {totalPages} 页
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '16px 0 8px',
          flexWrap: 'wrap',
        }}
      >
        <button
          className="page-number-btn"
          onClick={() => handlePageChange(pageState.page - 1)}
          disabled={pageState.page <= 1}
          aria-label="上一页"
        >
          <ChevronLeft size={18} />
        </button>

        {renderPageNumbers()}

        <button
          className="page-number-btn"
          onClick={() => handlePageChange(pageState.page + 1)}
          disabled={pageState.page >= totalPages}
          aria-label="下一页"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default DocumentRenderer;
