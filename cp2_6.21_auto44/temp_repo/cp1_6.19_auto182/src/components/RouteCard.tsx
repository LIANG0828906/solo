import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageSquare } from 'lucide-react';
import { RouteData, CommentData, generateId } from '../utils/scoreEngine';

interface RouteCardProps {
  route: RouteData;
  isSelected: boolean;
  isTopRanked: boolean;
  onLike: (id: string) => void;
  onSelect: (id: string) => void;
  onComment: (id: string, comment: CommentData) => void;
}

function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}天前`;
  return new Date(iso).toLocaleDateString();
}

const RouteCard: React.FC<RouteCardProps> = ({
  route,
  isSelected,
  isTopRanked,
  onLike,
  onSelect,
  onComment,
}) => {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [inputText, setInputText] = useState('');

  const avgScore =
    route.scores.length > 0
      ? route.scores.reduce((a, b) => a + b, 0) / route.scores.length
      : 0;
  const starCount = Math.round(avgScore / 20);
  const filledStars = Math.min(5, Math.max(0, starCount));
  const emptyStars = 5 - filledStars;

  const handleSubmit = () => {
    const text = inputText.trim();
    if (!text) return;
    const comment: CommentData = {
      id: generateId(),
      text,
      createdAt: new Date().toISOString(),
    };
    onComment(route.id, comment);
    setInputText('');
  };

  return (
    <div
      onClick={() => onSelect(route.id)}
      style={{
        width: 280,
        height: 160,
        borderRadius: 12,
        background: '#FFFFFF',
        border: isSelected ? '2px solid #2E7D32' : '2px solid #C8E6C9',
        boxSizing: 'border-box',
        padding: 12,
        cursor: 'pointer',
        boxShadow: isSelected
          ? '0 0 0 2px #2E7D32'
          : '0 1px 3px rgba(0,0,0,0.08)',
        transition:
          'box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          (e.currentTarget as HTMLDivElement).style.boxShadow =
            '0 4px 12px rgba(0,0,0,0.15)';
          (e.currentTarget as HTMLDivElement).style.transform =
            'translateY(-3px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          (e.currentTarget as HTMLDivElement).style.boxShadow =
            '0 1px 3px rgba(0,0,0,0.08)';
          (e.currentTarget as HTMLDivElement).style.transform =
            'translateY(0)';
        }
      }}
    >
      {isTopRanked && (
        <span style={{ fontSize: 20, color: '#FFD700', position: 'absolute', top: 8, left: 10 }}>
          👑
        </span>
      )}

      <div style={{ fontSize: 16, fontWeight: 700, color: '#333', marginBottom: 4, paddingTop: isTopRanked ? 4 : 0 }}>
        {route.name}
      </div>

      <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>
        {route.distance}km · 爬升{route.elevationGain}m
      </div>

      <div style={{ marginBottom: 4 }}>
        {'★'.repeat(filledStars).split('').map((_, i) => (
          <span key={`f${i}`} style={{ color: '#FFC107', fontSize: 14 }}>★</span>
        ))}
        {'☆'.repeat(emptyStars).split('').map((_, i) => (
          <span key={`e${i}`} style={{ color: '#FFC107', fontSize: 14 }}>☆</span>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <motion.div
            style={{ display: 'inline-flex', cursor: 'pointer' }}
            animate={route.liked ? { scale: [1, 1.1, 1] } : { scale: 1 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => {
              e.stopPropagation();
              onLike(route.id);
            }}
          >
            <Heart
              size={16}
              fill={route.liked ? '#E53935' : 'none'}
              color={route.liked ? '#E53935' : '#BDBDBD'}
            />
          </motion.div>
          <span style={{ fontSize: 12, color: '#999' }}>{route.likes}</span>
        </div>

        <div
          style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 12, color: '#757575' }}
          onClick={(e) => {
            e.stopPropagation();
            setCommentsOpen((prev) => !prev);
          }}
        >
          <MessageSquare size={14} />
          <span>{route.comments.length}</span>
        </div>
      </div>

      <AnimatePresence>
        {commentsOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{ overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ marginTop: 8 }}>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                style={{
                  width: 240,
                  height: 80,
                  background: '#F5F5F5',
                  borderRadius: 8,
                  border: 'none',
                  padding: 8,
                  fontSize: 13,
                  resize: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
              <div style={{ marginTop: 4, textAlign: 'right' }}>
                <button
                  onClick={handleSubmit}
                  style={{
                    background: '#66BB6A',
                    color: 'white',
                    borderRadius: 6,
                    padding: '4px 12px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                >
                  提交
                </button>
              </div>

              {route.comments.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  {route.comments.map((c, i) => (
                    <div key={c.id}>
                      <div style={{ fontSize: 13, color: '#333' }}>{c.text}</div>
                      <div style={{ fontSize: 11, color: '#9E9E9E' }}>
                        {formatRelativeTime(c.createdAt)}
                      </div>
                      {i < route.comments.length - 1 && (
                        <div style={{ borderBottom: '1px solid #F0F0F0', margin: '4px 0' }} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RouteCard;
