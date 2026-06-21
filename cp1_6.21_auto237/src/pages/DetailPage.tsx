import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import MatchPanel from '../components/MatchPanel';
import { Item, Comment } from '../types';
import { showToast } from '../utils/toast';
import { formatDate } from '../utils/date';

const DetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentUsername, setCommentUsername] = useState('');
  const [commentContent, setCommentContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const response = await axios.get(`/api/items/${id}`);
        setItem(response.data);
      } catch {
        showToast('获取物品详情失败', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  const handleSubmitComment = async () => {
    if (!id || !commentUsername.trim() || !commentContent.trim()) {
      showToast('请填写用户名和留言内容', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const response = await axios.post(`/api/items/${id}/comments`, {
        username: commentUsername.trim(),
        content: commentContent.trim()
      });
      setItem(response.data);
      setCommentUsername('');
      setCommentContent('');
      showToast('留言成功', 'success');
    } catch {
      showToast('留言失败，请重试', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getAvatarLetter = (username: string): string => {
    return username.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="loading-spinner"></div>
          加载中...
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container">
        <div className="empty-state">
          <div className="empty-state-icon">❓</div>
          <div className="empty-state-text">物品不存在或已被删除</div>
          <button className="back-btn" onClick={() => navigate('/')} style={{ marginTop: '16px' }}>
            ← 返回首页
          </button>
        </div>
      </div>
    );
  }

  const sortedComments = [...item.comments].sort(
    (a: Comment, b: Comment) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="container detail-page">
      <button className="back-btn" onClick={() => navigate('/')}>
        ← 返回列表
      </button>

      <div className="detail-layout">
        <div>
          <div className="detail-header">
            <h1 className="detail-title">{item.name}</h1>
            <span className="item-category-tag">{item.category}</span>
            <span className={`item-type-tag ${item.type}`}>
              {item.type === 'lost' ? '寻物启事' : '失物招领'}
            </span>
          </div>

          <h2 className="detail-section-title">📋 物品详情</h2>

          <div className="detail-info-item">
            <div className="detail-info-label">物品类别</div>
            <div className="detail-info-value">{item.category}</div>
          </div>

          <div className="detail-info-item">
            <div className="detail-info-label">丢失/捡到地点</div>
            <div className="detail-info-value">📍 {item.location}</div>
          </div>

          <div className="detail-info-item">
            <div className="detail-info-label">发布时间</div>
            <div className="detail-info-value">{formatDate(item.createdAt)}</div>
          </div>

          <div className="detail-info-item">
            <div className="detail-info-label">发布人</div>
            <div className="detail-info-value">{item.username || '匿名用户'}</div>
          </div>

          <div className="detail-info-item">
            <div className="detail-info-label">联系方式</div>
            <div className="detail-info-value" style={{ color: '#3B82F6' }}>📞 {item.contact}</div>
          </div>

          <div className="detail-info-item">
            <div className="detail-info-label">详细描述</div>
            <div className="detail-info-value description">{item.description}</div>
          </div>
        </div>

        <div>
          <h2 className="detail-section-title">🔍 智能匹配</h2>
          <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px' }}>
            系统根据物品类别和地点为您自动匹配可能相关的物品
          </p>
          {id && <MatchPanel itemId={id} />}
        </div>
      </div>

      <div className="comments-section">
        <h2 className="detail-section-title">💬 留言区</h2>
        
        <div className="comment-form">
          <div className="comment-form-inputs">
            <input
              type="text"
              className="comment-username-input"
              placeholder="您的称呼"
              value={commentUsername}
              onChange={(e) => setCommentUsername(e.target.value)}
            />
          </div>
          <textarea
            className="comment-textarea"
            placeholder="写下您的留言，帮助失主找回物品..."
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
          />
          <button
            className="comment-submit-btn"
            onClick={handleSubmitComment}
            disabled={submitting}
          >
            {submitting ? '发送中...' : '发送留言'}
          </button>
        </div>

        <div className="comment-list">
          {sortedComments.length === 0 ? (
            <div className="no-comments">
              暂无留言，快来发表第一条评论吧！
            </div>
          ) : (
            sortedComments.map((comment: Comment) => (
              <div key={comment.id} className="comment-item">
                <div className="comment-avatar">
                  {getAvatarLetter(comment.username)}
                </div>
                <div className="comment-content-wrapper">
                  <div className="comment-header">
                    <span className="comment-username">{comment.username}</span>
                    <span className="comment-time">{formatDate(comment.createdAt)}</span>
                  </div>
                  <div className="comment-text">{comment.content}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailPage;
