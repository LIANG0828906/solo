import React, { useState } from 'react';
import { claimTask, submitProgress } from '../services/api';
import ProgressBar from './ProgressBar';

interface GroupCardProps {
  group: {
    id: string;
    name: string;
    members: string[];
    task?: string;
    progress: number;
    submissions: { text: string; rating: number; timestamp: number }[];
  };
  classId: string;
  onRefresh: () => void;
}

const keyframesStyle = `
@keyframes groupCardFadeIn {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}
`;

const styles = {
  card: (expired: boolean): React.CSSProperties => ({
    borderRadius: 12,
    background: expired ? '#FFE0E0' : '#F5F5F5',
    boxShadow: '0 2px 8px rgba(27,58,92,0.07)',
    padding: 20,
    animation: 'groupCardFadeIn 0.6s ease both',
  }),
  cardTitle: {
    fontSize: 17,
    fontWeight: 700 as const,
    color: '#1B3A5C',
    marginBottom: 10,
  },
  memberList: {
    fontSize: 13,
    color: '#555',
    marginBottom: 12,
    lineHeight: 1.6,
  },
  taskDesc: {
    fontSize: 13,
    color: '#1B3A5C',
    background: '#E3ECF5',
    borderRadius: 6,
    padding: '8px 12px',
    marginBottom: 12,
  },
  btnRow: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap' as const,
    marginBottom: 12,
  },
  btn: {
    padding: '6px 16px',
    background: '#1B3A5C',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600 as const,
    cursor: 'pointer',
  },
  btnSecondary: {
    padding: '6px 16px',
    background: '#fff',
    color: '#1B3A5C',
    border: '1px solid #1B3A5C',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600 as const,
    cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  },
  modal: {
    background: '#fff',
    borderRadius: 12,
    padding: 28,
    width: 400,
    maxWidth: '90vw',
    boxShadow: '0 8px 30px rgba(27,58,92,0.18)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 700 as const,
    color: '#1B3A5C',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 14,
    color: '#444',
    marginBottom: 8,
  },
  countdown: {
    fontSize: 28,
    fontWeight: 700 as const,
    color: '#1B3A5C',
    textAlign: 'center' as const,
    margin: '16px 0',
    fontVariantNumeric: 'tabular-nums',
  },
  closeBtn: {
    marginTop: 16,
    padding: '8px 0',
    width: '100%',
    background: '#eee',
    border: 'none',
    borderRadius: 6,
    fontSize: 14,
    cursor: 'pointer',
  },
  submitPanel: {
    background: '#fff',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
    boxShadow: '0 1px 6px rgba(27,58,92,0.06)',
  },
  textarea: {
    width: '100%',
    minHeight: 60,
    border: '1px solid #ddd',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    resize: 'vertical' as const,
    fontFamily: "'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
    boxSizing: 'border-box' as const,
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right' as const,
    marginBottom: 8,
  },
  stars: {
    display: 'flex',
    gap: 4,
    marginBottom: 12,
  },
  star: (active: boolean): React.CSSProperties => ({
    fontSize: 22,
    cursor: 'pointer',
    color: active ? '#F5A623' : '#ddd',
    background: 'none',
    border: 'none',
    padding: 0,
    lineHeight: 1,
  }),
  submitBtn: {
    padding: '6px 20px',
    background: '#1B3A5C',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600 as const,
    cursor: 'pointer',
  },
};

function formatCountdown(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

export default function GroupCard({ group, classId, onRefresh }: GroupCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [countdown, setCountdown] = useState(1800);
  const [expired, setExpired] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverStar, setHoverStar] = useState(0);
  const [claimedTask, setClaimedTask] = useState<string | null>(null);
  const [taskAssignedAt, setTaskAssignedAt] = useState<number>(0);

  React.useEffect(() => {
    if (!showModal) return;
    const endTime = taskAssignedAt + 1800 * 1000;
    const timer = setInterval(() => {
      const left = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setCountdown(left);
      if (left <= 0) {
        setExpired(true);
        clearInterval(timer);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [showModal, taskAssignedAt]);

  const handleClaim = async () => {
    try {
      const res = await claimTask(group.id, classId);
      const taskDesc = res.data.description;
      const assignedAt = res.data.assignedAt;
      setClaimedTask(taskDesc);
      setTaskAssignedAt(assignedAt);
      setShowModal(true);
      setExpired(false);
      onRefresh();
    } catch {}
  };

  const handleSubmitProgress = async () => {
    if (!progressText.trim() || rating === 0) return;
    try {
      await submitProgress(group.id, progressText.trim(), rating);
      setShowSubmit(false);
      setProgressText('');
      setRating(0);
      onRefresh();
    } catch {}
  };

  return (
    <>
      <style>{keyframesStyle}</style>
      <div style={styles.card(expired)}>
        <div style={styles.cardTitle}>{group.name}</div>
        <div style={styles.memberList}>
          {group.members.join('、')}
        </div>
        {(group.task || claimedTask) && (
          <div style={styles.taskDesc}>{group.task || claimedTask}</div>
        )}
        <div style={styles.btnRow}>
          <button style={styles.btn} onClick={handleClaim}>
            领取任务
          </button>
          <button
            style={styles.btnSecondary}
            onClick={() => setShowSubmit(!showSubmit)}
          >
            提交进度
          </button>
        </div>
        <ProgressBar progress={group.progress} />
        {showSubmit && (
          <div style={styles.submitPanel}>
            <textarea
              style={styles.textarea}
              maxLength={200}
              placeholder="输入进度描述..."
              value={progressText}
              onChange={(e) => setProgressText(e.target.value)}
            />
            <div style={styles.charCount}>
              {progressText.length}/200
            </div>
            <div style={styles.stars}>
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  style={styles.star(i <= (hoverStar || rating))}
                  onClick={() => setRating(i)}
                  onMouseEnter={() => setHoverStar(i)}
                  onMouseLeave={() => setHoverStar(0)}
                >
                  ★
                </button>
              ))}
            </div>
            <button style={styles.submitBtn} onClick={handleSubmitProgress}>
              提交
            </button>
          </div>
        )}
      </div>
      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>任务已领取</div>
            <div style={styles.modalText}>
              小组：{group.name}
            </div>
            <div style={styles.modalText}>
              任务描述：{group.task || claimedTask}
            </div>
            <div style={styles.countdown}>{formatCountdown(countdown)}</div>
            {expired && (
              <div
                style={{
                  textAlign: 'center',
                  color: '#C0392B',
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                倒计时已结束
              </div>
            )}
            <button
              style={styles.closeBtn}
              onClick={() => setShowModal(false)}
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </>
  );
}
