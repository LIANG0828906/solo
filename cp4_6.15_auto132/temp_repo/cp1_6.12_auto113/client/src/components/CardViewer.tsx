import { useState } from 'react';
import { Card } from '../../../shared/types';
import './CardViewer.css';

interface CardViewerProps {
  myCard: Card | null;
  userId: string;
  ws: WebSocket | null;
  onExchange: (targetCardId: string) => void;
}

const CardViewer = ({ myCard, userId, ws, onExchange }: CardViewerProps) => {
  const [cardId, setCardId] = useState('');
  const [searchedCard, setSearchedCard] = useState<Card | null>(null);
  const [error, setError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [exchangeSuccess, setExchangeSuccess] = useState(false);

  const handleSearch = async () => {
    if (!cardId.trim()) {
      setError('请输入名片ID');
      return;
    }

    setIsSearching(true);
    setError('');
    setSearchedCard(null);

    try {
      const response = await fetch(`/api/cards/${cardId.trim()}`);
      if (response.ok) {
        const data = await response.json();
        setSearchedCard(data);
      } else {
        setError('未找到该名片，请检查ID是否正确');
      }
    } catch {
      setError('搜索失败，请稍后重试');
    } finally {
      setIsSearching(false);
    }
  };

  const handleExchange = () => {
    if (!searchedCard || !myCard) return;
    onExchange(searchedCard.id);
    setExchangeSuccess(true);
    setTimeout(() => setExchangeSuccess(false), 2000);
  };

  return (
    <div className="card-viewer-page">
      <h1 className="page-title">交换名片</h1>

      {!myCard ? (
        <div className="no-card-warning">
          <p>请先创建您的个人名片后再进行交换</p>
        </div>
      ) : (
        <div className="exchange-content">
          <div className="search-section">
            <h2 className="section-title">输入对方名片ID</h2>
            <div className="search-input-group">
              <input
                type="text"
                value={cardId}
                onChange={(e) => setCardId(e.target.value)}
                placeholder="请输入名片ID"
                className="search-input"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                className="search-btn"
                onClick={handleSearch}
                disabled={isSearching}
              >
                {isSearching ? '搜索中...' : '搜索'}
              </button>
            </div>
            {error && <p className="error-message">{error}</p>}
          </div>

          {searchedCard && (
            <div className={`searched-card ${exchangeSuccess ? 'exchange-success' : ''}`}>
              <div className="card-preview">
                <div className="card-avatar-wrapper">
                  {searchedCard.avatarUrl ? (
                    <img src={searchedCard.avatarUrl} alt="头像" className="card-avatar" />
                  ) : (
                    <div className="card-avatar-placeholder">
                      {searchedCard.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <h3 className="card-name">{searchedCard.name}</h3>
                <p className="card-position">{searchedCard.position}</p>
                <p className="card-company">{searchedCard.company}</p>
              </div>
              
              <button
                className="exchange-btn"
                onClick={handleExchange}
                disabled={exchangeSuccess}
              >
                {exchangeSuccess ? '✓ 交换成功' : '交换名片'}
              </button>
            </div>
          )}

          <div className="my-card-section">
            <h2 className="section-title">我的名片ID</h2>
            <div className="my-card-id">
              <code>{myCard.id}</code>
              <button
                className="copy-btn"
                onClick={() => navigator.clipboard.writeText(myCard.id)}
              >
                复制
              </button>
            </div>
            <p className="hint-text">
              将此ID分享给对方，对方输入后即可与您交换名片
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardViewer;
