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
  const [justSelectedIngredient, setJustSelectedIngredient] = useState<string | null>(null);

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
        prev.filter((i) => i.ingredientId !== ingredientId)
      );
      const newAmounts = { ...ingredientAmounts };
      delete newAmounts[ingredientId];
      setIngredientAmounts(newAmounts);
    } else {
      setSelectedIngredients((prev) => [...prev, { ingredientId, amount: 150 }]);
      setIngredientAmounts((prev) => ({ ...prev, [ingredientId]: 150 }));
      setJustSelectedIngredient(ingredientId);
      setTimeout(() => setJustSelectedIngredient(null), 400);
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
                  const isJustSelected = justSelectedIngredient === ingredient.id;
                  return (
                    <button
                      key={ingredient.id}
                      className={`ingredient-card ${isSelected ? 'selected' : ''} ${isJustSelected ? 'pop-animation' : ''}`}
                      onClick={() => handleIngredientClick