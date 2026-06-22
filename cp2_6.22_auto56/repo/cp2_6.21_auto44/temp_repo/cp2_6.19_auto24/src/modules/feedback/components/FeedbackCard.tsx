import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import type { Feedback } from '../../../types';
import { useFeedbackStore } from '../store/feedbackStore';
import { formatDate, getRoleLabel } from '../../analytics/utils/wordCloud';
import { renderStars } from '../../../shared/utils/StarRating';

interface FeedbackCardProps {
  feedback: Feedback;
  index: number;
  isLastUnprocessed: boolean;
}

const FeedbackCard: React.FC<FeedbackCardProps> = ({ feedback, index }) => {
  const { processFeedback } = useFeedbackStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [summaryHeight, setSummaryHeight] = useState(60);

  useLayoutEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [feedback.keyTakeaways, feedback.improvements, feedback.reply, showReplyBox, replyText]);

  useEffect(() => {
    if (feedback.isProcessed && !hasEntered) {
      const timer = setTimeout(() => {
        setHasEntered(true);
      }, 50);
      return () => clearTimeout(timer);
    }
    if (!feedback.isProcessed) {
      setHasEntered(true);
    }
  }, [feedback.isProcessed, hasEntered]);

  const handleProcess = () => {
    if (!replyText.trim()) return;
    setIsProcessing(true);
    setIsLeaving(true);
    setTimeout(() => {
      processFeedback(feedback.id, replyText.trim());
      setIsProcessing(false);
      setShowReplyBox(false);
      setIsExpanded(false);
      setIsLeaving(false);
    }, 300);
  };

  const summary = feedback.keyTakeaways.slice(0, 20) + (feedback.keyTakeaways.length > 20 ? '...' : '');

  const maxHeight = isExpanded ? contentHeight + summaryHeight : summaryHeight;

  return (
    <div
      style={{
        ...styles.card,
        minHeight: '150px',
        ...(feedback.isProcessed ? styles.cardProcessed : {}),
        ...(isLeaving ? styles.cardLeaving : {}),
        ...(feedback.isProcessed && hasEntered ? styles.cardEntered : {}),
        ...(!feedback.isProcessed && hasEntered ? styles.cardEnteredNormal : {}),
        animationDelay: `${index * 30}ms`,
      }}
      className="feedback-card"
    >
      {feedback.isProcessed && (
        <div style={styles.processedBadge}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span style={{ marginLeft: '4px' }}>已处理</span>
        </div>
      )}

      <div style={styles.cardHeader}>
        <div style={styles.headerLeft}>
          <div style={styles.avatar}>
            {feedback.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={styles.nameRow}>
              <span style={styles.name}>{feedback.name}</span>
              <span style={styles.roleTag}>{getRoleLabel(feedback.role)}</span>
            </div>
            <span style={styles.date}>{formatDate(feedback.createdAt)}</span>
          </div>
        </div>
        <div style={styles.rating}>{renderStars(feedback.rating, 16)}</div>
      </div>

      <div style={styles.summaryRow}>
        <span style={styles.summaryLabel}>关键收获：</span>
        <span style={styles.summaryText}>{summary}</span>
      </div>

      <div
        style={{
          ...styles.expandableContent,
          maxHeight: isExpanded ? `${contentHeight}px` : '0px',
          opacity: isExpanded ? 1 : 0,
          transition: 'max-height 300ms cubic-bezier(0.4, 0, 0.2, 1), opacity 250ms cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          willChange: 'max-height, opacity',
          transform: 'translateZ(0)',
        }}
      >
        <div ref={contentRef} style={styles.contentInner}>
          <div style={styles.contentSection}>
            <h4 style={styles.contentLabel}>🎯 关键收获</h4>
            <p style={styles.contentText}>{feedback.keyTakeaways}</p>
          </div>
          <div style={styles.contentSection}>
            <h4 style={styles.contentLabel}>💡 待改进建议</h4>
            <p style={styles.contentText}>{feedback.improvements}</p>
          </div>
          {feedback.reply && (
            <div style={styles.replySection}>
              <div style={styles.replyHeader}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span style={styles.replyTitle}>改进措施</span>
                {feedback.repliedAt && (
                  <span style={styles.replyDate}>{formatDate(feedback.repliedAt)}</span>
                )}
              </div>
              <p style={styles.replyText}>{feedback.reply}</p>
            </div>
          )}

          {showReplyBox && !feedback.isProcessed && (
            <div style={styles.replyBox}>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="请输入改进措施..."
                rows={3}
                style={styles.replyInput}
                onFocus={(e) => (e.target.style.transform = 'scale(1.01)')}
                onBlur={(e) => (e.target.style.transform = 'scale(1)')}
              />
              <div style={styles.replyActions}>
                <button
                  onClick={() => {
                    setShowReplyBox(false);
                    setReplyText('');
                  }}
                  style={styles.cancelBtn}
                >
                  取消
                </button>
                <button
                  onClick={handleProcess}
                  disabled={!replyText.trim() || isProcessing}
                  style={{
                    ...styles.confirmBtn,
                    ...(!replyText.trim() || isProcessing ? styles.btnDisabled : {}),
                  }}
                  onMouseDown={(e) => {
                    if (replyText.trim() && !isProcessing) {
                      e.currentTarget.style.transform = 'scale(0.97)';
                    }
                  }}
                  onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  {isProcessing ? '提交中...' : '确认处理 ✓'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={styles.cardFooter}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={styles.toggleBtn}
        >
          {isExpanded ? '收起 ↑' : '展开 ↓'}
        </button>
        {!feedback.isProcessed && !showReplyBox && (
          <button
            onClick={() => setShowReplyBox(true)}
            style={styles.replyBtn}
          >
            标记已处理
          </button>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: '#ffffff',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '16px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    position: 'relative',
    border: '2px solid transparent',
    opacity: 0,
    cursor: 'pointer',
    boxSizing: 'border-box',
    willChange: 'transform, opacity',
    backfaceVisibility: 'hidden',
    transform: 'translateZ(0)',
  },
  cardEnteredNormal: {
    opacity: 1,
    transform: 'translateY(0)',
    transition: 'opacity 400ms ease-out, transform 400ms ease-out, box-shadow 300ms ease, border-color 300ms ease, background 300ms ease',
  },
  cardProcessed: {
    borderColor: '#10b981',
    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.03), rgba(16, 185, 129, 0.06))',
  },
  cardLeaving: {
    opacity: 0,
    transform: 'translateY(-30px) scale(0.98)',
    transition: 'opacity 300ms ease-in, transform 300ms ease-in',
  },
  cardEntered: {
    opacity: 1,
    transform: 'translateY(0)',
    animation: 'slideUp 400ms ease-out',
  },
  processedBadge: {
    position: 'absolute',
    top: '-1px',
    right: '20px',
    background: '#10b981',
    color: '#ffffff',
    padding: '4px 12px',
    fontSize: '12px',
    fontWeight: 600,
    borderRadius: '0 0 8px 8px',
    display: 'flex',
    alignItems: 'center',
    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
    zIndex: 2,
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #2563eb, #1e40af)',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    fontSize: '16px',
    flexShrink: 0,
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '2px',
  },
  name: {
    fontWeight: 600,
    fontSize: '15px',
    color: '#1e293b',
  },
  roleTag: {
    fontSize: '11px',
    padding: '2px 8px',
    background: 'rgba(37, 99, 235, 0.1)',
    color: '#2563eb',
    borderRadius: '4px',
    fontWeight: 500,
  },
  date: {
    fontSize: '12px',
    color: '#94a3b8',
  },
  rating: {
    flexShrink: 0,
  },
  summaryRow: {
    fontSize: '14px',
    color: '#475569',
    lineHeight: 1.6,
    marginBottom: '12px',
    padding: '10px 14px',
    background: '#f8fafc',
    borderRadius: '8px',
    borderLeft: '3px solid #e2e8f0',
  },
  summaryLabel: {
    color: '#64748b',
    fontSize: '13px',
    fontWeight: 500,
    marginRight: '4px',
  },
  summaryText: {
    color: '#475569',
  },
  expandableContent: {
    willChange: 'max-height, opacity',
  },
  contentInner: {
    padding: '16px',
    marginTop: '4px',
    background: '#f8fafc',
    borderRadius: '10px',
    boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.04)',
    border: '1px solid #e2e8f0',
  },
  contentSection: {
    marginBottom: '16px',
  },
  contentLabel: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#334155',
    marginBottom: '8px',
  },
  contentText: {
    fontSize: '14px',
    color: '#475569',
    lineHeight: 1.7,
    margin: 0,
    background: '#ffffff',
    padding: '12px 14px',
    borderRadius: '8px',
    borderLeft: '3px solid #2563eb',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
  },
  replySection: {
    background: 'rgba(16, 185, 129, 0.08)',
    padding: '12px 16px',
    borderRadius: '8px',
    marginTop: '12px',
  },
  replyHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '8px',
  },
  replyTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#10b981',
  },
  replyDate: {
    fontSize: '11px',
    color: '#64748b',
    marginLeft: 'auto',
  },
  replyText: {
    fontSize: '14px',
    color: '#374151',
    lineHeight: 1.6,
    margin: 0,
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #f1f5f9',
  },
  toggleBtn: {
    fontSize: '13px',
    color: '#64748b',
    fontWeight: 500,
    padding: '6px 12px',
    borderRadius: '6px',
    transition: 'all 0.2s ease',
  },
  replyBtn: {
    fontSize: '13px',
    color: '#ffffff',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    padding: '8px 16px',
    borderRadius: '6px',
    fontWeight: 500,
    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
    transition: 'all 0.2s ease',
  },
  replyBox: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #e2e8f0',
  },
  replyInput: {
    width: '100%',
    padding: '12px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical',
    marginBottom: '12px',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
    background: '#ffffff',
  },
  replyActions: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    padding: '8px 20px',
    fontSize: '14px',
    color: '#64748b',
    background: '#e2e8f0',
    borderRadius: '8px',
    fontWeight: 500,
    transition: 'all 0.2s ease',
  },
  confirmBtn: {
    padding: '8px 24px',
    fontSize: '14px',
    color: '#ffffff',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    borderRadius: '8px',
    fontWeight: 600,
    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
    transition: 'all 0.2s ease',
  },
  btnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
};

const cardStyles = `
  .feedback-card {
    animation: fadeInCard 0.4s ease-out forwards;
    animation-fill-mode: both;
  }
  
  @keyframes fadeInCard {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .feedback-card:hover {
    transform: translateY(-2px) scale(1.01);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
  }
  
  button[style*="toggleBtn"]:hover {
    background: #e2e8f0;
    color: #334155;
  }
  
  button[style*="replyBtn"]:hover {
    transform: scale(1.05);
  }
  
  button[style*="cancelBtn"]:hover {
    background: #cbd5e1;
  }
  
  button[style*="confirmBtn"]:hover:not(:disabled) {
    transform: scale(1.02);
  }
  
  @media (prefers-reduced-motion: reduce) {
    .feedback-card,
    div[style*="expandableContent"],
    div[style*="max-height"] {
      transition: none !important;
      animation: none !important;
    }
  }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = cardStyles;
document.head.appendChild(styleSheet);

export default React.memo(FeedbackCard);
