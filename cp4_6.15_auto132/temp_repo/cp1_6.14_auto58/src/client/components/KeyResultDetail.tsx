import React, { useState, useEffect, useRef } from 'react';
import type { KeyResult, User } from '../types';
import { okrApi } from '../api';
import { useAppContext } from '../context/AppContext';
import CircularProgress from './CircularProgress';

interface KeyResultDetailProps {
  kr: KeyResult;
  objectiveId: string;
  users: User[];
  onClose: () => void;
  onUpdate: (updatedKR: KeyResult) => void;
}

const getProgressGradient = (score?: number): string => {
  if (score === undefined) return 'linear-gradient(90deg, #818cf8, #6366f1)';
  if (score <= 2) return 'linear-gradient(90deg, #fca5a5, #ef4444)';
  if (score <= 3) return 'linear-gradient(90deg, #fde047, #eab308)';
  return 'linear-gradient(90deg, #86efac, #22c55e)';
};

const formatFullDate = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  } catch {
    return dateStr;
  }
};

const AnimatedProgressBar: React.FC<{
  progress: number;
  score?: number;
}> = ({ progress, score }) => {
  const [displayProgress, setDisplayProgress] = useState(0);
  const prevProgress = useRef(0);

  useEffect(() => {
    const start = prevProgress.current;
    const end = progress;
    const duration = 600;
    const startTime = performance.now();

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progressRatio = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progressRatio, 3);
      setDisplayProgress(Math.round(start + (end - start) * easeOut));

      if (progressRatio < 1) {
        requestAnimationFrame(animate);
      } else {
        prevProgress.current = end;
      }
    };

    requestAnimationFrame(animate);
  }, [progress]);

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '8px',
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--color-text)',
        }}
      >
        <span>完成进度</span>
        <span style={{ color: 'var(--color-primary)' }}>{displayProgress}%</span>
      </div>
      <div
        style={{
          width: '100%',
          height: '16px',
          background: 'var(--color-surface-hover)',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${displayProgress}%`,
            background: getProgressGradient(score),
            borderRadius: '8px',
            transition: 'background 0.5s ease',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
          }}
        />
      </div>
    </div>
  );
};

const StarRatingInput: React.FC<{
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}> = ({ value, onChange, disabled = false }) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const handleClick = (star: number, half: boolean) => {
    if (disabled) return;
    const newValue = half ? star - 0.5 : star;
    onChange(newValue);
  };

  const handleMove = (star: number, e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const half = x < rect.width / 2;
    setHoverValue(half ? star - 0.5 : star);
  };

  const displayValue = hoverValue !== null ? hoverValue : value;
  const isAnimating = hoverValue !== null;

  return (
    <div
      style={{
        display: 'flex',
        gap: '4px',
        alignItems: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      onMouseLeave={() => setHoverValue(null)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const fillPercent =
          displayValue >= star
            ? 100
            : displayValue >= star - 0.5
              ? 50
              : 0;
        const color =
          displayValue <= 2
            ? '#ef4444'
            : displayValue <= 3
              ? '#eab308'
              : '#22c55e';

        return (
          <div
            key={star}
            style={{
              position: 'relative',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: disabled ? 0.5 : 1,
              animation: isAnimating ? `star-twinkle 0.4s ease ${star * 0.06}s` : 'none',
            }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const half = x < rect.width / 2;
              handleClick(star, half);
            }}
            onMouseMove={(e) => handleMove(star, e)}
          >
            <span
              style={{
                fontSize: '28px',
                color: '#d1d5db',
                lineHeight: 1,
                transition: 'transform 0.2s ease',
                transform: isAnimating ? 'scale(1.15)' : 'scale(1)',
                textShadow: isAnimating ? `0 0 8px ${color}66` : 'none',
              }}
            >
              ★
            </span>
            <span
              style={{
                position: 'absolute',
                left: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                width: `${fillPercent}%`,
                height: '28px',
                overflow: 'hidden',
                fontSize: '28px',
                color,
                lineHeight: 1,
                transition: 'color 0.3s ease, width 0.2s ease',
              }}
            >
              ★
            </span>
          </div>
        );
      })}
      <span
        style={{
          marginLeft: '8px',
          fontSize: '16px',
          fontWeight: 'bold',
          color:
            displayValue <= 2
              ? '#ef4444'
              : displayValue <= 3
                ? '#eab308'
                : '#22c55e',
          minWidth: '32px',
        }}
      >
        {displayValue.toFixed(1)}
      </span>
    </div>
  );
};

const KeyResultDetail: React.FC<KeyResultDetailProps> = ({
  kr,
  objectiveId,
  users,
  onClose,
  onUpdate,
}) => {
  const { user } = useAppContext();
  const isManager = user?.role === 'manager';
  const isOwner = user?.id === kr.ownerId;
  const canEditProgress = isOwner || isManager;

  const [score, setScore] = useState<number>(kr.score ?? 0);
  const [feedback, setFeedback] = useState<string>(kr.feedback ?? '');
  const [saving, setSaving] = useState(false);
  const [localProgress, setLocalProgress] = useState(kr.progress);
  const [feedbackSaved, setFeedbackSaved] = useState(true);

  const owner = users.find((u) => u.id === kr.ownerId);

  useEffect(() => {
    setLocalProgress(kr.progress);
    setScore(kr.score ?? 0);
    setFeedback(kr.feedback ?? '');
  }, [kr]);

  const handleProgressChange = (value: number) => {
    setLocalProgress(value);
  };

  const handleProgressRelease = async (value: number) => {
    if (!canEditProgress) return;
    setSaving(true);
    try {
      const { keyResult } = await okrApi.updateKeyResult(objectiveId, kr.id, {
        progress: value,
      });
      setLocalProgress(keyResult.progress);
      onUpdate(keyResult);
    } catch (e) {
      console.error('更新进度失败', e);
      setLocalProgress(kr.progress);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveScore = async () => {
    if (!isManager) return;
    setSaving(true);
    try {
      const { keyResult } = await okrApi.scoreKeyResult(
        objectiveId,
        kr.id,
        score,
        feedback
      );
      onUpdate(keyResult);
      setFeedbackSaved(true);
    } catch (e) {
      console.error('保存评分失败', e);
    } finally {
      setSaving(false);
    }
  };

  const handleFeedbackChange = (val: string) => {
    setFeedback(val);
    setFeedbackSaved(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: '20px',
        animation: 'fadeIn 0.25s ease',
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes star-twinkle {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1.05); }
        }
        @keyframes bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.1); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes progressFill {
          from { width: 0%; }
        }
      `}</style>
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '28px',
          animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '20px',
            gap: '12px',
          }}
        >
          <div style={{ flex: 1 }}>
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 600,
                marginBottom: '6px',
                color: 'var(--color-text)',
              }}
            >
              {kr.title}
            </h2>
            {kr.description && (
              <p
                style={{
                  color: 'var(--color-text-secondary)',
                  fontSize: '14px',
                  lineHeight: 1.5,
                }}
              >
                {kr.description}
              </p>
            )}
          </div>
          {kr.score !== undefined && (
            <div
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                background:
                  kr.score <= 2
                    ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                    : kr.score <= 3
                      ? 'linear-gradient(135deg, #eab308, #ca8a04)'
                      : 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 'bold',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                animation: 'bounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                whiteSpace: 'nowrap',
              }}
            >
              ★ {kr.score.toFixed(1)}
            </div>
          )}
          <button
            onClick={onClose}
            style={{
              fontSize: '24px',
              color: 'var(--color-text-secondary)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              lineHeight: 1,
              padding: '4px',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color =
                'var(--color-text)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color =
                'var(--color-text-secondary)';
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginBottom: '20px',
            padding: '16px',
            backgroundColor: 'var(--color-surface-hover)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '12px',
                color: 'var(--color-text-secondary)',
                marginBottom: '4px',
              }}
            >
              负责人
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 500,
                color: 'var(--color-text)',
              }}
            >
              <span style={{ fontSize: '20px' }}>{owner?.avatar || '👤'}</span>
              <span>{owner?.name || '未分配'}</span>
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: '12px',
                color: 'var(--color-text-secondary)',
                marginBottom: '4px',
              }}
            >
              截止日期
            </div>
            <div style={{ fontWeight: 500, color: 'var(--color-text)' }}>
              {formatFullDate(kr.deadline)}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '24px',
            padding: '20px',
            backgroundColor: 'var(--color-surface-hover)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <CircularProgress
              value={localProgress}
              onChange={handleProgressChange}
              onRelease={handleProgressRelease}
              editable={canEditProgress}
              size={120}
              strokeWidth={10}
              score={kr.score}
            />
            {canEditProgress && (
              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--color-text-secondary)',
                }}
              >
                {isManager ? '可拖拽调整进度' : '拖拽外圈调整进度'}
              </div>
            )}
          </div>
          <div style={{ width: '100%' }}>
            <AnimatedProgressBar progress={localProgress} score={kr.score} />
          </div>
        </div>

        {isManager && (
          <div
            style={{
              padding: '20px',
              backgroundColor: 'var(--color-surface-hover)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                fontSize: '15px',
                fontWeight: 600,
                marginBottom: '12px',
                color: 'var(--color-text)',
              }}
            >
              评分与反馈
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div
                style={{
                  fontSize: '13px',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '8px',
                }}
              >
                评分（1-5星，支持半星）
              </div>
              <StarRatingInput
                value={score}
                onChange={setScore}
                disabled={!isManager}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div
                style={{
                  fontSize: '13px',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '8px',
                }}
              >
                反馈意见
              </div>
              <textarea
                value={feedback}
                onChange={(e) => handleFeedbackChange(e.target.value)}
                placeholder="请输入对该关键结果的反馈意见..."
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '10px 12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  fontSize: '14px',
                  lineHeight: 1.5,
                  resize: 'vertical',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--color-primary)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--color-border)';
                }}
              />
            </div>

            <button
              onClick={handleSaveScore}
              disabled={saving || (!feedbackSaved && feedback.length === 0)}
              style={{
                width: '100%',
                padding: '10px 16px',
                backgroundColor: 'var(--color-primary)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: '14px',
                fontWeight: 500,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!saving) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    'var(--color-primary-hover)';
                  (e.currentTarget as HTMLButtonElement).style.transform =
                    'scale(1.01)';
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  'var(--color-primary)';
                (e.currentTarget as HTMLButtonElement).style.transform =
                  'scale(1)';
              }}
            >
              {saving ? '保存中...' : '保存评分与反馈'}
            </button>
          </div>
        )}

        {!isManager && kr.feedback && (
          <div
            style={{
              padding: '16px',
              backgroundColor: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--color-primary)',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              💬 上级反馈
            </div>
            <p
              style={{
                fontSize: '14px',
                lineHeight: 1.6,
                color: 'var(--color-text)',
                whiteSpace: 'pre-wrap',
              }}
            >
              {kr.feedback}
            </p>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
          }}
        >
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
            }}
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default KeyResultDetail;
