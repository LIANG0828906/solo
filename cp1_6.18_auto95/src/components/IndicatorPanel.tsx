import React from 'react';
import { CandleData } from '../services/types';
import { getMAIndicatorResult } from '../indicators/movingAverage';
import { getRSIIndicatorResult } from '../indicators/rsi';
import { getBollingerIndicatorResult } from '../indicators/bollinger';

interface IndicatorPanelProps {
  candles: CandleData[];
}

const IndicatorPanel: React.FC<IndicatorPanelProps> = ({ candles }) => {
  const maResult = getMAIndicatorResult(candles);
  const rsiResult = getRSIIndicatorResult(candles);
  const bollingerResult = getBollingerIndicatorResult(candles);

  const maValue = maResult.value as Record<string, number>;
  const rsiValue = rsiResult.value as number;
  const bollingerValue = bollingerResult.value as Record<string, number>;

  const isOverbought = rsiValue > 70;
  const isOversold = rsiValue < 30;

  const getSignalBadge = (signal: string) => {
    let bgColor = '#444';
    let color = '#E0E0E0';
    let text = '持有';

    if (signal === 'BUY') {
      bgColor = 'rgba(0, 212, 170, 0.2)';
      color = '#00D4AA';
      text = '买入';
    } else if (signal === 'SELL') {
      bgColor = 'rgba(255, 92, 88, 0.2)';
      color = '#FF5C58';
      text = '卖出';
    }

    return (
      <span style={{ ...styles.signalBadge, backgroundColor: bgColor, color }}>
        {text}
      </span>
    );
  };

  return (
    <div className="card-hover" style={styles.panel}>
      <h3 style={styles.title}>技术指标</h3>
      <div style={styles.cardsContainer}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>移动平均线</span>
            {getSignalBadge(maResult.signal)}
          </div>
          <div style={styles.maValues}>
            <div style={styles.maItem}>
              <span style={styles.maLabel}>MA5</span>
              <span style={styles.maValue}>{maValue.ma5?.toFixed(2) || '--'}</span>
            </div>
            <div style={styles.maCrossover}>
              {maValue.ma5 > maValue.ma20 ? (
                <span style={styles.crossoverUp}>↑ 金叉</span>
              ) : maValue.ma5 < maValue.ma20 ? (
                <span style={styles.crossoverDown}>↓ 死叉</span>
              ) : (
                <span style={styles.crossoverNeutral}>— 持平</span>
              )}
            </div>
            <div style={styles.maItem}>
              <span style={styles.maLabel}>MA20</span>
              <span style={styles.maValue}>{maValue.ma20?.toFixed(2) || '--'}</span>
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>RSI (14)</span>
            {getSignalBadge(rsiResult.signal)}
          </div>
          <div style={styles.rsiContainer}>
            <div
              style={{
                ...styles.rsiBarBg,
                backgroundColor: isOverbought ? 'rgba(255, 92, 88, 0.3)' : isOversold ? 'rgba(0, 212, 170, 0.3)' : '#2A2A40',
                transition: 'background-color 0.2s ease',
              }}
            >
              <div
                style={{
                  ...styles.rsiBarFill,
                  width: `${Math.min(Math.max(rsiValue, 0), 100)}%`,
                  backgroundColor: isOverbought ? '#FF5C58' : isOversold ? '#00D4AA' : '#6366F1',
                  transition: 'width 0.2s ease, background-color 0.2s ease',
                }}
              />
            </div>
            <div style={styles.rsiValueRow}>
              <span style={styles.rsiValue}>{rsiValue.toFixed(1)}</span>
              <span style={styles.rsiLabel}>0</span>
              <span style={styles.rsiMidLabel}>50</span>
              <span style={styles.rsiLabel}>100</span>
            </div>
          </div>
          <div style={styles.rsiZones}>
            <span style={{ ...styles.zoneLabel, color: '#00D4AA' }}>超卖 30</span>
            <span style={{ ...styles.zoneLabel, color: '#FF5C58' }}>超买 70</span>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>布林带</span>
            {getSignalBadge(bollingerResult.signal)}
          </div>
          <div style={styles.bollingerContainer}>
            <div style={styles.bollingerBarBg}>
              <div
                style={{
                  ...styles.bollingerBarFill,
                  left: `${Math.min(Math.max(bollingerValue.positionPercent, 0), 100)}%`,
                  transition: 'left 0.2s ease',
                }}
              />
            </div>
            <div style={styles.bollingerValues}>
              <div style={styles.bollingerRow}>
                <span style={styles.bollingerLabel}>上轨</span>
                <span style={styles.bollingerPrice}>{bollingerValue.upper?.toFixed(2) || '--'}</span>
              </div>
              <div style={styles.bollingerRow}>
                <span style={styles.bollingerLabel}>中轨</span>
                <span style={styles.bollingerPrice}>{bollingerValue.middle?.toFixed(2) || '--'}</span>
              </div>
              <div style={styles.bollingerRow}>
                <span style={styles.bollingerLabel}>下轨</span>
                <span style={styles.bollingerPrice}>{bollingerValue.lower?.toFixed(2) || '--'}</span>
              </div>
              <div style={styles.bollingerRow}>
                <span style={styles.bollingerLabel}>带宽</span>
                <span style={styles.bollingerPrice}>
                  {bollingerValue.bandwidth ? ((bollingerValue.bandwidth / bollingerValue.middle) * 100).toFixed(2) + '%' : '--'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  panel: {
    backgroundColor: '#1E1E30',
    borderRadius: '12px',
    border: '1px solid #2A2A40',
    padding: '16px',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  title: {
    color: '#E0E0E0',
    fontSize: '16px',
    fontWeight: 600,
    margin: 0,
    marginBottom: '12px',
  },
  cardsContainer: {
    display: 'flex',
    flexDirection: 'row',
    gap: '12px',
    flexWrap: 'wrap',
  },
  card: {
    flex: '1 1 100%',
    backgroundColor: '#121220',
    borderRadius: '8px',
    padding: '12px',
    border: '1px solid #2A2A40',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  cardTitle: {
    color: '#E0E0E0',
    fontSize: '13px',
    fontWeight: 500,
  },
  signalBadge: {
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 600,
    transition: 'background-color 0.2s ease, color 0.2s ease',
  },
  maValues: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  maItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  maLabel: {
    color: '#888',
    fontSize: '12px',
  },
  maValue: {
    color: '#E0E0E0',
    fontSize: '13px',
    fontWeight: 600,
    fontFamily: 'monospace',
  },
  maCrossover: {
    display: 'flex',
    justifyContent: 'center',
    padding: '4px 0',
  },
  crossoverUp: {
    color: '#00D4AA',
    fontSize: '12px',
    fontWeight: 600,
  },
  crossoverDown: {
    color: '#FF5C58',
    fontSize: '12px',
    fontWeight: 600,
  },
  crossoverNeutral: {
    color: '#888',
    fontSize: '12px',
    fontWeight: 600,
  },
  rsiContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  rsiBarBg: {
    height: '8px',
    borderRadius: '4px',
    overflow: 'hidden',
    transition: 'background-color 0.2s ease',
  },
  rsiBarFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.2s ease, background-color 0.2s ease',
  },
  rsiValueRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
  },
  rsiValue: {
    color: '#E0E0E0',
    fontSize: '16px',
    fontWeight: 700,
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
  },
  rsiLabel: {
    color: '#666',
    fontSize: '10px',
  },
  rsiMidLabel: {
    color: '#444',
    fontSize: '10px',
  },
  rsiZones: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '4px',
  },
  zoneLabel: {
    fontSize: '10px',
  },
  bollingerContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  bollingerBarBg: {
    height: '6px',
    borderRadius: '3px',
    backgroundColor: '#2A2A40',
    position: 'relative',
    overflow: 'visible',
  },
  bollingerBarFill: {
    position: 'absolute',
    top: '50%',
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: '#6366F1',
    transform: 'translate(-50%, -50%)',
    transition: 'left 0.2s ease',
  },
  bollingerValues: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  bollingerRow: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  bollingerLabel: {
    color: '#888',
    fontSize: '11px',
  },
  bollingerPrice: {
    color: '#E0E0E0',
    fontSize: '11px',
    fontFamily: 'monospace',
  },
};

export default IndicatorPanel;
