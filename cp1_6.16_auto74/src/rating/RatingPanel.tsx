import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { calculateGroupScores, getCurrentUserGroup, getPendingReviews } from '../data/mockData';
import type { Review, GroupScore, FileItem } from '../types';
import '../styles/RatingPanel.css';

export function RatingPanel() {
  const { id: taskId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTaskById, currentUser, submitReview, getUserById } = useApp();
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [completeness, setCompleteness] = useState(3);
  const [creativity, setCreativity] = useState(3);
  const [collaboration, setCollaboration] = useState(3);
  const [comment, setComment] = useState('');
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const task = taskId ? getTaskById(taskId) : null;

  const userGroupId = useMemo(() => {
    if (!task || !currentUser) return null;
    return getCurrentUserGroup(task, currentUser.id);
  }, [task, currentUser]);

  const pendingReviews = useMemo(() => {
    if (!task || !userGroupId) return [];
    return getPendingReviews(task, userGroupId);
  }, [task, userGroupId]);

  const groupScores = useMemo(() => {
    if (!task) return [];
    return calculateGroupScores(task);
  }, [task]);

  const currentReview: Review | null = pendingReviews[currentReviewIndex] || null;

  const revieweeGroup = useMemo(() => {
    if (!task || !currentReview) return null;
    return task.groups.find((g) => g.id === currentReview.revieweeGroupId) || null;
  }, [task, currentReview]);

  const isReviewPhase = task?.status === 'reviewing';
  const isCompletedPhase = task?.status === 'completed';

  useEffect(() => {
    if (currentReview) {
      setCompleteness(3);
      setCreativity(3);
      setCollaboration(3);
      setComment('');
    }
  }, [currentReviewIndex, currentReview]);

  useEffect(() => {
    if (isCompletedPhase && canvasRef.current && groupScores.length > 0) {
      drawChart();
    }
  }, [isCompletedPhase, groupScores]);

  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas || groupScores.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 40, right: 30, bottom: 60, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    ctx.clearRect(0, 0, width, height);

    const maxScore = 5;
    const barGap = 24;
    const barWidth = Math.min(60, (chartWidth - barGap * (groupScores.length - 1)) / groupScores.length);
    const startX = padding.left + (chartWidth - (barWidth * groupScores.length + barGap * (groupScores.length - 1))) / 2;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + chartHeight - (i / maxScore) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(i.toString(), padding.left - 10, y + 4);
    }

    const colors = {
      completeness: '#60a5fa',
      creativity: '#f472b6',
      collaboration: '#34d399',
    };

    groupScores.forEach((score, index) => {
      const x = startX + index * (barWidth + barGap);

      const compHeight = (score.avgCompleteness / maxScore) * chartHeight;
      const creatHeight = (score.avgCreativity / maxScore) * chartHeight;
      const collabHeight = (score.avgCollaboration / maxScore) * chartHeight;

      let currentY = padding.top + chartHeight;

      currentY -= collabHeight;
      ctx.fillStyle = colors.collaboration;
      ctx.fillRect(x, currentY, barWidth, collabHeight);

      currentY -= creatHeight;
      ctx.fillStyle = colors.creativity;
      ctx.fillRect(x, currentY, barWidth, creatHeight);

      currentY -= compHeight;
      ctx.fillStyle = colors.completeness;
      ctx.fillRect(x, currentY, barWidth, compHeight);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(score.avgTotal.toFixed(1), x + barWidth / 2, padding.top + chartHeight - (score.avgTotal / maxScore) * chartHeight - 8);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '12px sans-serif';
      ctx.fillText(score.groupName, x + barWidth / 2, height - padding.bottom + 20);
    });
  };

  const handleSubmitReview = () => {
    if (!task || !currentReview) return;

    submitReview(task.id, currentReview.id, {
      completeness,
      creativity,
      collaboration,
      comment,
    });

    setShowSuccess(true);

    setTimeout(() => {
      setShowSuccess(false);
      if (currentReviewIndex < pendingReviews.length - 1) {
        setCurrentReviewIndex((prev) => prev + 1);
      }
    }, 1000);
  };

  const toggleComment = (groupId: string) => {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const truncateComment = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return '🖼️';
      case 'pdf':
        return '📄';
      default:
        return '📁';
    }
  };

  const renderFilePreview = (file: FileItem) => {
    if (file.type === 'image' && file.url) {
      return (
        <img
          key={file.id}
          src={file.url}
          alt={file.name}
          className="rating-panel__file-image"
          onClick={() => setPreviewImage(file.url!)}
        />
      );
    }
    return (
      <div key={file.id} className="rating-panel__file-item">
        <span className="rating-panel__file-icon">{getFileIcon(file.type)}</span>
        <div className="rating-panel__file-info">
          <span className="rating-panel__file-name">{file.name}</span>
          {file.pageCount && (
            <span className="rating-panel__file-pages">{file.pageCount} 页</span>
          )}
        </div>
      </div>
    );
  };

  if (!task) {
    return (
      <div className="rating-panel page-enter">
        <div className="rating-panel__empty">任务不存在</div>
      </div>
    );
  }

  if (isReviewPhase) {
    if (!userGroupId) {
      return (
        <div className="rating-panel page-enter">
          <div className="rating-panel__empty">你不在该任务的任何小组中</div>
        </div>
      );
    }

    if (pendingReviews.length === 0) {
      return (
        <div className="rating-panel page-enter">
          <div className="rating-panel__container">
            <button
              className="rating-panel__back"
              onClick={() => navigate(`/class/${task.classId}`)}
            >
              ← 返回
            </button>
            <div className="rating-panel__done">
              <div className="rating-panel__done-icon">✅</div>
              <h2 className="rating-panel__done-title">评审完成</h2>
              <p className="rating-panel__done-text">你已经完成了所有评审任务</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="rating-panel page-enter">
        <div className="rating-panel__container">
          <div className="rating-panel__header">
            <button
              className="rating-panel__back"
              onClick={() => navigate(`/class/${task.classId}`)}
            >
              ← 返回
            </button>
            <h1 className="rating-panel__title">{task.name}</h1>
            <div className="rating-panel__progress">
              {currentReviewIndex + 1} / {pendingReviews.length}
            </div>
          </div>

          <div className="rating-panel__review-content">
            <div className="rating-panel__preview">
              <h2 className="rating-panel__section-title">被评审组作品</h2>
              <div className="rating-panel__group-name">{revieweeGroup?.name}</div>
              {revieweeGroup?.submission?.files ? (
                <div className="rating-panel__files">
                  {revieweeGroup.submission.files.map(renderFilePreview)}
                </div>
              ) : (
                <div className="rating-panel__no-files">该组暂未提交作品</div>
              )}
            </div>

            <div className="rating-panel__form">
              <h2 className="rating-panel__section-title">评分</h2>

              <div className="rating-panel__slider-group">
                <div className="rating-panel__slider-header">
                  <span className="rating-panel__slider-label">成果完整度</span>
                  <span className="rating-panel__slider-value">{completeness}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={completeness}
                  onChange={(e) => setCompleteness(Number(e.target.value))}
                  className="rating-panel__slider"
                />
                <div className="rating-panel__slider-marks">
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5</span>
                </div>
              </div>

              <div className="rating-panel__slider-group">
                <div className="rating-panel__slider-header">
                  <span className="rating-panel__slider-label">创意性</span>
                  <span className="rating-panel__slider-value">{creativity}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={creativity}
                  onChange={(e) => setCreativity(Number(e.target.value))}
                  className="rating-panel__slider"
                />
                <div className="rating-panel__slider-marks">
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5</span>
                </div>
              </div>

              <div className="rating-panel__slider-group">
                <div className="rating-panel__slider-header">
                  <span className="rating-panel__slider-label">协作表现</span>
                  <span className="rating-panel__slider-value">{collaboration}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={collaboration}
                  onChange={(e) => setCollaboration(Number(e.target.value))}
                  className="rating-panel__slider"
                />
                <div className="rating-panel__slider-marks">
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5</span>
                </div>
              </div>

              <div className="rating-panel__comment-group">
                <div className="rating-panel__comment-header">
                  <span className="rating-panel__comment-label">文字评语</span>
                  <span className="rating-panel__comment-count">{comment.length}/200</span>
                </div>
                <textarea
                  className="rating-panel__comment-input"
                  value={comment}
                  onChange={(e) => setComment(e.target.value.slice(0, 200))}
                  placeholder="请输入你的评语（选填）"
                  maxLength={200}
                />
              </div>

              <button
                className="btn btn--primary btn--large rating-panel__submit"
                onClick={handleSubmitReview}
              >
                提交评分
              </button>
            </div>
          </div>
        </div>

        {showSuccess && (
          <div className="rating-panel__success-overlay">
            <div className="rating-panel__success-content">
              <div className="rating-panel__success-check">
                <svg viewBox="0 0 52 52" className="checkmark">
                  <circle
                    className="checkmark__circle"
                    cx="26"
                    cy="26"
                    r="25"
                    fill="none"
                  />
                  <path
                    className="checkmark__check"
                    fill="none"
                    d="M14.1 27.2l7.1 7.2 16.7-16.8"
                  />
                </svg>
              </div>
              <h2 className="rating-panel__success-title">评分已提交</h2>
            </div>
          </div>
        )}

        {previewImage && (
          <div
            className="rating-panel__image-preview"
            onClick={() => setPreviewImage(null)}
          >
            <img src={previewImage} alt="预览" />
          </div>
        )}
      </div>
    );
  }

  if (isCompletedPhase) {
    return (
      <div className="rating-panel page-enter">
        <div className="rating-panel__container">
          <div className="rating-panel__header">
            <button
              className="rating-panel__back"
              onClick={() => navigate(`/class/${task.classId}`)}
            >
              ← 返回
            </button>
            <h1 className="rating-panel__title">{task.name}</h1>
            <div className="rating-panel__status-badge">已结束</div>
          </div>

          <div className="rating-panel__results">
            <h2 className="rating-panel__section-title">评分结果</h2>

            <div className="rating-panel__chart-container">
              <canvas ref={canvasRef} className="rating-panel__chart" />
              <div className="rating-panel__chart-legend">
                <div className="rating-panel__legend-item">
                  <span className="rating-panel__legend-color" style={{ background: '#60a5fa' }} />
                  <span>完整度</span>
                </div>
                <div className="rating-panel__legend-item">
                  <span className="rating-panel__legend-color" style={{ background: '#f472b6' }} />
                  <span>创意性</span>
                </div>
                <div className="rating-panel__legend-item">
                  <span className="rating-panel__legend-color" style={{ background: '#34d399' }} />
                  <span>协作表现</span>
                </div>
              </div>
            </div>

            <div className="rating-panel__table-container">
              <table className="rating-panel__table">
                <thead>
                  <tr>
                    <th>小组</th>
                    <th>完整度</th>
                    <th>创意性</th>
                    <th>协作表现</th>
                    <th>总平均分</th>
                    <th>评语摘要</th>
                  </tr>
                </thead>
                <tbody>
                  {groupScores.map((score, index) => (
                    <tr key={score.groupId} className={index % 2 === 0 ? '' : 'alt'}>
                      <td className="rating-panel__table-group">{score.groupName}</td>
                      <td className="rating-panel__table-score">{score.avgCompleteness}</td>
                      <td className="rating-panel__table-score">{score.avgCreativity}</td>
                      <td className="rating-panel__table-score">{score.avgCollaboration}</td>
                      <td className="rating-panel__table-total">{score.avgTotal}</td>
                      <td className="rating-panel__table-comment">
                        {score.comments.length > 0 ? (
                          <div
                            className="rating-panel__comment-text"
                            onClick={() => toggleComment(score.groupId)}
                          >
                            {expandedComments.has(score.groupId)
                              ? score.comments.join('；')
                              : truncateComment(score.comments.join('；'))}
                            {score.comments.join('；').length > 50 && (
                              <span className="rating-panel__comment-toggle">
                                {expandedComments.has(score.groupId) ? '收起' : '展开'}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="rating-panel__no-comment">暂无评语</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rating-panel page-enter">
      <div className="rating-panel__empty">该任务暂未进入评分阶段</div>
    </div>
  );
}
