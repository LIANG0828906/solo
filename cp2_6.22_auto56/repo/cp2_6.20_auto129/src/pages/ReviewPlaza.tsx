import React, { useEffect, useRef, useCallback } from 'react';
import { Card, Avatar, Button, Spin, Empty, Tag } from 'antd';
import {
  HeartOutlined,
  HeartFilled,
  MessageOutlined,
  ThunderboltOutlined,
  EditOutlined
} from '@ant-design/icons';
import { useReviewStore } from '../stores/reviewStore';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import './ReviewPlaza.css';

const ReviewPlaza: React.FC = () => {
  const { reviews, isLoading, total, fetchReviews, likeReview, loadMore } = useReviewStore();
  const navigate = useNavigate();
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchReviews(1, 12);
  }, [fetchReviews]);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && !isLoading && reviews.length < total) {
        loadMore();
      }
    },
    [isLoading, reviews.length, total, loadMore]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: '200px'
    });
    if (observerRef.current) {
      observer.observe(observerRef.current);
    }
    return () => observer.disconnect();
  }, [handleIntersect]);

  const handleLike = (e: React.MouseEvent, reviewId: string) => {
    e.stopPropagation();
    likeReview(reviewId);
  };

  const handleStartDebate = (e: React.MouseEvent, reviewId: string) => {
    e.stopPropagation();
    console.log('发起辩论:', reviewId);
  };

  return (
    <div className="review-plaza">
      <div className="plaza-header">
        <h1 className="plaza-title">书评广场</h1>
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => navigate('/review/new')}
          className="write-review-btn"
        >
          写书评
        </Button>
      </div>

      {isLoading && reviews.length === 0 ? (
        <div className="loading-container">
          <Spin size="large" />
        </div>
      ) : reviews.length === 0 ? (
        <Empty description="暂无书评" />
      ) : (
        <div className="masonry-grid">
          {reviews.map((review) => (
            <div key={review.id} className="masonry-item">
              <Card
                hoverable
                className="review-card"
                styles={{ body: { padding: '20px' } }}
              >
                <div className="review-card-header">
                  <Avatar src={review.user?.avatar} size={40}>
                    {review.user?.nickname?.charAt(0)}
                  </Avatar>
                  <div className="review-user-info">
                    <div className="review-username">{review.user?.nickname}</div>
                    <div className="review-time">
                      {dayjs(review.createdAt).format('YYYY-MM-DD HH:mm')}
                    </div>
                  </div>
                </div>

                {review.book && (
                  <div className="review-book-info">
                    <img
                      src={review.book.cover}
                      alt={review.book.title}
                      className="review-book-cover"
                    />
                    <div className="review-book-meta">
                      <div className="review-book-title">{review.book.title}</div>
                      <div className="review-book-author">{review.book.author}</div>
                    </div>
                  </div>
                )}

                <div className="review-content">{review.content}</div>

                <div className="review-tags">
                  {review.tags.map((tag, index) => (
                    <Tag key={index} className="review-tag">
                      {tag}
                    </Tag>
                  ))}
                </div>

                <div className="review-actions">
                  <button
                    className={`action-btn like-btn ${review.isLiked ? 'liked' : ''}`}
                    onClick={(e) => handleLike(e, review.id)}
                  >
                    {review.isLiked ? (
                      <HeartFilled className="heart-icon" />
                    ) : (
                      <HeartOutlined className="heart-icon" />
                    )}
                    <span>{review.likes}</span>
                  </button>
                  <button
                    className="action-btn comment-btn"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MessageOutlined />
                    <span>{review.comments}</span>
                  </button>
                  <button
                    className="action-btn debate-btn"
                    onClick={(e) => handleStartDebate(e, review.id)}
                  >
                    <ThunderboltOutlined />
                    <span>辩论</span>
                  </button>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      <div ref={observerRef} className="load-more-trigger">
        {isLoading && reviews.length > 0 && (
          <div className="loading-more">
            <Spin size="small" />
            <span>加载中...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewPlaza;
