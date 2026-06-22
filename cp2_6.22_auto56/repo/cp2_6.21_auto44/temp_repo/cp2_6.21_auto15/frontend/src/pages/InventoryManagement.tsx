import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { getGoodsList, createProduct, updateProduct, updateStock } from '../api/goodsApi';
import type { Product } from '../types';
import RippleButton from '../components/RippleButton';

interface FormData {
  name: string;
  category: string;
  price: string;
  stock: string;
  image_url: string;
}

const InventoryManagement: React.FC = () => {
  const navigate = useNavigate();
  const { isLoggedIn, showToast, loadProducts } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    category: '',
    price: '',
    stock: '',
    image_url: '',
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const warningRef = useRef<HTMLDivElement>(null);

  const hasLowStock = useMemo(() => {
    return products.some((p) => p.stock < 20);
  }, [products]);

  const lowStockProducts = useMemo(() => {
    return products.filter((p) => p.stock < 20);
  }, [products]);

  useEffect(() => {
    if (!isLoggedIn) {
      showToast('请先登录', 'warning');
      navigate('/login');
      return;
    }
    fetchProducts();

    const interval = setInterval(() => {
      fetchProducts();
    }, 5000);

    return () => clearInterval(interval);
  }, [isLoggedIn, navigate, showToast]);

  useEffect(() => {
    if (hasLowStock) {
      setShowWarning(true);
      const timer = setTimeout(() => {
        setShowWarning(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [hasLowStock]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await getGoodsList();
      setProducts(data);
      loadProducts(data);
    } catch (error) {
      showToast('获取商品列表失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category: '',
      price: '',
      stock: '',
      image_url: '',
    });
    setShowModal(true);
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      stock: product.stock.toString(),
      image_url: product.image_url,
    });
    setShowModal(true);
    setShowWarning(false);
  };

  const handleDeleteClick = async (productId: number) => {
    try {
      await updateStock(productId, 0);
      setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, stock: 0 } : p)));
      showToast('商品已下架', 'success');
    } catch (error) {
      showToast('下架失败', 'error');
    }
    setShowDeleteConfirm(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.category.trim() || !formData.price || !formData.stock) {
      showToast('请填写完整信息', 'warning');
      return;
    }

    setSaving(true);
    try {
      const productData = {
        name: formData.name.trim(),
        category: formData.category.trim(),
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        image_url: formData.image_url.trim() || '',
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
        showToast('商品更新成功', 'success');
      } else {
        await createProduct(productData);
        showToast('商品创建成功', 'success');
      }
      setShowModal(false);
      fetchProducts();
    } catch (error) {
      showToast(editingProduct ? '更新失败' : '创建失败', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { text: '已售罄', color: '#ef4444', bg: '#fee2e2' };
    if (stock < 20) return { text: '即将售罄', color: '#dc2626', bg: '#fef2f2' };
    if (stock < 50) return { text: '库存紧张', color: '#f59e0b', bg: '#fffbeb' };
    return { text: '库存充足', color: '#10b981', bg: '#ecfdf5' };
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px' }}>
      {showWarning && hasLowStock && (
        <div
          ref={warningRef}
          onClick={() => lowStockProducts.length > 0 && handleEditClick(lowStockProducts[0])}
          style={{
            position: 'relative',
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            padding: '16px 24px',
            borderRadius: '12px',
            marginBottom: '24px',
            cursor: lowStockProducts.length > 0 ? 'pointer' : 'default',
            border: '1px solid #fecaca',
            animation: 'shake 0.5s ease-in-out, fadeInOut 3s ease-in-out forwards',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>
                库存预警：有 {lowStockProducts.length} 个商品库存不足
              </div>
              <div style={{ fontSize: '13px', opacity: 0.9 }}>
                点击跳转至第一个低库存商品进行编辑
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {lowStockProducts.slice(0, 3).map((p) => (
                <span
                  key={p.id}
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 500,
                  }}
                >
                  {p.name}: {p.stock}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', margin: '0 0 8px 0' }}>
            库存管理
          </h1>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
            管理商品信息和库存，每5秒自动刷新
          </p>
        </div>
        <RippleButton
          onClick={handleAddClick}
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          <span style={{ marginRight: '6px' }}>+</span>
          新增商品
        </RippleButton>
      </div>

      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <div style={{ padding: '80px 0', textAlign: 'center' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '3px solid #e5e7eb',
                borderTopColor: '#4f46e5',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto',
              }}
            />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={thStyle}>商品</th>
                  <th style={thStyle}>分类</th>
                  <th style={thStyle}>价格</th>
                  <th style={thStyle}>库存</th>
                  <th style={thStyle}>状态</th>
                  <th style={thStyle}>操作</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const status = getStockStatus(product.stock);
                  const isLow = product.stock < 20;
                  return (
                    <tr
                      key={product.id}
                      style={{
                        borderTop: '1px solid #e5e7eb',
                        transition: 'background-color 0.2s ease',
                        backgroundColor: isLow ? 'rgba(254, 226, 226, 0.3)' : 'transparent',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = isLow
                          ? 'rgba(254, 226, 226, 0.5)'
                          : '#f9fafb';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = isLow
                          ? 'rgba(254, 226, 226, 0.3)'
                          : 'transparent';
                      }}
                    >
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '8px',
                              backgroundColor: '#f3f4f6',
                              overflow: 'hidden',
                              flexShrink: 0,
                            }}
                          >
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '24px',
                                }}
                              >
                                🛍️
                              </div>
                            )}
                          </div>
                          <span
                            style={{
                              fontWeight: 500,
                              color: product.stock === 0 ? '#9ca3af' : '#1f2937',
                              textDecoration: product.stock === 0 ? 'line-through' : 'none',
                            }}
                          >
                            {product.name}
                          </span>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <span
                          style={{
                            backgroundColor: '#ede9fe',
                            color: '#5b21b6',
                            padding: '4px 12px',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: 500,
                          }}
                        >
                          {product.category}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 600, color: '#4f46e5' }}>
                        ¥{product.price.toFixed(2)}
                      </td>
                      <td style={{ ...tdStyle, fontWeight: isLow ? 600 : 400 }}>
                        <span style={{ color: isLow ? '#ef4444' : '#1f2937', fontSize: '15px' }}>
                          {product.stock}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span
                          style={{
                            backgroundColor: status.bg,
                            color: status.color,
                            padding: '4px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                          }}
                        >
                          {status.text}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <RippleButton
                            variant="outline"
                            onClick={() => handleEditClick(product)}
                            style={{
                              padding: '6px 14px',
                              fontSize: '12px',
                              borderColor: '#4f46e5',
                              color: '#4f46e5',
                            }}
                          >
                            编辑
                          </RippleButton>
                          {product.stock > 0 && (
                            <RippleButton
                              variant="secondary"
                              onClick={() => setShowDeleteConfirm(product.id)}
                              style={{
                                padding: '6px 14px',
                                fontSize: '12px',
                                backgroundColor: '#ef4444',
                              }}
                            >
                              下架
                            </RippleButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && products.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
            <div>暂无商品，点击右上角"新增商品"开始添加</div>
          </div>
        )}
      </div>

      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
            animation: 'fadeIn 0.2s ease',
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
              animation: 'slideUp 0.3s ease',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '24px',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#1f2937' }}>
                {editingProduct ? '编辑商品' : '新增商品'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: '#f3f4f6',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e5e7eb')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>商品名称 *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="请输入商品名称"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>分类 *</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  placeholder="例如：水果、蔬菜、日用品"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>价格 (¥) *</label>
                <div style={{ position: 'relative' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#4f46e5',
                      fontWeight: 500,
                      fontSize: '15px',
                    }}
                  >
                    ¥
                  </span>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    style={{ ...inputStyle, paddingLeft: '40px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>库存数量 *</label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  placeholder="请输入库存数量"
                  min="0"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>图片URL</label>
                <input
                  type="text"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleInputChange}
                  placeholder="请输入图片链接（选填）"
                  style={inputStyle}
                />
                {formData.image_url && (
                  <div style={{ marginTop: '12px' }}>
                    <img
                      src={formData.image_url}
                      alt="预览"
                      style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '10px',
                        objectFit: 'cover',
                        border: '2px solid #e5e7eb',
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <RippleButton
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: '12px', fontSize: '14px' }}
                >
                  取消
                </RippleButton>
                <RippleButton
                  type="submit"
                  disabled={saving}
                  style={{ flex: 1, padding: '12px', fontSize: '14px' }}
                >
                  {saving ? '保存中...' : editingProduct ? '保存修改' : '创建商品'}
                </RippleButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm !== null && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '20px',
          }}
          onClick={() => setShowDeleteConfirm(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '400px',
              padding: '32px',
              textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: '32px',
              }}
            >
              ⚠️
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600, color: '#1f2937' }}>
              确认下架商品？
            </h3>
            <p style={{ margin: '0 0 24px 0', color: '#6b7280', fontSize: '14px' }}>
              下架后该商品库存将设置为0，用户无法购买
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <RippleButton
                variant="outline"
                onClick={() => setShowDeleteConfirm(null)}
                style={{ flex: 1, padding: '10px', fontSize: '14px' }}
              >
                取消
              </RippleButton>
              <RippleButton
                onClick={() => handleDeleteClick(showDeleteConfirm)}
                style={{
                  flex: 1,
                  padding: '10px',
                  fontSize: '14px',
                  backgroundColor: '#ef4444',
                }}
              >
                确认下架
              </RippleButton>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(-10px); }
          10% { opacity: 1; transform: translateY(0); }
          90% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0.7; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '16px 20px',
  fontWeight: 600,
  fontSize: '13px',
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const tdStyle: React.CSSProperties = {
  padding: '16px 20px',
  fontSize: '14px',
  color: '#1f2937',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '8px',
  fontSize: '14px',
  fontWeight: 500,
  color: '#374151',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  fontSize: '14px',
  border: '2px solid #e5e7eb',
  borderRadius: '10px',
  outline: 'none',
  transition: 'border-color 0.2s ease',
  boxSizing: 'border-box',
  backgroundColor: '#ffffff',
};

export default InventoryManagement;
