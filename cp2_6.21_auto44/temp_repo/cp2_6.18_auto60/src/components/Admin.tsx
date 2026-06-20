import { useState, useRef, useCallback } from 'react';
import { Plus, Pencil, Trash2, Package, ClipboardList, X, Upload } from 'lucide-react';
import { useStore } from '@/store';
import type { Product } from '@/types';

const CATEGORIES = ['陶瓷', '编织', '木雕'];

interface ProductForm {
  name: string;
  price: string;
  stock: string;
  description: string;
  category: string;
  imageUrl: string;
  makerName: string;
  makerAvatar: string;
  material: string;
  dimensions: string;
  productionCycle: string;
}

const emptyForm: ProductForm = {
  name: '',
  price: '',
  stock: '',
  description: '',
  category: '陶瓷',
  imageUrl: '',
  makerName: '',
  makerAvatar: '',
  material: '',
  dimensions: '',
  productionCycle: '',
};

type TabType = 'products' | 'orders';

export default function Admin() {
  const products = useStore((s) => s.products);
  const orders = useStore((s) => s.orders);
  const addProduct = useStore((s) => s.addProduct);
  const updateProduct = useStore((s) => s.updateProduct);
  const deleteProduct = useStore((s) => s.deleteProduct);
  const showToast = useStore((s) => s.showToast);

  const [tab, setTab] = useState<TabType>('products');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = useCallback(() => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  }, []);

  const handleEdit = useCallback(
    (product: Product) => {
      setForm({
        name: product.name,
        price: String(product.price),
        stock: String(product.stock),
        description: product.description,
        category: product.category,
        imageUrl: product.imageUrl,
        makerName: product.makerName,
        makerAvatar: product.makerAvatar,
        material: product.material,
        dimensions: product.dimensions,
        productionCycle: product.productionCycle,
      });
      setEditingId(product.id);
      setShowForm(true);
    },
    []
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteProduct(id);
      showToast('商品已删除');
    },
    [deleteProduct, showToast]
  );

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        setForm((f) => ({ ...f, imageUrl: ev.target?.result as string }));
      };
      reader.readAsDataURL(file);
    },
    []
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const price = Number(form.price);
      const stock = Number(form.stock);

      if (!form.name || form.name.length > 20) {
        showToast('商品名称需1-20字');
        return;
      }
      if (isNaN(price) || price < 1 || price > 999999) {
        showToast('价格需在1-999999之间');
        return;
      }
      if (isNaN(stock) || stock < 1 || stock > 999) {
        showToast('数量需在1-999之间');
        return;
      }
      if (form.description.length > 500) {
        showToast('描述不超过500字');
        return;
      }

      const productData = {
        name: form.name,
        price,
        stock,
        description: form.description,
        category: form.category,
        imageUrl:
          form.imageUrl ||
          `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=${encodeURIComponent(form.name + ' handmade craft on warm beige background')}`,
        makerName: form.makerName || '匿名匠人',
        makerAvatar: form.makerAvatar || form.makerName?.[0] || '匠',
        material: form.material || '-',
        dimensions: form.dimensions || '-',
        productionCycle: form.productionCycle || '-',
      };

      if (editingId) {
        updateProduct(editingId, productData);
        showToast('商品已更新');
      } else {
        addProduct(productData);
        showToast('商品已添加');
      }
      resetForm();
    },
    [form, editingId, addProduct, updateProduct, showToast, resetForm]
  );

  const updateField = useCallback(
    (field: keyof ProductForm, value: string) => {
      setForm((f) => ({ ...f, [field]: value }));
    },
    []
  );

  return (
    <div className="max-w-content mx-auto px-4 py-6 animate-fade-in-up">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-bold text-stone-800">简易后台</h1>
        {tab === 'products' && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
            style={{ backgroundColor: '#059669' }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = '#047857')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = '#059669')
            }
          >
            <Plus size={16} />
            添加商品
          </button>
        )}
      </div>

      <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 shadow-sm">
        <button
          onClick={() => {
            setTab('products');
            resetForm();
          }}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex-1 justify-center ${
            tab === 'products'
              ? 'text-white shadow-sm'
              : 'text-stone-500 hover:text-stone-700'
          }`}
          style={tab === 'products' ? { backgroundColor: '#D97706' } : undefined}
        >
          <Package size={16} />
          商品管理
        </button>
        <button
          onClick={() => {
            setTab('orders');
            resetForm();
          }}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex-1 justify-center ${
            tab === 'orders'
              ? 'text-white shadow-sm'
              : 'text-stone-500 hover:text-stone-700'
          }`}
          style={tab === 'orders' ? { backgroundColor: '#D97706' } : undefined}
        >
          <ClipboardList size={16} />
          订单记录
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-stone-800">
              {editingId ? '编辑商品' : '添加商品'}
            </h2>
            <button
              onClick={resetForm}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-100 transition-colors"
            >
              <X size={18} className="text-stone-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1">
                  商品名称 <span className="text-xs text-stone-400">(1-20字)</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  maxLength={20}
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-warm-600 transition-colors"
                  placeholder="输入商品名称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1">
                  价格 <span className="text-xs text-stone-400">(1-999999元)</span>
                </label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => updateField('price', e.target.value)}
                  min={1}
                  max={999999}
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-warm-600 transition-colors"
                  placeholder="输入价格"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1">
                  库存数量 <span className="text-xs text-stone-400">(1-999)</span>
                </label>
                <input
                  type="number"
                  value={form.stock}
                  onChange={(e) => updateField('stock', e.target.value)}
                  min={1}
                  max={999}
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-warm-600 transition-colors"
                  placeholder="输入库存数量"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1">
                  分类
                </label>
                <select
                  value={form.category}
                  onChange={(e) => updateField('category', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-warm-600 transition-colors bg-white"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1">
                  制作者昵称
                </label>
                <input
                  type="text"
                  value={form.makerName}
                  onChange={(e) => updateField('makerName', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-warm-600 transition-colors"
                  placeholder="输入制作者昵称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1">
                  材质
                </label>
                <input
                  type="text"
                  value={form.material}
                  onChange={(e) => updateField('material', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-warm-600 transition-colors"
                  placeholder="如：高岭土、羊毛等"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1">
                  尺寸
                </label>
                <input
                  type="text"
                  value={form.dimensions}
                  onChange={(e) => updateField('dimensions', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-warm-600 transition-colors"
                  placeholder="如：直径8cm 高9cm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1">
                  制作周期
                </label>
                <input
                  type="text"
                  value={form.productionCycle}
                  onChange={(e) => updateField('productionCycle', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-warm-600 transition-colors"
                  placeholder="如：7天"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">
                商品描述 <span className="text-xs text-stone-400">(最多500字)</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                maxLength={500}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-warm-600 transition-colors resize-none"
                placeholder="描述商品的特点、工艺、故事..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">
                商品图片
              </label>
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-stone-200 text-sm text-stone-500 hover:border-warm-400 hover:text-warm-600 transition-colors"
                >
                  <Upload size={16} />
                  上传图片
                </button>
                {form.imageUrl && (
                  <img
                    src={form.imageUrl}
                    alt="预览"
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2.5 rounded-lg border border-stone-200 text-sm text-stone-600 hover:bg-stone-50 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-lg text-white text-sm font-medium transition-colors"
                style={{ backgroundColor: '#059669' }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = '#047857')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = '#059669')
                }
              >
                {editingId ? '保存修改' : '添加商品'}
              </button>
            </div>
          </form>
        </div>
      )}

      {tab === 'products' && !showForm && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Package size={48} className="text-stone-200 mb-3" />
              <p className="text-stone-400 text-sm">暂无商品</p>
              <p className="text-stone-300 text-xs mt-1">点击上方按钮添加第一件商品</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100">
                    <th className="text-left px-4 py-3 text-stone-500 font-medium">商品</th>
                    <th className="text-left px-4 py-3 text-stone-500 font-medium">分类</th>
                    <th className="text-left px-4 py-3 text-stone-500 font-medium">价格</th>
                    <th className="text-left px-4 py-3 text-stone-500 font-medium">库存</th>
                    <th className="text-right px-4 py-3 text-stone-500 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b border-stone-50 hover:bg-stone-50/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-10 h-10 rounded-lg object-cover"
                            loading="lazy"
                          />
                          <span className="font-medium text-stone-800">
                            {product.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-stone-500">{product.category}</td>
                      <td className="px-4 py-3 font-medium" style={{ color: '#D97706' }}>
                        ¥{product.price}
                      </td>
                      <td className="px-4 py-3 text-stone-500">{product.stock}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-2 rounded-lg hover:bg-warm-50 text-stone-400 hover:text-warm-600 transition-colors"
                            title="编辑"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-2 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-500 transition-colors"
                            title="删除"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'orders' && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <ClipboardList size={48} className="text-stone-200 mb-3" />
              <p className="text-stone-400 text-sm">暂无订单</p>
              <p className="text-stone-300 text-xs mt-1">有买家下单后会在这里显示</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100">
                    <th className="text-left px-4 py-3 text-stone-500 font-medium">商品名</th>
                    <th className="text-left px-4 py-3 text-stone-500 font-medium">买家</th>
                    <th className="text-left px-4 py-3 text-stone-500 font-medium">数量</th>
                    <th className="text-left px-4 py-3 text-stone-500 font-medium">总价</th>
                    <th className="text-left px-4 py-3 text-stone-500 font-medium">下单时间</th>
                  </tr>
                </thead>
                <tbody>
                  {[...orders].reverse().map((order) => {
                    const product = products.find((p) => p.id === order.productId);
                    return (
                      <tr
                        key={order.id}
                        className="border-b border-stone-50 hover:bg-stone-50/50 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-stone-800">
                          {product?.name || '已删除商品'}
                        </td>
                        <td className="px-4 py-3 text-stone-500">{order.buyerName}</td>
                        <td className="px-4 py-3 text-stone-500">{order.quantity}</td>
                        <td className="px-4 py-3 font-medium" style={{ color: '#D97706' }}>
                          ¥{order.totalPrice}
                        </td>
                        <td className="px-4 py-3 text-stone-400 text-xs">
                          {new Date(order.createdAt).toLocaleString('zh-CN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
