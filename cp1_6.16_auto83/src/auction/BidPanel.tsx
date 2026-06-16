import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import './BidPanel.css';

interface BidPanelProps {
  artworkId: string;
}

export const BidPanel = ({ artworkId }: BidPanelProps) => {
  const { placeBid, artworks } = useStore();
  const artwork = artworks.find(a => a.id === artworkId);
  const [bidAmount, setBidAmount] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (artwork) {
      const minBid = Math.ceil(artwork.currentPrice * 1.1);
      setBidAmount(minBid.toString());
    }
  }, [artwork?.currentPrice, artworkId]);

  if (!artwork) return null;

  const minBid = Math.ceil(artwork.currentPrice * 1.1);

  const validateBid = (value: string): boolean => {
    const num = parseInt(value, 10);
    if (isNaN(num) || !Number.isInteger(Number(value))) {
      setError('请输入整数金额');
      return false;
    }
    if (num < minBid) {
      setError('出价需至少高出当前最高价10%');
      return false;
    }
    setError('');
    return true;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setBidAmount(value);
      if (value) {
        validateBid(value);
      } else {
        setError('');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(bidAmount, 10);
    if (validateBid(bidAmount)) {
      const success = placeBid(artworkId, amount);
      if (success) {
        setBidAmount('');
        setError('');
      }
    }
  };

  const handleQuickBid = (multiplier: number) => {
    const amount = Math.ceil(minBid * multiplier);
    setBidAmount(amount.toString());
    setError('');
  };

  const isValid = bidAmount !== '' && !error && !artwork.isEnded;

  return (
    <div className="bid-panel">
      <form onSubmit={handleSubmit}>
        <div className="bid-input-wrapper">
          <span className="bid-currency">¥</span>
          <input
            type="text"
            value={bidAmount}
            onChange={handleInputChange}
            disabled={artwork.isEnded}
            placeholder={`最低出价 ¥${minBid}`}
            className={`bid-input ${error ? 'has-error' : ''}`}
          />
        </div>

        {error && <div className="bid-error">{error}</div>}

        <div className="quick-bid-buttons">
          <button
            type="button"
            onClick={() => handleQuickBid(1)}
            disabled={artwork.isEnded}
            className="quick-bid-btn"
          >
            +10%
          </button>
          <button
            type="button"
            onClick={() => handleQuickBid(1.2)}
            disabled={artwork.isEnded}
            className="quick-bid-btn"
          >
            +20%
          </button>
          <button
            type="button"
            onClick={() => handleQuickBid(1.5)}
            disabled={artwork.isEnded}
            className="quick-bid-btn"
          >
            +50%
          </button>
        </div>

        <button
          type="submit"
          disabled={!isValid}
          className={`bid-submit-btn ${!isValid ? 'disabled' : ''}`}
        >
          {artwork.isEnded ? '竞拍已结束' : '立即出价'}
        </button>
      </form>
    </div>
  );
};
