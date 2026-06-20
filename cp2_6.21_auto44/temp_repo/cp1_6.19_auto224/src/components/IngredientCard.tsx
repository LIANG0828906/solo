import { motion } from 'framer-motion';
import { Trash2, Plus, Minus } from 'lucide-react';
import type { Ingredient, IngredientCategory } from '@/types';
import { CATEGORY_LABEL } from '@/types';

interface Props {
  ingredient: Ingredient;
  onDelete: (id: string) => void;
  onQuantityChange: (id: string, delta: number) => void;
}

function categoryIcon(cat: IngredientCategory) {
  const icons: Record<IngredientCategory, string> = {
    vegetable: '🥬',
    fruit: '🍎',
    meat: '🥩',
    seafood: '🐟',
    dairy: '🥛',
    grain: '🍚',
    seasoning: '🧂',
    other: '📦',
  };
  return icons[cat] || '📦';
}

export default function IngredientCard({ ingredient, onDelete, onQuantityChange }: Props) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expiry = new Date(ingredient.expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const isExpired = expiry.getTime() < now.getTime();
  const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const dateLabel = isExpired
    ? '已过期'
    : daysLeft === 0
    ? '今天到期'
    : daysLeft === 1
    ? '明天到期'
    : `${daysLeft}天后过期`;

  const borderColor = isExpired ? 'border-[var(--danger)]' : 'border-[var(--border)]';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, x: -20 }}
      transition={{ duration: 0.25 }}
      className={`ripple flex w-[380px] h-[80px] items-center gap-3 rounded-[12px] border-2 ${borderColor} bg-white px-4 py-3 shadow-sm transition-colors`}
      style={{ maxWidth: '100%' }}
    >
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gray-50 text-2xl">
        {categoryIcon(ingredient.category)}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-[var(--text)]">
            {ingredient.name}
          </span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
            {CATEGORY_LABEL[ingredient.category]}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-3">
          <span className="text-xs font-medium text-gray-600">
            {ingredient.quantity} {ingredient.unit}
          </span>
          <span className={`text-xs font-semibold ${isExpired ? 'text-[var(--danger)]' : 'text-gray-400'}`}>
            {dateLabel}
          </span>
        </div>
      </div>
      <div className="flex flex-shrink-0 items-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuantityChange(ingredient.id, -1);
          }}
          className="ripple flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 active:scale-95"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuantityChange(ingredient.id, 1);
          }}
          className="ripple flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(ingredient.id);
          }}
          className="ripple ml-1 flex h-7 w-7 items-center justify-center rounded-lg text-gray-300 transition-colors hover:bg-red-50 hover:text-[var(--danger)] active:scale-95"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
