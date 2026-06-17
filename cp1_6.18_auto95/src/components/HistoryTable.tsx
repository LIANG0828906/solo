import React from 'react';
import { Trade } from '../services/types';
import { useTradeStore } from '../stores/useTradeStore';

const HistoryTable: React.FC = () => {
  const trades = useTradeStore((state) => state.trades);

  const sortedTrades = [...trades].sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
  };

  return (
    <div className="card-hover" style={styles.container}>
      <h3 style={styles.title}>交易历史</h3>
      <div className="table-container" style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.headerRow}>
              <th style={styles.headerCell}>时间</th>
              <th style={styles.headerCell}>类型</th>
              <th style={styles.headerCell}>股票</th>
              <th style={styles.headerCell}>数量</th>
              <th style={styles.headerCell}>价格</th>
              <th style={styles.headerCell}>盈亏</th>
            </tr>
          </thead>
          <tbody>
            {sortedTrades.length === 0 ? (
              <tr>
                <td colSpan={6} style={styles.emptyCell}>
                  暂无交易记录
                </td>
              </tr>
            ) : (
              sortedTrades.map((trade) => (
                <tr key={trade.id} style={styles.row}>
                  <td style={styles.cell}>
                    <div style={styles.timeCell}>
                      <span style={styles.timeDate}>{formatDate(trade.timestamp)}</span>
                      <span style={styles.timeTime}>{formatTime(trade.timestamp)}</span>
                    </div>
                  </td>
                  <td style={styles.cell}>
                    <span
                      style={{
                        ...styles.typeBadge,
                        backgroundColor: trade.type === 'BUY' ? 'rgba(0, 212, 170, 0.2)' : 'rgba(255, 92, 88, 0.2)',
                        color: trade.type === 'BUY' ? '#00D4AA' : '#FF5C58',
                      }}
                    >
                      {trade.type === 'BUY' ? '买入' : '卖出'}
                    </span>
                  </td>
                  <td style={styles.cell}>
                    <span style={styles.symbolText}>{trade.symbol}</span>
                  </td>
                  <td style={styles.cell}>
                    <span style={styles.quantityText}>{trade.quantity}</span>
                  </td>
                  <td style={styles.cell}>
                    <span style={styles.priceText}>¥{trade.price.toFixed(2)}</span>
                  </td>
                  <td style={styles.cell}>
                    {trade.pnl !== undefined ? (
                      <span
                        style={{
                          ...styles.pnlText,
                          color: trade.pnl >= 0 ? '#00D4AA' : '#FF5C58',
                        }}
                      >
                        {trade.pnl >= 0 ? '+' : ''}¥{trade.pnl.toFixed(2)}
                      </span>
                    ) : (
                      <span style={styles.pnlText}>-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#1E1E30',
    borderRadius: '12px',
    border: '1px solid #2A2A40',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  title: {
    color: '#E0E0E0',
    fontSize: '16px',
    fontWeight: 600,
    margin: 0,
  },
  tableContainer: {
    maxHeight: '300px',
    overflowY: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '12px',
  },
  headerRow: {
    position: 'sticky',
    top: 0,
    backgroundColor: '#121220',
  },
  headerCell: {
    color: '#888',
    textAlign: 'left',
    padding: '8px 6px',
    fontWeight: 500,
    borderBottom: '1px solid #2A2A40',
    fontSize: '11px',
  },
  row: {
    borderBottom: '1px solid #2A2A40',
  },
  cell: {
    padding: '8px 6px',
    color: '#E0E0E0',
  },
  emptyCell: {
    textAlign: 'center',
    padding: '24px',
    color: '#666',
  },
  timeCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  timeDate: {
    color: '#888',
    fontSize: '10px',
  },
  timeTime: {
    color: '#E0E0E0',
    fontSize: '12px',
    fontFamily: 'monospace',
  },
  typeBadge: {
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 600,
  },
  symbolText: {
    color: '#E0E0E0',
    fontSize: '12px',
  },
  quantityText: {
    color: '#E0E0E0',
    fontSize: '12px',
    fontFamily: 'monospace',
  },
  priceText: {
    color: '#E0E0E0',
    fontSize: '12px',
    fontFamily: 'monospace',
  },
  pnlText: {
    fontSize: '12px',
    fontWeight: 600,
    fontFamily: 'monospace',
    transition: 'color 0.2s ease',
  },
};

export default HistoryTable;
