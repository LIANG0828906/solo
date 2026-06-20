import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Version, CanvasElement } from '../types';
import './VersionPanel.css';

function MiniCanvas({ elements, canvasWidth, canvasHeight, scale = 1 }: {
  elements: CanvasElement[];
  canvasWidth: number;
  canvasHeight: number;
  scale?: number;
}) {
  return (
    <div
      className="mini-canvas"
      style={{
        width: canvasWidth * scale,
        height: canvasHeight * scale,
        position: 'relative',
        backgroundColor: '#fff',
        overflow: 'hidden',
      }}
    >
      {elements.map((el) => {
        const style: React.CSSProperties = {
          position: 'absolute',
          left: el.x * scale,
          top: el.y * scale,
          width: el.width * scale,
          height: el.height * scale,
          boxSizing: 'border-box',
          overflow: 'hidden',
        };

        switch (el.type) {
          case 'image': {
            const imgEl = el as any;
            return (
              <div
                key={el.id}
                style={{
                  ...style,
                  backgroundColor: imgEl.backgroundColor || '#e0e0e0',
                  borderRadius: (imgEl.borderRadius || 0) * scale,
                  backgroundImage: `radial-gradient(circle, #ccc 1px, transparent 1px)`,
                  backgroundSize: `${6 * scale}px ${6 * scale}px`,
                }}
              />
            );
          }
          case 'text': {
            const txtEl = el as any;
            return (
              <div
                key={el.id}
                style={{
                  ...style,
                  fontSize: txtEl.fontSize * scale * 0.5,
                  color: txtEl.color,
                  fontWeight: txtEl.fontWeight,
                  textAlign: txtEl.textAlign,
                  border: `${1 * scale}px dashed #ddd`,
                  padding: `${1 * scale}px`,
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                }}
              >
                {txtEl.content}
              </div>
            );
          }
          case 'button': {
            const btnEl = el as any;
            return (
              <div
                key={el.id}
                style={{
                  ...style,
                  backgroundColor: btnEl.backgroundColor,
                  color: btnEl.textColor,
                  fontSize: btnEl.fontSize * scale,
                  borderRadius: btnEl.borderRadius * scale,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 500,
                }}
              >
                {btnEl.text}
              </div>
            );
          }
          case 'divider': {
            const divEl = el as any;
            return (
              <div
                key={el.id}
                style={{
                  ...style,
                  borderTop: `${Math.max(1, divEl.thickness * scale)}px ${divEl.style} ${divEl.color}`,
                  height: 'auto',
                  top: (el.y + el.height / 2) * scale,
                }}
              />
            );
          }
          default:
            return null;
        }
      })}
    </div>
  );
}

export default function VersionPanel() {
  const { project, switchVersion, compareVersionIds, setCompareVersionIds, setView } = useApp();
  const [showPanel, setShowPanel] = useState(false);

  if (!project || project.versions.length === 0) {
    return null;
  }

  const handleVersionSelect = (versionId: string) => {
    switchVersion(versionId);
  };

  const handleToggleCompare = (versionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (compareVersionIds.includes(versionId)) {
      setCompareVersionIds(compareVersionIds.filter(id => id !== versionId));
    } else if (compareVersionIds.length < 4) {
      setCompareVersionIds([...compareVersionIds, versionId]);
    }
  };

  const startCompare = () => {
    if (compareVersionIds.length >= 2) {
      setView('editor');
    }
  };

  const canCompare = compareVersionIds.length >= 2;

  return (
    <div className={`version-panel ${showPanel ? 'open' : ''}`}>
      <button className="panel-toggle-btn" onClick={() => setShowPanel(!showPanel)}>
        {showPanel ? '×' : '版本'}
      </button>

      {showPanel && (
        <div className="panel-container">
          <div className="panel-header">
            <h3>版本管理</h3>
            <span className="version-count-badge">{project.versions.length}/10</span>
          </div>

          {canCompare && (
            <button 
              className="compare-start-btn"
              onClick={startCompare}
            >
              开始对比 ({compareVersionIds.length}个)
            </button>
          )}

          {!canCompare && project.versions.length >= 2 && (
            <p className="compare-hint">选择2-4个版本进行对比</p>
          )}

          <div className="version-list">
            {project.versions.map((version, index) => (
              <div
                key={version.id}
                className={`version-card ${
                  project.currentVersionId === version.id ? 'active' : ''
                } ${compareVersionIds.includes(version.id) ? 'selected' : ''}`}
                onClick={() => handleVersionSelect(version.id)}
              >
                <div className="version-checkbox" onClick={(e) => handleToggleCompare(version.id, e)}>
                  {compareVersionIds.includes(version.id) && '✓'}
                </div>
                <div className="version-thumb">
                  <MiniCanvas
                    elements={version.elements}
                    canvasWidth={version.canvasWidth}
                    canvasHeight={version.canvasHeight}
                    scale={0.12}
                  />
                </div>
                <div className="version-details">
                  <div className="version-name">{version.name}</div>
                  <div className="version-time">
                    {new Date(version.createdAt).toLocaleString('zh-CN', {
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
                {project.currentVersionId === version.id && (
                  <span className="current-badge">当前</span>
                )}
              </div>
            ))}
          </div>

          {project.versions.length >= 10 && (
            <p className="version-limit-tip">已达最大版本限制</p>
          )}
        </div>
      )}
    </div>
  );
}
