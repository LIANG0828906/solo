import { useState, useEffect } from 'react';
import { Product } from '../store';
import './ProductForm.css';

interface Props {
  product: Product | null;
  boothId: string;
  onClose: () => void;
  onSaved: () => void;
}

const categories = ['饰品', '陶艺', '布艺', '其他'];

function ProductForm({ product, boothId, onClose, onSaved }: Props) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    image: '',
    category: '其他',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        image: product.image,
        category: product.category,
      });
    }
  }, [product]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('商品名称不能为空');
      return;
    }

    if (!formData.image.trim()) {
      setError('商品图片不能为空');
      return;
    }

    if (formData.price < 0) {
      setError('价格不能为负数');
      return;
    }

    setLoading(true);

    try {
      const url = product
        ? `/api/product/${product.id}`
        : `/api/booth/${boothId}/products`;
      
      const method = product ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '保存失败');
      }

      onSaved();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div
      className={`form-modal-overlay ${isClosing ? 'closing' : ''}`}
      onClick={handleBackdropClick}
    >
      <div className={`form-modal ${isClosing ? 'closing' : ''}`}>
        <div className="form-modal-header">
          <h2>{product ? '编辑商品' : '添加商品'}</h2>
          <button className="close-btn" onClick={handleClose}>✕</button>
        </div>

        {error && <div className="error-banner small">{error}</div>}

        <form className="product-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>商品名称 *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="请输入商品名称"
              maxLength={50}
            />
          </div>

          <div className="form-group">
            <label>商品图片URL *</label>
            <input
              type="text"
              value={formData.image}
              onChange={(e) => handleChange('image', e.target.value)}
              placeholder="请输入图片链接"
            />
            {formData.image && (
              <div className="image-preview">
                <img src={formData.image} alt="预览" />
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>价格 (元) *</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
              />
            </div>

            <div className="form-group">
              <label>分类</label>
              <select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>商品描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="请输入商品描述"
              rows={4}
              maxLength={500}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={handleClose}>
              取消
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProductForm;
