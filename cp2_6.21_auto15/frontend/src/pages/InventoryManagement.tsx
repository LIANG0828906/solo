import React, { useState, useEffect, useMemo } from 'react';
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

  const hasLowStock = useMemo(() => {
    return products.some((p) => p.stock < 20);
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

  const fetchProducts = async () => {
    try {
      const data = await getGoodsList();
      setProducts(data);
      loadProducts(data);
    } catch (error) {
      showToast('获取商品列表失败', 'error');
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
        image_url: formData.image_url.trim() || 'https://via.placeholder.com/200',
      };

      if (editingProduct) {
        const updated = await updateProduct(editingProduct.id, productData);
        setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? updated : p)));
        showToast('商品更新成功', 'success');
      } else {
        const created = await createProduct(productData);
        setProducts((prev) => [...prev, created]);
        showToast('商品添加成功', 'success');
      }
      setShowModal(false);
    } catch (error) {
      showToast(editingProduct ? '更新失败' : '添加失败', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleStockChange = async (productId: number, newStock: number) => {
    if (newStock < 0) return;
    try {
      const updated = await updateStock(productId, newStock);
      setProducts((prev) => prev.map((p) => (p.id === productId ? updated : p)));
      showToast('库存已更新', 'success');
    } catch (error) {
      showToast('库存更新失败', 'error');
    }
  };

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 20px' }}>
      {hasLowStock && (
        <div
          style={{
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            padding: '16px 24px',
            borderRadius: '12px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            animation: 'shake 0.5s ease-in-out infinite',
          }}
        >
          <span style={{ fontSize: '24px' }}>⚠️</span>
          <div>
            <span style={{ fontWeight: 600 }}>库存预警：</span>
            有商品库存低于20%，请及时补货！
          </div>
          <style>{`
            @keyframes shake {
              0%, 100% { transform: translateX(0); }
              10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
              20%, 40%, 60%, 80% { transform: translateX(4px); }
            }
          `}</style>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
          库存管理
        </h1>
        <RippleButton onClick={handleAddClick} style={{ padding: '12px 24px', fontSize: '14px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '18px' }}>+</span>
            新增商品
          </span>
        </RippleButton>
      </div>

      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                <th
                  style={{
                    padding: '16px',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#6b7280',
                  }}
                >
                  商品图片
                </th>
                <th
                  style={{
                    padding: '16px',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#6b7280',
                  }}
                >
                  商品名称
                </th>
                <th
                  style={{
                    padding: '16px',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#6b7280',
                  }}
                >
                  分类
                </th>
                <th
                  style={{
                    padding: '16px',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#6b7280',
                  }}
                >
                  价格
                </th>
                <th
                  style={{
                    padding: '16px',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#6b7280',
                  }}
                >
                  库存
                </th>
                <th
                  style={{
                    padding: '16px',
                    textAlign: 'right',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#6b7280',
                  }}
                >
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr
                  key={product.id}
                  style={{
                    borderTop: '1px solid #f3f4f6',
                    transition: 'background-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#fafafa';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <td style={{ padding: '16px' }}>
                    <img
                      src={product.image_url}
                      alt={product.name}
                      style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '10px',
                        objectFit: 'cover',
                      }}
                    />
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span
                      style={{
                        fontSize: '15px',
                        fontWeight: 500,
                        color: '#1f2937',
                      }}
                    >
                      {product.name}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span
                      style={{
                        padding: '4px 12px',
                        backgroundColor: '#ede9fe',
                        color: '#7c3aed',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: 500,
                      }}
                    >
                      {product.category}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span
                      style={{
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: '#4f46e5',
                      }}
                    >
                      ¥{product.price.toFixed(2)}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <button
                        onClick={() => handleStockChange(product.id, product.stock - 1)}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          border: '1px solid #e5e7eb',
                          backgroundColor: '#ffffff',
                          cursor: 'pointer',
                          fontSize: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#6b7280',
                        }}
                      >
                        -
                      </button>
                      <span
                        style={{
                          minWidth: '50px',
                          textAlign: 'center',
                          fontSize: '15px',
                          fontWeight: product.stock < 20 ? 600 : 500,
                          color: product.stock < 20 ? '#ef4444' : '#1f2937',
                        }}
                      >
                        {product.stock}
                      </span>
                      <button
                        onClick={() => handleStockChange(product.id, product.stock + 1)}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          border: '1px solid #e5e7eb',
                          backgroundColor: '#ffffff',
                          cursor: 'pointer',
                          fontSize: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#6b7280',
                        }}
                      >
                        +
                      </button>
                      {product.stock < 20 && (
                        <span
                          style={{
                            marginLeft: '8px',
                            fontSize: '12px',
                            color: '#ef4444',
                            fontWeight: 500,
                          }}
                        >
                          库存不足
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <RippleButton
                        onClick={() => handleEditClick(product)}
                        variant="outline"
                        style={{ padding: '6px 16px', fontSize: '13px' }}
                      >
                        编辑
                      </RippleButton>
                      <RippleButton
                        onClick={() => setShowDeleteConfirm(product.id)}
                        color="#ef4444"
                        style={{ padding: '6px 16px', fontSize: '13px' }}
                      >
                        下架
                      </RippleButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {products.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '80px 20px',
              color: '#9ca3af',
            }}
          >
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📦</div>
            <div style={{ fontSize: '16px', marginBottom: '8px' }}>暂无商品</div>
            <div style={{ color: '#6b7280' }}>点击"新增商品"添加商品</div>
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
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
            }
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              padding: '32px',
              width: '100%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <h2
              style={{
                fontSize: '22px',
                fontWeight: 'bold',
                color: '#1f2937',
                margin: '0 0 24px 0',
              }}
            >
              {editingProduct ? '编辑商品' : '新增商品'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: '8px',
                  }}
                >
                  商品名称 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入商品名称"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#4f46e5';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: '8px',
                  }}
                >
                  分类 *
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="请输入商品分类"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#4f46e5';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: '8px',
                  }}
                >
                  价格 *
                </label>
                <div style={{ position: 'relative' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '15px',
                      color: '#4f46e5',
                      fontWeight: 600,
                    }}
                  >
                    ¥
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    style={{
                      width: '100%',
                      padding: '12px 16px 12px 36px',
                      fontSize: '14px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '10px',
                      outline: 'none',
                      transition: 'border-color 0.2s ease',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#4f46e5';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: '8px',
                  }}
                >
                  库存 *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="请输入库存数量"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#4f46e5';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: '8px',
                  }}
                >
                  图片URL
                </label>
                <input
                  type="text"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="请输入商品图片链接（可选）"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#4f46e5';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
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
