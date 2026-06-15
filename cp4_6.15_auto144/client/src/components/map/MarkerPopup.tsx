import { memo } from 'react';
import { Star, MapPin } from 'lucide-react';
import { JournalEntry } from '../../types';
import './MarkerPopup.css';

interface MarkerPopupProps {
  entry: JournalEntry;
  onClose: () => void;
  onEdit: () => void;
}

const MarkerPopup = memo(function MarkerPopup({
  entry,
  onClose,
  onEdit,
}: MarkerPopupProps) {
  return (
    <div className="popup-container">
      <div className="popup-card">
        <button className="popup-close" onClick={onClose}>
          ×
        </button>

        {entry.photos.length > 0 && (
          <div className="popup-image">
            <img src={entry.photos[0]} alt={entry.restaurantName} />
          </div>
        )}

        <div className="popup-content">
          <h3 className="popup-title">{entry.restaurantName}</h3>

          <div className="popup-rating">
            <Star className="popup-star" size={16} fill="#f59e0b" />
            <span className="popup-score">{entry.rating.toFixed(1)}</span>
          </div>

          <div className="popup-cuisines">
            {entry.cuisine.map((c) => (
              <span key={c} className="popup-cuisine-tag">
                {c}
              </span>
            ))}
          </div>

          <p className="popup-review">{entry.review}</p>

          <div className="popup-location">
            <MapPin size={14} />
            <span>{entry.location.address}</span>
          </div>

          <button className="popup-edit-btn" onClick={onEdit}>
            编辑
          </button>
        </div>
      </div>
    </div>
  );
});

export default MarkerPopup;
