import React, { useState } from 'react';
import dayjs from 'dayjs';
import { useIngredientStore } from '../stores/ingredientStore';

const IngredientPanel: React.FC = () => {
  const { ingredients, getExpiringSoon, addIngredient, removeIngredient } = useIngredientStore();
  const expiringSoon = getExpiringSoon();
  const expiringIds = new Set(expiringSoon.map((i) => i.id));
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const [newUnit, setNewUnit] = useState('g');
  const [newExpireDate, setNewExpireDate] = useState('');

  const getDaysRemaining = (expireDate: string) => {
    return dayjs(expireDate).diff(dayjs(), 'day');
  };

  const handleAdd = () => {
    if (!newName.trim() || !newQuantity) return;
    addIngredient({
      name: newName.trim(),
      quantity: Number(newQuantity),
      unit: newUnit,
      expireDate: newExpireDate || dayjs().add(7, 'day').format('YYYY-MM-DD'),
      category: '其他',
    });
    setNewName('');
    setNewQuantity('');
    setNewUnit('g');
    setNewExpireDate('');
    setShowAddForm(false);
  };

  return (
    <div
      className="ingredient-panel"
      style={{
        width: '360px',
        flexShrink: 0,
        backgroundColor: '#fff',
        borderRadius: '16px',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#333' }}>
          🥬 我的食材
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {expiringSoon.length > 0 && (
            <span
              style={{
                fontSize: '12px',
                color: '#ef4444',
                backgroundColor: '#fef2f2',
                padding: '4px 10px',
                borderRadius: '20px',
                fontWeight: 500,
              }}
            >
              {expiringSoon.length} 项即将过期
            </span>
          )}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              backgroundColor: '#4caf50',
              color: '#fff',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.2s, background-color 0.2s',
              willChange: 'transform',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1) rotate(90deg)';
              e.currentTarget.style.backgroundColor = '#43a047';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
              e.currentTarget.style.backgroundColor = '#4caf50';
            }}
          >
            +
          </button>
        </div>
      </div>

      {showAddForm && (
        <div
          style={{
            backgroundColor: '#f1f8e9',
            borderRadius: '12px',
            padding: '14px',
            marginBottom: '12px',
            animation: 'fadeIn 0.3s ease-out',
            willChange: 'transform, opacity',
          }}
        >
          <input
            placeholder="食材名称"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #c8e6c9',
              fontSize: '14px',
              marginBottom: '8px',
              outline: 'none',
              backgroundColor: '#fff',
            }}
          />
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input
              placeholder="数量"
              type="number"
              value={newQuantity}
              onChange={(e) => setNewQuantity(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #c8e6c9',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: '#fff',
              }}
            />
            <select
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value)}
              style={{
                width: '60px',
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid #c8e6c9',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: '#fff',
              }}
            >
              <option value="g">g</option>
              <option value="ml">ml</option>
              <option value="个">个</option>
            </select>
          </div>
          <input
            type="date"
            value={newExpireDate}
            onChange={(e) => setNewExpireDate(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #c8e6c9',
              fontSize: '14px',
              marginBottom: '8px',
              outline: 'none',
              backgroundColor: '#fff',
            }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleAdd}
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: '#4caf50',
                color: '#fff',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 500,
                willChange: 'transform',
                transition: 'transform 0.2s, background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#43a047';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#4caf50';
              }}
            >
              添加
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: '#e0e0e0',
                color: '#666',
                borderRadius: '8px',
                fontSize: '13px',
              }}
            >
              取消
            </button>
          </div>
        </div>
      )}

      <div
        className="ingredient-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
          overflowY: 'auto',
          flex: 1,
          paddingRight: '4px',
        }}
      >
        {ingredients.map((ingredient, index) => {
          const isExpiring = expiringIds.has(ingredient.id);
          const daysLeft = getDaysRemaining(ingredient.expireDate);

          return (
            <div
              key={ingredient.id}
              className={`ingredient-card card ${isExpiring ? 'expiring-soon' : ''}`}
              style={{
                backgroundColor: '#e8f5e9',
                padding: '14px',
                borderRadius: '12px',
                border: isExpiring ? '2px solid #ef4444' : '2px solid transparent',
                animation: isExpiring
                  ? 'pulse-border 1.5s ease-in-out infinite'
                  : `fadeIn 0.4s ease-out ${index * 0.05}s both`,
                willChange: 'transform, opacity, border-color, box-shadow',
                position: 'relative',
              }}
            >
              <button
                onClick={() => removeIngredient(ingredient.id)}
                style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  backgroundColor: 'transparent',
                  color: '#999',
                  fontSize: '14px',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  opacity: 0.5,
                  transition: 'opacity 0.2s, background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.backgroundColor = '#fef2f2';
                  e.currentTarget.style.color = '#ef4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '0.5';
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#999';
                }}
              >
                ×
              </button>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#2e7d32',
                  marginBottom: '8px',
                  paddingRight: '16px',
                }}
              >
                {ingredient.name}
              </div>
              <div
                style={{
                  fontSize: '13px',
                  color: '#558b2f',
                  marginBottom: '6px',
                }}
              >
                剩余: {ingredient.quantity}{ingredient.unit}
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: isExpiring ? '#ef4444' : '#666',
                  fontWeight: isExpiring ? 600 : 400,
                }}
              >
                {isExpiring
                  ? `还剩 ${daysLeft} 天过期`
                  : `过期: ${ingredient.expireDate.slice(5)}`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default IngredientPanel;
