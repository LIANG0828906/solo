import React, { useEffect, useMemo, useState } from 'react';
import { Breadcrumb, Button, Spin, Tag } from 'antd';
import { HomeOutlined, HeartOutlined, HeartFilled, SwapOutlined } from '@ant-design/icons';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import { useRecipeStore } from '../stores/recipeStore';
import SubstitutionPanel from '../components/SubstitutionPanel';
import type { Nutrition } from '../utils/api';

const nutritionLabels: Record<string, string> = {
  calories: '热量',
  protein: '蛋白质',
  fat: '脂肪',
  carbs: '碳水',
  fiber: '纤维',
  sodium: '钠',
};

const RecipeDetailPage: React.FC = React.memo(() => {
  const {
    ingredients,
    currentRecipe,
    loading,
    loadRecipe,
    toggleFavorite,
    isFavorite,
    activeSubstitutions,
    substitutionPanelOpen,
    activeSubstitutionIngredientId,
    openSubstitutionPanel,
    closeSubstitutionPanel,
    getAdjustedNutrition,
    getSubImpactText,
    getIngredientDisplayName,
    isIngredientSubstituted,
  } = useRecipeStore();

  const [heartScale, setHeartScale] = useState(1);
  const [favState, setFavState] = useState(false);
  const recipeId = window.location.hash.replace('#/recipe/', '');

  useEffect(() => {
    if (recipeId) {
      loadRecipe(recipeId);
    }
  }, [recipeId, loadRecipe]);

  useEffect(() => {
    if (currentRecipe) {
      setFavState(isFavorite(currentRecipe.id));
    }
  }, [currentRecipe, isFavorite, activeSubstitutions]);

  const ingredientMap = useMemo(() => {
    const map = new Map<string, string>();
    ingredients.forEach(i => map.set(i.id, i.name));
    return map;
  }, [ingredients]);

  const radarData = useMemo(() => {
    if (!currentRecipe) return [];
    const base = currentRecipe.nutrition;
    const adjusted = getAdjustedNutrition(base);
    const maxValues: Nutrition = { calories: 600, protein: 40, fat: 45, carbs: 60, fiber: 10, sodium: 1200 };
    return Object.keys(nutritionLabels).map(key => ({
      subject: nutritionLabels[key],
      original: Math.min(100, Math.round(((base as any)[key] / (maxValues as any)[key]) * 100)),
      adjusted: Math.min(100, Math.round(((adjusted as any)[key] / (maxValues as any)[key]) * 100)),
      fullMark: 100,
    }));
  }, [currentRecipe, getAdjustedNutrition, activeSubstitutions]);

  const impactText = useMemo(() => {
    if (!currentRecipe) return '';
    return getSubImpactText(currentRecipe.nutrition);
  }, [currentRecipe, getSubImpactText, activeSubstitutions]);

  const handleFavClick = () => {
    if (!currentRecipe) return;
    setHeartScale(1.2);
    setTimeout(() => setHeartScale(1.0), 200);
    toggleFavorite(currentRecipe.id);
    setFavState(!favState);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!currentRecipe) {
    return <div style={{ textAlign: 'center', padding: 80, color: '#999' }}>食谱未找到</div>;
  }

  const subIngredientName = activeSubstitutionIngredientId
    ? ingredientMap.get(activeSubstitutionIngredientId) || ''
    : '';

  return (
    <div className="detail-layout" style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
      <div
        className="detail-left"
        style={{
          flex: substitutionPanelOpen ? '0 0 calc(70% - 24px)' : '1',
          background: '#fff',
          borderRadius: 12,
          padding: 24,
          transition: 'all 0.3s ease',
          minWidth: 0,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Breadcrumb
            items={[
              {
                title: (
                  <a href="#/" style={{ color: '#1890FF' }}>
                    <HomeOutlined /> 首页
                  </a>
                ),
              },
              { title: '食谱详情' },
            ]}
          />
          <div
            onClick={handleFavClick}
            style={{
              cursor: 'pointer',
              fontSize: 24,
              color: favState ? '#FF4D4F' : '#D9D9D9',
              transform: `scale(${heartScale})`,
              transition: 'transform 0.2s ease, color 0.2s ease',
            }}
          >
            {favState ? <HeartFilled /> : <HeartOutlined />}
          </div>
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#333', marginBottom: 8, marginTop: 0 }}>
          {currentRecipe.name}
        </h1>
        <Tag
          color={currentRecipe.cuisine === '中餐' ? 'red' : currentRecipe.cuisine === '西餐' ? 'blue' : 'geekblue'}
          style={{ marginBottom: 20, borderRadius: 4 }}
        >
          {currentRecipe.cuisine}
        </Tag>

        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#333', marginBottom: 16, borderBottom: '2px solid #1890FF', paddingBottom: 8, display: 'inline-block' }}>
            烹饪步骤
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {currentRecipe.steps.map((step, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: '#1890FF',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    fontWeight: 700,
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  {idx + 1}
                </div>
                <span style={{ fontSize: 15, color: '#444', lineHeight: 1.8 }}>{step}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#333', marginBottom: 16, borderBottom: '2px solid #1890FF', paddingBottom: 8, display: 'inline-block' }}>
            配料表
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
            {currentRecipe.ingredients.map(ingId => {
              const originalName = ingredientMap.get(ingId) || ingId;
              const displayName = getIngredientDisplayName(ingId, ingredients);
              const substituted = isIngredientSubstituted(ingId);
              return (
                <div
                  key={ingId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: substituted ? '#F6FFED' : '#FAFAFA',
                    border: substituted ? '1px solid #B7EB8F' : '1px solid #F0F0F0',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: substituted ? '#52C41A' : '#333', fontWeight: substituted ? 500 : 400 }}>
                      {displayName}
                    </span>
                    {substituted && (
                      <Tag color="green" style={{ margin: 0, fontSize: 11, lineHeight: '18px', padding: '0 4px', borderRadius: 3 }}>
                        已替换
                      </Tag>
                    )}
                  </div>
                  <Button
                    type="text"
                    size="small"
                    icon={<SwapOutlined />}
                    onClick={() => openSubstitutionPanel(ingId)}
                    style={{
                      color: substitutionPanelOpen && activeSubstitutionIngredientId === ingId ? '#1890FF' : '#999',
                      transition: 'all 0.2s ease',
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#333', marginBottom: 16, borderBottom: '2px solid #1890FF', paddingBottom: 8, display: 'inline-block' }}>
            营养成分分析
          </h3>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="#E8E8E8" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 13, fill: '#666' }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar
                  name="原始营养"
                  dataKey="original"
                  stroke="#D9D9D9"
                  fill="#D9D9D9"
                  fillOpacity={0.3}
                />
                <Radar
                  name="调整后营养"
                  dataKey="adjusted"
                  stroke="#1890FF"
                  fill="#1890FF"
                  fillOpacity={0.35}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          {impactText && (
            <div
              style={{
                textAlign: 'center',
                color: '#1890FF',
                fontSize: 14,
                marginTop: 8,
                fontWeight: 500,
              }}
            >
              {impactText}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 14, height: 14, borderRadius: 2, background: '#D9D9D9', opacity: 0.6 }} />
              <span style={{ fontSize: 13, color: '#999' }}>原始营养</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 14, height: 14, borderRadius: 2, background: '#1890FF', opacity: 0.6 }} />
              <span style={{ fontSize: 13, color: '#1890FF' }}>调整后营养</span>
            </div>
          </div>
        </div>
      </div>

      {substitutionPanelOpen && activeSubstitutionIngredientId && (
        <div
          className="detail-right"
          style={{
            flex: '0 0 360px',
            position: 'sticky',
            top: 80,
            animation: 'slideInRight 0.3s ease',
          }}
        >
          <SubstitutionPanel
            ingredientId={activeSubstitutionIngredientId}
            ingredientName={subIngredientName}
            ingredients={ingredients}
          />
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @media (max-width: 768px) {
          .detail-layout {
            flex-direction: column !important;
          }
          .detail-left {
            flex: 1 1 100% !important;
          }
          .detail-right {
            flex: 1 1 100% !important;
            position: static !important;
          }
        }
      `}</style>
    </div>
  );
});

RecipeDetailPage.displayName = 'RecipeDetailPage';

export default RecipeDetailPage;
