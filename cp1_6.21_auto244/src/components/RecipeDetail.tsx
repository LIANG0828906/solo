import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { recipeApi } from '../api/recipeApi';
import type { Recipe, IngredientChange, StepChange } from '../types';

interface RecipeDetailProps {
  onRecipeUpdate: (recipe: Recipe) => void;
  onBack: () => void;
}

const RecipeDetail = ({ onRecipeUpdate, onBack }: RecipeDetailProps) => {
  const { id } = useParams<{ id: string }>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [ingredientChanges, setIngredientChanges] = useState<IngredientChange[]>([]);
  const [stepChanges, setStepChanges] = useState<StepChange[]>([]);
  const [summary, setSummary] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchRecipe = async () => {
      try {
        const data = await recipeApi.getRecipe(id);
        setRecipe(data);
      } catch (error) {
        console.error('Failed to fetch recipe:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecipe();
  }, [id]);

  const handleIngredientChange = (name: string, oldAmount: string, newAmount: string) => {
    setIngredientChanges(prev => {
      const existing = prev.find(c => c.name === name);
      if (existing) {
        return prev.map(c => c.name === name ? { ...c, newAmount } : c);
      }
      return [...prev, { name, oldAmount, newAmount }];
    });
  };

  const handleStepChange = (index: number, oldDesc: string, newDesc: string) => {
    setStepChanges(prev => {
      const existing = prev.find(c => c.index === index);
      if (existing) {
        return prev.map(c => c.index === index ? { ...c, newDesc } : c);
      }
      return [...prev, { index, oldDesc, newDesc }];
    });
  };

  const handleSubmit = async () => {
    if (!id || (ingredientChanges.length === 0 && stepChanges.length === 0)) return;
    
    setSubmitting(true);
    try {
      const authorAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`;
      const updated = await recipeApi.improveRecipe(id, {
        author: authorAvatar,
        authorName: authorName || '匿名用户',
        ingredientChanges: ingredientChanges.filter(c => c.newAmount && c.newAmount !== c.oldAmount),
        stepChanges: stepChanges.filter(c => c.newDesc && c.newDesc !== c.oldDesc),
        summary: summary || '进行了改进',
      });
      setRecipe(updated);
      onRecipeUpdate(updated);
      setShowModal(false);
      setIngredientChanges([]);
      setStepChanges([]);
      setSummary('');
      setAuthorName('');
    } catch (error) {
      console.error('Failed to submit improvement:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const openModal = () => {
    setShowModal(true);
    setIngredientChanges([]);
    setStepChanges([]);
    setSummary('');
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>加载菜谱详情...</p>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div style={styles.errorContainer}>
        <p style={styles.errorText}>菜谱不存在</p>
        <button onClick={onBack} style={styles.backButton}>返回首页</button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <button onClick={onBack} style={styles.backButton}>
        ← 返回列表
      </button>

      <div style={styles.header}>
        <div style={styles.headerTop}>
          <div style={styles.titleSection}>
            <span style={styles.cuisineTag}>{recipe.cuisine}</span>
            <h1 style={styles.title}>{recipe.title}</h1>
            <p style={styles.description}>{recipe.description}</p>
          </div>
          <div style={styles.authorSection}>
            <img src={recipe.authorAvatar} alt={recipe.author} style={styles.authorAvatar} />
            <div>
              <p style={styles.authorName}>{recipe.author}</p>
              <p style={styles.versionText}>版本 v{recipe.version}</p>
            </div>
          </div>
        </div>
        <div style={styles.statsRow}>
          <div style={styles.statItem}>
            <span style={styles.statIcon}>✨</span>
            <span style={styles.statValue}>{recipe.improveCount}</span>
            <span style={styles.statLabel}>次改进</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statIcon}>📅</span>
            <span style={styles.statValue}>{formatDateTime(recipe.updatedAt).split(' ')[0]}</span>
            <span style={styles.statLabel}>最后更新</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statIcon}>🥗</span>
            <span style={styles.statValue}>{recipe.ingredients.length}</span>
            <span style={styles.statLabel}>种食材</span>
          </div>
        </div>
        <button onClick={openModal} style={styles.improveButton}>
          ✏️ 改进这个菜谱
        </button>
      </div>

      <div className="content-grid" style={styles.contentGrid}>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>🥬 配料表</h2>
          <div style={styles.ingredientsList}>
            {recipe.ingredients.map((ing, idx) => (
              <div key={idx} style={styles.ingredientItem}>
                <span style={styles.ingredientName}>{ing.name}</span>
                <span style={styles.ingredientAmount}>{ing.amount}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>👨‍🍳 烹饪步骤</h2>
          <div style={styles.stepsList}>
            {recipe.steps.map((step, idx) => (
              <div key={idx} style={styles.stepCard}>
                <div style={styles.stepNumber}>{idx + 1}</div>
                <p style={styles.stepText}>{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>📜 改进记录</h2>
        {recipe.history.length === 0 ? (
          <p style={styles.emptyHistory}>
            这个菜谱还没有被改进过，快来做第一个改进者吧！
          </p>
        ) : (
          <div style={styles.timeline}>
            {recipe.history.map((entry, idx) => (
              <div 
                key={entry.id} 
                style={{
                  ...styles.timelineItem,
                  opacity: 0,
                  animation: `fadeIn 0.3s ease-out ${idx * 0.1}s forwards`,
                }}
              >
                <div style={styles.timelineLine}></div>
                <div style={styles.timelineDot}></div>
                <div style={styles.timelineContent}>
                  <div style={styles.timelineHeader}>
                    <img 
                      src={entry.authorAvatar} 
                      alt={entry.author}
                      style={styles.historyAvatar}
                    />
                    <div>
                      <p style={styles.historyAuthor}>{entry.author}</p>
                      <p style={styles.historyTime}>{formatDateTime(entry.timestamp)}</p>
                    </div>
                  </div>
                  <p style={styles.historySummary}>{entry.summary}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div 
            style={styles.modalContent}
            onClick={e => e.stopPropagation()}
          >
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>✏️ 改进菜谱</h3>
              <button 
                onClick={() => setShowModal(false)}
                style={styles.closeButton}
              >
                ✕
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>你的昵称</label>
                <input
                  type="text"
                  value={authorName}
                  onChange={e => setAuthorName(e.target.value)}
                  placeholder="请输入昵称（选填）"
                  style={styles.input}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>修改配料用量</label>
                <div style={styles.editList}>
                  {recipe.ingredients.map((ing, idx) => {
                    const change = ingredientChanges.find(c => c.name === ing.name);
                    return (
                      <div key={idx} style={styles.editRow}>
                        <span style={styles.editName}>{ing.name}</span>
                        <input
                          type="text"
                          value={change?.newAmount ?? ing.amount}
                          onChange={e => handleIngredientChange(ing.name, ing.amount, e.target.value)}
                          style={styles.editInput}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>修改步骤描述</label>
                <div style={styles.editList}>
                  {recipe.steps.map((step, idx) => {
                    const change = stepChanges.find(c => c.index === idx);
                    return (
                      <div key={idx} style={styles.editRow}>
                        <span style={styles.editStepNum}>步骤 {idx + 1}</span>
                        <textarea
                          value={change?.newDesc ?? step}
                          onChange={e => handleStepChange(idx, step, e.target.value)}
                          style={styles.editTextarea}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>改进说明</label>
                <textarea
                  value={summary}
                  onChange={e => setSummary(e.target.value)}
                  placeholder="简要描述你做了哪些改进..."
                  style={{ ...styles.editTextarea, minHeight: '80px' }}
                />
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button 
                onClick={() => setShowModal(false)}
                style={styles.cancelButton}
              >
                取消
              </button>
              <button 
                onClick={handleSubmit}
                disabled={submitting || (ingredientChanges.length === 0 && stepChanges.length === 0)}
                style={{
                  ...styles.submitButton,
                  opacity: submitting || (ingredientChanges.length === 0 && stepChanges.length === 0) ? 0.6 : 1,
                  cursor: submitting || (ingredientChanges.length === 0 && stepChanges.length === 0) ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting ? '提交中...' : '提交改进'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 0',
    gap: '16px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #334155',
    borderTopColor: '#F59E0B',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: '14px',
  },
  errorContainer: {
    textAlign: 'center' as const,
    padding: '80px 0',
  },
  errorText: {
    color: '#F87171',
    fontSize: '18px',
    marginBottom: '16px',
  },
  backButton: {
    backgroundColor: 'transparent',
    border: '1px solid #334155',
    color: '#94A3B8',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    marginBottom: '24px',
    transition: 'all 0.3s ease',
  },
  header: {
    backgroundColor: '#1E293B',
    borderRadius: '16px',
    padding: '32px',
    marginBottom: '32px',
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '24px',
    marginBottom: '24px',
    flexWrap: 'wrap' as const,
  },
  titleSection: {
    flex: 1,
    minWidth: '280px',
  },
  cuisineTag: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    color: '#F59E0B',
    padding: '6px 16px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 600,
    display: 'inline-block',
    marginBottom: '12px',
  },
  title: {
    fontSize: '32px',
    fontWeight: 700,
    color: '#E2E8F0',
    margin: '0 0 12px 0',
  },
  description: {
    fontSize: '16px',
    color: '#94A3B8',
    margin: 0,
    lineHeight: 1.6,
  },
  authorSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  authorAvatar: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: '#334155',
  },
  authorName: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#E2E8F0',
    margin: '0 0 4px 0',
  },
  versionText: {
    fontSize: '13px',
    color: '#94A3B8',
    margin: 0,
  },
  statsRow: {
    display: 'flex',
    gap: '32px',
    padding: '20px 0',
    borderTop: '1px solid #334155',
    borderBottom: '1px solid #334155',
    marginBottom: '24px',
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  statIcon: {
    fontSize: '20px',
  },
  statValue: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#F59E0B',
  },
  statLabel: {
    fontSize: '14px',
    color: '#94A3B8',
  },
  improveButton: {
    width: '100%',
    backgroundColor: '#F59E0B',
    color: '#0F172A',
    border: 'none',
    padding: '14px 24px',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  contentGrid: {
  },
  section: {
    marginBottom: '32px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#E2E8F0',
    margin: '0 0 20px 0',
  },
  ingredientsList: {
    backgroundColor: '#1E293B',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  ingredientItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #334155',
  },
  ingredientName: {
    fontSize: '15px',
    color: '#E2E8F0',
    fontWeight: 500,
  },
  ingredientAmount: {
    fontSize: '14px',
    color: '#F59E0B',
    fontWeight: 600,
  },
  stepsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  stepCard: {
    backgroundColor: '#334155',
    borderRadius: '8px',
    padding: '20px',
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: '32px',
    height: '32px',
    minWidth: '32px',
    backgroundColor: '#F59E0B',
    color: '#0F172A',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '14px',
  },
  stepText: {
    fontSize: '15px',
    color: '#E2E8F0',
    lineHeight: 1.7,
    margin: 0,
    flex: 1,
  },
  emptyHistory: {
    textAlign: 'center' as const,
    padding: '40px',
    color: '#64748B',
    backgroundColor: '#1E293B',
    borderRadius: '12px',
  },
  timeline: {
    position: 'relative' as const,
    paddingLeft: '32px',
  },
  timelineItem: {
    position: 'relative' as const,
    paddingBottom: '24px',
  },
  timelineLine: {
    position: 'absolute' as const,
    left: '-26px',
    top: '16px',
    bottom: '-8px',
    width: '2px',
    backgroundColor: '#10B981',
  },
  timelineDot: {
    position: 'absolute' as const,
    left: '-30px',
    top: '8px',
    width: '12px',
    height: '12px',
    backgroundColor: '#10B981',
    borderRadius: '50%',
    border: '2px solid #0F172A',
    zIndex: 1,
  },
  timelineContent: {
    backgroundColor: '#1E293B',
    borderRadius: '12px',
    padding: '16px 20px',
  },
  timelineHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '8px',
  },
  historyAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#334155',
  },
  historyAuthor: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#E2E8F0',
    margin: '0 0 2px 0',
  },
  historyTime: {
    fontSize: '12px',
    color: '#64748B',
    margin: 0,
  },
  historySummary: {
    fontSize: '14px',
    color: '#94A3B8',
    margin: 0,
    lineHeight: 1.6,
  },
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modalContent: {
    backgroundColor: '#0F172A',
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '600px',
    width: '100%',
    maxHeight: '85vh',
    overflowY: 'auto' as const,
    animation: 'fadeIn 0.3s ease-out',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid #334155',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#E2E8F0',
    margin: 0,
  },
  closeButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#94A3B8',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '4px 8px',
    lineHeight: 1,
  },
  modalBody: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#CBD5E1',
  },
  input: {
    backgroundColor: '#1E293B',
    border: '2px solid #334155',
    borderRadius: '8px',
    padding: '12px 16px',
    color: '#E2E8F0',
    fontSize: '14px',
    transition: 'border-color 0.2s ease',
    outline: 'none',
  },
  editList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    maxHeight: '200px',
    overflowY: 'auto' as const,
  },
  editRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  editName: {
    fontSize: '14px',
    color: '#E2E8F0',
    minWidth: '120px',
    flexShrink: 0,
  },
  editStepNum: {
    fontSize: '13px',
    color: '#F59E0B',
    fontWeight: 600,
    minWidth: '70px',
    flexShrink: 0,
  },
  editInput: {
    flex: 1,
    backgroundColor: '#1E293B',
    border: '2px solid #334155',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#E2E8F0',
    fontSize: '14px',
    transition: 'border-color 0.2s ease',
    outline: 'none',
  },
  editTextarea: {
    flex: 1,
    backgroundColor: '#1E293B',
    border: '2px solid #334155',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#E2E8F0',
    fontSize: '14px',
    minHeight: '60px',
    resize: 'vertical' as const,
    transition: 'border-color 0.2s ease',
    outline: 'none',
    fontFamily: 'inherit',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '24px',
    paddingTop: '16px',
    borderTop: '1px solid #334155',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    border: '1px solid #334155',
    color: '#94A3B8',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all 0.3s ease',
  },
  submitButton: {
    backgroundColor: '#F59E0B',
    border: 'none',
    color: '#0F172A',
    padding: '10px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    transition: 'all 0.3s ease',
  },
};

const focusStyles = `
  input:focus, textarea:focus {
    border-color: #3B82F6 !important;
  }
  button:hover {
    filter: brightness(1.1);
  }
`;

if (!document.querySelector('#focus-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'focus-styles';
  styleSheet.textContent = focusStyles;
  document.head.appendChild(styleSheet);
}

export default RecipeDetail;
