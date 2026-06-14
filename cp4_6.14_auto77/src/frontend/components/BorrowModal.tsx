import { useState } from 'react';

interface BorrowModalProps {
  bookId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const BorrowModal = ({ bookId, onClose, onSuccess }: BorrowModalProps) => {
  const [borrowerName, setBorrowerName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validateName = (name: string): boolean => {
    const chineseRegex = /^[\u4e00-\u9fa5]{2,20}$/;
    return chineseRegex.test(name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!borrowerName.trim()) {
      setError('请输入借阅者姓名');
      return;
    }

    if (!validateName(borrowerName.trim())) {
      setError('姓名需为2-20个汉字');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/books/${bookId}/borrow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ borrowerName: borrowerName.trim() }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.error || '借阅登记失败');
      }
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <>
      <div style={styles.overlay} onClick={onClose} />
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>借阅登记</h3>
          <button style={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formRow}>
            <label style={styles.label}>借阅者姓名 *</label>
            <input
              type="text"
              style={styles.input}
              value={borrowerName}
              onChange={(e) => setBorrowerName(e.target.value)}
              placeholder="请输入借阅者姓名（2-20汉字）"
              autoFocus
            />
            {error && <div style={styles.error}>{error}</div>}
          </div>

          <div style={styles.formRow}>
            <label style={styles.label}>借出日期</label>
            <div style={styles.dateDisplay}>{today}</div>
          </div>

          <div style={styles.buttonRow}>
            <button
              type="button"
              style={styles.cancelButton}
              onClick={onClose}
              disabled={submitting}
            >
              取消
            </button>
            <button
              type="submit"
              style={styles.submitButton}
              disabled={submitting}
            >
              {submitting ? '提交中...' : '确认借出'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes slideDownFade {
          from {
            opacity: 0;
            transform: translate(-50%, -60%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
      `}</style>
    </>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 150,
  },
  modal: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 420,
    maxHeight: 500,
    background: '#ffffff',
    borderRadius: 12,
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
    zIndex: 200,
    animation: 'slideDownFade 0.3s ease-out',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #e2e8f0',
  },
  modalTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 600,
    color: '#0f172a',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: 28,
    lineHeight: 1,
    color: '#94a3b8',
    cursor: 'pointer',
    padding: 0,
    transition: 'color 0.2s ease-out',
  },
  form: {
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  formRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: 500,
    color: '#334155',
  },
  input: {
    padding: '10px 12px',
    border: '1px solid #cbd5e1',
    borderRadius: 6,
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s ease-out',
  },
  dateDisplay: {
    padding: '10px 12px',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    fontSize: 14,
    color: '#475569',
  },
  error: {
    fontSize: 13,
    color: '#dc2626',
  },
  buttonRow: {
    display: 'flex',
    gap: 12,
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  cancelButton: {
    padding: '10px 20px',
    background: '#f1f5f9',
    color: '#475569',
    border: 'none',
    borderRadius: 6,
    fontSize: 14,
    cursor: 'pointer',
    transition: 'all 0.2s ease-out',
  },
  submitButton: {
    padding: '10px 20px',
    background: '#3b82f6',
    color: '#ffffff',
    border: 'none',
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease-out',
  },
};

export default BorrowModal;
