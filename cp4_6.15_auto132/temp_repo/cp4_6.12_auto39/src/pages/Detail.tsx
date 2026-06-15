import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { itemsApi, claimsApi, Item, User, Claim } from '../api';
import Modal from '../components/Modal';
import './Detail.css';

interface DetailProps {
  user: User | null;
}

const Detail = ({ user }: DetailProps) => {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimReason, setClaimReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    if (id) {
      itemsApi
        .getItem(id)
        .then((data) => {
          setItem(data.item);
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handlePrevImage = () => {
    if (!item?.images?.length) {
      setCurrentImage((prev) =>
        prev === 0 ? item.images.length - 1 : prev - 1
      );
    }
  };

  const handleNextImage = () => {
    if (!item?.images?.length) return;
    setCurrentImage((prev) =>
      prev === item.images.length - 1 ? 0 : prev + 1
    );
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNextImage();
      } else {
        handlePrevImage();
      }
    }
  };

  const handleClaimSubmit = async () => {
    if (!user || !item || !claimReason.trim()) return;

    setSubmitting(true);
    try {
      await itemsApi.claimItem(item.id, claimReason);
      setShowClaimModal(false);
      setClaimed(true);
      setClaimReason('');
      const updated = await itemsApi.getItem(item.id);
      setItem(updated.item);
    } catch (err: any) {
      alert(err.error || '申领失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveClaim = async (claimId: string) => {
    claimsApi.approveClaim(claimId).then((data) => {
      setItem(data.item);
    });
  };

  const handleRejectClaim = async (claimId: string) => {
    claimsApi.rejectClaim(claimId).then(async () => {
      if (id) {
        const updated = await itemsApi.getItem(id);
        setItem(updated.item);
      }
    });
  };

  const handleConfirmTransfer = async () => {
    if (!item) return;
    if (confirm('确认物品已交付？确认后将完成赠送流程。')) {
      itemsApi.confirmTransfer(item.id).then((data) => {
        setItem(data.item);
      });
    }
  };

  const createRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    ripple.style.left = `${x - 30}px`;
    ripple.style.top = `${y - 30}px`;
    ripple.style.width = '60px';
    ripple.style.height = '60px';

    button.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 400);
  };

  const getStatusText = () => {
    switch (item?.status) {
      case 'available':
        return '可申领';
      case 'claimed':
        return '已被申领';
      case 'given':
        return '已赠送';
      default:
        return '';
    }
  };

  const getBadgeClass = (points: number) => {
    if (points >= 200) return 'badge gold-badge';
    if (points >= 100) return 'badge silver-badge';
    return 'badge bronze-badge';
  };

  const isPublisher = user?.id === item?.publisherId;

  if (loading) {
    return (
      <div className="detail-page">
        <div className="skeleton detail-image-skeleton"></div>
        <div className="detail-content">
          <div className="skeleton text-skeleton long"></div>
          <div className="skeleton text-skeleton short"></div>
        </div>
      </div>
    );
  }

  if (!item) {
    return <div className="detail-page"><p>物品不存在</p></div>;
  }

  return (
    <div className="detail-page">
      <div
      className="detail-images"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {item.images.length > 0 ? (
        <>
          <img src={item.images[currentImage]} alt={item.title} />
          {item.images.length > 1 && (
            <>
              <button
                className="img-nav prev"
                onClick={handlePrevImage}
              >
                ‹
              </button>
              <button
                className="img-nav next"
                onClick={handleNextImage}
              >
                ›
              </button>
              <div className="img-dots">
                {item.images.map((_, i) => (
                  <span
                    key={i}
                    className={`dot ${i === currentImage ? 'active' : ''}`}
                    onClick={() => setCurrentImage(i)}
                  />
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <div className="image-placeholder">
          <span>📦</span>
        </div>
      )}
    </div>

    <div className="detail-content">
      <div className="detail-header">
        <h1 className="detail-title">{item.title}</h1>
        <span className={`status-tag status-${item.status}`}>
          {getStatusText()}
        </span>
      </div>

      <div className="detail-meta">
        <span className="meta-tag">{item.category}</span>
        <span className="meta-tag">{item.condition}</span>
        <span className="meta-distance">📍 {item.distance}m</span>
      </div>

      <div className="detail-section">
        <h3>物品描述</h3>
        <p className="detail-description">{item.description}</p>
      </div>

      <div className="detail-section">
        <h3>取物地址</h3>
        <p className="detail-address">
          {item.community} {item.building}
        </p>
      </div>

      <div className="detail-section">
        <h3>发布者</h3>
        <div className="publisher-info">
          <div className="publisher-avatar">
          {item.publisherAvatar ? (
            <img src={item.publisherAvatar} alt={item.publisherNickname} />
          ) : (
            <span>{item.publisherNickname?.[0] || 'U'}</span>
          )}
        </div>
        <div className="publisher-details">
          <span className="publisher-name">{item.publisherNickname}</span>
          <span className={getBadgeClass(0)}>
            {item.publisherNickname && item.publisherNickname[0]}
          </span>
        </div>
      </div>

      {isPublisher && item.claims.length > 0 && (
        <div className="detail-section">
          <h3>申领列表（{item.claims.length}人）</h3>
          <div className="claims-list">
            {item.claims.map((claim: Claim) => (
            <div key={claim.id} className="claim-item">
              <div className="claim-header">
                <div className="claim-user">
                  <div className="claim-avatar">
                    <span>{claim.claimantNickname?.[0] || 'U'}</span>
                  </div>
                  <div className="claim-user-info">
                    <span className="claim-name">{claim.claimantNickname}</span>
                    <span className="claim-time">
                      {new Date(claim.createdAt).toLocaleString('zh-CN')}
                    </span>
                  </div>
                </div>
                <span className={`claim-status status-${claim.status}`}>
                  {claim.status === 'pending'
                    ? '待审核'
                    : claim.status === 'approved'
                    ? '已同意'
                    : '已拒绝'}
                </span>
              </div>
              <p className="claim-reason">{claim.reason}</p>
              {claim.status === 'pending' && item.status === 'available' && (
                <div className="claim-actions">
                  <button
                    className="btn-approve ripple"
                    onClick={() => handleApproveClaim(claim.id)}
                    onClickCapture={createRipple}
                  >
                    同意赠送
                  </button>
                  <button
                    className="btn-reject"
                    onClick={() => handleRejectClaim(claim.id)}
                  >
                    婉拒
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {isPublisher && item.status === 'claimed' && (
        <div className="detail-section">
          <h3>交接确认</h3>
          <button className="confirm-transfer-btn ripple" onClick={handleConfirmTransfer} onClickCapture={createRipple}>
            确认已交付
          </button>
        </div>
      )}

      {!isPublisher && user && item.status === 'available' && !claimed && (
        <button
          className="claim-btn ripple"
          onClick={() => setShowClaimModal(true)}
          onClickCapture={createRipple}
        >
          我要申领
        </button>
      )}

      {claimed && (
        <div className="claimed-notice">
          ✓ 您已提交申领，请等待发布者审核
        </div>
      )}

      {!user && item.status === 'available' && (
        <div className="login-notice">
          登录后可申领物品
        </div>
      )}
    </div>

    <Modal
      isOpen={showClaimModal}
      onClose={() => setShowClaimModal(false)}
      title="填写申领理由"
    >
      <div className="claim-form">
        <textarea
          value={claimReason}
          onChange={(e) => setClaimReason(e.target.value)}
          placeholder="请说明您为什么需要这个物品（最多200字）"
          rows={5}
          maxLength={200}
        />
        <span className="char-count">{claimReason.length}/200</span>
        <div className="claim-modal-actions">
          <button
            className="btn-cancel"
            onClick={() => setShowClaimModal(false)}
          >
            取消
          </button>
          <button
            className="btn-submit ripple"
            onClick={handleClaimSubmit}
            disabled={submitting || !claimReason.trim()}
            onClickCapture={createRipple}
          >
            {submitting ? '提交中...' : '提交申领'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default Detail;
