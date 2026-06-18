import React, { memo, useMemo } from 'react';
import { motion, useTransform, useSpring } from 'framer-motion';
import { useApp } from '../store';
import { InventoryItem, Recipe, PredictionResult } from '../types';
import './PredictionPanel.css';

const PredictionPanel: React.FC = memo(function PredictionPanel() {
  const { state } = useApp();

  const prediction = useMemo(() => {
    const startTime = performance.now();
    
    const result = predictShortage(state.inventory, state.recipes);
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    if (duration > 50) {
      console.warn(`预测计算耗时 ${duration.toFixed(2)}ms，超过50ms阈值`);
    }
    
    return result;
  }, [state.inventory, state.recipes]);

  const animatedScore = useSpring(prediction.healthScore, {
    stiffness: 40,
    damping: 20,
    mass: 1,
  });

  const background = useTransform(
    animatedScore,
    [0, 50, 100],
    ['#F44336', '#FFC107', '#4CAF50']
  );

  const strokeDashoffset = useTransform(
    animatedScore,
    [0, 100],
    [188.5, 0]
  );

  return (
    <motion.div
      className="prediction-panel"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <h3 className="panel-title">📊 智能预测</h3>

      <div className="prediction-section">
        <h4 className="section-subtitle shortage-title">
          <span className="warning-icon">⚠️</span>
          未来三天可能缺货
        </h4>
        {prediction.shortageItems.length > 0 ? (
          <div className="shortage-list">
            {prediction.shortageItems.map((item, idx) => (
              <motion.div
                key={item.id}
                className="shortage-item"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <span className="blinking-dot">●</span>
                <span className="shortage-name">{item.name}</span>
                <span className="shortage-amount">仅剩 {item.quantity}</span>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="empty-message">✅ 库存充足，暂无缺货风险</p>
        )}
      </div>

      <div className="prediction-section">
        <h4 className="section-subtitle">
          <span className="purchase-icon">🛒</span>
          推荐采购清单
          <span className="purchase-count">({prediction.purchaseList.length})</span>
        </h4>
        {prediction.purchaseList.length > 0 ? (
          <div className="purchase-list">
            {prediction.purchaseList.map((item, idx) => (
              <motion.div
                key={item.name}
                className="purchase-item"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 + 0.2 }}
              >
                <span className="green-dot">●</span>
                <span className="purchase-name">{item.name}</span>
                <span className="purchase-amount">建议采购 {item.recommendedAmount}</span>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="empty-message">🎉 暂时不需要采购</p>
        )}
      </div>

      <div className="prediction-section">
        <h4 className="section-subtitle">
          <span className="health-icon">💚</span>
          库存健康度
        </h4>
        <div className="gauge-container">
          <svg viewBox="0 0 100 60" className="gauge-svg">
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#F44336" />
                <stop offset="50%" stopColor="#FFC107" />
                <stop offset="100%" stopColor="#4CAF50" />
              </linearGradient>
            </defs>
            <path
              d="M 10 55 A 40 40 0 0 1 90 55"
              fill="none"
              stroke="#E0E0E0"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <motion.path
              d="M 10 55 A 40 40 0 0 1 90 55"
              fill="none"
              stroke="url(#gaugeGradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray="188.5"
              strokeDashoffset={strokeDashoffset}
              style={{ transformOrigin: '50px 55px', transform: 'rotate(0deg)' }}
            />
          </svg>
          <div className="gauge-center">
            <motion.span className="gauge-score" style={{ color: background }}>
              {Math.round(prediction.healthScore)}
            </motion.span>
            <span className="gauge-label">分</span>
          </div>
          <div className="gauge-labels">
            <span className="gauge-label-left">危险</span>
            <span className="gauge-label-right">健康</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

function predictShortage(inventory: InventoryItem[], recipes: Recipe[]): PredictionResult {
  const usageFrequency: Record<string, number> = {};
  
  for (let i = 0; i < recipes.length; i++) {
    const recipe = recipes[i];
    for (let j = 0; j < recipe.ingredients.length; j++) {
      const ing = recipe.ingredients[j];
      usageFrequency[ing.name] = (usageFrequency[ing.name] || 0) + recipe.likes;
    }
  }

  const shortageItems: InventoryItem[] = [];
  const healthyCount = { value: 0 };
  
  for (let i = 0; i < inventory.length; i++) {
    const item = inventory[i];
    const predictedUsage = (usageFrequency[item.name] || 0) * 0.1;
    const threshold = item.maxQuantity * 0.2;
    
    if (item.quantity - predictedUsage < threshold) {
      shortageItems.push(item);
    }
    
    if (item.quantity > item.maxQuantity * 0.3 && item.freshnessDays > 1) {
      healthyCount.value++;
    }
  }

  const healthScore = inventory.length > 0 
    ? Math.round((healthyCount.value / inventory.length) * 100)
    : 0;

  return {
    shortageItems,
    purchaseList: shortageItems.map(item => ({
      name: item.name,
      recommendedAmount: Math.max(item.maxQuantity - item.quantity, 1),
    })),
    healthScore,
  };
}

export default PredictionPanel;
