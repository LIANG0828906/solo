import { useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { RecordItem } from '../exchange/RecordItem';
import { useExchangeStore } from '../exchange/ExchangeEngine';
import { useAuthStore } from './UserManager';
import type { ExchangeRecord, ExchangeStatus } from '../../shared/types';

const STATUS_GROUPS: Array<{ status: ExchangeStatus[]; title: string }> = [
  { status: ['pending'], title: '待确认' },
  { status: ['active', 'overdue'], title: '进行中' },
  { status: ['completed'], title: '已完成' },
  { status: ['rejected', 'lost'], title: '已结束' },
];

export function UserProfile() {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn());
  const currentUser = useAuthStore((state) => state.currentUser);
  const logout = useAuthStore((state) => state.logout);
  const records = useExchangeStore((state) => state.records);

  const userRecords = useMemo(() => {
    if (!currentUser) return [];
    return records.filter((r) => r.requesterId === currentUser.id);
  }, [records, currentUser]);

  const groupedRecords = useMemo(() => {
    const groups: Record<string, ExchangeRecord[]> = {};
    STATUS_GROUPS.forEach((group) => {
      groups[group.title] = userRecords.filter((r) => group.status.includes(r.status));
    });
    return groups;
  }, [userRecords]);

  if (!isLoggedIn || !currentUser) {
    return <Navigate to="/" replace />;
  }

  const hasRecords = userRecords.length > 0;

  return (
    <div className="page-container">
      <div className="profile-header">
        <div className="profile-avatar">
          {currentUser.name[0].toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div className="profile-name">{currentUser.name}</div>
          <div className="profile-role">
            {currentUser.role === 'admin' ? '管理员' : '读者'}
          </div>
        </div>
        <button className="btn btn-secondary" onClick={logout}>
          退出登录
        </button>
      </div>

      <h1 className="page-title" style={{ fontSize: '1.25rem', marginBottom: 16 }}>
        我的借阅记录
      </h1>

      {!hasRecords ? (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <p>您还没有任何借阅或交换记录</p>
          <p style={{ marginTop: 8, fontSize: '0.9rem', color: '#999' }}>
            去图书浏览页面看看有没有感兴趣的书吧
          </p>
        </div>
      ) : (
        <div>
          {STATUS_GROUPS.map((group) => {
            const groupRecords = groupedRecords[group.title];
            if (groupRecords.length === 0) return null;

            return (
              <div key={group.title} className="record-group">
                <h3 className="record-group-title">
                  {group.title} ({groupRecords.length})
                </h3>
                <div className="history-list">
                  {groupRecords.map((record) => (
                    <RecordItem
                      key={record.id}
                      record={record}
                      showActions={false}
                      showCountdown={true}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
