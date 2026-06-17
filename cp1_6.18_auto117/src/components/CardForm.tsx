import React, { useState, useRef, useEffect } from 'react';
import type { Card } from '../types/card';
import { PRESET_COLORS, DEFAULT_COLOR } from '../types/card';
import { useCardStore } from '../data/cardStore';
import './CardForm.css';

interface CardFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingCard?: Card | null;
}

export const CardForm: React.FC<CardFormProps> = ({
  isOpen,
  onClose,
  editingCard,
}) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [keywordsInput, setKeywordsInput] = useState('');

  const titleInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const addCard = useCardStore((state) => state.addCard);
  const updateCard = useCardStore((state) => state.updateCard);

  useEffect(() => {
    if (isOpen) {
      if (editingCard) {
        setTitle(editingCard.title);
        setBody(editingCard.body);
        setColor(editingCard.color);
        setKeywordsInput(editingCard.keywords.join(', '));
      } else {
        setTitle('');
        setBody('');
        setColor(DEFAULT_COLOR);
        setKeywordsInput('');
      }
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, editingCard]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(e.target as Node) &&
        isOpen
      ) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const keywords = keywordsInput
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    if (editingCard) {
      updateCard(editingCard.id, {
        title: title.trim(),
        body: body.trim(),
        color,
        keywords,
      });
    } else {
      addCard({
        title: title.trim(),
        body: body.trim(),
        color,
        keywords,
      });
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container" ref={modalRef}>
        <div className="modal-header">
          <h2 className="modal-title">
            {editingCard ? '编辑卡片' : '新建卡片'}
          </h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="关闭">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">标题</label>
            <input
              ref={titleInputRef}
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="给你的灵感起个标题..."
              maxLength={100}
              autoComplete="off"
            />
          </div>

          <div className="form-group">
            <label className="form-label">正文</label>
            <textarea
              className="form-textarea"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="记录你的灵感细节..."
              rows={5}
              maxLength={500}
            />
          </div>

          <div className="form-group">
            <label className="form-label">颜色标签</label>
            <div className="color-selector">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`color-btn ${color === c ? 'active' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                  aria-label={`选择颜色 ${c}`}
                />
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">关键词</label>
            <input
              type="text"
              className="form-input"
              value={keywordsInput}
              onChange={(e) => setKeywordsInput(e.target.value)}
              placeholder="用逗号分隔，如：创意, 设计, 产品"
              autoComplete="off"
            />
            <span className="form-hint">多个关键词用英文逗号分隔</span>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!title.trim() && !body.trim()}
            >
              {editingCard ? '保存修改' : '创建卡片'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
