import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { IngredientCategory, Unit } from '@/types';
import { CATEGORY_LABEL } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (data: {
    name: string;
    category: IngredientCategory;
    quantity: number;
    unit: Unit;
    expiryDate: string;
  }) => void;
}

const CATEGORIES: IngredientCategory[] = [
  'vegetable',
  'fruit',
  'meat',
  'seafood',
  'dairy',
  'grain',
  'seasoning',
  'other',
];

const UNITS: Unit[] = ['g', 'kg', 'ml', 'L', '个', '包', '盒'];

export default function AddIngredientModal({ open, onClose, onAdd }: Props) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<IngredientCategory>('vegetable');
  const [quantity, setQuantity] = useState<number>(100);
  const [unit, setUnit] = useState<Unit>('g');
  const [expiryDate, setExpiryDate] = useState('');

  useEffect(() => {
    if (open) {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      setExpiryDate(d.toISOString().slice(0, 10));
      setName('');
      setCategory('vegetable');
      setQuantity(100);
      setUnit('g');
    }
  }, [open]);

  const handleSubmit = () => {
    if (!name.trim() || quantity <= 0 || !expiryDate) return;
    onAdd({ name: name.trim(), category, quantity, unit, expiryDate });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-bold text-[var(--text)]">添加食材</h2>
                <button
                  onClick={onClose}
                  className="ripple flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-500">
                    食材名称
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="如：西红柿"
                    className="w-full rounded-xl border border-[var(--border)] bg-gray-50 px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--primary)] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-500">
                    类别
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c}
                        onClick={() => setCategory(c)}
                        className={`ripple rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                          category === c
                            ? 'bg-[var(--primary)] text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {CATEGORY_LABEL[c]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-500">
                      数量
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full rounded-xl border border-[var(--border)] bg-gray-50 px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--primary)] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-500">
                      单位
                    </label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value as Unit)}
                      className="w-full rounded-xl border border-[var(--border)] bg-gray-50 px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--primary)] focus:bg-white"
                    >
                      {UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-500">
                    过期日期
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-gray-50 px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--primary)] focus:bg-white"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={onClose}
                  className="ripple flex-1 rounded-xl border border-[var(--border)] bg-white py-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 active:scale-[0.98]"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!name.trim() || quantity <= 0 || !expiryDate}
                  className="ripple flex-1 rounded-xl bg-[var(--primary)] py-3 text-sm font-semibold text-white shadow-md shadow-green-200 transition-all hover:bg-[#43A047] active:scale-[0.98] disabled:opacity-50"
                >
                  确认添加
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
