import { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import type { Product, ProductFormData } from '../types';
import './Admin.css';

type TabType = 'products' | 'inquiries';

function ProductFormModal({
  isOpen,
  onClose,
  product,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSubmit: (data: ProductFormData) => Promise<void>;
}) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: 0,
    image_url: '',
    stock: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        image_url: product.image_url,
        stock: product.stock,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        price: 0,
        image_url: '',
        stock: 0,
      });
    }
  }, [product, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      alert('保存失败，请稍后重试');
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
      <div className="modal form-modal">
        <button className="modal-close" onClick={onClose}>
          ×
        </button>
        <h2 className="form-modal-title">
          {product ? '编辑产品' : '新增产品'}
        </h2>
        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>产品名称 *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="请输入产品名称"
                required
              />
            </div>
          </div>
          <div className="form-row form-row-2">
            <div className="form-group">
              <label>价格 (¥) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                }
                placeholder="0.00"
                required
              />
            </div>
            <div className="form-group">
              <label>库存数量 *</label>
              <input
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) =>
                  setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })
                }
                placeholder="0"
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>图片 URL</label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) =>
                setFormData({ ...formData, image_url: e.target.value })
              }
              placeholder="https://..."
            />
          </div>
          <div className="form-group">
            <label>产品描述</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="请输入产品描述"
              rows={4}
            />
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}) {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal confirm-modal">
        <h3 className="confirm-title">{title}</h3>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            取消
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            确认删除
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductsView() {
  const { productList, loading, fetchProducts, addProduct, updateProduct, deleteProduct } =
    useAppStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleAdd = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (product: Product) => {
    setDeleteTarget(product);
  };

  const handleConfirmDelete = async () => {
    if (deleteTarget) {
      try {
        await deleteProduct(deleteTarget.id);
        setDeleteTarget(null);
      } catch (err) {
        // 错误已在 store 中处理
      }
    }
  };

  const handleFormSubmit = async (data: ProductFormData) => {
    if (editingProduct) {
      await updateProduct(editingProduct.id, data);
    } else {
      await addProduct(data);
    }
  };

  return (
    <div className="admin-view">
      <div className="admin-view-header">
        <h2 className="admin-view-title">产品管理</h2>
        <button className="btn btn-primary" onClick={handleAdd}>
          + 新增产品
        </button>
      </div>

      {loading && productList.length === 0 ? (
        <div className="loading">加载中...</div>
      ) : (
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>产品名称</th>
                <th>价格</th>
                <th>库存</th>
                <th>创建时间</th>
                <th style={{ width: '160px' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {productList.map((product) => (
                <tr key={product.id}>
                  <td className="product-name-cell">
                    <img
                      src={product.image_url}
                      alt=""
                      className="product-thumb"
                    />
                    <span>{product.name}</span>
                  </td>
                  <td>¥{product.price.toFixed(0)}</td>
                  <td>
                    <span
                      className={`stock-tag ${
                        product.stock > 5
                          ? 'in-stock'
                          : product.stock > 0
                          ? 'low-stock'
                          : 'out-of-stock'
                      }`}
                    >
                      {product.stock}
                    </span>
                  </td>
                  <td>{new Date(product.created_at).toLocaleDateString('zh-CN')}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => handleEdit(product)}
                      >
                        编辑
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteClick(product)}
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {productList.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty-state">
                    暂无产品，点击右上角"新增产品"添加
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <ProductFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        product={editingProduct}
        onSubmit={handleFormSubmit}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="确认删除产品"
        message={`确定要删除"${deleteTarget?.name}"吗？此操作不可撤销。`}
      />
    </div>
  );
}

function InquiriesView() {
  const { inquiryList, productList, loading, fetchInquiries, fetchProducts } =
    useAppStore();

  useEffect(() => {
    fetchInquiries();
    fetchProducts();
  }, [fetchInquiries, fetchProducts]);

  const getProductName = (productId: number) => {
    const product = productList.find((p) => p.id === productId);
    return product ? product.name : '未知产品';
  };

  return (
    <div className="admin-view">
      <div className="admin-view-header">
        <h2 className="admin-view-title">询价管理</h2>
        <span className="inquiry-count">
          共 {inquiryList.length} 条询价记录
        </span>
      </div>

      {loading && inquiryList.length === 0 ? (
        <div className="loading">加载中...</div>
      ) : (
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>产品名称</th>
                <th>客户姓名</th>
                <th>联系方式</th>
                <th>询价消息</th>
                <th style={{ width: '180px' }}>提交时间</th>
              </tr>
            </thead>
            <tbody>
              {inquiryList.map((inquiry) => (
                <tr key={inquiry.id}>
                  <td className="product-name-cell">
                    {getProductName(inquiry.product_id)}
                  </td>
                  <td>{inquiry.customer_name}</td>
                  <td>{inquiry.contact}</td>
                  <td className="message-cell">
                    <div className="message-text">{inquiry.message || '-'}</div>
                  </td>
                  <td className="time-cell">
                    {new Date(inquiry.created_at).toLocaleString('zh-CN')}
                  </td>
                </tr>
              ))}
              {inquiryList.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty-state">
                    暂无询价记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Admin() {
  const [activeTab, setActiveTab] = useState<TabType>('products');

  return (
    <div className="container admin-page">
      <div className="admin-header">
        <h1 className="admin-title">后台管理</h1>
        <p className="admin-subtitle">管理您的产品和查看客户询价记录</p>
      </div>

      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          产品管理
        </button>
        <button
          className={`tab-btn ${activeTab === 'inquiries' ? 'active' : ''}`}
          onClick={() => setActiveTab('inquiries')}
        >
          询价管理
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'products' && <ProductsView />}
        {activeTab === 'inquiries' && <InquiriesView />}
      </div>
    </div>
  );
}

export default Admin;
