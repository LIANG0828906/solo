import { useState, useCallback, memo } from 'react';
import type { Note } from '@/types';
import { tagOptions } from '@/utils/mockApi';
import { useNotesStore } from '@/store/useNotesStore';

interface NoteCardProps {
  note: Note;
  index: number;
}

const formatTime = (timestamp: number): string => {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return new Date(timestamp).toLocaleDateString('zh-CN');
};

const getTagColor = (tagName: string): string => {
  const tag = tagOptions.find(t => t.name === tagName);
  return tag?.color || '#6C63FF';
};

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? '#FF6B6B' : 'none'} stroke={filled ? '#FF6B6B' : 'currentColor'} strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const CommentIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const NoteCardComponent = ({ note, index }: NoteCardProps) => {
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [isLiking, setIsLiking] = useState(false);
  const [liked, setLiked] = useState(false);
  const likeNote = useNotesStore(state => state.likeNote);
  const addComment = useNotesStore(state => state.addComment);

  const handleLike = useCallback(async () => {
    if (isLiking || liked) return;
    setIsLiking(true);
    setLiked(true);
    await likeNote(note.id);
    setIsLiking(false);
  }, [isLiking, liked, likeNote, note.id]);

  const handleSubmitComment = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    await addComment(note.id, commentInput.trim());
    setCommentInput('');
  }, [commentInput, addComment, note.id]);

  const animationDelay = `${Math.min(index * 50, 500)}ms`;
  const isLeft = index % 2 === 0;

  return (
    <div
      style={{
        width: '360px',
        background: 'var(--card-bg)',
        borderRadius: '16px',
        border: '1px solid var(--card-border)',
        padding: '20px',
        transition: 'transform 300ms ease, box-shadow 300ms ease',
        animation: 'fadeInUp 500ms ease-out forwards',
        animationDelay,
        opacity: 0,
        justifySelf: isLeft ? 'end' : 'start',
        marginRight: isLeft ? '40px' : '40px',
        marginLeft: isLeft ? '0' : '0',
        cursor: 'pointer',
        position: 'relative',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 0 20px var(--glow-color)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent), #9B95FF)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          {note.userName.charAt(0)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {note.userName}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {formatTime(note.createdAt)}
          </div>
        </div>
      </div>

      <p
        style={{
          fontSize: '14px',
          lineHeight: 1.7,
          color: 'var(--text-primary)',
          marginBottom: '14px',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {note.content}
      </p>

      {note.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
          {note.tags.map(tag => (
            <span
              key={tag}
              style={{
                padding: '4px 12px',
                borderRadius: '14px',
                height: '28px',
                lineHeight: '20px',
                fontSize: '12px',
                color: '#fff',
                background: getTagColor(tag),
                fontWeight: 500,
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', paddingTop: '12px', borderTop: '1px solid var(--card-border)' }}>
        <button
          onClick={handleLike}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            color: liked ? '#FF6B6B' : 'var(--text-secondary)',
            fontSize: '13px',
            padding: '4px 8px',
            borderRadius: '8px',
            transition: 'color 300ms ease',
          }}
        >
          <span style={{ animation: liked ? 'heartBeat 200ms ease' : 'none', display: 'inline-flex' }}>
            <HeartIcon filled={liked} />
          </span>
          {note.likes}
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            color: showComments ? 'var(--accent)' : 'var(--text-secondary)',
            fontSize: '13px',
            padding: '4px 8px',
            borderRadius: '8px',
            transition: 'color 300ms ease',
          }}
        >
          <CommentIcon />
          {note.comments.length}
        </button>
      </div>

      {showComments && (
        <div style={{ marginTop: '14px' }}>
          {note.comments.length > 0 && (
            <div style={{ marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {note.comments.map(comment => (
                <div key={comment.id} style={{ padding: '10px', background: 'var(--input-bg)', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {comment.userName}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {formatTime(comment.createdAt)}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {comment.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmitComment} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={commentInput}
              onChange={e => setCommentInput(e.target.value)}
              placeholder="写评论..."
              style={{
                flex: 1,
                width: '80%',
                height: '40px',
                padding: '0 14px',
                borderRadius: '10px',
                background: 'var(--input-bg)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                border: '1px solid transparent',
                borderTop: '1px solid var(--card-border)',
                transition: 'border-color 300ms ease',
              }}
              onFocus={e => {
                e.currentTarget.style.borderTopColor = 'var(--accent)';
              }}
              onBlur={e => {
                e.currentTarget.style.borderTopColor = 'var(--card-border)';
              }}
            />
            <button
              type="submit"
              style={{
                padding: '0 16px',
                height: '40px',
                borderRadius: '10px',
                background: 'var(--accent)',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 500,
                transition: 'opacity 300ms ease',
              }}
            >
              发送
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export const NoteCard = memo(NoteCardComponent);
