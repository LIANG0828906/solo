import { useState, useEffect, useRef } from 'react';
import { getComments, postComment, PostCommentData } from '../utils/api';
import { formatDate, randomAvatarColor } from '../utils/helpers';
import { useStore } from '../store/useStore';
import type { Comment } from '../types';

interface CommentSectionProps {
  recipeId: string;
}

interface LocalComment extends Comment {
  isNew?: boolean;
}

export default function CommentSection({ recipeId }: CommentSectionProps) {
  const [comments, setComments] = useState<LocalComment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [username, setUsername] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { showToast } = useStore();

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const data = await getComments(recipeId);
        setComments(data);
      } catch (error) {
        console.error('Failed to fetch comments:', error);
      }
    };
    fetchComments();
  }, [recipeId]);

  const handleSubmit = async () => {
    if (!username.trim()) {
      showToast('请输入用户名', 'warning');
      return;
    }
    if (!newCommentText.trim()) {
      showToast('请输入评论内容', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const commentData: PostCommentData = {
        author: username.trim(),
        content: newCommentText.trim(),
        rating: 5,
      };
      const newComment = await postComment(recipeId, commentData);
      const commentWithFlag: LocalComment = {
        ...newComment,
        isNew: true,
        avatarColor: newComment.avatarColor || randomAvatarColor(),
      };
      setComments((prev) => [commentWithFlag, ...prev]);
      setNewCommentText('');
      setUsername('');
      showToast('评论发布成功！', 'success');

      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } catch (error) {
      console.error('Failed to post comment:', error);
      showToast('发布失败，请重试', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getInitial = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  return (
    <div style={{
      background: 'var(--card-bg)',
      borderRadius: 20,
      padding: 28,
      boxShadow: 'var(--shadow)',
    }}>
      <div ref={scrollRef} />
      <h2 style={{
        fontSize: 22,
        fontWeight: 600,
        marginBottom: 24,
        color: 'var(--text)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        💬 评论 ({comments.length})
      </h2>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        marginBottom: 28,
        padding: 20,
        background: '#fafafa',
        borderRadius: 16,
      }}>
        <input
          type="text"
          placeholder="你的昵称"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{
            padding: '12px 16px',
            borderRadius: 12,
            border: '2px solid #f0f0f0',
            fontSize: 14,
            outline: 'none',
            transition: 'border-color 0.2s',
            background: 'white',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
          onBlur={(e) => (e.target.style.borderColor = '#f0f0f0')}
        />
        <textarea
          placeholder="分享你对这道菜的看法..."
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          rows={4}
          style={{
            padding: '12px 16px',
            borderRadius: 12,
            border: '2px solid #f0f0f0',
            fontSize: 14,
            outline: 'none',
            resize: 'vertical',
            minHeight: 100,
            transition: 'border-color 0.2s',
            background: 'white',
            fontFamily: 'inherit',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
          onBlur={(e) => (e.target.style.borderColor = '#f0f0f0')}
        />
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            alignSelf: 'flex-end',
            padding: '12px 28px',
            borderRadius: 12,
            background: submitting ? '#ccc' : 'linear-gradient(135deg, var(--primary), var(--secondary))',
            color: 'white',
            fontSize: 15,
            fontWeight: 600,
            cursor: submitting ? 'not-allowed' : 'pointer',
            transition: 'transform 0.2s, opacity 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!submitting) e.currentTarget.style.transform = 'scale(1.03)';
          }}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          {submitting ? '发布中...' : '发布评论'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {comments.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: 'var(--text-light)',
          }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>📝</div>
            <p>还没有评论，快来抢沙发吧！</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className={comment.isNew ? 'slide-up' : ''}
              style={{
                display: 'flex',
                gap: 14,
                marginBottom: 16,
                animation: comment.isNew ? 'slide-up 0.4s ease' : undefined,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: comment.avatarColor || randomAvatarColor(),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: 16,
                  flexShrink: 0,
                }}
              >
                {getInitial(comment.author)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 6,
                  flexWrap: 'wrap',
                }}>
                  <span style={{
                    fontWeight: 600,
                    fontSize: 15,
                    color: 'var(--text)',
                  }}>
                    {comment.author}
                  </span>
                  <span style={{
                    fontSize: 12,
                    color: '#999',
                  }}>
                    {formatDate(comment.createdAt)}
                  </span>
                </div>
                <p style={{
                  fontSize: 14,
                  color: 'var(--text)',
                  lineHeight: 1.7,
                  wordBreak: 'break-word',
                }}>
                  {comment.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
