import React, { useEffect, useState, useRef, useCallback } from 'react';
import LensPanel from './components/LensPanel';
import DetailPanel from './components/DetailPanel';
import StatsBall from './components/StatsBall';
import { useLensData } from './hooks/useLensData';
import type { Lens, LensStatus, FilterOptions, LensType } from './types';

const App: React.FC = () => {
  const { lenses, loading, error, fetchLenses, createLens, updateLensStatus, deleteLens } =
    useLensData();

  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    type: 'all',
    search: '',
  });
  const [selectedLens, setSelectedLens] = useState<Lens | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [removedCount, setRemovedCount] = useState(0);
  const [isNarrow, setIsNarrow] = useState(false);
  const searchTimer = useRef<number | null>(null);

  useEffect(() => {
    fetchLenses();
  }, [fetchLenses]);

  useEffect(() => {
    const check = () => {
      setIsNarrow(window.innerWidth < 900);
      const styleEl = document.getElementById('lensboard-responsive');
      if (window.innerWidth < 540) {
        if (!styleEl) {
          const s = document.createElement('style');
          s.id = 'lensboard-responsive';
          s.textContent =
            '.lens-card-thumb { height: 100px !important; }';
          document.head.appendChild(s);
        }
      } else if (styleEl) {
        styleEl.remove();
      }
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleSearch = useCallback((v: string) => {
    if (searchTimer.current) window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: v }));
    }, 500);
  }, []);

  const handleUpload = useCallback(
    async (file: File) => {
      const isVideo = file.type.startsWith('video/');
      let thumbnail = '';
      if (file.type.startsWith('image/')) {
        try {
          thumbnail = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
        } catch {
          thumbnail = '';
        }
      }
      const nameParts = file.name.split('.');
      const ext = nameParts.length > 1 ? nameParts.pop()!.toUpperCase() : '';
      await createLens({
        name: file.name,
        type: isVideo ? 'video' : 'image',
        format: ext || (isVideo ? 'MP4' : 'JPG'),
        dimensions: isVideo ? '1920x1080' : undefined,
        duration: isVideo ? '00:00:10' : '—',
        thumbnail,
      });
    },
    [createLens]
  );

  const handleRemove = useCallback(
    async (id: string) => {
      const ok = await deleteLens(id);
      if (ok) {
        setRemovedCount((prev) => prev + 1);
        if (selectedLens?.id === id) {
          setDetailOpen(false);
          setSelectedLens(null);
        }
      }
    },
    [deleteLens, selectedLens]
  );

  const handleUpdateStatus = useCallback(
    async (id: string, status: LensStatus) => {
      const updated = await updateLensStatus(id, status);
      if (updated && selectedLens?.id === id) {
        setSelectedLens(updated);
      }
    },
    [updateLensStatus, selectedLens]
  );

  const handleUpdateNotes = useCallback(
    async (id: string, status: LensStatus, notes: string) => {
      const updated = await updateLensStatus(id, status, notes);
      if (updated) {
        setSelectedLens(updated);
      }
    },
    [updateLensStatus]
  );

  const handleOpenDetail = useCallback((lens: Lens) => {
    setSelectedLens(lens);
    setDetailOpen(true);
  }, []);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#0F172A',
        display: 'flex',
        padding: 16,
        gap: 16,
        overflow: 'hidden',
      }}
    >
      <LensPanel
        lenses={lenses}
        filters={filters}
        onRemove={handleRemove}
        onUpdateStatus={handleUpdateStatus}
        onOpenDetail={handleOpenDetail}
        onUpload={handleUpload}
        removedCount={removedCount}
      />

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          height: '100%',
          gap: 16,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            background: '#1E293B',
            borderRadius: 12,
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 22 }}>🎬</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#F8FAFC' }}>
                LensBoard 剪辑进度看板
              </div>
              <div style={{ fontSize: 12, color: '#94A3B8' }}>
                共 {lenses.length} 个镜头素材
                {loading && ' · 加载中...'}
                {error && ` · 错误: ${error}`}
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, status: e.target.value as FilterOptions['status'] }))
              }
              style={{
                background: '#0F172A',
                border: '1px solid #334155',
                color: '#F8FAFC',
                padding: '8px 12px',
                borderRadius: 8,
                fontSize: 13,
                transition: 'border 0.3s ease',
                cursor: 'pointer',
              }}
            >
              <option value="all">全部状态</option>
              <option value="pending">待审核</option>
              <option value="approved">已通过</option>
              <option value="reshoot">需补拍</option>
            </select>
            <select
              value={filters.type}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, type: e.target.value as LensType | 'all' }))
              }
              style={{
                background: '#0F172A',
                border: '1px solid #334155',
                color: '#F8FAFC',
                padding: '8px 12px',
                borderRadius: 8,
                fontSize: 13,
                transition: 'border 0.3s ease',
                cursor: 'pointer',
              }}
            >
              <option value="all">全部类型</option>
              <option value="video">视频</option>
              <option value="image">图片</option>
            </select>
            <input
              type="text"
              placeholder="搜索镜头名称或编号"
              onChange={(e) => handleSearch(e.target.value)}
              style={{
                background: '#0F172A',
                border: '1px solid #334155',
                color: '#F8FAFC',
                padding: '8px 12px',
                borderRadius: 8,
                fontSize: 13,
                minWidth: 200,
                transition: 'border 0.3s ease',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#334155')}
            />
          </div>
        </div>

        <div
          className="custom-scrollbar"
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            gap: 16,
            position: 'relative',
          }}
        >
          <div
            style={{
              flex: 1,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              alignContent: 'start',
              gap: 12,
              paddingRight: !isNarrow && detailOpen ? 0 : 0,
            }}
          >
            {lenses
              .filter((l) => {
                if (filters.status !== 'all' && l.status !== filters.status) return false;
                if (filters.type !== 'all' && l.type !== filters.type) return false;
                if (filters.search) {
                  const q = filters.search.toLowerCase();
                  if (!l.name.toLowerCase().includes(q) && !l.id.toLowerCase().includes(q))
                    return false;
                }
                return true;
              })
              .map((lens) => {
                const colorMap: Record<LensStatus, string> = {
                  pending: '#F59E0B',
                  approved: '#22C55E',
                  reshoot: '#EF4444',
                };
                const labelMap: Record<LensStatus, string> = {
                  pending: '待审核',
                  approved: '已通过',
                  reshoot: '需补拍',
                };
                return (
                  <div
                    key={lens.id}
                    onClick={() => handleOpenDetail(lens)}
                    className="fade-in"
                    style={{
                      background: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: 10,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'transform 0.3s ease, border 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                      (e.currentTarget as HTMLDivElement).style.borderColor = '#3B82F6';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                      (e.currentTarget as HTMLDivElement).style.borderColor = '#334155';
                    }}
                  >
                    <div
                      className="lens-card-thumb"
                      style={{
                        width: '100%',
                        height: 112,
                        background: '#334155',
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
                    <div style={{ padding: 10 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: '#F8FAFC',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        title={lens.name}
                      >
                        {lens.name}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginTop: 6,
                        }}
                      >
                        <span style={{ fontSize: 11, color: '#94A3B8' }}>{lens.uploadTime}</span>
                        <span
                          style={{
                            fontSize: 10,
                            padding: '2px 8px',
                            borderRadius: 10,
                            color: '#fff',
                            background: colorMap[lens.status],
                            fontWeight: 600,
                          }}
                        >
                          {labelMap[lens.status]}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {!isNarrow && (
            <DetailPanel
              lens={selectedLens}
              isOpen={detailOpen}
              onClose={() => setDetailOpen(false)}
              onUpdateNotes={handleUpdateNotes}
            />
          )}
        </div>
      </div>

      {isNarrow && (
        <DetailPanel
          lens={selectedLens}
          isOpen={detailOpen}
          onClose={() => setDetailOpen(false)}
          onUpdateNotes={handleUpdateNotes}
        />
      )}

      <StatsBall lenses={lenses} />
    </div>
  );
};

export default App;
