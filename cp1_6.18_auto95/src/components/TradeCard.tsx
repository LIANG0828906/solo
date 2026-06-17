import React from 'react';
import { Position } from '../services/types';
import { useTradeStore } from '../stores/useTradeStore';

interface TradeCardProps {
  position: Position;
}

const TradeCard: React.FC<TradeCardProps> = ({ position }) => {
  const closePosition = useTradeStore((state) => state.closePosition);

  const pnl = (position.currentPrice - position.avgCost) * position.quantity;
  const pnlPercent = ((position.currentPrice - position.avgCost) / position.avgCost) * 100;
  const isProfit = pnl >= 0;

  const handleClose = () => {
    closePosition(position.id);
  };

  return (
    <div className="card-hover" style={styles.card}>
      <div style={styles.cardHeader}>
        <span style={styles.symbol}>{position.symbol}</span>
        <span style={styles.quantity}>{position.quantity} 股</span>
      </div>
      <div style={styles.priceRow}>
        <div style={styles.priceItem}>
          <span style={styles.priceLabel}>成本价</span>
          <span style={styles.priceValue}>¥{position.avgCost.toFixed(2)}</span>
        </div>
        <div style={styles.priceItem}>
          <span style={styles.priceLabel}>现价</span>
          <span style={{ ...styles.priceValue, color: isProfit ? '#00D4AA' : '#FF5C58' }}>
            ¥{position.currentPrice.toFixed(2)}
          </span>
        </div>
      </div>
      <div style={styles.pnlRow}>
        <div style={styles.pnlInfo}>
          <span style={styles.pnlLabel}>浮动盈亏</span>
          <span style={{ ...styles.pnlValue, color: isProfit ? '#00D4AA' : '#FF5C58' }}>
            {isProfit ? '+' : ''}¥{pnl.toFixed(2)}
          </span>
        </div>
        <div style={styles.pnlPercentContainer}>
          <span style={{ ...styles.pnlPercent, color: isProfit ? '#00D4AA' : '#FF5C58' }}>
            {isProfit ? '+' : ''}{pnlPercent.toFixed(2)}%
          </span>
        </div>
      </div>
      <button style={styles.closeBtn} onClick={handleClose}>
        平仓
      </button>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: '#1E1E30',
    borderRadius: '12px',
    border: '1px solid #2A2A40',
    padding: '16px',
    minWidth: '220px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  symbol: {
    color: '#E0E0E0',
    fontSize: '15px',
    fontWeight: 600,
  },
  quantity: {
    color: '#888',
    fontSize: '12px',
    backgroundColor: '#2A2A40',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  priceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
  },
  priceItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  priceLabel: {
    color: '#888',
    fontSize: '11px',
  },
  priceValue: {
    color: '#E0E0E0',
    fontSize: '16px',
    fontWeight: 600,
    fontFamily: 'monospace',
    transition: 'color 0.2s ease',
  },
  pnlRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: '8px',
    borderTop: '1px solid #2A2A40',
  },
  pnlInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  pnlLabel: {
    color: '#888',
    fontSize: '11px',
  },
  pnlValue: {
    fontSize: '18px',
    fontWeight: 700,
    fontFamily: 'monospace',
    transition: 'color 0.2s ease',
  },
  pnlPercentContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  pnlPercent: {
    fontSize: '14px',
    fontWeight: 600,
    fontFamily: 'monospace',
    transition: 'color 0.2s ease',
  },
  closeBtn: {
    width: '100%',
    padding: '8px 0',
    backgroundColor: '#FF5C58',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.2s ease',
  },
};

export default TradeCard;
