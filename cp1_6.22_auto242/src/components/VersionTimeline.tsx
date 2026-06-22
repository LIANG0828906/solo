import React from 'react';
import type { RecipeVersion, Ingredient } from '../types';
import { calculateCost } from '../modules/CostCalculator';

interface VersionTimelineProps {
  versions: RecipeVersion[];
  ingredients: Ingredient[];
  onRollback?: (versionId: string) => void;
}

const VersionTimeline: React.FC<VersionTimelineProps> = ({ versions, ingredients, onRollback }) => {
  const sortedVersions = [...versions].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div style={{ position: 'relative' }}>
      {sortedVersions.map((version, index) => {
        const cost = calculateCost(ingredients, version.ingredients);
        
        return (
          <div key={version.id} style={{ 
            display: 'flex', 
            gap: '16px',
            position: 'relative',
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}>
              <div style={{
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                backgroundColor: index === 0 ? '#C9A96E' : '#D4C5A9',
                border: '2px solid #FDFBF7',
                boxShadow: '0 0 0 2px ' + (index === 0 ? '#C9A96E' : '#D4C5A9'),
                zIndex: 1,
                flexShrink: 0,
              }} />
              {index < sortedVersions.length - 1 && (
                <div style={{
                  flex: 1,
                  width: '2px',
                  backgroundColor: '#E0D6C8',
                  marginTop: '4px',
                }} />
              )}
            </div>
            
            <div style={{
              flex: 1,
              paddingBottom: index < sortedVersions.length - 1 ? '24px' : '0',
            }}>
              <div style={{
                backgroundColor: '#FDFBF7',
                border: '1px solid #E0D6C8',
                borderRadius: '6px',
                padding: '12px',
                transition: 'box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(60,36,21,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}>
                  <div>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#3C2415',
                      fontFamily: "'Inter', sans-serif",
                    }}>
                      {version.note}
                    </span>
                    {index === 0 && (
                      <span style={{
                        marginLeft: '8px',
                        fontSize: '11px',
                        padding: '2px 6px',
                        backgroundColor: '#C9A96E',
                        color: '#FDFBF7',
                        borderRadius: '4px',
                        fontFamily: "'Inter', sans-serif",
                      }}>
                        当前
                      </span>
                    )}
                  </div>
                  <span style={{
                    fontSize: '12px',
                    color: '#8B7355',
                    fontFamily: "'Inter', sans-serif",
                  }}>
                    {formatDate(version.timestamp)}
                  </span>
                </div>
                
                <div style={{
                  fontSize: '12px',
                  color: '#A6967C',
                  fontFamily: "'Inter', sans-serif",
                  marginBottom: '8px',
                }}>
                  {version.ingredients.length} 种原料 · 成本 ¥{cost.totalCostPer10ml.toFixed(2)}/10ml
                </div>
                
                {index !== 0 && onRollback && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRollback(version.id);
                    }}
                    style={{
                      fontSize: '12px',
                      color: '#C9A96E',
                      backgroundColor: 'transparent',
                      border: '1px solid #C9A96E',
                      borderRadius: '4px',
                      padding: '4px 10px',
                      cursor: 'pointer',
                      fontFamily: "'Inter', sans-serif",
                      transition: 'background-color 0.15s, color 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#C9A96E';
                      e.currentTarget.style.color = '#FDFBF7';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#C9A96E';
                    }}
                  >
                    回滚到此版本
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default VersionTimeline;
