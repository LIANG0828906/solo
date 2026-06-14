import { useState, useCallback } from 'react';
import { Plus, Store, Edit2, Trash2 } from 'lucide-react';
import { useMarketStore } from '@/store/useMarketStore';
import { AREA_OPTIONS, CATEGORY_LABELS, type Stall, type Product, type ProductCategory } from '@/types';
import { ProductCard } from './ProductCard';
import { Modal } from './Modal';

const CATEGORIES: ProductCategory[] = ['clothing', 'handmade', 'books', 'electronics', 'other'];
const DEFAULT_COLORS = ['#FEF3C7', '#FED7AA', '#FDE68A', '#FECACA', '#BFDBFE', '#DDD6FE'];

export function StallModule() {
  const stalls = useMarketStore(s => s.stalls);
  const products = useMarketStore(s => s.products);
  const addStall = useMarketStore(s => s.addStall);
  const updateStall = useMarketStore(s => s.updateStall);
  const deleteStall = useMarketStore(s => s.deleteStall);
  const addProduct = useMarketStore(s => s.addProduct);
  const updateProduct = useMarketStore(s => s.updateProduct);
  const deleteProduct = useMarketStore(s => s.deleteProduct);

  const [activeStallId, setActiveStallId] = useState<string | null>(stalls[0]?.id ?? null);

  const [stallModal, setStallModal] = useState(false);
  const [editingStall, setEditingStall] = useState<Stall | null>(null);
  const [stallForm, setStallForm] = useState({
    name: '',
    description: '',
    backgroundColor: DEFAULT_COLORS[0],
    area: AREA_OPTIONS[0],
  });

  const [productModal, setProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    price: 0,
    quantity: 0,
    imageUrl: '',
    description: '',
    category: 'other' as ProductCategory,
  });

  const openStallModal = useCallback((stall?: Stall) => {
    if (stall) {
      setEditingStall(stall);
      setStallForm({
        name: stall.name,
        description: stall.description,
        backgroundColor: stall.backgroundColor,
        area: stall.area,
      });
    } else {
      setEditingStall(null);
      setStallForm({
        name: '',
        description: '',
        backgroundColor: DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)],
        area: AREA_OPTIONS[0],
      });
    }
    setStallModal(true);
  }, []);

  const submitStall = useCallback(() => {
    if (!stallForm.name.trim()) return;
    if (editingStall) {
      updateStall(editingStall.id, stallForm);
    } else {
      const newStall = addStall(stallForm);
      setActiveStallId(newStall.id);
    }
    setStallModal(false);
  }, [stallForm, editingStall, addStall, updateStall]);

  const openProductModal = useCallback((product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        price: product.price,
        quantity: product.quantity,
        imageUrl: product.imageUrl,
        description: product.description,
        category: product.category,
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '',
        price: 0,
        quantity: 0,
        imageUrl: '',
        description: '',
        category: 'other',
      });
    }
    setProductModal(true);
  }, []);

  const submitProduct = useCallback(() => {
    if (!activeStallId || !productForm.name.trim()) return;
    const data = {
      ...productForm,
      imageUrl: productForm.imageUrl || getDefaultImage(productForm.category),
    };
    if (editingProduct) {
      updateProduct(editingProduct.id, data);
    } else {
      addProduct({ ...data, stallId: activeStallId });
    }
    setProductModal(false);
  }, [activeStallId, productForm, editingProduct, addProduct, updateProduct]);

  const handleDeleteStall = useCallback((id: string) => {
    if (!confirm('确定删除该摊位及其所有商品吗？')) return;
    deleteStall(id);
    if (activeStallId === id) {
      setActiveStallId(stalls.find(s => s.id !== id)?.id ?? null);
    }
  }, [activeStallId, stalls, deleteStall]);

  const handleDeleteProduct = useCallback((id: string) => {
    if (!confirm('确定删除该商品吗？')) return;
    deleteProduct(id);
  }, [deleteProduct]);

  const activeStall = stalls.find(s => s.id === activeStallId);
  const stallProducts = products.filter(p => p.stallId === activeStallId);

  return (
    <div className="space-y-6">
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-bold text-amber-900 flex items-center gap-2">
            <Store size={22} /> 我的摊位
          </h2>
          <button onClick={() => openStallModal()} className="btn-primary flex items-center gap-1.5">
            <Plus size={18} /> 新建摊位
          </button>
        </div>

        {stalls.length === 0 ? (
          <div className="text-center py-12 text-amber-600">
            <Store size={48} className="mx-auto mb-3 opacity-40" />
            <p>还没有摊位，点击上方按钮创建您的第一个摊位</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {stalls.map(stall => (
              <div
                key={stall.id}
                onClick={() => setActiveStallId(stall.id)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer border
                           transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]
                           ${activeStallId === stall.id
                             ? 'border-amber-600 shadow-md scale-[1.02]'
                             : 'border-amber-500/30 hover:border-amber-500/60'}`}
                style={{ backgroundColor: stall.backgroundColor }}
              >
                <Store size={18} className="text-amber-800" />
                <span className="font-medium text-amber-900">{stall.name}</span>
                <span className="text-xs text-amber-700">{stall.area}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openStallModal(stall);
                  }}
                  className="ml-1 p-1 rounded hover:bg-white/50 transition-colors"
                  aria-label="编辑摊位"
                >
                  <Edit2 size={14} className="text-amber-800" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteStall(stall.id);
                  }}
                  className="p-1 rounded hover:bg-red-100/50 transition-colors"
                  aria-label="删除摊位"
                >
                  <Trash2 size={14} className="text-red-500" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {activeStall && (
        <div className="glass-card p-4" style={{ backgroundColor: `${activeStall.backgroundColor}60` }}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-display font-bold text-amber-900">{activeStall.name}</h3>
              <p className="text-sm text-amber-700 mt-1">{activeStall.description || '暂无简介'}</p>
              <p className="text-xs text-amber-600 mt-1">区域: {activeStall.area}</p>
            </div>
            <button
              onClick={() => openProductModal()}
              className="btn-primary flex items-center gap-1.5"
            >
              <Plus size={16} /> 上架商品
            </button>
          </div>

          {stallProducts.length === 0 ? (
            <div className="text-center py-10 text-amber-600">
              <p>还没有商品，点击"上架商品"添加第一件商品</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {stallProducts.map((product, idx) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={idx}
                  showManagement
                  onEdit={(p) => openProductModal(p)}
                  onDelete={handleDeleteProduct}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <Modal
        open={stallModal}
        onClose={() => setStallModal(false)}
        title={editingStall ? '编辑摊位' : '新建摊位'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-amber-800 mb-1">摊位名称 *</label>
            <input
              type="text"
              value={stallForm.name}
              onChange={(e) => setStallForm(s => ({ ...s, name: e.target.value }))}
              placeholder="请输入摊位名称"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-amber-800 mb-1">摊位简介</label>
            <textarea
              value={stallForm.description}
              onChange={(e) => setStallForm(s => ({ ...s, description: e.target.value }))}
              placeholder="介绍一下您的摊位"
              rows={3}
              className="input-field resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-amber-800 mb-1">所在区域</label>
              <select
                value={stallForm.area}
                onChange={(e) => setStallForm(s => ({ ...s, area: e.target.value }))}
                className="input-field"
              >
                {AREA_OPTIONS.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-800 mb-1">背景颜色</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={stallForm.backgroundColor}
                  onChange={(e) => setStallForm(s => ({ ...s, backgroundColor: e.target.value }))}
                  className="w-12 h-10 rounded cursor-pointer border border-amber-500/30"
                />
                <div className="flex gap-1 flex-wrap flex-1">
                  {DEFAULT_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setStallForm(s => ({ ...s, backgroundColor: c }))}
                      className="w-7 h-7 rounded-full border-2 border-white shadow-sm transition-transform hover:scale-110"
                      style={{ backgroundColor: c }}
                      aria-label={`选择颜色 ${c}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setStallModal(false)} className="btn-secondary flex-1">
              取消
            </button>
            <button
              onClick={submitStall}
              disabled={!stallForm.name.trim()}
              className="btn-primary flex-1"
            >
              {editingStall ? '保存修改' : '创建摊位'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={productModal}
        onClose={() => setProductModal(false)}
        title={editingProduct ? '编辑商品' : '上架商品'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-amber-800 mb-1">商品名称 *</label>
            <input
              type="text"
              value={productForm.name}
              onChange={(e) => setProductForm(p => ({ ...p, name: e.target.value }))}
              placeholder="请输入商品名称"
              className="input-field"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-amber-800 mb-1">价格 (¥)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={productForm.price}
                onChange={(e) => setProductForm(p => ({ ...p, price: Number(e.target.value) || 0 }))}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-800 mb-1">库存数量</label>
              <input
                type="number"
                min={0}
                value={productForm.quantity}
                onChange={(e) => setProductForm(p => ({ ...p, quantity: Number(e.target.value) || 0 }))}
                className="input-field"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-amber-800 mb-1">商品类别</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setProductForm(p => ({ ...p, category: c }))}
                  className={`category-chip ${
                    productForm.category === c ? 'category-chip-active' : 'category-chip-inactive'
                  }`}
                >
                  {CATEGORY_LABELS[c]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-amber-800 mb-1">图片链接</label>
            <input
              type="url"
              value={productForm.imageUrl}
              onChange={(e) => setProductForm(p => ({ ...p, imageUrl: e.target.value }))}
              placeholder="https://... (可选，将使用默认图)"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-amber-800 mb-1">商品描述</label>
            <textarea
              value={productForm.description}
              onChange={(e) => setProductForm(p => ({ ...p, description: e.target.value }))}
              placeholder="简单介绍一下这件商品"
              rows={3}
              className="input-field resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setProductModal(false)} className="btn-secondary flex-1">
              取消
            </button>
            <button
              onClick={submitProduct}
              disabled={!productForm.name.trim()}
              className="btn-primary flex-1"
            >
              {editingProduct ? '保存修改' : '上架商品'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function getDefaultImage(category: ProductCategory): string {
  const map: Record<ProductCategory, string> = {
    clothing: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=vintage%20clothing%20flea%20market&image_size=square',
    handmade: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=handmade%20crafts%20flea%20market&image_size=square',
    books: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=old%20books%20flea%20market&image_size=square',
    electronics: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=vintage%20electronics%20flea%20market&image_size=square',
    other: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=miscellaneous%20flea%20market%20items&image_size=square',
  };
  return map[category];
}
