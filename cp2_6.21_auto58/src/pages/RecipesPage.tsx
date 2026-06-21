import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { Recipe, Ingredient } from '../types';
import { IngredientInput } from '../components/IngredientInput';

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: '#F5E6CC',
  padding: '24px',
  fontFamily: "'Quicksand', sans-serif",
};

const containerStyle: React.CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '32px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '36px',
  fontWeight: 700,
  color: '#4A2F1A',
  margin: 0,
};

const backButtonStyle: React.CSSProperties = {
  padding: '10px 20px',
  background: '#FFFFFF',
  color: '#4A2F1A',
  border: '2px solid #D4C4B0',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: "'Quicksand', sans-serif",
  transition: 'all 0.2s ease',
};

const contentStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '32px',
};

const cardStyle: React.CSSProperties = {
  background: '#FFFFFF',
  borderRadius: '12px',
  padding: '24px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 700,
  color: '#4A2F1A',
  margin: '0 0 24px 0',
};

const formGroupStyle: React.CSSProperties = {
  marginBottom: '20px',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '14px',
  fontWeight: 600,
  color: '#4A2F1A',
  marginBottom: '8px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: '8px',
  border: '2px solid #D4C4B0',
  fontSize: '14px',
  outline: 'none',
  fontFamily: "'Quicksand', sans-serif",
  boxSizing: 'border-box',
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: 'vertical',
  minHeight: '80px',
};

const stepsContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const stepItemStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  alignItems: 'flex-start',
};

const stepNumberStyle: React.CSSProperties = {
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  background: '#D4A574',
  color: '#FFFFFF',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 700,
  fontSize: '14px',
  flexShrink: 0,
};

const stepInputStyle: React.CSSProperties = {
  flex: 1,
  padding: '10px 12px',
  borderRadius: '8px',
  border: '2px solid #D4C4B0',
  fontSize: '14px',
  outline: 'none',
  fontFamily: "'Quicksand', sans-serif",
  resize: 'vertical',
  minHeight: '60px',
};

const removeStepButtonStyle: React.CSSProperties = {
  padding: '8px 12px',
  background: '#F44336',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '6px',
  fontSize: '12px',
  cursor: 'pointer',
  fontFamily: "'Quicksand', sans-serif",
  flexShrink: 0,
};

const addStepButtonStyle: React.CSSProperties = {
  padding: '10px 20px',
  background: '#FFFFFF',
  color: '#4A2F1A',
  border: '2px dashed #D4A574',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: "'Quicksand', sans-serif",
  alignSelf: 'flex-start',
};

const imagePreviewStyle: React.CSSProperties = {
  width: '100%',
  height: '200px',
  borderRadius: '8px',
  overflow: 'hidden',
  background: '#F5E6CC',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '12px',
};

const imageStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const imagePlaceholderStyle: React.CSSProperties = {
  fontSize: '64px',
};

const fileInputStyle: React.CSSProperties = {
  fontSize: '14px',
  fontFamily: "'Quicksand', sans-serif",
  cursor: 'pointer',
};

const submitButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px 24px',
  background: '#D4A574',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '8px',
  fontSize: '16px',
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: "'Quicksand', sans-serif",
  marginTop: '24px',
  transition: 'background 0.2s ease',
};

const recipeListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const recipeItemStyle: React.CSSProperties = {
  display: 'flex',
  gap: '16px',
  padding: '16px',
  background: '#FFFBF5',
  borderRadius: '10px',
  border: '1px solid #E8D5BC',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const recipeItemImageStyle: React.CSSProperties = {
  width: '80px',
  height: '80px',
  borderRadius: '8px',
  overflow: 'hidden',
  background: '#F5E6CC',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const recipeItemContentStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const recipeItemNameStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 700,
  color: '#4A2F1A',
  marginBottom: '4px',
};

const recipeItemMetaStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#6B5344',
  marginBottom: '4px',
};

const deleteRecipeButtonStyle: React.CSSProperties = {
  padding: '8px 12px',
  background: '#F44336',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '6px',
  fontSize: '12px',
  cursor: 'pointer',
  fontFamily: "'Quicksand', sans-serif",
  alignSelf: 'flex-start',
  flexShrink: 0,
};

export const RecipesPage: React.FC = () => {
  const navigate = useNavigate();
  const { recipes, addRecipe, deleteRecipe } = useAppStore();

  const [name, setName] = useState('');
  const [cookingTime, setCookingTime] = useState('');
  const [steps, setSteps] = useState(['', '', '']);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [imageData, setImageData] = useState<string | undefined>(undefined);

  const handleAddIngredient = (ingredient: Ingredient) => {
    setIngredients([...ingredients, ingredient]);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleStepChange = (index: number, value: string) => {
    const newSteps = [...steps];
    newSteps[index] = value;
    setSteps(newSteps);
  };

  const handleAddStep = () => {
    setSteps([...steps, '']);
  };

  const handleRemoveStep = (index: number) => {
    if (steps.length > 3) {
      setSteps(steps.filter((_, i) => i !== index));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageData(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    const validSteps = steps.filter((s) => s.trim().length > 0);
    if (!name.trim()) {
      alert('请输入菜谱名称');
      return;
    }
    if (!cookingTime || Number(cookingTime) <= 0) {
      alert('请输入有效的烹饪时间');
      return;
    }
    if (validSteps.length < 3) {
      alert('请至少填写3个步骤');
      return;
    }
    if (ingredients.length === 0) {
      alert('请至少添加一种食材');
      return;
    }

    const newRecipe: Recipe = {
      id: `recipe-${Date.now()}`,
      name: name.trim(),
      cooking_time: Number(cookingTime),
      ingredients,
      steps: validSteps,
      image_data: imageData,
      servings: 2,
    };

    addRecipe(newRecipe);
    setName('');
    setCookingTime('');
    setSteps(['', '', '']);
    setIngredients([]);
    setImageData(undefined);
    alert('菜谱创建成功！');
  };

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <div style={headerStyle}>
          <h1 style={titleStyle}>📖 菜谱管理</h1>
          <button
            onClick={() => navigate('/')}
            style={backButtonStyle}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#F5E6CC';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#FFFFFF';
            }}
          >
            ← 返回首页
          </button>
        </div>

        <div style={contentStyle}>
          <div style={cardStyle}>
            <h2 style={cardTitleStyle}>➕ 创建新菜谱</h2>

            <div style={formGroupStyle}>
              <label style={labelStyle}>菜谱图片</label>
              <div style={imagePreviewStyle}>
                {imageData ? (
                  <img src={imageData} alt="预览" style={imageStyle} />
                ) : (
                  <span style={imagePlaceholderStyle}>📷</span>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={fileInputStyle}
              />
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>菜名 *</label>
              <input
                type="text"
                placeholder="例如：红烧肉"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>烹饪时间（分钟） *</label>
              <input
                type="number"
                placeholder="例如：60"
                value={cookingTime}
                onChange={(e) => setCookingTime(e.target.value)}
                min="1"
                style={inputStyle}
              />
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>食材 *</label>
              <IngredientInput
                onAdd={handleAddIngredient}
                ingredients={ingredients}
                onRemove={handleRemoveIngredient}
              />
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>制作步骤 *（至少3步）</label>
              <div style={stepsContainerStyle}>
                {steps.map((step, index) => (
                  <div key={index} style={stepItemStyle}>
                    <div style={stepNumberStyle}>{index + 1}</div>
                    <textarea
                      placeholder={`描述步骤 ${index + 1}`}
                      value={step}
                      onChange={(e) => handleStepChange(index, e.target.value)}
                      style={stepInputStyle}
                    />
                    <button
                      onClick={() => handleRemoveStep(index)}
                      style={{
                        ...removeStepButtonStyle,
                        opacity: steps.length <= 3 ? 0.5 : 1,
                        cursor: steps.length <= 3 ? 'not-allowed' : 'pointer',
                      }}
                      disabled={steps.length <= 3}
                    >
                      删除
                    </button>
                  </div>
                ))}
                <button onClick={handleAddStep} style={addStepButtonStyle}>
                  + 添加步骤
                </button>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              style={submitButtonStyle}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#C49464';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#D4A574';
              }}
            >
              🎉 创建菜谱
            </button>
          </div>

          <div style={cardStyle}>
            <h2 style={cardTitleStyle}>📋 已有菜谱（{recipes.length}）</h2>
            <div style={recipeListStyle}>
              {recipes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#6B5344' }}>
                  还没有菜谱，在左侧创建第一个吧！
                </div>
              ) : (
                recipes.map((recipe) => (
                  <div
                    key={recipe.id}
                    style={recipeItemStyle}
                    onClick={() => navigate(`/recipe/${recipe.id}`)}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background = '#FFF8EE';
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background = '#FFFBF5';
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateX(0)';
                    }}
                  >
                    <div style={recipeItemImageStyle}>
                      {recipe.image_data ? (
                        <img
                          src={recipe.image_data}
                          alt={recipe.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span style={{ fontSize: '32px' }}>🍳</span>
                      )}
                    </div>
                    <div style={recipeItemContentStyle}>
                      <div style={recipeItemNameStyle}>{recipe.name}</div>
                      <div style={recipeItemMetaStyle}>
                        ⏱️ {recipe.cooking_time}分钟 · 🥗 {recipe.ingredients.length}种食材 · 📝 {recipe.steps.length}步
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`确定删除「${recipe.name}」吗？`)) {
                          deleteRecipe(recipe.id);
                        }
                      }}
                      style={deleteRecipeButtonStyle}
                      onMouseEnter={(e) => {
                        e.stopPropagation();
                        (e.currentTarget as HTMLButtonElement).style.background = '#D32F2F';
                      }}
                      onMouseLeave={(e) => {
                        e.stopPropagation();
                        (e.currentTarget as HTMLButtonElement).style.background = '#F44336';
                      }}
                    >
                      删除
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipesPage;
