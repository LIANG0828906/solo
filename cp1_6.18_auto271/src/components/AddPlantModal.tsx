import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePlantStore } from '../store/plantStore';

const CATEGORIES = ['多肉', '观叶', '开花', '其他'] as const;
type Category = (typeof CATEGORIES)[number];

interface FormData {
  name: string;
  category: Category;
  waterFrequency: number;
  photo: string;
}

interface FormErrors {
  name?: string;
  waterFrequency?: string;
  photo?: string;
}

interface AddPlantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddPlantModal: React.FC<AddPlantModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { addPlant } = usePlantStore();
  const [isClosing, setIsClosing] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    category: '多肉',
    waterFrequency: 3,
    photo: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      setFormData({
        name: '',
        category: '多肉',
        waterFrequency: 3,
        photo: '',
      });
      setErrors({});
      setSubmitting(false);
    }
  }, [isOpen]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isClosing) {
        handleClose();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isOpen, isClosing]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 280);
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = '请输入植物名称';
    }

    if (
      !formData.waterFrequency ||
      formData.waterFrequency < 1 ||
      formData.waterFrequency > 60
    ) {
      newErrors.waterFrequency = '请输入1-60之间的天数';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        photo: '仅支持 JPG 和 PNG 格式',
      }));
      return;
    }

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrors((prev) => ({
        ...prev,
        photo: '图片大小不能超过 2MB',
      }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      localStorage.setItem(`plant_photo_${Date.now()}`, result);
      setFormData((prev) => ({ ...prev, photo: result }));
      setErrors((prev) => {
        const { photo, ...rest } = prev;
        return rest;
      });
    };
    reader.onerror = () => {
      setErrors((prev) => ({ ...prev, photo: '图片读取失败' }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || submitting) return;

    setSubmitting(true);
    try {
      const result = await addPlant({
        name: formData.name.trim(),
        category: formData.category,
        waterFrequency: formData.waterFrequency,
        photo: formData.photo || undefined,
      });
      if (result) {
        handleClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen && !isClosing) return null;

  return (
    <div
      className={`modal-overlay ${isClosing ? 'closing' : ''}`}
      onClick={handleClose}
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">添加新植物</h2>
          <button
            className="modal-close"
            onClick={handleClose}
            aria-label="关闭"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="plant-name">
              植物名称 *
            </label>
            <input
              id="plant-name"
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, name: e.target.value }));
                if (errors.name) {
                  setErrors((prev) => {
                    const { name, ...rest } = prev;
                    return rest;
                  });
                }
              }}
              placeholder="给你的植物起个名字吧"
              autoFocus
            />
            {errors.name && <div className="form-error">{errors.name}</div>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="plant-category">
              种类 *
            </label>
            <select
              id="plant-category"
              className="form-select"
              value={formData.category}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  category: e.target.value as Category,
                }))
              }
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="water-frequency">
              浇水频率（天）*
            </label>
            <input
              id="water-frequency"
              type="number"
              min={1}
              max={60}
              className="form-input"
              value={formData.waterFrequency}
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  waterFrequency: parseInt(e.target.value, 10) || 1,
                }));
                if (errors.waterFrequency) {
                  setErrors((prev) => {
                    const { waterFrequency, ...rest } = prev;
                    return rest;
                  });
                }
              }}
            />
            {errors.waterFrequency && (
              <div className="form-error">{errors.waterFrequency}</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="plant-photo">
              上传照片（可选）
            </label>
            <input
              id="plant-photo"
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              className="file-input"
              onChange={handleFileChange}
            />
            {formData.photo && (
              <div style={{ marginTop: 8 }}>
                <img
                  src={formData.photo}
                  alt="预览"
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 8,
                    objectFit: 'cover',
                  }}
                />
              </div>
            )}
            {errors.photo && <div className="form-error">{errors.photo}</div>}
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={handleClose}
              disabled={submitting}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? '添加中...' : '添加植物'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPlantModal;
