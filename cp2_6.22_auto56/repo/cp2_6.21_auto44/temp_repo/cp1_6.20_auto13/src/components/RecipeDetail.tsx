import React, { useState, useMemo } from 'react';
import { Recipe, Difficulty, deleteRecipe } from '../utils/api';

const DIFFICULTY_STARS: Record<Difficulty, number> = {
  '简单': 1,
  '中等': 2,
  '困难': 3,
};

export default function RecipeDetail({
  recipeId,
  recipes,
  onBack,
  onEdit,
  onDeleted,
}: {
  recipeId: string;
  recipes: Recipe[];
  onBack: () => void;
  onEdit: (id: string) => void;
  onDeleted: () => void;
}) {
  const recipe = useMemo(() => recipes.find((r) => r.id === recipeId), [recipes, recipeId]);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!recipe) {
    return (
      <div className="detail-page">
        <div className="empty-state">
          <div className="empty-state-icon">😕</div>
          <h3>食谱未找到</h3>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={onBack}>
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const toggleStep = (index: number) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteRecipe(recipe.id);
      onDeleted();
    } catch (err) {
      console.error('删除失败:', err);
      setDeleting(false);
    }
  };

  const starCount = DIFFICULTY_STARS[recipe.difficulty];

  return (
    <div className="detail-page">
      <button className="detail-back" onClick={onBack}>
        ← 返回列表
      </button>

      {recipe.coverImage ? (
        <img
          className="detail-cover"
          src={recipe.coverImage}
          alt={recipe.name}
          onClick={() => setShowImageModal(true)}
        />
      ) : (
        <div
          className="recipe-card-img-placeholder"
          style={{ borderRadius: 12, maxWidth: '100%' }}
        >
          🍳
        </div>
      )}

      <h1 className="detail-title">{recipe.name}</h1>
      {recipe.description && (
        <p className="detail-description">{recipe.description}</p>
      )}

      <div className="detail-meta">
        <span>⏱ 烹饪时间：{recipe.cookingTime} 分钟</span>
        <span>
          难度：
          {[1, 2, 3].map((i) => (
            <span key={i} className={`star ${i <= starCount ? '' : 'empty'}`}>
              ★
            </span>
          ))}
          {recipe.difficulty}
        </span>
      </div>

      {recipe.tags.length > 0 && (
        <div className="detail-tags">
          {recipe.tags.map((tag) => (
            <span key={tag} className="detail-tag">
              {tag}
            </span>
          ))}
        </div>
      )}

      {recipe.ingredients.length > 0 && (
        <div className="detail-section">
          <h3>🥗 食材</h3>
          <table className="ingredient-table">
            <thead>
              <tr>
                <th>名称</th>
                <th>用量</th>
              </tr>
            </thead>
            <tbody>
              {recipe.ingredients.map((ing, i) => (
                <tr key={i}>
                  <td>{ing.name}</td>
                  <td>{ing.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {recipe.steps.length > 0 && (
        <div className="detail-section">
          <h3>📝 步骤</h3>
          <ul className="step-list">
            {recipe.steps.map((step, i) => (
              <li key={i} className="step-item">
                <span className="step-number">{i + 1}</span>
                <input
                  type="checkbox"
                  className="step-checkbox"
                  checked={completedSteps.has(i)}
                  onChange={() => toggleStep(i)}
                />
                <span className={`step-text ${completedSteps.has(i) ? 'completed' : ''}`}>
                  {step}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="detail-actions">
        <button className="btn btn-primary" onClick={() => onEdit(recipe.id)}>
          ✏️ 编辑
        </button>
        <button className="btn btn-danger" onClick={() => setShowDeleteModal(true)}>
          🗑 删除
        </button>
      </div>

      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>确认删除</h3>
            <p>确定要删除食谱「{recipe.name}」吗？此操作无法撤销。</p>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowDeleteModal(false)}>
                取消
              </button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showImageModal && (
        <div className="image-modal-overlay" onClick={() => setShowImageModal(false)}>
          <img src={recipe.coverImage} alt={recipe.name} />
        </div>
      )}
    </div>
  );
}
