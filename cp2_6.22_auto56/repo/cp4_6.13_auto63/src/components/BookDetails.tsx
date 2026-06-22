import React, { useEffect, useState } from 'react';
import { Book, BookStatus } from './BookCard';

export interface DriftLog {
  id: string;
  borrowDate: string;
  borrower: string;
  rating?: number;
  status: 'borrowing' | 'returned' | 'drifting';
  comment?: string;
}

export interface BookDetailsProps {
  book: Book;
  onClose: () => void;
  onBorrow: (book: Book) => void;
  driftLogs?: DriftLog[];
}

const PLACEHOLDER_COVER_LARGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjRDdDM0I3Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyMCIgZmlsbD0iIzY2NSIgc2hhZG93LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPueZu+WcqOWcsOW3peWbvuWxgjwvdGV4dD48L3N2Zz4=';

const logStatusConfig: Record<DriftLog['status'], { label: string; color: string }> = {
  borrowing: { label: '借阅中', color: '#F97316' },
  returned: { label: '已归还', color: '#22C55E' },
  drifting: { label: '漂流中', color: '#3B82F6' },
};

const BookDetails: React.FC<BookDetailsProps> = ({ book, onClose, onBorrow, driftLogs = [] }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const maskStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 1000,
    opacity: visible ? 1 : 0,
    transition: 'opacity 0.3s ease',
  };

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    right: 0,
    top: 0,
    height: '100vh',
    width: 450,
    backgroundColor: '#FFFBF5',
    zIndex: 1001,
    transform: visible ? 'translateX(0)' : 'translateX(100%)',
    transition: 'transform 0.3s ease',
    boxShadow: '-8px 0 24px rgba(0, 0, 0, 0.15)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  const closeBtnStyle: React.CSSProperties = {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: '50%',
    border: 'none',
    backgroundColor: 'rgba(93, 64, 55, 0.1)',
    color: '#5D4037',
    fontSize: 20,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  };

  const coverContainerStyle: React.CSSProperties = {
    width: '100%',
    padding: '40px 24px 20px',
    backgroundColor: '#F5E6D3',
    display: 'flex',
    justifyContent: 'center',
  };

  const largeCoverStyle: React.CSSProperties = {
    width: 240,
    height: 180,
    objectFit: 'cover',
    borderRadius: 12,
    boxShadow: '0 8px 20px rgba(93, 64, 55, 0.25)',
  };

  const infoSectionStyle: React.CSSProperties = {
    padding: '16px 24px',
    borderBottom: '1px solid #E8D5C4',
  };

  const titleLargeStyle: React.CSSProperties = {
    fontSize: 22,
    fontWeight: 700,
    color: '#3E2723',
    margin: 0,
    marginBottom: 6,
  };

  const authorLargeStyle: React.CSSProperties = {
    fontSize: 15,
    color: '#6D4C41',
    margin: 0,
    marginBottom: 12,
  };

  const metaRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: 16,
    fontSize: 13,
    color: '#5D4037',
  };

  const metaItemStyle: React.CSSProperties = {
    backgroundColor: '#F5E6D3',
    padding: '4px 12px',
    borderRadius: 12,
  };

  const logsSectionStyle: React.CSSProperties = {
    flex: 1,
    padding: '16px 24px',
    overflowY: 'auto',
  };

  const logsTitleStyle: React.CSSProperties = {
    fontSize: 16,
    fontWeight: 600,
    color: '#3E2723',
    margin: 0,
    marginBottom: 14,
  };

  const logItemStyle: React.CSSProperties = {
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#FFF8E1',
    marginBottom: 10,
    border: '1px solid #F0E0C8',
  };

  const logHeaderStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  };

  const logBorrowerStyle: React.CSSProperties = {
    fontWeight: 600,
    fontSize: 14,
    color: '#3E2723',
  };

  const logDateStyle: React.CSSProperties = {
    fontSize: 12,
    color: '#8D6E63',
  };

  const logStatusTag: React.CSSProperties = {
    fontSize: 11,
    padding: '2px 8px',
    borderRadius: 8,
    color: '#FFFFFF',
    display: 'inline-block',
    marginTop: 4,
  };

  const logCommentStyle: React.CSSProperties = {
    fontSize: 13,
    color: '#5D4037',
    marginTop: 6,
    fontStyle: 'italic',
  };

  const footerStyle: React.CSSProperties = {
    padding: '16px 24px 24px',
    borderTop: '1px solid #E8D5C4',
    backgroundColor: '#FFFBF5',
  };

  const borrowBtnStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 0',
    borderRadius: 10,
    border: 'none',
    backgroundColor: '#8D6E63',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  };

  const borrowBtnDisabledStyle: React.CSSProperties = {
    ...borrowBtnStyle,
    backgroundColor: '#C4B7AE',
    cursor: 'not-allowed',
  };

  const emptyLogsStyle: React.CSSProperties = {
    textAlign: 'center',
    color: '#A1887F',
    fontSize: 14,
    padding: 30,
  };

  return (
    <>
      <div style={maskStyle} onClick={handleClose} />
      <aside style={panelStyle}>
        <button style={closeBtnStyle} onClick={handleClose} aria-label="关闭">
          ×
        </button>

        <div style={coverContainerStyle}>
          <img
            src={book.cover || PLACEHOLDER_COVER_LARGE}
            alt={book.title}
            style={largeCoverStyle}
          />
        </div>

        <div style={infoSectionStyle}>
          <h2 style={titleLargeStyle}>{book.title}</h2>
          <p style={authorLargeStyle}>作者：{book.author}</p>
          <div style={metaRowStyle}>
            <span style={metaItemStyle}>漂流 {book.driftCount ?? 0} 次</span>
            <span style={metaItemStyle}>评分 {(book.averageRating ?? 0).toFixed(1)} ★</span>
          </div>
        </div>

        <div style={logsSectionStyle}>
          <h3 style={logsTitleStyle}>漂流日志</h3>
          {driftLogs.length === 0 ? (
            <div style={emptyLogsStyle}>暂无漂流记录</div>
          ) : (
            driftLogs.map((log) => {
              const cfg = logStatusConfig[log.status];
              return (
                <div key={log.id} style={logItemStyle}>
                  <div style={logHeaderStyle}>
                    <span style={logBorrowerStyle}>{log.borrower}</span>
                    <span style={logDateStyle}>{log.borrowDate}</span>
                  </div>
                  <div>
                    <span style={{ ...logStatusTag, backgroundColor: cfg.color }}>
                      {cfg.label}
                    </span>
                    {typeof log.rating === 'number' && (
                      <span style={{ marginLeft: 8, fontSize: 13, color: '#FFA000' }}>
                        {'★'.repeat(log.rating)}
                        <span style={{ color: '#D7CCC8' }}>{'★'.repeat(5 - log.rating)}</span>
                      </span>
                    )}
                  </div>
                  {log.comment && <div style={logCommentStyle}>"{log.comment}"</div>}
                </div>
              );
            })
          )}
        </div>

        <div style={footerStyle}>
          <button
            style={book.status === 'available' ? borrowBtnStyle : borrowBtnDisabledStyle}
            disabled={book.status !== 'available'}
            onClick={() => book.status === 'available' && onBorrow(book)}
          >
            {book.status === 'available' ? '申请借阅' : book.status === 'borrowed' ? '已被借出' : '漂流中不可借阅'}
          </button>
        </div>
      </aside>
    </>
  );
};

export default BookDetails;
