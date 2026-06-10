import React, { useMemo } from 'react';
import { useLedgerStore } from '../store';
import type { Transaction } from '../types';

interface TransactionRowProps {
  tx: Transaction;
}

const TransactionRow: React.FC<TransactionRowProps> = ({ tx }) => {
  const isHighValue = tx.totalPrice > 5000;

  return (
    <div className={`transaction-row ${isHighValue ? 'high-value' : ''}`}>
      <span className="tx-time">{tx.timeStr}</span>
      <span className="tx-goods">{tx.goodsName}</span>
      <span className="tx-qty">{tx.quantity}</span>
      <span className="tx-total">{tx.totalPrice}文</span>
      <span className="tx-tax">税{tx.tax}文</span>
      <span className="tx-currency">
        {tx.currencyAmount} {tx.currency}
      </span>
    </div>
  );
};

const TransactionHistory: React.FC = () => {
  const {
    transactions,
    filters,
    setFilters,
    pagination,
    fetchTransactions,
    loading,
  } = useLedgerStore();

  const groupedByDate = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    transactions.forEach((tx) => {
      const date = new Date(tx.timestamp);
      const dateStr = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(tx);
    });
    return groups;
  }, [transactions]);

  const loadMore = () => {
    fetchTransactions(pagination.page + 1);
  };

  const hasMore = pagination.page * pagination.pageSize < pagination.total;

  return (
    <div className="transaction-history">
      <h2 className="panel-title">交易历史</h2>
      
      <div className="filter-bar">
        <input
          type="text"
          placeholder="按货物名称筛选..."
          value={filters.goodsName}
          onChange={(e) => setFilters({ goodsName: e.target.value })}
        />
        <select
          value={filters.buyerOrigin}
          onChange={(e) => setFilters({ buyerOrigin: e.target.value })}
        >
          <option value="">全部来源</option>
          <option value="波斯">波斯</option>
          <option value="大食">大食</option>
          <option value="拜占庭">拜占庭</option>
          <option value="大唐">大唐</option>
        </select>
      </div>

      <div className="transaction-list">
        {loading && transactions.length === 0 ? (
          <div className="loading">加载中...</div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
            <p>暂无交易记录</p>
          </div>
        ) : (
          Object.entries(groupedByDate).map(([date, txs]) => (
            <div key={date}>
              <div style={{
                padding: '8px 16px',
                background: '#d4a24e',
                color: '#fdf5e6',
                fontFamily: 'FangSong',
                fontSize: '14px',
                fontWeight: 'bold',
                position: 'sticky',
                top: 0,
                zIndex: 2,
              }}>
                {date}
              </div>
              {txs.map((tx) => (
                <TransactionRow key={tx.id} tx={tx} />
              ))}
            </div>
          ))
        )}
      </div>

      {hasMore && (
        <button className="load-more-btn" onClick={loadMore} disabled={loading}>
          {loading ? '加载中...' : `加载更多 (${transactions.length}/${pagination.total})`}
        </button>
      )}
    </div>
  );
};

export default TransactionHistory;
