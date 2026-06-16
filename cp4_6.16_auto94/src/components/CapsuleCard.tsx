import { useState, useEffect, useMemo } from 'react';
import type { Capsule } from '../types';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import './CapsuleCard.css';

interface CapsuleCardProps {
  capsule: Capsule;
  onOpen: (capsule: Capsule) => void;
  onDelete: (id: string) => void;
}

function getTimeRemaining(openDate: string) {
  const total = new Date(openDate).getTime() - Date.now();
  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }
  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  return { days, hours, minutes, seconds, total };
}

function getCountdownColor(total: number): string {
  const days = total / (1000 * 60 * 60 * 24);
  if (days > 30) return '#2F4F4F';
  if (days > 7) return '#556B2F';
  if (days > 1) return '#B8860B';
  return '#8B0000';
}

export default function CapsuleCard({ capsule, onOpen, onDelete }: CapsuleCardProps) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeRemaining(capsule.openDate));
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isLocked = capsule.status === 'locked';
  const isUnlocked = capsule.status === 'unlocked';
  const isOpened = capsule.status === 'opened';
  const isArchived = capsule.status === 'archived';

  useEffect(() => {
    if (!isLocked) return;
    const timer = setInterval(() => {
      setTimeLeft(getTimeRemaining(capsule.openDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [capsule.openDate, isLocked]);

  const contentPreview = useMemo(() => {
    const text = capsule.content.replace(/[#*_`~]/g, '');
    return text.length > 50 ? text.substring(0, 50) + '...' : text;
  }, [capsule.content]);

  const countdownColor = getCountdownColor(timeLeft.total);

  const handleCardClick = () => {
    if (isArchived) return;
    if (isLocked) return;
    onOpen(capsule);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(capsule.id);
    setShowDeleteConfirm(false);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div
      className={`capsule-card ${capsule.status}`}
      onClick={handleCardClick}
      style={{ cursor: isLocked || isArchived ? 'default' : 'pointer' }}
    >
      {isUnlocked && <div className="glow-effect" />}

      <button
        className="delete-btn"
        onClick={handleDeleteClick}
        title={isArchived ? '删除' : '归档'}
      >
        {isArchived ? '🗑️' : '📌'}
      </button>

      <div className="status-icon">
        {isLocked && <span className="icon-lock">🔒</span>}
        {isUnlocked && <span className="icon-envelope">✉️</span>}
        {isOpened && <span className="icon-book">📖</span>}
        {isArchived && <span className="icon-archive">📦</span>}
      </div>

      <h3 className="card-title">{capsule.title}</h3>

      <p className="card-preview">{contentPreview}</p>

      {isLocked && (
        <div className="countdown" style={{ color: countdownColor }}>
          <div className="countdown-label">距离开箱还有</div>
          <div className="countdown-numbers">
            <span className="countdown-unit">
              <span className="num">{timeLeft.days}</span>
              <span className="label">天</span>
            </span>
            <span className="countdown-sep">:</span>
            <span className="countdown-unit">
              <span className="num">{pad(timeLeft.hours)}</span>
              <span className="label">时</span>
            </span>
            <span className="countdown-sep">:</span>
            <span className="countdown-unit">
              <span className="num">{pad(timeLeft.minutes)}</span>
              <span className="label">分</span>
            </span>
            <span className="countdown-sep">:</span>
            <span className="countdown-unit">
              <span className="num">{pad(timeLeft.seconds)}</span>
              <span className="label">秒</span>
            </span>
          </div>
        </div>
      )}

      {!isLocked && !isArchived && (
        <div className="open-hint">
          {isUnlocked ? '点击开启胶囊 ✨' : '已打开 · 点击查看'}
        </div>
      )}

      {isArchived && (
        <div className="archived-hint">已归档</div>
      )}

      <div className="card-footer">
        <span className="card-date">
          创建于 {format(new Date(capsule.createdAt), 'yyyy年MM月dd日', { locale: zhCN })}
        </span>
        {capsule.mediaItems.length > 0 && (
          <span className="card-media-count">
            {capsule.mediaItems.length} 个附件
          </span>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="delete-confirm" onClick={(e) => e.stopPropagation()}>
          <p className="confirm-text">
            {isArchived ? '确定要永久删除吗？' : '确定要归档这个胶囊吗？'}
          </p>
          <div className="confirm-buttons">
            <button className="btn-cancel" onClick={handleCancelDelete}>取消</button>
            <button className="btn-confirm" onClick={handleConfirmDelete}>
              {isArchived ? '删除' : '归档'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
