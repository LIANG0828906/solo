import React, { useState, useMemo, useRef } from 'react';
import RecipeEditor from '../components/RecipeEditor';
import VersionTimeline from '../components/VersionTimeline';
import CostPieChart from '../components/CostPieChart';
import { calculateCost, validatePercentageSum } from '../modules/CostCalculator';
import { generateReportPDF, downloadPDF } from '../modules/ReportGenerator';
import type { Recipe, Ingredient, RecipeIngredient } from '../types';
import { FAMILY_COLORS } from '../types';

interface RecipeDetailPageProps {
  recipe: Recipe;
  ingredients: Ingredient[];
  onBack: () => void;
  onUpdate: (id: string, data: Partial<Recipe>, versionNote?: string) => void;
  onRollback: (recipeId: string, versionId: string) => void;
}

const RecipeDetailPage: React.FC<RecipeDetailPageProps> = ({
  recipe,
  ingredients,
  onBack,
  onUpdate,
  onRollback,
}) => {
  const [activeTab, setActiveTab] = useState<'edit' | 'versions'>('edit');
  const [versionNote, setVersionNote] = useState('');
  const [showVersionModal, setShowVersionModal] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const costReport = useMemo(() => 
    calculateCost(ingredients, recipe.ingredients),
    [ingredients, recipe.ingredients]
  );

  const barColor = FAMILY_COLORS[recipe.targetNote] || '#C9A96E';
  const isValid = validatePercentageSum(recipe.ingredients);

  const handleIngredientsChange = (newIngredients: RecipeIngredient[]) => {
    onUpdate(recipe.id, { ingredients: newIngredients }, undefined);
  };

  const handleSaveVersion = () => {
    if (!versionNote.trim()) {
      alert('请输入版本备注');
      return;
    }
    onUpdate(recipe.id, {}, versionNote);
    setShowVersionModal(false);
    setVersionNote('');
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    
    try {
      const blob = await generateReportPDF(recipe, ingredients, costReport, reportRef.current);
      downloadPDF(blob, `${recipe.name}_配方报告.pdf`);
    } catch (error) {
      console.error('PDF生成失败:', error);
      alert('PDF生成失败，请重试');
    }
  };

  return (
    <div className="recipe-detail-page">
      <button
        onClick={onBack}
        style={{
          padding: '6px 12px',
          backgroundColor: 'transparent',
          color: '#8B7355',
          border: 'none',
          fontSize: '14px',
          fontFamily: "'Inter', sans-serif",
          cursor: 'pointer',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#3C2415';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#8B7355';
        }}
      >
        ← 返回配方列表
      </button>

      <div style={{
        backgroundColor: '#F9F5EB',
        borderRadius: '8px',
        overflow: 'hidden',
        marginBottom: '20px',
      }}>
        <div style={{
          height: '8px',
          backgroundColor: barColor,
        }} />
        
        <div style={{ padding: '24px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '12px',
          }}>
            <div>
              <h1 style={{
                fontSize: '26px',
                fontWeight: 700,
                color: '#3C2415',
                fontFamily: "'Playfair Display', 'Noto Serif SC', serif",
                margin: '0 0 8px 0',
              }}>
                {recipe.name}
              </h1>
              <span style={{
                display: 'inline-block',
                padding: '3px 12px',
                backgroundColor: barColor,
                color: '#FDFBF7',
                fontSize: '12px',
                fontWeight: 500,
                borderRadius: '12px',
                fontFamily: "'Inter', sans-serif",
              }}>
                {recipe.targetNote}调
              </span>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowVersionModal(true)}
                disabled={!isValid}
                style={{
                  padding: '8px 16px',
                  backgroundColor: isValid ? 'transparent' : '#E0D6C8',
                  color: isValid ? '#C9A96E' : '#A6967C',
                  border: `1px solid ${isValid ? '#C9A96E' : '#D4C5A9'}`,
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontFamily: "'Inter', sans-serif",
                  cursor: isValid ? 'pointer' : 'not-allowed',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (isValid) e.currentTarget.style.backgroundColor = 'rgba(201,169,110,0.1)';
                }}
                onMouseLeave={(e) => {
                  if (isValid) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                保存版本
              </button>
              <button
                onClick={handleExportPDF}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#C9A96E',
                  color: '#FDFBF7',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 500,
                  fontFamily: "'Inter', sans-serif",
                  cursor: 'pointer',
                  transition: 'background-color 0.15s, transform 0.1s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#B8974E';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#C9A96E';
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'scale(0.97)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                导出报告
              </button>
            </div>
          </div>
          
          <p style={{
            fontSize: '14px',
            color: '#5C4033',
            fontFamily: "'Inter', sans-serif",
            lineHeight: 1.6,
            margin: 0,
          }}>
            {recipe.description}
          </p>
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: '4px',
        borderBottom: '1px solid #E0D6C8',
        marginBottom: '20px',
      }}>
        {[
          { key: 'edit', label: '配方编辑' },
          { key: 'versions', label: `版本历史 (${recipe.versions.length})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as 'edit' | 'versions')}
            style={{
              padding: '10px 20px',
              backgroundColor: 'transparent',
              color: activeTab === tab.key ? '#3C2415' : '#8B7355',
              border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid #C9A96E' : '2px solid transparent',
              fontSize: '14px',
              fontWeight: activeTab === tab.key ? 600 : 400,
              fontFamily: "'Inter', sans-serif",
              cursor: 'pointer',
              marginBottom: '-1px',
              transition: 'color 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'edit' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}
          className="edit-layout">
          <div>
            <h3 style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#3C2415',
              fontFamily: "'Inter', sans-serif",
              margin: '0 0 16px 0',
            }}>
              原料配比
            </h3>
            <RecipeEditor
              ingredients={ingredients}
              initialIngredients={recipe.ingredients}
              onChange={handleIngredientsChange}
            />
          </div>
          
          <div>
            <h3 style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#3C2415',
              fontFamily: "'Inter', sans-serif",
              margin: '0 0 16px 0',
            }}>
              成本分析
            </h3>
            <div ref={reportRef} style={{
              backgroundColor: '#F9F5EB',
              borderRadius: '8px',
              padding: '20px',
              border: '1px solid #E0D6C8',
            }}>
              <div style={{
                textAlign: 'center',
                marginBottom: '16px',
              }}>
                <div style={{
                  fontSize: '12px',
                  color: '#8B7355',
                  fontFamily: "'Inter', sans-serif",
                  marginBottom: '4px',
                }}>
                  {recipe.name} · 每10ml成本
                </div>
                <div style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: '#C9A96E',
                  fontFamily: "'Playfair Display', serif",
                }}>
                  ¥{costReport.totalCostPer10ml.toFixed(2)}
                </div>
              </div>
              
              <CostPieChart items={costReport.ingredientCosts} size={160} />
            </div>
          </div>
        </div>
      ) : (
        <div>
          <h3 style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#3C2415',
            fontFamily: "'Inter', sans-serif",
            margin: '0 0 16px 0',
          }}>
            版本历史
          </h3>
          <VersionTimeline
            versions={recipe.versions}
            ingredients={ingredients}
            onRollback={(versionId) => {
              if (confirm('确定要回滚到此版本吗？当前配方将被替换。')) {
                onRollback(recipe.id, versionId);
              }
            }}
          />
        </div>
      )}

      {showVersionModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(60, 36, 21, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '20px',
        }}
        onClick={() => setShowVersionModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#FDFBF7',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '400px',
              width: '100%',
              boxShadow: '0 10px 40px rgba(60,36,21,0.2)',
            }}
          >
            <h2 style={{
              fontSize: '20px',
              fontWeight: 600,
              color: '#3C2415',
              fontFamily: "'Playfair Display', 'Noto Serif SC', serif",
              margin: '0 0 16px 0',
            }}>
              保存版本
            </h2>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                color: '#8B7355',
                marginBottom: '6px',
                fontFamily: "'Inter', sans-serif",
              }}>
                版本备注
              </label>
              <input
                type="text"
                value={versionNote}
                onChange={(e) => setVersionNote(e.target.value)}
                placeholder="例如：增加玫瑰比例"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #D4C5A9',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: "'Inter', sans-serif",
                  backgroundColor: '#FDFBF7',
                  color: '#3C2415',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                autoFocus
              />
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowVersionModal(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  color: '#8B7355',
                  border: '1px solid #D4C5A9',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontFamily: "'Inter', sans-serif",
                  cursor: 'pointer',
                }}
              >
                取消
              </button>
              <button
                onClick={handleSaveVersion}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#C9A96E',
                  color: '#FDFBF7',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 500,
                  fontFamily: "'Inter', sans-serif",
                  cursor: 'pointer',
                }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 1024px) {
          .edit-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default RecipeDetailPage;
