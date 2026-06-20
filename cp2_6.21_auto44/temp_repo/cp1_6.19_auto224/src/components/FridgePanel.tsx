import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Refrigerator, Inbox } from 'lucide-react';
import IngredientCard from './IngredientCard';
import AddIngredientModal from './AddIngredientModal';
import PreferenceSelector from './PreferenceSelector';
import { useStore } from '@/store/useStore';
import type { Ingredient, IngredientCategory, Unit } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export default function FridgePanel() {
  const [modalOpen, setModalOpen] = useState(false);

  const {
    ingredients,
    preferences,
    togglePreference,
    addIngredientAction,
    deleteIngredientAction,
    updateIngredientAction,
  } = useStore();

  const sortedIngredients = [...ingredients].sort(
    (a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
  );

  const handleAdd = (data: {
    name: string;
    category: IngredientCategory;
    quantity: number;
    unit: Unit;
    expiryDate: string;
  }) => {
    addIngredientAction(data);
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteIngredientAction(id);
  };

  const handleQuantityChange = (id: string, delta: number) => {
    const ingredient = ingredients.find((i) => i.id === id);
    if (!ingredient) return;
    const newQuantity = Math.max(0, ingredient.quantity + delta);
    updateIngredientAction(id, { quantity: newQuantity });
  };

  return (
    <motion.aside
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="flex h-full w-full flex-col border-b border-[var(--border)] bg-white/60 backdrop-blur-sm md:h-screen md:w-[400px] md:border-b-0 md:border-r md:flex-shrink-0"
    >
      <div className="border-b border-[var(--border)] p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--primary)]/10">
              <Refrigerator className="h-5 w-5 text-[var(--primary)]" />
            </div>
            <h1 className="text-xl font-bold text-[var(--text)]">我的冰箱</h1>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="ripple flex items-center gap-1 rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-green-200 transition-colors hover:bg-[#43A047] active:scale-[0.97]"
          >
            <Plus className="h-4 w-4" />
            添加
          </button>
        </div>
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            口味偏好
          </div>
          <PreferenceSelector selected={preferences} onChange={togglePreference} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="popLayout">
          {sortedIngredients.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex h-full flex-col items-center justify-center py-16 text-center"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
                <Inbox className="h-8 w-8 text-gray-300" />
              </div>
              <p className="mb-1 text-sm font-medium text-gray-500">冰箱空空如也</p>
              <p className="text-xs text-gray-400">点击右上角添加食材开始吧</p>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              {sortedIngredients.map((ingredient) => (
                <IngredientCard
                  key={ingredient.id}
                  ingredient={ingredient}
                  onDelete={handleDelete}
                  onQuantityChange={handleQuantityChange}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      <AddIngredientModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={handleAdd}
      />
    </motion.aside>
  );
}
