import React, { useState, useCallback } from 'react';
import { useScaleStore } from '../store/scaleStore';

type ExportTab = 'json' | 'css';

export const ExportModal: React.FC = () => {
  const { showExportModal, toggleExportModal, getExportJSON, getExportCSS } =
    useScaleStore((state) => ({
      showExportModal: state.showExportModal,
      toggleExportModal: state.toggleExportModal,
      getExportJSON: state.getExportJSON,
      getExportCSS: state.getExportCSS,
    }));

  const [activeTab, setActiveTab] = useState<ExportTab>('json');
  const [copySuccess, setCopySuccess] = useState(false);

  const jsonContent = getExportJSON();
  const cssContent = getExportCSS();
  const currentContent = activeTab === 'json' ? jsonContent : cssContent;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(currentContent);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  }, [currentContent]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([currentContent], {
      type: activeTab === 'json' ? 'application/json' : 'text/css',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeTab === 'json' ? 'typography-scale.json' : 'typography-scale.css';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [currentContent, activeTab]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        toggleExportModal();
      }
    },
    [toggleExportModal]
  );

  if (!showExportModal) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">导出排版规范</h3>
          <button className="modal-close" onClick={toggleExportModal}>
            ×
          </button>
        </div>

        <div className="modal-tabs">
          <button
            className={`modal-tab ${activeTab === 'json' ? 'active' : ''}`}
            onClick={() => setActiveTab('json')}
          >
            JSON
          </button>
          <button
            className={`modal-tab ${activeTab === 'css' ? 'active' : ''}`}
            onClick={() => setActiveTab('css')}
          >
            CSS 变量
          </button>
        </div>

        <div className="modal-body">
          <pre className="code-block">{currentContent}</pre>
        </div>

        <div className="modal-footer">
          {copySuccess && <span className="copy-success">✓ 已复制到剪贴板</span>}
          <button className="btn btn-secondary" onClick={handleCopy}>
            复制
          </button>
          <button className="btn btn-primary" onClick={handleDownload}>
            下载
          </button>
        </div>
      </div>
    </div>
  );
};
