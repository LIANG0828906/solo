import type { SocialPost } from '../types';
import { useState, useMemo } from 'react';
import { formatDate, formatTime } from '../utils/helpers';
import { getExerciseProgress, getFriendWorkoutsForWeek } from '../utils/mockData';
import UserAvatar from './UserAvatar';
import WeeklyCalendar from './WeeklyCalendar';
import WeightChart from './WeightChart';
import './styles/SocialFeed.css';

interface SocialFeedProps {
  posts: SocialPost[];
  onLike: (postId: string) => void;
  onComment: (postId: string, content: string) => void;
}

function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  return `${days}天前`;
}

function getPrimaryExerciseName(post: SocialPost): string {
  if (post.workout.exercises.length === 0) return '深蹲';
  let primary = post.workout.exercises[0];
  for (const ex of post.workout.exercises) {
    const maxWeight = Math.max(...ex.sets.map(s => s.weight));
    const primaryMaxWeight = Math.max(...primary.sets.map(s => s.weight));
    if (maxWeight > primaryMaxWeight) {
      primary = ex;
    }
  }
  return primary.exerciseName;
}

export default function SocialFeed({ posts, onLike, onComment }: SocialFeedProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [animKey, setAnimKey] = useState(0);

  const uniqueUsers = useMemo(() => {
    const userMap = new Map<string, { id: string; name: string }>();
    posts.forEach(post => {
      if (!userMap.has(post.userId)) {
        userMap.set(post.userId, { id: post.userId, name: post.userName });
      }
    });
    return Array.from(userMap.values());
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (!selectedUserId) return posts;
    return posts.filter(post => post.userId === selectedUserId);
  }, [posts, selectedUserId]);

  const handleUserSelect = (userId: string | null) => {
    setSelectedUserId(userId);
    setAnimKey(prev => prev + 1);
  };

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  };

  const handleCommentInputChange = (postId: string, value: string) => {
    setCommentInputs(prev => ({ ...prev, [postId]: value }));
  };

  const handleSubmitComment = (postId: string) => {
    const content = commentInputs[postId]?.trim();
    if (content) {
      onComment(postId, content);
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    }
  };

  return (
    <div className="social-feed">
      <div className="social-feed-filter">
        <button
          className={`social-feed-filter-btn ${!selectedUserId ? 'active' : ''}`}
          onClick={() => handleUserSelect(null)}
        >
          全部
        </button>
        {uniqueUsers.map(user => (
          <button
            key={user.id}
            className={`social-feed-filter-btn ${selectedUserId === user.id ? 'active' : ''}`}
            onClick={() => handleUserSelect(user.id)}
          >
            <UserAvatar name={user.name} size="sm" />
            <span>{user.name}</span>
          </button>
        ))}
      </div>

      <div className="social-feed-grid">
        {filteredPosts.map(post => {
          const isCommentsExpanded = expandedComments.has(post.id);
          const primaryExercise = getPrimaryExerciseName(post);
          const chartData = getExerciseProgress(primaryExercise, 30);
          const weekWorkouts = getFriendWorkoutsForWeek(post.userId);

          return (
            <div key={post.id} className="social-feed-card">
              <div className="social-feed-card-header">
                <UserAvatar name={post.userName} size="md" />
                <div className="social-feed-card-user">
                  <div className="social-feed-card-username">{post.userName}</div>
                  <div className="social-feed-card-time">{getRelativeTime(post.date)}</div>
                </div>
              </div>

              <div className="social-feed-card-workout">
                <div className="social-feed-card-workout-name">{post.workout.planName}</div>
                <div className="social-feed-card-workout-meta">
                  {formatDate(post.date)} · {formatTime(post.date)}
                </div>
              </div>

              <div key={`calendar-${post.id}-${animKey}`} className="fade-in">
                <WeeklyCalendar workouts={weekWorkouts} />
              </div>

              <div key={`chart-${post.id}-${animKey}`} className="fade-in">
                <WeightChart data={chartData} exerciseName={primaryExercise} />
              </div>

              <div className="social-feed-card-actions">
                <button
                  className={`social-feed-action-btn ${post.liked ? 'liked' : ''}`}
                  onClick={() => onLike(post.id)}
                >
                  <svg
                    className="social-feed-action-icon"
                    viewBox="0 0 24 24"
                    fill={post.liked ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  <span>{post.likes}</span>
                </button>
                <button
                  className={`social-feed-action-btn ${isCommentsExpanded ? 'active' : ''}`}
                  onClick={() => toggleComments(post.id)}
                >
                  <svg
                    className="social-feed-action-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <span>{post.comments.length}</span>
                </button>
              </div>

              {isCommentsExpanded && (
                <div className="social-feed-comments fade-in">
                  {post.comments.length > 0 ? (
                    <div className="social-feed-comments-list">
                      {post.comments.map(comment => (
                        <div key={comment.id} className="social-feed-comment">
                          <UserAvatar name={comment.userName} size="sm" />
                          <div className="social-feed-comment-content">
                            <div className="social-feed-comment-header">
                              <span className="social-feed-comment-name">{comment.userName}</span>
                              <span className="social-feed-comment-time">
                                {getRelativeTime(comment.date)}
                              </span>
                            </div>
                            <div className="social-feed-comment-text">{comment.content}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="social-feed-comments-empty">暂无评论</div>
                  )}
                  <div className="social-feed-comment-input">
                    <input
                      type="text"
                      placeholder="写下你的评论..."
                      value={commentInputs[post.id] || ''}
                      onChange={e => handleCommentInputChange(post.id, e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          handleSubmitComment(post.id);
                        }
                      }}
                    />
                    <button
                      className="social-feed-comment-submit"
                      onClick={() => handleSubmitComment(post.id)}
                      disabled={!commentInputs[post.id]?.trim()}
                    >
                      发送
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
