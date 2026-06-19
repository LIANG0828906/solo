import { useState, useEffect } from 'react';
import { Check, X, RotateCcw, Clock } from 'lucide-react';
import type { ExchangeRecord } from '../../shared/types';
import { formatDateTime, getStatusLabel } from '../../shared/utils';
import { useExchangeStore } from './ExchangeEngine';
import { useAuthStore } from '../user/UserManager';

interface RecordItemProps {
  record: ExchangeRecord;
  showActions?: boolean;
  showCountdown?: boolean;
}

export function RecordItem({ record, showActions = true, showCountdown = false }: RecordItemProps) {
  const isAdmin = useAuthStore((state) => state.isAdmin());
  const confirmRequest = useExchangeStore((state) => state.confirmRequest);
  const rejectRequest = useExchangeStore((state) => state.rejectRequest);
  const completeRecord = useExchangeStore((state) => state.completeRecord);

  const [animateNumber, setAnimateNumber] = useState(false);
  const prevDaysRef = useState(record.daysRemaining);

  useEffect(() => {
    if (record.daysRemaining !== prevDaysRef[0] && record.daysRemaining !== undefined) {
      setAnimateNumber(true);
      const timer = setTimeout(() => setAnimateNumber(false), 500);
      prevDaysRef[0] = record.daysRemaining;
      return () => clearTimeout(timer);
    }
  }, [record.daysRemaining, prevDaysRef]);

  const getDaysClass = () => {
    if (record.daysRemaining === undefined) return '';
    if (record.daysRemaining < 0) return 'danger';
    if (record.daysRemaining <= 2) return 'warning';
    return 'success';
  };

  const isOverdue = record.status === 'overdue' || (record.daysRemaining !== undefined && record.daysRemaining < 0);

  return (
    <div className={`history-item ${isOverdue ? 'overdue' : ''}`}>
      <div>
        <div className="history-book">{record.bookTitle}</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <span className="history-type">
            {record.type === 'borrow' ? '借阅' : '交换'}
          </span>
        </div>
      </div>

      <div>
        <div className="history-party">发起方</div>
        <div className="font-semibold" style={{ color: 'var(--color-brown-dark)' }}>
          {record.requesterName}
        </div>
      </div>

      <div>
        <div className="history-party">接受方</div>
        <div className="font-semibold" style={{ color: 'var(--color-brown-dark)' }}>
          {record.acceptorName}
        </div>
      </div>

      <div>
        <span className={`status-tag ${record.status}`}>
          {getStatusLabel(record.status)}
        </span>
        {showCountdown && record.daysRemaining !== undefined && record.status !== 'completed' && record.status !== 'rejected' && record.status !== 'lost' && (
          <div style={{ marginTop: 8 }}>
            <span className={`days-remaining ${getDaysClass()} ${animateNumber ? 'animate' : ''}`}>
              <Clock size={14} />
              {record.daysRemaining >= 0
                ? `${record.daysRemaining} 天`
                : `逾期 ${Math.abs(record.daysRemaining)} 天`}
            </span>
          </div>
        )}
      </div>

      <div className="history-date">
        {formatDateTime(record.createdAt)}
      </div>

      {showActions && isAdmin && (
        <div className="history-actions">
          {record.status === 'pending' && (
            <>
              <button
                className="btn btn-success"
                style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                onClick={() => confirmRequest(record.id)}
              >
                <Check size={14} />
                确认
              </button>
              <button
                className="btn btn-danger"
                style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                onClick={() => rejectRequest(record.id)}
              >
                <X size={14} />
                拒绝
              </button>
            </>
          )}
          {(record.status === 'active' || record.status === 'overdue') && (
            <button
              className="btn btn-primary"
              style={{ padding: '6px 12px', fontSize: '0.85rem' }}
              onClick={() => completeRecord(record.id)}
            >
              <RotateCcw size={14} />
              归还
            </button>
          )}
        </div>
      )}
    </div>
  );
}
