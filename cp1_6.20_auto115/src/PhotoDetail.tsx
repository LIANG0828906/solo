import React, { useState, useEffect } from 'react';
import type { Photo, ViewRecord, Comment, License } from './types';
import {
  getPhoto,
  getPhotoViews,
  getPhotoComments,
  addComment,
  applyLicense,
  getPhotoLicenses,
} from './api';

interface PhotoDetailProps {
  photoId: string;
  onBack: () => void;
}

const REGIONS = ['全球', '中国', '美国', '日本', '韩国', '欧洲', '东南亚'];

const LICENSE_TYPES = [
  { type: 'personal' as const, name: '个人使用', price: 99, desc: '个人社交媒体、壁纸等非商业用途' },
  { type: 'commercial' as const, name: '商业使用', price: 499, desc: '企业宣传、广告、网站等商业用途' },
  { type: 'full' as const, name: '全版权', price: 2999, desc: '完整版权转让，可二次授权' },
];

const PhotoDetail: React.FC<PhotoDetailProps> = ({ photoId, onBack }) => {
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [views, setViews] = useState<ViewRecord[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [createdLicense, setCreatedLicense] = useState<License | null>(null);
  const [selectedLicenseType, setSelectedLicenseType] = useState<'personal' | 'commercial' | 'full'>('personal');
  const [selectedRegions, setSelectedRegions] = useState<string[]>(['全球']);
  const [duration, setDuration] = useState(1);
  const [durationUnit, setDurationUnit] = useState<'day' | 'month' | 'year'>('year');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [commentName, setCommentName] = useState('');
  const [commentEmail, setCommentEmail] = useState('');
  const [commentContent, setCommentContent] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [applyingLicense, setApplyingLicense] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [photoData, viewsData, commentsData, licensesData] = await Promise.all([
          getPhoto(photoId),
          getPhotoViews(photoId),
          getPhotoComments(photoId),
          getPhotoLicenses(photoId),
        ]);
        setPhoto(photoData);
        setViews(viewsData);
        setComments(commentsData);
        setLicenses(licensesData);
      } catch (error) {
        console.error('加载照片详情失败:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [photoId]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toggleRegion = (region: string) => {
    if (region === '全球') {
      setSelectedRegions(['全球']);
      return;
    }
    setSelectedRegions((prev) => {
      const filtered = prev.filter((r) => r !== '全球');
      if (prev.includes(region)) {
        return filtered.filter((r) => r !== region);
      }
      return [...filtered, region];
    });
  };

  const handleApplyLicense = async () => {
    if (!customerName || !customerEmail) {
      alert('请填写姓名和邮箱');
      return;
    }
    setApplyingLicense(true);
    try {
      const selectedLicense = LICENSE_TYPES.find((l) => l.type === selectedLicenseType);
      const license = await applyLicense({
        photoId,
        type: selectedLicenseType,
        regions: selectedRegions,
        duration,
        durationUnit,
        price: selectedLicense?.price || 0,
        customerName,
        customerEmail,
      });
      setCreatedLicense(license);
      setShowPaymentSuccess(true);
      setLicenses((prev) => [...prev, license]);
    } catch (error) {
      console.error('申请授权失败:', error);
      alert('申请失败，请重试');
    } finally {
      setApplyingLicense(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentName || !commentEmail || !commentContent) {
      alert('请填写完整的留言信息');
      return;
    }
    setSubmittingComment(true);
    try {
      const newComment = await addComment({
        photoId,
        name: commentName,
        email: commentEmail,
        content: commentContent,
      });
      setComments((prev) => [newComment, ...prev]);
      setCommentName('');
      setCommentEmail('');
      setCommentContent('');
      alert('留言提交成功，摄影师会尽快回复您');
    } catch (error) {
      console.error('提交留言失败:', error);
      alert('提交失败，请重试');
    } finally {
      setSubmittingComment(false);
    }
  };

  const hasActiveLicense = licenses.some(
    (l) => l.status === 'approved' && l.expiresAt && new Date(l.expiresAt) > new Date()
  );

  if (loading) {
    return (
      <div className="photo-detail-container">
        <div className="loading">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (!photo) {
    return (
      <div className="photo-detail-container">
        <div className="empty-state">
          <div className="empty-state-icon">❌</div>
          <div className="empty-state-text">照片不存在</div>
        </div>
      </div>
    );
  }

  return (
    <div className="photo-detail-container">
      <div className="back-link" onClick={onBack}>
        ← 返回相册
      </div>

      <div className="photo-detail-image">
        <img
          src={hasActiveLicense ? photo.originalUrl : photo.watermarkedUrl}
          alt={photo.filename}
        />
      </div>

      <div className="photo-detail-header">
        <div>
          <h1 className="photo-detail-title">{photo.filename}</h1>
          <div className="photo-detail-meta">
            <span>上传于 {formatDate(photo.uploadDate)}</span>
            <span>浏览 {photo.viewCount || 0} 次</span>
            <span>下载 {photo.downloadCount || 0} 次</span>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowLicenseModal(true)}>
          申请授权
        </button>
      </div>

      <div className="section">
        <h3 className="section-title">浏览记录</h3>
        {views.length === 0 ? (
          <div className="empty-state" style={{ padding: '30px 0' }}>
            <div className="empty-state-text">暂无浏览记录</div>
          </div>
        ) : (
          <div className="view-history">
            {views.slice(0, 10).map((view) => (
              <div key={view.id} className="view-item">
                <span className="view-item-ip">{view.ip}</span>
                <span className="view-item-time">{formatDate(view.timestamp)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="section">
        <h3 className="section-title">留言板 ({comments.length})</h3>
        <div className="comment-list">
          {comments.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <div className="empty-state-text">暂无留言，来说点什么吧</div>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="comment-item">
                <div className="comment-header">
                  <span className="comment-author">{comment.name}</span>
                  <span className="comment-time">{formatDate(comment.createdAt)}</span>
                </div>
                <div className="comment-content">{comment.content}</div>
                {comment.reply && (
                  <div className="comment-reply">
                    <div className="comment-reply-label">摄影师回复：</div>
                    <div>{comment.reply}</div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <form className="comment-form" onSubmit={handleSubmitComment}>
          <h3 className="section-title" style={{ marginBottom: 0 }}>发表留言</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">姓名</label>
              <input
                type="text"
                className="form-input"
                value={commentName}
                onChange={(e) => setCommentName(e.target.value)}
                placeholder="您的姓名"
              />
            </div>
            <div className="form-group">
              <label className="form-label">邮箱</label>
              <input
                type="email"
                className="form-input"
                value={commentEmail}
                onChange={(e) => setCommentEmail(e.target.value)}
                placeholder="您的邮箱"
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">留言内容</label>
            <textarea
              className="form-textarea"
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder="写下您的想法或问题..."
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submittingComment}>
            {submittingComment ? '提交中...' : '提交留言'}
          </button>
        </form>
      </div>

      {showLicenseModal && (
        <div className="modal" onClick={() => !showPaymentSuccess && setShowLicenseModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {showPaymentSuccess ? '支付成功' : '申请授权'}
              </h2>
              <button
                className="modal-close"
                onClick={() => {
                  setShowLicenseModal(false);
                  setShowPaymentSuccess(false);
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {showPaymentSuccess && createdLicense ? (
                <div className="payment-success">
                  <div className="payment-icon">✓</div>
                  <h3 style={{ marginBottom: 8 }}>支付成功</h3>
                  <p style={{ color: '#888', marginBottom: 16 }}>
                    您的授权申请已提交，等待摄影师审核
                  </p>
                  <p style={{ fontSize: 13, color: '#666' }}>支付凭证编号：</p>
                  <div className="payment-id">{createdLicense.paymentId}</div>
                  <p style={{ fontSize: 12, color: '#999', marginTop: 16 }}>
                    审核通过后您将收到邮件通知，并可下载授权证书
                  </p>
                </div>
              ) : (
                <>
                  <div className="license-options">
                    {LICENSE_TYPES.map((license) => (
                      <div
                        key={license.type}
                        className={`license-option ${selectedLicenseType === license.type ? 'selected' : ''}`}
                        onClick={() => setSelectedLicenseType(license.type)}
                      >
                        <div className="license-option-name">{license.name}</div>
                        <div className="license-option-price">¥{license.price}</div>
                        <div className="license-option-desc">{license.desc}</div>
                      </div>
                    ))}
                  </div>

                  <div className="form-group" style={{ marginBottom: 16 }}>
                    <label className="form-label">授权地区</label>
                    <div className="region-select">
                      {REGIONS.map((region) => (
                        <span
                          key={region}
                          className={`region-tag ${selectedRegions.includes(region) ? 'selected' : ''}`}
                          onClick={() => toggleRegion(region)}
                        >
                          {region}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="form-row" style={{ marginBottom: 16 }}>
                    <div className="form-group">
                      <label className="form-label">有效期</label>
                      <input
                        type="number"
                        className="form-input"
                        value={duration}
                        onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
                        min="1"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">单位</label>
                      <select
                        className="form-select"
                        value={durationUnit}
                        onChange={(e) => setDurationUnit(e.target.value as 'day' | 'month' | 'year')}
                      >
                        <option value="day">天</option>
                        <option value="month">月</option>
                        <option value="year">年</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label className="form-label">您的姓名</label>
                    <input
                      type="text"
                      className="form-input"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="请输入姓名"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">您的邮箱</label>
                    <input
                      type="email"
                      className="form-input"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="请输入邮箱，用于接收授权通知"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              {!showPaymentSuccess && (
                <>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowLicenseModal(false)}
                  >
                    取消
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleApplyLicense}
                    disabled={applyingLicense}
                  >
                    {applyingLicense ? '处理中...' : '确认支付'}
                  </button>
                </>
              )}
              {showPaymentSuccess && (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setShowLicenseModal(false);
                    setShowPaymentSuccess(false);
                  }}
                >
                  完成
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoDetail;
