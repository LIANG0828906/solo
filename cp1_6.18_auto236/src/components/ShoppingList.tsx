import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

interface ShoppingItem {
  name: string;
  isOwned: boolean;
  quantity: string;
}

const ShoppingList: React.FC = () => {
  const { isShoppingListOpen, closeShoppingList, shoppingListRecipe } = useAppStore();
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [showSyncTip, setShowSyncTip] = useState(false);

  useEffect(() => {
    setCheckedItems(new Set());
    setShowSyncTip(false);
  }, [shoppingListRecipe]);

  if (!shoppingListRecipe) return null;

  const allItems: ShoppingItem[] = [
    ...shoppingListRecipe.existingIngredients.map((name) => ({
      name,
      isOwned: true,
      quantity: '适量',
    })),
    ...shoppingListRecipe.missingIngredients.map((name) => ({
      name,
      isOwned: false,
      quantity: '适量',
    })),
  ];

  const handleToggleCheck = (name: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(name)) {
      newChecked.delete(name);
    } else {
      newChecked.add(name);
    }
    setCheckedItems(newChecked);

    const missingItems = shoppingListRecipe.missingIngredients;
    const allMissingChecked = missingItems.every((item) => newChecked.has(item));
    if (allMissingChecked && missingItems.length > 0) {
      setShowSyncTip(true);
      setTimeout(() => setShowSyncTip(false), 2000);
    }
  };

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: isShoppingListOpen ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0)',
          transition: 'background-color 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: isShoppingListOpen ? 'auto' : 'none',
          zIndex: 999,
        }}
        onClick={closeShoppingList}
      />

      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '350px',
          height: '100vh',
          backgroundColor: '#fff',
          borderLeft: '4px solid #FF6B6B',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
          transform: isShoppingListOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
        }}
        className="shopping-panel"
      >
        <div
          style={{
            padding: '24px',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h3
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#333',
              margin: 0,
            }}
          >
            🛒 {shoppingListRecipe.name}
          </h3>
          <button
            onClick={closeShoppingList}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: '#f5f5f5',
              cursor: 'pointer',
              fontSize: '18px',
              color: '#666',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#FF6B6B';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
              e.currentTarget.style.color = '#666';
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 24px',
          }}
        >
          <p style={{ fontSize: '13px', color: '#999', marginBottom: '16px' }}>
            勾选已采购的食材
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {allItems.map((item) => (
              <div
                key={item.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  backgroundColor: '#FAFAFA',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f0f0f0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FAFAFA';
                }}
              >
                <button
                  onClick={() => handleToggleCheck(item.name)}
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: `2px solid ${checkedItems.has(item.name) ? '#6BCB77' : '#CCC'}`,
                    backgroundColor: checkedItems.has(item.name) ? '#6BCB77' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                    padding: 0,
                    flexShrink: 0,
                  }}
                >
                  {checkedItems.has(item.name) && (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="3"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>

                <span
                  style={{
                    flex: 1,
                    fontSize: '14px',
                    fontWeight: 500,
                    color: item.isOwned ? '#6BCB77' : '#FF6B6B',
                    textDecoration: checkedItems.has(item.name) ? 'line-through' : 'none',
                    opacity: checkedItems.has(item.name) ? 0.6 : 1,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {item.name}
                  {item.isOwned && ' ✓'}
                </span>

                <span
                  style={{
                    fontSize: '12px',
                    color: '#999',
                  }}
                >
                  {item.quantity}
                </span>
              </div>
            ))}
          </div>
        </div>

        {showSyncTip && (
          <div
            style={{
              position: 'absolute',
              bottom: '80px',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '10px 20px',
              backgroundColor: '#6BCB77',
              color: '#fff',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: 500,
              boxShadow: '0 4px 12px rgba(107, 203, 119, 0.4)',
              animation: 'fadeIn 0.3s ease',
              whiteSpace: 'nowrap',
            }}
          >
            ✓ 已同步至购物车
          </div>
        )}

        <div
          style={{
            padding: '20px 24px',
            borderTop: '1px solid #f0f0f0',
          }}
        >
          <button
            onClick={closeShoppingList}
            style={{
              width: '100%',
              height: '44px',
              borderRadius: '22px',
              border: 'none',
              backgroundColor: '#FF6B6B',
              color: '#fff',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 0.2s ease, transform 0.2s ease',
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translateY(2px)';
              e.currentTarget.style.backgroundColor = '#E55A5A';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.backgroundColor = '#FF6B6B';
            }}
          >
            完成
          </button>
        </div>
      </div>
    </>
  );
};

export default ShoppingList;
