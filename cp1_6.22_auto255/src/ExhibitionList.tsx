import { useState, useEffect, useCallback } from 'react';
import { ExhibitionSummary, ExhibitionStatus, ExhibitionStatusLabels } from './types';
import CreateExhibitionModal from './CreateExhibitionModal';

interface ExhibitionListProps {
  onExhibitionClick: (id: string) => void;
  onExhibitionCreated: (exhibition: ExhibitionSummary) => void;
}

function ExhibitionList({ onExhibitionClick, onExhibitionCreated }: ExhibitionListProps) {
  const [exhibitions, setExhibitions] = useState<ExhibitionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchExhibitions = useCallback(async () => {
    try {
      const response = await fetch('/api/exhibitions');
      const data = await response.json();
      setExhibitions(data);
    } catch (error) {
      console.error('获取展览列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExhibitions();
  }, [fetchExhibitions]);

  const handleCreateSuccess = useCallback(() => {
    setShowCreateModal(false);
    fetchExhibitions();
  }, [fetchExhibitions]);

  const getStatusColor = (status: ExhibitionStatus): string => {
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

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="exhibition-list-page">
      <div className="page-header">
        <div>
          <h1>展览管理</h1>
          <p className="page-subtitle">管理所有展览项目，策划临时展览</p>
        </div>
        <button className="btn-primary create-btn" onClick={() => setShowCreateModal(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          创建展览
        </button>
      </div>

      {loading ? (
        <div className="loading-state">加载中...</div>
      ) : (
        <div className="exhibition-grid">
          {exhibitions.map((exhibition) => (
            <div
              key={exhibition.id}
              className="exhibition-card"
              onClick={() => onExhibitionClick(exhibition.id)}
            >
              <div
                className="card-status-bar"
                style={{ backgroundColor: getStatusColor(exhibition.status) }}
              />
              <div className="card-content">
                <div className="card-status-tag" style={{ color: getStatusColor(exhibition.status) }}>
                  <span className="status-dot-small" style={{ backgroundColor: getStatusColor(exhibition.status) }} />
                  {ExhibitionStatusLabels[exhibition.status]}
                </div>
                <h3 className="card-title">{exhibition.name}</h3>
                <p className="card-description">{exhibition.description}</p>
                <div className="card-meta">
                  <div className="meta-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <path d="M16 2v4M8 2v4M3 10h18" />
                    </svg>
                    <span>{formatDate(exhibition.startDate)} - {formatDate(exhibition.endDate)}</span>
                  </div>
                  <div className="meta-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                      <rect x="3" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" />
                      <rect x="14" y="14" width="7" height="7" rx="1" />
                    </svg>
                    <span>{exhibition.artworkCount} 件展品</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateExhibitionModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
}

export default ExhibitionList;
