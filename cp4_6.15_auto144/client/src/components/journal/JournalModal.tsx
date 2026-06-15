import { memo, useState, useRef, DragEvent } from 'react';
import { X, Upload, GripVertical, Smile } from 'lucide-react';
import { useJournalStore } from '../../store/useJournalStore';
import { CreateJournalDto, TasteProfile, CuisineTag, CUISINE_TAGS } from '../../types';
import './JournalModal.css';

const TASTE_KEYS: (keyof TasteProfile)[] = ['sour', 'sweet', 'spicy', 'salty', 'umami'];

const TASTE_LABELS: Record<keyof TasteProfile, string> = {
  sour: '酸',
  sweet: '甜',
  spicy: '辣',
  salty: '咸',
  umami: '鲜',
};

const getRatingGradient = (rating: number): string => {
  const ratio = rating / 10;
  const r = Math.round(74 + (231 - 74) * ratio);
  const g = Math.round(144 + (76 - 144) * ratio);
  const b = Math.round(217 + (60 - 217) * ratio);
  return `rgb(${r}, ${g}, ${b})`;
};

const JournalModal = memo(function JournalModal() {
  const { closeModal, selectedLocation, addEntry } = useJournalStore();
  const [restaurantName, setRestaurantName] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [cuisineTags, setCuisineTags] = useState<CuisineTag[]>([]);
  const [rating, setRating] = useState(7);
  const [review, setReview] = useState('');
  const [tasteProfile, setTasteProfile] = useState<TasteProfile>({
    sour: 5,
    sweet: 5,
    spicy: 5,
    salty: 5,
    umami: 5,
  });
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = 3 - photos.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    filesToProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeletePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newPhotos = [...photos];
    const [draggedPhoto] = newPhotos.splice(draggedIndex, 1);
    newPhotos.splice(index, 0, draggedPhoto);
    setPhotos(newPhotos);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const toggleCuisine = (c: CuisineTag) => {
    setCuisineTags((prev) =>
      prev.includes(c) ? prev.filter((item) => item !== c) : [...prev, c]
    );
  };

  const handleTasteChange = (key: keyof TasteProfile, value: number) => {
    setTasteProfile((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = () => {
    if (!restaurantName.trim() || !selectedLocation) return;

    const dto: CreateJournalDto = {
      restaurantName: restaurantName.trim(),
      photos,
      cuisineTags,
      rating,
      review,
      latitude: selectedLocation.lat,
      longitude: selectedLocation.lng,
      tasteProfile,
    };

    addEntry(dto);
  };

  const insertEmoji = (emoji: string) => {
    setReview((prev) => prev + emoji);
  };

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const EMOJIS = ['😋', '🤤', '👍', '❤️', '🔥', '✨', '👌', '😎', '🥰', '💯'];

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">新建食记</h2>
          <button className="modal-close" onClick={closeModal}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-content">
          <div className="form-group">
            <label className="form-label">餐厅名称</label>
            <input
              type="text"
              className="form-input"
              placeholder="请输入餐厅名称"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              照片 ({photos.length}/3)
            </label>
            <div className="photo-upload-grid">
              {photos.map((photo, index) => (
                <div
                  key={index}
                  className={`photo-preview ${draggedIndex === index ? 'dragging' : ''}`}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  <img src={photo} alt={`照片 ${index + 1}`} />
                  <button
                    className="photo-delete"
                    onClick={() => handleDeletePhoto(index)}
                  >
                    <X size={16} />
                  </button>
                  <div className="photo-drag-handle">
                    <GripVertical size={16} />
                  </div>
                </div>
              ))}
              {photos.length < 3 && (
                <div
                  className="photo-upload"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={32} />
                  <span>添加照片</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handlePhotoUpload}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">菜系</label>
            <div className="cuisine-tags">
              {CUISINE_TAGS.map((c) => (
                <button
                  key={c}
                  className={`cuisine-tag ${cuisineTags.includes(c) ? 'active' : ''}`}
                  onClick={() => toggleCuisine(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              评分: <span style={{ color: getRatingGradient(rating) }}>{rating.toFixed(1)}</span>
            </label>
            <div className="rating-slider-container">
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={rating}
                onChange={(e) => setRating(parseFloat(e.target.value))}
                className="rating-slider"
                style={{
                  background: `linear-gradient(to right, ${getRatingGradient(0)} 0%, ${getRatingGradient(rating)} ${rating * 10}%, #e5e5e5 ${rating * 10}%, #e5e5e5 100%)`,
                }}
              />
              <div className="rating-labels">
                <span>0</span>
                <span>5</span>
                <span>10</span>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              食评
              <button 
                className="emoji-btn" 
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <Smile size={18} />
              </button>
            </label>
            {showEmojiPicker && (
              <div className="emoji-picker">
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    className="emoji-item"
                    onClick={() => insertEmoji(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
            <textarea
              className="form-textarea"
              placeholder="记录你的美食体验..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={4}
            />
          </div>

          <div className="form-group">
            <label className="form-label">口味维度</label>
            <div className="taste-dimensions">
              {TASTE_KEYS.map((key) => (
                <div key={key} className="taste-item">
                  <span className="taste-label">{TASTE_LABELS[key]}</span>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={tasteProfile[key]}
                    onChange={(e) => handleTasteChange(key, parseInt(e.target.value))}
                    className="taste-slider"
                  />
                  <span className="taste-value">{tasteProfile[key]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="submit-btn"
            onClick={handleSubmit}
            disabled={!restaurantName.trim()}
          >
            发布食记
          </button>
        </div>
      </div>
    </div>
  );
});

export default JournalModal;
