import { useState, useEffect } from 'react';
import type { PetInfo } from './recipeEngine';
import type { Recipe } from './recipeEngine';
import { fetchPetInfo, generateRecipe as generateRecipeApi } from './api';
import RecipeCard from './components/RecipeCard';
import type { PetInfoOptions } from './api';

function App() {
  const [petOptions, setPetOptions] = useState<PetInfoOptions | null>(null);
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState(3);
  const [weight, setWeight] = useState('');
  const [activityLevel, setActivityLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const loadOptions = async () => {
      setIsLoading(true);
      try {
        const options = await fetchPetInfo();
        setPetOptions(options);
        if (options.breeds.length > 0) {
          setBreed(options.breeds[0]);
        }
      } catch (error) {
        console.error('Failed to load pet options:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadOptions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!breed || !weight) return;

    const petInfo: PetInfo = {
      breed,
      age,
      weight: parseFloat(weight),
      activityLevel,
    };

    setIsGenerating(true);
    try {
      const newRecipe = await generateRecipeApi({
        petInfo,
        useFeedback: true,
      });
      setRecipe(newRecipe);
    } catch (error) {
      console.error('Failed to generate recipe:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFeedbackSubmitted = async () => {
    if (!breed || !weight) return;

    const petInfo: PetInfo = {
      breed,
      age,
      weight: parseFloat(weight),
      activityLevel,
    };

    try {
      const newRecipe = await generateRecipeApi({
        petInfo,
        useFeedback: true,
      });
      setRecipe(newRecipe);
    } catch (error) {
      console.error('Failed to regenerate recipe:', error);
    }
  };

  const canSubmit = breed && weight && !isGenerating;

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">🐾 Pet Daily Recipe</h1>
        <p className="app-subtitle">为您的爱宠定制每日营养配餐</p>
      </header>

      <main className="app-main">
        <div className="form-card">
          <h2 className="form-title">宠物信息</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">宠物品种</label>
              <select
                className="form-select"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                disabled={isLoading}
              >
                {petOptions?.breeds.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                年龄<span className="slider-value">{age} 岁</span>
              </label>
              <input
                type="range"
                className="form-slider"
                min="0"
                max="20"
                step="0.5"
                value={age}
                onChange={(e) => setAge(parseFloat(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">体重（kg）</label>
              <input
                type="number"
                className="form-input"
                placeholder="例如：5.5"
                min="0.1"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">活动量</label>
              <div className="radio-group">
                {petOptions?.activityLevels.map((level) => (
                  <label key={level.value} className="radio-label">
                    <input
                      type="radio"
                      className="radio-input"
                      name="activityLevel"
                      value={level.value}
                      checked={activityLevel === level.value}
                      onChange={() => setActivityLevel(level.value)}
                    />
                    {level.label}
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={!canSubmit}>
              {isGenerating ? '生成配方中...' : '生成今日配方'}
            </button>
          </form>
        </div>

        <div>
          <RecipeCard recipe={recipe} isLoading={isLoading || isGenerating} onFeedbackSubmitted={handleFeedbackSubmitted} />
        </div>
      </main>
    </div>
  );
}

export default App;
