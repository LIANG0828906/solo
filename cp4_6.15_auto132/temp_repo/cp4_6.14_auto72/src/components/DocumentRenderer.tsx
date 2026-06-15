import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useDocStore } from '@/store/docStore';
import { useDebounce } from '@/hooks/useDebounce';

/**
 * 文档渲染模块
 * 数据流向：
 *   从 store 读取 currentDoc、pageState、paragraphsPerPage
 *   通过 useMemo 监听段落变化自动重算总页数
 *   翻页时使用 isAnimating 锁防止快速点击冲突
 *   翻页方向决定 slide-left / slide-right 动画（250ms ease-in-out）
 *   滚动事件 -> store.updatePosition() -> 同步模块广播
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
  const [isAnimating, setIsAnimating] = useState(false);
  const animationTimerRef = useRef<number | null>(null);

  /**
   * 总页数计算：基于段落总数 / 每页段落数向上取整
   * 使用 useMemo 依赖 currentDoc.paragraphs.length 和 paragraphsPerPage，
   * 两者任一变化都会自动重新计算总页数。
   */
  const totalPages = useMemo(() => {
    if (!currentDoc.paragraphs || currentDoc.paragraphs.length === 0) return 1;
    return Math.ceil(currentDoc.paragraphs.length / paragraphsPerPage);
  }, [currentDoc.paragraphs.length, paragraphsPerPage]);

  const currentParagraphs = useMemo(() => {
    const start = (pageState.page - 1) * paragraphsPerPage;
    const end = Math.min(start + paragraphsPerPage, currentDoc.paragraphs.length);
    return currentDoc.paragraphs.slice(start, end).map((text, idx) => ({
      index: start + idx,
      text,
    }));
  }, [currentDoc.paragraphs, pageState.page, paragraphsPerPage, totalPages]);

  const debouncedBroadcast = useDebounce(
    (percent: number, paragraphIndex: number) => {
      receiveRemotePosition(currentUserId, percent, paragraphIndex);
    },
    50
  );

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const scrollMax = scrollHeight - clientHeight;
    const percent = scrollMax > 0 ? scrollTop / scrollMax : 0;

    const pageStartIdx = (pageState.page - 1) * paragraphsPerPage;
    const pageEndIdx = Math.min(
      pageStartIdx + paragraphsPerPage - 1,
      currentDoc.paragraphs.length - 1
    );
    const paragraphIndex = Math.round(
      pageStartIdx + percent * (pageEndIdx - pageStartIdx)
    );
    const finalIndex = Math.max(
      0,
      Math.min(paragraphIndex, currentDoc.paragraphs.length - 1)
    );

    updatePosition(percent, finalIndex);
    debouncedBroadcast(percent, finalIndex);
  }, [
    currentDoc.paragraphs.length,
    debouncedBroadcast,
    pageState.page,
    paragraphsPerPage,
    updatePosition,
  ]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.scrollTop = 0;
    }
  }, [pageState.page]);

  /**
   * 翻页处理：
   * - 动画期间设置 isAnimating 锁，防止快速点击导致动画冲突
   * - 翻页方向：新页 > 当前页 slide-left（内容从右滑入）
   *            新页 < 当前页 slide-right（内容从左滑入）
   * - 250ms 动画结束后解锁
   */
  const handlePageChange = useCallback(
    (targetPage: number) => {
      if (isAnimating) return;
      if (targetPage < 1 || targetPage > totalPages) return;
      if (targetPage === pageState.page) return;

      const direction = targetPage > pageState.page ? 'left' : 'right';
      setIsAnimating(true);

      if (animationTimerRef.current !== null) {
        window.clearTimeout(animationTimerRef.current);
      }
      animationTimerRef.current = window.setTimeout(() => {
        setIsAnimating(false);
        animationTimerRef.current = null;
      }, 260);

      setCurrentPage(targetPage, direction);
    },
    [isAnimating, pageState.page, setCurrentPage, totalPages]
  );

  useEffect(() => {
    return () => {
      if (animationTimerRef.current !== null) {
        window.clearTimeout(animationTimerRef.current);
      }
    };
  }, []);

  const animationClass =
    pageState.direction === 'left'
      ? 'anim-slide-left'
      : pageState.direction === 'right'
      ? 'anim-slide-right'
      : '';

  const renderPageNumbers = useCallback(() => {
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
          disabled={isAnimating}
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
  }, [handlePageChange, isAnimating, pageState.page, totalPages]);

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '24px',
        overflow: 'hidden',
        minWidth: 0,
        position: 'relative',
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
          key={pageState.page}
          className={`document-card ${animationClass}`}
          style={{ animationDuration: '250ms', animationTimingFunction: 'ease-in-out' }}
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

          <div id="document-content">
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
          disabled={pageState.page <= 1 || isAnimating}
          aria-label="上一页"
        >
          <ChevronLeft size={18} />
        </button>

        {renderPageNumbers()}

        <button
          className="page-number-btn"
          onClick={() => handlePageChange(pageState.page + 1)}
          disabled={pageState.page >= totalPages || isAnimating}
          aria-label="下一页"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default DocumentRenderer;
