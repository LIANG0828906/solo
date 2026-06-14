import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { ProductCard } from '../components/ProductCard';
import type { Product } from '../api';

const categories: Array<Product['category']> = ['陶瓷', '木雕', '布艺', '其他'];

const defaultImage =
  'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=400&h=300&fit=crop';

export const Products: React.FC = () => {
  const { products, fetchProducts, addProduct } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    category: '陶瓷' as Product['category'],
    length: 10,
    width: 10,
    height: 10,
    stock: 1,
    price: 0,
    image: defaultImage,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || form.price <= 0 || form.stock <= 0) return;
    setSubmitting(true);
    try {
      await addProduct({
        name: form.name.trim(),
        category: form.category,
        dimensions: { length: form.length, width: form.width, height: form.height },
        stock: form.stock,
        price: Math.round(form.price * 100) / 100,
        image: form.image || defaultImage,
      });
      setShowModal(false);
      setForm({
        name: '',
        category: '陶瓷',
        length: 10,
        width: 10,
        height: 10,
        stock: 1,
        price: 0,
        image: defaultImage,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-fade-in">
      <div className="page-header">
        <h1 className="page-title">产品管理</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + 添加产品
        </button>
      </div>

      <div className="product-grid">
        <button className="add-product-card" onClick={() => setShowModal(true)}>
          <span className="add-product-card-icon">+</span>
          <span className="add-product-card-text">添加新产品</span>
        </button>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-content">
            <h2 className="modal-title">添加新产品</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">产品名称</label>
                <input
                  className="form-input"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="请输入产品名称"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">类别</label>
                <select
                  className="form-select"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as Product['category'] })}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-label" style={{ marginBottom: 8 }}>尺寸（cm）</div>
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div className="form-group">
                  <label className="form-label">长</label>
                  <input
                    className="form-input"
                    type="number"
                    min={1}
                    max={100}
                    value={form.length}
                    onChange={(e) =>
                      setForm({ ...form, length: Math.min(100, Math.max(1, Number(e.target.value) || 1)) })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">宽</label>
                  <input
                    className="form-input"
                    type="number"
                    min={1}
                    max={100}
                    value={form.width}
                    onChange={(e) =>
                      setForm({ ...form, width: Math.min(100, Math.max(1, Number(e.target.value) || 1)) })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">高</label>
                  <input
                    className="form-input"
                    type="number"
                    min={1}
                    max={100}
                    value={form.height}
                    onChange={(e) =>
                      setForm({ ...form, height: Math.min(100, Math.max(1, Number(e.target.value) || 1)) })
                    }
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">库存数量</label>
                  <input
                    className="form-input"
                    type="number"
                    min={1}
                    value={form.stock}
                    onChange={(e) =>
                      setForm({ ...form, stock: Math.max(1, Number(e.target.value) || 1) })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">单价（元）</label>
                  <input
                    className="form-input"
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: Math.max(0, Number(e.target.value) || 0) })
                    }
                  />
                </div>
                <div />
              </div>

              <div className="form-group">
                <label className="form-label">图片 URL</label>
                <input
                  className="form-input"
                  type="text"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  placeholder="请输入图片链接"
                />
              </div>

              {form.image && (
                <div className="form-group">
                  <label className="form-label">图片预览</label>
                  <img
                    src={form.image}
                    alt="预览"
                    style={{
                      width: '100%',
                      height: 160,
                      objectFit: 'cover',
                      borderRadius: 10,
                      border: '1px solid var(--color-border)',
                    }}
                    onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                  />
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowModal(false)}
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? '提交中...' : '确认添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
