import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Ingredient, Nutrition, Recipe } from '../types';
import { getRecipe, createRecipe, updateRecipe } from '../api/recipeApi';
import { calculateNutrition } from '../api/nutritionApi';
import { useStore } from '../store/useStore';
import NutritionPieChart from '../components/NutritionPieChart';
import RichTextEditor from '../components/RichTextEditor';
import StarRating from '../components/StarRating';
import IngredientInput from '../components/IngredientInput';

const CUISINES = [
  '中餐',
  '西餐',
  '日料',
  '韩餐',
  '泰菜',
  '意餐',
  '法餐',
  '家常菜',
  '甜点',
  '其他',
];

const defaultNutrition: Nutrition = {
  calories: 0,
  protein: 0,
  fat: 0,
  carbs: 0,
};

const createEmptyIngredients = (): Ingredient[] => [
  {
    id: uuidv4(),
    name: '',
    amount: 0,
    unit: 'g',
  },
];

const RecipeEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = useMemo(() => !!id, [id]);

  const addRecipe = useStore((state) => state.addRecipe);
  const updateRecipeStore = useStore((state) => state.updateRecipe);

  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [cookTime, setCookTime] = useState(0);
  const [cuisine, setCuisine] = useState(CUISINES[0]);
  const [difficulty, setDifficulty] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [steps, setSteps] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>(createEmptyIngredients());
  const [nutrition, setNutrition] = useState<Nutrition>(defaultNutrition);
  const [nutritionOverride, setNutritionOverride] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit || !id) return;
    setLoading(true);
    getRecipe(id)
      .then((recipe) => {
        setTitle(recipe.title);
        setImageUrl(recipe.imageUrl ?? '');
        setCookTime(recipe.cookTime);
        setCuisine(recipe.cuisine);
        setDifficulty(recipe.difficulty);
        setSteps(recipe.steps);
        setIngredients(
          recipe.ingredients.length > 0 ? recipe.ingredients : createEmptyIngredients()
        );
        setNutrition(recipe.nutrition);
        setNutritionOverride(true);
      })
      .catch((err) => {
        console.error('Failed to load recipe:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isEdit, id]);

  useEffect(() => {
    if (nutritionOverride) return;
    if (ingredients.length === 0) {
      setNutrition(defaultNutrition);
      return;
    }
    const hasValid = ingredients.some(
      (ing) => ing.name.trim() && ing.amount > 0
    );
    if (!hasValid) {
      setNutrition(defaultNutrition);
      return;
    }

    let cancelled = false;
    calculateNutrition(ingredients)
      .then((result) => {
        if (!cancelled) {
          setNutrition(result);
        }
      })
      .catch((err) => {
        console.error('Failed to calculate nutrition:', err);
      });

    return () => {
      cancelled = true;
    };
  }, [ingredients, nutritionOverride]);

  const handleIngredientsChange = useCallback((next: Ingredient[]) => {
    setIngredients(next);
    setNutritionOverride(false);
  }, []);

  const handleNutritionChange = useCallback(
    (key: keyof Nutrition, val: number) => {
      setNutritionOverride(true);
      setNutrition((prev) => ({ ...prev, [key]: val }));
    },
    []
  );

  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      alert('请输入食谱标题');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        imageUrl: imageUrl.trim() || undefined,
        cookTime,
        cuisine,
        difficulty,
        steps,
        ingredients: ingredients.filter((ing) => ing.name.trim() && ing.amount > 0),
        nutrition,
        isFavorite: false,
        rating: 0,
      };

      let saved: Recipe;
      if (isEdit && id) {
        saved = await updateRecipe(id, payload);
        updateRecipeStore(saved);
      } else {
        saved = await createRecipe(payload as Omit<Recipe, 'id' | 'createdAt'>);
        addRecipe(saved);
      }

      navigate(`/recipes`);
    } catch (err) {
      console.error('Failed to save recipe:', err);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  }, [
    title,
    imageUrl,
    cookTime,
    cuisine,
    difficulty,
    steps,
    ingredients,
    nutrition,
    isEdit,
    id,
    navigate,
    addRecipe,
    updateRecipeStore,
  ]);

  if (loading) {
    return (
      <div className="content-panel">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  return (
    <div className="recipe-editor-page">
      <div className="recipe-editor">
      <div className="editor-header">
        <h1 className="editor-title">
          {isEdit ? '编辑食谱' : '新建食谱'}
        </h1>
        <button
          type="button"
          className="btn btn-primary save-btn"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>

      <div className="editor-layout">
        <div className="editor-form">
          <section className="form-section">
            <h2 className="section-title">基本信息</h2>

            <div className="form-row">
              <label className="form-label">标题</label>
              <input
                type="text"
                className="form-input"
                placeholder="输入食谱标题"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="form-row">
              <label className="form-label">图片 URL</label>
              <input
                type="text"
                className="form-input"
                placeholder="https://..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
              {imageUrl && (
                <div className="image-preview">
                  <img src={imageUrl} alt="预览" onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }} />
                </div>
              )}
            </div>

            <div className="form-grid">
              <div className="form-row">
                <label className="form-label">烹饪时间（分钟）</label>
                <input
                  type="number"
                  className="form-input"
                  min={0}
                  value={cookTime || ''}
                  onChange={(e) =>
                    setCookTime(parseInt(e.target.value, 10) || 0)
                  }
                />
              </div>

              <div className="form-row">
                <label className="form-label">菜系</label>
                <select
                  className="form-input"
                  value={cuisine}
                  onChange={(e) => setCuisine(e.target.value)}
                >
                  {CUISINES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <label className="form-label">难度</label>
              <StarRating value={difficulty} onChange={(v) => setDifficulty(v as 1 | 2 | 3 | 4 | 5)} />
            </div>
          </section>

          <section className="form-section">
            <h2 className="section-title">制作步骤</h2>
            <RichTextEditor
              value={steps}
              onChange={setSteps}
              onBlur={setSteps}
              placeholder="描述制作步骤..."
            />
          </section>

          <section className="form-section">
            <h2 className="section-title">食材清单</h2>
            <IngredientInput
              value={ingredients}
              onChange={handleIngredientsChange}
            />
          </section>
        </div>

        <div className="editor-preview">
          <section className="form-section nutrition-section">
            <h2 className="section-title">营养预览</h2>
            <NutritionPieChart nutrition={nutrition} />

            <div className="nutrition-manual">
              <div className="manual-hint">
                {nutritionOverride ? '已手动修正' : '根据食材自动计算'}
              </div>
              <div className="form-row">
                <label className="form-label">卡路里 (kcal)</label>
                <input
                  type="number"
                  className="form-input"
                  min={0}
                  step="1"
                  value={nutrition.calories || ''}
                  onChange={(e) =>
                    handleNutritionChange(
                      'calories',
                      parseFloat(e.target.value) || 0
                    )
                  }
                />
              </div>
              <div className="form-row">
                <label className="form-label">蛋白质 (g)</label>
                <input
                  type="number"
                  className="form-input"
                  min={0}
                  step="0.1"
                  value={nutrition.protein || ''}
                  onChange={(e) =>
                    handleNutritionChange(
                      'protein',
                      parseFloat(e.target.value) || 0
                    )
                  }
                />
              </div>
              <div className="form-row">
                <label className="form-label">脂肪 (g)</label>
                <input
                  type="number"
                  className="form-input"
                  min={0}
                  step="0.1"
                  value={nutrition.fat || ''}
                  onChange={(e) =>
                    handleNutritionChange(
                      'fat',
                      parseFloat(e.target.value) || 0
                    )
                  }
                />
              </div>
              <div className="form-row">
                <label className="form-label">碳水 (g)</label>
                <input
                  type="number"
                  className="form-input"
                  min={0}
                  step="0.1"
                  value={nutrition.carbs || ''}
                  onChange={(e) =>
                    handleNutritionChange(
                      'carbs',
                      parseFloat(e.target.value) || 0
                    )
                  }
                />
              </div>
            </div>
          </section>
        </div>
      </div>
      </div>
    </div>
  );
};

export default RecipeEditor;
