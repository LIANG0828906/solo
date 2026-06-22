import React, { useState, useEffect } from 'react';
import type { Version, DiffLine } from '../types';

interface VersionPanelProps {
  documentId: string;
  versions: Version[];
  selectedVersionId: string | null;
  onSelectVersion: (version: Version) => void;
  onCreateVersion: (name: string) => void;
  onRollback: (versionId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  currentVersionId?: string;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) {
    return `${diffDays}天前`;
  }
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

function formatFullTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN');
}

export function computeDiff(oldContent: string, newContent: string): DiffLine[] {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');
  const result: DiffLine[] = [];

  const dp: number[][] = Array(oldLines.length + 1)
    .fill(null)
    .map(() => Array(newLines.length + 1).fill(0));

  for (let i = 1; i <= oldLines.length; i++) {
    for (let j = 1; j <= newLines.length; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  let i = oldLines.length;
  let j = newLines.length;
  const changes: { type: 'unchanged' | 'added' | 'removed'; content: string; oldIdx: number; newIdx: number }[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      changes.unshift({ type: 'unchanged', content: oldLines[i - 1], oldIdx: i - 1, newIdx: j - 1 });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      changes.unshift({ type: 'added', content: newLines[j - 1], oldIdx: -1, newIdx: j - 1 });
      j--;
    } else if (i > 0) {
      changes.unshift({ type: 'removed', content: oldLines[i - 1], oldIdx: i - 1, newIdx: -1 });
      i--;
    }
  }

  let lineNum = 0;
  changes.forEach((change) => {
    result.push({
      type: change.type,
      content: change.content,
      lineNumber: change.newIdx >= 0 ? change.newIdx : change.oldIdx,
      oldLineNumber: change.oldIdx >= 0 ? change.oldIdx : undefined,
    });
    if (change.type !== 'removed') lineNum++;
  });

  return result;
}

const VersionPanel: React.FC<VersionPanelProps> = ({
  versions,
  selectedVersionId,
  onSelectVersion,
  onCreateVersion,
  onRollback,
  isCollapsed,
  onToggleCollapse,
  currentVersionId,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [versionName, setVersionName] = useState('');

  const handleCreateVersion = () => {
    if (versionName.trim()) {
      onCreateVersion(versionName.trim());
      setVersionName('');
      setShowCreateModal(false);
    }
  };

  if (isCollapsed) {
    return (
      <div className="sidebar-left collapsed">
        <button className="collapse-btn" onClick={onToggleCollapse} style={{ position: 'absolute', top: 12, left: 0 }}>
          ◀
        </button>
      </div>
    );
  }

  return (
    <aside className="sidebar-left">
      <div className="sidebar-header">
        <div className="sidebar-title">
          📜 版本历史
          <span className="section-count">{versions.length}</span>
        </div>
        <button className="collapse-btn" onClick={onToggleCollapse}>
          ◀
        </button>
      </div>
      <div className="sidebar-content">
        {versions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-text">暂无版本记录</div>
          </div>
        ) : (
          <div className="version-timeline">
            {versions.map((version) => (
              <div
                key={version.id}
                className={`version-item ${version.isAuto ? 'auto' : ''} ${selectedVersionId === version.id ? 'selected' : ''} ${version.id === currentVersionId ? 'current' : ''}`}
                onClick={() => onSelectVersion(version)}
                title={`${formatFullTime(version.timestamp)} - ${version.author}`}
              >
                <div className="version-dot"></div>
                <div className="version-header">
                  <span className="version-name" title={version.name}>
                    {version.name}
                  </span>
                  {version.id === currentVersionId ? (
                    <span className="version-badge current">当前</span>
                  ) : version.isAuto ? (
                    <span className="version-badge auto">自动</span>
                  ) : null}
                </div>
                <div className="version-meta">
                  <span className="version-author">👤 {version.author}</span>
                  <span>🕐 {formatTime(version.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="sidebar-footer">
        <button
          className="btn-accent"
          style={{ width: '100%' }}
          onClick={() => setShowCreateModal(true)}
        >
          + 创建版本快照
        </button>
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">创建版本快照</h2>
            <div className="modal-body">
              <input
                type="text"
                className="modal-input"
                placeholder="输入版本名称（如：v1.0 完成初稿）"
                value={versionName}
                onChange={(e) => setVersionName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateVersion()}
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                取消
              </button>
              <button
                className="btn-accent"
                onClick={handleCreateVersion}
                disabled={!versionName.trim()}
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default VersionPanel;
