import React from 'react';
import type { FoodItem } from './types';

interface FoodCardProps {
  food: FoodItem;
  index: number;
  onEdit: (food: FoodItem) => void;
  onDelete: (id: string) => void;
  isVisible: boolean;
}

const categoryColors: Record<string, string> = {
  vegetable: '#10B981',
  meat: '#EF4444',
  seasoning: '#F97316',
};

const categoryIcons: Record<string, string> = {
  vegetable: '🥬',
  meat: '🥩',
  seasoning: '🧂',
};

function getRemainingDays(purchaseDate: string, shelfLifeDays: number): number {
  const purchase = new Date(purchaseDate);
  const expiry = new Date(purchase);
  expiry.setDate(expiry.getDate() + shelfLifeDays);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);
  const diff = expiry.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getExpiryColor(days: number): string {
  if (days <= 0) return '#EF4444';
  if (days <= 3) return '#F97316';
  if (days <= 7) return '#EAB308';
  return '#10B981';
}

const FoodCard: React.FC<FoodCardProps> = ({ food, index, onEdit, onDelete, isVisible }) => {
  const remainingDays = getRemainingDays(food.purchaseDate, food.shelfLifeDays);
  const progress = Math.max(0, Math.min(1, remainingDays / food.shelfLifeDays));
  const color = getExpiryColor(remainingDays);
  const size = 100;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  const categoryColor = categoryColors[food.category];
  const categoryIcon = categoryIcons[food.category];

  return (
    <div
      style={{
        ...styles.card,
        animationName: isVisible ? 'fadeInUp' : 'none',
        animationDuration: '0.4s',
        animationTimingFunction: 'ease',
        animationFillMode: 'forwards',
        animationDelay: `${index * 0.1}s`,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1)' : 'scale(0.8)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
      }}
    >
      <div style={styles.cardHeader}>
        <div style={{ ...styles.categoryIcon, background: categoryColor }}>
          <span style={styles.categoryEmoji}>{categoryIcon}</span>
        </div>
        <h3 style={styles.foodName}>{food.name}</h3>
      </div>

      <div style={styles.cardBody}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={styles.svg}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#f3f4f6"
            strokeWidth={strokeWidth}
            opacity="0.5"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.5s ease' }}
          />
        </svg>
        <div style={styles.centerText}>
          <span style={{ ...styles.daysNumber, color }}>{remainingDays > 0 ? remainingDays : 0}</span>
          <span style={styles.daysLabel}>{remainingDays > 0 ? '天' : '过期'}</span>
        </div>
      </div>

      <div style={styles.quantityRow}>
        <span style={styles.quantity}>{food.quantity} {food.unit}</span>
      </div>

      <div style={styles.cardFooter}>
        <button
          onClick={() => onEdit(food)}
          style={styles.actionBtn}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = '#f3f4f6';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          }}
        >
          编辑
        </button>
        <button
          onClick={() => onDelete(food.id)}
          style={{ ...styles.actionBtn, color: '#EF4444' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = '#fef2f2';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          }}
        >
          删除
        </button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  card: {
    width: '240px',
    height: '200px',
    background: 'white',
    borderRadius: '16px',
    padding: '16px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    opacity: 0,
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '8px',
  },
  categoryIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  categoryEmoji: {
    fontSize: '18px',
  },
  foodName: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#1f2937',
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  cardBody: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  svg: {
    position: 'absolute',
  },
  centerText: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 1,
  },
  daysNumber: {
    fontSize: '28px',
    fontWeight: 700,
    lineHeight: 1,
  },
  daysLabel: {
    fontSize: '12px',
    color: '#9ca3af',
    marginTop: '2px',
  },
  quantityRow: {
    marginBottom: '8px',
  },
  quantity: {
    fontSize: '13px',
    color: '#6b7280',
  },
  cardFooter: {
    display: 'flex',
    gap: '8px',
    borderTop: '1px solid #f3f4f6',
    paddingTop: '8px',
  },
  actionBtn: {
    flex: 1,
    padding: '6px 12px',
    border: 'none',
    borderRadius: '8px',
    background: 'transparent',
    color: '#6b7280',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
};

export default FoodCard;
