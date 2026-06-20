import { useState } from 'react';
import { useAttendanceStore } from '../store/attendanceStore';
import type { EmployeeBalance } from '../types';

interface LeaveBalancePanelProps {
  balance: EmployeeBalance;
}

const LeaveBalanceCard = ({ balance }: LeaveBalancePanelProps) => {
  const [showModal, setShowModal] = useState(false);
  const [leaveHours, setLeaveHours] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const { actions } = useAttendanceStore();

  const usedRatio = balance.totalOvertime > 0 ? balance.usedLeave / balance.totalOvertime : 0;
  const remainingRatio = balance.totalOvertime > 0 ? balance.remaining / balance.totalOvertime : 0;

  const getProgressColor = () => {
    if (remainingRatio > 0.5) return '#4CAF50';
    if (remainingRatio > 0.2) return '#FFC107';
    return '#F44336';
  };

  const handleApplyLeave = () => {
    if (leaveHours <= 0 || leaveHours > balance.remaining) return;
    
    actions.applyLeave(balance.employeeId, leaveHours);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
    setShowModal(false);
    setLeaveHours(1);
  };

  return (
    <>
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={styles.avatar}>{balance.employeeName.charAt(0)}</div>
          <div>
            <h4 style={styles.employeeName}>{balance.employeeName}</h4>
            <span style={styles.employeeId}>工号: {balance.employeeId}</span>
          </div>
        </div>

        <div style={styles.balanceInfo}>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>累计加班</span>
            <span
              className={isAnimating ? 'number-jump' : ''}
              style={{ ...styles.infoValue, color: '#333' }}
            >
              {balance.totalOvertime}h
            </span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>已调休</span>
            <span
              className={isAnimating ? 'number-jump' : ''}
              style={{ ...styles.infoValue, color: '#FF9800' }}
            >
              {balance.usedLeave}h
            </span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>剩余余额</span>
            <span
              className={isAnimating ? 'number-jump' : ''}
              style={{ ...styles.infoValue, color: getProgressColor(), fontWeight: 600 }}
            >
              {balance.remaining}h
            </span>
          </div>
        </div>

        <div style={styles.progressContainer}>
          <div style={styles.progressBar}>
            <div
              style={{
                ...styles.progressFill,
                width: `${usedRatio * 100}%`,
                backgroundColor: getProgressColor(),
              }}
            />
          </div>
          <span style={styles.progressText}>
            已使用 {Math.round(usedRatio * 100)}%
          </span>
        </div>

        <button
          onClick={() => setShowModal(true)}
          style={styles.applyButton}
          disabled={balance.remaining <= 0}
        >
          申请调休
        </button>
      </div>

      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>申请调休</h3>
            <p style={styles.modalSubtitle}>
              {balance.employeeName} 当前剩余调休: {balance.remaining}小时
            </p>
            
            <div style={styles.inputGroup}>
              <label style={styles.inputLabel}>调休时长 (小时)</label>
              <input
                type="number"
                min="0.5"
                max={balance.remaining}
                step="0.5"
                value={leaveHours}
                onChange={(e) => setLeaveHours(parseFloat(e.target.value) || 0)}
                style={styles.input}
              />
            </div>

            <div style={styles.modalActions}>
              <button
                onClick={() => setShowModal(false)}
                style={{ ...styles.modalButton, ...styles.cancelButton }}
              >
                取消
              </button>
              <button
                onClick={handleApplyLeave}
                style={{ ...styles.modalButton, ...styles.confirmButton }}
                disabled={leaveHours <= 0 || leaveHours > balance.remaining}
              >
                确认申请
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const LeaveBalancePanel = () => {
  const { balances } = useAttendanceStore();

  return (
    <div style={styles.panelContainer}>
      <h3 style={styles.panelTitle}>调休余额</h3>
      <div style={styles.cardsContainer}>
        {balances.map((balance) => (
          <LeaveBalanceCard key={balance.employeeId} balance={balance} />
        ))}
      </div>
    </div>
  );
};

const styles = {
  panelContainer: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    marginTop: '20px',
  },
  panelTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#333',
    marginBottom: '20px',
  },
  cardsContainer: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap' as const,
  },
  card: {
    width: '250px',
    borderRadius: '8px',
    backgroundColor: '#fff',
    border: '1px solid #E0E0E0',
    padding: '20px',
    transition: 'all 0.2s ease-in-out',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#2196F3',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    fontSize: '16px',
  },
  employeeName: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#333',
    marginBottom: '2px',
  },
  employeeId: {
    fontSize: '12px',
    color: '#999',
  },
  balanceInfo: {
    marginBottom: '16px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 0',
  },
  infoLabel: {
    fontSize: '14px',
    color: '#666',
  },
  infoValue: {
    fontSize: '16px',
    fontWeight: 500,
  },
  progressContainer: {
    marginBottom: '16px',
  },
  progressBar: {
    height: '6px',
    backgroundColor: '#F0F0F0',
    borderRadius: '3px',
    overflow: 'hidden',
    marginBottom: '6px',
  },
  progressFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.3s ease-in-out, background-color 0.3s ease-in-out',
  },
  progressText: {
    fontSize: '12px',
    color: '#999',
  },
  applyButton: {
    width: '100%',
    padding: '10px 16px',
    backgroundColor: '#2196F3',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
  },
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    width: '360px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#333',
    marginBottom: '8px',
  },
  modalSubtitle: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '20px',
  },
  inputGroup: {
    marginBottom: '20px',
  },
  inputLabel: {
    display: 'block',
    fontSize: '14px',
    color: '#666',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #E0E0E0',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
  },
  modalButton: {
    flex: 1,
    padding: '10px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.2s ease-in-out',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    color: '#666',
  },
  confirmButton: {
    backgroundColor: '#2196F3',
    color: '#fff',
  },
};

export default LeaveBalancePanel;
