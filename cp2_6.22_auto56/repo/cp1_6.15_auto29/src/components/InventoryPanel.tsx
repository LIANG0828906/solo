import { useState, useMemo, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, AlertTriangle, X, Check } from 'lucide-react';
import { api, Product } from '../services/api';

interface Props {
  currentCategory: string;
  setCurrentCategory: (cat: string) => void;
  categories: string[];
  products: Product[];
  refreshProducts: () => void;
  refreshAlerts: () => void;
}

interface FormState {
  id?: string;
  name: string;
  barcode: string;
  category: string;
  costPrice: string;
  sellingPrice: string;
  stock: string;
  supplier: string;
  alertThreshold: string;
}

const emptyForm: FormState = {
  name: '',
  barcode: '',
  category: '饮料',
  costPrice: '',
  sellingPrice: '',
  stock: '',
  supplier: '',
  alertThreshold: '10'
};

export default function InventoryPanel({
  currentCategory,
  setCurrentCategory,
  categories,
  products,
  refreshProducts,
  refreshAlerts
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FormState>(emptyForm);
  const [formStatus, setFormStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [showAlerts, setShowAlerts] = useState(false);
  const [alerts, setAlerts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, [products]);

  async function loadAlerts() {
    try {
      const data = await api.getAlertProducts();
      setAlerts(data);
    } catch (e) {
      console.error(e);
    }
  }

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.barcode.includes(q) ||
        p.supplier.toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  function openAddForm() {
    setFormData(emptyForm);
    setFormStatus('idle');
    setErrorMessage('');
    setShowForm(true);
  }

  function openEditForm(product: Product) {
    setFormData({
      id: product.id,
      name: product.name,
      barcode: product.barcode,
      category: product.category,
      costPrice: String(product.costPrice),
      sellingPrice: String(product.sellingPrice),
      stock: String(product.stock),
      supplier: product.supplier,
      alertThreshold: String(product.alertThreshold)
    });
    setFormStatus('idle');
    setErrorMessage('');
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setFormStatus('idle');
    try {
      const data = {
        ...formData,
        costPrice: parseFloat(formData.costPrice) || 0,
        sellingPrice: parseFloat(formData.sellingPrice) || 0,
        stock: parseInt(formData.stock) || 0,
        alertThreshold: parseInt(formData.alertThreshold) || 10
      };
      if (formData.id) {
        await api.updateProduct(formData.id, data);
      } else {
        await api.createProduct(data);
      }
      setFormStatus('success');
      setTimeout(() => {
        setShowForm(false);
        refreshProducts();
        refreshAlerts();
      }, 600);
    } catch (err: any) {
      setErrorMessage(err.message || '操作失败');
      setFormStatus('error');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('确定要删除这个商品吗？')) return;
    try {
      await api.deleteProduct(id);
      refreshProducts();
      refreshAlerts();
    } catch (err: any) {
      alert(err.message);
    }
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--wood-dark)' }}>
            库存管理
          </h2>
          <p className="text-sm" style={{ color: '#8B7355' }}>
            共 {filteredProducts.length} 件商品
          </p>
        </div>
        <div className="flex gap-3">
          {alerts.length > 0 && (
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg animate-pulse-red"
              style={{ border: '2px solid var(--alert-red)' }}
              onClick={() => setShowAlerts(true)}
            >
              <AlertTriangle style={{ width: 18, height: 18, color: 'var(--alert-red)' }} />
              <span style={{ color: 'var(--alert-red)', fontWeight: 600 }}>
                库存预警 ({alerts.length})
              </span>
            </button>
          )}
          <button className="btn-primary flex items-center gap-2" onClick={openAddForm}>
            <Plus style={{ width: 18, height: 18 }} />
            新增商品
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#8B7355', width: 18, height: 18 }} />
          <input
            type="text"
            className="input-field pl-10"
            placeholder="搜索商品名称、条码、供应商..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`category-pill ${currentCategory === cat ? 'active' : ''}`}
              onClick={() => setCurrentCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid-products">
        {filteredProducts.map((product, index) => {
          const isLow = product.stock <= product.alertThreshold;
          return (
            <div
              key={product.id}
              className={`product-card p-5 ${isLow ? 'animate-pulse-red' : ''}`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--wood-dark)' }}>
                    {product.name}
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    <span className="badge badge-category">{product.category}</span>
                    {isLow && (
                      <span className="badge badge-alert animate-badge-blink">库存不足</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    className="p-2 rounded-lg hover:bg-gray-100"
                    onClick={() => openEditForm(product)}
                    title="编辑"
                  >
                    <Edit2 style={{ width: 16, height: 16, color: 'var(--wood-primary)' }} />
                  </button>
                  <button
                    className="p-2 rounded-lg hover:bg-gray-100"
                    onClick={() => handleDelete(product.id)}
                    title="删除"
                  >
                    <Trash2 style={{ width: 16, height: 16, color: 'var(--alert-red)' }} />
                  </button>
                </div>
              </div>
              <div className="text-sm space-y-1" style={{ color: '#5D4037' }}>
                <div className="flex justify-between">
                  <span>条码：</span>
                  <span className="font-mono">{product.barcode}</span>
                </div>
                <div className="flex justify-between">
                  <span>进价：</span>
                  <span>¥{product.costPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>售价：</span>
                  <span style={{ color: 'var(--wood-primary)', fontWeight: 600 }}>
                    ¥{product.sellingPrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>库存：</span>
                  <span style={{ color: isLow ? 'var(--alert-red)' : '#38A169', fontWeight: 600 }}>
                    {product.stock} 件
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>供应商：</span>
                  <span>{product.supplier}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-16" style={{ color: '#8B7355' }}>
          <Package style={{ width: 48, height: 48, margin: '0 auto 16px', opacity: 0.3 }} />
          <p>暂无商品数据</p>
        </div>
      )}

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div
            className={`modal-content ${formStatus === 'success' ? 'animate-success' : ''} ${formStatus === 'error' ? 'animate-error' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold" style={{ color: 'var(--wood-dark)' }}>
                {formData.id ? '编辑商品' : '新增商品'}
              </h3>
              <button
                className="p-1 rounded hover:bg-gray-100"
                onClick={() => setShowForm(false)}
              >
                <X style={{ width: 20, height: 20, color: '#8B7355' }} />
              </button>
            </div>

            {errorMessage && (
              <div
                className="mb-4 p-3 rounded-lg text-sm"
                style={{ background: 'rgba(229, 62, 62, 0.1)', color: 'var(--alert-red)' }}
              >
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--wood-dark)' }}>
                    商品名称 *
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--wood-dark)' }}>
                    条码 *
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--wood-dark)' }}>
                    类别 *
                  </label>
                  <select
                    className="input-field"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="饮料">饮料</option>
                    <option value="零食">零食</option>
                    <option value="日用品">日用品</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--wood-dark)' }}>
                    供应商
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--wood-dark)' }}>
                    进价 (元)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--wood-dark)' }}>
                    售价 (元)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--wood-dark)' }}>
                    当前库存
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--wood-dark)' }}>
                    预警阈值
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    value={formData.alertThreshold}
                    onChange={(e) => setFormData({ ...formData, alertThreshold: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  className="px-5 py-2 rounded-lg border-2"
                  style={{ borderColor: 'var(--wood-light)', color: 'var(--wood-dark)' }}
                  onClick={() => setShowForm(false)}
                >
                  取消
                </button>
                <button type="submit" className="btn-primary flex items-center gap-2" disabled={loading}>
                  {loading ? '保存中...' : (
                    <>
                      <Check style={{ width: 16, height: 16 }} />
                      {formData.id ? '保存修改' : '创建商品'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAlerts && (
        <div className="modal-backdrop" onClick={() => setShowAlerts(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--alert-red)' }}>
                <AlertTriangle style={{ width: 24, height: 24 }} />
                库存预警列表
              </h3>
              <button
                className="p-1 rounded hover:bg-gray-100"
                onClick={() => setShowAlerts(false)}
              >
                <X style={{ width: 20, height: 20, color: '#8B7355' }} />
              </button>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {alerts.map((product) => (
                <div
                  key={product.id}
                  className="p-4 rounded-lg animate-pulse-red"
                  style={{ background: 'rgba(229, 62, 62, 0.05)', border: '1px solid var(--alert-red)' }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold" style={{ color: 'var(--wood-dark)' }}>{product.name}</h4>
                      <p className="text-sm" style={{ color: '#8B7355' }}>{product.category} · {product.supplier}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg" style={{ color: 'var(--alert-red)' }}>
                        {product.stock} 件
                      </p>
                      <p className="text-xs" style={{ color: '#8B7355' }}>
                        阈值: {product.alertThreshold} 件
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Package(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}
