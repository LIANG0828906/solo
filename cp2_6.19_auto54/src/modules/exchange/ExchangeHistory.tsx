import { useMemo } from 'react';
import { RecordItem } from './RecordItem';
import { useExchangeStore } from './ExchangeEngine';
import { useAuthStore } from '../user/UserManager';
import { Navigate } from 'react-router-dom';

export function ExchangeHistory() {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn());
  const isAdmin = useAuthStore((state) => state.isAdmin());
  const currentUser = useAuthStore((state) => state.currentUser);
  const records = useExchangeStore((state) => state.records);

  const displayedRecords = useMemo(() => {
    if (!currentUser) return [];
    if (isAdmin) return records;
    return records.filter(
      (r) => r.requesterId === currentUser.id || r.acceptorId === currentUser.id
    );
  }, [records, currentUser, isAdmin]);

  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="page-container">
      <h1 className="page-title">
        {isAdmin ? '全部交换与借阅记录' : '我的交换与借阅记录'}
      </h1>

      {displayedRecords.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <p>暂无记录</p>
        </div>
      ) : (
        <div className="history-list">
          {displayedRecords.map((record) => (
            <RecordItem
              key={record.id}
              record={record}
              showActions={isAdmin}
              showCountdown={isAdmin}
            />
          ))}
        </div>
      )}
    </div>
  );
}
