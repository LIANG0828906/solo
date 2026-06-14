import React, { useState, useRef } from 'react';
import { Challenge, DailyRecord } from '../types';

interface DailyRecordFormProps {
  challenge: Challenge;
  todayRecord: DailyRecord | null;
  onSubmit: (count: number) => Promise<void>;
}

const DailyRecordForm: React.FC<DailyRecordFormProps> = ({ challenge, todayRecord, onSubmit }) => {
  const [count, setCount] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const today = new Date().toISOString().split('T')[0];
  const startDate = new Date(challenge.startDate);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + challenge.duration);
  const todayDate = new Date(today);

  const isActive = todayDate >= startDate && todayDate <= endDate;
  const isPast = todayDate > endDate;
  const isUpcoming = todayDate < startDate;

  const progress = todayRecord
    ? Math.min((todayRecord.count / challenge.dailyGoal) * 100, 100)
    : 0;

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numCount = Number(count);
    if (isNaN(numCount) || numCount < 0) {
      setError('请输入有效的数字');
      return;
    }

    if (numCount === 0) {
      setError('请输入大于0的数字');
      return;
    }

    if (todayRecord) {
      setError('今日已提交记录，不可修改');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(numCount);
      setIsSuccess(true);
      setCount('');
      setTimeout(() => setIsSuccess(false), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isPast) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '32px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏰</div>
        <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>挑战已结束</h3>
        <p style={{ color: 'var(--text-secondary)' }}>
          该挑战已于 {new Date(endDate).toLocaleDateString('zh-CN')} 结束
        </p>
      </div>
    );
  }

  if (isUpcoming) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '32px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
        <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>挑战尚未开始</h3>
        <p style={{ color: 'var(--text-secondary)' }}>
          该挑战将于 {new Date(startDate).toLocaleDateString('zh-CN')} 开始
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card">
      <h3 style={{
        fontSize: '22px',
        fontWeight: 600,
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        📝 今日打卡
        <span style={{
          fontSize: '13px',
          fontWeight: 400,
          color: 'var(--text-muted)',
        }}>
          每日目标: {challenge.dailyGoal} {challenge.unit}
        </span>
      </h3>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '32px',
        marginBottom: '24px',
      }}>
        <div style={{ position: 'relative', width: '120px', height: '120px' }}>
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="45"
              fill="none"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="10"
            />
            <circle
              cx="60"
              cy="60"
              r="45"
              fill="none"
              stroke="url(#progressGradient)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 60 60)"
              style={{
                transition: 'stroke-dashoffset 0.6s ease-out',
                animation: 'progressFill 0.8s ease-out',
              }}
            />
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ff8c00" />
                <stop offset="100%" stopColor="#ffa940" />
              </linearGradient>
            </defs>
          </svg>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: 'var(--accent-orange)',
            }}>
              {Math.round(progress)}%
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              完成度
            </div>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            marginBottom: '8px',
          }}>
            今日已完成
          </div>
          <div style={{
            fontSize: '36px',
            fontWeight: 'bold',
            color: todayRecord ? '#52c41a' : 'var(--text-muted)',
            marginBottom: '4px',
          }}>
            {todayRecord ? todayRecord.count : 0}
            <span style={{
              fontSize: '18px',
              fontWeight: 'normal',
              color: 'var(--text-secondary)',
              marginLeft: '8px',
            }}>
              {challenge.unit}
            </span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {todayRecord
              ? `目标 ${challenge.dailyGoal} ${challenge.unit}，已完成 ${Math.round(progress)}%`
              : `还未打卡，加油！`}
          </div>
        </div>
      </div>

      {todayRecord ? (
        <div style={{
          padding: '16px',
          background: 'rgba(82, 196, 26, 0.1)',
          border: '1px solid rgba(82, 196, 26, 0.3)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <span style={{ fontSize: '24px' }}>✅</span>
          <div>
            <div style={{ fontWeight: 600, color: '#52c41a' }}>今日已打卡</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              提交时间：{new Date(todayRecord.createdAt).toLocaleTimeString('zh-CN')}
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div style={{
              padding: '12px',
              background: 'rgba(255, 77, 79, 0.15)',
              border: '1px solid rgba(255, 77, 79, 0.3)',
              borderRadius: '8px',
              color: '#ff7875',
              fontSize: '14px',
            }}>
              {error}
            </div>
          )}

          <div>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              marginBottom: '8px',
            }}>
              今日完成量 ({challenge.unit})
            </label>
            <div style={{
              position: 'relative',
              transition: 'all 0.3s ease',
              boxShadow: isFocused
                ? '0 0 0 4px rgba(255, 140, 0, 0.2), 0 0 30px rgba(255, 140, 0, 0.3)'
                : 'none',
              borderRadius: '12px',
            }}>
              <input
                ref={inputRef}
                type="number"
                className="input"
                placeholder={`输入今日完成的${challenge.unit}数`}
                value={count}
                onChange={(e) => setCount(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                min="1"
                disabled={isSubmitting || isSuccess}
                style={{
                  fontSize: '18px',
                  padding: '16px',
                  transition: 'all 0.3s ease',
                }}
              />
              {isFocused && (
                <div style={{
                  position: 'absolute',
                  top: '-2px',
                  left: '-2px',
                  right: '-2px',
                  bottom: '-2px',
                  borderRadius: '14px',
                  background: 'linear-gradient(90deg, #ff8c00, #ffa940, #ff8c00)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 2s linear infinite',
                  zIndex: -1,
                  opacity: 0.5,
                }} />
              )}
            </div>
          </div>

          <button
            type="submit"
            className="btn"
            disabled={isSubmitting || isSuccess}
            style={{
              padding: '14px 32px',
              fontSize: '16px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {isSuccess ? (
              <span className="animate-checkmark" style={{ fontSize: '20px' }}>✓</span>
            ) : isSubmitting ? (
              <span style={{ opacity: 0.7 }}>提交中...</span>
            ) : (
              '提交打卡'
            )}
          </button>
        </form>
      )}
    </div>
  );
};

export default DailyRecordForm;
