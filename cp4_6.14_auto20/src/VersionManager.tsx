import React, { useState } from 'react';
import { VersionSnapshot } from './types';

interface VersionManagerProps {
  versions: VersionSnapshot[];
  onRestore: (versionId: string) => void;
}

const VersionManager: React.FC<VersionManagerProps> = ({ versions, onRestore }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const formatTimestamp = (ts: number): string => {
    const date = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - ts;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;

    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const formatFullTime = (ts: number): string => {
    const date = new Date(ts);
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const handleRestore = (versionId: string) => {
    setIsLoading(true);
    setTimeout(() => {
      onRestore(versionId);
      setTimeout(() => setIsLoading(false), 350);
    }, 50);
  };

  return (
    <div style={styles.section}>
      <h3 style={styles.sectionTitle}>📜 版本历史</h3>

      <div style={styles.versionList}>
        {versions.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🕒</div>
            <div style={styles.emptyText}>暂无历史版本</div>
            <div style={styles.emptyHint}>点击上方「保存版本」创建第一个快照</div>
          </div>
        ) : (
          versions.map((version, index) => (
            <div
              key={version.id}
              style={{
                ...styles.versionItem,
                ...(expandedId === version.id ? styles.versionItemExpanded : {}),
                animationDelay: `${index * 30}ms`
              }}
              onClick={() => setExpandedId(expandedId === version.id ? null : version.id)}
            >
              <div style={styles.versionHeader}>
                <div style={styles.versionLeft}>
                  <div style={{
                    ...styles.versionBadge,
                    backgroundColor: index === 0 ? 'rgba(74, 158, 255, 0.2)' : 'rgba(255,255,255,0.08)'
                  }}>
                    {index === 0 ? '✨ 最新' : `#${versions.length - index}`}
                  </div>
                  <div style={styles.versionInfo}>
                    <div style={styles.versionTime}>{formatTimestamp(version.timestamp)}</div>
                    <div style={styles.versionAuthor}>
                      <span style={styles.authorDot} />
                      {version.author}
                    </div>
                  </div>
                </div>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{
                    ...styles.expandIcon,
                    transform: expandedId === version.id ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                    color: 'rgba(255,255,255,0.5)'
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>

              {expandedId === version.id && (
                <div style={styles.versionDetail}>
                  {version.message && (
                    <div style={styles.versionMessage}>
                      💬 {version.message}
                    </div>
                  )}
                  <div style={styles.versionMeta}>
                    <div style={styles.metaItem}>
                      <span style={styles.metaLabel}>创建时间</span>
                      <span style={styles.metaValue}>{formatFullTime(version.timestamp)}</span>
                    </div>
                    <div style={styles.metaItem}>
                      <span style={styles.metaLabel}>音符数量</span>
                      <span style={styles.metaValue}>{version.score.notes.length} 个</span>
                    </div>
                    <div style={styles.metaItem}>
                      <span style={styles.metaLabel}>速度</span>
                      <span style={styles.metaValue}>♩ = {version.score.tempo}</span>
                    </div>
                    <div style={styles.metaItem}>
                      <span style={styles.metaLabel}>拍号</span>
                      <span style={styles.metaValue}>
                        {version.score.timeSignature.numerator}/{version.score.timeSignature.denominator}
                      </span>
                    </div>
                  </div>

                  <button
                    style={{
                      ...styles.restoreBtn,
                      opacity: isLoading ? 0.6 : 1,
                      pointerEvents: isLoading ? 'none' : 'auto'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRestore(version.id);
                    }}
                  >
                    {isLoading && expandedId === version.id ? (
                      <>
                        <span style={styles.loadingSpinner} />
                        正在恢复...
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                          <path d="M3 3v5h5" />
                        </svg>
                        回滚到此版本
                      </>
                    )}
                  </button>
                </div>
              )}

              {index < versions.length - 1 && expandedId !== version.id && (
                <div style={styles.connector} />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  section: {
    marginBottom: 24
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    marginBottom: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  versionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    maxHeight: 320,
    overflowY: 'auto',
    paddingRight: 4
  },
  emptyState: {
    padding: '32px 16px',
    textAlign: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    border: '1px dashed rgba(255,255,255,0.1)'
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 12,
    opacity: 0.5
  },
  emptyText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: 500,
    marginBottom: 4
  },
  emptyHint: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12
  },
  versionItem: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    padding: '12px 14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: '1px solid transparent',
    position: 'relative'
  },
  versionItemExpanded: {
    backgroundColor: 'rgba(74, 158, 255, 0.08)',
    borderColor: 'rgba(74, 158, 255, 0.25)'
  },
  versionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  versionLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0
  },
  versionBadge: {
    padding: '4px 10px',
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.85)',
    flexShrink: 0,
    whiteSpace: 'nowrap'
  },
  versionInfo: {
    minWidth: 0,
    flex: 1
  },
  versionTime: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 500,
    marginBottom: 2
  },
  versionAuthor: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12
  },
  authorDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.3)',
    flexShrink: 0
  },
  expandIcon: {
    flexShrink: 0
  },
  versionDetail: {
    marginTop: 12,
    paddingTop: 12,
    borderTop: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  },
  versionMessage: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: '10px 12px',
    borderRadius: 8,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    lineHeight: 1.5
  },
  versionMeta: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10
  },
  metaItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2
  },
  metaLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11
  },
  metaValue: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: 500
  },
  restoreBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '10px 16px',
    backgroundColor: '#4a9eff',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginTop: 4
  },
  loadingSpinner: {
    width: 14,
    height: 14,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 0.6s linear infinite'
  },
  connector: {
    position: 'absolute',
    left: 24,
    bottom: -2,
    width: 2,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)'
  }
};

export default VersionManager;
