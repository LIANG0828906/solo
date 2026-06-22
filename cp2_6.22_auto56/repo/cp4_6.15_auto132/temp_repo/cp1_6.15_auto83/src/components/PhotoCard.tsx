import { useState, useRef, useEffect } from 'react';
import { PhotoData, TAGS, getExposureTrend } from '../utils/photoData';
import TrendChart from './TrendChart';

interface PhotoCardProps {
  photo: PhotoData;
  index: number;
  allPhotos: PhotoData[];
  isSelected: boolean;
  isEntering: boolean;
  isExiting: boolean;
  onClick: (e: React.MouseEvent) => void;
}

export default function PhotoCard({
  photo,
  index,
  allPhotos,
  isSelected,
  isEntering,
  isExiting,
  onClick,
}: PhotoCardProps) {
  const [loaded, setLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imageVisible, setImageVisible] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '200px' }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const trendData = isHovered ? getExposureTrend(allPhotos, index, 5) : [];

  const cardClasses = [
    'photo-card',
    isSelected ? 'selected' : '',
    isEntering ? 'enter' : '',
    isExiting ? 'exit' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={cardRef}
      className={cardClasses}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        aspectRatio: `${photo.width} / ${photo.height}`,
      }}
    >
      {imageVisible ? (
        <img
          ref={imgRef}
          src={photo.imageUrl}
          alt={`照片 ${index + 1}`}
          className="photo-card-img"
          onLoad={() => setLoaded(true)}
          style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.3s ease' }}
        />
      ) : (
        <div
          className="photo-card-placeholder"
          style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
        >
          加载中...
        </div>
      )}

      <div className="composition-guides">
        <div className="rule-of-thirds" />
        <div className="diagonal-lines" />
      </div>

      <div className="photo-tags">
        {photo.tags.map((tagId) => {
          const tag = TAGS.find(t => t.id === tagId);
          if (!tag) return null;
          return (
            <span
              key={tagId}
              className={`photo-tag tag-${tagId}`}
            >
              {tag.name}
            </span>
          );
        })}
      </div>

      <div className="params-vertical">
        <span>f/{photo.params.aperture}</span>
        <span>{photo.params.shutterSpeed}s</span>
        <span>ISO {photo.params.iso}</span>
        <span>{photo.params.focalLength}mm</span>
      </div>

      <div className="params-detail-panel">
        <div className="params-detail-title">拍摄参数</div>
        <ul className="params-detail-list">
          <li>
            <span className="params-detail-label">光圈</span>
            <span className="params-detail-value">f/{photo.params.aperture}</span>
          </li>
          <li>
            <span className="params-detail-label">快门</span>
            <span className="params-detail-value">{photo.params.shutterSpeed}s</span>
          </li>
          <li>
            <span className="params-detail-label">ISO</span>
            <span className="params-detail-value">{photo.params.iso}</span>
          </li>
          <li>
            <span className="params-detail-label">焦距</span>
            <span className="params-detail-value">{photo.params.focalLength}mm</span>
          </li>
          <li>
            <span className="params-detail-label">曝光值</span>
            <span className="params-detail-value">EV {photo.params.ev}</span>
          </li>
        </ul>
        <div className="params-detail-title">曝光趋势</div>
        <div className="trend-chart-container">
          {trendData.length > 0 && (
            <TrendChart data={trendData} width={150} height={50} />
          )}
        </div>
      </div>
    </div>
  );
}
