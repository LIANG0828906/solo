import React, { useEffect, useRef, useCallback } from 'react';
import { useTabContext } from '@/context/TabContext';
import type { Tab } from '@/types';
import './TabPanel.css';

const TabPanel: React.FC = () => {
  const { state, dispatch } = useTabContext();
  const { tabs, activeTabId } = state;
  const activeTab = tabs.find(tab => tab.id === activeTabId);
  const iframeRefs = useRef<Map<string, HTMLIFrameElement>>(new Map());

  const handleActivity = useCallback((tabId: string) => {
    dispatch({ type: 'UPDATE_ACTIVITY', payload: { id: tabId } });
  }, [dispatch]);

  useEffect(() => {
    const handleMouseMove = () => {
      if (activeTabId) {
        handleActivity(activeTabId);
      }
    };
    const handleKeyDown = () => {
      if (activeTabId) {
        handleActivity(activeTabId);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeTabId, handleActivity]);

  const handleIframeLoad = useCallback((tabId: string) => {
    dispatch({ type: 'SET_LOADING', payload: { id: tabId, isLoading: false } });
  }, [dispatch]);

  const setIframeRef = useCallback((tabId: string, el: HTMLIFrameElement | null) => {
    if (el) {
      iframeRefs.current.set(tabId, el);
    } else {
      iframeRefs.current.delete(tabId);
    }
  }, []);

  useEffect(() => {
    if (activeTab?.isSleeping && activeTab.isLoading) {
      const iframe = iframeRefs.current.get(activeTab.id);
      if (iframe) {
        iframe.src = activeTab.url;
      }
    }
  }, [activeTab?.id, activeTab?.isSleeping, activeTab?.isLoading, activeTab?.url]);

  const handleCloseTab = () => {
    if (activeTabId) {
      dispatch({ type: 'REMOVE_TAB', payload: { id: activeTabId } });
    }
  };

  const renderIframe = (tab: Tab) => {
    const isVisible = tab.id === activeTabId;

    return (
      <div
        key={tab.id}
        className={`iframe-wrapper ${isVisible ? 'visible' : 'hidden'} ${tab.isSleeping ? 'sleeping' : ''}`}
      >
        {tab.isLoading && (
          <div className="progress-bar-container">
            <div className="progress-bar" />
          </div>
        )}
        {tab.isSleeping && (
          <div className="sleeping-overlay">
            <div className="sleeping-icon">🌙</div>
            <p>此标签页已休眠</p>
            <button
              className="wake-btn"
              onClick={() => dispatch({ type: 'WAKE_UP_TAB', payload: { id: tab.id } })}
            >
              点击唤醒
            </button>
          </div>
        )}
        <iframe
          ref={(el) => setIframeRef(tab.id, el)}
          src={tab.isSleeping ? 'about:blank' : tab.url}
          title={tab.title}
          onLoad={() => handleIframeLoad(tab.id)}
          className={`tab-iframe ${tab.isLoading ? 'loading' : 'loaded'}`}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          loading="lazy"
        />
      </div>
    );
  };

  const renderEmptyState = () => (
    <div className="empty-state">
      <div className="empty-content">
        <div className="empty-icon">📑</div>
        <p className="empty-text">请从书签中选择一个网站打开</p>
      </div>
    </div>
  );

  return (
    <div className="tab-panel">
      {activeTab && (
        <div className="panel-header">
          <button className="panel-close-btn" onClick={handleCloseTab} aria-label="关闭当前标签页">
            ×
          </button>
        </div>
      )}
      <div className="panel-content">
        {tabs.length === 0 && renderEmptyState()}
        {tabs.map(tab => renderIframe(tab))}
      </div>
    </div>
  );
};

export default React.memo(TabPanel);
