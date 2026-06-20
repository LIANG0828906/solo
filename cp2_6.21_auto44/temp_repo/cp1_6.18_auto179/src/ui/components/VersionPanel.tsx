import React, { useState } from 'react';
import { useEditorStore } from '../store';
import type { Version } from '../../types';

const VersionPanel: React.FC = () => {
  const { versions, restoreVersion, previewVersion, setPreviewVersion, content, comments } =
    useEditorStore();

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handlePreview = (versionId: string) => {
    setPreviewVersion(versionId);
  };

  const handleClosePreview = () => {
    setPreviewVersion(null);
  };

  const handleRestore = (versionId: string) => {
    if (confirm('确定要恢复到此版本吗？当前内容将被替换。')) {
      restoreVersion(versionId);
    }
  };

  const previewData = versions.find((v) => v.id === previewVersion);

  return (
    <div className="version-panel">
      <div className="version-timeline">
        {versions.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#999', padding: '20px 0', fontSize: '13px' }}>
            暂无版本记录
          </div>
        ) : (
          versions.map((version: Version, index: number) => (
            <div
              key={version.id}
              className={`version-item ${previewVersion === version.id ? 'active' : ''}`}
              onClick={() => handlePreview(version.id)}
            >
              <div className="version-time">{formatTime(version.createdAt)}</div>
              <div style={{ fontSize: '11px', color: '#999', marginBottom: '8px' }}>
                {version.wordCount} 字
              </div>
              <div className="version-item-actions" onClick={(e) => e.stopPropagation()}>
                <button
                  className="version-btn preview"
                  onClick={() => handlePreview(version.id)}
                >
                  预览
                </button>
                <button
                  className="version-btn restore"
                  onClick={() => handleRestore(version.id)}
                >
                  恢复
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {previewVersion && previewData && (
        <div className="version-preview-modal" onClick={handleClosePreview}>
          <div
            className="version-preview-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="version-preview-header">
              <span className="version-preview-title">
                版本预览 - {formatTime(previewData.createdAt)}
              </span>
              <button
                className="version-preview-close"
                onClick={handleClosePreview}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="version-preview-body">
              {previewData.content}
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #E8E8E8', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="version-btn restore"
                onClick={() => {
                  handleRestore(previewData.id);
                  handleClosePreview();
                }}
              >
                恢复此版本
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VersionPanel;
