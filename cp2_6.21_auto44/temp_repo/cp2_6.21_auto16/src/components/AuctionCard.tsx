import { Link } from 'react-router-dom';
import type { Artwork } from '@/store';

interface AuctionCardProps {
  artwork: Artwork;
}

export default function AuctionCard({ artwork }: AuctionCardProps) {
  const timeLeft = () => {
    const end = new Date(artwork.endTime).getTime();
    const now = Date.now();
    const diff = end - now;
    if (diff <= 0) return '已结束';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}天 ${hours}小时`;
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}小时 ${minutes}分钟`;
  };

  return (
    <Link to={`/auction/${artwork.id}`} className="auction-card">
      <div className="card-image-wrapper">
        <img
          src={artwork.imageUrl}
          alt={artwork.title}
          className="card-image"
          loading="lazy"
        />
        <div className="card-time-badge">{timeLeft()}</div>
      </div>
      <div className="card-content">
        <h3 className="card-title">{artwork.title}</h3>
        <p className="card-creator">by {artwork.creator}</p>
        <div className="card-price-row">
          <div className="card-current-price">
            <span className="price-label">当前价</span>
            <span className="price-value">¥{artwork.currentPrice.toLocaleString()}</span>
          </div>
          <div className="card-bid-count">
            {artwork.highestBidder ? '有出价' : '暂无出价'}
          </div>
        </div>
      </div>
    </Link>
  );
}
