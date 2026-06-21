import { useState } from 'react';
import type { RecipeSummary } from '../types';

interface RecipeCardProps {
  recipe: RecipeSummary;
  onClick: () => void;
}

const RecipeCard = ({ recipe, onClick }: RecipeCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        ...styles.card,
        transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: isHovered 
          ? '0 12px 24px rgba(0, 0, 0, 0.3)' 
          : '0 4px 12px rgba(0, 0, 0, 0.15)',
        transition: 'all 0.25s ease-out',
      }}
    >
      <div style={styles.cardInner}>
        <div style={styles.header}>
          <span style={styles.cuisineTag}>
          {recipe.cuisine}
        </span>
          <div style={styles.badge}>
            <span style={styles.badgeIcon}>✨</span>
            <span style={styles.badgeText}>{recipe.improveCount}</span>
          </div>
        </div>

        <h3 style={styles.title}>{recipe.title}</h3>
        <p style={styles.description}>{recipe.description}</p>

        <div style={styles.footer}>
          <div style={styles.authorInfo}>
            <img 
              src={recipe.authorAvatar} 
              alt={recipe.author}
              style={styles.avatar}
            />
            <span style={styles.authorName}>{recipe.author}</span>
          </div>
          <span style={styles.date}>{formatDate(recipe.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
};

const styles = {
  card: {
    width: '100%',
    minHeight: '200px',
    backgroundColor: '#1E293B',
    borderRadius: '16px',
    padding: '20px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  cardInner: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
  },
  cuisineTag: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    color: '#F59E0B',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 600,
  },
  badge: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    color: '#3B82F6',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 600,
  },
  badgeIcon: {
    fontSize: '12px',
  },
  badgeText: {
    fontSize: '12px',
  },
  title: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#E2E8F0',
    margin: '0 0 8px 0',
    lineHeight: 1.4,
  },
  description: {
    fontSize: '14px',
    color: '#94A3B8',
    margin: '0 0 16px 0',
    lineHeight: 1.6,
    flex: 1,
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: '12px',
    borderTop: '1px solid #334155',
  },
  authorInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  avatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: '#334155',
  },
  authorName: {
    fontSize: '13px',
    color: '#CBD5E1',
  },
  date: {
    fontSize: '12px',
    color: '#64748B',
  },
};

export default RecipeCard;
