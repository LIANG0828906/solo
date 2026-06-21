import React from 'react';
import type { BudgetState } from '../moduleC/budgetCalculator';

interface BudgetPanelProps {
  budgetState: BudgetState;
}

export const BudgetPanel: React.FC<BudgetPanelProps> = ({ budgetState }) => {
  const { groups, total, isLoading } = budgetState;

  return (
    <div className="budget-panel" style={{
      height: '180px',
      overflowY: 'auto',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      padding: '16px',
    }}>
      <h3 style={{ marginBottom: '12px', color: '#2d3436', fontSize: '16px' }}>
        预算清单
      </h3>
      {isLoading && (
        <div style={{ color: '#636e72', textAlign: 'center', padding: '20px' }}>
          计算中...
        </div>
      )}
      {!isLoading && groups.length === 0 && (
        <div style={{ color: '#b2bec3', textAlign: 'center', padding: '20px' }}>
          暂无家具，请从左侧拖拽添加
        </div>
      )}
      {groups.map((group) => (
        <div key={group.category} style={{ marginBottom: '12px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '8px',
            borderBottom: '1px solid #dfe6e9',
            marginBottom: '8px',
          }}>
            <span style={{ fontWeight: 600, color: '#2d3436' }}>
              {group.label}
            </span>
            <span
              className="animated-number"
              data-target={group.subtotal}
              style={{ fontWeight: 600, color: '#2d3436' }}
            >
              ¥{group.subtotal.toLocaleString()}
            </span>
          </div>
          {group.items.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '4px 0',
                fontSize: '14px',
                color: '#636e72',
              }}
            >
              <span>{item.name}</span>
              <span>¥{item.price.toLocaleString()}</span>
            </div>
          ))}
        </div>
      ))}
      {!isLoading && groups.length > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '12px',
          borderTop: '2px solid #dfe6e9',
          marginTop: '12px',
        }}>
          <span style={{ fontWeight: 700, fontSize: '18px', color: '#2d3436' }}>
            总计
          </span>
          <span
            className="animated-number"
            data-target={total}
            style={{
              fontWeight: 700,
              fontSize: '20px',
              color: '#FF6B6B',
            }}
          >
            ¥{total.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
};

type BudgetStateSubscriber = (state: BudgetState) => void;

const budgetSubscribers: Set<BudgetStateSubscriber> = new Set();

export const subscribeBudget = (
  callback: BudgetStateSubscriber,
): (() => void) => {
  budgetSubscribers.add(callback);
  return () => budgetSubscribers.delete(callback);
};

export const unsubscribeBudget = (callback: BudgetStateSubscriber): void => {
  budgetSubscribers.delete(callback);
};

export const notifyBudgetUpdate = (state: BudgetState): void => {
  budgetSubscribers.forEach((cb) => cb(state));
};
