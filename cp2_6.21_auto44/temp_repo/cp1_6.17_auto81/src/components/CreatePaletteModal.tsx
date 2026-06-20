import { useState, useEffect, useRef } from 'react';
import { X, Plus, Shuffle } from 'lucide-react';
import { generateRandomPalette, isValidHex, normalizeHex } from '../utils/colorUtils';
import './CreatePaletteModal.css';

interface CreatePaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, colors: string[]) => void;
  initialData?: { name: string; colors: string[] };
  title?: string;
}

export function CreatePaletteModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  title = '新建色板',
}: CreatePaletteModalProps) {
  const [name, setName] = useState('');
  const [colors, setColors] = useState<string[]>(['#6C63FF', '#9D4EDD', '#F7931E', '#00B4D8', '#52B788']);
  const [nameError, setNameError] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name);
        setColors(initialData.colors);
      } else {
        setName('');
        setColors(generateRandomPalette());
      }
      setNameError('');
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleColorChange = (index: number, color: string) => {
    const newColors = [...colors];
    newColors[index] = color;
    setColors(newColors);
  };

  const handleAddColor = () => {
    if (colors.length < 5) {
      setColors([...colors, generateRandomPalette()[0]]);
    }
  };

  const handleRemoveColor = (index: number) => {
    if (colors.length > 1) {
      setColors(colors.filter((_, i) => i !== index));
    }
  };

  const handleRandomize = () => {
    setColors(generateRandomPalette());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setNameError('请输入色板名称');
      return;
    }

    const validColors = colors.filter((c) => isValidHex(c));
    if (validColors.length === 0) {
      return;
    }

    onSubmit(name.trim(), validColors.map(normalizeHex));
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" ref={modalRef}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="close-button" onClick={onClose} aria-label="关闭">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="palette-name">色板名称</label>
            <input
              id="palette-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError('');
              }}
              placeholder="请输入色板名称"
              className={nameError ? 'error' : ''}
            />
            {nameError && <span className="error-text">{nameError}</span>}
          </div>

          <div className="form-group">
            <div className="colors-header">
              <label>颜色列表</label>
              <button
                type="button"
                className="random-button"
                onClick={handleRandomize}
                aria-label="随机生成"
              >
                <Shuffle size={16} />
                <span>随机</span>
              </button>
            </div>

            <div className="color-inputs">
              {colors.map((color, index) => (
                <div key={index} className="color-input-wrapper">
                  <div className="color-input-container">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => handleColorChange(index, e.target.value)}
                      className="color-picker"
                      aria-label={`颜色 ${index + 1}`}
                    />
                    <div className="color-display" style={{ backgroundColor: color }}>
                      <span className="color-hex">{normalizeHex(color)}</span>
                    </div>
                  </div>
                  {colors.length > 1 && (
                    <button
                      type="button"
                      className="remove-color"
                      onClick={() => handleRemoveColor(index)}
                      aria-label="删除颜色"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}

              {colors.length < 5 && (
                <button
                  type="button"
                  className="add-color-button"
                  onClick={handleAddColor}
                  aria-label="添加颜色"
                >
                  <Plus size={20} />
                  <span>添加</span>
                </button>
              )}
            </div>
            <span className="hint-text">最多添加5个颜色</span>
          </div>

          <div className="modal-footer">
            <button type="button" className="cancel-button" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="submit-button">
              {initialData ? '保存' : '提交'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
