import React, { useState, useEffect, useRef } from 'react';
import type { RecipeCard } from '../types';
import './CardModal.css';

interface CardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<RecipeCard, 'id' | 'order' | 'boardId'>) => void;
  initialData?: RecipeCard | null;
}

const TOTAL_STEPS = 5;

export function CardModal({ isOpen, onClose, onSubmit, initialData }: CardModalProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    sourceUrl: '',
    coverImage: '',
    tags: '',
    difficulty: 0,
    notes: '',
  });
  const [isAnimating, setIsAnimating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      if (initialData) {
        setFormData({
          name: initialData.name,
          sourceUrl: initialData.sourceUrl,
          coverImage: initialData.coverImage,
          tags: initialData.tags.join(', '),
          difficulty: initialData.difficulty,
          notes: initialData.notes,
        });
      } else {
        setFormData({
          name: '',
          sourceUrl: '',
          coverImage: '',
          tags: '',
          difficulty: 0,
          notes: '',
        });
      }
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    if (isOpen && !isAnimating) {
      const timer = setTimeout(() => inputRef.current?.focus(), 300);
      return () => clearTimeout(timer);
    }
  }, [step, isOpen, isAnimating]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const goNext = () => {
    if (step < TOTAL_STEPS) {
      setIsAnimating(true);
      setTimeout(() => {
        setStep(step + 1);
        setIsAnimating(false);
      }, 200);
    }
  };

  const goPrev = () => {
    if (step > 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setStep(step - 1);
        setIsAnimating(false);
      }, 200);
    }
  };

  const handleSubmit = () => {
    const tagsArray = formData.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    onSubmit({
      name: formData.name,
      sourceUrl: formData.sourceUrl,
      coverImage: formData.coverImage || 'https://picsum.photos/seed/default-recipe/400/300',
      tags: tagsArray,
      difficulty: formData.difficulty,
      notes: formData.notes,
    });
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (step < TOTAL_STEPS) {
        goNext();
      } else {
        handleSubmit();
      }
    }
  };

  if (!isOpen) return null;

  const renderStep = () => {
    const animClass = isAnimating ? 'step-exit' : 'step-enter';

    switch (step) {
      case 1:
        return (
          <div className={`modal-step ${animClass}`}>
            <label className="modal-label">食谱名称</label>
            <input
              ref={inputRef}
              type="text"
              className="modal-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              onKeyDown={handleKeyDown}
              placeholder="例如：提拉米苏"
            />
            <p className="step-hint">给这道美食起个名字</p>
          </div>
        );
      case 2:
        return (
          <div className={`modal-step ${animClass}`}>
            <label className="modal-label">来源链接</label>
            <input
              ref={inputRef}
              type="url"
              className="modal-input"
              value={formData.sourceUrl}
              onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
              onKeyDown={handleKeyDown}
              placeholder="https://example.com/recipe"
            />
            <p className="step-hint">粘贴食谱的原始链接</p>
          </div>
        );
      case 3:
        return (
          <div className={`modal-step ${animClass}`}>
            <label className="modal-label">封面图片</label>
            <input
              ref={inputRef}
              type="url"
              className="modal-input"
              value={formData.coverImage}
              onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
              onKeyDown={handleKeyDown}
              placeholder="https://example.com/image.jpg"
            />
            <p className="step-hint">粘贴图片链接（可选）</p>
            {formData.coverImage && (
              <div className="image-preview">
                <img src={formData.coverImage} alt="预览" />
              </div>
            )}
          </div>
        );
      case 4:
        return (
          <div className={`modal-step ${animClass}`}>
            <label className="modal-label">标签</label>
            <input
              ref={inputRef}
              type="text"
              className="modal-input"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              onKeyDown={handleKeyDown}
              placeholder="早餐, 快手, 素食"
            />
            <p className="step-hint">用逗号分隔多个标签</p>
            <div className="tag-suggestions">
              <span>推荐：</span>
              {['早餐', '午餐', '晚餐', '甜点', '快手', '健康'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="tag-suggestion"
                  onClick={() => {
                    const current = formData.tags ? formData.tags + ', ' : '';
                    setFormData({ ...formData, tags: current + tag });
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        );
      case 5:
        return (
          <div className={`modal-step ${animClass}`}>
            <label className="modal-label">难度评级</label>
            <div className="difficulty-stars">
              {Array.from({ length: 5 }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`difficulty-star ${i < formData.difficulty ? 'filled' : ''}`}
                  onClick={() => setFormData({ ...formData, difficulty: i + 1 })}
                >
                  ★
                </button>
              ))}
            </div>
            <p className="step-hint">
              {formData.difficulty === 0 && '点击星星评级'}
              {formData.difficulty === 1 && '非常简单'}
              {formData.difficulty === 2 && '有点难度'}
              {formData.difficulty === 3 && '中等难度'}
              {formData.difficulty === 4 && '比较难'}
              {formData.difficulty === 5 && '大厨级别'}
            </p>
            <div className="notes-section">
              <label className="modal-label">个人笔记</label>
              <textarea
                className="modal-textarea"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="记录你的想法、修改或心得..."
                rows={3}
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>

        <div className="modal-header">
          <h2 className="modal-title">{initialData ? '编辑食谱' : '添加食谱'}</h2>
          <div className="step-indicator">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <div
                key={i}
                className={`step-dot ${i + 1 <= step ? 'active' : ''} ${i + 1 === step ? 'current' : ''}`}
              />
            ))}
          </div>
        </div>

        <div className="modal-body">{renderStep()}</div>

        <div className="modal-footer">
          <button
            className="modal-btn btn-secondary"
            onClick={step === 1 ? onClose : goPrev}
          >
            {step === 1 ? '取消' : '上一步'}
          </button>
          <button
            className="modal-btn btn-primary"
            onClick={step === TOTAL_STEPS ? handleSubmit : goNext}
            disabled={step === 1 && !formData.name.trim()}
          >
            {step === TOTAL_STEPS ? (initialData ? '保存修改' : '添加') : '下一步'}
          </button>
        </div>
      </div>
    </div>
  );
}
