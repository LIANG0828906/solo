import React, { useState, useRef } from 'react';
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
  const [isDragging, setIsDragging] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);
  const ACTION_WIDTH = 160;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isReceived || request.status !== 'pending') return;
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    const newTranslate = Math.max(-ACTION_WIDTH, Math.min(0, diff + (translateX < 0 ? translateX : 0)));
    setTranslateX(newTranslate);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (translateX < -ACTION_WIDTH / 2) {
      setTranslateX(-ACTION_WIDTH);
    } else {
      setTranslateX(0);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isReceived || request.status !== 'pending') return;
    setStartX(e.clientX);
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const diff = e.clientX - startX;
    const newTranslate = Math.max(-ACTION_WIDTH, Math.min(0, diff + (translateX < 0 ? translateX : 0)));
    setTranslateX(newTranslate);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (translateX < -ACTION_WIDTH / 2) {
      setTranslateX(-ACTION_WIDTH);
    } else {
      setTranslateX(0);
    }
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      handleMouseUp();
    }
  };

  const getStatusText = () => {
    switch (request.status) {
      case 'pending': return '待确认';
      case 'accepted': return '已接受';
      case 'rejected': return '已拒绝';
    }
  };

  return (
    <div className="swap-item-wrapper">
      {isReceived && request.status === 'pending' && (
        <div className="swap-actions">
          <button
            className="swap-action-btn accept"
            onClick={() => {
              setTranslateX(0);
              onAccept?.();
            }}
          >
            <span>✓</span>
            接受
          </button>
          <button
            className="swap-action-btn reject"
            onClick={() => {
              setTranslateX(0);
              onReject?.();
            }}
          >
            <span>✕</span>
            拒绝
          </button>
        </div>
      )}
      <div
        ref={itemRef}
        className={`swap-item ${animating ? (animationType === 'accept' ? 'flip-accept' : 'flip-reject') : ''}`}
        style={{ transform: isDragging ? `translateX(${translateX}px)` : undefined, transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <img src={plantImage} alt={plantName} className="swap-item-img" />
        <div className="swap-item-info">
          <div className="swap-item-title">{plantName}</div>
          <div className="swap-item-desc">
            {isReceived ? `来自 ${fromUserName}：${request.reason}` : `发给 ${toUserName}：${request.expectation}`}
          </div>
          <span className={`swap-item-status status-${request.status}`}>
            {getStatusText()}
          </span>
        </div>
      </div>
    </div>
  );
};

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
                <img src={plant.images[0]} alt={plant.name} className="plant-card-img" />
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
          📤 已发起
        </button>
        <button
          className={`tab-btn ${activeTab === 'received' ? 'active' : ''}`}
          onClick={() => setActiveTab('received')}
        >
          📥 收到申请
        </button>
      </div>

      {renderTabContent()}
    </div>
  );
};

export default ProfilePage;
