import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { saveAs } from 'file-saver';
import { useRecipeStore } from '../stores/recipeStore';
import { ShoppingItem } from '../types';

const NutritionRing: React.FC<{
  value: number;
  max: number;
  label: string;
  unit: string;
  color: string;
  delay: number;
}> = ({ value, max, label, unit, color, delay }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const percentage = (displayValue / max) * 100;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayValue(value);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <div style={{ position: 'relative', width: '100px', height: '100px' }}>
        <svg width="100" height="100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#f0f0f0"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 50 50)"
            style={{
              transition: 'stroke-dashoffset 1s ease-out',
            }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#333' }}>
            {Math.round(displayValue)}
          </div>
          <div style={{ fontSize: '11px', color: '#888' }}>{unit}</div>
        </div>
      </div>
      <div style={{ fontSize: '13px', fontWeight: 500, color: '#555' }}>
        {label}
      </div>
    </div>
  );
};

const RecipeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { recipes, generateShoppingList, currentRecipe, setCurrentRecipe } =
    useRecipeStore();
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [showShoppingList, setShowShoppingList] = useState(false);

  const recipe =
    currentRecipe || recipes.find((r) => r.id === id) || null;

  useEffect(() => {
    if (!currentRecipe && id) {
      const found = recipes.find((r) => r.id === id);
      if (found) setCurrentRecipe(found);
    }
  }, [id, currentRecipe, recipes, setCurrentRecipe]);

  const handleGenerateShoppingList = () => {
    if (!recipe) return;
    const list = generateShoppingList(recipe.id);
    setShoppingList(list);
    setShowShoppingList(true);
  };

  const handleDownloadShoppingList = () => {
    if (!recipe || shoppingList.length === 0) return;

    let content = `【${recipe.name}】购物清单\n`;
    content += `生成时间: ${new Date().toLocaleString()}\n`;
    content += '='.repeat(30) + '\n\n';

    shoppingList.forEach((item, index) => {
      content += `${index + 1}. ${item.name} - 需要购买: ${item.needToBuy}${item.unit}\n`;
    });

    content += '\n' + '='.repeat(30) + '\n';
    content += `共 ${shoppingList.length} 项食材需要购买`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `${recipe.name}_购物清单.txt`);
  };

  if (!recipe) {
    return (
      <div
        style={{
          padding: '40px',
          textAlign: 'center',
          color: '#888',
        }}
      >
        菜谱不存在
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '24px',
        animation: 'fadeIn 0.4s ease-out',
      }}
    >
      <button
        onClick={() => navigate('/')}
        style={{
          backgroundColor: 'transparent',
          color: '#666',
          fontSize: '14px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 16px',
          borderRadius: '8px',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f0ebe5';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        ← 返回
      </button>

      <div
        className="card"
        style={{
          backgroundColor: '#fff',
          borderRadius: '20px',
          overflow: 'hidden',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            paddingTop: '40%',
          }}
        >
          <img
            src={recipe.image}
            alt={recipe.name}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>

        <div style={{ padding: '28px' }}>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#333',
              marginBottom: '16px',
            }}
          >
            {recipe.name}
          </h1>

          <div
            style={{
              display: 'flex',
              gap: '24px',
              flexWrap: 'wrap',
              marginBottom: '24px',
              color: '#666',
              fontSize: '14px',
            }}
          >
            <span>⏱ 烹饪时间: {recipe.cookTime}分钟</span>
            <span>👥 份量: {recipe.servings}人份</span>
            <span>📊 匹配度: {recipe.matchScore}%</span>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              marginBottom: '28px',
            }}
          >
            {recipe.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  backgroundColor: '#fff3e0',
                  color: '#ff8f00',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                #{tag}
              </span>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-around',
              padding: '24px',
              backgroundColor: '#faf5ef',
              borderRadius: '16px',
              marginBottom: '28px',
            }}
          >
            <NutritionRing
              value={recipe.nutrition.calories}
              max={800}
              label="热量"
              unit="kcal"
              color="#ff9800"
              delay={100}
            />
            <NutritionRing
              value={recipe.nutrition.protein}
              max={60}
              label="蛋白质"
              unit="g"
              color="#4caf50"
              delay={300}
            />
            <NutritionRing
              value={recipe.nutrition.fat}
              max={50}
              label="脂肪"
              unit="g"
              color="#f44336"
              delay={500}
            />
          </div>

          <div style={{ marginBottom: '28px' }}>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#333',
                marginBottom: '16px',
              }}
            >
              🥗 所需食材
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '10px',
              }}
            >
              {recipe.ingredients.map((ing) => (
                <div
                  key={ing.id}
                  style={{
                    backgroundColor: '#e8f5e9',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    color: '#2e7d32',
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{ing.name}</div>
                  <div style={{ fontSize: '13px', opacity: 0.8 }}>
                    {ing.quantity}
                    {ing.unit}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '28px' }}>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#333',
                marginBottom: '20px',
              }}
            >
              👨‍🍳 烹饪步骤
            </h2>
            <div style={{ position: 'relative', paddingLeft: '40px' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '20px',
                  bottom: '20px',
                  width: '2px',
                  backgroundColor: '#e0e0e0',
                }}
              />
              {recipe.steps.map((step, index) => (
                <div
                  key={step.step}
                  className="step-card"
                  style={{
                    position: 'relative',
                    marginBottom: '20px',
                    animationDelay: `${index * 0.15}s`,
                    opacity: 0,
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: '-33px',
                      top: '12px',
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: '#ff9800',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    {step.step}
                  </div>
                  <div
                    style={{
                      backgroundColor: '#fff8e1',
                      padding: '16px 20px',
                      borderRadius: '12px',
                      marginLeft: '8px',
                    }}
                  >
                    <p style={{ fontSize: '15px', color: '#555', lineHeight: 1.7 }}>
                      {step.description}
                    </p>
                    {step.duration && (
                      <div
                        style={{
                          marginTop: '8px',
                          fontSize: '12px',
                          color: '#ff8f00',
                          fontWeight: 500,
                        }}
                      >
                        ⏱ 约 {step.duration} 分钟
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerateShoppingList}
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: '#4caf50',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 600,
              borderRadius: '12px',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#43a047';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow =
                '0 6px 16px rgba(76, 175, 80, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#4caf50';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow =
                '0 4px 12px rgba(76, 175, 80, 0.3)';
            }}
          >
            🛒 一键生成购物清单
          </button>
        </div>
      </div>

      {showShoppingList && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowShoppingList(false)}
        >
          <div
            className="modal-content"
            style={{
              backgroundColor: '#fff',
              borderRadius: '20px',
              padding: '28px',
              maxWidth: '480px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                fontSize: '20px',
                fontWeight: 600,
                color: '#333',
                marginBottom: '20px',
              }}
            >
              🛒 购物清单
            </h3>

            {shoppingList.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: '#888',
                }}
              >
                🎉 太棒了！所有食材都充足，不需要购买
              </div>
            ) : (
              <>
                <p style={{ color: '#666', marginBottom: '16px', fontSize: '14px' }}>
                  以下食材需要购买：
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {shoppingList.map((item, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 16px',
                        backgroundColor: '#fff8e1',
                        borderRadius: '10px',
                      }}
                    >
                      <span style={{ fontWeight: 500, color: '#333' }}>
                        {item.name}
                      </span>
                      <span style={{ color: '#ef4444', fontWeight: 600 }}>
                        需购买 {item.needToBuy}
                        {item.unit}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleDownloadShoppingList}
                  style={{
                    width: '100%',
                    marginTop: '20px',
                    padding: '14px',
                    backgroundColor: '#ff9800',
                    color: '#fff',
                    fontSize: '15px',
                    fontWeight: 600,
                    borderRadius: '10px',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#fb8c00';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ff9800';
                  }}
                >
                  📥 下载清单 (TXT)
                </button>
              </>
            )}

            <button
              onClick={() => setShowShoppingList(false)}
              style={{
                width: '100%',
                marginTop: '12px',
                padding: '12px',
                backgroundColor: 'transparent',
                color: '#888',
                fontSize: '14px',
              }}
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeDetail;
