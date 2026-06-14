import { useState, useCallback } from 'react';
import { useMenuStore } from '@/hooks/useMenu';
import {
  DAYS, MEALS, CATEGORIES, CATEGORY_COLORS, ZONES,
  type Category, type DayOfWeek, type MealType, type Zone, type Recipe,
} from '@/types';
import { Clock, Plus, X, ChefHat, GripVertical } from 'lucide-react';

interface IngredientInput {
  name: string;
  quantity: number | '';
  unit: string;
  zone: Zone;
}

const emptyIng = (): IngredientInput => ({ name: '', quantity: 1, unit: '克', zone: '蔬菜区' });

function RecipeCard({ recipe, isFlyIn }: { recipe: Recipe; isFlyIn: boolean }) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('recipeId', recipe.id);
        e.dataTransfer.effectAllowed = 'move';
        (e.currentTarget as HTMLElement).classList.add('dragging');
      }}
      onDragEnd={(e) => {
        (e.currentTarget as HTMLElement).classList.remove('dragging');
      }}
      className={`drag-card bg-white rounded-lg p-2 shadow-sm ${isFlyIn ? 'animate-fly-in' : ''}`}
    >
      <div className="flex items-center gap-1 mb-1">
        <GripVertical size={14} className="text-gray-300" />
        <span className="text-[10px] px-1.5 py-0.5 rounded text-white font-medium" style={{ backgroundColor: CATEGORY_COLORS[recipe.category] }}>
          {recipe.category}
        </span>
      </div>
      <p className="text-xs font-medium truncate">{recipe.name}</p>
      <div className="flex items-center gap-1 mt-1 text-warm-olive text-[10px]">
        <Clock size={10} /> {recipe.cookTime}分钟
      </div>
    </div>
  );
}

function MealSlot({ day, meal, justDropped, onDropped }: { day: DayOfWeek; meal: MealType; justDropped: boolean; onDropped: (key: string) => void }) {
  const { assignRecipeToSlot, clearSlot, getRecipeById } = useMenuStore();
  const recipeId = useMenuStore((s) => s.weekMealPlans[s.currentWeek]?.[`${day}-${meal}`] ?? null);
  const recipe = recipeId ? getRecipeById(recipeId) : null;

  const handleDrop = useCallback((e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).classList.remove('drag-over');
    e.preventDefault();
    const id = e.dataTransfer.getData('recipeId');
    if (id) {
      assignRecipeToSlot(day, meal, id);
      onDropped(`${day}-${meal}`);
    }
  }, [day, meal, assignRecipeToSlot, onDropped]);

  return (
    <div
      key={justDropped ? `${day}-${meal}-drop` : `${day}-${meal}`}
      className={`meal-slot min-h-[56px] rounded-lg p-1.5 ${justDropped ? 'just-dropped' : ''}`}
      style={recipe ? { borderLeft: `3px solid ${CATEGORY_COLORS[recipe.category]}` } : {}}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; (e.currentTarget as HTMLElement).classList.add('drag-over'); }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          (e.currentTarget as HTMLElement).classList.remove('drag-over');
        }
      }}
      onDrop={handleDrop}
    >
      {recipe ? (
        <div className="relative">
          <p className="text-[10px] font-medium truncate pr-4">{recipe.name}</p>
          <div className="flex items-center gap-1 mt-0.5 text-warm-olive text-[9px]">
            <Clock size={9} /> {recipe.cookTime}分钟
          </div>
          <button onClick={() => clearSlot(day, meal)} className="absolute top-0 right-0 text-gray-400 hover:text-red-500">
            <X size={11} />
          </button>
        </div>
      ) : (
        <p className="text-[9px] text-gray-400 text-center leading-[48px] border-2 border-dashed border-gray-200 rounded">
          拖拽食谱到此处
        </p>
      )}
    </div>
  );
}

export default function MenuPlanner() {
  const recipes = useMenuStore((s) => s.recipes);
  const addCustomRecipe = useMenuStore((s) => s.addCustomRecipe);

  const [filter, setFilter] = useState<Category | '全部'>('全部');
  const [showForm, setShowForm] = useState(false);
  const [flyInId, setFlyInId] = useState<string | null>(null);
  const [droppedKey, setDroppedKey] = useState<string | null>(null);

  const [formName, setFormName] = useState('');
  const [formCat, setFormCat] = useState<Category>('中餐');
  const [formTime, setFormTime] = useState(30);
  const [formIngs, setFormIngs] = useState<IngredientInput[]>([emptyIng()]);
  const [formSteps, setFormSteps] = useState('');
  const [errors, setErrors] = useState<Set<string>>(new Set());

  const filtered = filter === '全部' ? recipes : recipes.filter((r) => r.category === filter);

  const handleDropped = useCallback((key: string) => {
    setDroppedKey(key);
    setTimeout(() => setDroppedKey(null), 500);
  }, []);

  const resetForm = useCallback(() => {
    setFormName(''); setFormCat('中餐'); setFormTime(30);
    setFormIngs([emptyIng()]); setFormSteps('');
    setErrors(new Set()); setShowForm(false);
  }, []);

  const updateIng = (idx: number, field: keyof IngredientInput, val: string | number) => {
    setFormIngs((prev) => prev.map((ing, i) => (i === idx ? { ...ing, [field]: val } : ing)));
  };

  const submitForm = () => {
    const next = new Set<string>();
    if (!formName.trim()) next.add('name');
    if (!formIngs.some((i) => i.name.trim())) {
      next.add('ingredients');
    } else {
      const hasInvalidQty = formIngs.some((i) => i.name.trim() && (isNaN(Number(i.quantity)) || Number(i.quantity) <= 0));
      if (hasInvalidQty) next.add('ingredients-qty');
    }
    setErrors(next);
    if (next.size) return;

    const id = `custom-${Date.now()}`;
    addCustomRecipe({
      id,
      name: formName.trim(),
      category: formCat,
      cookTime: formTime,
      ingredients: formIngs.filter((i) => i.name.trim()).map((i) => ({ ...i, quantity: Number(i.quantity) })),
      steps: formSteps.split('\n').filter(Boolean),
      isCustom: true,
    });
    setFlyInId(id);
    setTimeout(() => setFlyInId(null), 600);
    resetForm();
  };

  return (
    <div className="bg-warm-cream min-h-screen p-4 text-warm-dark">
      <div className="flex items-center gap-2 mb-4">
        <ChefHat className="text-warm-orange" size={28} />
        <h1 className="text-xl font-bold">每周食谱计划</h1>
      </div>

      {/* Recipe library */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <button
            onClick={() => setFilter('全部')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filter === '全部' ? 'bg-warm-orange text-white' : 'bg-white text-warm-dark'}`}
          >全部</button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filter === cat ? 'text-white' : 'bg-white text-warm-dark'}`}
              style={filter === cat ? { backgroundColor: CATEGORY_COLORS[cat] } : undefined}
            >{cat}</button>
          ))}
          <button
            onClick={() => setShowForm(true)}
            className="ml-auto flex items-center gap-1 bg-warm-orange text-white px-3 py-1 rounded-full text-xs font-medium hover:opacity-90"
          >
            <Plus size={14} /> 自定义食谱
          </button>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {filtered.map((r) => (
            <RecipeCard key={r.id} recipe={r} isFlyIn={flyInId === r.id} />
          ))}
        </div>
      </div>

      {/* Meal grid */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[640px]">
          <thead>
            <tr>
              <th className="p-1.5 w-12" />
              {DAYS.map((d) => (
                <th key={d} className="p-1.5 text-xs font-semibold text-warm-olive">{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MEALS.map((meal) => (
              <tr key={meal}>
                <td className="p-1.5 text-xs font-semibold text-warm-orange align-top whitespace-nowrap">{meal}</td>
                {DAYS.map((day) => {
                  const key = `${day}-${meal}`;
                  return (
                    <td key={key} className="p-0.5">
                      <MealSlot day={day} meal={meal} justDropped={droppedKey === key} onDropped={handleDropped} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Custom recipe form */}
      {showForm && (
        <div className="recipe-form-overlay fixed inset-0 bg-black/40 z-50 flex items-end" onClick={(e) => e.target === e.currentTarget && resetForm()}>
          <div className="recipe-form-panel bg-warm-cream w-full max-h-[80vh] overflow-y-auto rounded-t-2xl p-5 animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold">添加自定义食谱</h2>
              <button onClick={resetForm}><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium">食谱名称 *</label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="输入食谱名称"
                  className={`w-full border rounded px-2.5 py-1.5 text-sm mt-1 ${errors.has('name') ? 'border-red-500' : 'border-gray-300'}`}
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-medium">分类</label>
                  <select value={formCat} onChange={(e) => setFormCat(e.target.value as Category)} className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm mt-1">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium">烹饪时间(分钟)</label>
                  <input type="number" value={formTime} onChange={(e) => setFormTime(Number(e.target.value))} className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm mt-1" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium">食材 *</label>
                  {(errors.has('ingredients') || errors.has('ingredients-qty')) && (
                    <span className="text-red-500 text-[10px] font-medium">
                      {errors.has('ingredients') ? '请至少添加一个食材' : '食材数量必须为有效正数'}
                    </span>
                  )}
                </div>
                <div className={`space-y-1.5 mt-1 p-2 rounded border ${errors.has('ingredients') || errors.has('ingredients-qty') ? 'border-red-500 bg-red-50/30' : 'border-transparent'}`}>
                  {formIngs.map((ing, idx) => {
                    const hasInvalidQty = ing.name.trim() && (isNaN(Number(ing.quantity)) || Number(ing.quantity) <= 0);
                    return (
                      <div key={idx} className="flex gap-1 items-center text-xs">
                        <input value={ing.name} onChange={(e) => updateIng(idx, 'name', e.target.value)} placeholder="食材名" className="flex-1 border border-gray-300 rounded px-1.5 py-1 min-w-0" />
                        <input
                          type="number"
                          value={ing.quantity}
                          onChange={(e) => updateIng(idx, 'quantity', e.target.value === '' ? '' : Number(e.target.value))}
                          className={`w-14 border rounded px-1.5 py-1 ${hasInvalidQty ? 'border-red-400' : 'border-gray-300'}`}
                        />
                        <input value={ing.unit} onChange={(e) => updateIng(idx, 'unit', e.target.value)} className="w-12 border border-gray-300 rounded px-1.5 py-1" placeholder="单位" />
                        <select value={ing.zone} onChange={(e) => updateIng(idx, 'zone', e.target.value)} className="border border-gray-300 rounded px-1 py-1 text-[10px]">
                          {ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
                        </select>
                        <button onClick={() => setFormIngs((p) => p.filter((_, i) => i !== idx))} className="text-gray-400 hover:text-red-500 shrink-0">
                          <X size={13} />
                        </button>
                      </div>
                    );
                  })}
                  <button onClick={() => setFormIngs((p) => [...p, emptyIng()])} className="flex items-center gap-1 text-warm-orange text-xs font-medium">
                    <Plus size={13} /> 添加食材
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium">步骤 (每行一步)</label>
                <textarea value={formSteps} onChange={(e) => setFormSteps(e.target.value)} rows={3} className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm mt-1" placeholder="第一步...\n第二步..." />
              </div>
              <button onClick={submitForm} className="w-full bg-warm-orange text-white py-2 rounded-lg text-sm font-medium hover:opacity-90">
                添加食谱
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
