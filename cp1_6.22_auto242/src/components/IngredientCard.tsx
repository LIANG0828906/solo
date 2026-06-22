import React from 'react';
import type { Ingredient, StockStatus } from '../types';
import { STOCK_COLORS } from '../types';

interface IngredientCardProps {
  ingredient: Ingredient;
  onClick?: () => void;
}

function getStockStatus(stock: number): StockStatus {
  if (stock <= 0) return '缺货';
  if (stock < 20) return '低库存';
  return '充足';
}

const IngredientCard: React.FC<IngredientCardProps> = ({ ingredient, onClick }) => {
  const stockStatus = getStockStatus(ingredient.stock);
  const stockColor = STOCK_COLORS[stockStatus];

  return (
    <div 
      className="ingredient-card"
      onClick={onClick}
      style={{
        width: '280px',
        background: '#FDFBF7',
        border: '1px solid #E0D6C8',
        borderRadius: '8px',
        padding: '16px',
        display: 'flex',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s ease-out, box-shadow 0.2s ease-out',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(60,36,21,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '4px',
          backgroundColor: stockColor,
        }}
      />
      
      <div style={{ flex: 1, paddingLeft: '8px' }}>
        <div style={{ 
          fontSize: '16px', 
          fontWeight: 600, 
          color: '#3C2415',
          marginBottom: '4px',
          fontFamily: "'Playfair Display', 'Noto Serif SC', serif",
        }}>
          {ingredient.name}
        </div>
        <div style={{ 
          fontSize: '12px', 
          color: '#8B7355', 
          marginBottom: '12px',
          fontFamily: "'Inter', sans-serif",
        }}>
          {ingredient.brand} · {ingredient.family}
        </div>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          fontSize: '13px',
          fontFamily: "'Inter', sans-serif",
        }}>
          <div>
            <span style={{ color: '#8B7355' }}>库存：</span>
            <span style={{ 
              color: stockColor, 
              fontWeight: 600,
            }}>
              {ingredient.stock} {ingredient.unit}
            </span>
          </div>
          <div style={{ color: '#3C2415', fontWeight: 500 }}>
            ¥{ingredient.cost}/{ingredient.unit}
          </div>
        </div>
        
        <div style={{ 
          marginTop: '8px', 
          fontSize: '11px', 
          color: '#A6967C',
          fontFamily: "'Inter', sans-serif",
        }}>
          供应商：{ingredient.supplier}
        </div>
      </div>
    </div>
  );
};

export default IngredientCard;
