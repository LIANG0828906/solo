import { useState, useEffect } from 'react'
import { useAppStore } from '../store/appStore'
import { Recipe } from '../data/recipes'

const ResultPage = () => {
  const { imageUrl, detectedIngredients, matchedRecipes, selectRecipe, reset } = useAppStore()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>
          <span style={styles.titleIcon}>🍳</span> SnapChef
        </h1>
        <button onClick={reset} style={styles.backButton}>
          ← 重新上传
        </button>
      </div>

      <div style={{
        ...styles.content,
        ...(isMobile ? { flexDirection: 'column' } : {}),
      }}>
        <div style={{
          ...styles.leftSection,
          ...(isMobile ? { flex: 'none', width: '100%' } : {}),
        }}>
          <div style={styles.imageContainer}>
            {imageUrl && (
              <img src={imageUrl} alt="上传的食材" style={styles.image} />
            )}
          </div>

          <div style={styles.ingredientsSection}>
            <h3 style={styles.sectionTitle}>识别出的食材</h3>
            <div style={styles.ingredientsList}>
              {detectedIngredients.map((ingredient, index) => (
                <span key={index} style={styles.ingredientTag}>
                  {ingredient}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div style={styles.rightSection}>
          <h3 style={styles.sectionTitle}>
            推荐菜谱 ({matchedRecipes.length}道)
          </h3>
          {matchedRecipes.length > 0 ? (
            <div style={styles.recipesScroll}>
              <div style={{
                ...styles.recipesContainer,
                ...(isMobile ? { flexDirection: 'column', alignItems: 'center' } : {}),
              }}>
                {matchedRecipes.map((recipe, index) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    index={index}
                    onClick={() => selectRecipe(recipe)}
                    detectedIngredients={detectedIngredients}
                    isMobile={isMobile}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div style={styles.noRecipes}>
              <p style={styles.noRecipesText}>
                😔 没有找到匹配的菜谱，请尝试上传更多食材
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface RecipeCardProps {
  recipe: Recipe
  index: number
  onClick: () => void
  detectedIngredients: string[]
  isMobile: boolean
}

const RecipeCard = ({ recipe, index, onClick, detectedIngredients, isMobile }: RecipeCardProps) => {
  const [isHovered, setIsHovered] = useState(false)
  const additionalIngredients = recipe.ingredients.filter(
    ing => !detectedIngredients.includes(ing)
  )

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        ...styles.recipeCard,
        ...(isHovered && !isMobile ? styles.recipeCardHover : {}),
        ...(isMobile ? { width: '100%', flex: 'none' } : {}),
        animation: `fadeInUp 0.3s ease forwards`,
        animationDelay: `${index * 0.05}s`,
        opacity: 0,
      }}
    >
      <div style={styles.cardHeader}>
        <h4 style={styles.recipeName}>{recipe.name}</h4>
      </div>
      <div style={styles.cardWatermark}>{recipe.image}</div>
      <div style={styles.cardFooter}>
        <span style={styles.cookTime}>⏱ {recipe.cookTime}分钟</span>
        <span style={styles.additionalCount}>
          +{additionalIngredients.length}种食材
        </span>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '32px',
  },
  title: {
    fontSize: '32px',
    fontWeight: 700,
    color: '#1E293B',
  },
  titleIcon: {
    color: '#F97316',
  },
  backButton: {
    padding: '10px 20px',
    backgroundColor: '#F97316',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  content: {
    display: 'flex',
    gap: '32px',
    flexWrap: 'wrap',
  },
  leftSection: {
    flex: '0 0 320px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  rightSection: {
    flex: '1',
    minWidth: '300px',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: '1',
    borderRadius: '8px',
    border: '1px solid #E2E8F0',
    overflow: 'hidden',
    backgroundColor: 'white',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  ingredientsSection: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#1E293B',
    marginBottom: '16px',
  },
  ingredientsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  ingredientTag: {
    padding: '6px 12px',
    backgroundColor: '#86EFAC',
    color: '#166534',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 500,
  },
  recipesScroll: {
    overflowX: 'auto',
    paddingBottom: '16px',
  },
  recipesContainer: {
    display: 'flex',
    gap: '20px',
    paddingRight: '8px',
  },
  recipeCard: {
    flex: '0 0 220px',
    width: '220px',
    height: '280px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.3s ease',
  },
  recipeCardHover: {
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    transform: 'translateY(-2px)',
  },
  cardHeader: {
    padding: '20px 16px',
    zIndex: 1,
  },
  recipeName: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#1E293B',
  },
  cardWatermark: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '120px',
    opacity: 0.15,
    zIndex: 0,
  },
  cardFooter: {
    marginTop: 'auto',
    padding: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
  },
  cookTime: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#F97316',
  },
  additionalCount: {
    fontSize: '13px',
    color: '#94A3B8',
  },
  noRecipes: {
    padding: '60px 20px',
    textAlign: 'center',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
  },
  noRecipesText: {
    fontSize: '16px',
    color: '#64748B',
  },
}

const styleSheet = document.createElement('style')
styleSheet.textContent = `
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

export default ResultPage
