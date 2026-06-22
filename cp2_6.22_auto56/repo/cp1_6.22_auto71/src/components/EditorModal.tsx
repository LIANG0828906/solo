import React, { useState, useEffect } from 'react';
import { InspirationCard, TagColor, TAG_COLORS, EMOJI_OPTIONS } from '@/types';
import { getColorHex } from '@/utils';
import styles from '@/styles/EditorModal.module.css';

interface EditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, content: string, color: TagColor, emoji?: string) => void;
  editingCard?: InspirationCard | null;
}

const EditorModal: React.FC<EditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingCard,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedColor, setSelectedColor] = useState<TagColor>('dustyBlue');
  const [selectedEmoji, setSelectedEmoji] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (isOpen) {
      if (editingCard) {
        setTitle(editingCard.title);
        setContent(editingCard.content);
        setSelectedColor(editingCard.color);
        setSelectedEmoji(editingCard.emoji);
      } else {
        setTitle('');
        setContent('');
        setSelectedColor('dustyBlue');
        setSelectedEmoji(undefined);
      }
    }
  }, [isOpen, editingCard]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave(title.trim(), content.trim(), selectedColor, selectedEmoji);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  const isTitleValid = title.trim().length > 0 && title.length <= 50;
  const isContentValid = content.length <= 500;
  const canSubmit = isTitleValid && isContentValid;

  return (
    <div className={styles.overlay} onClick={handleBackdropClick}>
      <div className={styles.backdrop} />
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {editingCard ? '编辑灵感' : '新灵感'}
          </h2>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="关闭"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>标题</label>
            <input
              type="text"
              className={styles.input}
              placeholder="给你的灵感起个名字..."
              value={title}
              onChange={e => setTitle(e.target.value.slice(0, 50))}
              autoFocus
            />
            <span
              className={`${styles.charCount} ${
                title.length > 40 ? styles.warning : ''
              }`}
            >
              {title.length}/50
            </span>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>内容</label>
            <textarea
              className={styles.textarea}
              placeholder="记录你的灵感细节..."
              value={content}
              onChange={e => setContent(e.target.value.slice(0, 500))}
            />
            <span
              className={`${styles.charCount} ${
                content.length > 400 ? styles.warning : ''
              }`}
            >
              {content.length}/500
            </span>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>颜色标签</label>
            <div className={styles.colorGrid}>
              {TAG_COLORS.map(colorOption => (
                <div
                  key={colorOption.value}
                  className={`${styles.colorOption} ${
                    selectedColor === colorOption.value ? styles.selected : ''
                  }`}
                  style={{
                    backgroundColor: colorOption.hex,
                    color: getColorHex(colorOption.value),
                  }}
                  onClick={() => setSelectedColor(colorOption.value)}
                  title={colorOption.label}
                />
              ))}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>表情图标（可选）</label>
            <div className={styles.emojiGrid}>
              <div
                className={`${styles.emojiOption} ${styles.clear} ${
                  selectedEmoji === undefined ? styles.selected : ''
                }`}
                onClick={() => setSelectedEmoji(undefined)}
                title="无图标"
              >
                ∅
              </div>
              {EMOJI_OPTIONS.map(emoji => (
                <div
                  key={emoji}
                  className={`${styles.emojiOption} ${
                    selectedEmoji === emoji ? styles.selected : ''
                  }`}
                  onClick={() => setSelectedEmoji(emoji)}
                >
                  {emoji}
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={!canSubmit}
          >
            <span>{editingCard ? '💾' : '✨'}</span>
            <span>{editingCard ? '保存修改' : '记录灵感'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditorModal;
