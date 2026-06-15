import { Heart, MapPin, Calendar, ArrowRight } from 'lucide-react';
import { Trail } from '@/shared/types';
import { formatDistance } from '@/shared/utils';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface TrailCardProps {
  trail: Trail;
  isLikedAnimating?: boolean;
  isSelected?: boolean;
  showCompareCheckbox?: boolean;
  onLike?: () => void;
  onClick?: () => void;
  onToggleSelect?: () => void;
}

export function TrailCard({
  trail,
  isLikedAnimating = false,
  isSelected = false,
  showCompareCheckbox = false,
  onLike,
  onClick,
  onToggleSelect,
}: TrailCardProps) {
  return (
    <div
      className={`trail-card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      {showCompareCheckbox && (
        <div
          className={`compare-checkbox ${isSelected ? 'checked' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect?.();
          }}
        >
          {isSelected && '✓'}
        </div>
      )}
      
      <div className="trail-card-header">
        <h3 className="trail-card-title">{trail.name}</h3>
        <button
          className={`like-button ${isLikedAnimating ? 'animating' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onLike?.();
          }}
        >
          <Heart size={18} fill={trail.likes > 0 ? '#E53935' : 'none'} />
          <span className="like-count">{trail.likes}</span>
        </button>
      </div>
      
      <div className="trail-card-stats">
        <div className="stat-item">
          <MapPin size={14} />
          <span>{formatDistance(trail.distance)}</span>
        </div>
        <div className="stat-item">
          <Calendar size={14} />
          <span>{format(new Date(trail.createdAt), 'MM月dd日', { locale: zhCN })}</span>
        </div>
      </div>
      
      <div className="trail-card-footer">
        <span className="trail-elevation">
          平均海拔: {Math.round(trail.avgElevation)}m
        </span>
        <ArrowRight size={16} className="trail-card-arrow" />
      </div>
    </div>
  );
}
