import { useState } from 'react';
import { Post } from '../types';
import { SentimentResult } from '../types';
import { getSentimentLabelText } from '../utils/sentimentAnalyzer';
import './PostCard.css';

interface PostWithSentiment extends Post {
  sentiment: SentimentResult;
  commentSentiments: Array<{
    id: string;
    username: string;
    content: string;
    timestamp: string;
    likes: number;
    sentimentResult: SentimentResult;
  }>;
  tags?: string[];
}

interface PostCardProps {
  post: PostWithSentiment;
  index: number;
  expanded: boolean;
  sentimentExpanded: boolean;
  onToggleExpand: () => void;
  onToggleSentimentExpand: (e: React.MouseEvent) => void;
  formatTime: (timestamp: string) => string;
  onTagToggle: (postId: string, tag: string) => void;
  availableTags: string[];
}

function PostCard({
  post,
  index,
  expanded,
  sentimentExpanded,
  onToggleExpand,
  onToggleSentimentExpand,
  formatTime,
  onTagToggle,
  availableTags
}: PostCardProps) {
  const [showTagMenu, setShowTagMenu] = useState(false);

  const getSentimentBadgeClass = (label: string) => {
    switch (label) {
      case 'positive':
        return 'sentiment-badge positive';
      case 'negative':
        return 'sentiment-badge negative';
      default:
        return 'sentiment-badge neutral';
    }
  };

  return (
    <div
      className="post-card"
      style={{
        animationDelay: `${index * 0.05}s`,
        animation: 'fadeInUp 0.5s ease forwards',
        opacity: 0
      }}
    >
      <div className="post-header">
        <div className="post-author">
          <div className="avatar">
            {post.username.charAt(0)}
          </div>
          <div className="author-info">
            <span className="username">{post.username}</span>
            <span className="post-time">{formatTime(post.timestamp)}</span>
          </div>
        </div>
        <div className="post-actions">
          <button
            className={getSentimentBadgeClass(post.sentiment.label)}
            onClick={onToggleSentimentExpand}
          >
            <span className="sentiment-label">
              {getSentimentLabelText(post.sentiment.label)}
            </span>
            <span className="sentiment-score">
              {post.sentiment.score > 0 ? '+' : ''}{(post.sentiment.score * 100).toFixed(0)}
            </span>
          </button>
          <button
            className="tag-btn"
            onClick={(e) => {
              e.stopPropagation();
              setShowTagMenu(!showTagMenu);
            }}
          >
            🏷️
          </button>
          {showTagMenu && (
            <div className="tag-menu" onClick={(e) => e.stopPropagation()}>
              <p className="tag-menu-title">添加标签</p>
              <div className="tag-menu-options">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    className={`tag-option ${post.tags?.includes(tag) ? 'active' : ''}`}
                    onClick={() => onTagToggle(post.id, tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {sentimentExpanded && (
        <div className="sentiment-detail" onClick={(e) => e.stopPropagation()}>
          <div className="sentiment-detail-row">
            <span className="detail-label">正面词数</span>
            <span className="detail-value positive">{post.sentiment.positiveCount} 个</span>
          </div>
          <div className="sentiment-detail-row">
            <span className="detail-label">负面词数</span>
            <span className="detail-value negative">{post.sentiment.negativeCount} 个</span>
          </div>
          {post.sentiment.positiveWords.length > 0 && (
            <div className="sentiment-words">
              <span className="words-label">正面词汇:</span>
              <div className="words-list">
                {post.sentiment.positiveWords.slice(0, 5).map((word, i) => (
                  <span key={i} className="word-tag positive-word">{word}</span>
                ))}
              </div>
            </div>
          )}
          {post.sentiment.negativeWords.length > 0 && (
            <div className="sentiment-words">
              <span className="words-label">负面词汇:</span>
              <div className="words-list">
                {post.sentiment.negativeWords.slice(0, 5).map((word, i) => (
                  <span key={i} className="word-tag negative-word">{word}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="post-content" onClick={onToggleExpand}>
        <p>{post.content}</p>
      </div>

      {post.tags && post.tags.length > 0 && (
        <div className="post-tags">
          {post.tags.map(tag => (
            <span key={tag} className="post-tag">{tag}</span>
          ))}
        </div>
      )}

      <div className="post-stats" onClick={onToggleExpand}>
        <span className="stat-item">
          ❤️ {post.likes}
        </span>
        <span className="stat-item">
          💬 {post.comments.length}
        </span>
        <span className="expand-toggle">
          {expanded ? '收起评论 ▲' : '展开评论 ▼'}
        </span>
      </div>

      {expanded && (
        <div className="comments-section">
          <h4 className="comments-title">评论 ({post.comments.length})</h4>
          <div className="comments-list">
            {post.commentSentiments.map(comment => (
              <div key={comment.id} className="comment-item">
                <div className="comment-header">
                  <div className="comment-author">
                    <div className="comment-avatar">
                      {comment.username.charAt(0)}
                    </div>
                    <span className="comment-username">{comment.username}</span>
                  </div>
                  <span className={`comment-sentiment ${comment.sentimentResult.label}`}>
                    {getSentimentLabelText(comment.sentimentResult.label)}
                  </span>
                </div>
                <p className="comment-content">{comment.content}</p>
                <div className="comment-footer">
                  <span className="comment-time">{formatTime(comment.timestamp)}</span>
                  <span className="comment-likes">❤️ {comment.likes}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default PostCard;
