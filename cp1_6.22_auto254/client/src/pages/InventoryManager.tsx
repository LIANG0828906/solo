import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { useAppStore } from '../store/useAppStore';
import type { Ingredient, CreateIngredientRequest } from '@shared/types';

export const InventoryManager: React.FC = () => {
  const { ingredients, loadIngredients, addIngredient, updateIngredient, deleteIngredient, loading } =
    useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    stock: '',
    unit: 'ml',
    purchasePrice: '',
    warningThreshold: '',
  });

  useEffect(() => {
    loadIngredients();
  }, [loadIngredients]);

  const lowStockCount = ingredients.filter((ing) => ing.stock <= ing.warningThreshold).length;

  const resetForm = () => {
    setFormData({
      name: '',
      stock: '',
      unit: 'ml',
      purchasePrice: '',
      warningThreshold: '',
    });
    setEditingIngredient(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    setFormData({
      name: ingredient.name,
      stock: ingredient.stock.toString(),
      unit: ingredient.unit,
      purchasePrice: ingredient.purchasePrice.toString(),
      warningThreshold: ingredient.warningThreshold.toString(),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const ingredientData: CreateIngredientRequest = {
        name: formData.name,
        stock: parseFloat(formData.stock),
        unit: formData.unit,
        purchasePrice: parseFloat(formData.purchasePrice),
        warningThreshold: parseFloat(formData.warningThreshold),
      };

      if (editingIngredient) {
        await updateIngredient(editingIngredient.id, ingredientData);
      } else {
        await addIngredient(ingredientData);
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      // 错误已在 store 中处理
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个原料吗？')) {
      try {
        await deleteIngredient(id);
      } catch (error) {
        // 错误已在 store 中处理
      }
    }
  };

  const commonUnits = ['ml', 'g', '个', 'kg', 'L'];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3" style={{ color: 'var(--color-text-primary)' }}>
              原料库存
              {lowStockCount > 0 && (
                <span
                  className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold"
                  style={{ backgroundColor: 'var(--color-warning)', color: 'white' }}
                  title={`${lowStockCount} 种原料需要补货`}
                >
                  {lowStockCount}
                </span>
              )}
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              管理原料库存，设置预警阈值
            </p>
          </div>
        </div>
        <Button onClick={openCreateModal}>
          <Plus size={18} />
          新建原料
        </Button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10" style={{ backgroundColor: 'var(--color-alternate-row)' }}>
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                  原料名称
                </th>
                <th className="text-left py-4 px-6 font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                  当前库存
                </th>
                <th className="text-left py-4 px-6 font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                  采购单价
                </th>
                <th className="text-left py-4 px-6 font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                  预警阈值
                </th>
                <th className="text-left py-4 px-6 font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                  状态
                </th>
                <th className="text-right py-4 px-6 font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && ingredients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12" style={{ color: 'var(--color-text-secondary)' }}>
                    加载中...
                  </td>
                </tr>
              ) : (
                ingredients.map((ingredient, index) => {
                  const isLowStock = ingredient.stock <= ingredient.warningThreshold;
                  return (
                    <tr
                    key={ingredient.id}
                    className="animate-fade-in border-t"
                    style={{
                      backgroundColor: index % 2 === 0 ? 'var(--color-alternate-row)' : '#FFFFFF',
                      borderColor: 'var(--color-border)',
                      animationDelay: `${index * 0.03}s`,
                    }}
                  >
                    <td className="py-4 px-6 relative">
                      {isLowStock && (
                        <div
                          className="absolute left-0 top-0 bottom-0 w-1"
                          style={{ backgroundColor: 'var(--color-warning)' }}
                        />
                      )}
                      <span
                        className={`font-medium ${isLowStock ? 'ml-3' : ''}`}
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {ingredient.name}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className="font-medium"
                        style={{ color: isLowStock ? 'var(--color-warning)' : 'var(--color-text-primary)' }}
                      >
                        {ingredient.stock}
                        <span className="font-normal ml-1" style={{ color: 'var(--color-text-secondary)' }}>
                          {ingredient.unit}
                        </span>
                      </span>
                    </td>
                    <td className="py-4 px-6" style={{ color: 'var(--color-text-primary)' }}>
                      ¥{ingredient.purchasePrice.toFixed(3)}
                    </td>
                    <td className="py-4 px-6" style={{ color: 'var(--color-text-primary)' }}>
                      {ingredient.warningThreshold}
                      <span className="ml-1" style={{ color: 'var(--color-text-secondary)' }}>
                        {ingredient.unit}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {isLowStock ? (
                        <span
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
                          style={{ backgroundColor: 'rgba(231, 111, 81, 0.1)', color: 'var(--color-warning)' }}
                        >
                          <AlertTriangle size={12} />
                          需补货
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                          style={{ backgroundColor: 'rgba(124, 154, 115, 0.1)', color: 'var(--color-classic-tag)' }}
                        >
                          库存充足
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(ingredient)}
                          className="p-2 rounded-lg transition-colors"
                          style={{ color: 'var(--color-text-secondary)' }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-button)')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(ingredient.id)}
                          className="p-2 rounded-lg transition-colors"
                          style={{ color: 'var(--color-text-secondary)' }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-warning)')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingIngredient ? '编辑原料' : '新建原料'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
              原料名称
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
              style={{ borderColor: 'var(--color-border)' }}
              placeholder="如：南瓜泥"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
                当前库存
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData((prev) => ({ ...prev, stock: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                style={{ borderColor: 'var(--color-border)' }}
                placeholder="3000"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
                单位
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData((prev) => ({ ...prev, unit: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                style={{ borderColor: 'var(--color-border)' }}
              >
                {commonUnits.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
                采购单价 (元)
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={formData.purchasePrice}
                onChange={(e) => setFormData((prev) => ({ ...prev, purchasePrice: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                style={{ borderColor: 'var(--color-border)' }}
                placeholder="0.008"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
                预警阈值
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.warningThreshold}
                onChange={(e) => setFormData((prev) => ({ ...prev, warningThreshold: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                style={{ borderColor: 'var(--color-border)' }}
                placeholder="300"
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" fullWidth onClick={() => setIsModalOpen(false)}>
              取消
            </Button>
            <Button type="submit" fullWidth disabled={loading}>
              {editingIngredient ? '保存修改' : '创建原料'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
