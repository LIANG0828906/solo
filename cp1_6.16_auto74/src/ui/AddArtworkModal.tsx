import { useState } from 'react';
import { EventBus } from '@/data/EventBus';
import { COLOR_PALETTE, STYLE_OPTIONS } from '@/data/types';
import { X } from 'lucide-react';

interface AddArtworkModalProps {
  eventBus: EventBus;
  onClose: () => void;
}

export default function AddArtworkModal({ eventBus, onClose }: AddArtworkModalProps) {
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');

  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const toggleStyle = (style: string) => {
    setSelectedStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
  };

  const addKeyword = () => {
    const kw = keywordInput.trim();
    if (kw && !keywords.includes(kw)) {
      setKeywords((prev) => [...prev, kw]);
    }
    setKeywordInput('');
  };

  const removeKeyword = (kw: string) => {
    setKeywords((prev) => prev.filter((k) => k !== kw));
  };

  const handleSubmit = () => {
    if (!title.trim() || !imageUrl.trim()) return;

    eventBus.emit('add', {
      title: title.trim(),
      imageUrl: imageUrl.trim(),
      colorTags: selectedColors,
      styleTags: selectedStyles,
      keywords,
    });
    onClose();
  };

  const isValid = title.trim() && imageUrl.trim();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content add-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <h2 className="modal-form-title">添加新作品</h2>

        <div className="form-body">
          <div className="form-group">
            <label className="form-label">标题 *</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入作品标题"
            />
          </div>

          <div className="form-group">
            <label className="form-label">图片URL *</label>
            <input
              type="text"
              className="form-input"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="输入图片URL地址"
            />
          </div>

          <div className="form-group">
            <label className="form-label">颜色标签</label>
            <div className="color-grid">
              {COLOR_PALETTE.map((color) => (
                <button
                  key={color}
                  className={`color-swatch ${selectedColors.includes(color) ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => toggleColor(color)}
                  title={color}
                />
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">风格标签</label>
            <div className="style-tags">
              {STYLE_OPTIONS.map((style) => (
                <button
                  key={style}
                  className={`style-tag ${selectedStyles.includes(style) ? 'active' : ''}`}
                  onClick={() => toggleStyle(style)}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">主题关键词</label>
            <div className="keyword-input-area">
              {keywords.map((kw) => (
                <span key={kw} className="keyword-chip">
                  {kw}
                  <button className="keyword-remove" onClick={() => removeKeyword(kw)}>
                    <X size={12} />
                  </button>
                </span>
              ))}
              <input
                type="text"
                className="keyword-input"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                placeholder="输入关键词后回车"
              />
            </div>
          </div>

          <button className="submit-btn" disabled={!isValid} onClick={handleSubmit}>
            添加作品
          </button>
        </div>
      </div>
    </div>
  );
}
