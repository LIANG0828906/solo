import React, { useState, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight, Check, Flame, Clock } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ingredients, cookingMethods, seasonings } from '@/data/ingredients';
import { RecipeIngredient, RecipeSeasoning, NutritionInfo } from '@/types';
import { calculateNutrition } from '@/utils/nutrition';
import { v4 as uuidv4 } from 'uuid';
import './CreateRecipeModal.css';

const CreateRecipeModal: React.FC = () => {
  const { isCreateModalOpen, setIsCreateModalOpen, addRecipe } = useAppStore();
  const [currentStep, setCurrentStep] = useState(1);
  
  const [selectedIngredients, setSelectedIngredients] = useState<RecipeIngredient[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [selectedSeasonings, setSelectedSeasonings] = useState<RecipeSeasoning[]>([]);
  const [recipeName, setRecipeName] = useState('');
  const [recipeDesc, setRecipeDesc] = useState('');
  const [ingredientAmounts, setIngredientAmounts] = useState<Record<string, number>>({});

  const nutritionInfo: NutritionInfo = useMemo(() => {
    const fullIngredients = selectedIngredients.map((si) => ({
      ...si,
      amount: ingredientAmounts[si.ingredientId] || si.amount,
    }));
    return calculateNutrition(fullIngredients, selectedSeasonings);
  }, [selectedIngredients, selectedSeasonings, ingredientAmounts]);

  const handleClose = () => {
    setIsCreateModalOpen(false);
    setCurrentStep(1);
    setSelectedIngredients([]);
    setSelectedMethod('');
    setSelectedSeasonings([]);
    setRecipeName('');
    setRecipeDesc('');
    setIngredientAmounts({});
  };

  const handleIngredientClick = (ingredientId: string) => {
    const isSelected = selectedIngredients.some((i) => i.ingredientId === ingredientId);
    
    if (isSelected) {
      setSelectedIngredients((prev) =>
        prev.filter((i) => i.ingredientId !== ingredientId);
      const newAmounts = { ...ingredientAmounts };
      delete newAmounts[ingredientId];
      setIngredientAmounts(newAmounts);
    } else {
      setSelectedIngredients((prev) => [...prev, { ingredientId, amount: 150 }]);
      setIngredientAmounts((prev) => ({ ...prev, [ingredientId]: 150 }));
    }
  };

  const handleAmountChange = (ingredientId: string, amount: number) => {
    setIngredientAmounts((prev) => ({ ...prev, [ingredientId]: amount }));
  };

  const handleSeasoningToggle = (seasoningId: string) => {
    const isSelected = selectedSeasonings.some((s) => s.seasoningId === seasoningId);
    
    if (isSelected) {
      setSelectedSeasonings((prev) =>
        prev.filter((s) => s.seasoningId !== seasoningId)
      );
    } else {
      setSelectedSeasonings((prev) =>
        [...prev, { seasoningId, amount: 5 }]
      );
    }
  };

  const handleSeasoningAmountChange = (seasoningId: string, amount: number) => {
    setSelectedSeasonings((prev) =>
      prev.map((s) =>
        s.seasoningId === seasoningId ? { ...s, amount } : s
      )
    );
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedIngredients.length > 0;
      case 2:
        return selectedMethod !== '';
      case 3:
        return recipeName.trim() !== '';
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    const fullIngredients = selectedIngredients.map((si) => ({
      ...si,
      amount: ingredientAmounts[si.ingredientId] || si.amount,
    }));

    const difficulty = (fullIngredients.length > 4
      ? 3
      : fullIngredients.length > 2
      ? 2
      : 1) as 1 | 2 | 3;

    const newRecipe = {
      id: uuidv4(),
      name: recipeName,
      mainIngredients: fullIngredients,
      cookingMethod: selectedMethod,
      seasonings: selectedSeasonings,
      difficulty,
      rating: 0,
      ratingCount: 0,
      createdAt: Date.now(),
      author: '我',
      description: recipeDesc || '一道创意配方',
      steps: [
        '准备好所有食材',
        '按照所选烹饪方法进行烹饪',
        '加入调料调味',
        '出锅装盘即可享用',
      ],
      cuisine: '创意菜',
    };

    addRecipe(newRecipe as any);
    handleClose();
  };

  if (!isCreateModalOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="create-modal slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>创建新配方</h2>
          <button className="close-btn" onClick={handleClose}>
            <X size={24} />
          </button>
        </div>

        <div className="progress-bar-container">
          <div className="progress-steps">
            {[1, 2, 3].map((step) => (
              <div key={step} className="step-indicator">
              <div
                className={`step-circle ${
                  currentStep >= step ? 'active' : ''} ${
                  currentStep === step ? 'current' : ''
                }`}
              >
                {currentStep > step ? <Check size={16} /> : step}
              </div>
              <span className="step-label">
                {step === 1 ? '选择食材' : step === 2 ? '烹饪方式' : '调料份量'}
              </span>
            </div>
          ))}
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
            />
          </div>
          <p className="step-text">Step {currentStep} of 3</p>
        </div>

        <div className="modal-content">
          {currentStep === 1 && (
            <div className="step-content fade-in">
              <h3>选择主食材</h3>
              <p className="step-hint">点击选择你想使用的主要食材</p>
              
              <div className="ingredients-grid">
                {ingredients.map((ingredient) => {
                  const isSelected = selectedIngredients.some(
                    (i) => i.ingredientId === ingredient.id
                  );
                  return (
                    <button
                      key={ingredient.id}
                      className={`ingredient-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleIngredientClick(ingredient.id)}
                      style={{ '--cardColor': ingredient.color } as React.CSSProperties}
                    >
                      <div className="ingredient-icon">{ingredient.icon}</div>
                      <span className="ingredient-name">{ingredient.name}</span>
                      {isSelected && (
                        <div className="selected-check">
                          <Check size={16} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedIngredients.length > 0 && (
                <div className="selected-ingredients-list">
                  <h4>已选食材份量</h4>
                  {selectedIngredients.map((si) => {
                    const ing = ingredients.find((i) => i.id === si.ingredientId);
                    const amount = ingredientAmounts[si.ingredientId] || si.amount;
                    return (
                      <div key={si.ingredientId} className="ingredient-amount-row">
                        <span className="amount-label">
                          {ing?.icon} {ing?.name}
                        </span>
                        <div className="amount-control">
                          <input
                            type="range"
                            min="50"
                            max="500"
                            step="10"
                            value={amount}
                            onChange={(e) =>
                              handleAmountChange(si.ingredientId, Number(e.target.value))
                            }
                            className="amount-slider"
                          />
                          <span className="amount-value">{amount}g</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="step-content fade-in">
              <h3>选择烹饪方法</h3>
              <p className="step-hint">选择你想用的烹饪方式</p>

              <div className="cooking-methods-grid">
                {cookingMethods.map((method) => (
                  <button
                    key={method.id}
                    className={`method-circle ${
                      selectedMethod === method.id ? 'selected' : ''
                    }`}
                    onClick={() => setSelectedMethod(method.id)}
                  >
                    <div className="method-icon">{method.icon}</div>
                    <span className="method-name">{method.name}</span>
                    <div className="method-details">
                      <span className="detail-item">
                        <Flame size={12} /> {method.tempRange}
                      </span>
                      <span className="detail-item">
                        <Clock size={12} /> {method.duration}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="step-content fade-in">
              <div className="step-3-layout">
                <div className="seasonings-section">
                  <h3>添加调料</h3>
                  <p className="step-hint">选择并调节料份量</p>

                  <div className="recipe-info">
                    <div className="form-group">
                      <label>菜谱名称</label>
                      <input
                        type="text"
                        value={recipeName}
                        onChange={(e) => setRecipeName(e.target.value)}
                        placeholder="给你的菜谱起个名字"
                        className="name-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>描述</label>
                      <textarea
                        value={recipeDesc}
                        onChange={(e) => setRecipeDesc(e.target.value)}
                        placeholder="简单描述一下这道菜..."
                        className="desc-input"
                        rows={2}
                      />
                    </div>
                  </div>

                  <div className="seasonings-grid">
                    {seasonings.map((seasoning) => {
                      const isSelected = selectedSeasonings.some(
                        (s) => s.seasoningId === seasoning.id
                      );
                      const seasoningData = selectedSeasonings.find(
                        (s) => s.seasoningId === seasoning.id
                      );
                      return (
                        <div
                          key={seasoning.id}
                          className={`seasoning-item ${isSelected ? 'selected' : ''}`}
                        >
                          <button
                            className="seasoning-toggle"
                            onClick={() => handleSeasoningToggle(seasoning.id)}
                          >
                            <span className="seasoning-icon">{seasoning.icon}</span>
                            <span className="seasoning-name">{seasoning.name}</span>
                          </button>
                          {isSelected && (
                            <div className="seasoning-amount">
                              <input
                                type="range"
                                min="1"
                                max="30"
                                step="1"
                                value={seasoningData?.amount || 5}
                                onChange={(e) =>
                                  handleSeasoningAmountChange(
                                    seasoning.id,
                                    Number(e.target.value)
                                  )
                                }
                                className="amount-slider"
                              />
                              <span className="amount-value">
                                {seasoningData?.amount || 5}g
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="nutrition-card">
                  <h4>营养估算</h4>
                  <div className="nutrition-grid">
                    <div className="nutrition-item">
                      <span className="nutri-value">{nutritionInfo.calories}</span>
                      <span className="nutri-label">卡路里</span>
                      <span className="nutri-unit">kcal</span>
                    </div>
                    <div className="nutrition-item">
                      <span className="nutri-value">{nutritionInfo.protein}</span>
                      <span className="nutri-label">蛋白质</span>
                      <span className="nutri-unit">g</span>
                    </div>
                    <div className="nutrition-item">
                      <span className="nutri-value">{nutritionInfo.carbs}</span>
                      <span className="nutri-label">碳水</span>
                      <span className="nutri-unit">g</span>
                    </div>
                    <div className="nutrition-item">
                      <span className="nutri-value">{nutritionInfo.fat}</span>
                      <span className="nutri-label">脂肪</span>
                      <span className="nutri-unit">g</span>
                    </div>
                  </div>
                  <p className="nutrition-hint">
                    * 估算值，实际营养含量可能因食材和烹饪方式而异
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            className="btn-secondary"
            onClick={handlePrev}
            disabled={currentStep === 1}
          >
            <ChevronLeft size={20} />
            上一步
          </button>
          {currentStep < 3 ? (
            <button
              className="btn-primary"
              onClick={handleNext}
              disabled={!canProceed()}
            >
              下一步
              <ChevronRight size={20} />
            </button>
          ) : (
            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={!canProceed()}
            >
              <Check size={20} />
              创建配方
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateRecipeModal;
