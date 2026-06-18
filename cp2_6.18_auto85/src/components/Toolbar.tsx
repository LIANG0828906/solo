import React, { useState } from 'react';
import { useExhibitionStore } from '@/store/useExhibitionStore';

interface ToolbarProps {
  onNewExhibition: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onNewExhibition }) => {
  const {
    currentExhibitionId,
    getExhibitionById,
    exhibitions,
    setCurrentExhibition,
    publishExhibition,
    unpublishExhibition,
    getShareLink,
    toggleTour,
    isTourMode,
    getPlacementsByExhibition,
  } = useExhibitionStore();

  const [copied, setCopied] = useState(false);
  const [showExhibitionList, setShowExhibitionList] = useState(false);

  const currentExhibition = currentExhibitionId ? getExhibitionById(currentExhibitionId) : undefined;
  const placementCount = currentExhibitionId ? getPlacementsByExhibition(currentExhibitionId).length : 0;

  const handleCopyLink = async () => {
    if (!currentExhibitionId) return;
    const link = getShareLink(currentExhibitionId);
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = link;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePublishToggle = () => {
    if (!currentExhibitionId || !currentExhibition) return;
    if (currentExhibition.isPublished) {
      if (confirm('确定要下架此展览吗？访客将无法通过链接访问。')) {
        unpublishExhibition(currentExhibitionId);
      }
    } else {
      publishExhibition(currentExhibitionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      const link = getShareLink(currentExhibitionId);
      navigator.clipboard?.writeText(link).catch(() => {});
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 64,
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #334155',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 500,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #4F46E5 0%, #22C55E 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              boxShadow: '0 2px 12px rgba(79, 70, 229, 0.4)',
            }}
          >
            🎨
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#F8FAFC' }}>虚拟艺术展览</div>
            <div style={{ fontSize: 11, color: '#64748B' }}>Virtual Art Exhibition</div>
          </div>
        </div>

        {currentExhibition && (
          <div
            style={{
              padding: '8px 16px',
              background: 'rgba(71, 85, 105, 0.3)',
              borderRadius: 10,
              border: '1px solid #475569',
              maxWidth: 320,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: '#F8FAFC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentExhibition.name}
              {currentExhibition.isPublished && (
                <span
                  style={{
                    marginLeft: 8,
                    padding: '2px 8px',
                    fontSize: 10,
                    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(79, 70, 229, 0.3))',
                    color: '#A3E635',
                    borderRadius: 4,
                    border: '1px solid rgba(163, 230, 53, 0.3)',
                    fontWeight: 600,
                  }}
                >
                  已发布
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
              {placementCount} 件作品布展 · 访问 {currentExhibition.visitCount}
            </div>
          </div>
        )}

        <div style={{ position: 'relative' }}>
          <button
            className="btn-secondary"
            style={{ padding: '8px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={() => setShowExhibitionList(!showExhibitionList)}
          >
            📋 我的展览 ({exhibitions.length})
          </button>
          {showExhibitionList && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                width: 280,
                background: 'rgba(30, 41, 59, 0.98)',
                backdropFilter: 'blur(12px)',
                border: '1px solid #475569',
                borderRadius: 12,
                padding: 8,
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
                maxHeight: 320,
                overflowY: 'auto',
                zIndex: 1000,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {exhibitions.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#64748B', fontSize: 12 }}>
                  暂无展览，点击右侧按钮创建
                </div>
              ) : (
                exhibitions
                  .sort((a, b) => b.createdAt - a.createdAt)
                  .map((ex) => (
                    <div
                      key={ex.id}
                      onClick={() => {
                        setCurrentExhibition(ex.id);
                        setShowExhibitionList(false);
                      }}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        marginBottom: 4,
                        background: ex.id === currentExhibitionId ? 'rgba(79, 70, 229, 0.2)' : 'transparent',
                        border: ex.id === currentExhibitionId ? '1px solid rgba(79, 70, 229, 0.4)' : '1px solid transparent',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        if (ex.id !== currentExhibitionId) {
                          (e.currentTarget as HTMLDivElement).style.background = 'rgba(71, 85, 105, 0.3)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (ex.id !== currentExhibitionId) {
                          (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#F8FAFC' }}>
                          {ex.name}
                        </span>
                        {ex.isPublished && (
                          <span style={{ fontSize: 10, color: '#22C55E', fontWeight: 600 }}>✓</span>
                        )}
                      </div>
                      <div style={{ fontSize: 10, color: '#64748B', marginTop: 4 }}>
                        {new Date(ex.createdAt).toLocaleDateString('zh-CN')} · {ex.visitCount} 次访问
                      </div>
                    </div>
                  ))
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          className="btn-secondary"
          style={{ padding: '8px 14px', fontSize: 13 }}
          onClick={onNewExhibition}
        >
          ✨ 新建展览
        </button>

        {currentExhibitionId && (
          <>
            <button
              onClick={toggleTour}
              disabled={placementCount === 0 || isTourMode}
              className="btn-secondary"
              style={{
                padding: '8px 14px',
                fontSize: 13,
                opacity: placementCount === 0 ? 0.5 : 1,
                cursor: placementCount === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              {isTourMode ? '🎬 导览中...' : '▶️ 虚拟导览'}
            </button>

            <button
              onClick={handleCopyLink}
              disabled={!currentExhibition?.isPublished}
              className="btn-secondary"
              style={{
                padding: '8px 14px',
                fontSize: 13,
                opacity: !currentExhibition?.isPublished ? 0.5 : 1,
                cursor: !currentExhibition?.isPublished ? 'not-allowed' : 'pointer',
              }}
            >
              {copied ? '✅ 已复制' : '🔗 复制链接'}
            </button>

            <button
              onClick={handlePublishToggle}
              disabled={placementCount === 0}
              className="btn-gradient"
              style={{
                padding: '10px 18px',
                fontSize: 13,
                opacity: placementCount === 0 ? 0.5 : 1,
                cursor: placementCount === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              {currentExhibition?.isPublished ? '⬇️ 下架展览' : '🚀 一键发布'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
