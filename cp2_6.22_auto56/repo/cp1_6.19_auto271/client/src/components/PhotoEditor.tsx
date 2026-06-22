import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppStore } from '../store';
import { photoApi } from '../api';
import {
  FilterType,
  FILTER_NAMES,
  FILTER_CSS,
  PrintSize,
  SIZE_NAMES,
  SIZE_PRICES
} from '../types';

const FILTERS: FilterType[] = ['original', 'warm', 'cool', 'mono', 'vintage'];

interface PhotoEditorProps {
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

function PhotoEditor({ showToast }: PhotoEditorProps) {
  const {
    editingPhoto,
    closeEditor,
    updatePhoto,
    addToCart,
    setLoading
  } = useAppStore();

  const [selectedFilter, setSelectedFilter] = useState<FilterType>('original');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [selectedSize, setSelectedSize] = useState<PrintSize>('6inch');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (editingPhoto) {
      setSelectedFilter(editingPhoto.filter);
      setBrightness(editingPhoto.brightness);
      setContrast(editingPhoto.contrast);
    }
  }, [editingPhoto]);

  const previewFilter = useMemo(() => {
    const baseFilter = FILTER_CSS[selectedFilter] || 'none';
    const adjustments = `brightness(${brightness}%) contrast(${contrast}%)`;
    if (baseFilter === 'none') return adjustments;
    return `${baseFilter} ${adjustments}`;
  }, [selectedFilter, brightness, contrast]);

  const handleConfirm = useCallback(async () => {
    if (!editingPhoto) return;

    setLoading(true);
    const startTime = Date.now();
    try {
      const updated = await photoApi.applyFilter(
        editingPhoto.id,
        selectedFilter,
        brightness,
        contrast
      );
      const elapsed = Date.now() - startTime;
      if (updated) {
        updatePhoto(updated);
        showToast(`滤镜应用成功（${elapsed}ms）`);
      }
    } catch (err) {
      console.error('应用滤镜失败:', err);
      showToast('应用滤镜失败，请重试', 'error');
    } finally {
      setLoading(false);
    }
  }, [editingPhoto, selectedFilter, brightness, contrast, updatePhoto, setLoading, showToast]);

  const handleReset = useCallback(() => {
    setSelectedFilter('original');
    setBrightness(100);
    setContrast(100);
  }, []);

  const handleAddToCart = useCallback(() => {
    if (!editingPhoto) return;
    addToCart(editingPhoto, selectedSize, quantity);
    showToast(`已加入购物车：${SIZE_NAMES[selectedSize]} ×${quantity} (¥${(SIZE_PRICES[selectedSize] * quantity).toFixed(2)})`);
  }, [editingPhoto, selectedSize, quantity, addToCart, showToast]);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) closeEditor();
  }, [closeEditor]);

  if (!editingPhoto) return null;

  const itemPrice = SIZE_PRICES[selectedSize] * quantity;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">🎨 照片编辑</h2>
          <button
            className="modal-close"
            onClick={closeEditor}
            aria-label="关闭"
          >
            ✕
          </button>
        </div>

        <div className="editor-body">
          <div className="editor-preview">
            <img
              className="editor-preview-image"
              src={editingPhoto.originalUrl}
              alt="预览"
              style={{ filter: previewFilter }}
            />
          </div>

          <div className="editor-panel">
            <div className="panel-section">
              <div className="panel-section-title">滤镜效果</div>
              <div className="filter-grid">
                {FILTERS.map(filter => (
                  <div
                    key={filter}
                    className={`filter-option ${selectedFilter === filter ? 'selected' : ''}`}
                    onClick={() => setSelectedFilter(filter)}
                  >
                    <img
                      className="filter-thumb"
                      src={editingPhoto.thumbnailUrl}
                      alt={FILTER_NAMES[filter]}
                      style={{
                        filter: `${FILTER_CSS[filter]} brightness(${brightness}%) contrast(${contrast}%)`
                      }}
                    />
                    <span className="filter-name">{FILTER_NAMES[filter]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel-section">
              <div className="panel-section-title">参数调节</div>
              <div className="slider-group">
                <div className="slider-item">
                  <div className="slider-label">
                    <span>亮度</span>
                    <span className="slider-value">{brightness}%</span>
                  </div>
                  <input
                    type="range"
                    className="slider"
                    min="50"
                    max="150"
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                  />
                </div>
                <div className="slider-item">
                  <div className="slider-label">
                    <span>对比度</span>
                    <span className="slider-value">{contrast}%</span>
                  </div>
                  <input
                    type="range"
                    className="slider"
                    min="50"
                    max="150"
                    value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <div className="panel-section">
              <div className="panel-section-title">冲印规格</div>
              <div className="slider-group">
                <div className="slider-item">
                  <div className="slider-label">
                    <span>尺寸</span>
                    <span className="slider-value">
                      {SIZE_NAMES[selectedSize]} · ¥{SIZE_PRICES[selectedSize].toFixed(2)}/张
                    </span>
                  </div>
                  <select
                    className="size-select"
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value as PrintSize)}
                  >
                    <option value="6inch">6寸 (4×6英寸) · ¥1.50</option>
                    <option value="7inch">7寸 (5×7英寸) · ¥2.00</option>
                    <option value="8inch">8寸 (6×8英寸) · ¥3.00</option>
                  </select>
                </div>
                <div className="slider-item">
                  <div className="slider-label">
                    <span>数量</span>
                    <span className="slider-value">{quantity} 张</span>
                  </div>
                  <div className="quantity-control">
                    <button
                      className="quantity-btn"
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                    >
                      −
                    </button>
                    <span className="quantity-value">{quantity}</span>
                    <button
                      className="quantity-btn"
                      onClick={() => setQuantity(q => Math.min(10, q + 1))}
                      disabled={quantity >= 10}
                    >
                      ＋
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="editor-actions">
              <button className="btn btn-secondary" onClick={handleReset}>
                重置
              </button>
              <button className="btn btn-primary" onClick={handleConfirm}>
                确认应用
              </button>
            </div>

            <div className="cart-summary" style={{ marginTop: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontWeight: 600, color: '#5D4037' }}>
                  小计：{SIZE_NAMES[selectedSize]} × {quantity}
                </span>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#D35400' }}>
                  ¥{itemPrice.toFixed(2)}
                </span>
              </div>
              <button
                className="btn btn-accent"
                onClick={handleAddToCart}
                style={{ width: '100%', flex: 'none' }}
              >
                🛒 加入购物车
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PhotoEditor;
