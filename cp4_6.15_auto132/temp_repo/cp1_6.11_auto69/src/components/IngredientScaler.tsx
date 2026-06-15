import { useState } from 'react';
import { Recipe, UNIT_CONVERSIONS } from '../types';
import './IngredientScaler.css';

interface IngredientScalerProps {
  recipe: Recipe;
  onServingsChange: (servings: number) => void;
}

function IngredientScaler({ recipe, onServingsChange }: IngredientScalerProps) {
  const [inputValue, setInputValue] = useState(recipe.servings.toString());
  const [showConversionTips, setShowConversionTips] = useState(false);

  const scaleRatio = recipe.servings / recipe.baseServings;

  const handleIncrement = () => {
    const newServings = Math.min(recipe.servings + 1, 50);
    onServingsChange(newServings);
    setInputValue(newServings.toString());
  };

  const handleDecrement = () => {
    const newServings = Math.max(recipe.servings - 1, 1);
    onServingsChange(newServings);
    setInputValue(newServings.toString());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 50) {
      onServingsChange(numValue);
    }
  };

  const handleInputBlur = () => {
    const numValue = parseInt(inputValue, 10);
    if (isNaN(numValue) || numValue < 1) {
      onServingsChange(1);
      setInputValue('1');
    } else if (numValue > 50) {
      onServingsChange(50);
      setInputValue('50');
    }
  };

  const formatAmount = (amount: number): string => {
    const scaled = amount * scaleRatio;
    return (Math.round(scaled * 10) / 10).toString();
  };

  const getFractionSuggestion = (amount: number): string | null => {
    const scaled = amount * scaleRatio;
    const fractions: [number, string][] = [
      [0.25, '1/4'],
      [0.33, '1/3'],
      [0.5, '1/2'],
      [0.66, '2/3'],
      [0.75, '3/4'],
    ];

    for (const [value, label] of fractions) {
      if (Math.abs(scaled - Math.floor(scaled) - value) < 0.05) {
        return Math.floor(scaled) > 0
          ? `${Math.floor(scaled)} ${label}`
          : label;
      }
    }
    return null;
  };

  return (
    <div className="ingredient-scaler">
      <div className="scaler-card">
        <h3 className="scaler-title">🥄 份数调节</h3>

        <div className="servings-control">
          <button
            className="servings-btn decrease"
            onClick={handleDecrement}
            disabled={recipe.servings <= 1}
          >
            −
          </button>

          <div className="servings-input-wrapper">
            <input
              type="number"
              className="servings-input"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              min={1}
              max={50}
            />
            <span className="servings-label">份</span>
          </div>

          <button
            className="servings-btn increase"
            onClick={handleIncrement}
            disabled={recipe.servings >= 50}
          >
            +
          </button>
        </div>

        <div className="ratio-info">
          <span>基准：</span>
          <span className="base-servings">{recipe.baseServings} 份</span>
          <span className="ratio-arrow">→</span>
          <span className="target-servings">{recipe.servings} 份</span>
        </div>

        <div className="ratio-percentage">
          比例：<span className="percentage">{Math.round(scaleRatio * 100)}%</span>
        </div>
      </div>

      <div className="scaler-card">
        <div className="conversion-header" onClick={() => setShowConversionTips(!showConversionTips)}>
          <h3 className="scaler-title">📐 单位换算</h3>
          <span className={`toggle-icon ${showConversionTips ? 'open' : ''}`}>▼</span>
        </div>

        {showConversionTips && (
          <div className="conversion-tips fade-in">
            <div className="tip-row">
              <span className="tip-unit">1 杯</span>
              <span className="tip-equals">=</span>
              <span className="tip-value">240 ml</span>
            </div>
            <div className="tip-row">
              <span className="tip-unit">1 汤匙</span>
              <span className="tip-equals">=</span>
              <span className="tip-value">15 ml</span>
            </div>
            <div className="tip-row">
              <span className="tip-unit">1 茶匙</span>
              <span className="tip-equals">=</span>
              <span className="tip-value">5 ml</span>
            </div>
            <div className="tip-row">
              <span className="tip-unit">1 千克</span>
              <span className="tip-equals">=</span>
              <span className="tip-value">1000 克</span>
            </div>
            <div className="tip-row">
              <span className="tip-unit">1 升</span>
              <span className="tip-equals">=</span>
              <span className="tip-value">1000 毫升</span>
            </div>
          </div>
        )}
      </div>

      <div className="scaler-card">
        <h3 className="scaler-title">📋 换算预览</h3>
        <p className="preview-subtitle">当前份数下的食材用量</p>

        <div className="ingredients-preview">
          {recipe.ingredients.length === 0 ? (
            <div className="preview-empty">暂无食材</div>
          ) : (
            recipe.ingredients.map((ingredient) => {
              const fraction = getFractionSuggestion(ingredient.amount);
              return (
                <div key={ingredient.id} className="preview-item fade-in">
                  <span className="preview-name">{ingredient.name || '未命名'}</span>
                  <div className="preview-amount">
                    <span className="preview-value">
                      {formatAmount(ingredient.amount)}
                    </span>
                    <span className="preview-unit">{ingredient.unit}</span>
                    {fraction && (
                      <span className="preview-fraction">≈ {fraction}</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default IngredientScaler;
