import { useState, useEffect, useRef, useMemo } from 'react';
import { formatRelative, format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import * as Diff from 'diff';
import type { DocVersion } from './types';

interface HistoryPanelProps {
  versions: DocVersion[];
  currentContent: string;
  selectedVersionId: string | null;
  onSelectVersion: (versionId: string | null) => void;
  onRestoreVersion: (versionId: string) => void;
}

const ITEM_HEIGHT = 60;
const EXPANDED_HEIGHT = 280;
const VIRTUAL_THRESHOLD = 100;
const BUFFER_ITEMS = 5;

const HistoryPanel: React.FC<HistoryPanelProps> = ({
  versions,
  currentContent,
  selectedVersionId,
  onSelectVersion,
  onRestoreVersion
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };
    updateHeight();
    const ro = new ResizeObserver(updateHeight);
    if (containerRef.current) {
      ro.observe(containerRef.current);
    }
    return () => ro.disconnect();
  }, []);

  const getItemHeight = (index: number) => {
    const v = versions[index];
    if (!v) return ITEM_HEIGHT;
    if (expandedId === v.id) return EXPANDED_HEIGHT;
    return ITEM_HEIGHT;
  };

  const virtualConfig = useMemo(() => {
    if (versions.length <= VIRTUAL_THRESHOLD) {
      return null;
    }

    let totalHeight = 0;
    const offsets: number[] = [];
    for (let i = 0; i < versions.length; i++) {
      offsets.push(totalHeight);
      totalHeight += getItemHeight(i);
    }

    let startIdx = 0;
    let endIdx = versions.length;
    const visibleTop = scrollTop;
    const visibleBottom = scrollTop + containerHeight;

    for (let i = 0; i < versions.length; i++) {
      if (offsets[i] + getItemHeight(i) < visibleTop) {
        startIdx = i + 1;
      }
      if (offsets[i] > visibleBottom) {
        endIdx = i;
        break;
      }
    }

    startIdx = Math.max(0, startIdx - BUFFER_ITEMS);
    endIdx = Math.min(versions.length, endIdx + BUFFER_ITEMS);

    return {
      totalHeight,
      offsets,
      startIdx,
      endIdx,
      startOffset: offsets[startIdx] || 0
    };
  }, [versions.length, scrollTop, containerHeight, expandedId]);

  const renderDiffPreview = (version: DocVersion) => {
    const oldText = stripHtml(version.content);
    const newText = stripHtml(currentContent);
    const changes = Diff.diffWords(oldText, newText);

    let addedCount = 0;
    let removedCount = 0;
    changes.forEach(c => {
      if (c.added) addedCount += c.value.split(/\s+/).filter(Boolean).length;
      if (c.removed) removedCount += c.value.split(/\s+/).filter(Boolean).length;
    });

    const previewElements: React.ReactNode[] = [];
    let charCount = 0;
    const MAX_CHARS = 500;

    for (let i = 0; i < changes.length && charCount < MAX_CHARS; i++) {
      const part = changes[i];
      const remaining = MAX_CHARS - charCount;
      let text = part.value;
      let isTruncated = false;

      if (text.length > remaining) {
        text = text.slice(0, remaining);
        isTruncated = true;
      }
      charCount += text.length;

      if (part.added) {
        previewElements.push(
          <span
            key={i}
            style={{
              backgroundColor: 'rgba(40, 167, 69, 0.25)',
              borderBottom: '2px solid #28A745',
              padding: '0 1px',
              borderRadius: '2px'
            }}
          >
            {text}
          </span>
        );
      } else if (part.removed) {
        previewElements.push(
          <span
            key={i}
            style={{
              backgroundColor: 'rgba(220, 53, 69, 0.25)',
              borderBottom: '2px solid #DC3545',
              textDecoration: 'line-through',
              padding: '0 1px',
              borderRadius: '2px',
              opacity: 0.7
            }}
          >
            {text}
          </span>
        );
      } else {
        previewElements.push(<span key={i} style={{ color: '#6C757D' }}>{text}</span>);
      }

      if (isTruncated) break;
    }

    if (charCount >= MAX_CHARS) {
      previewElements.push(
        <span key="ellipsis" style={{ color: '#ADB5BD' }}>...</span>
      );
    }

    return { previewElements, addedCount, removedCount };
  };

  const stripHtml = (html: string): string => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const handleItemClick = (versionId: string) => {
    const isExpanded = expandedId === versionId;
    setExpandedId(isExpanded ? null : versionId);
    onSelectVersion(isExpanded ? null : versionId);
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    if (diff < 60000) return '刚刚';
    if (diff < 86400000) {
      return formatRelative(timestamp, now, { locale: zhCN });
    }
    return format(timestamp, 'yyyy/MM/dd HH:mm', { locale: zhCN });
  };

  const renderVersionItem = (version: DocVersion, index: number) => {
    const isExpanded = expandedId === version.id;
    const isSelected = selectedVersionId === version.id;
    const { previewElements, addedCount, removedCount } = renderDiffPreview(version);

    return (
      <div
        key={version.id}
        ref={(el) => {
          if (el) itemRefs.current.set(version.id, el);
          else itemRefs.current.delete(version.id);
        }}
        style={{
          overflow: 'hidden',
          transition: 'height 0.3s ease',
          height: isExpanded ? EXPANDED_HEIGHT : ITEM_HEIGHT,
          borderBottom: index < versions.length - 1 ? '1px solid #E9ECEF' : 'none'
        }}
      >
        <div
          onClick={() => handleItemClick(version.id)}
          style={{
            padding: '12px 16px',
            cursor: 'pointer',
            backgroundColor: isSelected ? 'rgba(13, 110, 253, 0.05)' : 'transparent',
            borderLeft: isSelected ? '3px solid #0D6EFD' : '3px solid transparent',
            transition: 'background-color 0.15s ease',
            minHeight: ITEM_HEIGHT,
            boxSizing: 'border-box'
          }}
          onMouseEnter={(e) => {
            if (!isSelected) {
              e.currentTarget.style.backgroundColor = '#F8F9FA';
            }
          }}
          onMouseLeave={(e) => {
            if (!isSelected) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '10px'
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '4px'
              }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 6px',
                  backgroundColor: '#E9ECEF',
                  color: '#495057',
                  borderRadius: '4px'
                }}>
                  v{version.versionNumber}
                </span>
                {version.restoredFrom && (
                  <span style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    backgroundColor: 'rgba(255, 193, 7, 0.2)',
                    color: '#856404',
                    borderRadius: '4px'
                  }}>
                    ↺ 恢复
                  </span>
                )}
                <span style={{
                  fontSize: '12px',
                  color: '#6C757D',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {version.userName}
                </span>
              </div>
              <div style={{
                fontSize: '11px',
                color: '#ADB5BD'
              }}>
                {formatTime(version.timestamp)}
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexShrink: 0
            }}>
              {(addedCount > 0 || removedCount > 0) && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '10px'
                }}>
                  {addedCount > 0 && (
                    <span style={{ color: '#28A745', fontWeight: 600 }}>+{addedCount}</span>
                  )}
                  {removedCount > 0 && (
                    <span style={{ color: '#DC3545', fontWeight: 600 }}>-{removedCount}</span>
                  )}
                </div>
              )}
              <div style={{
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isExpanded ? '#0D6EFD' : '#ADB5BD',
                fontSize: '14px',
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease'
              }}>
                ▼
              </div>
            </div>
          </div>
        </div>

        <div style={{
          maxHeight: EXPANDED_HEIGHT - ITEM_HEIGHT,
          overflow: 'hidden',
          padding: isExpanded ? '0 16px 12px' : '0 16px',
          opacity: isExpanded ? 1 : 0,
          transition: 'opacity 0.2s ease 0.1s'
        }}>
          <div style={{
            padding: '10px 12px',
            backgroundColor: '#F8F9FA',
            borderRadius: '6px',
            maxHeight: '140px',
            overflowY: 'auto',
            fontSize: '12px',
            lineHeight: 1.6,
            border: '1px solid #E9ECEF',
            marginBottom: '10px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}>
            {previewElements.length > 0 ? previewElements : (
              <span style={{ color: '#ADB5BD', fontStyle: 'italic' }}>与当前版本无差异</span>
            )}
          </div>

          <div style={{
            display: 'flex',
            gap: '8px'
          }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (selectedVersionId === version.id) {
                  onSelectVersion(null);
                } else {
                  onSelectVersion(version.id);
                }
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid #DEE2E6',
                backgroundColor: isSelected ? '#0D6EFD' : '#FFFFFF',
                color: isSelected ? '#FFFFFF' : '#495057',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 500,
                transition: 'all 0.15s ease'
              }}
            >
              {isSelected ? '✓ 正在预览' : '👁️ 预览差异'}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRestoreVersion(version.id);
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: 'none',
                backgroundColor: '#FFC107',
                color: '#212529',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#E0A800';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#FFC107';
              }}
            >
              ↺ 恢复
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderedVersions = virtualConfig
    ? versions.slice(virtualConfig.startIdx, virtualConfig.endIdx)
    : versions;

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0
    }}>
      <div style={{
        padding: '14px 16px',
        borderBottom: '1px solid #E9ECEF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#212529' }}>
            📜 版本历史
          </div>
          <div style={{ fontSize: '11px', color: '#ADB5BD', marginTop: '2px' }}>
            共 {versions.length} 个版本
          </div>
        </div>
        {versions.length > VIRTUAL_THRESHOLD && (
          <span style={{
            fontSize: '10px',
            padding: '2px 8px',
            backgroundColor: 'rgba(13, 110, 253, 0.1)',
            color: '#0D6EFD',
            borderRadius: '10px',
            fontWeight: 500
          }}>
            虚拟滚动
          </span>
        )}
      </div>

      {versions.length === 0 ? (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          color: '#ADB5BD',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
          <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>暂无版本记录</div>
          <div style={{ fontSize: '12px' }}>开始编辑文档后，系统将自动保存版本</div>
        </div>
      ) : (
        <div
          ref={containerRef}
          onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
          style={{
            flex: 1,
            overflowY: 'auto',
            position: 'relative'
          }}
        >
          {virtualConfig ? (
            <div style={{ height: virtualConfig.totalHeight, position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  top: virtualConfig.startOffset,
                  left: 0,
                  right: 0,
                  willChange: 'transform'
                }}
              >
                {renderedVersions.map((version, i) =>
                  renderVersionItem(version, virtualConfig.startIdx + i)
                )}
              </div>
            </div>
          ) : (
            <div>
              {renderedVersions.map((version, i) =>
                renderVersionItem(version, i)
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HistoryPanel;
