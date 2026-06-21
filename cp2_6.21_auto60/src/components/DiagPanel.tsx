import { useState, useEffect } from 'react';
import { getAnalysis } from '@/api';
import type { AnalysisResponse, DiagnosisAdvice, FoodItem } from '@/types';

interface DiagPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DiagPanel({ isOpen, onClose }: DiagPanelProps) {
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedAdvice, setSelectedAdvice] = useState<DiagnosisAdvice | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getAnalysis(7)
        .then((data) => {
          setAnalysis(data);
        })
        .catch(() => {
          setAnalysis(null);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return '#ff6b6b';
      case 'medium':
        return '#ffd93d';
      default:
        return '#4ecdc4';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'high':
        return '高优先级';
      case 'medium':
        return '中优先级';
      default:
        return '建议';
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      calories: '🔥',
      protein: '💪',
      fat: '🥑',
      carbs: '🍚',
      fiber: '🥬',
      sodium: '🧂',
    };
    return icons[category] || '📊';
  };

  const handleShowAlternatives = (advice: DiagnosisAdvice) => {
    setSelectedAdvice(advice);
  };

  const closeModal = () => {
    setSelectedAdvice(null);
  };

  return (
    <>
      <div
        className={isOpen ? 'animate-slide-right' : ''}
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          bottom: 0,
          width: '400px',
          maxWidth: '90vw',
          background: 'white',
          boxShadow: '-8px 0 24px rgba(0,0,0,0.1)',
          zIndex: 200,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
              营养诊断
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              基于最近7天数据分析
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#f5f5f5',
              fontSize: '18px',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#e8e8e8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f5f5f5';
            }}
          >
            ×
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{ fontSize: '32px', animation: 'spin 1s linear infinite' }}>⏳</div>
              <p style={{ marginTop: '12px', color: 'var(--text-muted)' }}>正在分析...</p>
            </div>
          ) : analysis ? (
            <>
              <div
                style={{
                  background: 'linear-gradient(135deg, #4ecdc4 0%, #2a9d8f 100%)',
                  borderRadius: 'var(--radius-md)',
                  padding: '20px',
                  color: 'white',
                  marginBottom: '20px',
                }}
              >
                <p style={{ fontSize: '13px', opacity: 0.9 }}>平均每日热量</p>
                <p style={{ fontSize: '36px', fontWeight: 700, margin: '8px 0' }}>
                  {analysis.avgCalories}
                  <span style={{ fontSize: '16px', fontWeight: 400 }}> kcal</span>
                </p>
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
                  <span>蛋白 {analysis.macroRatio.protein}%</span>
                  <span>脂肪 {analysis.macroRatio.fat}%</span>
                  <span>碳水 {analysis.macroRatio.carbs}%</span>
                </div>
              </div>

              <h4
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '12px',
                  color: 'var(--text-primary)',
                }}
              >
                改善建议
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {analysis.advices.map((advice) => (
                  <div
                    key={advice.id}
                    style={{
                      background: 'var(--bg-primary)',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px',
                      borderLeft: `4px solid ${getSeverityColor(advice.severity)}`,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '8px',
                      }}
                    >
                      <span style={{ fontSize: '20px' }}>{getCategoryIcon(advice.category)}</span>
                      <h5
                        style={{
                          fontSize: '15px',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          flex: 1,
                        }}
                      >
                        {advice.title}
                      </h5>
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '3px 8px',
                          borderRadius: '10px',
                          background: getSeverityColor(advice.severity),
                          color: 'white',
                          fontWeight: 500,
                        }}
                      >
                        {getSeverityLabel(advice.severity)}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: '13px',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.6,
                        marginBottom: '12px',
                      }}
                    >
                      {advice.description}
                    </p>
                    <button
                      onClick={() => handleShowAlternatives(advice)}
                      style={{
                        fontSize: '13px',
                        color: 'var(--primary-dark)',
                        background: 'white',
                        border: '1px solid var(--primary)',
                        padding: '6px 14px',
                        borderRadius: 'var(--radius-sm)',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--bg-secondary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'white';
                      }}
                    >
                      查看替代食物 →
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📊</div>
              <p>暂无足够数据分析</p>
              <p style={{ fontSize: '13px', marginTop: '4px' }}>
                请先记录几天的饮食数据
              </p>
            </div>
          )}
        </div>
      </div>

      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.3)',
            zIndex: 150,
            animation: 'fadeIn 0.3s',
          }}
        />
      )}

      {selectedAdvice && (
        <FoodAlternativesModal
          advice={selectedAdvice}
          onClose={closeModal}
        />
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
}

interface FoodAlternativesModalProps {
  advice: DiagnosisAdvice;
  onClose: () => void;
}

function FoodAlternativesModal({ advice, onClose }: FoodAlternativesModalProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.25s',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '80vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'scaleIn 0.25s ease',
        }}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
              推荐替代食物
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {advice.title} - 每100克营养成分
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#f5f5f5',
              fontSize: '18px',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px 24px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '13px',
                minWidth: '500px',
              }}
            >
              <thead>
                <tr style={{ background: 'var(--bg-primary)' }}>
                  <th
                    style={{
                      padding: '12px',
                      textAlign: 'left',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      borderRadius: '8px 0 0 8px',
                    }}
                  >
                    食物
                  </th>
                  <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#4ecdc4' }}>
                    热量<br /><span style={{ fontSize: '11px', fontWeight: 400 }}>kcal</span>
                  </th>
                  <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#4ecdc4' }}>
                    蛋白质<br /><span style={{ fontSize: '11px', fontWeight: 400 }}>g</span>
                  </th>
                  <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#ff6b6b' }}>
                    脂肪<br /><span style={{ fontSize: '11px', fontWeight: 400 }}>g</span>
                  </th>
                  <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#d4a72c' }}>
                    碳水<br /><span style={{ fontSize: '11px', fontWeight: 400 }}>g</span>
                  </th>
                  <th
                    style={{
                      padding: '12px',
                      textAlign: 'right',
                      fontWeight: 600,
                      color: '#8bc34a',
                      borderRadius: '0 8px 8px 0',
                    }}
                  >
                    纤维<br /><span style={{ fontSize: '11px', fontWeight: 400 }}>g</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {advice.alternatives.map((food: FoodItem, index: number) => (
                  <tr
                    key={food.id}
                    style={{
                      borderBottom: '1px solid #f0f0f0',
                      background: index === 0 ? 'rgba(78, 205, 196, 0.08)' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {index === 0 && (
                        <span
                          style={{
                            display: 'inline-block',
                            background: 'var(--primary)',
                            color: 'white',
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            marginRight: '6px',
                            verticalAlign: 'middle',
                          }}
                        >
                          推荐
                        </span>
                      )}
                      {food.name}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#4ecdc4', fontWeight: 600 }}>
                      {food.calories}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                      {food.protein}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                      {food.fat}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                      {food.carbs}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                      {food.fiber}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '16px' }}>
            * 以上数据为每100克可食用部分的营养参考值，实际摄入量可能因品种、烹饪方式等因素有所差异。
          </p>
        </div>
      </div>

      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
