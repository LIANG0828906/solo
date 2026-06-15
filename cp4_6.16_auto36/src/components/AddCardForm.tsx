import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Card } from '../types';
import { CARD_COLORS } from '../types';
import { useBoardStore } from '../store/boardStore';
import EmojiPicker from './EmojiPicker';

interface AddCardFormProps {
  boardId: string;
  x: number;
  y: number;
  onSubmit: () => void;
  onCancel: () => void;
}

const AddCardForm: React.FC<AddCardFormProps> = ({ boardId, x, y, onSubmit, onCancel }) => {
  const addCard = useBoardStore((s) => s.addCard);
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('💡');
  const [color, setColor] = useState<keyof typeof CARD_COLORS>('coral');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmed = title.trim();
    if (!trimmed) return;
    if (trimmed.length > 30) return;
    addCard(boardId, trimmed, emoji, color, x, y);
    onSubmit();
  }, [title, emoji, color, boardId, x, y, addCard, onSubmit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') onCancel();
  }, [handleSubmit, onCancel]);

  return (
    <div className="add-card-form-overlay" onClick={onCancel}>
      <div className="add-card-form" onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <h3 className="add-card-form-title">✨ 新建灵感卡片</h3>
        <div className="add-card-form-field">
          <label>标题</label>
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 30))}
            placeholder="输入灵感标题（最多30字）"
            maxLength={30}
          />
          <span className="char-count">{title.length}/30</span>
        </div>
        <div className="add-card-form-field">
          <label>Emoji</label>
          <EmojiPicker selected={emoji} onSelect={setEmoji} />
        </div>
        <div className="add-card-form-field">
          <label>颜色</label>
          <div className="color-selector">
            {(Object.keys(CARD_COLORS) as Array<keyof typeof CARD_COLORS>).map((key) => (
              <button
                key={key}
                type="button"
                className={`color-dot ${color === key ? 'selected' : ''}`}
                style={{ backgroundColor: CARD_COLORS[key].hex }}
                onClick={() => setColor(key)}
                title={CARD_COLORS[key].label}
              />
            ))}
          </div>
        </div>
        <div className="add-card-form-actions">
          <button type="button" className="btn-cancel" onClick={onCancel}>取消</button>
          <button type="button" className="btn-confirm" onClick={handleSubmit} disabled={!title.trim()}>确认</button>
        </div>
      </div>
    </div>
  );
};

export default AddCardForm;
