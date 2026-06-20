import React from 'react';
import { useStore } from '../store/useStore';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

export const AboutModal: React.FC = () => {
  const { showAboutModal, setShowAboutModal, isDarkMode } = useStore();

  useKeyboardShortcuts([
    {
      key: 'Escape',
      handler: () => setShowAboutModal(false)
    }
  ], {
    enabled: showAboutModal
  });

  if (!showAboutModal) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowAboutModal(false);
    }
  };

  return (
    <div 
      className={`modal-overlay ${isDarkMode ? 'dark' : ''}`}
      onClick={handleOverlayClick}
    >
      <div className="modal-content">
        <div className="modal-header">
          <h2>关于纸读</h2>
          <button 
            className="modal-close"
            onClick={() => setShowAboutModal(false)}
          >
            ×
          </button>
        </div>
        
        <div className="modal-body">
          <section className="about-section">
            <h3>版本信息</h3>
            <p>纸读阅读器 v1.0.0</p>
          </section>
          
          <section className="about-section">
            <h3>快捷键</h3>
            <ul className="shortcut-list">
              <li><kbd>空格</kbd> / <kbd>↓</kbd> / <kbd>→</kbd> - 向下滚动半页</li>
              <li><kbd>↑</kbd> / <kbd>←</kbd> - 向上滚动半页</li>
              <li><kbd>N</kbd> - 下一篇未读文章</li>
              <li><kbd>B</kbd> - 上一篇已读文章</li>
              <li><kbd>F</kbd> - 切换收藏状态</li>
              <li><kbd>T</kbd> - 切换夜间模式</li>
              <li><kbd>M</kbd> - 标记已读/未读</li