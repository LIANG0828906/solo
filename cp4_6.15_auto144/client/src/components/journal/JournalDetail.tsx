import { memo, useState } from 'react';
import { X, Edit, ChevronLeft, ChevronRight, Star, MapPin, Trash2 } from 'lucide-react';
import { useJournalStore } from '../../store/useJournalStore';
import { FoodJournal, TasteProfile, CreateJournalDto } from '../../types';
import './JournalDetail.css';

interface JournalDetailProps {
  entry: FoodJournal;
}

const TASTE_LABELS: Record<keyof TasteProfile, string> = {
  sour: '酸',
  sweet: '甜',
  spicy: '辣',
  salty: '咸',
  umami: '鲜',
};

const JournalDetail = memo(function JournalDetail({ entry }: JournalDetailProps) {
  const { closeDetail, updateEntry, deleteEntry, isLoading } = useJournalStore();
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<CreateJournalDto>>({
    restaurantName: entry.restaurantName,
    review: entry.review,
    rating: entry.rating,
    tasteProfile: { ...entry.tasteProfile },
    cuisineTags: [...entry.cuisineTags],
  });

  const handlePrevPhoto = () => {
    setCurrentPhotoIndex((prev) =>
      prev === 0 ? entry.photos.length - 1 : prev - 1
    );
  };

  const handleNextPhoto = () => {
    setCurrentPhotoIndex((prev) =>
      prev === entry.photos.length - 1 ? 0 : prev + 1
    );
  };

  const handleSave = () => {
    updateEntry(entry.id, editData);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm('确定要删除这条食记吗？')) {
      deleteEntry(entry.id);
    }
  };

  const handleTasteChange = (key: keyof TasteProfile, value: number) => {
    setEditData((prev) => ({
      ...prev,
      tasteProfile: {
        ...prev.tasteProfile!,
        [key]: value,
      },
    }));
  };

  return (
    <div className="detail-overlay" onClick={closeDetail}>
      <div
        className="detail-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="detail-gallery">
          <button className="detail-close" onClick={closeDetail}>
            <X size={24} />
          </button>

          <div className="detail-actions">
            {isEditing ? (
              <>
                <button className="detail-save" onClick={handleSave} disabled={isLoading}>
                  保存
                </button>
                <button className="detail-cancel" onClick={() => setIsEditing(false)}>
                  取消
                </button>
              </>
            ) : (
              <>
                <button className="detail-edit" onClick={() => setIsEditing(true)}>
                  <Edit size={20} />
                </button>
                <button className="detail-delete" onClick={handleDelete}>
                  <Trash2 size={20} />
                </button>
              </>
            )}
          </div>

          {entry.photos.length > 0 && (
            <>
              <div className="gallery-main">
                <img
                  src={entry.photos[currentPhotoIndex]}
                  alt={entry.restaurantName}
                />
              </div>

              {entry.photos.length > 1 && (
                <>
                  <button
                    className="gallery-nav gallery-prev"
                    onClick={handlePrevPhoto}
                  >
                    <ChevronLeft size={28} />
                  </button>
                  <button
                    className="gallery-nav gallery-next"
                    onClick={handleNextPhoto}
                  >
                    <ChevronRight size={28} />
                  </button>

                  <div className="gallery-dots">
                    {entry.photos.map((_, index) => (
                      <button
                        key={index}
                        className={`gallery-dot ${index === currentPhotoIndex ? 'active' : ''}`}
                        onClick={() => setCurrentPhotoIndex(index)}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <div className="detail-content">
          {isEditing ? (
            <input
              type="text"
              className="detail-title-input"
              value={editData.restaurantName}
              onChange={(e) => setEditData({ ...editData, restaurantName: e.target.value })}
            />
          ) : (
            <h1 className="detail-title">{entry.restaurantName}</h1>
          )}

          <div className="detail-meta">
            <div className="detail-rating">
              <Star className="rating-star" size={20} fill="#f59e0b" />
              {isEditing ? (
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  className="rating-input"
                  value={editData.rating}
                  onChange={(e) => setEditData({ ...editData, rating: parseFloat(e.target.value) })}
                />
              ) : (
                <span className="rating-score">{entry.rating.toFixed(1)}</span>
              )}
            </div>

            <div className="detail-cuisines">
              {entry.cuisineTags.map((c) => (
                <span key={c} className="cuisine-tag">
                  {c}
                </span>
              ))}
            </div>
          </div>

          <div className="detail-location">
            <MapPin size={18} />
            <span>{entry.latitude.toFixed(4)}, {entry.longitude.toFixed(4)}</span>
          </div>

          <div className="detail-taste">
            <h3 className="section-title">口味评分</h3>
            <div className="taste-grid">
              {Object.entries(isEditing ? editData.tasteProfile! : entry.tasteProfile).map(([key, value]) => (
                <div key={key} className="taste-bar-item">
                  <span className="taste-bar-label">{TASTE_LABELS[key as keyof TasteProfile]}</span>
                  {isEditing ? (
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={value}
                      onChange={(e) => handleTasteChange(key as keyof TasteProfile, parseInt(e.target.value))}
                      className="taste-bar-slider"
                    />
                  ) : (
                    <div className="taste-bar-track">
                      <div
                        className="taste-bar-fill"
                        style={{ width: `${value * 10}%` }}
                      />
                    </div>
                  )}
                  <span className="taste-bar-value">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="detail-review">
            <h3 className="section-title">食评</h3>
            {isEditing ? (
              <textarea
                className="review-textarea"
                value={editData.review}
                onChange={(e) => setEditData({ ...editData, review: e.target.value })}
                rows={6}
              />
            ) : (
              <p className="review-text">{entry.review || '暂无评价'}</p>
            )}
          </div>

          <div className="detail-date">
            记录于 {new Date(entry.createdAt).toLocaleDateString('zh-CN')}
          </div>
        </div>
      </div>
    </div>
  );
});

export default JournalDetail;
