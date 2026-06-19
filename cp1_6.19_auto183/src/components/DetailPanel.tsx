import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { VinylRecord, Feedback } from '../data/records';
import VirtualTurntable from './VirtualTurntable';

interface DetailPanelProps {
  record: VinylRecord;
  onClose: () => void;
  onMarkSold: (recordId: string) => void;
  onAddFeedback: (recordId: string, feedback: Omit<Feedback, 'id' | 'createdAt'>) => void;
}

function StarRating({
  rating,
  onRate,
  interactive = false,
}: {
  rating: number;
  onRate?: (r: number) => void;
  interactive?: boolean;
}) {
  const [hoverRating, setHoverRating] = useState(0);
  const displayRating = interactive ? hoverRating || rating : rating;

  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`star ${n <= displayRating ? 'active' : ''}`}
          onClick={() => interactive && onRate?.(n)}
          onMouseEnter={() => interactive && setHoverRating(n)}
          onMouseLeave={() => interactive && setHoverRating(0)}
          role={interactive ? 'button' : undefined}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function DetailPanel({
  record,
  onClose,
  onMarkSold,
  onAddFeedback,
}: DetailPanelProps) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');

  const isSoldOut = record.stock <= 0;
  const isLowStock = record.stock <= 1 && !isSoldOut;

  const handleSubmitFeedback = () => {
    if (feedbackRating === 0) return;
    onAddFeedback(record.id, {
      rating: feedbackRating,
      comment: feedbackComment.trim(),
    });
    setFeedbackRating(0);
    setFeedbackComment('');
    setShowFeedback(false);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        onClick={handleOverlayClick}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        <motion.div
          className="detail-panel"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="detail-panel-close"
            onClick={onClose}
            aria-label="关闭"
          >
            ×
          </button>

          <div className="detail-header">
            <div className="detail-title">{record.title}</div>
            <div className="detail-artist">{record.artist}</div>
          </div>

          <div className="detail-meta">
            <div className="meta-item">
              <span className="meta-label">发行年份</span>
              <span className="meta-value">{record.year}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">压制版本</span>
              <span className="meta-value">{record.version}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">当前库存</span>
              <span className={`meta-value ${isLowStock ? 'stock-low' : ''}`}>
                {isSoldOut ? '已售罄' : `${record.stock} 张`}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">价格</span>
              <span className="meta-value price">¥{record.price}</span>
            </div>
          </div>

          <div className="section-title">历史销售记录</div>
          {record.sales.length > 0 ? (
            <ul className="sales-list">
              {record.sales.map((sale) => (
                <li key={sale.id} className="sales-item">
                  <span className="sales-date">{sale.date}</span>
                  <span className="sales-customer">{sale.customerName}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">暂无销售记录</div>
          )}

          <VirtualTurntable />

          <div className="feedback-wrapper" style={{ textAlign: 'center' }}>
            <AnimatePresence>
              {showFeedback && (
                <motion.div
                  className="feedback-bubble"
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                >
                  <StarRating
                    rating={feedbackRating}
                    onRate={setFeedbackRating}
                    interactive
                  />
                  <textarea
                    className="feedback-input"
                    rows={3}
                    placeholder="写下你的听感..."
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                  />
                  <button
                    type="button"
                    className="feedback-submit"
                    onClick={handleSubmitFeedback}
                    disabled={feedbackRating === 0}
                  >
                    提交听感
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            <button
              type="button"
              className="feedback-toggle-btn"
              onClick={() => setShowFeedback((v) => !v)}
            >
              {showFeedback ? '收起' : '留下听感'}
            </button>
          </div>

          {record.feedbacks.length > 0 && (
            <>
              <div className="section-title">试听反馈</div>
              <div className="feedback-list">
                {record.feedbacks.map((fb) => (
                  <div key={fb.id} className="feedback-item">
                    <div className="feedback-stars">
                      {'★'.repeat(fb.rating)}
                      <span style={{ color: '#E0D5C7' }}>{'★'.repeat(5 - fb.rating)}</span>
                    </div>
                    {fb.comment && <div className="feedback-comment">{fb.comment}</div>}
                    <div className="feedback-date">{fb.createdAt}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="section-title">流转轨迹</div>
          <div className="timeline">
            {record.trajectory.map((node) => (
              <div key={node.id} className="timeline-item">
                <div className={`timeline-dot ${node.type}`} />
                <div className="timeline-date">{node.date}</div>
                <div className="timeline-summary">{node.summary}</div>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="sell-btn"
            onClick={() => onMarkSold(record.id)}
            disabled={isSoldOut}
          >
            {isSoldOut ? '已售罄' : '标记售出'}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
