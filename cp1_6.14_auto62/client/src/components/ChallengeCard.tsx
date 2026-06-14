import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Challenge } from '../types';

interface ChallengeCardProps {
  challenge: Challenge;
  index: number;
}

const ChallengeCard: React.FC<ChallengeCardProps> = ({ challenge, index }) => {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => setIsVisible(true), index * 100);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [index]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = new Date(challenge.startDate);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + challenge.duration);
  
  let status: 'active' | 'upcoming' | 'ended' = 'upcoming';
  if (today >= startDate && today <= endDate) {
    status = 'active';
  } else if (today > endDate) {
    status = 'ended';
  }

  const statusConfig = {
    active: { text: '进行中', color: '#52c41a' },
    upcoming: { text: '即将开始', color: '#1890ff' },
    ended: { text: '已结束', color: '#8c8c8c' },
  };

  return (
    <Link 
      to={`/challenge/${challenge.id}`}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
    >
      <div
        ref={cardRef}
        className="glass-card"
        style={{
          height: '100%',
          cursor: 'pointer',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease, box-shadow 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
          e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '16px',
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: 600,
            margin: 0,
            color: 'var(--text-primary)',
          }}>
            {challenge.name}
          </h3>
          <span style={{
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 600,
            background: `${statusConfig[status].color}20`,
            color: statusConfig[status].color,
          }}>
            {statusConfig[status].text}
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginBottom: '16px',
        }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>每日目标</div>
            <div style={{ fontSize: '18px', fontWeight: 600 }}>
              {challenge.dailyGoal} {challenge.unit}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>挑战时长</div>
            <div style={{ fontSize: '18px', fontWeight: 600 }}>{challenge.duration} 天</div>
          </div>
        </div>

        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          paddingTop: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--accent-orange)',
            }} />
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              {challenge.participantsCount || 0} 人参与
            </span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>我的最新成绩</div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--accent-orange)' }}>
              {challenge.myLatestCount || 0} {challenge.unit}
            </div>
          </div>
        </div>

        <div style={{
          marginTop: '12px',
          padding: '8px 12px',
          background: 'rgba(255, 140, 0, 0.1)',
          borderRadius: '8px',
          fontSize: '13px',
          color: 'var(--accent-orange)',
        }}>
          📅 {new Date(challenge.startDate).toLocaleDateString('zh-CN')} 开始
        </div>
      </div>
    </Link>
  );
};

export default ChallengeCard;
