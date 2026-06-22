import { useState, useMemo, memo } from 'react';
import { Plus, Search, Edit2, Trash2, AlertTriangle, Refrigerator, Snowflake, Sun, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Ingredient } from '../types';
import { INGREDIENT_CATEGORIES } from '../types';
import { IngredientForm } from './IngredientForm';
import './IngredientPanel.css';

interface IngredientPanelProps {
  ingredients: Ingredient[];
  onAdd: (data: Omit<Ingredient, 'id'>) => Promise<number>;
  onUpdate: (id: number, data: Partial<Ingredient>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const storageIcons = {
  '冷藏': Refrigerator,
  '冷冻': Snowflake,
  '常温': Sun,
};

function isExpiringSoon(expiryDate: string, days: number = 3): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= days && diffDays >= 0;
}

function isExpired(expiryDate: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return expiry < today;
}

function getDaysUntilExpiry(expiryDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}月${day}日`;
}

function IngredientPanelComponent({
  ingredients,
  onAdd,
  onUpdate,
  onDelete,
  collapsed,
  onToggleCollapse,
}: IngredientPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('全部');
  const [showFilter, setShowFilter] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);

  const sortedIngredients = useMemo(() => {
    let filtered = ingredients.filter((ing) => {
      const matchesSearch = ing.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === '全部' || ing.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });

    return filtered.sort((a, b) => {
      const dateA = new Date(a.expiryDate).getTime();
      const dateB = new Date(b.expiryDate).getTime();
      return dateA - dateB;
    });
  }, [ingredients, searchQuery, categoryFilter]);

  const expiringCount = useMemo(() => {
    return ingredients.filter((ing) => isExpiringSoon(ing.expiryDate) && !isExpired(ing.expiryDate)).length;
  }, [ingredients]);

  const handleAddClick = () => {
    setEditingIngredient(null);
    setFormOpen(true);
  };

  const handleEditClick = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    setFormOpen(true);
  };

  const handleDeleteClick = async (id: number) => {
    if (confirm('确定要删除这个食材吗？')) {
      await onDelete(id);
    }
  };

  const handleSubmit = async (data: Omit<Ingredient, 'id'>) => {
    if (editingIngredient?.id) {
      await onUpdate(editingIngredient.id, data);
    } else {
      await onAdd(data);
    }
  };

  if (collapsed) {
    return (
      <div className="ingredient-panel collapsed">
        <div className="panel-header-collapsed">
          <button className="collapse-btn" onClick={onToggleCollapse} title="展开面板">
            <ChevronRight size={20} />
          </button>
          {expiringCount > 0 && (
            <span className="expiring-badge-collapsed" title={`${expiringCount}种食材即将过期`}>
              {expiringCount}
            </span>
          )}
        </div>
        <button className="add-btn-collapsed" onClick={handleAddClick} title="添加食材">
          <Plus size={20} />
        </button>
        <IngredientForm
          isOpen={formOpen}
          editingIngredient={editingIngredient}
          onClose={() => setFormOpen(false)}
          onSubmit={handleSubmit}
        />
      </div>
    );
  }

  return (
    <div className="ingredient-panel">
      <div className="panel-header">
        <div className="panel-title-row">
          <h2 className="panel-title">食材库存</h2>
          <button className="collapse-btn" onClick={onToggleCollapse} title="折叠面板">
            <ChevronLeft size={20} />
          </button>
        </div>
        {expiringCount > 0 && (
          <div className="expiring-alert">
            <AlertTriangle size={16} />
            <span>{expiringCount} 种食材即将过期</span>
          </div>
        )}

        <div className="search-bar">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="搜索食材..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="filter-toggle" onClick={() => setShowFilter(!showFilter)}>
            <Filter size={16} />
          </button>
        </div>

        {showFilter && (
          <div className="category-filter">
            <div className="filter-label">按类别筛选</div>
            <div className="filter-chips">
              <button
                className={`chip ${categoryFilter === '全部' ? 'active' : ''}`}
                onClick={() => setCategoryFilter('全部')}
              >
                全部
              </button>
              {INGREDIENT_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  className={`chip ${categoryFilter === cat ? 'active' : ''}`}
                  onClick={() => setCategoryFilter(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        <button className="add-btn" onClick={handleAddClick}>
          <Plus size={18} />
          添加食材
        </button>
      </div>

      <div className="ingredient-list">
        {sortedIngredients.length === 0 ? (
          <div className="empty-state">
            <p>暂无食材</p>
            <span>点击上方按钮添加</span>
          </div>
        ) : (
          sortedIngredients.map((ingredient) => {
            const expiringSoon = isExpiringSoon(ingredient.expiryDate) && !isExpired(ingredient.expiryDate);
            const expired = isExpired(ingredient.expiryDate);
            const StorageIcon = storageIcons[ingredient.storageLocation];
            const daysLeft = getDaysUntilExpiry(ingredient.expiryDate);

            return (
              <div
                key={ingredient.id}
                className={`ingredient-item-card ${expiringSoon ? 'expiring-soon' : ''} ${expired ? 'expired' : ''}`}
              >
                <div className="item-header">
                  <div className="item-name-row">
                    <span className="item-name">{ingredient.name}</span>
                    <span className="item-category">{ingredient.category}</span>
                  </div>
                  <div className="item-actions">
                    <button className="action-btn edit" onClick={() => handleEditClick(ingredient)} title="编辑">
                      <Edit2 size={14} />
                    </button>
                    <button className="action-btn delete" onClick={() => ingredient.id && handleDeleteClick(ingredient.id)} title="删除">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="item-details">
                  <span className="item-quantity">
                    {ingredient.quantity} {ingredient.unit}
                  </span>
                  <span className="item-storage">
                    <StorageIcon size={14} />
                    {ingredient.storageLocation}
                  </span>
                </div>

                <div className={`item-expiry ${expiringSoon ? 'warning' : ''} ${expired ? 'danger' : ''}`}>
                  {expired ? (
                    <>
                      <AlertTriangle size={14} />
                      <span>已过期</span>
                    </>
                  ) : expiringSoon ? (
                    <>
                      <AlertTriangle size={14} />
                      <span>还有 {daysLeft} 天 · {formatDate(ingredient.expiryDate)}</span>
                    </>
                  ) : (
                    <span>保质期: {formatDate(ingredient.expiryDate)}</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <IngredientForm
        isOpen={formOpen}
        editingIngredient={editingIngredient}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

export const IngredientPanel = memo(IngredientPanelComponent);
