import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { FiUser, FiMail, FiAward, FiClock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import type { ReservationStatus, User } from '@/types';
import { mockDataService } from '@/services/mockData';
import { GameCarousel } from '@/components/GameCarousel';
import { ReservationList } from '@/components/ReservationList';

type TabKey = 'pending' | 'completed' | 'overdue';

const tabs: { key: TabKey; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'pending', label: '待使用', icon: <FiClock />, color: '#FF8C42' },
  { key: 'completed', label: '已使用', icon: <FiCheckCircle />, color: '#4ADE80' },
  { key: 'overdue', label: '超时', icon: <FiAlertCircle />, color: '#F87171' },
];

export const UserProfile: React.FC = () => {
  const { userId = 'user-1' } = useParams<{ userId?: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('pending');
  const [, setRefreshKey] = useState(0);
  const forceRefresh = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    const found = mockDataService.getUserById(userId) || mockDataService.getUserById('user-1');
    setUser(found || null);
  }, [userId]);

  const countByStatus = useMemo(() => {
    if (!user) return { pending: 0, completed: 0, overdue: 0 };
    const list = mockDataService.getReservationsByUserId(user.id);
    return {
      pending: list.filter((r) => r.status === 'pending').length,
      completed: list.filter((r) => r.status === 'completed').length,
      overdue: list.filter((r) => r.status === 'overdue').length,
    };
  }, [user, ]);

  if (!user) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          color: '#6B6B85',
        }}
      >
        加载中...
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ width: '100%' }}>
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: '24px',
          border: '1px solid var(--divider)',
          padding: '32px',
          marginBottom: '32px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '120px',
            background: 'linear-gradient(135deg, rgba(124, 111, 247, 0.25) 0%, rgba(255, 140, 66, 0.15) 100%)',
          }}
        />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', gap: '24px', flexWrap: 'wrap' }}>
          <img
            src={user.avatar}
            alt={user.name}
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              border: '4px solid var(--bg-card)',
              background: 'var(--bg-primary)',
              flexShrink: 0,
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
            }}
          />
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '8px',
                flexWrap: 'wrap',
              }}
            >
              <h1
                style={{
                  fontSize: '28px',
                  fontWeight: 800,
                  color: '#fff',
                  letterSpacing: '-0.02em',
                }}
              >
                {user.name}
              </h1>
              <span
                style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, rgba(124, 111, 247, 0.2), rgba(124, 111, 247, 0.08))',
                  border: '1px solid rgba(124, 111, 247, 0.3)',
                  color: '#7C6FF7',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <FiAward /> 社区会员
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                flexWrap: 'wrap',
                color: '#9B9BB0',
                fontSize: '14px',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiMail /> {user.email}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiUser /> ID: {user.id}
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '12px',
            }}
          >
            {tabs.map((t) => {
              const count = countByStatus[t.key];
              return (
                <div
                  key={t.key}
                  style={{
                    minWidth: '90px',
                    padding: '12px 16px',
                    borderRadius: '14px',
                    background: 'var(--bg-primary)',
                    border: `1px solid var(--divider)`,
                    textAlign: 'center',
                    transition: 'all 0.2s ease-out',
                  }}
                >
                  <div
                    style={{
                      fontSize: '22px',
                      fontWeight: 800,
                      color: t.color,
                      lineHeight: 1.1,
                    }}
                  >
                    {count}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#6B6B85',
                      marginTop: '2px',
                    }}
                  >
                    {t.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '40px' }}>
        <GameCarousel
          currentUser={user}
          compact
          onReservationCreated={forceRefresh}
        />
      </div>

      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: '24px',
          border: '1px solid var(--divider)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--divider)',
            padding: '4px',
            background: 'var(--bg-primary)',
            overflowX: 'auto',
          }}
        >
          {tabs.map((t) => {
            const isActive = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                style={{
                  flex: 1,
                  minWidth: '120px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '14px 20px',
                  borderRadius: '12px',
                  fontWeight: 600,
                  fontSize: '14px',
                  color: isActive ? '#fff' : '#6B6B85',
                  background: isActive
                    ? `linear-gradient(135deg, ${t.color}20, ${t.color}10)`
                    : 'transparent',
                  border: isActive ? `1px solid ${t.color}50` : '1px solid transparent',
                  transition: 'all 0.2s ease-out',
                  whiteSpace: 'nowrap',
                }}
                onMouseDown={(e) => !isActive && (e.currentTarget.style.transform = 'scale(0.97)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#9B9BB0';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                  }
                }}
              >
                <span style={{ color: t.color }}>{t.icon}</span>
                {t.label}
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '10px',
                    background: isActive ? `${t.color}25` : 'var(--divider)',
                    color: isActive ? t.color : '#6B6B85',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  {countByStatus[t.key]}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ padding: '28px 32px' }}>
          <ReservationList
            userId={user.id}
            filterStatus={activeTab as ReservationStatus}
            onRatingSubmit={() => {
              forceRefresh();
            }}
          />
        </div>
      </div>
    </div>
  );
};
