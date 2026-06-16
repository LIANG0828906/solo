import { useNavigate } from 'react-router-dom';
import type { RecipeWithMatch } from '@/types';
import { useRecipeStore } from '@/store/recipeStore';

interface Props {
  recipe: RecipeWithMatch;
}

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '2px solid var(--border-color)',
  borderRadius: 'var(--radius-lg)',
  overflow: 'hidden',
  cursor: 'pointer',
  boxShadow: 'var(--shadow-sm)',
  transition: 'transform 0.3s ease-out, box-shadow 0.3s ease-out',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column'
};

const cardHover: React.CSSProperties = {
  transform: 'translateY(-10px) rotate(-2deg)',
  boxShadow: 'var(--shadow-md)'
};

const badgeStyle: React.CSSProperties = {
  position: 'absolute',
  top: 12,
  left: 12,
  background: 'var(--success)',
  color: '#fff',
  padding: '4px 10px',
  borderRadius: 20,
  fontSize: 12,
  fontWeight: 600,
  zIndex: 2,
  boxShadow: '0 2px 6px rgba(42, 157, 143, 0.3)'
};

const matchBarStyle: React.CSSProperties = {
  position: 'absolute',
  top: 12,
  right: 12,
  background: 'rgba(45, 32, 20, 0.7)',
  color: '#fff',
  padding: '4px 10px',
  borderRadius: 20,
  fontSize: 12,
  fontWeight: 600,
  zIndex: 2
};

export default function RecipeCard({ recipe }: Props) {
  const navigate = useNavigate();
  const getAverageRating = useRecipeStore(state => state.getAverageRating);
  const avgRating = getAverageRating(recipe.id);

  const handleClick = () => {
    navigate(`/recipes/${recipe.id}`);
  };

  const renderStars = (count: number, size = 14) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const filled = count >= i;
      const half = !filled && count >= i - 0.5;
      stars.push(
        <span
          key={i}
          style={{
            fontSize: size,
            color: filled || half ? '#F4A261' : '#E0D5C7',
            display: 'inline-block',
            width: size,
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          {half ? '★' : filled ? '★' : '☆'}
        </span>
      );
    }
    return <span style={{ display: 'inline-flex', lineHeight: 1 }}>{stars}</span>;
  };

  return (
    <div
      style={cardStyle}
      onClick={handleClick}
      onMouseEnter={e => {
        Object.assign(e.currentTarget.style, cardHover);
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      }}
    >
      {recipe.canMake && <div style={badgeStyle}>✓ 可制作</div>}
      <div style={matchBarStyle}>匹配度 {recipe.matchPercentage}%</div>
      <div
        style={{
          width: '100%',
          height: 180,
          background: '#FEF0E6',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <img
          src={recipe.photoUrl}
          alt={recipe.name}
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.3s ease-out'
          }}
        />
      </div>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h3 style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)' }}>
            {recipe.name}
          </h3>
          <span
            style={{
              fontSize: 12,
              padding: '2px 8px',
              background: 'var(--bg-sidebar)',
              color: 'var(--text-secondary)',
              borderRadius: 12,
              fontWeight: 500
            }}
          >
            {recipe.category}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>难度</span>
            {renderStars(recipe.difficulty)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {avgRating > 0 ? `★ ${avgRating}` : '暂无评分'}
            </span>
          </div>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          ⏱ {recipe.estimatedTime} 分钟
        </div>
      </div>
    </div>
  );
}
