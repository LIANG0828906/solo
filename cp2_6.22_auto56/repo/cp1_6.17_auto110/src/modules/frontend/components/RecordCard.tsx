import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, ShoppingCart } from 'lucide-react';
import type { Record } from '@/store';
import { useStore } from '@/store';

interface Props {
  record: Record;
}

export default function RecordCard({ record }: Props) {
  const navigate = useNavigate();
  const addToCart = useStore((s) => s.addToCart);
  const setCurrentTrack = useStore((s) => s.setCurrentTrack);
  const [added, setAdded] = useState(false);

  const handleCardClick = () => {
    navigate(`/album/${record.id}`);
  };

  const handleListen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (record.tracks.length > 0) {
      setCurrentTrack({
        recordId: record.id,
        recordTitle: record.title,
        coverUrl: record.coverUrl,
        trackNumber: record.tracks[0].number,
        trackTitle: record.tracks[0].title,
      });
    }
  };

  const handleBuy = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(record);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="record-card" onClick={handleCardClick}>
      <div className="record-cover-wrap">
        <img src={record.coverUrl} alt={record.title} />
        <div className="play-overlay">
          <div className="play-overlay-btn">
            <Play size={24} fill="currentColor" />
          </div>
        </div>
      </div>
      <div className="record-artist">{record.artist}</div>
      <div className="record-title">{record.title}</div>
      <div className="record-price">¥{record.price.toFixed(2)}</div>
      <div className="card-actions">
        <button className="btn btn-listen" onClick={handleListen}>
          <Play size={14} /> 试听
        </button>
        <button className={`btn btn-buy ${added ? 'added' : ''}`} onClick={handleBuy}>
          <ShoppingCart size={14} /> {added ? '已加入' : '购买'}
        </button>
      </div>
    </div>
  );
}
