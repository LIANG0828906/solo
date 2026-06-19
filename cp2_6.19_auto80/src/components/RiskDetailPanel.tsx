import { useRiskStore } from '@/store/useRiskStore';
import type { Risk } from '@/types';
import { RISK_LEVEL_COLORS, STATUS_LABELS, LEVEL_LABELS } from '@/types';
import { formatDate } from '@/utils/date';

interface RiskDetailPanelProps {
  risk: Risk | null;
  isOpen: boolean;
  onClose: () => void;
}

const RiskDetailPanel = ({ risk, isOpen, onClose }: RiskDetailPanelProps) => {
  const updateRisk = useRiskStore((state) => state.updateRisk);
  const deleteRisk = useRiskStore((state) => state.deleteRisk);

  if (!risk) return null;

  const levelColor = RISK_LEVEL_COLORS[risk.level];

  const handleStatusChange = (newStatus: Risk['status']) => {
    updateRisk(risk.id, { status: newStatus });
  };

  const handleDelete = () => {
    if (window.confirm('确定要删除这条风险吗？')) {
      deleteRisk(risk.id);
      onClose();
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      <div
        className={`detail-overlay ${isOpen ? 'detail-overlay-open' : ''}`}
        onClick={handleOverlayClick}
      />
      <div
        className={`detail-panel ${isOpen ? 'detail-panel-open' : ''}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="detail-panel-header" style={{ borderLeft: `4px solid ${levelColor}` }}>
          <div className="detail-panel-header-content">
            <span
              className="detail-level-badge"
              style={{ backgroundColor: levelColor + '20', color: levelColor }}
            >
              {LEVEL_LABELS[risk.level]}
            </span>
            <h2 className="detail-panel-title">{risk.title}</h2>
          </div>
          <button
            type="button"
            className="detail-close-button"
            onClick={onClose}
            aria-label="关闭"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="detail-panel-body">
          <div className="detail-section">
            <h3 className="detail-section-title">基本信息</h3>
            <div className="detail-info-grid">
              <div className="detail-info-item">
                <span className="detail-info-label">状态</span>
                <span className={`detail-status-badge detail-status-${risk.status}`}>
                  {STATUS_LABELS[risk.status]}
                </span>
              </div>
              <div className="detail-info-item">
                <span className="detail-info-label">负责人</span>
                <span className="detail-info-value">{risk.owner}</span>
              </div>
              <div className="detail-info-item">
                <span className="detail-info-label">创建日期</span>
                <span className="detail-info-value">{formatDate(risk.createdAt)}</span>
              </div>
              <div className="detail-info-item">
                <span className="detail-info-label">预计解决</span>
                <span className="detail-info-value">{formatDate(risk.expectedCloseDate)}</span>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h3 className="detail-section-title">状态更新</h3>
            <div className="detail-status-buttons">
              {(Object.keys(STATUS_LABELS) as Risk['status'][]).map((status) => (
                <button
                  key={status}
                  type="button"
                  className={`detail-status-button ${risk.status === status ? 'detail-status-button-active' : ''}`}
                  onClick={() => handleStatusChange(status)}
                >
                  {STATUS_LABELS[status]}
                </button>
              ))}
            </div>
          </div>

          <div className="detail-section">
            <h3 className="detail-section-title">影响范围</h3>
            <p className="detail-impact-text">{risk.impact}</p>
          </div>
        </div>

        <div className="detail-panel-footer">
          <button
            type="button"
            className="detail-delete-button"
            onClick={handleDelete}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m1 0v14a2 2 0 01-2 2H8a2 2 0 01-2-2V6h10z" />
            </svg>
            删除风险
          </button>
        </div>
      </div>
    </>
  );
};

export default RiskDetailPanel;
