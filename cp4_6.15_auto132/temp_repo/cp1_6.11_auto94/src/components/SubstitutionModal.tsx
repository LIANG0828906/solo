import React, { useState, useEffect } from 'react';
import { Substitution, Ingredient } from '../types';

interface SubstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  ingredient: Ingredient | null;
  onConfirm: (substitution: Substitution, ingredientId: string) => void;
}

const SubstitutionModal: React.FC<SubstitutionModalProps> = ({
  isOpen,
  onClose,
  ingredient,
  onConfirm,
}) => {
  const [substitutions, setSubstitutions] = useState<Substitution[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !ingredient) {
      setSubstitutions([]);
      setSelectedId(null);
      return;
    }

    setLoading(true);
    setSelectedId(null);

    const controller = new AbortController();
    fetch(`/api/substitutions?ingredient=${encodeURIComponent(ingredient.name)}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data: Substitution[]) => {
        setSubstitutions(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, [isOpen, ingredient]);

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

  if (!isOpen || !ingredient) return null;

  const handleConfirm = () => {
    const selected = substitutions.find((s) => s.id === selectedId);
    if (selected) {
      onConfirm(selected, ingredient.id);
      onClose();
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">选择替换食材</h2>
          <button className="modal-close" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>

        <div className="modal-original">
          <strong>原食材：</strong>
          {ingredient.name} {ingredient.amount}
        </div>

        {loading ? (
          <div className="loading-container" style={{ minHeight: 200 }}>
            <div className="loading-spinner" style={{ width: 28, height: 28 }}></div>
            正在加载替换建议...
          </div>
        ) : (
          <div className="substitution-list">
            {substitutions.map((sub) => (
              <div
                key={sub.id}
                className={`substitution-option ${selectedId === sub.id ? 'selected' : ''}`}
                onClick={() => setSelectedId(sub.id)}
              >
                <div className="substitution-header">
                  <span className="substitution-name">{sub.substitute}</span>
                  <span className="substitution-amount">{sub.amount}</span>
                </div>
                <p className="substitution-texture">
                  <strong>口感变化：</strong>
                  {sub.textureChange}
                </p>
                <div
                  className={`substitution-time ${
                    sub.timeAdjustment < 0
                      ? 'negative'
                      : sub.timeAdjustment > 0
                      ? 'positive'
                      : 'neutral'
                  }`}
                >
                  {sub.timeAdjustment < 0
                    ? `⏱ 烹饪时间减少 ${Math.abs(sub.timeAdjustment)} 分钟`
                    : sub.timeAdjustment > 0
                    ? `⏱ 烹饪时间增加 ${sub.timeAdjustment} 分钟`
                    : '⏱ 烹饪时间不变'}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>
            取消
          </button>
          <button
            className="btn-confirm"
            onClick={handleConfirm}
            disabled={!selectedId || loading}
          >
            确认替换
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubstitutionModal;
