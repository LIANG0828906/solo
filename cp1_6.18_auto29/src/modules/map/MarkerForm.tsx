import { useState, useEffect, useRef } from 'react';
import { useMapStore } from '../../stores/useMapStore';
import type { MarkerCategory } from '../../stores/useMapStore';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../../stores/useMapStore';
import './MarkerForm.css';

interface MarkerFormProps {
  isOpen: boolean;
  position: { lat: number; lng: number } | null;
  onClose: () => void;
}

export function MarkerForm({ isOpen, position, onClose }: MarkerFormProps) {
  const addMarker = useMapStore((state) => state.addMarker);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<MarkerCategory>('attraction');
  const [note, setNote] = useState('');
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setCategory('attraction');
      setNote('');
    }
  }, [isOpen, position]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        if (target.closest('.leaflet-marker-icon') || target.closest('.custom-marker')) {
          return;
        }
        onClose();
      }
    };

    if (isOpen) {
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !position) return;

    addMarker({
      name: name.trim(),
      category,
      note: note.trim(),
      lat: position.lat,
      lng: position.lng,
    });

    onClose();
  };

  if (!isOpen || !position) return null;

  const categories: MarkerCategory[] = ['food', 'attraction', 'hotel', 'shopping'];

  return (
    <div className="marker-form-overlay">
      <div ref={formRef} className="marker-form">
        <div className="marker-form-header">
          <h3>添加地点标记</h3>
          <button className="marker-form-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="marker-name">地点名称</label>
            <input
              id="marker-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入地点名称"
              autoFocus
              maxLength={50}
            />
          </div>

          <div className="form-group">
            <label>类别</label>
            <div className="category-options">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`category-option ${category === cat ? 'active' : ''}`}
                  style={{
                    borderColor: category === cat ? CATEGORY_COLORS[cat] : 'transparent',
                    backgroundColor: category === cat ? `${CATEGORY_COLORS[cat]}15` : '#f5f5f5',
                  }}
                  onClick={() => setCategory(cat)}
                >
                  <span
                    className="category-dot"
                    style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                  />
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="marker-note">备注</label>
            <textarea
              id="marker-note"
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 200))}
              placeholder="添加备注信息（最多200字）"
              rows={3}
              maxLength={200}
            />
            <div className="char-count">{note.length}/200</div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              取消
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={!name.trim()}
            >
              添加标记
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
