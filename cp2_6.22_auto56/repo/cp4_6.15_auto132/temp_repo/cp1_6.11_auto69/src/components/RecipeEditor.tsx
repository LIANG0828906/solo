import { useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Recipe, Ingredient, Step, COMMON_UNITS } from '../types';
import './RecipeEditor.css';

interface RecipeEditorProps {
  recipe: Recipe;
  onIngredientsChange: (ingredients: Ingredient[]) => void;
  onStepsChange: (steps: Step[]) => void;
}

function RecipeEditor({ recipe, onIngredientsChange, onStepsChange }: RecipeEditorProps) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ingredients' | 'steps'>('ingredients');
  const [showUnitSuggestions, setShowUnitSuggestions] = useState<string | null>(null);
  const unitInputRef = useRef<HTMLInputElement>(null);

  const scaleRatio = recipe.servings / recipe.baseServings;

  const getScaledAmount = (amount: number): number => {
    return Math.round(amount * scaleRatio * 10) / 10;
  };

  const addIngredient = () => {
    const newIngredient: Ingredient = {
      id: uuidv4(),
      name: '',
      amount: 0,
      unit: 'g',
      note: '',
    };
    onIngredientsChange([...recipe.ingredients, newIngredient]);
  };

  const updateIngredient = (id: string, field: keyof Ingredient, value: string | number) => {
    const updated = recipe.ingredients.map((ing) =>
      ing.id === id ? { ...ing, [field]: value } : ing
    );
    onIngredientsChange(updated);
  };

  const removeIngredient = (id: string) => {
    onIngredientsChange(recipe.ingredients.filter((ing) => ing.id !== id));
  };

  const addStep = () => {
    const newStep: Step = {
      id: uuidv4(),
      order: recipe.steps.length + 1,
      description: '',
    };
    onStepsChange([...recipe.steps, newStep]);
  };

  const updateStep = (id: string, description: string) => {
    const updated = recipe.steps.map((step) =>
      step.id === id ? { ...step, description } : step
    );
    onStepsChange(updated);
  };

  const removeStep = (id: string) => {
    const filtered = recipe.steps.filter((step) => step.id !== id);
    const reOrdered = filtered.map((step, index) => ({ ...step, order: index + 1 }));
    onStepsChange(reOrdered);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItem(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedItem && draggedItem !== id) {
      setDragOverItem(id);
    }
  };

  const handleDragLeave = () => {
    setDragOverItem(null);
  };

  const handleDropIngredient = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetId) return;

    const ingredients = [...recipe.ingredients];
    const dragIndex = ingredients.findIndex((i) => i.id === draggedItem);
    const dropIndex = ingredients.findIndex((i) => i.id === targetId);

    const [removed] = ingredients.splice(dragIndex, 1);
    ingredients.splice(dropIndex, 0, removed);

    onIngredientsChange(ingredients);
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDropStep = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetId) return;

    const steps = [...recipe.steps];
    const dragIndex = steps.findIndex((s) => s.id === draggedItem);
    const dropIndex = steps.findIndex((s) => s.id === targetId);

    const [removed] = steps.splice(dragIndex, 1);
    steps.splice(dropIndex, 0, removed);

    const reOrdered = steps.map((step, index) => ({ ...step, order: index + 1 }));
    onStepsChange(reOrdered);
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleUnitFocus = (ingredientId: string) => {
    setShowUnitSuggestions(ingredientId);
  };

  const handleUnitBlur = () => {
    setTimeout(() => setShowUnitSuggestions(null), 150);
  };

  const selectUnit = (ingredientId: string, unit: string) => {
    updateIngredient(ingredientId, 'unit', unit);
    setShowUnitSuggestions(null);
  };

  return (
    <div className="recipe-editor">
      <div className="editor-tabs">
        <button
          className={`editor-tab ${activeTab === 'ingredients' ? 'active' : ''}`}
          onClick={() => setActiveTab('ingredients')}
        >
          🥘 食材清单 ({recipe.ingredients.length})
        </button>
        <button
          className={`editor-tab ${activeTab === 'steps' ? 'active' : ''}`}
          onClick={() => setActiveTab('steps')}
        >
          📝 步骤 ({recipe.steps.length})
        </button>
      </div>

      {activeTab === 'ingredients' && (
        <div className="ingredients-list">
          {recipe.ingredients.length === 0 && (
            <div className="empty-state">
              <p>还没有食材</p>
              <span>点击下方按钮添加第一种食材</span>
            </div>
          )}

          {recipe.ingredients.map((ingredient) => (
            <div
              key={ingredient.id}
              className={`ingredient-card ${
                draggedItem === ingredient.id ? 'dragging' : ''
              } ${dragOverItem === ingredient.id ? 'drag-over' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, ingredient.id)}
              onDragOver={(e) => handleDragOver(e, ingredient.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDropIngredient(e, ingredient.id)}
              onDragEnd={handleDragEnd}
            >
              <div className="drag-handle" title="拖拽排序">
                ⋮⋮
              </div>

              <div className="ingredient-content">
                <input
                  type="text"
                  className="ingredient-name"
                  placeholder="食材名称"
                  value={ingredient.name}
                  onChange={(e) =>
                    updateIngredient(ingredient.id, 'name', e.target.value)
                  }
                />

                <div className="ingredient-amount-row">
                  <div className="amount-display fade-in">
                    <span className="scaled-amount">
                      {getScaledAmount(ingredient.amount)}
                    </span>
                    <span className="amount-unit">{ingredient.unit}</span>
                  </div>

                  <div className="amount-inputs">
                    <input
                      type="number"
                      className="amount-input"
                      placeholder="用量"
                      min="0"
                      step="0.1"
                      value={ingredient.amount || ''}
                      onChange={(e) =>
                        updateIngredient(
                          ingredient.id,
                          'amount',
                          parseFloat(e.target.value) || 0
                        )
                      }
                    />
                    <div className="unit-input-wrapper">
                      <input
                        ref={unitInputRef}
                        type="text"
                        className="unit-input"
                        placeholder="单位"
                        value={ingredient.unit}
                        onChange={(e) =>
                          updateIngredient(ingredient.id, 'unit', e.target.value)
                        }
                        onFocus={() => handleUnitFocus(ingredient.id)}
                        onBlur={handleUnitBlur}
                      />
                      {showUnitSuggestions === ingredient.id && (
                        <div className="unit-suggestions">
                          {COMMON_UNITS.map((unit) => (
                            <button
                              key={unit}
                              className="unit-suggestion-item"
                              onMouseDown={() => selectUnit(ingredient.id, unit)}
                            >
                              {unit}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <input
                  type="text"
                  className="ingredient-note"
                  placeholder="备注（可选）"
                  value={ingredient.note}
                  onChange={(e) =>
                    updateIngredient(ingredient.id, 'note', e.target.value)
                  }
                />
              </div>

              <button
                className="remove-btn"
                onClick={() => removeIngredient(ingredient.id)}
                title="删除"
              >
                ×
              </button>
            </div>
          ))}

          <button className="add-btn" onClick={addIngredient}>
            + 添加食材
          </button>
        </div>
      )}

      {activeTab === 'steps' && (
        <div className="steps-list">
          {recipe.steps.length === 0 && (
            <div className="empty-state">
              <p>还没有步骤</p>
              <span>点击下方按钮添加第一步</span>
            </div>
          )}

          {recipe.steps.map((step) => (
            <div
              key={step.id}
              className={`step-card ${
                draggedItem === step.id ? 'dragging' : ''
              } ${dragOverItem === step.id ? 'drag-over' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, step.id)}
              onDragOver={(e) => handleDragOver(e, step.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDropStep(e, step.id)}
              onDragEnd={handleDragEnd}
            >
              <div className="drag-handle" title="拖拽排序">
                ⋮⋮
              </div>

              <div className="step-number">{step.order}</div>

              <textarea
                className="step-description"
                placeholder="描述这一步..."
                value={step.description}
                onChange={(e) => updateStep(step.id, e.target.value)}
                rows={2}
              />

              <button
                className="remove-btn"
                onClick={() => removeStep(step.id)}
                title="删除"
              >
                ×
              </button>
            </div>
          ))}

          <button className="add-btn" onClick={addStep}>
            + 添加步骤
          </button>
        </div>
      )}
    </div>
  );
}

export default RecipeEditor;
