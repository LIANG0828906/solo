import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  ClipboardList,
  BarChart3,
  FileText,
  Plus,
  X,
  Loader2,
  AlertCircle,
  Clock,
  ShoppingBag,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import { useAppStore } from './store';
import { api } from './api';
import ProductCard from './components/ProductCard';
import InventoryChart from './components/InventoryChart';
import QuotePanel from './components/QuotePanel';
import type { Product, PanelId, QuoteItem } from './types';

const CATEGORIES = ['生鲜果蔬', '日用百货', '零食饮料', '粮油调味', '家居用品'];

interface ToastState {
  type: 'success' | 'error';
  message: string;
}

interface ProductFormData {
  name: string;
  price: string;
  category: string;
  stock: string;
  image: string;
}

const App: React.FC = () => {
  const {
    products,
    orders,
    activePanel,
    selectedProductIds,
    quotePanelOpen,
    editingProduct,
    showAddModal,
    loading,
    setActivePanel,
    setProducts,
    setOrders,
    addProduct,
    updateProduct,
    removeProduct,
    toggleProductSelection,
    setQuotePanelOpen,
    setEditingProduct,
    setShowAddModal,
    setLoading,
  } = useAppStore();

  const [toast, setToast] = useState<ToastState | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    price: '',
    category: CATEGORIES[0],
    stock: '',
    image: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});
  const [panelKey, setPanelKey] = useState(0);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2800);
  };

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      setLoading(true);
      try {
        const [fetchedProducts, fetchedOrders] = await Promise.all([
          api.getProducts(),
          api.getOrders(),
        ]);
        if (!cancelled) {
          setProducts(fetchedProducts);
          setOrders(fetchedOrders);
        }
      } catch (err) {
        if (!cancelled) {
          showToast('error', err instanceof Error ? err.message : '加载数据失败');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    init();
    return () => {
      cancelled = true;
    };
  }, [setLoading, setProducts, setOrders]);

  const handlePanelChange = (panel: PanelId | 'quote') => {
    if (panel === 'quote') {
      openQuoteFromSelection();
      return;
    }
    if (panel !== activePanel) {
      setActivePanel(panel);
      setPanelKey((k) => k + 1);
    }
  };

  const openQuoteFromSelection = () => {
    const ids = Array.from(selectedProductIds);
    if (ids.length === 0) {
      showToast('error', '请先选择商品');
      setActivePanel('products');
      setPanelKey((k) => k + 1);
      return;
    }
    const items: QuoteItem[] = products
      .filter((p) => ids.includes(p.id))
      .map((p) => ({
        productId: p.id,
        name: p.name,
        quantity: 1,
        unitPrice: p.price,
      }));
    setQuotePanelOpen(true, items);
  };

  const openAddModal = () => {
    setFormData({
      name: '',
      price: '',
      category: CATEGORIES[0],
      stock: '',
      image: '',
    });
    setFormErrors({});
    setEditingProduct(null);
    setShowAddModal(true);
  };

  const openEditModal = (product: Product) => {
    setFormData({
      name: product.name,
      price: String(product.price),
      category: product.category,
      stock: String(product.stock),
      image: product.image,
    });
    setFormErrors({});
    setEditingProduct(product);
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingProduct(null);
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof ProductFormData, string>> = {};
    if (!formData.name.trim()) errors.name = '请输入商品名称';
    const price = parseFloat(formData.price);
    if (!formData.price || isNaN(price) || price < 0) errors.price = '请输入有效价格';
    const stock = parseInt(formData.stock, 10);
    if (!formData.stock || isNaN(stock) || stock < 0) errors.stock = '请输入有效库存';
    if (!formData.image.trim()) errors.image = '请输入图片URL';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setModalLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        category: formData.category,
        stock: parseInt(formData.stock, 10),
        image: formData.image.trim(),
      };
      if (editingProduct) {
        const updated = await api.updateProduct(editingProduct.id, payload);
        updateProduct(updated);
        showToast('success', '商品更新成功');
      } else {
        const created = await api.createProduct(payload);
        addProduct(created);
        showToast('success', '商品添加成功');
      }
      closeModal();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : '保存失败');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteProduct(id);
      removeProduct(id);
      showToast('success', '商品删除成功');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : '删除失败');
    }
  };

  const navItems = useMemo(
    () => [
      { id: 'products' as const, icon: Package, label: '商品管理' },
      { id: 'orders' as const, icon: ClipboardList, label: '订单记录' },
      { id: 'inventory' as const, icon: BarChart3, label: '库存查看' },
      { id: 'quote' as const, icon: FileText, label: '生成报价单' },
    ],
    []
  );

  const selectedCount = selectedProductIds.size;

  return (
    <>
      <style>{`
        @keyframes slideInFromRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes activeBarSlideIn {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }
        @keyframes modalFadeInScale {
          from { opacity: 0; transform: scale(0.92) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes modalOverlayFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes toastSlide {
          from { opacity: 0; transform: translate(-50%, -16px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes skeletonShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .product-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }
        @media (max-width: 1200px) {
          .product-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (max-width: 768px) {
          .product-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        .sidebar-indicator-active {
          transform: scaleY(1);
          transform-origin: top;
          transition: transform 0.3s ease-out;
          animation: activeBarSlideIn 0.3s ease-out forwards;
        }
        .sidebar-indicator-inactive {
          transform: scaleY(0);
          transform-origin: top;
          transition: transform 0.2s ease-out;
        }
      `}</style>

      <div
        style={{
          display: 'flex',
          minHeight: '100vh',
          backgroundColor: '#FAF7F2',
        }}
      >
        <aside
          style={{
            width: '180px',
            flexShrink: 0,
            position: 'fixed',
            top: 0,
            left: 0,
            bottom: 0,
            backgroundColor: 'rgba(45, 55, 72, 0.92)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column',
            padding: '24px 0',
            zIndex: 50,
            boxShadow: '2px 0 20px rgba(0,0,0,0.08)',
          }}
        >
          <div
            style={{
              padding: '0 20px 28px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              marginBottom: '12px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
                }}
              >
                <ShoppingBag style={{ width: '18px', height: '18px', color: '#fff' }} />
              </div>
              <div>
                <div
                  style={{
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 600,
                    lineHeight: 1.2,
                  }}
                >
                  市集助手
                </div>
                <div
                  style={{
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: '11px',
                    marginTop: '2px',
                  }}
                >
                  Market Stall
                </div>
              </div>
            </div>
          </div>

          <nav style={{ flex: 1, padding: '8px 12px' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.id === 'quote' ? quotePanelOpen : activePanel === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handlePanelChange(item.id)}
                  style={{
                    position: 'relative',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '14px 0',
                    marginBottom: '4px',
                    borderRadius: '10px',
                    color: isActive ? '#fff' : '#94A3B8',
                    backgroundColor: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                    transition: 'background-color 0.2s ease, color 0.2s ease',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                        'rgba(255,255,255,0.05)';
                      (e.currentTarget as HTMLButtonElement).style.color = '#CBD5E1';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                        'transparent';
                      (e.currentTarget as HTMLButtonElement).style.color = '#94A3B8';
                    }
                  }}
                >
                  <div
                    className={isActive ? 'sidebar-indicator-active' : 'sidebar-indicator-inactive'}
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      marginTop: '-18px',
                      width: '3px',
                      height: '36px',
                      backgroundColor: '#3B82F6',
                      borderRadius: '0 3px 3px 0',
                    }}
                  />
                  <div
                    style={{
                      position: 'relative',
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isActive
                        ? 'rgba(59, 130, 246, 0.2)'
                        : 'rgba(255,255,255,0.04)',
                      transition: 'background-color 0.2s ease',
                    }}
                  >
                    <Icon
                      style={{
                        width: '22px',
                        height: '22px',
                        strokeWidth: 1.8,
                        color: isActive ? '#3B82F6' : undefined,
                      }}
                    />
                    {item.id === 'products' && selectedCount > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '-2px',
                          right: '-2px',
                          minWidth: '18px',
                          height: '18px',
                          borderRadius: '9px',
                          backgroundColor: '#EF4444',
                          color: '#fff',
                          fontSize: '10px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0 5px',
                        }}
                      >
                        {selectedCount}
                      </div>
                    )}
                  </div>
                  <span
                    style={{
                      marginTop: '6px',
                      fontSize: '12px',
                      fontWeight: isActive ? 500 : 400,
                    }}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>

          <div
            style={{
              padding: '12px 16px',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.4)',
              fontSize: '11px',
              textAlign: 'center',
            }}
          >
            v0.1.0
          </div>
        </aside>

        <main
          style={{
            marginLeft: '180px',
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {renderPanel()}
        </main>
      </div>

      {showAddModal && renderModal()}
      {quotePanelOpen && <QuotePanel />}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '28px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 300,
            padding: '12px 22px',
            borderRadius: '10px',
            backgroundColor: toast.type === 'success' ? '#10B981' : '#EF4444',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            animation: 'toastSlide 0.3s ease-out',
          }}
        >
          {toast.type === 'error' && <AlertCircle style={{ width: '16px', height: '16px' }} />}
          {toast.message}
        </div>
      )}
    </>
  );

  function renderPanel() {
    return (
      <div
        key={activePanel + '-' + panelKey}
        style={{
          flex: 1,
          animation: 'slideInFromRight 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {activePanel === 'products' && renderProductsPanel()}
        {activePanel === 'orders' && renderOrdersPanel()}
        {activePanel === 'inventory' && renderInventoryPanel()}
      </div>
    );
  }

  function renderProductsPanel() {
    return (
      <>
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 30,
            backgroundColor: 'rgba(250, 247, 242, 0.92)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(0,0,0,0.05)',
            padding: '18px 28px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: '22px',
                  fontWeight: 700,
                  color: '#1F2937',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <Package style={{ width: '24px', height: '24px', color: '#3B82F6' }} />
                商品管理
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6B7280' }}>
                共 {products.length} 件商品
                {selectedCount > 0 && (
                  <span style={{ color: '#3B82F6', marginLeft: '8px' }}>
                    · 已选 {selectedCount} 件
                  </span>
                )}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={openQuoteFromSelection}
                disabled={selectedCount === 0}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '10px 18px',
                  backgroundColor: '#10B981',
                  color: '#fff',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  boxShadow: '0 4px 10px rgba(16, 185, 129, 0.25)',
                  transition: 'all 0.2s ease',
                  opacity: selectedCount === 0 ? 0.5 : 1,
                  cursor: selectedCount === 0 ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={(e) => {
                  if (selectedCount > 0) {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow =
                      '0 6px 18px rgba(16, 185, 129, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    '0 4px 10px rgba(16, 185, 129, 0.25)';
                }}
              >
                <FileText style={{ width: '16px', height: '16px' }} />
                生成报价单
              </button>
              <button
                onClick={openAddModal}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '10px 18px',
                  backgroundColor: '#10B981',
                  color: '#fff',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  boxShadow: '0 4px 10px rgba(16, 185, 129, 0.25)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    '0 6px 18px rgba(16, 185, 129, 0.4)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    '0 4px 10px rgba(16, 185, 129, 0.25)';
                }}
              >
                <Plus style={{ width: '16px', height: '16px' }} />
                新增商品
              </button>
            </div>
          </div>
        </header>

        <div style={{ padding: '24px 28px 40px' }}>
          {loading ? (
            renderSkeletonGrid()
          ) : products.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '80px 20px',
                color: '#9CA3AF',
                gap: '14px',
              }}
            >
              <Package style={{ width: '64px', height: '64px', opacity: 0.35 }} />
              <p style={{ fontSize: '15px', margin: 0, color: '#6B7280' }}>暂无商品数据</p>
              <button
                onClick={openAddModal}
                style={{
                  marginTop: '6px',
                  padding: '9px 18px',
                  backgroundColor: '#10B981',
                  color: '#fff',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 500,
                  boxShadow: '0 3px 8px rgba(16, 185, 129, 0.25)',
                }}
              >
                添加第一件商品
              </button>
            </div>
          ) : (
            <div className="product-grid">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  selected={selectedProductIds.has(product.id)}
                  onToggleSelect={toggleProductSelection}
                  onEdit={openEditModal}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </>
    );
  }

  function renderSkeletonGrid() {
    return (
      <div className="product-grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            style={{
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#fff',
              boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
            }}
          >
            <div
              style={{
                width: '100%',
                paddingTop: '100%',
                background:
                  'linear-gradient(90deg, #F3F4F6 0%, #E5E7EB 50%, #F3F4F6 100%)',
                backgroundSize: '200% 100%',
                animation: 'skeletonShimmer 1.5s ease-in-out infinite',
              }}
            />
            <div style={{ padding: '12px' }}>
              <div
                style={{
                  height: '14px',
                  width: '70%',
                  borderRadius: '4px',
                  background:
                    'linear-gradient(90deg, #F3F4F6 0%, #E5E7EB 50%, #F3F4F6 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'skeletonShimmer 1.5s ease-in-out infinite',
                  marginBottom: '8px',
                }}
              />
              <div
                style={{
                  height: '16px',
                  width: '40%',
                  borderRadius: '4px',
                  background:
                    'linear-gradient(90deg, #F3F4F6 0%, #E5E7EB 50%, #F3F4F6 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'skeletonShimmer 1.5s ease-in-out infinite',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  function renderOrdersPanel() {
    return (
      <>
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 30,
            backgroundColor: 'rgba(250, 247, 242, 0.92)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(0,0,0,0.05)',
            padding: '18px 28px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: '22px',
                  fontWeight: 700,
                  color: '#1F2937',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <ClipboardList style={{ width: '24px', height: '24px', color: '#3B82F6' }} />
                订单记录
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6B7280' }}>
                共 {orders.length} 条订单
              </p>
            </div>
          </div>
        </header>

        <div style={{ padding: '24px 28px 40px' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    padding: '20px 22px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                  }}
                >
                  <div
                    style={{
                      height: '18px',
                      width: '25%',
                      borderRadius: '4px',
                      background:
                        'linear-gradient(90deg, #F3F4F6 0%, #E5E7EB 50%, #F3F4F6 100%)',
                      backgroundSize: '200% 100%',
                      animation: 'skeletonShimmer 1.5s ease-in-out infinite',
                      marginBottom: '14px',
                    }}
                  />
                  <div
                    style={{
                      height: '14px',
                      width: '60%',
                      borderRadius: '4px',
                      background:
                        'linear-gradient(90deg, #F3F4F6 0%, #E5E7EB 50%, #F3F4F6 100%)',
                      backgroundSize: '200% 100%',
                      animation: 'skeletonShimmer 1.5s ease-in-out infinite',
                    }}
                  />
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '80px 20px',
                color: '#9CA3AF',
                gap: '14px',
              }}
            >
              <ClipboardList style={{ width: '64px', height: '64px', opacity: 0.35 }} />
              <p style={{ fontSize: '15px', margin: 0, color: '#6B7280' }}>暂无订单记录</p>
              <p style={{ fontSize: '13px', margin: 0 }}>生成报价单后订单将在这里显示</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {orders.map((order) => (
                <div
                  key={order.id}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    padding: '20px 22px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                    transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow =
                      '0 6px 18px rgba(0,0,0,0.08)';
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow =
                      '0 2px 4px rgba(0,0,0,0.06)';
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '14px',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div
                        style={{
                          padding: '5px 12px',
                          backgroundColor: '#ECFDF5',
                          color: '#059669',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        订单 #{order.id.slice(0, 8).toUpperCase()}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '12px',
                          color: '#6B7280',
                        }}
                      >
                        <Calendar style={{ width: '13px', height: '13px' }} />
                        {new Date(order.createdAt).toLocaleString('zh-CN')}
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '13px',
                          color: '#6B7280',
                        }}
                      >
                        共 {order.items.reduce((s, i) => s + i.quantity, 0)} 件
                      </span>
                      <ChevronRight style={{ width: '16px', height: '16px', color: '#D1D5DB' }} />
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      paddingTop: '12px',
                      borderTop: '1px dashed #F3F4F6',
                    }}
                  >
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '13px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#1F2937' }}>{item.name}</span>
                          <span style={{ color: '#9CA3AF', fontSize: '12px' }}>
                            × {item.quantity}
                          </span>
                        </div>
                        <span style={{ color: '#6B7280' }}>
                          ¥{(item.unitPrice * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        marginTop: '8px',
                        paddingTop: '12px',
                        borderTop: '1px solid #F3F4F6',
                        gap: '8px',
                      }}
                    >
                      <span style={{ fontSize: '13px', color: '#6B7280' }}>合计：</span>
                      <span
                        style={{
                          fontSize: '20px',
                          fontWeight: 700,
                          color: '#EF4444',
                        }}
                      >
                        ¥{order.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </>
    );
  }

  function renderInventoryPanel() {
    return (
      <>
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 30,
            backgroundColor: 'rgba(250, 247, 242, 0.92)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(0,0,0,0.05)',
            padding: '18px 28px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '14px',
            }}
          >
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: '22px',
                  fontWeight: 700,
                  color: '#1F2937',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <BarChart3 style={{ width: '24px', height: '24px', color: '#3B82F6' }} />
                库存查看
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6B7280' }}>
                实时监控商品库存状态（库存＜5 标红预警）
              </p>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                fontSize: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '3px',
                    background:
                      'linear-gradient(180deg, #34D399 0%, #059669 100%)',
                  }}
                />
                <span style={{ color: '#6B7280' }}>充足</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '3px',
                    background:
                      'linear-gradient(180deg, #F87171 0%, #DC2626 100%)',
                  }}
                />
                <span style={{ color: '#6B7280' }}>紧张</span>
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: '12px',
              marginTop: '18px',
            }}
          >
            {renderStatCard(
              '商品总数',
              products.length,
              Package,
              '#3B82F6',
              '#EFF6FF'
            )}
            {renderStatCard(
              '库存总量',
              products.reduce((s, p) => s + p.stock, 0),
              BarChart3,
              '#10B981',
              '#ECFDF5'
            )}
            {renderStatCard(
              '库存紧张',
              products.filter((p) => p.stock < 5).length,
              AlertCircle,
              '#EF4444',
              '#FEF2F2'
            )}
            {renderStatCard(
              '库存价值',
              '¥' + products.reduce((s, p) => s + p.stock * p.price, 0).toFixed(0),
              Clock,
              '#8B5CF6',
              '#F5F3FF'
            )}
          </div>
        </header>

        <div style={{ padding: '24px 28px 40px' }}>
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '14px',
              padding: '22px 24px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
            }}
          >
            {loading ? (
              <div
                style={{
                  height: '360px',
                  borderRadius: '8px',
                  background:
                    'linear-gradient(90deg, #F3F4F6 0%, #E5E7EB 50%, #F3F4F6 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'skeletonShimmer 1.5s ease-in-out infinite',
                }}
              />
            ) : (
              <InventoryChart products={products} />
            )}
          </div>
        </div>
      </>
    );
  }

  function renderStatCard(
    label: string,
    value: string | number,
    Icon: React.ComponentType<{ style?: React.CSSProperties }>,
    color: string,
    bgColor: string
  ) {
    return (
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        }}
      >
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            backgroundColor: bgColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon style={{ width: '20px', height: '20px', color }} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: '12px',
              color: '#6B7280',
              marginBottom: '2px',
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#1F2937',
              lineHeight: 1.2,
            }}
          >
            {value}
          </div>
        </div>
      </div>
    );
  }

  function renderModal() {
    const isEdit = !!editingProduct;
    return (
      <>
        <div
          onClick={closeModal}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            zIndex: 200,
            animation: 'modalOverlayFade 0.3s ease-out',
            backdropFilter: 'blur(3px)',
            WebkitBackdropFilter: 'blur(3px)',
          }}
        />
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 201,
            width: 'min(480px, calc(100vw - 32px))',
            maxHeight: 'calc(100vh - 60px)',
            backgroundColor: '#fff',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            animation: 'modalFadeInScale 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 24px',
              borderBottom: '1px solid #F3F4F6',
              flexShrink: 0,
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: '17px',
                fontWeight: 600,
                color: '#111827',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {isEdit ? (
                <>
                  <Package style={{ width: '18px', height: '18px', color: '#3B82F6' }} />
                  编辑商品
                </>
              ) : (
                <>
                  <Plus style={{ width: '18px', height: '18px', color: '#10B981' }} />
                  新增商品
                </>
              )}
            </h2>
            <button
              onClick={closeModal}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6B7280',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F3F4F6';
                (e.currentTarget as HTMLButtonElement).style.color = '#374151';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.color = '#6B7280';
              }}
            >
              <X style={{ width: '18px', height: '18px' }} />
            </button>
          </div>

          <div
            style={{
              padding: '22px 24px',
              overflowY: 'auto',
              flex: 1,
            }}
          >
            {renderFormField(
              '商品名称',
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入商品名称"
                style={getInputStyle(!!formErrors.name)}
              />,
              formErrors.name
            )}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
              }}
            >
              {renderFormField(
                '价格 (¥)',
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  style={getInputStyle(!!formErrors.price)}
                />,
                formErrors.price
              )}
              {renderFormField(
                '库存数量',
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="0"
                  style={getInputStyle(!!formErrors.stock)}
                />,
                formErrors.stock
              )}
            </div>

            {renderFormField(
              '商品分类',
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                style={getInputStyle(false)}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>,
              undefined
            )}

            {renderFormField(
              '图片 URL',
              <input
                type="text"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://example.com/image.jpg"
                style={getInputStyle(!!formErrors.image)}
              />,
              formErrors.image
            )}

            {formData.image.trim() && (
              <div
                style={{
                  marginTop: '6px',
                  padding: '12px',
                  backgroundColor: '#F9FAFB',
                  borderRadius: '10px',
                  border: '1px dashed #E5E7EB',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    color: '#6B7280',
                    marginBottom: '8px',
                  }}
                >
                  图片预览
                </div>
                <div
                  style={{
                    width: '100%',
                    maxWidth: '180px',
                    aspectRatio: '1 / 1',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    backgroundColor: '#fff',
                    border: '1px solid #E5E7EB',
                  }}
                >
                  <img
                    src={formData.image.trim()}
                    alt="预览"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              gap: '10px',
              padding: '16px 24px 20px',
              borderTop: '1px solid #F3F4F6',
              backgroundColor: '#FAFAFA',
              flexShrink: 0,
            }}
          >
            <button
              onClick={closeModal}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#fff',
                color: '#374151',
                fontSize: '14px',
                fontWeight: 500,
                borderRadius: '10px',
                border: '1px solid #E5E7EB',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F9FAFB';
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#D1D5DB';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#fff';
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#E5E7EB';
              }}
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={modalLoading}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: isEdit ? '#3B82F6' : '#10B981',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600,
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: isEdit
                  ? '0 4px 10px rgba(59, 130, 246, 0.25)'
                  : '0 4px 10px rgba(16, 185, 129, 0.25)',
                transition: 'all 0.2s ease',
                opacity: modalLoading ? 0.75 : 1,
                cursor: modalLoading ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!modalLoading) {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.02)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = isEdit
                    ? '0 6px 18px rgba(59, 130, 246, 0.4)'
                    : '0 6px 18px rgba(16, 185, 129, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = isEdit
                  ? '0 4px 10px rgba(59, 130, 246, 0.25)'
                  : '0 4px 10px rgba(16, 185, 129, 0.25)';
              }}
            >
              {modalLoading && (
                <Loader2
                  style={{
                    width: '16px',
                    height: '16px',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
              )}
              {isEdit ? '保存修改' : '添加商品'}
            </button>
          </div>
        </div>
      </>
    );
  }

  function renderFormField(
    label: string,
    input: React.ReactNode,
    error?: string
  ) {
    return (
      <div style={{ marginBottom: '16px' }}>
        <label
          style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: 500,
            color: '#374151',
            marginBottom: '6px',
          }}
        >
          {label}
        </label>
        {input}
        {error && (
          <div
            style={{
              marginTop: '6px',
              fontSize: '12px',
              color: '#EF4444',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <AlertCircle style={{ width: '12px', height: '12px' }} />
            {error}
          </div>
        )}
      </div>
    );
  }

  function getInputStyle(hasError: boolean): React.CSSProperties {
    return {
      width: '100%',
      padding: '10px 14px',
      fontSize: '14px',
      color: '#111827',
      backgroundColor: '#fff',
      border: `1px solid ${hasError ? '#FCA5A5' : '#E5E7EB'}`,
      borderRadius: '9px',
      transition: 'all 0.15s ease',
      boxSizing: 'border-box',
    };
  }
};

export default App;
