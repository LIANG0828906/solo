import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { BorrowRecord } from '../types';
import { apiService } from '../apiService';

interface HistoryModalProps {
  bookId: string;
  onClose: () => void;
  bookTitle?: string;
}

export default function HistoryModal({ bookId, onClose, bookTitle }: HistoryModalProps) {
  const [history, setHistory] = useState<BorrowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async function () {
      try {
        const recs = await apiService.getHistory(bookId);
        if (mounted) {
          setHistory(recs);
          setLoading(false);
        }
      } catch (e) {
        if (mounted) {
          setError(String(e));
          setLoading(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [bookId]);

  const formatTime = (iso?: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{(bookTitle || '图书') + ' · 借阅历史'}</h3>
          <button className="modal-close" onClick={onClose} aria-label="关闭">
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          {loading ? (
            <p className="loading-text">加载中...</p>
          ) : error ? (
            <p className="error-text">{error}</p>
          ) : history.length === 0 ? (
            <p className="empty-history">暂无借阅记录</p>
          ) : (
            history.map((item) => (
              <div className="history-item" key={item.id}>
                <p className="history-borrower">{item.borrower}</p>
                <p className="history-time-row">
                  <span className="history-label">借出时间：</span>
                  <span>{formatTime(item.borrowTime)}</span>
                </p>
                <p className="history-time-row">
                  <span className="history-label">归还时间：</span>
                  <span>{formatTime(item.returnTime)}</span>
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
