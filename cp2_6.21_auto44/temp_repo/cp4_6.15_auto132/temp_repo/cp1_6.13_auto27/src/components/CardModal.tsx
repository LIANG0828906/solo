import React, { useState, useEffect, useRef } from 'react';
import type { Card } from '../types';

interface CardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (front: string, back: string) => void;
  onImport: (file: File) => Promise<void>;
  editingCard?: Card | null;
}

export const CardModal: React.FC<CardModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onImport,
  editingCard,
}) => {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      if (editingCard) {
        setFront(editingCard.front);
        setBack(editingCard.back);
      } else {
        setFront('');
        setBack('');
      }
    } else {
      setIsAnimating(false);
    }
  }, [isOpen, editingCard]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (front.trim() && back.trim()) {
      onSave(front.trim(), back.trim());
      setFront('');
      setBack('');
      onClose();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await onImport(file);
        onClose();
      } catch (error) {
        alert('文件导入失败，请检查文件格式');
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-content ${isAnimating ? 'modal-enter' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{editingCard ? '编辑卡片' : '添加卡片'}</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="front">正面（问题）</label>
            <textarea
              id="front"
              value={front}
              onChange={e => setFront(e.target.value)}
              placeholder="输入卡片正面内容..."
              rows={3}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="back">反面（答案）</label>
            <textarea
              id="back"
              value={back}
              onChange={e => setBack(e.target.value)}
              placeholder="输入卡片反面内容..."
              rows={3}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
              从文件导入
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <div className="modal-buttons">
              <button type="button" className="btn-secondary" onClick={onClose}>
                取消
              </button>
              <button type="submit" className="btn-primary" disabled={!front.trim() || !back.trim()}>
                {editingCard ? '保存' : '添加'}
              </button>
            </div>
          </div>
        </form>

        <div className="import-hint">
          <p>提示：Excel/CSV 文件格式要求：第一列为正面内容，第二列为反面内容</p>
        </div>
      </div>
    </div>
  );
};
