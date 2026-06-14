import { useState, useEffect, useRef } from 'react';
import { worksAPI } from '../api';

interface VersionInfo {
  id: string;
  version: number;
  createdAt: string;
}

interface VersionCompareProps {
  workId: string;
  versions: VersionInfo[];
  onClose: () => void;
}

const containerStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  animation: 'fadeIn 0.2s ease',
  padding: '20px',
};

const modalStyle: React.CSSProperties = {
  background: 'white',
  borderRadius: '16px',
  width: '100%',
  maxWidth: '1000px',
  maxHeight: '90vh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '20px 24px',
  borderBottom: '1px solid #E2E8F0',
};

const titleStyle: React.CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: 600,
  color: '#2D3748',
};

const closeBtnStyle: React.CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: '8px',
  border: 'none',
  background: 'transparent',
  color: '#718096',
  fontSize: '1.25rem',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s ease',
};

const contentStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  padding: '16px 24px',
};

const selectorStyle: React.CSSProperties = {
  display: 'flex',
  gap: '16px',
  marginBottom: '16px',
  flexWrap: 'wrap',
};

const selectorItemStyle: React.CSSProperties = {
  flex: 1,
  minWidth: '200px',
};

const selectorLabelStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  color: '#4A5568',
  marginBottom: '6px',
  fontWeight: 500,
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  fontSize: '0.9rem',
  borderRadius: '8px',
  border: '2px solid #E2E8F0',
  background: 'white',
  cursor: 'pointer',
  outline: 'none',
  transition: 'border-color 0.2s ease',
};

const compareBtnStyle: React.CSSProperties = {
  padding: '10px 24px',
  borderRadius: '8px',
  border: 'none',
  background: 'linear-gradient(135deg, #3B4A6B, #5A6B8C)',
  color: 'white',
  fontSize: '0.9rem',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  alignSelf: 'flex-end',
  marginTop: '8px',
};

const compareContainerStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  gap: '12px',
  minHeight: 0,
  overflow: 'hidden',
};

const versionPanelStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  background: '#F7FAFC',
  borderRadius: '10px',
  overflow: 'hidden',
  border: '1px solid #E2E8F0',
  minWidth: 0,
};

const versionHeaderStyle = (isLeft: boolean): React.CSSProperties => ({
  padding: '10px 16px',
  background: isLeft ? '#EBF8FF' : '#F0FFF4',
  borderBottom: '1px solid #E2E8F0',
  fontSize: '0.85rem',
  fontWeight: 600,
  color: isLeft ? '#2B6CB0' : '#276749',
});

const versionContentStyle: React.CSSProperties = {
  flex: 1,
  padding: '16px',
  overflowY: 'auto',
  fontSize: '0.9rem',
  lineHeight: 1.7,
  color: '#2D3748',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
};

const emptyStateStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#A0AEC0',
  fontSize: '0.9rem',
};

const diffAddedStyle: React.CSSProperties = {
  background: '#C6F6D5',
  padding: '2px 4px',
  borderRadius: '3px',
};

const diffRemovedStyle: React.CSSProperties = {
  background: '#FED7D7',
  textDecoration: 'line-through',
  padding: '2px 4px',
  borderRadius: '3px',
};

const loadingStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '20px',
  color: '#718096',
};

export default function VersionCompare({ workId, versions, onClose }: VersionCompareProps) {
  const [leftVersionId, setLeftVersionId] = useState<string>('');
  const [rightVersionId, setRightVersionId] = useState<string>('');
  const [leftContent, setLeftContent] = useState<string>('');
  const [rightContent, setRightContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [hasCompared, setHasCompared] = useState(false);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const isSyncing = useRef(false);

  useEffect(() => {
    if (versions.length >= 2) {
      setLeftVersionId(versions[1]?.id || '');
      setRightVersionId(versions[0]?.id || '');
    } else if (versions.length === 1) {
      setRightVersionId(versions[0].id);
    }
  }, [versions]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>, isLeft: boolean) => {
    if (isSyncing.current) return;
    isSyncing.current = true;

    const source = isLeft ? leftRef.current : rightRef.current;
    const target = isLeft ? rightRef.current : leftRef.current;

    if (source && target) {
      const scrollPercent = source.scrollTop / (source.scrollHeight - source.clientHeight);
      target.scrollTop = scrollPercent * (target.scrollHeight - target.clientHeight);
    }

    requestAnimationFrame(() => {
      isSyncing.current = false;
    });
  };

  const simpleDiff = (oldText: string, newText: string) => {
    const oldWords = oldText.split(/(\s+)/);
    const newWords = newText.split(/(\s+)/);

    const oldSet = new Set(oldWords.filter((w) => w.trim()));
    const newSet = new Set(newWords.filter((w) => w.trim()));

    const leftRendered: React.ReactNode[] = [];
    const rightRendered: React.ReactNode[] = [];

    oldWords.forEach((word, i) => {
      if (word.trim() && !newSet.has(word.trim())) {
        leftRendered.push(
          <span key={`old-${i}`} style={diffRemovedStyle}>
            {word}
          </span>
        );
      } else {
        leftRendered.push(word);
      }
    });

    newWords.forEach((word, i) => {
      if (word.trim() && !oldSet.has(word.trim())) {
        rightRendered.push(
          <span key={`new-${i}`} style={diffAddedStyle}>
            {word}
          </span>
        );
      } else {
        rightRendered.push(word);
      }
    });

    return { left: leftRendered, right: rightRendered };
  };

  const handleCompare = async () => {
    if (!leftVersionId || !rightVersionId) {
      return;
    }

    setLoading(true);
    try {
      const [leftData, rightData] = await Promise.all([
        worksAPI.getVersion(workId, leftVersionId),
        worksAPI.getVersion(workId, rightVersionId),
      ]);

      const tempDiv1 = document.createElement('div');
      tempDiv1.innerHTML = leftData.content || '';
      const plainLeft = tempDiv1.textContent || tempDiv1.innerText || '';

      const tempDiv2 = document.createElement('div');
      tempDiv2.innerHTML = rightData.content || '';
      const plainRight = tempDiv2.textContent || tempDiv2.innerText || '';

      setLeftContent(plainLeft);
      setRightContent(plainRight);
      setHasCompared(true);
    } catch (err) {
      console.error('加载版本对比失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const getVersionLabel = (versionId: string) => {
    const v = versions.find((v) => v.id === versionId);
    return v ? `版本 ${v.version}` : '';
  };

  const diffResult = hasCompared ? simpleDiff(leftContent, rightContent) : null;

  return (
    <div style={containerStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>📊 版本对比</h2>
          <button
            style={closeBtnStyle}
            onClick={onClose}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#F5F0EB';
              e.currentTarget.style.color = '#2D3748';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#718096';
            }}
          >
            ✕
          </button>
        </div>

        <div style={contentStyle}>
          <div style={selectorStyle}>
            <div style={selectorItemStyle}>
              <div style={selectorLabelStyle}>旧版本</div>
              <select
                style={selectStyle}
                value={leftVersionId}
                onChange={(e) => setLeftVersionId(e.target.value)}
              >
                <option value="">选择版本</option>
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    版本 {v.version} ({new Date(v.createdAt).toLocaleString('zh-CN')})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', fontSize: '1.5rem', color: '#CBD5E0' }}>
              →
            </div>

            <div style={selectorItemStyle}>
              <div style={selectorLabelStyle}>新版本</div>
              <select
                style={selectStyle}
                value={rightVersionId}
                onChange={(e) => setRightVersionId(e.target.value)}
              >
                <option value="">选择版本</option>
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    版本 {v.version} ({new Date(v.createdAt).toLocaleString('zh-CN')})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            style={compareBtnStyle}
            onClick={handleCompare}
            disabled={!leftVersionId || !rightVersionId || loading}
            onMouseEnter={(e) => {
              if (leftVersionId && rightVersionId && !loading) {
                e.currentTarget.style.background = 'linear-gradient(135deg, #C99A3E, #E8B85C)';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(201, 154, 62, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #3B4A6B, #5A6B8C)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {loading ? '加载中...' : '对比'}
          </button>

          <div style={compareContainerStyle}>
            {!hasCompared && !loading && (
              <div style={{ ...emptyStateStyle, width: '100%' }}>
                选择两个版本后点击"对比"按钮查看差异
              </div>
            )}

            {loading && (
              <div style={{ ...emptyStateStyle, width: '100%' }}>
                <div style={loadingStyle}>加载中...</div>
              </div>
            )}

            {hasCompared && !loading && (
              <>
                <div style={versionPanelStyle}>
                  <div style={versionHeaderStyle(true)}>
                    📕 {getVersionLabel(leftVersionId)}（旧版）
                  </div>
                  <div
                    ref={leftRef}
                    style={versionContentStyle}
                    onScroll={(e) => handleScroll(e, true)}
                  >
                    {leftContent ? (
                      diffResult?.left
                    ) : (
                      <span style={{ color: '#A0AEC0' }}>无内容</span>
                    )}
                  </div>
                </div>

                <div style={versionPanelStyle}>
                  <div style={versionHeaderStyle(false)}>
                    📗 {getVersionLabel(rightVersionId)}（新版）
                  </div>
                  <div
                    ref={rightRef}
                    style={versionContentStyle}
                    onScroll={(e) => handleScroll(e, false)}
                  >
                    {rightContent ? (
                      diffResult?.right
                    ) : (
                      <span style={{ color: '#A0AEC0' }}>无内容</span>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {hasCompared && (
            <div
              style={{
                display: 'flex',
                gap: '16px',
                justifyContent: 'center',
                padding: '12px 0',
                fontSize: '0.8rem',
                color: '#718096',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', background: '#FED7D7', borderRadius: '2px', textDecoration: 'line-through' }}></span>
                删除内容
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', background: '#C6F6D5', borderRadius: '2px' }}></span>
                新增内容
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
