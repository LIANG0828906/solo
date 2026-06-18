import { useState, useEffect } from 'react'
import { useAppStore } from '../store/appStore'
import { ingredientEmojis } from '../data/recipes'

const DetailPage = () => {
  const { selectedRecipe, goBack } = useAppStore()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (!selectedRecipe) return null

  const getEmoji = (ingredient: string) => {
    return ingredientEmojis[ingredient] || '🍽️'
  }

  return (
    <div style={styles.overlay} onClick={goBack}>
      <div
        style={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <button style={styles.closeButton} onClick={goBack}>
          ✕
        </button>

        <div style={styles.modalHeader}>
          <div style={styles.recipeEmoji}>{selectedRecipe.image}</div>
          <div>
            <h2 style={styles.recipeName}>{selectedRecipe.name}</h2>
            <p style={styles.recipeMeta}>
              ⏱ 烹饪时间: <span style={styles.cookTimeHighlight}>{selectedRecipe.cookTime}分钟</span>
            </p>
          </div>
        </div>

        <div style={{
          ...styles.modalContent,
          ...(isMobile ? { flexDirection: 'column' } : {}),
        }}>
          <div style={styles.stepsSection}>
            <h3 style={styles.sectionTitle}>烹饪步骤</h3>
            <div style={styles.stepsList}>
              {selectedRecipe.steps.map((step, index) => (
                <div key={index} style={styles.stepItem}>
                  <span style={styles.stepNumber}>{index + 1}.</span>
                  <span style={styles.stepText}>{step}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.ingredientsSection}>
            <h3 style={styles.sectionTitle}>食材清单</h3>
            <div style={styles.ingredientsList}>
              {selectedRecipe.ingredients.map((ingredient, index) => (
                <div key={index} style={styles.ingredientItem}>
                  <span style={styles.ingredientEmoji}>{getEmoji(ingredient)}</span>
                  <span style={styles.ingredientName}>{ingredient}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    zIndex: 1000,
    animation: 'fadeIn 0.3s ease',
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '900px',
    maxHeight: '90vh',
    overflow: 'auto',
    position: 'relative',
    animation: 'fadeInUp 0.3s ease',
  },
  closeButton: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#F1F5F9',
    color: '#64748B',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
    zIndex: 10,
  },
  modalHeader: {
    padding: '32px 32px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    borderBottom: '1px solid #F1F5F9',
  },
  recipeEmoji: {
    fontSize: '64px',
  },
  recipeName: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#1E293B',
    marginBottom: '8px',
  },
  recipeMeta: {
    fontSize: '16px',
    color: '#64748B',
  },
  cookTimeHighlight: {
    color: '#F97316',
    fontWeight: 600,
  },
  modalContent: {
    display: 'flex',
    gap: '32px',
    padding: '32px',
  },
  stepsSection: {
    flex: '1.5',
    minWidth: 0,
  },
  ingredientsSection: {
    flex: '1',
    minWidth: 0,
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#1E293B',
    marginBottom: '16px',
  },
  stepsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  stepItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: '8px',
    padding: '12px',
    display: 'flex',
    gap: '12px',
    lineHeight: 1.6,
  },
  stepNumber: {
    fontWeight: 700,
    color: '#F97316',
    minWidth: '24px',
  },
  stepText: {
    color: '#475569',
    fontSize: '14px',
  },
  ingredientsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  ingredientItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    border: '1px solid #E2E8F0',
    borderRadius: '4px',
  },
  ingredientEmoji: {
    fontSize: '20px',
  },
  ingredientName: {
    fontSize: '14px',
    color: '#475569',
    fontWeight: 500,
  },
}

const styleSheet = document.createElement('style')
styleSheet.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  button:hover {
    filter: brightness(1.1);
  }
`
document.head.appendChild(styleSheet)

export default DetailPage
