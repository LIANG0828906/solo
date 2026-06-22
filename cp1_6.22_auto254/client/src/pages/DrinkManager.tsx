import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Leaf, Snowflake } from 'lucide-react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { useAppStore } from '../store/useAppStore';
import type { Drink, DrinkCategory, CreateDrinkRequest } from '@shared/types';

interface FormIngredient {
  ingredientName: string;
  amount: number;
  unit: string;
}

export const DrinkManager: React.FC = () => {
  const { drinks, ingredients, loadDrinks, loadIngredients, addDrink, updateDrink, deleteDrink, loading } =
    useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDrink, setEditingDrink] = useState<Drink | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'seasonal' as DrinkCategory,
    price: '',
    costPrice: '',
    ingredients: [] as FormIngredient[],
  });

  useEffect(() => {
    loadDrinks();
    loadIngredients();
  }, [loadDrinks, loadIngredients]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'seasonal',
      price: '',
      costPrice: '',
      ingredients: [],
    });
    setEditingDrink(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (drink: Drink) => {
    setEditingDrink(drink);
    setFormData({
      name: drink.name,
      description: drink.description,
      category: drink.category,
      price: drink.price.toString(),
      costPrice: drink.costPrice.toString(),
      ingredients: drink.ingredients.map((ing) => ({
        ingredientName: ing.ingredientName,
        amount: ing.amount,
        unit: ing.unit,
      })),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const drinkData: CreateDrinkRequest = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        price: parseFloat(formData.price),
        costPrice: parseFloat(formData.costPrice),
        ingredients: formData.ingredients,
      };

      if (editingDrink) {
        await updateDrink(editingDrink.id, drinkData);
      } else {
        await addDrink(drinkData);
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      // 错误已在 store 中处理
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这款饮品吗？')) {
      try {
        await deleteDrink(id);
      } catch (error) {
        // 错误已在 store 中处理
      }
    }
  };

  const addIngredientRow = () => {
    setFormData((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, { ingredientName: '', amount: 0, unit: 'ml' }],
    }));
  };

  const updateIngredientRow = (index: number, field: keyof FormIngredient, value: string | number) => {
    setFormData((prev) => {
      const newIngredients = [...prev.ingredients];
      newIngredients[index] = { ...newIngredients[index], [field]: value };
      return { ...prev, ingredients: newIngredients };
    });
  };

  const removeIngredientRow = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  const profitMargin =
    parseFloat(formData.price) && parseFloat(formData.costPrice)
      ? (((parseFloat(formData.price) - parseFloat(formData.costPrice)) / parseFloat(formData.price)) * 100).toFixed(1)
      : '0';

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            饮品管理
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            管理菜单饮品，设置配方和定价
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus size={18} />
          新建饮品
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading && drinks.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <p style={{ color: 'var(--color-text-secondary)' }}>加载中...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {drinks.map((drink, index) => (
              <div
                key={drink.id}
                className="relative flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-lg overflow-hidden animate-fade-in"
                style={{
                  width: '100%',
                  maxWidth: '260px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--color-card-bg)',
                  border: '1px solid var(--color-card-border)',
                  animationDelay: `${index * 0.05}s`,
                }}
              >
                <div className="absolute top-0 left-0 p-3">
                  <span
                    className="px-3 py-1 text-xs font-medium text-white rounded-full"
                    style={{
                      backgroundColor:
                        drink.category === 'seasonal'
                          ? 'var(--color-seasonal-tag)'
                          : 'var(--color-classic-tag)',
                    }}
                  >
                    {drink.category === 'seasonal' ? (
                      <span className="flex items-center gap-1">
                        <Snowflake size={12} />
                        季节限定
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Leaf size={12} />
                        经典
                      </span>
                    )}
                  </span>
                </div>

                <div className="absolute top-3 right-3 flex gap-2">
                  <button
                    onClick={() => openEditModal(drink)}
                    className="p-2 rounded-lg bg-white/80 hover:bg-white transition-colors shadow-sm"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(drink.id)}
                    className="p-2 rounded-lg bg-white/80 hover:bg-red-50 transition-colors shadow-sm"
                    style={{ color: 'var(--color-warning)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="p-5 pt-14 flex flex-col flex-1">
                  <h3 className="font-semibold text-lg mb-1" style={{ color: 'var(--color-text-primary)' }}>
                    {drink.name}
                  </h3>
                  <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
                    {drink.description}
                  </p>

                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                      ¥{drink.price}
                    </span>
                    <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      成本 ¥{drink.costPrice}
                    </span>
                  </div>

                  <div className="mt-auto">
                    <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                      原料配方：
                    </div>
                    <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                      {drink.ingredients.map((ing, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-1 rounded-full bg-white/60"
                          style={{ color: 'var(--color-text-secondary)' }}
                        >
                          {ing.ingredientName} {ing.amount}
                          {ing.unit}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDrink ? '编辑饮品' : '新建饮品'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
              饮品名称
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
              style={{
                borderColor: 'var(--color-border)',
                backgroundColor: 'white',
              }}
              placeholder="如：秋日南瓜拿铁"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
              饮品描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 resize-none"
              style={{ borderColor: 'var(--color-border)' }}
              rows={2}
              placeholder="简短描述饮品特色"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
              分类
            </label>
            <div className="flex gap-4">
              {(['seasonal', 'classic'] as const).map((cat) => (
                <label key={cat} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    value={cat}
                    checked={formData.category === cat}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, category: e.target.value as DrinkCategory }))
                    }
                  />
                  <span style={{ color: 'var(--color-text-primary)' }}>
                    {cat === 'seasonal' ? '季节限定' : '经典'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
                售价 (元)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                style={{ borderColor: 'var(--color-border)' }}
                placeholder="38.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
                成本价 (元)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.costPrice}
                onChange={(e) => setFormData((prev) => ({ ...prev, costPrice: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                style={{ borderColor: 'var(--color-border)' }}
                placeholder="12.00"
                required
              />
            </div>
          </div>

          {parseFloat(formData.price) > 0 && (
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-alternate-row)' }}>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                预计利润率：
                <span className="font-bold ml-1" style={{ color: 'var(--color-classic-tag)' }}>
                  {profitMargin}%
                </span>
              </p>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                原料配方
              </label>
              <button
                type="button"
                onClick={addIngredientRow}
                className="text-sm font-medium"
                style={{ color: 'var(--color-button)' }}
              >
                + 添加原料
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {formData.ingredients.map((ing, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <select
                    value={ing.ingredientName}
                    onChange={(e) => updateIngredientRow(index, 'ingredientName', e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border text-sm"
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    <option value="">选择原料</option>
                    {ingredients.map((ing) => (
                      <option key={ing.id} value={ing.name}>
                        {ing.name} ({ing.unit})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={ing.amount || ''}
                    onChange={(e) =>
                      updateIngredientRow(index, 'amount', parseFloat(e.target.value) || 0)
                    }
                    className="w-20 px-3 py-2 rounded-lg border text-sm"
                    style={{ borderColor: 'var(--color-border)' }}
                    placeholder="用量"
                  />
                  <span className="text-sm w-12" style={{ color: 'var(--color-text-secondary)' }}>
                    {ing.unit}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeIngredientRow(index)}
                    className="p-2 text-sm"
                    style={{ color: 'var(--color-warning)' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {formData.ingredients.length === 0 && (
                <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-secondary)' }}>
                  暂无原料，请点击上方添加
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => setIsModalOpen(false)}
            >
              取消
            </Button>
            <Button type="submit" fullWidth disabled={loading}>
              {editingDrink ? '保存修改' : '创建饮品'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
