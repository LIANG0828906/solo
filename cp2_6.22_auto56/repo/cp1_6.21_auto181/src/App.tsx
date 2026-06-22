import React, { useState, useCallback, useMemo } from 'react';
import Cauldron from './Cauldron';
import ElementsPanel from './ElementsPanel';
import {
  synthesize,
  getElementById,
  getTotalRecipeCount,
  getAllRecipes,
  getBasicElements,
  type Recipe
} from './RecipeManager';

const App: React.FC = () => {
  const [synthesisSlots, setSynthesisSlots] = useState<(string | null)[]>([null, null]);
  const [unlockedRecipes, setUnlockedRecipes] = useState<string[]>([]);
  const [unlockedElements, setUnlockedElements] = useState<string[]>(
    getBasicElements().map(e => e.id)
  );
  const [isShaking, setIsShaking] = useState(false);
  const [resultElementId, setResultElementId] = useState<string | null>(null);
  const [particleColors, setParticleColors] = useState<string[]>([]);
  const [triggerParticles, setTriggerParticles] = useState(false);
  const [showAchievement, setShowAchievement] = useState(false);
  const [achievementName, setAchievementName] = useState('');
  const [newRecipeId, setNewRecipeId] = useState<string | null>(null);

  const totalRecipes = useMemo(() => getTotalRecipeCount(), []);
  const allRecipes = useMemo(() => getAllRecipes(), []);

  const canSynthesize = synthesisSlots[0] !== null && synthesisSlots[1] !== null;

  const unlockedRecipeDetails = useMemo(() => {
    return unlockedRecipes
      .map(id => allRecipes.find(r => r.id === id))
      .filter((r): r is Recipe => r !== undefined);
  }, [unlockedRecipes, allRecipes]);

  const handleSlotChange = useCallback((slotIndex: number, elementId: string | null) => {
    setSynthesisSlots(prev => {
      const next = [...prev];
      next[slotIndex] = elementId;
      return next;
    });
  }, []);

  const handleSynthesize = useCallback(() => {
    if (!synthesisSlots[0] || !synthesisSlots[1]) return;

    const recipe = synthesize(synthesisSlots[0], synthesisSlots[1]);

    if (recipe) {
      const isNew = !unlockedRecipes.includes(recipe.id);

      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);

      const resultEl = getElementById(recipe.result);
      const colors = [
        getElementById(synthesisSlots[0])?.color,
        getElementById(synthesisSlots[1])?.color,
        resultEl?.color
      ].filter((c): c is string => c !== undefined);

      setParticleColors(colors);
      setTriggerParticles(prev => !prev);

      setTimeout(() => {
        setResultElementId(recipe.result);
      }, 200);

      if (isNew) {
        setTimeout(() => {
          setUnlockedRecipes(prev => [...prev, recipe.id]);
          setNewRecipeId(recipe.id);

          if (!unlockedElements.includes(recipe.result)) {
            setUnlockedElements(prev => [...prev, recipe.result]);
          }

          setTimeout(() => setNewRecipeId(null), 1000);

          if (recipe.isAchievement && resultEl) {
            setAchievementName(resultEl.name);
            setShowAchievement(true);
            setTimeout(() => setShowAchievement(false), 3000);
          }
        }, 500);
      }

      setTimeout(() => {
        setSynthesisSlots([null, null]);
      }, 1500);
    } else {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 300);
    }
  }, [synthesisSlots, unlockedRecipes, unlockedElements]);

  const progress = (unlockedRecipes.length / totalRecipes) * 100;

  return (
    <div style={styles.appContainer}>
      <div style={styles.gameWrapper}>
        <div style={styles.header}>
          <h1 style={styles.title}>⚗️ 像素炼金工坊</h1>
          <div style={styles.progressContainer}>
            <div style={styles.progressLabel}>
              <span>进度</span>
              <span style={styles.progressNumbers}>
                {unlockedRecipes.length} / {totalRecipes}
              </span>
            </div>
            <div style={styles.progressBarBg}>
              <div
                style={{
                  ...styles.progressBarFill,
                  width: `${progress}%`
                }}
                className="progress-fill"
              />
            </div>
          </div>
        </div>

        <div style={styles.mainContent}>
          <div style={styles.recipePanel}>
            <div style={styles.panelTitle}>📜 配方记录</div>
            <div style={styles.recipeList}>
              {unlockedRecipeDetails.length === 0 ? (
                <div style={styles.emptyRecipes}>
                  <span style={{ fontSize: '24px' }}>🔮</span>
                  <p style={styles.emptyText}>还没有发现任何配方</p>
                  <p style={styles.emptyHint}>尝试组合基础元素吧！</p>
                </div>
              ) : (
                unlockedRecipeDetails.map(recipe => {
                  const resultEl = getElementById(recipe.result);
                  const ing1 = getElementById(recipe.ingredients[0]);
                  const ing2 = getElementById(recipe.ingredients[1]);

                  return (
                    <div
                      key={recipe.id}
                      className={`recipe-item ${newRecipeId === recipe.id ? 'new-recipe' : ''}`}
                      style={{
                        ...styles.recipeItem,
                        borderColor: recipe.isAchievement ? '#F59E0B' : '#334155',
                        animation: newRecipeId === recipe.id ? 'fadeInSlide 0.5s ease-out' : 'none',
                        background: recipe.isAchievement
                          ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(30, 41, 59, 1) 100%)'
                          : '#1E293B'
                      }}
                    >
                      <div style={styles.recipeIcons}>
                        <span style={styles.smallIcon}>{ing1?.icon}</span>
                        <span style={styles.plusMini}>+</span>
                        <span style={styles.smallIcon}>{ing2?.icon}</span>
                        <span style={styles.equalMini}>=</span>
                        <span style={{ ...styles.resultIcon, color: resultEl?.color }}>
                          {resultEl?.icon}
                        </span>
                      </div>
                      <span style={{ ...styles.recipeName, color: resultEl?.color }}>
                        {resultEl?.name}
                      </span>
                      {recipe.isAchievement && (
                        <span style={styles.achievementBadge}>🏆</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div style={styles.centerArea}>
            <Cauldron
              isShaking={isShaking}
              resultElementId={resultElementId}
              particleColors={particleColors}
              triggerParticles={triggerParticles}
            />
          </div>

          <div style={styles.rightPanel}>
            <ElementsPanel
              slots={synthesisSlots}
              unlockedElements={unlockedElements}
              onSlotChange={handleSlotChange}
              onSynthesize={handleSynthesize}
              canSynthesize={canSynthesize}
            />
          </div>
        </div>
      </div>

      {showAchievement && (
        <div style={styles.achievementOverlay} className="achievement-overlay">
          <div
            style={styles.achievementBadgeLarge}
            className="achievement-badge"
          >
            <div style={styles.achievementIcon}>🏆</div>
            <div style={styles.achievementName}>{achievementName}</div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes stripeMove {
          0% { background-position: 0 0; }
          100% { background-position: 40px 0; }
        }

        .progress-fill {
          background: linear-gradient(
            90deg,
            #6366F1 0%,
            #8B5CF6 25%,
            #6366F1 50%,
            #8B5CF6 75%,
            #6366F1 100%
          );
          background-size: 40px 100%;
          animation: stripeMove 2s linear infinite;
        }

        @keyframes fadeInSlide {
          0% {
            opacity: 0;
            transform: translateX(-20px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes badgeGlow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(245, 158, 11, 0.5);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 40px rgba(245, 158, 11, 0.8);
            transform: scale(1.05);
          }
        }

        .achievement-badge {
          animation: badgeGlow 1s ease-in-out infinite;
        }

        .achievement-overlay {
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .new-recipe {
          animation: fadeInSlide 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  appContainer: {
    width: '100%',
    height: '100%',
    background: '#0F172A',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: "'Courier New', monospace",
    color: '#E2E8F0',
    overflow: 'hidden'
  },
  gameWrapper: {
    width: 960,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px',
    gap: '20px'
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#F1F5F9',
    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
    letterSpacing: '2px'
  },
  progressContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  progressLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#94A3B8'
  },
  progressNumbers: {
    fontWeight: 'bold',
    color: '#8B5CF6'
  },
  progressBarBg: {
    width: '100%',
    height: 12,
    background: '#1E293B',
    borderRadius: '6px',
    overflow: 'hidden',
    border: '1px solid #334155'
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '6px',
    transition: 'width 0.5s ease-out',
    minWidth: '2px'
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    gap: '20px',
    minHeight: 0
  },
  recipePanel: {
    width: 240,
    background: '#1E293B',
    borderRadius: '8px',
    border: '2px solid #334155',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  panelTitle: {
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#F1F5F9',
    background: '#0F172A',
    borderBottom: '2px solid #334155',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  recipeList: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  emptyRecipes: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    color: '#64748B'
  },
  emptyText: {
    fontSize: '12px',
    textAlign: 'center'
  },
  emptyHint: {
    fontSize: '10px',
    textAlign: 'center',
    color: '#475569'
  },
  recipeItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    background: '#1E293B',
    border: '2px solid #334155',
    borderRadius: '4px',
    transition: 'all 0.2s ease'
  },
  recipeIcons: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  smallIcon: {
    fontSize: '16px'
  },
  plusMini: {
    fontSize: '10px',
    color: '#64748B'
  },
  equalMini: {
    fontSize: '10px',
    color: '#64748B'
  },
  resultIcon: {
    fontSize: '18px',
    marginLeft: '4px'
  },
  recipeName: {
    flex: 1,
    fontSize: '12px',
    fontWeight: 'bold'
  },
  achievementBadge: {
    fontSize: '14px'
  },
  centerArea: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  rightPanel: {
    width: 280
  },
  achievementOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100
  },
  achievementBadgeLarge: {
    width: 80,
    height: 80,
    background: '#FEF3C7',
    border: '4px solid #F59E0B',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2px'
  },
  achievementIcon: {
    fontSize: '28px'
  },
  achievementName: {
    fontSize: '10px',
    fontWeight: 'bold',
    color: '#B45309',
    textAlign: 'center'
  }
};

export default App;
