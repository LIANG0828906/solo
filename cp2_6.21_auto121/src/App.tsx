import React, { useState, useEffect } from 'react';
import { BudgetPanel } from './moduleB/uiComponents';
import {
  getBudgetState,
  subscribe,
  unsubscribe,
  type BudgetState,
} from './moduleC/budgetCalculator';
import {
  addFurniture,
  removeFurniture,
  getDesignState,
} from './moduleA/designEngine';
import { getFurnitureList, type Furniture } from './moduleD/apiService';

const App: React.FC = () => {
  const [budgetState, setBudgetState] = useState<BudgetState>(getBudgetState());
  const [furnitureList, setFurnitureList] = useState<Furniture[]>([]);

  useEffect(() => {
    const unsub = subscribe(setBudgetState);
    return () => unsubscribe(setBudgetState);
  }, []);

  useEffect(() => {
    getFurnitureList().then(setFurnitureList);
  }, []);

  const handleAddFurniture = (furniture: Furniture) => {
    addFurniture({
      furnitureId: furniture.id,
      name: furniture.name,
      category: furniture.category as any,
      x: Math.random() * 100,
      y: Math.random() * 100,
      scale: 1,
      rotation: 0,
    });
  };

  const handleRemoveFurniture = (id: string) => {
    removeFurniture(id);
  };

  const designState = getDesignState();

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div
        style={{
          width: '320px',
          backgroundColor: '#f5f5f5',
          padding: '16px',
          overflowY: 'auto',
        }}
      >
        <h2>家具库</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          {furnitureList.map((f) => (
            <button
              key={f.id}
              onClick={() => handleAddFurniture(f)}
              style={{
                padding: '8px',
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '1px solid #dfe6e9',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: '24px' }}>{f.icon}</div>
              <div style={{ fontSize: '12px' }}>{f.name}</div>
              <div style={{ fontSize: '12px', color: '#FF6B6B' }}>
                ¥{f.price}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            flex: 1,
            backgroundColor: '#e8e8e8',
            padding: '16px',
            overflowY: 'auto',
          }}
        >
          <h2>已放置家具</h2>
          {designState.placedFurniture.length === 0 ? (
            <p style={{ color: '#636e72' }}>从左侧拖拽家具到此处</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {designState.placedFurniture.map((f) => (
                <div
                  key={f.id}
                  style={{
                    padding: '8px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    border: '1px solid #dfe6e9',
                  }}
                >
                  <div>{f.name}</div>
                  <button
                    onClick={() => handleRemoveFurniture(f.id)}
                    style={{
                      marginTop: '4px',
                      padding: '4px 8px',
                      backgroundColor: '#FF6B6B',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    删除
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: '16px' }}>
          <BudgetPanel budgetState={budgetState} />
        </div>
      </div>
    </div>
  );
};

export default App;
