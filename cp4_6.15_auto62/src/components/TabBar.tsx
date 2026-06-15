import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTabContext } from '@/context/TabContext';
import { getFirstLetter } from '@/utils/tabUtils';
import type { Tab } from '@/types';
import './TabBar.css';

const TabBar: React.FC = () => {
  const { state, dispatch } = useTabContext();
  const { tabs } = state;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [insertIndex, setInsertIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

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
    const tab = tabs.find(t => t.id === tabId);
    if (tab?.isSleeping) {
      dispatch({ type: 'WAKE_UP_TAB', payload: { id: tabId } });
    } else {
      dispatch({ type: 'SET_ACTIVE_TAB', payload: { id: tabId } });
    }
  };

  const handleCloseClick = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    dispatch({ type: 'REMOVE_TAB', payload: { id: tabId } });
  };

  const handleDragStart = (e: React.DragEvent, tabId: string) => {
    setDraggedTabId(tabId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', tabId);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setInsertIndex(index);
  };

  const handleDragLeave = () => {
    setInsertIndex(null);
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (draggedTabId === null) return;

    const fromIndex = tabs.findIndex(tab => tab.id === draggedTabId);
    if (fromIndex !== -1 && fromIndex !== toIndex) {
      dispatch({
        type: 'REORDER_TABS',
        payload: { fromIndex, toIndex }
      });
    }
    setDraggedTabId(null);
    setInsertIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedTabId(null);
    setInsertIndex(null);
  };

  const renderTab = (tab: Tab, index: number) => {
    const isDragging = draggedTabId === tab.id;
    const isInsertBefore = insertIndex === index;

    return (
      <React.Fragment key={tab.id}>
        {isInsertBefore && <div className="tab-insert-indicator" />}
        <div
          className={`tab-item ${tab.isActive ? 'active' : ''} ${tab.isSleeping ? 'sleeping' : ''} ${isDragging ? 'dragging' : ''}`}
          draggable
          onDragStart={(e) => handleDragStart(e, tab.id)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
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
      </React.Fragment>
    );
  };

  return (
    <div className="tab-bar">
      {showLeftArrow && (
        <button className="scroll-btn left" onClick={() => scroll('left')}>
          ‹
        </button>
      )}
      <div
        className="tabs-container"
        ref={scrollContainerRef}
        onScroll={checkScrollButtons}
      >
        {tabs.map((tab, index) => renderTab(tab, index))}
        {insertIndex === tabs.length && tabs.length > 0 && (
          <div className="tab-insert-indicator" />
        )}
      </div>
      {showRightArrow && (
        <button className="scroll-btn right" onClick={() => scroll('right')}>
          ›
        </button>
      )}
    </div>
  );
};

export default React.memo(TabBar);
