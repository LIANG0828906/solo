import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useTabContext } from '@/context/TabContext';
import type { Tab } from '@/types';
import './TabPanel.css';

const loadedUrls = new Map<string, string>();

const TabPanel: React.FC = () => {
  const { state, dispatch } = useTabContext();
  const { tabs, activeTabId } = state;
  const activeTab = tabs.find(tab => tab.id === activeTabId);
  const iframeRefs = useRef<Map<string, HTMLIFrameElement>>(new Map());
  const [wakingTabId, setWakingTabId] = useState<string | null>(null);
  const wakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearWaking = useCallback(() => {
    if (wakeTimerRef.current) {
      clearTimeout(wakeTimerRef.current);
      wakeTimerRef.current = null;
    }
    setWakingTabId(null);
  }, []);

  const triggerWaking = useCallback((tabId: string) => {
    if (wakeTimerRef.current) clearTimeout(wakeTimerRef.current);
    setWakingTabId(tabId);
    wakeTimerRef.current = setTimeout(() => {
      setWakingTabId(prev => prev === tabId ? null : prev);
    }, 550);
  }, []);

  const handleWakingAnimationEnd = useCallback(() => {
    clearWaking();
  }, [clearWaking]);

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
      triggerWaking(activeTab.id);
    }
  }, [activeTab?.id, activeTab?.isSleeping, activeTab?.isLoading, activeTab?.url, triggerWaking]);

  useEffect(() => {
    return () => {
      if (wakeTimerRef.current) clearTimeout(wakeTimerRef.current);
    };
  }, []);

  const handleCloseTab = () => {
    if (activeTabId) {
      dispatch({ type: 'REMOVE_TAB', payload: { id: activeTabId } });
    }
  };

  const handleWakeTab = (tabId: string) => {
    triggerWaking(tabId);
    dispatch({ type: 'WAKE_UP_TAB', payload: { id: tabId } });
  };

  const renderIframe = (tab: Tab) => {
    const isVisible = tab.id === activeTabId;
    const isWaking = tab.id === wakingTabId;
    const shouldLoadIframe = !tab.isSleeping;

    if (!tab.isSleeping && tab.url) {
      loadedUrls.set(tab.id, tab.url);
    }

    const iframeSrc = tab.isSleeping
      ? 'about:blank'
      : loadedUrls.get(tab.id) || tab.url;

    return (
      <div
        key={tab.id}
        className={`iframe-wrapper ${isVisible ? 'visible' : 'hidden'} ${tab.isSleeping ? 'sleeping' : ''} ${isWaking ? 'waking' : ''}`}
      >
        {tab.isLoading && isVisible && (
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
              onClick={() => handleWakeTab(tab.id)}
            >
              点击唤醒
            </button>
          </div>
        )}
        {isWaking && (
          <div className="waking-overlay" onAnimationEnd={handleWakingAnimationEnd} />
        )}
        <iframe
          ref={(el) => setIframeRef(tab.id, el)}
          src={shouldLoadIframe ? iframeSrc : 'about:blank'}
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
