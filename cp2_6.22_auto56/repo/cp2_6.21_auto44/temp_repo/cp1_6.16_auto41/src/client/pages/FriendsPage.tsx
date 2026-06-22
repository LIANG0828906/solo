import { useState, useCallback, useEffect } from 'react';
import type { FriendInfo } from '../types';
import FriendCard from '../components/FriendCard';
import './FriendsPage.css';

interface FriendsPageProps {
  userId: string;
  friends: FriendInfo[];
  onRefresh: () => void;
  onViewFriend: (friendId: string) => void;
  onSendRequest: (toId: string) => Promise<boolean>;
  friendRequests: Array<{ id: string; petName: string; petColor: string }>;
  onAcceptRequest: (friendId: string) => Promise<boolean>;
}

const FriendsPage = function FriendsPage({
  userId,
  friends,
  onRefresh,
  onViewFriend,
  onSendRequest,
  friendRequests,
  onAcceptRequest,
}: FriendsPageProps) {
  const [searchId, setSearchId] = useState('');
  const [searchResult, setSearchResult] = useState<{ id: string; petName: string; petColor: string } | null>(null);
  const [searchError, setSearchError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!searchId || searchId.length !== 6) {
      setSearchError('请输入6位用户ID');
      return;
    }
    
    if (searchId === userId) {
      setSearchError('不能添加自己为好友');
      return;
    }

    setIsSearching(true);
    setSearchError('');
    setSearchResult(null);

    try {
      const response = await fetch('/api/friends/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: searchId }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSearchResult(data.data);
        setRequestSent(false);
      } else {
        setSearchError(data.error || '用户不存在');
      }
    } catch (e) {
      setSearchError('搜索失败，请重试');
    } finally {
      setIsSearching(false);
    }
  }, [searchId, userId]);

  const handleSendRequest = useCallback(async () => {
    if (!searchResult) return;
    
    const success = await onSendRequest(searchResult.id);
    if (success) {
      setRequestSent(true);
    }
  }, [searchResult, onSendRequest]);

  const handleAccept = useCallback(async (friendId: string) => {
    await onAcceptRequest(friendId);
    onRefresh();
  }, [onAcceptRequest, onRefresh]);

  useEffect(() => {
    onRefresh();
  }, [onRefresh]);

  return (
    <div className="friends-page page-container">
      <h1 className="page-title">👥 好友</h1>
      
      <div className="search-section">
        <div className="search-box">
          <input
            type="text"
            className="search-input"
            placeholder="输入6位ID搜索好友..."
            value={searchId}
            onChange={(e) => {
              setSearchId(e.target.value.replace(/\D/g, '').slice(0, 6));
              setSearchError('');
              setSearchResult(null);
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            maxLength={6}
          />
          <button 
            className="search-btn"
            onClick={handleSearch}
            disabled={isSearching}
          >
            {isSearching ? '搜索中...' : '搜索'}
          </button>
        </div>
        
        {searchError && <p className="search-error">{searchError}</p>}
        
        {searchResult && (
          <div className="search-result animate-slide-up">
            <div className="result-item">
              <div 
                className="result-avatar"
                style={{ backgroundColor: searchResult.petColor }}
              />
              <div className="result-info">
                <div className="result-name">{searchResult.petName}</div>
                <div className="result-id">ID: {searchResult.id}</div>
              </div>
              {requestSent ? (
                <button className="request-sent-btn" disabled>
                  ✓ 已发送
                </button>
              ) : (
                <button className="add-friend-btn" onClick={handleSendRequest}>
                  + 加好友
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {friendRequests.length > 0 && (
        <div className="friend-requests">
          <h2 className="section-title">好友申请 ({friendRequests.length})</h2>
          <div className="requests-list">
            {friendRequests.map(req => (
              <div key={req.id} className="request-item animate-slide-up">
                <div 
                  className="request-avatar"
                  style={{ backgroundColor: req.petColor }}
                />
                <div className="request-info">
                  <div className="request-name">{req.petName}</div>
                  <div className="request-id">ID: {req.id}</div>
                </div>
                <button 
                  className="accept-btn"
                  onClick={() => handleAccept(req.id)}
                >
                  接受
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="friends-section">
        <h2 className="section-title">我的好友 ({friends.length})</h2>
        
        {friends.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🐾</span>
            <p>还没有好友哦，快去搜索添加吧~</p>
          </div>
        ) : (
          <div className="friends-grid">
            {friends.map(friend => (
              <FriendCard
                key={friend.id}
                friend={friend}
                onClick={() => onViewFriend(friend.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsPage;
