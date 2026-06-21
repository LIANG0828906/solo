import React, { useState, useRef, useCallback } from 'react';
import type { Lens, LensStatus, LensType, FilterOptions } from '../types';

interface LensPanelProps {
  lenses: Lens[];
  filters: FilterOptions;
  onRemove: (id: string) => void;
  onUpdateStatus: (id: string, status: LensStatus) => void;
  onOpenDetail: (lens: Lens) => void;
  onUpload: (file: File) => void;
  removedCount: number;
}

const STATUS_MAP: Record<LensStatus, { label: string; color: string }> = {
  pending: { label: '待审核', color: '#F59E0B' },
  approved: { label: '已通过', color: '#22C55E' },
  reshoot: { label: '需补拍', color: '#EF4444' },
};

const TYPE_LABEL: Record<LensType, string> = {
  video: '视频',
  image: '图片',
};

const LensPanel: React.FC<LensPanelProps> = ({
  lenses,
  filters,
  onRemove,
  onUpdateStatus,
  onOpenDetail,
  onUpload,
  removedCount,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [statusMenu, setStatusMenu] = useState<string | null>(null);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const dragCounter = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredLenses = lenses.filter((l) => {
    if (filters.status !== 'all' && l.status !== filters.status) return false;
    if (filters.type !== 'all' && l.type !== filters.type) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!l.name.toLowerCase().includes(q) && !l.id.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounter.current = 0;
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        Array.from(files).forEach((file) => {
          if (file.type.startsWith('video/') || file.type.startsWith('image/')) {
            onUpload(file);
          }
        });
      }
    },
    [onUpload]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => onUpload(file));
    }
    e.target.value = '';
  };

  const handleRemove = (id: string) => {
    setRemovingIds((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      onRemove(id);
    }, 300);
  };

  return (
    <div
      style={{
        width: 300,
        minWidth: 300,
        height: '100%',
        background: '#1E293B',
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '16px 16px 8px' }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#F8FAFC',
            marginBottom: 12,
          }}
        >
          镜头素材
        </div>
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          style={{
            background: '#334155',
            border: `2px dashed ${isDragging ? '#3B82F6' : '#475569'}`,
            borderRadius: 8,
            padding: '18px 12px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: isDragging ? '0 8px 24px rgba(59, 130, 246, 0.35)' : 'none',
          }}
        >
          <div style={{ fontSize: 24, marginBottom: 6 }}>📤</div>
          <div style={{ fontSize: 13, color: '#CBD5E1' }}>
            {isDragging ? '释放以上传素材' : '拖拽或点击上传视频/图片'}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
        </div>
      </div>

      <div
        className="custom-scrollbar"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 16px 16px',
        }}
      >
        {filteredLenses.length === 0 ? (
          <div
            style={{
              background: '#475569',
              borderRadius: 16,
              padding: '40px 16px',
              textAlign: 'center',
              marginTop: 8,
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 10 }}>🎬</div>
            <div style={{ fontSize: 14, color: '#F8FAFC' }}>暂无匹配的镜头</div>
          </div>
        ) : (
          filteredLenses.map((lens) => {
            const isRemoving = removingIds.has(lens.id);
            const statusInfo = STATUS_MAP[lens.status];
            return (
              <div
                key={lens.id}
                className={isRemoving ? 'scale-out' : 'fade-in'}
                style={{
                  background: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: 8,
                  padding: 10,
                  marginBottom: 8,
                  position: 'relative',
                  transition: 'all 0.3s ease',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: 112,
                    borderRadius: 4,
                    background: '#334155',
                    marginBottom: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 36,
                    overflow: 'hidden',
                  }}
                >
                  {lens.thumbnail ? (
                    <img
                      src={lens.thumbnail}
                      alt={lens.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span>{lens.type === 'video' ? '🎥' : '🖼️'}</span>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <div
                    style={{
                      fontSize: 16,
                      color: '#F8FAFC',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      paddingRight: 68,
                    }}
                    title={lens.name}
                  >
                    {lens.name}
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 10,
                      color: '#fff',
                      background: statusInfo.color,
                      fontWeight: 600,
                    }}
                  >
                    {statusInfo.label}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: '#94A3B8',
                    marginTop: 4,
                  }}
                >
                  {lens.uploadTime} · {TYPE_LABEL[lens.type]}
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 6,
                    marginTop: 8,
                    position: 'relative',
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setStatusMenu(statusMenu === lens.id ? null : lens.id)}
                      style={{
                        width: 32,
                        height: 28,
                        borderRadius: 6,
                        background: '#334155',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        transition: 'all 0.3s ease',
                      }}
                      title="标记状态"
                    >
                      🏷️
                    </button>
                    {statusMenu === lens.id && (
                      <div
                        className="pop-scale"
                        style={{
                          position: 'absolute',
                          bottom: 36,
                          right: 0,
                          background: '#0F172A',
                          border: '1px solid #334155',
                          borderRadius: 12,
                          padding: 6,
                          zIndex: 50,
                          minWidth: 110,
                          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {(Object.keys(STATUS_MAP) as LensStatus[]).map((st) => (
                          <button
                            key={st}
                            onClick={() => {
                              onUpdateStatus(lens.id, st);
                              setStatusMenu(null);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              width: '100%',
                              padding: '8px 10px',
                              borderRadius: 8,
                              fontSize: 13,
                              color: '#F8FAFC',
                              textAlign: 'left',
                              transition: 'transform 0.2s ease, background 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.background = '#1E293B';
                              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.02)';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                            }}
                          >
                            <span
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: STATUS_MAP[st].color,
                              }}
                            />
                            {STATUS_MAP[st].label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => onOpenDetail(lens)}
                    style={{
                      width: 32,
                      height: 28,
                      borderRadius: 6,
                      background: '#334155',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      transition: 'all 0.3s ease',
                    }}
                    title="查看详情"
                  >
                    👁️
                  </button>
                  <button
                    onClick={() => handleRemove(lens.id)}
                    style={{
                      width: 32,
                      height: 28,
                      borderRadius: 6,
                      background: '#334155',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      transition: 'all 0.3s ease',
                    }}
                    title="从看板移除"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {removedCount > 0 && (
        <div
          className="fade-in"
          style={{
            padding: '10px 16px',
            fontSize: 12,
            color: '#94A3B8',
            textAlign: 'center',
            borderTop: '1px solid #334155',
            background: '#1E293B',
          }}
        >
          已移除 {removedCount} 个镜头
        </div>
      )}
    </div>
  );
};

export default LensPanel;
