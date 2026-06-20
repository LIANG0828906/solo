import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Item,
  Recipe,
  getItemById,
  updateItem,
  deleteItem,
  getItems,
  generateRecipes,
} from '@/api';
import {
  CATEGORY_EMOJI,
  getItemStatus,
  getRemainingDays,
  formatDate,
  getExpiryDate,
} from '@/utils';
import EditModal from '@/components/EditModal';

const DetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<Item | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [showRecipes, setShowRecipes] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const itemData = await getItemById(id);
      setItem(itemData);
    } catch (error) {
      console.error('Failed to fetch item:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleGenerateRecipes = async () => {
    try {
      const allItems = await getItems();
      const generated = generateRecipes(allItems);
      setRecipes(generated);
      setShowRecipes(true);
    } catch (error) {
      showToast('❌ 生成菜谱失败', 'error');
    }
  };

  const handleEditSubmit = async (data: Partial<Item>) => {
    if (!id) return;
    try {
      const updated = await updateItem(id, data);
      setItem(updated);
      showToast('✅ 修改成功！', 'success');
    } catch (error) {
      showToast('❌ 修改失败', 'error');
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!id || !item) return;
    if (!window.confirm(`确定要删除"${item.name}"吗？`)) return;
    try {
      await deleteItem(id);
      showToast('✅ 删除成功！', 'success');
      setTimeout(() => navigate('/'), 800);
    } catch (error) {
      showToast('❌ 删除失败', 'error');
    }
  };

  if (loading) {
    return (
      <div className="skeleton-container">
        <div className="skeleton-header" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">❓</div>
        <div className="empty-state-text">食材不存在</div>
        <Link to="/" className="empty-btn">
          返回首页
        </Link>
      </div>
    );
  }

  const status = getItemStatus(item);
  const remainingDays = getRemainingDays(item);
  const displayDays = remainingDays < 0 ? Math.abs(remainingDays) : remainingDays;
  const daysText = remainingDays < 0 ? `已过期 ${displayDays} 天` : `还剩 ${displayDays} 天`;
  const expiryDate = getExpiryDate(item);

  return (
    <div className="detail-container">
      <Link to="/" className="back-link">
        ← 返回列表
      </Link>

      <div className="detail-card">
        <div className="detail-header">
          <div className="detail-title-section">
            <span className="detail-icon">{CATEGORY_EMOJI[item.category]}</span>
            <div>
              <div className="detail-name">{item.name}</div>
              <span className="detail-category">{item.category}</span>
            </div>
          </div>
          <span className={`detail-days-badge ${status}`}>{daysText}</span>
        </div>

        <div className="detail-info-grid">
          <div className="detail-info-item">
            <div className="detail-info-label">数量</div>
            <div className="detail-info-value">
              {item.quantity} {item.unit}
            </div>
          </div>
          <div className="detail-info-item">
            <div className="detail-info-label">购买日期</div>
            <div className="detail-info-value">{formatDate(item.purchaseDate)}</div>
          </div>
          <div className="detail-info-item">
            <div className="detail-info-label">保质期</div>
            <div className="detail-info-value">{item.shelfLifeDays} 天</div>
          </div>
          <div className="detail-info-item">
            <div className="detail-info-label">到期日期</div>
            <div className="detail-info-value">
              {expiryDate.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
              })}
            </div>
          </div>
        </div>

        <div className="detail-actions">
          <button
            className="detail-btn primary"
            onClick={() => setEditOpen(true)}
          >
            ✏️ 编辑
          </button>
          <button
            className="detail-btn secondary"
            onClick={handleGenerateRecipes}
          >
            🍳 菜谱建议
          </button>
          <button className="detail-btn danger" onClick={handleDelete}>
            🗑️ 删除
          </button>
        </div>
      </div>

      {showRecipes && (
        <div className="recipes-section">
          <div className="recipes-title">🍳 菜谱建议</div>
          {recipes.length > 0 ? (
            recipes.map((recipe, index) => (
              <div key={index} className="recipe-card">
                <div className="recipe-name">{recipe.name}</div>
                <div className="recipe-ingredients">
                  用到的食材：<strong>{recipe.ingredients.join('、')}</strong>
                </div>
                <div className="recipe-steps">{recipe.steps}</div>
              </div>
            ))
          ) : (
            <div className="no-recipes">
              😔 暂时没有合适的菜谱，试试添加更多食材吧！
            </div>
          )}
        </div>
      )}

      <EditModal
        isOpen={editOpen}
        item={item}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEditSubmit}
      />

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default DetailPage;
