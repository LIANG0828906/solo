import { X } from 'lucide-react';
import type { Ingredient } from '@/types';

interface IngredientItemProps {
  ingredient: Ingredient;
  checked: boolean;
  onCheck: () => void;
  onDelete: () => void;
}

export default function IngredientItem({ ingredient, checked, onCheck, onDelete }: IngredientItemProps) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-200 ${checked ? 'bg-cream-dark' : 'hover:bg-cream'}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onCheck}
        className="w-4.5 h-4.5 rounded border-warm-border text-warm-orange-deep focus:ring-warm-orange accent-warm-orange-deep cursor-pointer"
      />
      <span className={`flex-1 text-sm transition-all duration-200 ${checked ? 'line-through text-warm-gray' : 'text-warm-brown'}`}>
        {ingredient.name}
      </span>
      <span className="text-sm text-warm-brown-light min-w-[80px] text-right">
        {ingredient.amount}{ingredient.unit}
      </span>
      <button
        onClick={onDelete}
        className="btn-ripple active:scale-95 transition-transform p-1.5 rounded-lg text-warm-gray hover:text-red-500 hover:bg-red-50"
      >
        <X size={16} />
      </button>
    </div>
  );
}
