import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTabContext } from '@/context/TabContext';
import { getFirstLetter } from '@/utils/tabUtils';
import type { Tab } from '@/types';
import './TabBar.css';

const TabBar: React.FC = () => {
  const { state, dispatch } = useTabContext();
  const { tabs } = state;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [scrollState, setScrollState] = useState({ showLeft: false, showRight: false, leftDisabled: true, rightDisabled: true });
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [insertIndex, setInsertIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const updateScrollState = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    const canScroll = scrollWidth > clientWidth + 1;
    const atLeft = scrollLeft <= 0;
    const atRight = scrollLeft + clientWidth >= scrollWidth - 1;
    setScrollState({
      showLeft: canScroll,
      showRight: canScroll,
      leftDisabled: atLeft,
      rightDisabled: atRight
    });
  }, []);

  useEffect(() => {
    updateScrollState();
  }, [tabs.length, updateScrollState]);

  const scroll = useCallback((direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const scrollAmount = 200;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
    setTimeout(updateScrollState, 300);
  }, [updateScrollState]);

  const handleTabClick = (tabId: string) => {
    if (draggedTabId) return;
    const tab = tabs.find(t => t.id === tabId);
    if (tab?.isSleeping) {
      dispatch({ type: 'WAKE_UP_TAB', payload: { id: tabId } });
    }
    dispatch({ type: 'SET_ACTIVE_TAB', payload: { id: tabId } });
  };

  const handleCloseClick = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    dispatch({ type: 'REMOVE_TAB', payload: { id: tabId } });
  };

  const computeInsertIndex = useCallback((clientX: number): number => {
    if (tabs.length === 0) return 0;
    const containerRect = scrollContainerRef.current?.getBoundingClientRect();
    if (!containerRect) return 0;
    const scrollLeft = scrollContainerRef.current?.scrollLeft || 0;

    for (let i = 0; i < tabs.length; i++) {
      const el = tabRefs.current.get(tabs[i].id);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      const left = rect.left - containerRect.left + scrollLeft;
      const right = rect.right - containerRect.left + scrollLeft;
      const mid = (left + right) / 2;
      const relativeX = clientX - containerRect.left + scrollLeft;
      if (relativeX < mid) return i;
    }
    return tabs.length;
  }, [tabs]);

  const handleDragStart = (e: React.DragEvent, tabId: string) => {
    setDraggedTabId(tabId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', tabId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(() => {
      const idx = computeInsertIndex(e.clientX);
      setInsertIndex(idx);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedTabId === null) return;

    const fromIndex = tabs.findIndex(tab => tab.id === draggedTabId);
    const toIndex = insertIndex !== null ? insertIndex : fromIndex;

    if (fromIndex !== -1 && fromIndex !== toIndex) {
      const adjustedTo = toIndex > fromIndex ? toIndex - 1 : toIndex;
      if (fromIndex !== adjustedTo) {
        dispatch({
          type: 'REORDER_TABS',
          payload: { fromIndex, toIndex: adjustedTo }
        });
      }
    }
    setDraggedTabId(null);
    setInsertIndex(null);
  };

  const handleDragEnd = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setDraggedTabId(null);
    setInsertIndex(null);
  };

  const setTabRef = useCallback((tabId: string, el: HTMLDivElement | null) => {
    if (el) {
      tabRefs.current.set(tabId, el);
    } else {
      tabRefs.current.delete(tabId);
    }
  }, []);

  const renderTab = (tab: Tab, index: number) => {
    const isDragging = draggedTabId === tab.id;
    const showInsertBefore = insertIndex === index && draggedTabId !== null && !isDragging;
    const showInsertAfter = insertIndex === tabs.length && index === tabs.length - 1 && draggedTabId !== null && !isDragging;

    return (
      <React.Fragment key={tab.id}>
        {showInsertBefore && <div className="tab-insert-indicator" />}
        <div
          ref={(el) => setTabRef(tab.id, el)}
          className={`tab-item ${tab.isActive ? 'active' : ''} ${tab.isSleeping ? 'sleeping' : ''} ${isDragging ? 'dragging' : ''}`}
          draggable
          onDragStart={(e) => handleDragStart(e, tab.id)}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
          onClick={() => handleTabClick(tab.id)}
        >
          {tab.isSleeping && <span className="moon-icon">🌙</span>}
          <span className="tab-title">
            {isMobile ? getFirstLetter(tab.url) : tab.title}
          </span>
          <button
            className="tab-close-btn"
            onClick={(e) => handleCloseClick(e, tab.id)}
            aria-label="关闭标签"
          >
            ×
          </button>
          {tab.isActive && <div className="tab-underline" />}
        </div>
        {showInsertAfter && <div className="tab-insert-indicator" />}
      </React.Fragment>
    );
  };

  return (
    <div className="tab-bar">
      {scrollState.showLeft && (
        <button
          className={`scroll-btn left ${scrollState.leftDisabled ? 'disabled' : ''}`}
          onClick={() => !scrollState.leftDisabled && scroll('left')}
          disabled={scrollState.leftDisabled}
          aria-label="向左滚动"
        >
          ‹
        </button>
      )}
      <div
        className="tabs-container"
        ref={scrollContainerRef}
        onScroll={updateScrollState}
      >
        {tabs.map((tab, index) => renderTab(tab, index))}
      </div>
      {scrollState.showRight && (
        <button
          className={`scroll-btn right ${scrollState.rightDisabled ? 'disabled' : ''}`}
          onClick={() => !scrollState.rightDisabled && scroll('right')}
          disabled={scrollState.rightDisabled}
          aria-label="向右滚动"
        >
          ›
        </button>
      )}
    </div>
  );
};

export default React.memo(TabBar);
