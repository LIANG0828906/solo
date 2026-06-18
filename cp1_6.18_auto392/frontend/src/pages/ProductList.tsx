import { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import type { Product, InquiryFormData } from '../types';
import './ProductList.css';

function ProductCard({ product, onViewDetail }: { product: Product; onViewDetail: (p: Product) => void }) {
  return (
    <div className="product-card">
      <div className="product-card-image">
        <img src={product.image_url} alt={product.name} />
        {product.stock === 0 && (
          <div className="stock-badge out-of-stock">售罄</div>
        )}
        {product.stock > 0 && product.stock <= 5 && (
          <div className="stock-badge low-stock">仅剩 {product.stock} 件</div>
        )}
      </div>
      <div className="product-card-content">
        <h3 className="product-card-title">{product.name}</h3>
        <p className="product-card-price">¥{product.price.toFixed(0)}</p>
        <button
          className="btn btn-primary btn-block"
          onClick={() => onViewDetail(product)}
        >
          查看详情
        </button>
      </div>
    </div>
  );
}

function ProductModal({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    customer_name: '',
    contact: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submitInquiry = useAppStore((state) => state.submitInquiry);

  useEffect(() => {
    if (product) {
      setSubmitted(false);
      setFormData({ customer_name: '', contact: '', message: '' });
    }
  }, [product]);

  if (!product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const inquiryData: InquiryFormData = {
        product_id: product.id,
        customer_name: formData.customer_name,
        contact: formData.contact,
        message: formData.message,
      };
      await submitInquiry(inquiryData);
      setSubmitted(true);
    } catch (err) {
      alert('提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal product-modal">
        <button className="modal-close" onClick={onClose}>
          ×
        </button>
        <div className="product-modal-image">
          <img src={product.image_url} alt={product.name} />
        </div>
        <div className="product-modal-content">
          <h2 className="product-modal-title">{product.name}</h2>
          <div className="product-modal-price">¥{product.price.toFixed(0)}</div>
          <div className={`stock-status ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
            {product.stock > 0 ? `库存：${product.stock} 件` : '暂时缺货'}
          </div>
          <p className="product-modal-description">{product.description}</p>

          {submitted ? (
            <div className="success-feedback">
              <div className="success-icon">✓</div>
              <h3>询价提交成功！</h3>
              <p>我们会尽快与您联系，请保持联系方式畅通。</p>
            </div>
          ) : (
            <form className="inquiry-form" onSubmit={handleSubmit}>
              <h3 className="form-title">定制询价</h3>
              <div className="form-group">
                <label htmlFor="customer_name">姓名 *</label>
                <input
                  type="text"
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_name: e.target.value })
                  }
                  placeholder="请输入您的姓名"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="contact">联系方式 *</label>
                <input
                  type="text"
                  id="contact"
                  value={formData.contact}
                  onChange={(e) =>
                    setFormData({ ...formData, contact: e.target.value })
                  }
                  placeholder="手机或邮箱"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="message">询价消息</label>
                <textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  placeholder="请描述您的定制需求..."
                  rows={4}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={submitting}
              >
                {submitting ? '提交中...' : '提交询价'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductList() {
  const { productList, loading, error, fetchProducts } = useAppStore();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  if (loading && productList.length === 0) {
    return (
      <div className="container">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  if (error && productList.length === 0) {
    return (
      <div className="container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">匠心之作</h1>
        <p className="page-subtitle">每一件手工皮具，都是时光与匠心的沉淀</p>
      </div>

      <div className="product-grid">
        {productList.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onViewDetail={setSelectedProduct}
          />
        ))}
      </div>

      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}

export default ProductList;
