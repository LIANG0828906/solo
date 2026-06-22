import React, { useState } from 'react';
import type { Risk } from './riskCalculator';

interface RiskCardProps {
  risk: Risk;
  onStatusChange: (id: string, status: Risk['status']) => void;
  isNew?: boolean;
}

const levelColors: Record<Risk['level'], string> = {
  high: '#EF4444',
  medium: '#F59E0B',
  low: '#22C55E',
};

const levelLabels: Record<Risk['level'], string> = {
  high: '高',
  medium: '中',
  low: '低',
};

const statusLabels: Record<Risk['status'], string> = {
  pending: '待处理',
  processing: '处理中',
  completed: '已完成',
};

const statusColors: Record<Risk['status'], string> = {
  pending: '#475569',
  processing: '#3B82F6',
  completed: '#22C55E',
};

const RiskCard: React.FC<RiskCardProps> = ({ risk, onStatusChange, isNew = false }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isCheckAnimating, setIsCheckAnimating] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleCheckboxClick = () => {
    if (risk.status === 'completed') return;

    setIsAnimating(true);
    setIsCheckAnimating(true);

    setTimeout(() => {
      setIsAnimating(false);
    }, 400);

    setTimeout(() => {
      setIsCheckAnimating(false);
    }, 200);

    const nextStatus: Record<string, Risk['status']> = {
      pending: 'processing',
      processing: 'completed',
      completed: 'completed',
    };
    onStatusChange(risk.id, nextStatus[risk.status]);
  };

  const cardStyle: React.CSSProperties = {
    position: 'relative',
    backgroundColor: risk.status === 'completed' ? '#1E293B' : '#334155',
    borderRadius: '12px',
    padding: '16px',
    borderLeft: `4px solid ${levelColors[risk.level]}`,
    transition: 'transform 0.3s ease, box-shadow 0.3s ease, background-color 0.4s ease',
    transform: isAnimating ? 'scale(0.95)' : isHovered ? 'translateY(-3px)' : 'translateY(0)',
    boxShadow: isHovered ? '0 8px 25px rgba(0, 0, 0, 0.3)' : 'none',
    opacity: 1,
    animation: isNew ? 'fadeIn 0.3s ease-out' : undefined,
    cursor: 'pointer',
  };

  return (
    <div
      style={cardStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes checkBounce {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.3);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, paddingRight: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, color: '#F8FAFC', fontSize: '16px', fontWeight: 600 }}>
              {risk.title}
            </h3>
            <span
              style={{
                backgroundColor: levelColors[risk.level],
                color: '#FFFFFF',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              {levelLabels[risk.level]}风险
            </span>
            <span
              style={{
                backgroundColor: statusColors[risk.status],
                color: '#FFFFFF',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 500,
                transition: 'background-color 0.4s ease',
              }}
            >
              {statusLabels[risk.status]}
            </span>
          </div>

          <p style={{ margin: '0 0 12px 0', color: '#94A3B8', fontSize: '14px', lineHeight: 1.5 }}>
            {risk.description}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#64748B', fontSize: '13px' }}>发生概率:</span>
              <span style={{ color: '#F8FAFC', fontSize: '14px', fontWeight: 500 }}>
                {risk.probability}%
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#64748B', fontSize: '13px' }}>影响程度:</span>
              <span style={{ color: '#F8FAFC', fontSize: '14px', fontWeight: 500 }}>
                {risk.impact}/5
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#64748B', fontSize: '13px' }}>负责人:</span>
              <span style={{ color: '#F8FAFC', fontSize: '14px', fontWeight: 500 }}>
                {risk.owner || '-'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
            <span style={{ color: '#64748B', fontSize: '13px', flexShrink: 0 }}>应对措施:</span>
            <span style={{ color: '#CBD5E1', fontSize: '13px', lineHeight: 1.5 }}>
              {risk.response || '暂无'}
            </span>
          </div>
        </div>

        {risk.status !== 'completed' && (
          <div
            onClick={handleCheckboxClick}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              border: '2px solid #64748B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              flexShrink: 0,
              animation: isCheckAnimating ? 'checkBounce 0.2s ease-out' : undefined,
              minWidth: '44px',
              minHeight: '44px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = levelColors[risk.level];
              e.currentTarget.style.backgroundColor = `${levelColors[risk.level]}20`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#64748B';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          />
        )}

        {risk.status === 'completed' && (
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#22C55E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiskCard;
