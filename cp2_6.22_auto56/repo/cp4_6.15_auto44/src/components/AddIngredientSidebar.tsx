import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Category, Zone } from '@/types';

interface AddIngredientSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    category: Category;
    quantity: number;
    unit: string;
    expiryDate: string;
    zone: Zone;
  }) => void;
}

const CATEGORIES: Category[] = ['蔬菜', '水果', '肉类', '蛋奶', '调料', '其他'];
const ZONES: Zone[] = ['冷藏', '冷冻'];

export default function AddIngredientSidebar({
  isOpen,
  onClose,
  onSubmit,
}: AddIngredientSidebarProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('蔬菜');
  const [zone, setZone] = useState<Zone>('冷藏');
  const [quantity, setQuantity] = useState<number>(0);
  const [unit, setUnit] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const resetForm = () => {
    setName('');
    setCategory('蔬菜');
    setZone('冷藏');
    setQuantity(0);
    setUnit('');
    setExpiryDate('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !unit.trim() || !expiryDate || quantity <= 0) return;
    onSubmit({ name: name.trim(), category, zone, quantity, unit: unit.trim(), expiryDate });
    resetForm();
    onClose();
  };

  const inputClass =
    'bg-white/60 rounded-lg px-3 py-2 w-full outline-none border-b-2 border-transparent focus:border-b-amber-400 transition-colors';

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed right-0 top-0 h-full w-96 max-w-[90vw] z-50 bg-cream-100/80 backdrop-blur-xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0 animate-slide-in' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-xl font-semibold">添加食材</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-white/40 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">食材名称</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">分类</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className={inputClass}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">存放区域</label>
              <select
                value={zone}
                onChange={(e) => setZone(e.target.value as Zone)}
                className={inputClass}
              >
                {ZONES.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">数量</label>
              <input
                type="number"
                min={1}
                value={quantity || ''}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className={inputClass}
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">单位</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="个/克/斤/袋..."
                className={inputClass}
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">保质期</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className={inputClass}
                required
              />
            </div>

            <div className="mt-auto pt-4">
              <button
                type="submit"
                className="flex items-center justify-center gap-2 w-full bg-category-vegetable text-white rounded-full px-6 py-2.5 hover:scale-105 active:scale-95 transition-transform"
              >
                <Plus size={18} />
                添加
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
