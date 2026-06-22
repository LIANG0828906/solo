import { useState, useMemo, useEffect, useRef } from 'react';
import { Post } from '../types';
import { analyzeSentiment, getSentimentLabelText } from '../utils/sentimentAnalyzer';
import PostCard from './PostCard';
import './PostList.css';

const PAGE_SIZE = 10;

interface PostListProps {
  posts: Post[];
  loading: boolean;
  onTagToggle: (postId: string, tag: string) => void;
  availableTags: string[];
}

function PostList({ posts, loading, onTagToggle, availableTags }: PostListProps) {
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [sentimentExpandedId, setSentimentExpandedId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const prevPostsRef = useRef(posts);

  useEffect(() => {
    const hasDataChanged = prevPostsRef.current !== posts;
    if (hasDataChanged) {
      setVisibleCount(PAGE_SIZE);
      setExpandedPostId(null);
      setSentimentExpandedId(null);
      prevPostsRef.current = posts;
    }
  }, [posts]);

  const postsWithSentiment = useMemo(() => {
    const visiblePosts = posts.slice(0, visibleCount);
    return visiblePosts.map(post => {
      const allText = post.content + ' ' + post.comments.map(c => c.content).join(' ');
      const sentiment = analyzeSentiment(allText);
      const commentSentiments = post.comments.map(comment => ({
        ...comment,
        sentimentResult: analyzeSentiment(comment.content)
      }));
      return {
        ...post,
        sentiment,
        commentSentiments
      };
    });
  }, [posts, visibleCount]);

  const toggleExpand = (postId: string) => {
    setExpandedPostId(prev => prev === postId ? null : postId);
  };

  const toggleSentimentExpand = (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSentimentExpandedId(prev => prev === postId ? null : postId);
  };

  const handleLoadMore = () => {
    setVisibleCount(prev => Math.min(prev + PAGE_SIZE, posts.length));
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 30) return `${days}天前`;
    
    return date.toLocaleDateString('zh-CN');
  };

  if (loading) {
    return (
      <div className="post-list-loading">
        <div className="loading-spinner"></div>
        <p>加载中...</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="post-list-empty">
        <p className="empty-icon">📭</p>
        <p className="empty-text">暂无符合条件的帖子</p>
      </div>
    );
  }

  const hasMore = visibleCount < posts.length;

  return (
    <div className="post-list-wrapper">
      <div className="post-list">
        {postsWithSentiment.map((post, index) => (
          <PostCard
            key={post.id}
            post={post}
            index={index}
            expanded={expandedPostId === post.id}
            sentimentExpanded={sentimentExpandedId === post.id}
            onToggleExpand={() => toggleExpand(post.id)}
            onToggleSentimentExpand={(e) => toggleSentimentExpand(post.id, e)}
            formatTime={formatTime}
            onTagToggle={onTagToggle}
            availableTags={availableTags}
          />
        ))}
      </div>
      
      {hasMore && (
        <div className="load-more-container">
          <button className="load-more-btn" onClick={handleLoadMore}>
            加载更多
            <span className="load-more-count">({posts.length - visibleCount} 条剩余)</span>
          </button>
        </div>
      )}

      {!hasMore && posts.length > PAGE_SIZE && (
        <div className="all-loaded">
          <span>已加载全部 {posts.length} 条帖子</span>
        </div>
      )}
    </div>
  );
}

export default PostList;
