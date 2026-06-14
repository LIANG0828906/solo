import { useState, useMemo, useCallback, useEffect } from 'react';
import type { Ingredient, IngredientCategory, IngredientUnit } from '@/shared/types';
import { CATEGORY_LABELS, UNIT_LABELS } from '@/shared/types';
import { useAppStore } from '@/shared/store';
import { isExpired, isExpiringSoon, daysUntilExpiry, formatExpiryDate } from '@/shared/utils';
import { Plus, Pencil, Trash2, AlertTriangle, ChevronDown, ChevronRight, Search, Package } from 'lucide-react';

function useDebounce<T>(value: T, delay: number = 200): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const CATEGORY_BORDER_COLORS: Record<IngredientCategory, string> = {
  vegetables: 'border-l-green-500',
  meat: 'border-l-red-500',
  seafood: 'border-l-blue-500',
  seasoning: 'border-l-amber-500',
  grains: 'border-l-yellow-500',
  dairy: 'border-l-sky-500',
  fruits: 'border-l-pink-500',
  others: 'border-l-gray-400',
};

type FormData = {
  name: string;
  category: IngredientCategory;
  quantity: number;
  unit: IngredientUnit;
  expiryDate: string;
};

const EMPTY_FORM: FormData = {
  name: '',
  category: 'vegetables',
  quantity: 1,
  unit: 'g',
  expiryDate: '',
};

export default function InventoryManager() {
  const ingredients = useAppStore((s) => s.ingredients);
  const addIngredient = useAppStore((s) => s.addIngredient);
  const updateIngredient = useAppStore((s) => s.updateIngredient);
  const deleteIngredient = useAppStore((s) => s.deleteIngredient);

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 200);
  const [expandedCategories, setExpandedCategories] = useState<Set<IngredientCategory>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return q ? ingredients.filter((i) => i.name.toLowerCase().includes(q)) : ingredients;
  }, [ingredients, debouncedSearch]);

  const handleDelete = useCallback((id: string) => {
    setDeletingIds((prev) => new Set(prev).add(id));
  }, []);

  const handleAnimationEnd = useCallback((e: React.AnimationEvent<HTMLDivElement>, id: string) => {
    if (e.animationName === 'slide-out-left') {
      deleteIngredient(id);
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, [deleteIngredient]);

  const grouped = useMemo(() => {
    const map = new Map<IngredientCategory, Ingredient[]>();
    for (const cat of Object.keys(CATEGORY_LABELS) as IngredientCategory[]) {
      const items = filtered.filter((i) => i.category === cat);
      if (items.length > 0) {
        items.sort((a, b) => {
          const aExpired = isExpired(a.expiryDate);
          const bExpired = isExpired(b.expiryDate);
          if (aExpired && !bExpired) return -1;
          if (!aExpired && bExpired) return 1;
          return daysUntilExpiry(a.expiryDate) - daysUntilExpiry(b.expiryDate);
        });
        map.set(cat, items);
      }
    }
    return map;
  }, [filtered]);

  const toggleCategory = (cat: IngredientCategory) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  const openAddModal = () => {
    setEditingIngredient(null);
    setFormData(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEditModal = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    setFormData({
      name: ingredient.name,
      category: ingredient.category,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      expiryDate: ingredient.expiryDate,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingIngredient(null);
    setFormData(EMPTY_FORM);
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.quantity || !formData.expiryDate) return;
    if (editingIngredient) {
      updateIngredient(editingIngredient.id, {
        name: formData.name.trim(),
        category: formData.category,
        quantity: formData.quantity,
        unit: formData.unit,
        expiryDate: formData.expiryDate,
      });
    } else {
      addIngredient({
        name: formData.name.trim(),
        category: formData.category,
        quantity: formData.quantity,
        unit: formData.unit,
        expiryDate: formData.expiryDate,
      });
    }
    closeModal();
  };

  const getExpiryColor = (date: string) => {
    if (isExpired(date)) return 'text-red-600';
    if (isExpiringSoon(date)) return 'text-orange-500';
    return 'text-gray-600';
  };

  return (
    <div className="min-h-screen bg-cream-50 p-4 font-sans">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-wood-700">我的食材库</h1>
          <button
            onClick={openAddModal}
            className="flex items-center gap-1 rounded-lg bg-olive-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-olive-600"
          >
            <Plus size={16} />
            添加食材
          </button>
        </div>

        <div className="relative mb-6">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-wood-400" />
          <input
            type="text"
            placeholder="搜索食材..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-wood-200 bg-white py-2.5 pl-10 pr-4 text-sm text-wood-800 placeholder-wood-300 outline-none transition-shadow focus:border-olive-400 focus:shadow-md"
          />
        </div>

        {ingredients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-wood-400">
            <Package size={64} strokeWidth={1.2} />
            <p className="mt-4 text-lg">还没有食材，点击上方按钮添加吧</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-wood-400">没有找到匹配的食材</div>
        ) : (
          <div className="space-y-4">
            {Array.from(grouped.entries()).map(([category, items]) => {
              const expanded = expandedCategories.has(category);
              return (
                <div key={category}>
                  <button
                    onClick={() => toggleCategory(category)}
                    className="flex w-full items-center gap-2 rounded-lg bg-wood-50 px-4 py-3 text-left transition-colors hover:bg-wood-100"
                  >
                    {expanded ? (
                      <ChevronDown size={18} className="text-wood-500" />
                    ) : (
                      <ChevronRight size={18} className="text-wood-500" />
                    )}
                    <span className="font-medium text-wood-700">{CATEGORY_LABELS[category]}</span>
                    <span className="ml-1 rounded-full bg-olive-100 px-2 py-0.5 text-xs font-medium text-olive-700">
                      {items.length}
                    </span>
                  </button>

                  {expanded && (
                    <div className="mt-2 space-y-2">
                      {items.map((ingredient) => {
                        const expired = isExpired(ingredient.expiryDate);
                        const expiringSoon = isExpiringSoon(ingredient.expiryDate);
                        const deleting = deletingIds.has(ingredient.id);

                        return (
                          <div
                            key={ingredient.id}
                            onAnimationEnd={(e) => handleAnimationEnd(e, ingredient.id)}
                            className={`card-ingredient overflow-hidden ${CATEGORY_BORDER_COLORS[ingredient.category]} border-l-4 ${deleting ? 'slide-out-left' : ''}`}
                          >
                            {expired && (
                              <div className="flex items-center gap-1.5 rounded-t-xl bg-yellow-100 px-4 py-1.5 text-xs font-medium text-yellow-800">
                                <AlertTriangle size={14} />
                                已过期
                              </div>
                            )}
                            {!expired && expiringSoon && (
                              <div className="flex items-center gap-1.5 rounded-t-xl bg-orange-50 px-4 py-1.5 text-xs font-medium text-orange-600">
                                <AlertTriangle size={14} />
                                即将过期
                              </div>
                            )}
                            <div className="flex items-center justify-between px-4 py-3">
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-medium text-wood-800">{ingredient.name}</p>
                                <p className="mt-0.5 text-sm text-wood-500">
                                  {ingredient.quantity} {UNIT_LABELS[ingredient.unit]}
                                </p>
                                <p className={`mt-0.5 text-sm ${getExpiryColor(ingredient.expiryDate)}`}>
                                  {formatExpiryDate(ingredient.expiryDate)}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => openEditModal(ingredient)}
                                  className="rounded-lg p-2 text-wood-400 transition-colors hover:bg-wood-50 hover:text-wood-600"
                                >
                                  <Pencil size={16} />
                                </button>
                                <button
                                  onClick={() => handleDelete(ingredient.id)}
                                  className="rounded-lg p-2 text-wood-400 transition-colors hover:bg-red-50 hover:text-red-500"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
          <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-wood-700">
              {editingIngredient ? '编辑食材' : '添加食材'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-wood-600">名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-wood-200 px-3 py-2 text-sm outline-none focus:border-olive-400"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-wood-600">分类</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData((f) => ({ ...f, category: e.target.value as IngredientCategory }))}
                  className="w-full rounded-lg border border-wood-200 px-3 py-2 text-sm outline-none focus:border-olive-400"
                >
                  {(Object.keys(CATEGORY_LABELS) as IngredientCategory[]).map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_LABELS[cat]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium text-wood-600">数量</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.quantity}
                    onChange={(e) => setFormData((f) => ({ ...f, quantity: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-wood-200 px-3 py-2 text-sm outline-none focus:border-olive-400"
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium text-wood-600">单位</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData((f) => ({ ...f, unit: e.target.value as IngredientUnit }))}
                    className="w-full rounded-lg border border-wood-200 px-3 py-2 text-sm outline-none focus:border-olive-400"
                  >
                    {(Object.keys(UNIT_LABELS) as IngredientUnit[]).map((u) => (
                      <option key={u} value={u}>
                        {UNIT_LABELS[u]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-wood-600">过期日期</label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData((f) => ({ ...f, expiryDate: e.target.value }))}
                  className="w-full rounded-lg border border-wood-200 px-3 py-2 text-sm outline-none focus:border-olive-400"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="rounded-lg border border-wood-200 px-4 py-2 text-sm font-medium text-wood-600 transition-colors hover:bg-wood-50"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.name.trim() || !formData.quantity || !formData.expiryDate}
                className="rounded-lg bg-olive-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-olive-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
