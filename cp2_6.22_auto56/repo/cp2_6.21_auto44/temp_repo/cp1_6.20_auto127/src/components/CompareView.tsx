import React from 'react';
import { useApp } from '../context/AppContext';
import type { Version, CanvasElement } from '../types';
import './CompareView.css';

interface CompareCanvasProps {
  version: Version;
  diffElements: Set<string>;
  scale: number;
}

function CompareCanvas({ version, diffElements, scale }: CompareCanvasProps) {
  return (
    <div className="compare-canvas-wrapper">
      <div className="compare-version-name">{version.name}</div>
      <div
        className="compare-canvas"
        style={{
          width: version.canvasWidth * scale,
          height: version.canvasHeight * scale,
          position: 'relative',
          backgroundColor: '#fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          borderRadius: '4px',
        }}
      >
        {version.elements.map((el) => {
          const isDiff = diffElements.has(el.id);
          const style: React.CSSProperties = {
            position: 'absolute',
            left: el.x * scale,
            top: el.y * scale,
            width: el.width * scale,
            height: el.height * scale,
            boxSizing: 'border-box',
            overflow: 'hidden',
          };

          let content;
          switch (el.type) {
            case 'image': {
              const imgEl = el as any;
              content = (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: imgEl.backgroundColor || '#e0e0e0',
                    borderRadius: (imgEl.borderRadius || 0) * scale,
                    backgroundImage: `radial-gradient(circle, #ccc 1px, transparent 1px)`,
                    backgroundSize: `${6 * scale}px ${6 * scale}px`,
                  }}
                />
              );
              break;
            }
            case 'text': {
              const txtEl = el as any;
              content = (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    fontSize: txtEl.fontSize * scale * 0.7,
                    fontFamily: txtEl.fontFamily,
                    color: txtEl.color,
                    fontWeight: txtEl.fontWeight,
                    textAlign: txtEl.textAlign,
                    border: `${1 * scale}px dashed #ccc`,
                    padding: `${2 * scale}px`,
                    overflow: 'hidden',
                  }}
                >
                  {txtEl.content}
                </div>
              );
              break;
            }
            case 'button': {
              const btnEl = el as any;
              content = (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
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
              break;
            }
            case 'divider': {
              const divEl = el as any;
              content = (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    borderTop: `${Math.max(1, divEl.thickness * scale)}px ${divEl.style} ${divEl.color}`,
                    position: 'relative',
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}
                />
              );
              break;
            }
            default:
              content = null;
          }

          return (
            <div
              key={el.id}
              style={style}
              className={isDiff ? 'highlight-diff-element' : ''}
            >
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function computeDiff(versions: Version[]): Set<string>[] {
  if (versions.length < 2) return versions.map(() => new Set<string>());

  const diffSets: Set<string>[] = versions.map(() => new Set<string>());

  for (let i = 0; i < versions.length; i++) {
    for (let j = i + 1; j < versions.length; j++) {
      const v1 = versions[i];
      const v2 = versions[j];

      const v1Elements = new Map(v1.elements.map(e => [e.id, e]));
      const v2Elements = new Map(v2.elements.map(e => [e.id, e]));

      for (const [id, el1] of v1Elements) {
        const el2 = v2Elements.get(id);
        if (!el2) {
          diffSets[i].add(id);
        } else {
          const hasDiff = JSON.stringify(el1) !== JSON.stringify(el2);
          if (hasDiff) {
            diffSets[i].add(id);
            diffSets[j].add(id);
          }
        }
      }

      for (const [id] of v2Elements) {
        if (!v1Elements.has(id)) {
          diffSets[j].add(id);
        }
      }
    }
  }

  return diffSets;
}

export default function CompareView() {
  const { project, compareVersionIds, setCompareVersionIds, setView } = useApp();

  if (!project || compareVersionIds.length < 2) {
    return null;
  }

  const compareVersions = compareVersionIds
    .map(id => project.versions.find(v => v.id === id))
    .filter((v): v is Version => v !== undefined);

  const diffSets = computeDiff(compareVersions);
  const compareScale = 0.5;

  const gridCols = compareVersions.length === 1 ? 1 : compareVersions.length <= 2 ? 2 : 2;

  return (
    <div className="compare-view">
      <div className="compare-header">
        <div className="compare-header-left">
          <button className="toolbar-btn" onClick={() => setView('templates')}>
            ← 返回模板
          </button>
          <h2>版本对比</h2>
        </div>
        <div className="compare-actions">
          <span className="compare-info">已选择 {compareVersionIds.length} 个版本</span>
          <button 
            className="toolbar-btn" 
            onClick={() => setCompareVersionIds([])}
          >
            退出对比
          </button>
          <button 
            className="toolbar-btn primary" 
            onClick={() => setView('editor')}
          >
            返回编辑
          </button>
        </div>
      </div>

      <div 
        className="compare-grid"
        style={{
          gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
          gridTemplateRows: compareVersions.length > 2 ? '1fr 1fr' : '1fr',
        }}
      >
        {compareVersions.map((version, index) => (
          <div key={version.id} className="compare-item">
            <CompareCanvas
              version={version}
              diffElements={diffSets[index]}
              scale={compareScale}
            />
          </div>
        ))}
      </div>

      <div className="compare-legend">
        <div className="legend-item">
          <span className="legend-dot legend-highlight" />
          <span>差异区域（闪烁高亮）</span>
        </div>
        <div className="legend-item">
          <span>共 {diffSets.reduce((acc, set) => acc + set.size, 0)} 处差异</span>
        </div>
      </div>
    </div>
  );
}
