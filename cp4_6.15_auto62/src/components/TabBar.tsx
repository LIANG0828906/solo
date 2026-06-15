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
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
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

  const checkScrollButtons = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    setShowLeftArrow(container.scrollLeft > 0);
    setShowRightArrow(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 1
    );
  }, []);

  useEffect(() => {
    checkScrollButtons();
  }, [tabs.length, checkScrollButtons]);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const scrollAmount = 200;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

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
    const container = scrollContainerRef.current;
    if (!container) return 0;

    const containerRect = container.getBoundingClientRect();
    const relativeX = clientX - containerRect.left + container.scrollLeft;

    let accumulated = 0;
    for (let i = 0; i < tabs.length; i++) {
      const el = tabRefs.current.get(tabs[i].id);
      if (!el) continue;
      const tabMid = accumulated + el.offsetWidth / 2;
      if (relativeX < tabMid) return i;
      accumulated += el.offsetWidth + 4;
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
      {showLeftArrow && (
        <button className="scroll-btn left" onClick={() => scroll('left')} aria-label="向左滚动">
          ‹
        </button>
      )}
      <div
        className="tabs-container"
        ref={scrollContainerRef}
        onScroll={checkScrollButtons}
      >
        {tabs.map((tab, index) => renderTab(tab, index))}
      </div>
      {showRightArrow && (
        <button className="scroll-btn right" onClick={() => scroll('right')} aria-label="向右滚动">
          ›
        </button>
      )}
    </div>
  );
};

export default React.memo(TabBar);
