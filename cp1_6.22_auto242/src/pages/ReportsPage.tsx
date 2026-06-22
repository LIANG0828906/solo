import React, { useState, useMemo, useRef } from 'react';
import CostPieChart from '../components/CostPieChart';
import { calculateCost } from '../modules/CostCalculator';
import { generateReportPDF, downloadPDF } from '../modules/ReportGenerator';
import type { Recipe, Ingredient } from '../types';

interface ReportsPageProps {
  recipes: Recipe[];
  ingredients: Ingredient[];
}

const ReportsPage: React.FC<ReportsPageProps> = ({ recipes, ingredients }) => {
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(
    recipes.length > 0 ? recipes[0].id : ''
  );
  const reportRef = useRef<HTMLDivElement>(null);

  const selectedRecipe = recipes.find(r => r.id === selectedRecipeId);

  const costReport = useMemo(() => {
    if (!selectedRecipe) return { totalCostPer10ml: 0, ingredientCosts: [] };
    return calculateCost(ingredients, selectedRecipe.ingredients);
  }, [selectedRecipe, ingredients]);

  const totalIngredientCount = ingredients.length;
  const lowStockCount = ingredients.filter(i => i.stock > 0 && i.stock < 20).length;
  const outOfStockCount = ingredients.filter(i => i.stock <= 0).length;

  const handleExportPDF = async () => {
    if (!reportRef.current || !selectedRecipe) return;
    
    try {
      const blob = await generateReportPDF(selectedRecipe, ingredients, costReport, reportRef.current);
      downloadPDF(blob, `${selectedRecipe.name}_成本报告.pdf`);
    } catch (error) {
      console.error('PDF生成失败:', error);
      alert('PDF生成失败，请重试');
    }
  };

  return (
    <div className="reports-page">
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#3C2415',
            fontFamily: "'Playfair Display', 'Noto Serif SC', serif",
            margin: '0 0 8px 0',
          }}>
            报告中心
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#8B7355',
            fontFamily: "'Inter', sans-serif",
            margin: 0,
          }}>
            查看库存统计与配方成本分析
          </p>
        </div>
        
        <button
          onClick={handleExportPDF}
          disabled={!selectedRecipe}
          style={{
            padding: '10px 20px',
            backgroundColor: selectedRecipe ? '#C9A96E' : '#D4C5A9',
            color: '#FDFBF7',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: "'Inter', sans-serif",
            cursor: selectedRecipe ? 'pointer' : 'not-allowed',
            transition: 'background-color 0.15s, transform 0.1s',
          }}
          onMouseEnter={(e) => {
            if (selectedRecipe) e.currentTarget.style.backgroundColor = '#B8974E';
          }}
          onMouseLeave={(e) => {
            if (selectedRecipe) e.currentTarget.style.backgroundColor = '#C9A96E';
          }}
          onMouseDown={(e) => {
            if (selectedRecipe) e.currentTarget.style.transform = 'scale(0.97)';
          }}
          onMouseUp={(e) => {
            if (selectedRecipe) e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          导出PDF报告
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div style={{
          backgroundColor: '#FDFBF7',
          border: '1px solid #E0D6C8',
          borderRadius: '8px',
          padding: '20px',
          transition: 'transform 0.2s ease-out, box-shadow 0.2s ease-out',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(60,36,21,0.08)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        >
          <div style={{
            fontSize: '32px',
            fontWeight: 700,
            color: '#7C9A73',
            fontFamily: "'Playfair Display', serif",
            marginBottom: '6px',
          }}>
            {totalIngredientCount}
          </div>
          <div style={{
            fontSize: '13px',
            color: '#8B7355',
            fontFamily: "'Inter', sans-serif",
          }}>
            原料总数
          </div>
        </div>
        
        <div style={{
          backgroundColor: '#FDFBF7',
          border: '1px solid #E0D6C8',
          borderRadius: '8px',
          padding: '20px',
          transition: 'transform 0.2s ease-out, box-shadow 0.2s ease-out',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(60,36,21,0.08)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        >
          <div style={{
            fontSize: '32px',
            fontWeight: 700,
            color: '#D4A373',
            fontFamily: "'Playfair Display', serif",
            marginBottom: '6px',
          }}>
            {lowStockCount}
          </div>
          <div style={{
            fontSize: '13px',
            color: '#8B7355',
            fontFamily: "'Inter', sans-serif",
          }}>
            低库存原料
          </div>
        </div>
        
        <div style={{
          backgroundColor: '#FDFBF7',
          border: '1px solid #E0D6C8',
          borderRadius: '8px',
          padding: '20px',
          transition: 'transform 0.2s ease-out, box-shadow 0.2s ease-out',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(60,36,21,0.08)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        >
          <div style={{
            fontSize: '32px',
            fontWeight: 700,
            color: '#C47A7A',
            fontFamily: "'Playfair Display', serif",
            marginBottom: '6px',
          }}>
            {outOfStockCount}
          </div>
          <div style={{
            fontSize: '13px',
            color: '#8B7355',
            fontFamily: "'Inter', sans-serif",
          }}>
            缺货原料
          </div>
        </div>
        
        <div style={{
          backgroundColor: '#FDFBF7',
          border: '1px solid #E0D6C8',
          borderRadius: '8px',
          padding: '20px',
          transition: 'transform 0.2s ease-out, box-shadow 0.2s ease-out',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(60,36,21,0.08)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        >
          <div style={{
            fontSize: '32px',
            fontWeight: 700,
            color: '#C9A96E',
            fontFamily: "'Playfair Display', serif",
            marginBottom: '6px',
          }}>
            {recipes.length}
          </div>
          <div style={{
            fontSize: '13px',
            color: '#8B7355',
            fontFamily: "'Inter', sans-serif",
          }}>
            配方总数
          </div>
        </div>
      </div>

      <div ref={reportRef}>
        <div style={{
          backgroundColor: '#F9F5EB',
          borderRadius: '8px',
          padding: '24px',
          border: '1px solid #E0D6C8',
          marginBottom: '24px',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#3C2415',
              fontFamily: "'Playfair Display', 'Noto Serif SC', serif",
              margin: 0,
            }}>
              配方成本分析
            </h2>
            
            <select
              value={selectedRecipeId}
              onChange={(e) => setSelectedRecipeId(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #D4C5A9',
                borderRadius: '6px',
                fontSize: '13px',
                fontFamily: "'Inter', sans-serif",
                backgroundColor: '#FDFBF7',
                color: '#3C2415',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {recipes.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          
          {selectedRecipe ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '20px 0',
            }}>
              <CostPieChart items={costReport.ingredientCosts} size={220} />
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#A6967C',
              fontSize: '14px',
              fontFamily: "'Inter', sans-serif",
            }}>
              暂无配方数据
            </div>
          )}
          
          {selectedRecipe && (
            <div style={{
              marginTop: '20px',
              paddingTop: '20px',
              borderTop: '1px solid #E0D6C8',
            }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#3C2415',
                fontFamily: "'Inter', sans-serif",
                margin: '0 0 12px 0',
              }}>
                成本明细
              </h3>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}>
                {costReport.ingredientCosts.map(item => {
                  const percentage = costReport.totalCostPer10ml > 0 
                    ? (item.cost / costReport.totalCostPer10ml) * 100 
                    : 0;
                  return (
                    <div key={item.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      backgroundColor: '#FDFBF7',
                      borderRadius: '4px',
                    }}>
                      <span style={{
                        fontSize: '13px',
                        color: '#3C2415',
                        fontFamily: "'Inter', sans-serif",
                      }}>
                        {item.name}
                      </span>
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <span style={{
                          fontSize: '13px',
                          color: '#8B7355',
                          fontFamily: "'Inter', sans-serif",
                        }}>
                          {item.percentage}%
                        </span>
                        <span style={{
                          fontSize: '13px',
                          fontWeight: 500,
                          color: '#3C2415',
                          fontFamily: "'Inter', sans-serif",
                          minWidth: '70px',
                          textAlign: 'right',
                        }}>
                          ¥{item.cost.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px',
                  backgroundColor: '#F0EBE0',
                  borderRadius: '6px',
                  marginTop: '4px',
                }}>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#3C2415',
                    fontFamily: "'Inter', sans-serif",
                  }}>
                    总计（每10ml）
                  </span>
                  <span style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: '#C9A96E',
                    fontFamily: "'Playfair Display', serif",
                  }}>
                    ¥{costReport.totalCostPer10ml.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{
        backgroundColor: '#F9F5EB',
        borderRadius: '8px',
        padding: '24px',
        border: '1px solid #E0D6C8',
      }}>
        <h2 style={{
          fontSize: '18px',
          fontWeight: 600,
          color: '#3C2415',
          fontFamily: "'Playfair Display', 'Noto Serif SC', serif",
          margin: '0 0 16px 0',
        }}>
          库存预警
        </h2>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          {ingredients
            .filter(i => i.stock < 20)
            .sort((a, b) => a.stock - b.stock)
            .map(ing => (
              <div key={ing.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                backgroundColor: '#FDFBF7',
                borderRadius: '6px',
                borderLeft: `4px solid ${ing.stock <= 0 ? '#C47A7A' : '#D4A373'}`,
              }}>
                <div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#3C2415',
                    fontFamily: "'Inter', sans-serif",
                  }}>
                    {ing.name}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#8B7355',
                    fontFamily: "'Inter', sans-serif",
                  }}>
                    {ing.brand} · {ing.family}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: ing.stock <= 0 ? '#C47A7A' : '#D4A373',
                    fontFamily: "'Inter', sans-serif",
                  }}>
                    {ing.stock} {ing.unit}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#A6967C',
                    fontFamily: "'Inter', sans-serif",
                  }}>
                    {ing.stock <= 0 ? '缺货' : '低库存'}
                  </div>
                </div>
              </div>
            ))}
          
          {ingredients.filter(i => i.stock < 20).length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '20px',
              color: '#7C9A73',
              fontSize: '14px',
              fontFamily: "'Inter', sans-serif",
            }}>
              ✓ 所有原料库存充足
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
