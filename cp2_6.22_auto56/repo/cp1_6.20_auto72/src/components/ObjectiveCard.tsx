import React, { useState } from 'react';
import type { Objective, KeyResult } from '../types';

interface Props {
  objective: Objective;
  cycleId: string;
  onKrUpdate?: () => void;
  index: number;
}

const calculateProgress = (obj: Objective): number => {
  if (obj.keyResults.length === 0) return 0;
  const total = obj.keyResults.reduce((sum, kr) => {
    const progress = Math.max(0, Math.min(100,
      ((kr.currentValue - kr.initialValue) / (kr.targetValue - kr.initialValue)) * 100
    ));
    return sum + (isNaN(progress) ? 0 : progress);
  }, 0);
  return Math.round(total / obj.keyResults.length);
};

const getProgressColor = (progress: number): string => {
  if (progress >= 80) return '#00C853';
  if (progress >= 50) return '#FFD600';
  if (progress >= 25) return '#FF9100';
  return '#FF5252';
};

const ProgressRing: React.FC<{ progress: number; size?: number }> = ({ progress, size = 56 }) => {
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  const color = getProgressColor(progress);

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#E8E6FF"
        strokeWidth={stroke}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease-in-out, stroke 0.3s ease-in-out' }}
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={size < 50 ? 11 : 13}
        fontWeight={600}
        fill="#2D2B55"
        style={{ transform: 'rotate(90deg)', transformOrigin: `${size/2}px ${size/2}px` }}
      >
        {progress}%
      </text>
    </svg>
  );
};

const KrProgressBar: React.FC<{ kr: KeyResult }> = ({ kr }) => {
  const progress = Math.max(0, Math.min(100,
    ((kr.currentValue - kr.initialValue) / (kr.targetValue - kr.initialValue)) * 100
  ));
  const clampedProgress = isNaN(progress) ? 0 : progress;

  return (
    <div style={{
      padding: '10px 0',
      borderBottom: '1px solid #F0EEFF',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
      }}>
        <span style={{
          fontSize: 13,
          color: '#4A477A',
          flex: 1,
          paddingRight: 12,
        }}>
          {kr.description}
        </span>
        <span style={{
          fontSize: 13,
          fontWeight: 600,
          color: '#6C63FF',
          whiteSpace: 'nowrap',
        }}>
          {kr.currentValue}/{kr.targetValue} {kr.unit}
        </span>
      </div>
      <div style={{
        height: 6,
        background: '#E8E6FF',
        borderRadius: 3,
        overflow: 'hidden',
      }}>
        <div
          style={{
            height: '100%',
            width: `${clampedProgress}%`,
            background: `linear-gradient(90deg, #6C63FF, #A89FFF)`,
            borderRadius: 3,
            transition: 'width 0.5s ease-in-out',
          }}
        />
      </div>
    </div>
  );
};

const ObjectiveCard: React.FC<Props> = ({ objective, index }) => {
  const [expanded, setExpanded] = useState(false);
  const progress = calculateProgress(objective);

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      style={{
        position: 'relative',
        background: '#FFFFFF',
        borderRadius: 12,
        padding: 20,
        minWidth: 300,
        flex: '0 0 auto',
        cursor: 'pointer',
        boxShadow: '0 2px 12px rgba(108, 99, 255, 0.08)',
        transition: 'all 0.3s ease-in-out',
        transform: `translateY(0)`,
        overflow: 'hidden',
        opacity: 0,
        animation: `fadeInUp 0.5s ease-out ${index * 0.08}s forwards`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 8px 28px rgba(108, 99, 255, 0.18)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 12px rgba(108, 99, 255, 0.08)';
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `repeating-linear-gradient(
            45deg,
            rgba(108, 99, 255, 0.02),
            rgba(108, 99, 255, 0.02) 10px,
            transparent 10px,
            transparent 20px
          )`,
          animation: 'stripeMove 3s linear infinite',
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6C63FF, #A89FFF)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            fontWeight: 600,
            flexShrink: 0,
          }}>
            {objective.ownerInitials}
          </div>
          <div>
            <div style={{
              fontSize: 15,
              fontWeight: 600,
              color: '#2D2B55',
              lineHeight: 1.4,
              maxWidth: 180,
            }}>
              {objective.name}
            </div>
            <div style={{ fontSize: 12, color: '#8B88B5', marginTop: 2 }}>
              {objective.owner}
            </div>
          </div>
        </div>

        <div className="progress-ring-wrapper">
          <ProgressRing progress={progress} />
        </div>
      </div>

      <div style={{
        maxHeight: expanded ? '600px' : '0px',
        overflow: 'hidden',
        transition: 'max-height 0.4s ease-in-out',
        marginTop: expanded ? 12 : 0,
        position: 'relative',
      }}>
        <div style={{
          borderTop: '1px solid #F0EEFF',
          paddingTop: 4,
        }}>
          <div style={{
            fontSize: 12,
            color: '#8B88B5',
            fontWeight: 500,
            padding: '10px 0 4px',
          }}>
            关键结果 ({objective.keyResults.length})
          </div>
          {objective.keyResults.map((kr) => (
            <KrProgressBar key={kr.id} kr={kr} />
          ))}
        </div>
      </div>

      <div style={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        marginTop: expanded ? 8 : 14,
        color: '#8B88B5',
        fontSize: 18,
        transition: 'transform 0.3s ease-in-out',
        transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
      }}>
        ▾
      </div>
    </div>
  );
};

export default ObjectiveCard;
