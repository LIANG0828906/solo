import { useRiskStore } from '@/store/useRiskStore';
import type { Risk } from '@/types';
import { RISK_LEVEL_COLORS, STATUS_LABELS, LEVEL_LABELS } from '@/types';
import { formatDate } from '@/utils/date';
import styles from './RiskDetailPanel.module.css';

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
        className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ''}`}
        onClick={handleOverlayClick}
      />
      <div
        className={`${styles.panel} ${isOpen ? styles.panelOpen : ''}`}
        role="dialog"
        aria-modal="true"
      >
        <div className={styles.panelHeader} style={{ borderLeft: `4px solid ${levelColor}` }}>
          <div className={styles.panelHeaderContent}>
          <span
            className={styles.levelBadge}
            style={{ backgroundColor: levelColor + '20', color: levelColor }}
          >
            {LEVEL_LABELS[risk.level]}
          </span>
          <h2 className={styles.panelTitle}>{risk.title}</h2>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="关闭"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={styles.panelBody}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>基本信息</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>状态</span>
                <span className={`${styles.statusBadge} ${styles[`status-${risk.status}`]}`}>
                  {STATUS_LABELS[risk.status]}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>负责人</span>
                <span className={styles.infoValue}>{risk.owner}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>创建日期</span>
                <span className={styles.infoValue}>{formatDate(risk.createdAt)}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>预计解决</span>
                <span className={styles.infoValue}>{formatDate(risk.expectedCloseDate)}</span>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>状态更新</h3>
            <div className={styles.statusButtons}>
              {(Object.keys(STATUS_LABELS) as Risk['status'][]).map((status) => (
                <button
                  key={status}
                  type="button"
                  className={`${styles.statusButton} ${risk.status === status ? styles.statusButtonActive : ''}`}
                  onClick={() => handleStatusChange(status)}
                >
                  {STATUS_LABELS[status]}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>影响范围</h3>
            <p className={styles.impactText}>{risk.impact}</p>
          </div>
        </div>

        <div className={styles.panelFooter}>
          <button
            type="button"
            className={styles.deleteButton}
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
