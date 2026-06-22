import React, { useState } from 'react';
import { Challenge, ChallengeStatus } from '../types';
import ChallengeCard from './ChallengeCard';

interface ChallengeListProps {
  challenges: Challenge[];
}

const ChallengeList: React.FC<ChallengeListProps> = ({ challenges }) => {
  const [expandedGroups, setExpandedGroups] = useState<Record<ChallengeStatus, boolean>>({
    active: true,
    upcoming: true,
    ended: true,
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const grouped = challenges.reduce((acc, challenge) => {
    const startDate = new Date(challenge.startDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + challenge.duration);

    let status: ChallengeStatus = 'upcoming';
    if (today >= startDate && today <= endDate) {
      status = 'active';
    } else if (today > endDate) {
      status = 'ended';
    }

    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(challenge);
    return acc;
  }, {} as Record<ChallengeStatus, Challenge[]>);

  const statusConfig: Record<ChallengeStatus, { label: string; color: string; icon: string }> = {
    active: { label: '进行中', color: '#52c41a', icon: '🔥' },
    upcoming: { label: '即将开始', color: '#1890ff', icon: '⏰' },
    ended: { label: '已结束', color: '#8c8c8c', icon: '✅' },
  };

  const toggleGroup = (status: ChallengeStatus) => {
    setExpandedGroups(prev => ({
      ...prev,
      [status]: !prev[status],
    }));
  };

  return (
    <div>
      {(['active', 'upcoming', 'ended'] as ChallengeStatus[]).map(status => {
        const groupChallenges = grouped[status] || [];
        if (groupChallenges.length === 0) return null;

        const config = statusConfig[status];
        const isExpanded = expandedGroups[status];

        return (
          <div key={status} style={{ marginBottom: '32px' }}>
            <div
              onClick={() => toggleGroup(status)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                background: `${config.color}15`,
                borderRadius: '12px',
                cursor: 'pointer',
                marginBottom: '16px',
                transition: 'background 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${config.color}25`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = `${config.color}15`;
              }}
            >
              <span style={{ fontSize: '24px' }}>{config.icon}</span>
              <h2 style={{
                fontSize: '20px',
                fontWeight: 600,
                margin: 0,
                flex: 1,
                color: config.color,
              }}>
                {config.label} ({groupChallenges.length})
              </h2>
              <span style={{
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease',
                fontSize: '20px',
                color: 'var(--text-secondary)',
              }}>
                ▼
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '20px',
                maxHeight: isExpanded ? 'none' : '0',
                overflow: 'hidden',
                opacity: isExpanded ? 1 : 0,
                transition: 'opacity 0.4s ease',
              }}
            >
              {groupChallenges.map((challenge, index) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  index={index}
                />
              ))}
            </div>
          </div>
        );
      })}

      {challenges.length === 0 && (
        <div className="glass-card" style={{
          textAlign: 'center',
          padding: '60px 20px',
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🏋️</div>
          <h3 style={{
            fontSize: '24px',
            marginBottom: '8px',
            color: 'var(--text-primary)',
          }}>
            还没有挑战
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            创建第一个挑战，开始你的健身之旅！
          </p>
        </div>
      )}
    </div>
  );
};

export default ChallengeList;
