import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../store';
import { InventoryItem, EventType, FlyingIngredient } from '../types';
import { eventBus } from '../eventBus';
import './InventoryPanel.css';

const InventoryPanel: React.FC = memo(function InventoryPanel() {
  const { state, dispatch } = useApp();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newIngredientName, setNewIngredientName] = useState('');
  const [newIngredientAmount, setNewIngredientAmount] = useState('');
  const [flyingIngredients, setFlyingIngredients] = useState<(FlyingIngredient & { id: string })[]>([]);
  const [highlightedItem, setHighlightedItem] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    const unregister = eventBus.on(EventType.INGREDIENT_CLICK, (data: FlyingIngredient) => {
      const panelRect = panelRef.current?.getBoundingClientRect();
      if (panelRect) {
        const targetItem = itemRefs.current.get(data.name);
        let endX = data.endX;
        let endY = data.endY;
        
        if (targetItem) {
          const targetRect = targetItem.getBoundingClientRect();
          endX = targetRect.left + targetRect.width / 2;
          endY = targetRect.top + targetRect.height / 2;
        }

        const flyingId = Date.now().toString();
        setFlyingIngredients(prev => [...prev, { ...data, id: flyingId, endX, endY }]);

        setTimeout(() => {
          dispatch({ type: 'INCREMENT_INVENTORY', payload: { name: data.name, amount: 1 } });
          setHighlightedItem(data.name);
          setTimeout(() => setHighlightedItem(null), 400);
        }, 400);

        setTimeout(() => {
          setFlyingIngredients(prev => prev.filter(f => f.id !== flyingId));
        }, 500);
      }
    });

    return unregister;
  }, [dispatch]);

  const getFreshnessColor = (item: InventoryItem) => {
    if (item.freshnessDays > 3) return '#4CAF50';
    if (item.freshnessDays >= 1) return '#FFC107';
    return '#F44336';
  };

  const handleDecrement = useCallback((id: string) => {
    dispatch({ type: 'DECREMENT_INVENTORY', payload: id });
  }, [dispatch]);

  const handleAddItem = useCallback(() => {
    if (!newIngredientName.trim() || !newIngredientAmount) return;
    
    const amount = parseInt(newIngredientAmount);
    if (isNaN(amount) || amount <= 0) return;

    const existingItem = state.inventory.find(item => item.name === newIngredientName.trim());
    if (existingItem) {
      dispatch({
        type: 'UPDATE_INVENTORY',
        payload: { id: existingItem.id, quantity: Math.min(existingItem.quantity + amount, existingItem.maxQuantity) }
      });
    } else {
      const newItem: InventoryItem = {
        id: Date.now().toString(),
        name: newIngredientName.trim(),
        quantity: amount,
        maxQuantity: Math.max(amount * 2, 10),
        freshnessDays: 5,
        lastUpdated: new Date(),
      };
      dispatch({ type: 'ADD_INVENTORY', payload: newItem });
    }

    setNewIngredientName('');
    setNewIngredientAmount('');
    setShowAddForm(false);
  }, [newIngredientName, newIngredientAmount, state.inventory, dispatch]);

  const containerVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4, staggerChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
  };

  return (
    <motion.div
      className="inventory-panel"
      ref={panelRef}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <h3 className="panel-title">🥬 食材库存</h3>
      
      <div className="inventory-list">
        <AnimatePresence mode="popLayout">
          {state.inventory.map((item) => (
            <motion.div
              key={item.id}
              ref={(el) => {
                if (el) itemRefs.current.set(item.name, el);
              }}
              className={`inventory-item ${highlightedItem === item.name ? 'highlighted' : ''}`}
              variants={itemVariants}
              layout
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.4 }}
            >
              <div 
                className="freshness-indicator" 
                style={{ backgroundColor: getFreshnessColor(item) }}
              />
              <div className="item-info">
                <span className="item-name">{item.name}</span>
                <div className="item-quantity-bar">
                  <div 
                    className="quantity-fill"
                    style={{ 
                      width: `${(item.quantity / item.maxQuantity) * 100}%`,
                      backgroundColor: getFreshnessColor(item)
                    }}
                  />
                </div>
              </div>
              <div className="item-actions">
                <span className="quantity-text">{item.quantity}/{item.maxQuantity}</span>
                <motion.button
                  className="decrement-btn"
                  onClick={() => handleDecrement(item.id)}
                  whileTap={{ scale: 0.85 }}
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.15 }}
                  disabled={item.quantity <= 0}
                >
                  −
                </motion.button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <motion.button
        className="add-item-btn"
        onClick={() => setShowAddForm(true)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
      >
        <span className="plus-icon">+</span>
        添加食材
      </motion.button>

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            className="add-form-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddForm(false)}
          >
            <motion.div
              className="add-form"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h4 className="form-title">添加新食材</h4>
              <div className="form-group">
                <label>食材名称</label>
                <input
                  type="text"
                  value={newIngredientName}
                  onChange={(e) => setNewIngredientName(e.target.value)}
                  placeholder="请输入食材名称"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>数量</label>
                <input
                  type="number"
                  value={newIngredientAmount}
                  onChange={(e) => setNewIngredientAmount(e.target.value)}
                  placeholder="请输入数量"
                  min="1"
                />
              </div>
              <div className="form-actions">
                <button 
                  className="cancel-btn"
                  onClick={() => setShowAddForm(false)}
                >
                  取消
                </button>
                <button 
                  className="confirm-btn"
                  onClick={handleAddItem}
                >
                  确认添加
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {flyingIngredients.map((flying) => (
        <motion.div
          key={flying.id}
          className="flying-ingredient"
          initial={{ x: flying.startX, y: flying.startY, scale: 1 }}
          animate={{ 
            x: flying.endX, 
            y: flying.endY, 
            scale: 0.5,
          }}
          transition={{ 
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          style={{
            left: 0,
            top: 0,
          }}
        >
          <span className="flying-name">{flying.name}</span>
          <span className="flying-icon">+1</span>
        </motion.div>
      ))}
    </motion.div>
  );
});

export default InventoryPanel;
