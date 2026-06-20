import { useState } from 'react';
import { COLOR_PALETTE } from '../types';

interface MessageFormProps {
  onSubmit: (content: string, color: string) => void;
}

const MessageForm = ({ onSubmit }: MessageFormProps) => {
  const [content, setContent] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0]);
  const maxLength = 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() && content.length <= maxLength) {
      onSubmit(content.trim(), selectedColor);
      setContent('');
    }
  };

  const charCount = content.length;
  const isWarning = charCount > maxLength * 0.8;
  const isDisabled = charCount === 0 || charCount > maxLength;

  return (
    <div className="message-form-container">
      <form className="message-form" onSubmit={handleSubmit}>
        <div className="color-picker">
          <span className="color-picker-label">选择颜色</span>
          <div className="color-palette">
            {COLOR_PALETTE.map((color) => (
              <div
                key={color}
                className={`color-option ${selectedColor === color ? 'selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setSelectedColor(color)}
              />
            ))}
          </div>
        </div>
        <div className="form-input-wrapper">
          <textarea
            className="message-input"
            placeholder="写下你的留言..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={maxLength}
            rows={2}
          />
          <span className={`char-count ${isWarning ? 'warning' : ''}`}>
            {charCount}/{maxLength}
          </span>
        </div>
        <button
          type="submit"
          className="submit-btn"
          disabled={isDisabled}
        >
          发送
        </button>
      </form>
    </div>
  );
};

export default MessageForm;
