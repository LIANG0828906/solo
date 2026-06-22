import { useMemo } from 'react';
import { useRecipeStore } from '../store/useRecipeStore';
import type { SavedCard, RecipeScore } from '../types';
import { FLAVOR_LABELS } from '../types';
import styles from './CardGallery.module.css';

const RADAR_LABELS: { key: keyof RecipeScore; label: string }[] = [
  { key: 'taste', label: '口感' },
  { key: 'nutrition', label: '营养' },
  { key: 'creativity', label: '创意' },
  { key: 'difficulty', label: '难度' },
  { key: 'appearance', label: '颜值' },
];

interface RadarChartProps {
  score: RecipeScore;
}

const RadarChart = ({ score }: RadarChartProps) => {
  const size = 180;
  const center = size / 2;
  const radius = 65;

  const points = useMemo(() => {
    return RADAR_LABELS.map((item, index) => {
      const angle = (Math.PI * 2 * index) / RADAR_LABELS.length - Math.PI / 2;
      const value = score[item.key] / 100;
      return {
        x: center + radius * value * Math.cos(angle),
        y: center + radius * value * Math.sin(angle),
        labelX: center + (radius + 20) * Math.cos(angle),
        labelY: center + (radius + 20) * Math.sin(angle),
        label: item.label,
        value: score[item.key],
      };
    });
  }, [score]);

  const gridLines = useMemo(() => {
    const lines = [];
    for (let i = 1; i <= 4; i++) {
      const r = (radius * i) / 4;
      const path = RADAR_LABELS.map((_, index) => {
        const angle = (Math.PI * 2 * index) / RADAR_LABELS.length - Math.PI / 2;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        return `${index === 0 ? 'M' : 'L'}${x},${y}`;
      }).join(' ') + 'Z';
      lines.push(path);
    }
    return lines;
  }, []);

  const dataPath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`)
    .join(' ') + 'Z';

  return (
    <svg className={styles.radarSvg} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <radialGradient id="radarGradient">
          <stop offset="0%" stopColor="#E8B4B8" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#E8B4B8" stopOpacity="0.1" />
        </radialGradient>
      </defs>

      {gridLines.map((path, i) => (
        <path
          key={i}
          d={path}
          fill="none"
          stroke="#F5E6CC"
          strokeWidth="1"
        />
      ))}

      {RADAR_LABELS.map((_, index) => {
        const angle = (Math.PI * 2 * index) / RADAR_LABELS.length - Math.PI / 2;
        return (
          <line
            key={index}
            x1={center}
            y1={center}
            x2={center + radius * Math.cos(angle)}
            y2={center + radius * Math.sin(angle)}
            stroke="#F5E6CC"
            strokeWidth="1"
          />
        );
      })}

      <path
        d={dataPath}
        fill="url(#radarGradient)"
        stroke="#E8B4B8"
        strokeWidth="2"
      />

      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#E8B4B8" />
      ))}

      {points.map((p, i) => (
        <text
          key={`label-${i}`}
          x={p.labelX}
          y={p.labelY}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="11"
          fill="#7C4A3A"
          fontWeight="500"
        >
          {p.label} {p.value}
        </text>
      ))}
    </svg>
  );
};

export const CardGallery = () => {
  const savedCards = useRecipeStore((state) => state.savedCards);
  const loadCardForEdit = useRecipeStore((state) => state.loadCardForEdit);
  const deleteCard = useRecipeStore((state) => state.deleteCard);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const getAverageScore = (score: RecipeScore) => {
    const values = Object.values(score) as number[];
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  };

  const handleDelete = (e: React.MouseEvent, cardId: string) => {
    e.stopPropagation();
    if (confirm('确定要删除这张作品卡片吗？')) {
      deleteCard(cardId);
    }
  };

  return (
    <section className={styles.galleryContainer}>
      <h2 className={styles.galleryTitle}>
        <span className={styles.titleIcon}>📋</span>
        我的作品
        <span style={{ fontSize: '14px', color: '#A08070', fontWeight: '400' }}>
          （共 {savedCards.length} 道）
        </span>
      </h2>

      {savedCards.length === 0 ? (
        <div className={styles.emptyGallery}>
          <div className={styles.emptyEmoji}>🍽️</div>
          <p className={styles.emptyText}>还没有保存任何作品</p>
          <p className={styles.emptyHint}>组合食材并点击保存，你的创意就会出现在这里</p>
        </div>
      ) : (
        <div className={styles.cardGrid}>
          {savedCards.map((card: SavedCard) => (
            <div
              key={card.id}
              className={styles.card}
              onClick={() => loadCardForEdit(card.id)}
            >
              <button
                className={styles.deleteBtn}
                onClick={(e) => handleDelete(e, card.id)}
                aria-label="删除卡片"
              >
                ✕
              </button>

              <div className={styles.cardHeader}>
                <h3 className={styles.cardName}>{card.name}</h3>
                <span className={styles.pixelIcon}>
                  {card.mainIngredient.pixelIcon}
                </span>
              </div>

              <div className={styles.cardMeta}>
                <div className={styles.ingredientList}>
                  {card.items.slice(0, 4).map((item) => (
                    <span key={item.ingredient.id} className={styles.ingredientTag}>
                      <span className={styles.emoji}>{item.ingredient.emoji}</span>
                      {item.ingredient.name}
                    </span>
                  ))}
                  {card.items.length > 4 && (
                    <span className={styles.ingredientTag}>
                      +{card.items.length - 4}
                    </span>
                  )}
                </div>

                <div className={styles.nutritionSummary}>
                  <span>🔥 <strong>{Math.round(card.totalNutrition.calories)}</strong> kcal</span>
                  <span>💪 <strong>{card.totalNutrition.protein.toFixed(1)}</strong>g</span>
                  <span>🍚 <strong>{card.totalNutrition.carbs.toFixed(1)}</strong>g</span>
                </div>
              </div>

              {card.flavors.length > 0 && (
                <div className={styles.flavorList}>
                  {card.flavors.map((flavor) => (
                    <span key={flavor} className={styles.flavorTag}>
                      {FLAVOR_LABELS[flavor]}
                    </span>
                  ))}
                </div>
              )}

              <div className={styles.cardFooter}>
                <span className={styles.averageScore}>
                  {getAverageScore(card.score)}
                  <small> / 100</small>
                </span>
                <span className={styles.createdAt}>
                  {formatDate(card.createdAt)}
                </span>
              </div>

              <div className={styles.radarOverlay}>
                <div className={styles.radarContainer}>
                  <RadarChart score={card.score} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
