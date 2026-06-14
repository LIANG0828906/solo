import React, { useState, useRef, useEffect } from 'react';
import { usePlant } from '../context/PlantContext';
import { SwapRequest } from '../data/mockData';

type TabType = 'myplants' | 'sent' | 'received';

interface SwipeableItemProps {
  request: SwapRequest;
  plantName: string;
  plantImage: string;
  fromUserName: string;
  toUserName: string;
  isReceived: boolean;
  onAccept?: () => void;
  onReject?: () => void;
  animating: boolean;
  animationType: 'accept' | 'reject' | null;
}

const SwipeableItem: React.FC<SwipeableItemProps> = ({
  request,
  plantName,
  plantImage,
  fromUserName,
  toUserName,
  isReceived,
  onAccept,
  onReject,
  animating,
  animationType
}) => {
  const [translateX, setTranslateX] = useState(0);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSwiping, setIsSwiping] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);
  const ACTION_WIDTH = 160;
  const openedRef = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isReceived || request.status !== 'pending' || animating) return;
    const touch = e.touches[0];
    setStartX(touch.clientX);
    setStartY(touch.clientY);
    setIsDragging(true);
    setIsSwiping(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;
    
    if (!isSwiping && Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      setIsSwiping(true);
    }
    
    if (isSwiping) {
      e.preventDefault();
      const newTranslate = Math.max(-ACTION_WIDTH, Math.min(0, deltaX + (openedRef.current ? -ACTION_WIDTH : 0)));
      setTranslateX(newTranslate);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    if (isSwiping) {
      if (translateX < -ACTION_WIDTH / 2) {
        setTranslateX(-ACTION_WIDTH);
        openedRef.current = true;
      } else {
        setTranslateX(0);
        openedRef.current = false;
      }
    }
    setIsSwiping(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isReceived || request.status !== 'pending' || animating) return;
    setStartX(e.clientX);
    setStartY(e.clientY);
    setIsDragging(true);
    setIsSwiping(false);
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    
    if (!isSwiping && Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      setIsSwiping(true);
    }
    
    if (isSwiping) {
      e.preventDefault();
      const newTranslate = Math.max(-ACTION_WIDTH, Math.min(0, deltaX + (openedRef.current ? -ACTION_WIDTH : 0)));
      setTranslateX(newTranslate);
    }
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    if (isSwiping) {
      if (translateX < -ACTION_WIDTH / 2) {
        setTranslateX(-ACTION_WIDTH);
        openedRef.current = true;
      } else {
        setTranslateX(0);
        openedRef.current = false;
      }
    }
    setIsSwiping(false);
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      handleMouseUp();
    }
  };

  const handleAccept = () => {
    setTranslateX(0);
    openedRef.current = false;
    setTimeout(() => onAccept?.(), 100);
  };

  const handleReject = () => {
    setTranslateX(0);
    openedRef.current = false;
    setTimeout(() => onReject?.(), 100);
  };

  const getStatusText = () => {
    switch (request.status) {
      case 'pending': return '待确认';
      case 'accepted': return '已接受';
      case 'rejected': return '已拒绝';
    }
  };

  return (
    <div className="swap-item-wrapper" ref={itemRef}>
      {isReceived && request.status === 'pending' && (
        <div className="swap-actions">
          <button
            className="swap-action-btn accept"
            onClick={handleAccept}
          >
            <span>✓</span>
            接受
          </button>
          <button
            className="swap-action-btn reject"
            onClick={handleReject}
          >
            <span>✕</span>
            拒绝
          </button>
        </div>
      )}
      <div
        className={`swap-item ${animating ? (animationType === 'accept' ? 'flip-accept' : 'flip-reject') : ''}`}
        style={{ 
          transform: isDragging ? `translateX(${translateX}px)` : `translateX(${translateX}px)`,
          transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: isReceived && request.status === 'pending' && !animating ? (isDragging ? 'grabbing' : 'grab') : 'default'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <img src={plantImage} alt={plantName} className="swap-item-img" loading="lazy" />
        <div className="swap-item-info">
          <div className="swap-item-title">{plantName}</div>
          <div className="swap-item-desc">
            {isReceived ? `来自 ${fromUserName}：${request.reason}` : `发给 ${toUserName}：${request.expectation}`}
          </div>
          <span className={`swap-item-status status-${request.status}`}>
            {getStatusText()}
          </span>
        </div>
        {isReceived && request.status === 'pending' && !animating && (
          <div style={{ 
            alignSelf: 'center', 
            marginLeft: 'auto', 
            opacity: openedRef.current ? 0 : 0.5,
            transition: 'opacity 0.2s',
            fontSize: '0.75rem',
            color: 'var(--text-light)'
          }}>
            ← 左滑
          </div>
        )}
      </div>
    </div>
  );
};

const SkeletonSwapItem: React.FC = () => (
  <div style={{
    display: 'flex',
    gap: '14px',
    padding: '16px',
    background: 'var(--white)',
    borderRadius: '14px',
    marginBottom: '12px'
  }}>
    <div style={{
      width: '72px',
      height: '72px',
      borderRadius: '12px',
      background: 'linear-gradient(90deg, var(--bg-cream-dark) 25%, var(--border-light) 50%, var(--bg-cream-dark) 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      flexShrink: 0
    }} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        height: '18px',
        width: '50%',
        borderRadius: '9px',
        background: 'linear-gradient(90deg, var(--bg-cream-dark) 25%, var(--border-light) 50%, var(--bg-cream-dark) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        marginBottom: '8px'
      }} />
      <div style={{
        height: '14px',
        width: '100%',
        borderRadius: '7px',
        background: 'linear-gradient(90deg, var(--bg-cream-dark) 25%, var(--border-light) 50%, var(--bg-cream-dark) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        marginBottom: '10px'
      }} />
      <div style={{
        height: '20px',
        width: '60px',
        borderRadius: '10px',
        background: 'linear-gradient(90deg, var(--bg-cream-dark) 25%, var(--border-light) 50%, var(--bg-cream-dark) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite'
      }} />
    </div>
  </div>
);

const ProfilePage: React.FC = () => {
  const {
    currentUser,
    badges,
    getEarnedBadges,
    getMyPlants,
    getRequestsFromMe,
    getRequestsToMe,
    respondToRequest,
    getUserById,
    getPlantById
  } = usePlant();

  const [activeTab, setActiveTab] = useState<TabType>('myplants');
  const [animatingItem, setAnimatingItem] = useState<{ id: string; type: 'accept' | 'reject' } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const earnedBadges = getEarnedBadges();
  const earnedBadgeIds = new Set(earnedBadges.map(b => b.id));
  const myPlants = getMyPlants();
  const sentRequests = getRequestsFromMe();
  const receivedRequests = getRequestsToMe();

  const handleRespond = (requestId: string, accept: boolean) => {
    setAnimatingItem({ id: requestId, type: accept ? 'accept' : 'reject' });
    setTimeout(() => {
      respondToRequest(requestId, accept);
      setAnimatingItem(null);
    }, 600);
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2, 3].map(i => <SkeletonSwapItem key={i} />)}
        </div>
      );
    }

    switch (activeTab) {
      case 'myplants':
        if (myPlants.length === 0) {
          return (
            <div className="empty-state">
              <div className="empty-state-icon">🌱</div>
              <div className="empty-state-text">还没有发布的绿植，快去发布吧~</div>
            </div>
          );
        }
        return (
          <div className="masonry-grid">
            {myPlants.map((plant, idx) => (
              <div key={plant.id} className="plant-card" style={{ animationDelay: `${idx * 0.08}s` }}>
                <img src={plant.images[0]} alt={plant.name} className="plant-card-img" loading="lazy" />
                <div className="plant-card-info">
                  <div className="plant-card-name">{plant.name}</div>
                  <div className="plant-card-variety">{plant.variety}</div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'sent':
        if (sentRequests.length === 0) {
          return (
            <div className="empty-state">
              <div className="empty-state-icon">📤</div>
              <div className="empty-state-text">还没有发起的交换请求</div>
            </div>
          );
        }
        return (
          <div className="swap-list">
            {sentRequests.map((request) => {
              const plant = getPlantById(request.plantId);
              const toUser = getUserById(request.toUserId);
              if (!plant || !toUser) return null;
              return (
                <SwipeableItem
                  key={request.id}
                  request={request}
                  plantName={plant.name}
                  plantImage={plant.images[0]}
                  fromUserName=""
                  toUserName={toUser.nickname}
                  isReceived={false}
                  animating={animatingItem?.id === request.id}
                  animationType={animatingItem?.type || null}
                />
              );
            })}
          </div>
        );

      case 'received':
        if (receivedRequests.length === 0) {
          return (
            <div className="empty-state">
              <div className="empty-state-icon">📥</div>
              <div className="empty-state-text">还没有收到的交换申请</div>
            </div>
          );
        }
        return (
          <div className="swap-list">
            {receivedRequests.map((request) => {
              const plant = getPlantById(request.plantId);
              const fromUser = getUserById(request.fromUserId);
              if (!plant || !fromUser) return null;
              return (
                <SwipeableItem
                  key={request.id}
                  request={request}
                  plantName={plant.name}
                  plantImage={plant.images[0]}
                  fromUserName={fromUser.nickname}
                  toUserName=""
                  isReceived={true}
                  onAccept={() => handleRespond(request.id, true)}
                  onReject={() => handleRespond(request.id, false)}
                  animating={animatingItem?.id === request.id}
                  animationType={animatingItem?.type || null}
                />
              );
            })}
          </div>
        );
    }
  };

  return (
    <div>
      <div className="profile-header">
        <div className="profile-user">
          <img src={currentUser.avatar} alt={currentUser.nickname} className="profile-avatar" />
          <div className="profile-info">
            <h2>{currentUser.nickname}</h2>
            <p>{currentUser.bio}</p>
          </div>
        </div>
        <div className="profile-stats">
          <div className="profile-stat">
            <div className="profile-stat-value">{myPlants.length}</div>
            <div className="profile-stat-label">发布绿植</div>
          </div>
          <div className="profile-stat">
            <div className="profile-stat-value">{currentUser.swapCount}</div>
            <div className="profile-stat-label">成功交换</div>
          </div>
          <div className="profile-stat">
            <div className="profile-stat-value">{earnedBadges.length}</div>
            <div className="profile-stat-label">获得勋章</div>
          </div>
        </div>
      </div>

      <div className="section-title">🏆 成就勋章</div>
      <div className="badges-grid">
        {badges.map((badge) => {
          const isEarned = earnedBadgeIds.has(badge.id);
          return (
            <div key={badge.id} className={`badge-item ${!isEarned ? 'locked' : ''}`}>
              {isEarned && (
                <div className="badge-tooltip">{badge.description}</div>
              )}
              <div className="badge-icon">{badge.icon}</div>
              <div className="badge-name">{isEarned ? badge.name : `需${badge.requiredSwaps}次`}</div>
            </div>
          );
        })}
      </div>

      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'myplants' ? 'active' : ''}`}
          onClick={() => setActiveTab('myplants')}
        >
          🌱 我的绿植
        </button>
        <button
          className={`tab-btn ${activeTab === 'sent' ? 'active' : ''}`}
          onClick={() => setActiveTab('sent')}
        >
          📤 已发起 {sentRequests.length > 0 && <span style={{ fontSize: '0.75rem' }}>({sentRequests.length})</span>}
        </button>
        <button
          className={`tab-btn ${activeTab === 'received' ? 'active' : ''}`}
          onClick={() => setActiveTab('received')}
        >
          📥 收到申请 {receivedRequests.filter(r => r.status === 'pending').length > 0 && 
            <span style={{ fontSize: '0.75rem' }}>({receivedRequests.filter(r => r.status === 'pending').length})</span>}
        </button>
      </div>

      {renderTabContent()}
    </div>
  );
};

export default ProfilePage;
