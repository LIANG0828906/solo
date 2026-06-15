import React, { useState, useMemo } from 'react';
import { Recipe, Ingredient, Substitution, AppliedSubstitution } from '../types';
import SubstitutionModal from './SubstitutionModal';
import AnimatedNumber from './AnimatedNumber';

interface RecipeDetailProps {
  recipe: Recipe;
  onBack: () => void;
}

const RecipeDetail: React.FC<RecipeDetailProps> = ({ recipe, onBack }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [substitutions, setSubstitutions] = useState<Record<string, AppliedSubstitution>>({});

  const adjustedTime = useMemo(() => {
    let total = recipe.totalTime;
    Object.values(substitutions).forEach((sub) => {
      total += sub.timeAdjustment;
    });
    return Math.max(1, total);
  }, [recipe.totalTime, substitutions]);

  const totalTimeAdjustment = useMemo(() => {
    let total = 0;
    Object.values(substitutions).forEach((sub) => {
      total += sub.timeAdjustment;
    });
    return total;
  }, [substitutions]);

  const handleSubstituteClick = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setModalOpen(true);
  };

  const handleConfirmSubstitution = (substitution: Substitution, ingredientId: string) => {
    const ingredient = recipe.ingredients.find((i) => i.id === ingredientId);
    if (!ingredient) return;

    setSubstitutions((prev) => ({
      ...prev,
      [ingredientId]: {
        ingredientId,
        originalName: ingredient.name,
        substituteName: substitution.substitute,
        substituteAmount: substitution.amount,
        timeAdjustment: substitution.timeAdjustment,
      },
    }));
  };

  const getDisplayIngredient = (ingredient: Ingredient) => {
    const sub = substitutions[ingredient.id];
    if (sub) {
      return {
        name: sub.substituteName,
        amount: sub.substituteAmount,
        isSubstituted: true,
        originalName: sub.originalName,
      };
    }
    return {
      name: ingredient.name,
      amount: ingredient.amount,
      isSubstituted: false,
      originalName: null,
    };
  };

  return (
    <>
      <span className="back-link" onClick={onBack}>
        ← 返回食谱列表
      </span>

      <div className="detail-header">
        <h1 className="detail-title">{recipe.title}</h1>
        <div className="detail-meta">
          <div className="meta-item">👨‍🍳 作者：{recipe.author}</div>
          <div className="meta-item">📖 共 {recipe.steps.length} 个步骤</div>
          <div className="meta-item">🥘 {recipe.ingredients.length} 种食材</div>
        </div>
        <div className="detail-tags">
          {recipe.tags.map((tag, idx) => (
            <span key={idx} className="tag">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <img className="detail-image" src={recipe.image} alt={recipe.title} loading="lazy" />

      <div className="detail-container">
        <div className="steps-section">
          <h2 className="section-title">📝 制作步骤</h2>
          <div className="steps-list">
            {recipe.steps
              .sort((a, b) => a.order - b.order)
              .map((step) => (
                <div key={step.id} className="step-item">
                  <div className="step-number">{step.order}</div>
                  <div className="step-content">
                    <p className="step-description">{step.description}</p>
                    <span className="step-time">⏱ 约 {step.timeMinutes} 分钟</span>
                    {step.image && (
                      <img
                        className="step-image"
                        src={step.image}
                        alt={`步骤${step.order}`}
                        loading="lazy"
                      />
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="sidebar">
          <div className="ingredients-section">
            <h2 className="section-title" style={{ fontSize: 20 }}>
              🥗 食材清单
            </h2>
            <div className="ingredients-list">
              {recipe.ingredients.map((ingredient) => {
                const display = getDisplayIngredient(ingredient);
                return (
                  <div
                    key={ingredient.id}
                    className={`ingredient-item ${display.isSubstituted ? 'substituted' : ''}`}
                  >
                    <div className="ingredient-info">
                      <span className="ingredient-name">{display.name}</span>
                      {display.originalName && (
                        <span className="ingredient-original">原：{display.originalName}</span>
                      )}
                      <span className="ingredient-amount">{display.amount}</span>
                    </div>
                    <button
                      className="substitute-btn"
                      onClick={() => handleSubstituteClick(ingredient)}
                    >
                      {display.isSubstituted ? '重选' : '替换'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="timer-section">
            <h2 className="section-title" style={{ fontSize: 20 }}>
              ⏱ 烹饪计时器
            </h2>
            <div className="timer-display">
              <div className="timer-label">预计总时长</div>
              <div>
                <AnimatedNumber value={adjustedTime} duration={300} className="timer-value" />
                <span className="timer-unit">分钟</span>
              </div>
              <div
                className={`timer-adjustment ${
                  totalTimeAdjustment < 0
                    ? 'negative'
                    : totalTimeAdjustment > 0
                    ? 'positive'
                    : ''
                }`}
              >
                {totalTimeAdjustment < 0
                  ? `替换后减少 ${Math.abs(totalTimeAdjustment)} 分钟 ✅`
                  : totalTimeAdjustment > 0
                  ? `替换后增加 ${totalTimeAdjustment} 分钟`
                  : Object.keys(substitutions).length > 0
                  ? '时长不变'
                  : ''}
              </div>
            </div>
            <div style={{ marginTop: 16, fontSize: 13, color: '#8D6E63', lineHeight: 1.8 }}>
              <div style={{ marginBottom: 4 }}>
                📌 <strong>分步时间：</strong>
              </div>
              {recipe.steps
                .sort((a, b) => a.order - b.order)
                .map((step, idx) => (
                  <div key={step.id} style={{ paddingLeft: 8 }}>
                    步骤{idx + 1}：{step.timeMinutes}分钟
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      <div className="detail-footer-back">
        <span className="back-link" onClick={onBack}>
          ← 返回瀑布流首页
        </span>
      </div>

      <SubstitutionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        ingredient={selectedIngredient}
        onConfirm={handleConfirmSubstitution}
      />
    </>
  );
};

export default RecipeDetail;
