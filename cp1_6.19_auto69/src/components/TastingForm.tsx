import React, { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { RoastLevel, useTastingStore } from '../records/tastingStore';
import { getTagById } from '../data/flavorWheel';

interface TastingFormProps {
  selectedFlavorTags: string[];
  onRemoveTag: (tagId: string) => void;
  onClearTags: () => void;
}

interface FormErrors {
  coffeeName?: string;
  roastLevel?: string;
  flavorTags?: string;
}

const TastingForm: React.FC<TastingFormProps> = ({
  selectedFlavorTags,
  onRemoveTag,
  onClearTags,
}) => {
  const { addRecord } = useTastingStore();
  const [coffeeName, setCoffeeName] = useState('');
  const [roastLevel, setRoastLevel] = useState<RoastLevel | ''>('');
  const [acidity, setAcidity] = useState(3);
  const [bitterness, setBitterness] = useState(3);
  const [mouthfeel, setMouthfeel] = useState(3);
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!coffeeName.trim()) {
      newErrors.coffeeName = '请输入咖啡名称';
    }

    if (!roastLevel) {
      newErrors.roastLevel = '请选择烘焙度';
    }

    if (selectedFlavorTags.length === 0) {
      newErrors.flavorTags = '请至少选择一个风味标签';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [coffeeName, roastLevel, selectedFlavorTags.length]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!validate()) {
        toast.error('请完善表单信息');
        return;
      }

      try {
        addRecord({
          coffeeName: coffeeName.trim(),
          roastLevel: roastLevel as RoastLevel,
          flavorTags: selectedFlavorTags,
          acidity,
          bitterness,
          mouthfeel,
          rating: 0,
        });

        setCoffeeName('');
        setRoastLevel('');
        setAcidity(3);
        setBitterness(3);
        setMouthfeel(3);
        onClearTags();
        setErrors({});
      } catch {
        toast.error('保存失败，请重试');
      }
    },
    [validate, addRecord, coffeeName, roastLevel, selectedFlavorTags, acidity, bitterness, mouthfeel, onClearTags]
  );

  const roastOptions: { value: RoastLevel; label: string; className: string }[] = [
    { value: 'light', label: '浅', className: 'roast-light' },
    { value: 'medium', label: '中', className: 'roast-medium' },
    { value: 'dark', label: '深', className: 'roast-dark' },
  ];

  return (
    <div className="card">
      <form onSubmit={handleSubmit} className="form-section">
        <h2 className="form-title">品鉴记录</h2>

        <div className="form-group">
          <label className="form-label">咖啡名称</label>
          <input
            type="text"
            value={coffeeName}
            onChange={(e) => setCoffeeName(e.target.value)}
            placeholder="例如：埃塞俄比亚 耶加雪菲"
            className={`form-input ${errors.coffeeName ? 'error' : ''}`}
          />
          {errors.coffeeName && <p className="error-text">{errors.coffeeName}</p>}
        </div>

        <div className="form-group">
          <label className="form-label">烘焙度</label>
          <div className="roast-options">
            {roastOptions.map((option) => (
              <div
                key={option.value}
                className={`roast-option ${option.className}`}
                onClick={() => setRoastLevel(option.value)}
              >
                <div
                  className={`roast-radio ${roastLevel === option.value ? 'selected' : ''}`}
                >
                  {roastLevel === option.value && <div className="roast-radio-inner" />}
                </div>
                <span>{option.label}</span>
              </div>
            ))}
          </div>
          {errors.roastLevel && <p className="error-text">{errors.roastLevel}</p>}
        </div>

        <div className="form-group">
          <label className="form-label">
            风味标签 ({selectedFlavorTags.length}/5)
          </label>
          <div className="selected-flavors">
            {selectedFlavorTags.length === 0 ? (
              <span style={{ fontSize: '12px', color: '#8B7355' }}>
                点击左侧轮盘选择风味标签
              </span>
            ) : (
              selectedFlavorTags.map((tagId) => {
                const tag = getTagById(tagId);
                if (!tag) return null;
                return (
                  <span
                    key={tagId}
                    className="flavor-chip"
                    style={{ borderColor: tag.color, backgroundColor: `${tag.color}20` }}
                  >
                    {tag.name}
                    <span
                      className="flavor-chip-remove"
                      onClick={() => onRemoveTag(tagId)}
                    >
                      ×
                    </span>
                  </span>
                );
              })
            )}
          </div>
          {errors.flavorTags && <p className="error-text">{errors.flavorTags}</p>}
        </div>

        <div className="form-group">
          <label className="form-label">酸度</label>
          <div className="slider-container">
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={acidity}
              onChange={(e) => setAcidity(Number(e.target.value))}
              className="slider"
            />
            <div className="slider-value">{acidity} / 5</div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">苦度</label>
          <div className="slider-container">
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={bitterness}
              onChange={(e) => setBitterness(Number(e.target.value))}
              className="slider"
            />
            <div className="slider-value">{bitterness} / 5</div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">口感</label>
          <div className="slider-container">
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={mouthfeel}
              onChange={(e) => setMouthfeel(Number(e.target.value))}
              className="slider"
            />
            <div className="slider-value">{mouthfeel} / 5</div>
          </div>
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
          记录品尝
        </button>
      </form>
    </div>
  );
};

export default TastingForm;
