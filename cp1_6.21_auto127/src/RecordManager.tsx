import { useState } from 'react';
import { useAppContext } from './App';

const cssStyles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slideUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
  .modal-overlay {
    animation: fadeIn 0.2s ease-out;
  }
  .modal-content {
    animation: slideUp 0.3s ease-out;
  }
  .primary-btn {
    background-color: #6366F1;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;
  }
  .primary-btn:hover {
    background-color: #818CF8;
  }
  .primary-btn:active {
    transform: scale(0.95);
  }
  .primary-btn:disabled {
    background-color: #CBD5E1;
    cursor: not-allowed;
    transform: none;
  }
  .form-input, .form-select {
    width: 100%;
    height: 40px;
    border: 1px solid #CBD5E1;
    border-radius: 8px;
    padding: 0 12px;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s;
    box-sizing: border-box;
    background-color: white;
  }
  .form-input:focus, .form-select:focus {
    border-color: #6366F1;
  }
  .status-badge {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
  }
  .status-borrowed {
    background-color: rgba(239, 68, 68, 0.1);
    color: #DC2626;
  }
  .status-returned {
    background-color: rgba(16, 185, 129, 0.1);
    color: #059669;
  }
`;

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export default function RecordManager() {
  const { books, records, borrowBook, returnBook } = useAppContext();
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [borrowForm, setBorrowForm] = useState({
    bookId: '',
    borrower: '',
    borrowDate: getTodayDate(),
  });
  const [returnDate, setReturnDate] = useState(getTodayDate());

  const availableBooks = books.filter((b) => !b.isBorrowed);

  const handleBorrow = async () => {
    if (!borrowForm.bookId || !borrowForm.borrower || !borrowForm.borrowDate) {
      alert('请填写所有字段');
      return;
    }
    try {
      await borrowBook(borrowForm.bookId, borrowForm.borrower, borrowForm.borrowDate);
      setBorrowForm({ bookId: '', borrower: '', borrowDate: getTodayDate() });
      setShowBorrowModal(false);
    } catch (error) {
      alert('借书操作失败');
    }
  };

  const handleReturnClick = (recordId: string) => {
    setSelectedRecordId(recordId);
    setReturnDate(getTodayDate());
    setShowReturnModal(true);
  };

  const handleReturn = async () => {
    if (!selectedRecordId || !returnDate) {
      alert('请选择归还日期');
      return;
    }
    try {
      await returnBook(selectedRecordId, returnDate);
      setShowReturnModal(false);
      setSelectedRecordId(null);
    } catch (error) {
      alert('还书操作失败');
    }
  };

  return (
    <>
      <style>{cssStyles}</style>
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>借阅记录</h2>
          <button
            className="primary-btn"
            style={styles.addButton}
            onClick={() => setShowBorrowModal(true)}
            disabled={availableBooks.length === 0}
          >
            + 借书登记
          </button>
        </div>

        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={styles.th}>书名</th>
                <th style={styles.th}>借阅人</th>
                <th style={styles.th}>借书日期</th>
                <th style={styles.th}>归还日期</th>
                <th style={styles.th}>状态</th>
                <th style={styles.th}>操作</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record, index) => (
                <tr
                  key={record.id}
                  style={{
                    ...styles.tableRow,
                    ...(index % 2 === 1 ? styles.tableRowAlt : {}),
                  }}
                >
                  <td style={styles.td}>{record.bookTitle}</td>
                  <td style={styles.td}>{record.borrower}</td>
                  <td style={styles.td}>{formatDate(record.borrowDate)}</td>
                  <td style={styles.td}>{formatDate(record.returnDate)}</td>
                  <td style={styles.td}>
                    <span
                      className={`status-badge ${record.isReturned ? 'status-returned' : 'status-borrowed'}`}
                    >
                      {record.isReturned ? '已归还' : '借阅中'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {!record.isReturned ? (
                      <button
                        className="primary-btn"
                        style={styles.actionButton}
                        onClick={() => handleReturnClick(record.id)}
                      >
                        归还
                      </button>
                    ) : (
                      <span style={styles.noAction}>-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {records.length === 0 && (
            <div style={styles.emptyState}>
              <p style={styles.emptyText}>暂无借阅记录</p>
            </div>
          )}
        </div>
      </div>

      {showBorrowModal && (
        <div
          className="modal-overlay"
          style={styles.modalOverlay}
          onClick={() => setShowBorrowModal(false)}
        >
          <div
            className="modal-content"
            style={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={styles.modalTitle}>借书登记</h3>
            <div style={styles.formGroup}>
              <label style={styles.label}>选择图书</label>
              <select
                className="form-select"
                value={borrowForm.bookId}
                onChange={(e) => setBorrowForm({ ...borrowForm, bookId: e.target.value })}
              >
                <option value="">请选择图书</option>
                {availableBooks.map((book) => (
                  <option key={book.id} value={book.id}>
                    {book.title} - {book.author}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>借阅人姓名</label>
              <input
                className="form-input"
                type="text"
                placeholder="请输入借阅人姓名"
                value={borrowForm.borrower}
                onChange={(e) => setBorrowForm({ ...borrowForm, borrower: e.target.value })}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>借书日期</label>
              <input
                className="form-input"
                type="date"
                value={borrowForm.borrowDate}
                onChange={(e) => setBorrowForm({ ...borrowForm, borrowDate: e.target.value })}
              />
            </div>
            <div style={styles.modalButtons}>
              <button
                style={styles.cancelButton}
                onClick={() => setShowBorrowModal(false)}
              >
                取消
              </button>
              <button
                className="primary-btn"
                style={styles.confirmButton}
                onClick={handleBorrow}
              >
                确认借出
              </button>
            </div>
          </div>
        </div>
      )}

      {showReturnModal && (
        <div
          className="modal-overlay"
          style={styles.modalOverlay}
          onClick={() => setShowReturnModal(false)}
        >
          <div
            className="modal-content"
            style={{ ...styles.modalContent, maxWidth: '400px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={styles.modalTitle}>归还图书</h3>
            <div style={styles.formGroup}>
              <label style={styles.label}>归还日期</label>
              <input
                className="form-input"
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
              />
            </div>
            <div style={styles.modalButtons}>
              <button
                style={styles.cancelButton}
                onClick={() => setShowReturnModal(false)}
              >
                取消
              </button>
              <button
                className="primary-btn"
                style={styles.confirmButton}
                onClick={handleReturn}
              >
                确认归还
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    width: '100%',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#1E293B',
  },
  addButton: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 500,
  },
  tableContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    backgroundColor: '#F1F5F9',
  },
  th: {
    padding: '14px 16px',
    textAlign: 'left',
    fontSize: '14px',
    fontWeight: 600,
    color: '#475569',
    borderBottom: '1px solid #E2E8F0',
  },
  tableRow: {
    transition: 'background-color 0.15s',
    backgroundColor: '#FFFFFF',
  },
  tableRowAlt: {
    backgroundColor: '#F8FAFC',
  },
  td: {
    padding: '14px 16px',
    fontSize: '14px',
    color: '#374151',
    borderBottom: '1px solid #F1F5F9',
  },
  actionButton: {
    padding: '6px 16px',
    fontSize: '13px',
  },
  noAction: {
    color: '#94A3B8',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  emptyText: {
    fontSize: '16px',
    color: '#64748B',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px 16px 0 0',
    padding: '32px',
    width: '100%',
    maxWidth: '500px',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#1E293B',
    marginBottom: '24px',
  },
  formGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151',
    marginBottom: '8px',
  },
  modalButtons: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '24px',
  },
  cancelButton: {
    padding: '10px 24px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    backgroundColor: '#FFFFFF',
    color: '#374151',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all 0.2s',
  },
  confirmButton: {
    padding: '10px 24px',
    borderRadius: '8px',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all 0.2s',
  },
};
