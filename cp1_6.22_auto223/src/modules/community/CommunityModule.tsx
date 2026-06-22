import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import type { CreateCommentRequest } from '@/types';
import { useComments } from '@/hooks/useComments';
import { useActivities } from '@/hooks/useActivities';
import { CommentItem } from '@/components/CommentItem';
import { CommentForm } from '@/components/CommentForm';
import type { ToastContextType } from '@/hooks/useToast';

interface CommunityModuleProps {
  toast: ToastContextType;
}

export const CommunityModule: React.FC<CommunityModuleProps> = ({ toast }) => {
  const navigate = useNavigate();
  const { activityId } = useParams<{ activityId: string }>();

  const { comments, loading, error, fetchComments, createComment, toggleLike } = useComments();
  const { fetchActivity } = useActivities();

  const [activityName, setActivityName] = useState('');
  const [activityStatus, setActivityStatus] = useState<'upcoming' | 'ongoing' | 'ended'>('ended');
  const [currentUser, setCurrentUser] = useState<string>(localStorage.getItem('readingClub_userName') || '');
  const [replyTo, setReplyTo] = useState<{ commentId: string; authorName: string } | null>(null);

  useEffect(() => {
    if (activityId) {
      loadActivityAndComments(activityId);
    }
  }, [activityId, fetchComments, fetchActivity]);

  const loadActivityAndComments = async (id: string) => {
    const activity = await fetchActivity(id);
    if (activity) {
      setActivityName(activity.name);
      setActivityStatus(activity.status);
      if (activity.status === 'ended') {
        fetchComments(id);
      }
    }
  };

  const handleSubmitComment = async (data: Omit<CreateCommentRequest, 'authorName'>) => {
    if (!activityId) return;

    const requestData: CreateCommentRequest = {
      authorName: currentUser,
      content: replyTo
        ? `@${replyTo.authorName} ${data.content}`
        : data.content,
      parentId: replyTo?.commentId,
    };

    const result = await createComment(activityId, requestData);
    if (result) {
      toast.showSuccess('评论发表成功');
      setReplyTo(null);
    } else if (error) {
      toast.showError(error);
    }
  };

  const handleLike = async (commentId: string) => {
    if (!currentUser) {
      toast.showWarning('请先在下方填写您的姓名');
      return;
    }
    await toggleLike(commentId, currentUser);
  };

  const handleReply = (commentId: string, authorName: string) => {
    setReplyTo({ commentId, authorName });
  };

  const topLevelComments = comments.filter(c => !c.parentId);
  const getReplies = (parentId: string) => comments.filter(c => c.parentId === parentId);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div>
      <button
        className="btn btn-ghost"
        onClick={() => navigate(`/activity/${activityId}`)}
        style={{ marginBottom: 16 }}
      >
        ← 返回活动详情
      </button>

      <div className="page-header" style={{ paddingTop: 0 }}>
        <h1 className="page-title">
          <MessageSquare size={28} style={{ display: 'inline', marginRight: 12 }} />
          讨论区
        </h1>
        <p className="page-subtitle">{activityName}</p>
      </div>

      {activityStatus !== 'ended' ? (
        <div className="empty-state">
          <div className="empty-state-icon">⏳</div>
          <h3 className="empty-state-title">讨论区暂未开放</h3>
          <p className="empty-state-text">
            活动结束后将自动开放讨论区，届时可发表书评与交流感悟
          </p>
        </div>
      ) : (
          <>
            <div style={{ marginBottom: 24 }}>
              {replyTo && (
                <div
                  style={{
                    padding: '12px 16px',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    borderRadius: 8,
                    marginBottom: 16,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: 14 }}>
                    正在回复 <strong>@{replyTo.authorName}</strong>
                  </span>
                  <button
                    className="btn btn-ghost"
                    style={{ padding: '4px 12px', fontSize: 12 }}
                    onClick={() => setReplyTo(null)}
                  >
                    取消
                  </button>
                </div>
              )}
              <CommentForm
                onSubmit={handleSubmitComment}
                authorName={currentUser}
                onAuthorNameChange={name => {
                  setCurrentUser(name);
                  localStorage.setItem('readingClub_userName', name);
                }}
                loading={loading}
                placeholder={replyTo ? `回复 @${replyTo.authorName}...` : '写下你的书评和感悟...'}
              />
            </div>

            {error && (
              <div
                style={{
                  padding: 12,
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: '#DC2626',
                  borderRadius: 8,
                  marginBottom: 24,
                }}
              >
                {error}
              </div>
            )}

            {comments.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">💬</div>
                <h3 className="empty-state-title">还没有评论</h3>
                <p className="empty-state-text">成为第一个分享阅读感悟的人吧！</p>
              </div>
            ) : (
              <div className="comment-list">
                {topLevelComments.map(comment => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    currentUser={currentUser}
                    onLike={handleLike}
                    onReply={handleReply}
                    replies={getReplies(comment.id)}
                  />
                ))}
              </div>
            )}
          </>
      )}
    </div>
  );
};
