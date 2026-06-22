import { useState } from 'react';
import { Camera } from 'lucide-react';
import type { Exhibit, ViewMode } from '../types';
import { useExhibitStore } from '../store';
import './ExhibitCard.css';

interface ExhibitCardProps {
  exhibit: Exhibit;
  index: number;
  viewMode: ViewMode;
  isNew?: boolean;
}

function ExhibitCard({ exhibit, index, viewMode, isNew }: ExhibitCardProps) {
  const [imageError, setImageError] = useState(false);
  const { openModal } = useExhibitStore();

  const displayTags = exhibit.tags.slice(0, 3);
  const extraTagsCount = exhibit.tags.length - 3;

  const handleClick = () => {
    openModal(exhibit);
  };

  const animationDelay = `${Math.min(index * 0.05, 0.8)}s`;

  return (
    <div
      className={`exhibit-card ${viewMode} ${isNew ? 'new-card' : ''}`}
      style={{ animationDelay }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className="card-image-wrapper">
        {imageError ? (
          <div className="card-placeholder">
            <Camera size={32} className="placeholder-icon" />
          </div>
        ) : (
          <img
            src={exhibit.imageUrl}
            alt={exhibit.title}
            className="card-image"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        )}
      </div>
      <div className="card-content">
        <h3 className="card-title" title={exhibit.title}>
          {exhibit.title}
        </h3>
        <p className="card-description" title={exhibit.description}>
          {exhibit.description}
        </p>
        <div className="card-tags">
          {displayTags.map((tag) => (
            <span key={tag} className="card-tag">
              {tag}
            </span>
          ))}
          {extraTagsCount > 0 && (
            <span className="card-tag tag-more">
              +{extraTagsCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ExhibitCard;
