import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Exhibition,
  ExhibitionArtwork,
  Artwork,
  TransportStatus,
  TransportStatusLabels,
  ExhibitionStatusLabels,
  TransportMode,
  TransportModeLabels,
  TransportUpdate,
  ExhibitionStatus
} from './types';
import ArtworkDrawer from './ArtworkDrawer';
import TransportTimelineModal from './TransportTimelineModal';
import StatusSidebar from './StatusSidebar';

interface ExhibitionDetailProps {
  exhibitionId: string;
  onBack: () => void;
  recentUpdates: TransportUpdate[];
}

function ExhibitionDetail({ exhibitionId, onBack, recentUpdates }: ExhibitionDetailProps) {
  const [exhibition, setExhibition] = useState<Exhibition | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDrawer, setShowDrawer] = useState(false);
  const [selectedArtwork, setSelectedArtwork] = useState<ExhibitionArtwork | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const [expandedArtworks, setExpandedArtworks] = useState<Set<string>>(new Set());
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const fetchExhibition = useCallback(async () => {
    try {
      const response = await fetch(`/api/exhibitions/${exhibitionId}`);
      if (response.ok) {
        const data = await response.json();
        setExhibition(data);
      }
    } catch (error) {
      console.error('获取展览详情失败:', error);
    } finally {
      setLoading(false);
    }
  }, [exhibitionId]);

  useEffect(() => {
    fetchExhibition();
  }, [fetchExhibition]);

  useEffect(() => {
    const relevantUpdates = recentUpdates.filter(u => u.exhibitionId === exhibitionId);
    if (relevantUpdates.length === 0) return;

    setExhibition(prev => {
      if (!prev) return prev;

      let hasChanges = false;
      const updatedArtworks = prev.artworks.map(aw => {
        const update = relevantUpdates.find(u => u.artworkId === aw.id);
        if (update && aw.transportStatus !== update.newStatus) {
          hasChanges = true;
          return {
            ...aw,
            transportStatus: update.newStatus,
            transportTimeline: update.timeline
          };
        }
        return aw;
      });

      if (!hasChanges) return prev;
      return { ...prev, artworks: updatedArtworks };
    });
  }, [recentUpdates, exhibitionId]);

  const handleArtworksAdded = useCallback(() => {
    setShowDrawer(false);
    fetchExhibition();
  }, [fetchExhibition]);

  const toggleArtworkExpand = useCallback((artworkId: string) => {
    setExpandedArtworks(prev => {
      const next = new Set(prev);
      if (next.has(artworkId)) {
        next.delete(artworkId);
      } else {
        next.add(artworkId);
      }
      return next;
    });
  }, []);

  const handleStatusClick = useCallback((artwork: ExhibitionArtwork) => {
    setSelectedArtwork(artwork);
    setShowTimeline(true);
  }, []);

  const getStatusColor = (status: TransportStatus): string => {
    switch (status) {
      case TransportStatus.PENDING:
        return '#999999';
      case TransportStatus.OUT_FOR_DELIVERY:
        return '#F0AD4E';
      case TransportStatus.IN_TRANSIT:
        return '#5BC0DE';
      case TransportStatus.ARRIVED:
        return '#5CB85C';
      default:
        return '#999999';
    }
  };

  const getExhibitionStatusColor = (status: ExhibitionStatus): string => {
    switch (status) {
      case ExhibitionStatus.PREPARING:
        return '#4A90D9';
      case ExhibitionStatus.ONGOING:
        return '#5CB85C';
      case ExhibitionStatus.ENDED:
        return '#C0C0C0';
      default:
        return '#C0C0C0';
    }
  };

  const handleBorrowerChange = useCallback(async (artworkId: string, field: string, value: string | number) => {
    if (!exhibition) return;

    try {
      const response = await fetch(`/api/exhibitions/${exhibitionId}/artworks/${artworkId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ [field]: value })
      });

      if (response.ok) {
        const updatedArtwork = await response.json();
        setExhibition(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            artworks: prev.artworks.map(aw => aw.id === artworkId ? updatedArtwork : aw)
          };
        });
      }
    } catch (error) {
      console.error('更新展品信息失败:', error);
    }
  }, [exhibition, exhibitionId]);

  const handleExport = useCallback(async () => {
    if (!exhibition) return;
    setExporting(true);
    setExportUrl(null);

    try {
      const response = await fetch(`/api/exhibitions/${exhibitionId}/export`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        setExportUrl(data.downloadUrl);
      }
    } catch (error) {
      console.error('导出失败:', error);
    } finally {
      setExporting(false);
    }
  }, [exhibition, exhibitionId]);

  const filteredUpdates = useMemo(() => {
    return recentUpdates.filter(u => u.exhibitionId === exhibitionId).slice(0, 5);
  }, [recentUpdates, exhibitionId]);

  if (loading) {
    return <div className="loading-state">加载中...</div>;
  }

  if (!exhibition) {
    return <div className="error-state">展览不存在</div>;
  }

  return (
    <div className="exhibition-detail-page">
      <div className="detail-header">
        <button className="back-btn" onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          返回
        </button>
        <div className="detail-header-content">
          <div className="detail-title-row">
            <h1>{exhibition.name}</h1>
            <span
              className="detail-status-tag"
              style={{
                color: getExhibitionStatusColor(exhibition.status),
                borderColor: getExhibitionStatusColor(exhibition.status)
              }}
            >
              {ExhibitionStatusLabels[exhibition.status]}
            </span>
          </div>
          <p className="detail-description">{exhibition.description}</p>
          <div className="detail-meta">
            <span>📅 {exhibition.startDate} 至 {exhibition.endDate}</span>
            <span>🖼️ 共 {exhibition.artworks.length} 件展品</span>
          </div>
        </div>
        <div className="detail-actions">
          <button className="btn-secondary" onClick={() => setShowDrawer(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <path d="M12 5v14M5 12h14" />
            </svg>
            添加展品
          </button>
          <button
            className="btn-export"
            onClick={handleExport}
            disabled={exporting}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {exporting ? '生成中...' : '生成手册'}
          </button>
          {exportUrl && (
            <a
              href={exportUrl}
              className="btn-download"
              download
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              下载手册
            </a>
          )}
        </div>
      </div>

      <div className="detail-body">
        <div className="artworks-section">
          <h2>展品列表</h2>
          {exhibition.artworks.length === 0 ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 9h6v6H9z" />
              </svg>
              <p>暂无展品，点击上方按钮添加</p>
            </div>
          ) : (
            <div className="artworks-grid">
              {exhibition.artworks.map((artwork) => (
                <div key={artwork.id} className="artwork-card">
                  <div className="artwork-image-placeholder">
                    <img src={artwork.thumbnail} alt={artwork.name} />
                  </div>
                  <div className="artwork-info">
                    <h3 className="artwork-name">{artwork.name}</h3>
                    <p className="artwork-code">{artwork.code}</p>
                    <p className="artwork-borrower">
                      <span className="label">借调来源：</span>
                      <span className="value">{artwork.borrower || '未设置'}</span>
                    </p>
                    <div className="artwork-status-row">
                      <button
                        className="status-tag"
                        style={{
                          backgroundColor: getStatusColor(artwork.transportStatus),
                          color: '#fff'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusClick(artwork);
                        }}
                      >
                        {TransportStatusLabels[artwork.transportStatus]}
                      </button>
                      <button
                        className="expand-btn"
                        onClick={() => toggleArtworkExpand(artwork.id)}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          width="16"
                          height="16"
                          className={expandedArtworks.has(artwork.id) ? 'rotated' : ''}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                        借调信息
                      </button>
                    </div>
                  </div>

                  {expandedArtworks.has(artwork.id) && (
                    <div className="artwork-expand-panel">
                      <div className="form-group">
                        <label>借调方</label>
                        <input
                          type="text"
                          className="form-input"
                          value={artwork.borrower}
                          onChange={(e) => handleBorrowerChange(artwork.id, 'borrower', e.target.value)}
                          placeholder="请输入借调方名称"
                        />
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>运输方式</label>
                          <select
                            className="form-input"
                            value={artwork.transportMode}
                            onChange={(e) => handleBorrowerChange(artwork.id, 'transportMode', e.target.value)}
                          >
                            {Object.values(TransportMode).map(mode => (
                              <option key={mode} value={mode}>{TransportModeLabels[mode]}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label>保险金额 (元)</label>
                          <input
                            type="number"
                            className="form-input"
                            value={artwork.insuranceAmount}
                            onChange={(e) => handleBorrowerChange(artwork.id, 'insuranceAmount', Number(e.target.value))}
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <StatusSidebar updates={filteredUpdates} />
      </div>

      {showDrawer && (
        <ArtworkDrawer
          exhibitionId={exhibitionId}
          existingArtworkIds={exhibition.artworks.map(a => a.id)}
          onClose={() => setShowDrawer(false)}
          onAdded={handleArtworksAdded}
        />
      )}

      {showTimeline && selectedArtwork && (
        <TransportTimelineModal
          artwork={selectedArtwork}
          onClose={() => setShowTimeline(false)}
        />
      )}
    </div>
  );
}

export default ExhibitionDetail;
