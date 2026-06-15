import React, { useState, useRef, useEffect, useCallback } from 'react';

const TAG_COLORS: Record<string, string> = {
  '功能': '#2D7D9A',
  '设计': '#D81B60',
  '营销': '#FFA630',
  '流程': '#1A936F',
  '其他': '#FF6B35',
};
const TAG_OPTIONS = ['功能', '设计', '营销', '流程', '其他'];
const COLOR_PALETTE = ['#FF6B35', '#004E89', '#1A936F', '#FFA630', '#D81B60'];

interface Idea {
  id: string;
  room_code: string;
  title: string;
  description: string;
  author: string;
  tags: string;
  created_at: string;
  vote_count: number;
  comment_count: number;
}

interface Comment {
  id: string;
  idea_id: string;
  author: string;
  content: string;
  created_at: string;
}

function relativeTime(dateStr: string): string {
  const now = new Date().getTime();
  const then = new Date(dateStr + 'Z').getTime();
  const diff = Math.max(0, Math.floor((now - then) / 1000));
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  return `${Math.floor(diff / 86400)}天前`;
}

function renderMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

function IdeaCard({
  idea, nickname, onVote, onComment, votedIdeas,
}: {
  idea: Idea;
  nickname: string;
  onVote: (id: string) => void;
  onComment: (id: string, content: string) => void;
  votedIdeas: Set<string>;
}) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [expandDesc, setExpandDesc] = useState(false);
  const [voteAnim, setVoteAnim] = useState(false);
  const [flashRed, setFlashRed] = useState(false);
  const [slideIn, setSlideIn] = useState(false);
  const commentListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => setSlideIn(true));
  }, []);

  const tags: string[] = JSON.parse(idea.tags || '[]');
  const truncated = idea.description.length > 80;
  const displayDesc = expandDesc ? idea.description : idea.description.slice(0, 80);

  const handleVote = async () => {
    if (votedIdeas.has(idea.id)) {
      setFlashRed(true);
      setTimeout(() => setFlashRed(false), 300);
      return;
    }
    try {
      await onVote(idea.id);
      setVoteAnim(true);
      setTimeout(() => setVoteAnim(false), 500);
    } catch {
      setFlashRed(true);
      setTimeout(() => setFlashRed(false), 300);
    }
  };

  const handleToggleComments = async () => {
    if (!showComments) {
      const { getComments } = await import('../utils/api');
      const cmts = await getComments(idea.id);
      setComments(cmts);
    }
    setShowComments(!showComments);
  };

  const handleAddComment = () => {
    if (commentInput.trim()) {
      onComment(idea.id, commentInput.trim());
      setCommentInput('');
    }
  };

  return (
    <div style={{
      width: 260, borderRadius: 12, background: '#f8f9fa',
      boxShadow: '#ddd 0 2px 8px', padding: 16,
      transition: 'transform 0.2s, box-shadow 0.2s, opacity 0.4s, translate 0.4s',
      transform: slideIn ? 'translateY(0)' : 'translateY(-30px)',
      opacity: slideIn ? 1 : 0,
      cursor: 'default',
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '#bbb 0 4px 16px';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '#ddd 0 2px 8px';
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
        {tags.map((tag) => (
          <span key={tag} style={{
            background: TAG_COLORS[tag] || '#999', color: '#fff',
            fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 500,
          }}>{tag}</span>
        ))}
      </div>
      <h3 style={{ fontSize: 15, fontWeight: 600, color: '#333', marginBottom: 6, lineHeight: 1.4 }}>
        {idea.title}
      </h3>
      <div style={{ fontSize: 13, color: '#666', lineHeight: 1.5, marginBottom: 8 }}>
        {renderMarkdown(displayDesc)}
        {truncated && !expandDesc && (
          <span
            style={{ color: '#2D7D9A', cursor: 'pointer', marginLeft: 4 }}
            onClick={() => setExpandDesc(true)}
          >...展开</span>
        )}
        {expandDesc && truncated && (
          <span
            style={{ color: '#2D7D9A', cursor: 'pointer', marginLeft: 4 }}
            onClick={() => setExpandDesc(false)}
          >收起</span>
        )}
      </div>
      <div style={{ fontSize: 12, color: '#999', marginBottom: 10 }}>
        @{idea.author}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={handleVote}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: flashRed ? '#ff4444' : (votedIdeas.has(idea.id) ? '#2D7D9A' : '#fff'),
            color: flashRed ? '#fff' : (votedIdeas.has(idea.id) ? '#fff' : '#2D7D9A'),
            border: '1px solid #2D7D9A', borderRadius: 20,
            padding: '4px 12px', fontSize: 13, cursor: 'pointer',
            transition: 'background 0.2s, transform 0.5s',
            transform: voteAnim ? 'scale(1.3)' : 'scale(1)',
          }}
        >
          ❤️ <span style={{
            display: 'inline-block',
            transition: 'transform 0.5s',
            transform: voteAnim ? 'scale(1.3)' : 'scale(1)',
          }}>{idea.vote_count}</span>
        </button>
        <button
          onClick={handleToggleComments}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: showComments ? '#F4A261' : '#fff',
            color: showComments ? '#fff' : '#F4A261',
            border: '1px solid #F4A261', borderRadius: 20,
            padding: '4px 12px', fontSize: 13, cursor: 'pointer',
            transition: 'background 0.2s',
          }}
        >
          💬 {idea.comment_count}
        </button>
      </div>
      <div
        ref={commentListRef}
        style={{
          maxHeight: showComments ? 300 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.3s ease',
        }}
      >
        {showComments && (
          <div style={{ marginTop: 10, borderTop: '1px solid #eee', paddingTop: 8 }}>
            {comments.map((c) => (
              <div key={c.id} style={{ marginBottom: 8, fontSize: 12 }}>
                <span style={{ color: '#2D7D9A', fontWeight: 600 }}>@{c.author}</span>
                <span style={{ color: '#bbb', marginLeft: 6 }}>{relativeTime(c.created_at)}</span>
                <div style={{ color: '#555', marginTop: 2 }}>{c.content}</div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <input
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="写评论..."
                style={{
                  flex: 1, padding: '6px 10px', borderRadius: 6,
                  border: '1px solid #ddd', fontSize: 12, outline: 'none',
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
              />
              <button
                onClick={handleAddComment}
                style={{
                  background: '#F4A261', color: '#fff', border: 'none',
                  borderRadius: 6, padding: '6px 12px', fontSize: 12,
                  cursor: 'pointer',
                }}
              >发送</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default IdeaCard;
